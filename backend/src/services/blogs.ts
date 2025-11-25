import { injectable, inject } from 'tsyringe'
import { Anthropic } from '@anthropic-ai/sdk'
import { BlogRepository } from '../repository/blogs'
import type { Blog, CreateBlogInput, UpdateBlogInput, BlogFilters, AISuggestions } from '../types/blog'
import { deleteFromCloudinary } from '../utils/cloudinary'

@injectable()
export class BlogService {
  private anthropic: Anthropic

  constructor(@inject(BlogRepository) private blogRepo: BlogRepository) {
    this.anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY
    })
  }

  /**
   * Create a new blog post
   */
  async createBlog(input: CreateBlogInput): Promise<Blog> {
    return this.blogRepo.createBlog(input)
  }

  /**
   * Update a blog post
   */
  async updateBlog(id: bigint, input: Partial<CreateBlogInput>): Promise<Blog> {
    return this.blogRepo.updateBlog(id, input)
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
    const prompt = `You are a helpful SEO expert. Based on the following blog post, generate suggestions for:
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

Make sure the suggestions are relevant to real estate and property matters.`

    const message = await this.anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 1024,
      messages: [
        {
          role: 'user',
          content: prompt
        }
      ]
    })

    // Extract JSON from response
    const responseText = message.content[0].type === 'text' ? message.content[0].text : ''

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
