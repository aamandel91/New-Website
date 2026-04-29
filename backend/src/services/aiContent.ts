import { injectable } from 'tsyringe'
import { Anthropic } from '@anthropic-ai/sdk'
import type {
  AIBlogPostRequest,
  AIBlogPostResponse,
  AIKeywordSuggestion,
  AIPageContentRequest,
  AIPageContentResponse
} from '../types/aiContent.js'
import { SOUTH_FLORIDA_CONTEXT } from '../utils/aiPromptContext.js'

@injectable()
export class AIContentService {
  private anthropic: Anthropic

  constructor() {
    this.anthropic = new Anthropic({
      apiKey: process.env['ANTHROPIC_API_KEY'] || ''
    })
  }

  /**
   * Generate a complete blog post
   */
  async generateBlogPost(request: AIBlogPostRequest): Promise<AIBlogPostResponse> {
    const cityContext = request.city ? ` in ${request.city}` : ''
    const toneInstruction = request.tone || 'professional and informative'
    const lengthTarget = request.length || 1500

    const prompt = `Generate a comprehensive SEO-optimized blog post about "${request.keyword}"${cityContext}.

Requirements:
- Tone: ${toneInstruction}
- Target length: ${lengthTarget} words
- Format: Markdown
- Include: Title, excerpt, full article content
- SEO: Meta title, meta description, keywords, tags
- Minimum 1500 words
- Include H2 and H3 headings
- Include a meta description under 160 characters
- Include local South Florida market data where relevant
- End with a call to action to contact The Mandel Team

The blog post should:
1. Be engaging and valuable to readers
2. Include real estate expertise and insights
3. Use proper headings (H2, H3) for structure
4. Include actionable tips and advice
5. Be optimized for search engines

Respond with a JSON object containing:
{
  "title": "Engaging blog title (under 60 characters)",
  "excerpt": "Compelling excerpt (under 160 characters)",
  "content": "Full markdown article content",
  "meta_title": "SEO meta title (under 60 characters)",
  "meta_description": "SEO meta description (under 160 characters)",
  "meta_keywords": ["keyword1", "keyword2", "keyword3"],
  "tags": ["tag1", "tag2", "tag3"]
}`

    const message = await this.anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 4000,
      system: SOUTH_FLORIDA_CONTEXT,
      messages: [
        {
          role: 'user',
          content: prompt
        }
      ]
    })

    const block = message.content[0]
    const responseText = block && block.type === 'text' ? block.text : ''

    try {
      const jsonMatch = responseText.match(/\{[\s\S]*\}/)
      if (!jsonMatch) {
        throw new Error('No JSON found in AI response')
      }

      const result = JSON.parse(jsonMatch[0])

      return {
        title: result.title || `Guide to ${request.keyword}`,
        excerpt: result.excerpt || '',
        content: result.content || '',
        meta_title: result.meta_title || result.title,
        meta_description: result.meta_description || result.excerpt,
        meta_keywords: result.meta_keywords || [],
        tags: result.tags || []
      }
    } catch (error) {
      console.error('Error parsing AI blog response:', error)
      throw new Error('Failed to generate blog post')
    }
  }

  /**
   * Suggest keywords for a topic
   */
  async suggestKeywords(topic: string, city?: string): Promise<AIKeywordSuggestion[]> {
    const cityContext = city ? ` in ${city}` : ''

    const prompt = `Suggest 10 high-value SEO keywords related to "${topic}"${cityContext}, specifically targeting South Florida buyer and seller intent (Broward County and Palm Beach County).

For each keyword, provide:
- keyword: the actual keyword phrase
- searchVolume: estimated monthly searches (1-10000)
- difficulty: SEO difficulty (1-100, where higher is more difficult)
- opportunityScore: opportunity rating (1-100, where higher is better opportunity)
- relatedKeywords: array of 3-5 related keywords

Focus on:
- South Florida buyer intent (relocation, luxury, waterfront, 55+, gated communities)
- South Florida seller intent (home valuation, listing prep, market timing)
- Specific city and neighborhood targeting (Boca Raton, Parkland, Delray Beach, Fort Lauderdale, Weston, etc.)
- Long-tail and question-based queries
- Where relevant, include Spanish-language search terms as secondary suggestions in the relatedKeywords array, reflecting the significant Latin American buyer demographic in South Florida. Only include Spanish terms when they meaningfully match the topic - skip them for hyper-local English-only terms.

Respond with a JSON array of keyword objects.`

    const message = await this.anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 2000,
      system: SOUTH_FLORIDA_CONTEXT,
      messages: [
        {
          role: 'user',
          content: prompt
        }
      ]
    })

    const block = message.content[0]
    const responseText = block && block.type === 'text' ? block.text : ''

    try {
      const jsonMatch = responseText.match(/\[[\s\S]*\]/)
      if (!jsonMatch) {
        throw new Error('No JSON array found in AI response')
      }

      const keywords = JSON.parse(jsonMatch[0])
      return keywords as AIKeywordSuggestion[]
    } catch (error) {
      console.error('Error parsing keyword suggestions:', error)
      return []
    }
  }

  /**
   * Generate page content from a structured request.
   *
   * Inputs (all derived from AIPageContentRequest):
   *   - pageType:     'city' | 'subType' | 'neighborhood' | etc — picks the
   *                   structure / heading style of the generated copy.
   *   - keyword:      primary SEO keyword the page should target.
   *   - location:     optional locality (e.g. 'Boca Raton, FL').
   *   - propertyType: optional property type (e.g. 'condos').
   *   - tone:         optional voice instruction (default: professional and informative).
   */
  async generatePageContent(request: AIPageContentRequest): Promise<AIPageContentResponse> {
    const toneInstruction = request.tone || 'professional and informative'
    const locationLine = request.location ? `Location: ${request.location}` : ''
    const propertyTypeLine = request.propertyType
      ? `Property type: ${request.propertyType}`
      : ''
    const contextLines = [locationLine, propertyTypeLine].filter(Boolean).join('\n')
    const contextBlock = contextLines ? `\nContext:\n${contextLines}\n` : ''

    const prompt = `Generate structured page content for a "${request.pageType}" page that can be saved directly into a CMS.

Primary keyword: ${request.keyword}${contextBlock}
Tone: ${toneInstruction}

Return JSON in EXACTLY this shape — no markdown, no code fences, just JSON:

{
  "content": {
    "modules": [
      { "type": "hero", "data": { "heading": "", "subheading": "" } },
      { "type": "text", "data": { "content": "<HTML body of ~500-800 words with H2/H3 sections>" } },
      { "type": "faq", "data": { "items": [ { "question": "", "answer": "" }, { "question": "", "answer": "" }, { "question": "", "answer": "" } ] } },
      { "type": "cta", "data": { "heading": "", "buttonLabel": "", "buttonHref": "/contact" } }
    ],
    "sidebar": [
      { "type": "text", "data": { "heading": "At a Glance", "content": "<short HTML summary, 2-3 sentences>" } }
    ]
  },
  "meta_title": "SEO meta title (under 60 characters, includes keyword)",
  "meta_description": "SEO meta description (under 160 characters, includes keyword)",
  "meta_keywords": ["5-8 related keywords"],
  "structured_data": {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "name": "<same as meta_title>",
    "description": "<same as meta_description>"
  }
}

Rules for the body 'text' module:
- Real HTML (use <h2>, <h3>, <p>, <ul>, <strong>) — NOT markdown
- ~500-800 words total
- Naturally include the primary keyword in the first paragraph
- Specific to the location and/or property type when provided
- Engaging, valuable, and SEO-optimized`

    const message = await this.anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 3000,
      system: SOUTH_FLORIDA_CONTEXT,
      messages: [
        {
          role: 'user',
          content: prompt
        }
      ]
    })

    const block = message.content[0]
    const responseText = block && block.type === 'text' ? block.text : ''

    try {
      const jsonMatch = responseText.match(/\{[\s\S]*\}/)
      if (!jsonMatch) {
        throw new Error('No JSON found in AI response')
      }

      const result = JSON.parse(jsonMatch[0])

      // Defensive defaults so we always return a valid AIPageContentResponse
      // even when Claude omits or mangles a field.
      const modules = Array.isArray(result.content?.modules)
        ? result.content.modules
        : []
      const sidebar = Array.isArray(result.content?.sidebar)
        ? result.content.sidebar
        : []

      const response: AIPageContentResponse = {
        content: { modules, sidebar },
        meta_title: result.meta_title || '',
        meta_description: result.meta_description || '',
        meta_keywords: Array.isArray(result.meta_keywords)
          ? result.meta_keywords
          : []
      }
      if (result.structured_data) response.structured_data = result.structured_data
      return response
    } catch (error) {
      console.error('Error parsing page content response:', error)
      throw new Error('Failed to generate page content')
    }
  }

  /**
   * Generate content for multiple page requests at once (batch generation).
   *
   * Each request is processed sequentially with a small delay between calls
   * to stay below Anthropic's rate limits. A failure on one request is
   * logged and the loop continues with the next — partial results are
   * still returned.
   */
  async generateBatchContent(
    requests: AIPageContentRequest[]
  ): Promise<AIPageContentResponse[]> {
    const results: AIPageContentResponse[] = []

    for (const request of requests) {
      try {
        const content = await this.generatePageContent(request)
        results.push(content)

        // Small delay to avoid rate limiting
        await new Promise((resolve) => setTimeout(resolve, 500))
      } catch (error) {
        console.error('Error generating batch content:', error)
        // Continue with next item even if one fails
      }
    }

    return results
  }
}
