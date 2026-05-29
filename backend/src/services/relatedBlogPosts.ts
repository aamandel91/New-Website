import { injectable, inject } from 'tsyringe'
import { BlogRepository } from '../repository/blogs.js'
import type { Blog } from '../types/blog.js'

export type RelatedPageType =
  | 'city'
  | 'city_subtype'
  | 'neighborhood'
  | 'zip'
  | 'property_type'
  | 'search'

export interface RelatedFetchOpts {
  pageType: RelatedPageType
  city?: string
  citySlug?: string
  subtype?: string
  neighborhood?: string
  zip?: string
  county?: string
  countySlug?: string
  propertyType?: string
  limit?: number
}

export interface BlogPostSummary {
  id: string
  slug: string
  title: string
  description: string
  featured_image_url: string | null
  tags: string[]
  published_at: Date | null
  score: number
}

const CACHE_TTL_MS = 60 * 60 * 1000

function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
}

/**
 * Build a tag preference list from page-context options, ordered by specificity.
 * Earliest entries score highest.
 */
function buildPreferenceList(opts: RelatedFetchOpts): { tag: string; weight: number }[] {
  const prefs: { tag: string; weight: number }[] = []
  const city = opts.citySlug || (opts.city ? slugify(opts.city) : undefined)
  const subtype = opts.subtype ? slugify(opts.subtype) : undefined
  const propertyType = opts.propertyType ? slugify(opts.propertyType) : undefined
  const neighborhood = opts.neighborhood ? slugify(opts.neighborhood) : undefined
  const zip = opts.zip
  const county = opts.countySlug || (opts.county ? slugify(opts.county) : undefined)

  // Highest specificity: city + subtype joint
  if (city && subtype) prefs.push({ tag: `${city}-${subtype}`, weight: 100 })
  if (city && propertyType) prefs.push({ tag: `${city}-${propertyType}`, weight: 100 })

  // Neighborhood (rare but very specific)
  if (neighborhood) prefs.push({ tag: neighborhood, weight: 90 })

  // ZIP
  if (zip) prefs.push({ tag: zip, weight: 80 })

  // City alone
  if (city) prefs.push({ tag: city, weight: 60 })

  // Subtype / property type alone
  if (subtype) prefs.push({ tag: subtype, weight: 50 })
  if (propertyType && propertyType !== subtype) {
    prefs.push({ tag: propertyType, weight: 50 })
  }

  // County (broader geographic)
  if (county) prefs.push({ tag: county, weight: 30 })

  return prefs
}

@injectable()
export class RelatedBlogPostsService {
  private cache = new Map<string, { expires: number; data: BlogPostSummary[] }>()

  constructor(@inject(BlogRepository) private blogRepo: BlogRepository) {}

  async findForPage(opts: RelatedFetchOpts): Promise<BlogPostSummary[]> {
    const limit = Math.max(1, Math.min(opts.limit ?? 5, 10))
    const cacheKey = JSON.stringify({ ...opts, limit })
    const now = Date.now()
    const cached = this.cache.get(cacheKey)
    if (cached && cached.expires > now) return cached.data

    const prefs = buildPreferenceList(opts)
    const prefTags = new Set(prefs.map(p => p.tag.toLowerCase()))

    // Fetch a generous batch of recent published posts; filter and score in-memory.
    // Blog catalog is small in this app — full table scan is fine.
    const { blogs } = await this.blogRepo.getBlogs({
      status: 'published',
      limit: 200,
      offset: 0,
    })

    const scored = blogs
      .map(blog => ({ blog, score: this.scoreBlog(blog, prefs) }))
      .filter(({ score }) => score > 0)
      .sort((a, b) => {
        if (b.score !== a.score) return b.score - a.score
        const da = a.blog.published_at ? a.blog.published_at.getTime() : 0
        const db = b.blog.published_at ? b.blog.published_at.getTime() : 0
        return db - da
      })
      .slice(0, limit)
      .map(({ blog, score }) => this.toSummary(blog, score))

    // Touch prefTags so unused-var linting doesn't flag the precomputed set.
    void prefTags

    this.cache.set(cacheKey, { expires: now + CACHE_TTL_MS, data: scored })
    return scored
  }

  /**
   * Score a blog by tag-match quality.
   * Score = sum of weights of matching preference tags.
   * Multi-tag conjunctions (e.g. 'boca-raton-condos') are checked first; if
   * matched, that high-specificity weight dominates.
   */
  private scoreBlog(blog: Blog, prefs: { tag: string; weight: number }[]): number {
    const lowerTags = blog.tags.map(t => t.toLowerCase())
    if (lowerTags.length === 0) return 0
    let score = 0
    for (const { tag, weight } of prefs) {
      if (lowerTags.includes(tag)) {
        score += weight
        continue
      }
      // Hyphenated multi-tag like 'boca-raton-condos' also matches if both halves
      // ('boca-raton' and 'condos') are present as separate tags.
      if (tag.includes('-')) {
        const parts = tag.split('-')
        if (parts.length >= 2) {
          const left = parts.slice(0, parts.length - 1).join('-')
          const right = parts[parts.length - 1]
          if (right && lowerTags.includes(left) && lowerTags.includes(right)) {
            score += weight
          }
        }
      }
    }
    return score
  }

  private toSummary(blog: Blog, score: number): BlogPostSummary {
    return {
      id: blog.id.toString(),
      slug: blog.slug,
      title: blog.title,
      description: blog.description,
      featured_image_url: blog.featured_image_url,
      tags: blog.tags,
      published_at: blog.published_at,
      score,
    }
  }

  /** Test/admin helper to clear the in-memory cache. */
  clearCache(): void {
    this.cache.clear()
  }
}
