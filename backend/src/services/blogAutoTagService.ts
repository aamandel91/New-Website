import { injectable } from 'tsyringe'
import { Anthropic } from '@anthropic-ai/sdk'
import {
  activeCities,
  activeCounties,
  activeNeighborhoods,
  slugify
} from '../config/activeMarkets.js'
import { getMarketContext } from '../utils/aiPromptContext.js'

/**
 * AI auto-tagging (Track 3 of the SEO internal-linking initiative).
 *
 * Tag flattening strategy
 * -----------------------
 * Track 2's RelatedBlogPostsService scores blogs by checking whether a tag
 * preference (e.g. "fort-lauderdale", "boca-raton-condos") appears in the
 * blog's `tags[]` array as an un-prefixed slug. To keep Track 2 working
 * without changes, we flatten the structured AI output into `tags[]` as
 * follows:
 *
 *   - cities, counties, neighborhoods, topics  -> un-prefixed slug
 *     (e.g. "fort-lauderdale", "miami-dade", "waterfront", "luxury")
 *   - audience, seasonality                    -> prefixed slug
 *     (e.g. "audience:luxury-buyer", "season:winter")
 *
 * Audience/seasonality are prefixed because their values ("luxury-buyer",
 * "winter") could collide with topic-like words and they aren't useful to
 * the listings related-reading matcher anyway. RelatedBlogPostsService
 * harmlessly ignores any tag that doesn't match a preference, so prefixed
 * tags coexist cleanly with bare geo/topic slugs.
 *
 * The full structured output is also persisted to `blogs.suggested_tags`
 * (jsonb) for the admin UI and for re-runs that need to know what the AI
 * proposed before any admin pruning.
 */

export const TOPIC_ENUM = [
  'buying',
  'selling',
  'investing',
  'luxury',
  'waterfront',
  'condos',
  'single-family',
  'new-construction',
  'schools',
  'market-update',
  'first-time-buyer',
  'relocation',
  'taxes',
  'insurance',
  'hoa',
  'mortgage',
  'design',
  'lifestyle'
] as const

export const AUDIENCE_ENUM = [
  'first-time-buyer',
  'investor',
  'luxury-buyer',
  'seller',
  'relocator',
  'snowbird',
  'downsizer'
] as const

export const SEASONALITY_ENUM = [
  'year-round',
  'winter',
  'spring',
  'summer',
  'fall',
  'hurricane-season',
  'season-2026'
] as const

export type Topic = (typeof TOPIC_ENUM)[number]
export type Audience = (typeof AUDIENCE_ENUM)[number]
export type Seasonality = (typeof SEASONALITY_ENUM)[number]

export interface StructuredSuggestion {
  cities: string[]
  neighborhoods: string[]
  counties: string[]
  topics: Topic[]
  audience: Audience[]
  seasonality: Seasonality[]
  reasoning?: string
}

export interface AutoTagResult {
  /** Structured suggestion grouped by dimension (slugs). */
  structured: StructuredSuggestion
  /** Flat tags[] ready to write to `blogs.tags` (mix of bare + prefixed). */
  flatTags: string[]
  /** Metadata about this run. */
  meta: {
    model: string
    ran_at: string
    input_tokens: number
    output_tokens: number
    truncated: boolean
    input_size_bytes: number
    /** True if the call hit the API and returned a valid structured payload. */
    ok: boolean
    /** Error string if !ok. Never throws. */
    error?: string
  }
}

export interface AutoTagInput {
  title: string
  content: string
  excerpt?: string
  /** Tags the admin has explicitly rejected on prior runs; passed to the model
   *  as a "never suggest these" constraint so reruns don't re-propose them. */
  rejected?: string[]
}

const MAX_INPUT_BYTES = 50 * 1024
const DEFAULT_MODEL = 'claude-haiku-4-5'

@injectable()
export class BlogAutoTagService {
  private anthropic: Anthropic
  private cityBySlug: Map<string, { name: string; county: string }>
  private countyBySlug: Map<string, string>
  private neighborhoodBySlug: Map<string, string>

  constructor() {
    this.anthropic = new Anthropic({ apiKey: process.env['ANTHROPIC_API_KEY'] || '' })

    this.cityBySlug = new Map(
      activeCities.map(c => [slugify(c.name), { name: c.name, county: c.county }])
    )
    this.countyBySlug = new Map(activeCounties.map(c => [slugify(c), c]))
    this.neighborhoodBySlug = new Map(activeNeighborhoods.map(n => [slugify(n), n]))
  }

  /** Returns true if the global kill switch is OFF. */
  isEnabled(): boolean {
    const flag = (process.env['BLOG_AUTOTAG_ENABLED'] || 'true').toLowerCase()
    return flag !== 'false' && flag !== '0' && flag !== 'no'
  }

  getModel(): string {
    return process.env['ANTHROPIC_BLOG_TAG_MODEL'] || DEFAULT_MODEL
  }

