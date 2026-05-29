import { injectable, inject } from 'tsyringe'
import { Anthropic } from '@anthropic-ai/sdk'
import { BlogRepository } from '../repository/blogs.js'
import type {
  Blog,
  BlogSuggestedTags,
  CreateBlogInput,
  BlogFilters,
  AISuggestions
} from '../types/blog.js'
import { deleteFromCloudinary } from '../utils/cloudinary.js'
import { getMarketContext } from '../utils/aiPromptContext.js'
import { BlogAutoTagService, type AutoTagResult } from './blogAutoTagService.js'

@injectable()
export class BlogService {
  private anthropic: Anthropic
  private autoTagService: BlogAutoTagService

  constructor(@inject(BlogRepository) private blogRepo: BlogRepository) {
    this.anthropic = new Anthropic({
      apiKey: process.env['ANTHROPIC_API_KEY'] || ''
    })
    this.autoTagService = new BlogAutoTagService()
  }

  /**
   * Create a new blog post and kick off async AI auto-tagging.
   * Auto-tagging runs in the background — never blocks the response, never
   * throws back into the caller.
   */
  async createBlog(input: CreateBlogInput): Promise<Blog> {
    const blog = await this.blogRepo.createBlog(input)
    this.runAutoTagAsync(blog).catch(err =>
      console.error('[BlogService.createBlog] auto-tag scheduling error', err)
    )
    return blog
  }

  /**
   * Update a blog post and kick off async AI auto-tagging if title or content
   * changed materially.
   */
  async updateBlog(id: bigint, input: Partial<CreateBlogInput>): Promise<Blog> {
    const updated = await this.blogRepo.updateBlog(id, input)
    const shouldRetag = input.title !== undefined || input.content !== undefined
    if (shouldRetag) {
      this.runAutoTagAsync(updated).catch(err =>
        console.error('[BlogService.updateBlog] auto-tag scheduling error', err)
      )
    }
    return updated
  }

  /**
   * Trigger AI tagging for an existing blog and return the structured result.
   * Synchronous wrt the caller — used by the manual re-run endpoint and the
   * backfill script.
   */
  async runAutoTag(blog: Blog): Promise<AutoTagResult> {
    const result = await this.autoTagService.suggest({
      title: blog.title,
      content: blog.content,
      excerpt: blog.description,
      rejected: blog.rejected_tags || []
    })

    if (!result.meta.ok) {
      // Still persist a record of the failed run so admins know auto-tagging
      // was attempted. Don't touch tags[] when AI fails.
      const blob: BlogSuggestedTags = {
        ...result.structured,
        model: result.meta.model,
        ran_at: result.meta.ran_at,
        input_tokens: result.meta.input_tokens,
        output_tokens: result.meta.output_tokens,
        truncated: result.meta.truncated,
        input_size_bytes: result.meta.input_size_bytes,
        ok: false,
        ...(result.meta.error !== undefined ? { error: result.meta.error } : {})
      }
      await this.blogRepo.updateAutoTagColumns(blog.id, {
        suggested_tags: blob,
        auto_tagged_at: new Date()
      })
      return result
    }

    const blob: BlogSuggestedTags = {
      ...result.structured,
      model: result.meta.model,
      ran_at: result.meta.ran_at,
      input_tokens: result.meta.input_tokens,
      output_tokens: result.meta.output_tokens,
      truncated: result.meta.truncated,
      input_size_bytes: result.meta.input_size_bytes,
      ok: true
    }

    // First-run convenience: if tags[] is empty, auto-apply the suggestions
    // immediately so the post has SEO tags out of the box. Otherwise, leave
    // tags[] alone — the admin reviews via the suggested-tags panel.
    const shouldAutoApply = !blog.tags || blog.tags.length === 0
    await this.blogRepo.updateAutoTagColumns(blog.id, {
      suggested_tags: blob,
      auto_tagged_at: new Date(),
      ...(shouldAutoApply ? { tags: result.flatTags, ai_suggested_tags: true } : {})
    })

    return result
  }

