import { injectable } from 'tsyringe'
import { Anthropic } from '@anthropic-ai/sdk'
import type {
  AIBlogPostRequest,
  AIBlogPostResponse,
  AIKeywordSuggestion,
  AIPageContentRequest,
  AIPageContentResponse
} from '../types/aiContent.js'

@injectable()
export class AIContentService {
  private anthropic: Anthropic

  constructor() {
    this.anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY
    })
  }

  /**
   * Generate a complete blog post
   */
  async generateBlogPost(request: AIBlogPostRequest): Promise<AIBlogPostResponse> {
    const cityContext = request.city ? ` in ${request.city}` : ''
    const toneInstruction = request.tone || 'professional and informative'
    const lengthTarget = request.length || 1500

    const prompt = `You are an expert real estate content writer. Generate a comprehensive SEO-optimized blog post about "${request.keyword}"${cityContext}.

Requirements:
- Tone: ${toneInstruction}
- Target length: ${lengthTarget} words
- Format: Markdown
- Include: Title, excerpt, full article content
- SEO: Meta title, meta description, keywords, tags

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
      messages: [
        {
          role: 'user',
          content: prompt
        }
      ]
    })

    const responseText = message.content[0].type === 'text' ? message.content[0].text : ''

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

    const prompt = `You are an SEO expert specializing in real estate. Suggest 10 high-value keywords related to "${topic}"${cityContext}.

For each keyword, provide:
- keyword: the actual keyword phrase
- searchVolume: estimated monthly searches (1-10000)
- difficulty: SEO difficulty (1-100, where higher is more difficult)
- opportunityScore: opportunity rating (1-100, where higher is better opportunity)
- relatedKeywords: array of 3-5 related keywords

Focus on:
- Long-tail keywords
- Local search intent
- Buyer/seller intent
- Question-based queries

Respond with a JSON array of keyword objects.`

    const message = await this.anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 2000,
      messages: [
        {
          role: 'user',
          content: prompt
        }
      ]
    })

    const responseText = message.content[0].type === 'text' ? message.content[0].text : ''

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

    const prompt = `You are a real estate content expert. Generate page content for a "${request.pageType}" page.

Primary keyword: ${request.keyword}${contextBlock}
Tone: ${toneInstruction}

Generate:
1. Page title (use the primary keyword naturally)
2. Full page content in HTML format (~500-800 words; use semantic headings)
3. Meta title for SEO (under 60 characters, include the keyword)
4. Meta description for SEO (under 160 characters, include the keyword)
5. Keywords array (5-8 related keywords)

Make the content:
- Specific to the location and/or property type when provided
- Valuable and informative for prospective buyers and sellers
- SEO-optimized with natural keyword usage
- Engaging and well-structured

Respond with JSON:
{
  "title": "Page title",
  "content": "Full HTML content",
  "meta_title": "SEO meta title",
  "meta_description": "SEO description",
  "meta_keywords": ["keyword1", "keyword2"]
}`

    const message = await this.anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 3000,
      messages: [
        {
          role: 'user',
          content: prompt
        }
      ]
    })

    const responseText = message.content[0].type === 'text' ? message.content[0].text : ''

    try {
      const jsonMatch = responseText.match(/\{[\s\S]*\}/)
      if (!jsonMatch) {
        throw new Error('No JSON found in AI response')
      }

      const result = JSON.parse(jsonMatch[0])

      return {
        title: result.title || 'Page Title',
        content: result.content || '',
        meta_title: result.meta_title || result.title,
        meta_description: result.meta_description || '',
        meta_keywords: result.meta_keywords || []
      }
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