  /**
   * Generate AI-suggested tags for a blog post. Never throws.
   * Returns an empty structured result on any failure (API error, invalid
   * output, kill switch, missing API key).
   */
  async suggest(input: AutoTagInput): Promise<AutoTagResult> {
    const ran_at = new Date().toISOString()
    const model = this.getModel()
    const empty: StructuredSuggestion = {
      cities: [],
      neighborhoods: [],
      counties: [],
      topics: [],
      audience: [],
      seasonality: []
    }

    if (!this.isEnabled()) {
      return {
        structured: empty,
        flatTags: [],
        meta: {
          model,
          ran_at,
          input_tokens: 0,
          output_tokens: 0,
          truncated: false,
          input_size_bytes: 0,
          ok: false,
          error: 'BLOG_AUTOTAG_ENABLED=false'
        }
      }
    }

    if (!process.env['ANTHROPIC_API_KEY']) {
      return {
        structured: empty,
        flatTags: [],
        meta: {
          model,
          ran_at,
          input_tokens: 0,
          output_tokens: 0,
          truncated: false,
          input_size_bytes: 0,
          ok: false,
          error: 'ANTHROPIC_API_KEY not set'
        }
      }
    }

    // Cost guard: truncate input to 50KB before sending.
    const rawContent = [input.excerpt ?? '', input.content].filter(Boolean).join('\n\n')
    const originalSize = Buffer.byteLength(rawContent, 'utf-8')
    const truncated = originalSize > MAX_INPUT_BYTES
    const content = truncated ? rawContent.slice(0, MAX_INPUT_BYTES) : rawContent

    try {
      const response = await this.anthropic.messages.create({
        model,
        max_tokens: 1024,
        system: getMarketContext('south-florida'),
        tools: [this.tagTool()],
        tool_choice: { type: 'tool', name: 'emit_tags' },
        messages: [
          {
            role: 'user',
            content: this.buildPrompt(input.title, content, input.rejected)
          }
        ]
      })

      console.log('[blogAutoTagService] tokens', {
        model,
        input: response.usage.input_tokens,
        output: response.usage.output_tokens,
        truncated
      })

      const toolBlock = response.content.find(b => b.type === 'tool_use') as
        | { type: 'tool_use'; input: unknown }
        | undefined
      if (!toolBlock) {
        return {
          structured: empty,
          flatTags: [],
          meta: {
            model,
            ran_at,
            input_tokens: response.usage.input_tokens,
            output_tokens: response.usage.output_tokens,
            truncated,
            input_size_bytes: originalSize,
            ok: false,
            error: 'Model did not call emit_tags tool'
          }
        }
      }

      const validated = this.validate(toolBlock.input)
      validated.cities = validated.cities.filter(s => !(input.rejected ?? []).includes(s))
      validated.neighborhoods = validated.neighborhoods.filter(
        s => !(input.rejected ?? []).includes(s)
      )
      validated.counties = validated.counties.filter(s => !(input.rejected ?? []).includes(s))
      validated.topics = validated.topics.filter(
        s => !(input.rejected ?? []).includes(s)
      ) as Topic[]
      validated.audience = validated.audience.filter(
        s => !(input.rejected ?? []).includes(`audience:${s}`)
      ) as Audience[]
      validated.seasonality = validated.seasonality.filter(
        s => !(input.rejected ?? []).includes(`season:${s}`)
      ) as Seasonality[]

      return {
        structured: validated,
        flatTags: this.flatten(validated),
        meta: {
          model,
          ran_at,
          input_tokens: response.usage.input_tokens,
          output_tokens: response.usage.output_tokens,
          truncated,
          input_size_bytes: originalSize,
          ok: true
        }
      }
    } catch (err) {
      console.error('[blogAutoTagService] error', err)
      return {
        structured: empty,
        flatTags: [],
        meta: {
          model,
          ran_at,
          input_tokens: 0,
          output_tokens: 0,
          truncated,
          input_size_bytes: originalSize,
          ok: false,
          error: err instanceof Error ? err.message : String(err)
        }
      }
    }
  }

  /**
   * Validate and normalize raw model output against the allow-lists.
   * Pure function: no I/O, easy to unit test. Exposed for tests.
   */
  validate(raw: unknown): StructuredSuggestion {
    const r = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>
    const cities = this.filterCities(this.asStringArray(r['cities']))
    const neighborhoods = this.filterNeighborhoods(this.asStringArray(r['neighborhoods']))
    const counties = this.filterCounties(this.asStringArray(r['counties']))
    const topics = this.asStringArray(r['topics'])
      .map(t => slugify(t))
      .filter((t): t is Topic => (TOPIC_ENUM as readonly string[]).includes(t))
    const audience = this.asStringArray(r['audience'])
      .map(t => slugify(t))
      .filter((t): t is Audience => (AUDIENCE_ENUM as readonly string[]).includes(t))
    const seasonality = this.asStringArray(r['seasonality'])
      .map(t => slugify(t))
      .filter((t): t is Seasonality => (SEASONALITY_ENUM as readonly string[]).includes(t))

    const out: StructuredSuggestion = {
      cities: dedupe(cities),
      neighborhoods: dedupe(neighborhoods),
      counties: dedupe(counties),
      topics: dedupe(topics) as Topic[],
      audience: dedupe(audience) as Audience[],
      seasonality: dedupe(seasonality) as Seasonality[]
    }
    if (typeof r['reasoning'] === 'string') {
      out.reasoning = (r['reasoning'] as string).slice(0, 500)
    }
    return out
  }