  /** Background-safe wrapper: never throws. */
  private async runAutoTagAsync(blog: Blog): Promise<void> {
    try {
      await this.runAutoTag(blog)
    } catch (err) {
      console.error('[BlogService.runAutoTagAsync] failed', err)
    }
  }

  /**
   * Apply admin-accepted/rejected suggestion decisions.
   * Accepted tags merge into blogs.tags. Rejected tags are stored so the
   * next AI run won't re-propose them.
   */
  async applyAutoTagDecisions(
    id: bigint,
    decisions: { accepted: string[]; rejected: string[] }
  ): Promise<Blog | null> {
    const blog = await this.blogRepo.getBlogById(id)
    if (!blog) return null

    const mergedTags = Array.from(new Set([...(blog.tags || []), ...decisions.accepted]))
    const mergedRejected = Array.from(
      new Set([...(blog.rejected_tags || []), ...decisions.rejected])
    )

    const updateFields: Parameters<typeof this.blogRepo.updateAutoTagColumns>[1] = {
      tags: mergedTags,
      rejected_tags: mergedRejected
    }
    if (decisions.accepted.length > 0) {
      updateFields.ai_suggested_tags = true
    }
    await this.blogRepo.updateAutoTagColumns(id, updateFields)

    return this.blogRepo.getBlogById(id)
  }

  /**
   * Get blog by ID
   */
  async getBlogById(id: bigint): Promise<Blog | null> {
    return this.blogRepo.getBlogById(id)
  }

  /**
   * Get blog by slug
   */
  async getBlogBySlug(slug: string): Promise<Blog | null> {
    return this.blogRepo.getBlogBySlug(slug)
  }

  /**
   * Get blogs with filtering
   */
  async getBlogs(filters: BlogFilters = {}) {
    return this.blogRepo.getBlogs(filters)
  }

  /**
   * Delete a blog post
   */
  async deleteBlog(id: bigint): Promise<boolean> {
    const blog = await this.blogRepo.getBlogById(id)

    if (!blog) return false

    // Delete featured image from Cloudinary if exists
    if (blog.featured_image_cloudinary_id) {
      try {
        await deleteFromCloudinary(blog.featured_image_cloudinary_id)
      } catch (error) {
        console.error('Error deleting image from Cloudinary:', error)
        // Continue with blog deletion even if image deletion fails
      }
    }

    return this.blogRepo.deleteBlog(id)
  }