  /**
   * Flatten structured output into the existing tags[] convention. Geographic
   * + topic tags are bare slugs so RelatedBlogPostsService's matcher works
   * unchanged; audience and seasonality are namespaced. See top-of-file docs.
   * Exposed for tests.
   */
  flatten(s: StructuredSuggestion): string[] {
    const flat = [
      ...s.cities,
      ...s.neighborhoods,
      ...s.counties,
      ...s.topics,
      ...s.audience.map(a => `audience:${a}`),
      ...s.seasonality.map(a => `season:${a}`)
    ]
    return dedupe(flat)
  }

  private filterCities(values: string[]): string[] {
    return values
      .map(v => slugify(v))
      .filter(v => this.cityBySlug.has(v))
  }

  private filterNeighborhoods(values: string[]): string[] {
    return values
      .map(v => slugify(v))
      .filter(v => this.neighborhoodBySlug.has(v))
  }

  private filterCounties(values: string[]): string[] {
    return values
      .map(v => slugify(v))
      .filter(v => this.countyBySlug.has(v))
  }

  private asStringArray(x: unknown): string[] {
    if (!Array.isArray(x)) return []
    return x.filter((v): v is string => typeof v === 'string')
  }

  private buildPrompt(title: string, content: string, rejected: string[] | undefined): string {
    const cityList = activeCities.map(c => slugify(c.name)).join(', ')
    const countyList = activeCounties.map(c => slugify(c)).join(', ')
    const neighborhoodList = activeNeighborhoods.map(n => slugify(n)).join(', ') || '(none defined)'
    const rejectedClause = rejected && rejected.length > 0
      ? `\n\nAn admin has previously REJECTED the following tags for this post. DO NOT suggest any of them again: ${rejected.join(', ')}`
      : ''

    return `Tag the following blog post for a South Florida real-estate site.

Use the emit_tags tool to return tags grouped by dimension. Strict rules:

CITIES — only from this allow-list (slug form). Pick only cities the post is genuinely about (the post mentions them by name or clearly discusses them):
${cityList}

COUNTIES — only from this allow-list (slug form):
${countyList}

NEIGHBORHOODS — only from this allow-list:
${neighborhoodList}

TOPICS — only from this enum (slug form):
${TOPIC_ENUM.join(', ')}

AUDIENCE — only from this enum:
${AUDIENCE_ENUM.join(', ')}

SEASONALITY — only from this enum:
${SEASONALITY_ENUM.join(', ')}

General rules:
- Be CONSERVATIVE. Only tag dimensions the post is actually about. Empty arrays are fine.
- Cap each dimension at 6 items.
- Never invent a city, county, neighborhood, or topic outside the allow-lists.
- Provide a one-sentence "reasoning" field explaining your geographic and topic picks.${rejectedClause}

Blog title: ${title}

Blog content:
${content}`
  }

  private tagTool() {
    return {
      name: 'emit_tags',
      description:
        'Emit SEO tags for the blog post, grouped by dimension. All values must come from the provided allow-lists.',
      input_schema: {
        type: 'object' as const,
        properties: {
          cities: {
            type: 'array',
            items: { type: 'string' },
            description: 'City slugs from the allow-list, max 6.'
          },
          neighborhoods: {
            type: 'array',
            items: { type: 'string' },
            description: 'Neighborhood slugs from the allow-list, max 6.'
          },
          counties: {
            type: 'array',
            items: { type: 'string' },
            description: 'County slugs from the allow-list, max 6.'
          },
          topics: {
            type: 'array',
            items: { type: 'string', enum: [...TOPIC_ENUM] },
            description: 'Topic enum values, max 6.'
          },
          audience: {
            type: 'array',
            items: { type: 'string', enum: [...AUDIENCE_ENUM] },
            description: 'Audience enum values, max 6.'
          },
          seasonality: {
            type: 'array',
            items: { type: 'string', enum: [...SEASONALITY_ENUM] },
            description: 'Seasonality enum values, max 6.'
          },
          reasoning: {
            type: 'string',
            description: 'One-sentence rationale for the chosen tags.'
          }
        },
        required: ['cities', 'neighborhoods', 'counties', 'topics', 'audience', 'seasonality']
      }
    }
  }
}

function dedupe<T>(arr: T[]): T[] {
  return Array.from(new Set(arr))
}