  /**
   * Generate AI suggestions for meta title, description, keywords, and tags
   */
  async generateAISuggestions(title: string, description: string, content: string): Promise<AISuggestions> {
    const prompt = `Acting as an SEO expert, based on the following blog post, generate suggestions for:
1. A compelling meta title (max 60 characters)
2. A concise meta description (max 160 characters)
3. 5-7 relevant SEO keywords
4. 5-8 relevant blog tags

Blog Title: ${title}

Blog Description: ${description}

Blog Content (first 500 chars): ${content.substring(0, 500)}

Please respond in JSON format:
{
  "meta_title": "...",
  "meta_description": "...",
  "meta_keywords": ["keyword1", "keyword2", ...],
  "tags": ["tag1", "tag2", ...]
}

Make sure the suggestions are relevant to South Florida real estate and property matters.`

    const message = await this.anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 1024,
      system: getMarketContext('south-florida'),
      messages: [
        {
          role: 'user',
          content: prompt
        }
      ]
    })

    // Extract JSON from response
    const block = message.content[0]
    const responseText = block && block.type === 'text' ? block.text : ''

    try {
      // Find JSON in the response
      const jsonMatch = responseText.match(/\{[\s\S]*\}/)
      if (!jsonMatch) {
        throw new Error('No JSON found in response')
      }

      const suggestions = JSON.parse(jsonMatch[0])

      return {
        meta_title: suggestions.meta_title || title,
        meta_description: suggestions.meta_description || description.substring(0, 160),
        meta_keywords: suggestions.meta_keywords || [],
        tags: suggestions.tags || []
      }
    } catch (error) {
      console.error('Error parsing AI suggestions:', error)

      // Return default suggestions if AI fails
      return {
        meta_title: title,
        meta_description: description.substring(0, 160),
        meta_keywords: this.extractKeywordsFromText(content),
        tags: this.extractTagsFromText(title, description, content)
      }
    }
  }

  /**
   * Extract potential tags from blog content
   */
  private extractTagsFromText(title: string, description: string, content: string): string[] {
    const text = `${title} ${description} ${content}`.toLowerCase()
    const realEstateTerms = [
      'property',
      'real estate',
      'home',
      'house',
      'apartment',
      'condo',
      'investment',
      'buyer',
      'seller',
      'mortgage',
      'financing',
      'listing',
      'neighborhood',
      'market',
      'florida',
      'miami',
      'florida keys',
      'vacation home',
      'luxury',
      'commercial',
      'residential',
      'tips',
      'guide',
      'advice',
      'selling',
      'buying',
      'pricing',
      'inspection',
      'appraisal'
    ]

    const foundTags = realEstateTerms.filter(term => text.includes(term))

    return foundTags.slice(0, 8)
  }

  /**
   * Extract keywords from content using simple heuristics
   */
  private extractKeywordsFromText(content: string): string[] {
    // Simple keyword extraction - in production, consider using NLP libraries
    const words = content
      .toLowerCase()
      .split(/\W+/)
      .filter(word => word.length > 5)

    const frequency: { [key: string]: number } = {}

    words.forEach(word => {
      frequency[word] = (frequency[word] || 0) + 1
    })

    return Object.entries(frequency)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 7)
      .map(([word]) => word)
  }

  /**
   * Publish a blog post
   */
  async publishBlog(id: bigint): Promise<Blog> {
    const blog = await this.blogRepo.getBlogById(id)

    if (!blog) {
      throw new Error('Blog not found')
    }

    return this.blogRepo.updateBlog(id, {
      status: 'published',
      published_at: new Date()
    })
  }

  /**
   * Get featured blogs (published)
   */
  async getFeaturedBlogs(limit: number = 3): Promise<Blog[]> {
    const { blogs } = await this.blogRepo.getBlogs({
      status: 'published',
      limit,
      offset: 0
    })

    return blogs
  }

  /**
   * Get related blogs by tags
   */
  async getRelatedBlogs(blogId: bigint, limit: number = 3): Promise<Blog[]> {
    const blog = await this.blogRepo.getBlogById(blogId)

    if (!blog || blog.tags.length === 0) {
      return []
    }

    const { blogs } = await this.blogRepo.getBlogs({
      status: 'published',
      limit: limit * 2, // Fetch more, filter locally
      offset: 0
    })

    // Filter blogs that share tags with the current blog
    const related = blogs
      .filter(b => b.id !== blogId && b.tags.some(tag => blog.tags.includes(tag)))
      .slice(0, limit)

    return related
  }

  /**
   * Get all tags
   */
  async getTags(limit?: number) {
    return this.blogRepo.getTags(limit)
  }

  /**
   * Get all categories
   */
  async getCategories() {
    return this.blogRepo.getCategories()
  }

  /**
   * Get blogs by tag
   */
  async getBlogsByTag(tag: string, limit: number = 10, offset: number = 0) {
    return this.blogRepo.getBlogs({
      status: 'published',
      tag,
      limit,
      offset
    })
  }

  /**
   * Search blogs
   */
  async searchBlogs(query: string, limit: number = 10, offset: number = 0) {
    return this.blogRepo.getBlogs({
      status: 'published',
      search: query,
      limit,
      offset
    })
  }
}
