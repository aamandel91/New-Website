import { injectable, inject } from 'tsyringe'
import type { Knex } from 'knex'
import type {
  Blog,
  BlogSuggestedTags,
  CreateBlogInput,
  BlogFilters,
  BlogTag,
  BlogCategory
} from '../types/blog.js'

@injectable()
export class BlogRepository {
  constructor(@inject('db') private db: Knex) {}

  /**
   * Create a new blog post
   */
  async createBlog(input: CreateBlogInput): Promise<Blog> {
    const now = new Date()
    const slug = this.generateSlug(input.title)

    const [blog] = await this.db('blogs')
      .insert({
        slug,
        title: input.title,
        description: input.description,
        content: input.content,
        featured_image_url: input.featured_image_url || null,
        featured_image_cloudinary_id: input.featured_image_cloudinary_id || null,
        author_email: input.author_email,
        status: input.status,
        tags: JSON.stringify(input.tags || []),
        categories: JSON.stringify(input.categories || []),
        meta_title: input.meta_title || null,
        meta_description: input.meta_description || null,
        meta_keywords: JSON.stringify(input.meta_keywords || []),
        published_at: input.published_at || null,
        created_at: now,
        updated_at: now
      })
      .returning('*')

    return this.formatBlog(blog)
  }

  /**
   * Update a blog post
   */
  async updateBlog(id: bigint, input: Partial<CreateBlogInput>): Promise<Blog> {
    const updateData: any = {
      updated_at: new Date()
    }

    if (input.title) {
      updateData.title = input.title
      updateData.slug = this.generateSlug(input.title)
    }
    if (input.description) updateData.description = input.description
    if (input.content) updateData.content = input.content
    if (input.featured_image_url !== undefined) updateData.featured_image_url = input.featured_image_url
    if (input.featured_image_cloudinary_id !== undefined) updateData.featured_image_cloudinary_id = input.featured_image_cloudinary_id
    if (input.status) updateData.status = input.status
    if (input.tags) updateData.tags = JSON.stringify(input.tags)
    if (input.categories) updateData.categories = JSON.stringify(input.categories)
    if (input.meta_title !== undefined) updateData.meta_title = input.meta_title
    if (input.meta_description !== undefined) updateData.meta_description = input.meta_description
    if (input.meta_keywords !== undefined) updateData.meta_keywords = JSON.stringify(input.meta_keywords)
    if (input.published_at !== undefined) updateData.published_at = input.published_at

    const [blog] = await this.db('blogs')
      .where({ id })
      .update(updateData)
      .returning('*')

    return this.formatBlog(blog)
  }

  /**
   * Get blog by ID
   */
  async getBlogById(id: bigint): Promise<Blog | null> {
    const blog = await this.db('blogs')
      .where({ id })
      .first()

    return blog ? this.formatBlog(blog) : null
  }

  /**
   * Get blog by slug
   */
  async getBlogBySlug(slug: string): Promise<Blog | null> {
    const blog = await this.db('blogs')
      .where({ slug })
      .first()

    return blog ? this.formatBlog(blog) : null
  }

  /**
   * Get blogs with filtering and pagination
   */
  async getBlogs(filters: BlogFilters = {}): Promise<{ blogs: Blog[]; total: number }> {
    let query = this.db('blogs').select()

    if (filters.status) {
      query = query.where('status', filters.status)
    }

    if (filters.author_email) {
      query = query.where('author_email', filters.author_email)
    }

    if (filters.tag) {
      query = query.whereRaw(`tags::text ILIKE ?`, [`%"${filters.tag}"%`])
    }

    if (filters.category) {
      query = query.whereRaw(`categories::text ILIKE ?`, [`%"${filters.category}"%`])
    }

    if (filters.search) {
      query = query.where(q => {
        q.whereRaw(`title ILIKE ?`, [`%${filters.search}%`])
          .orWhereRaw(`description ILIKE ?`, [`%${filters.search}%`])
          .orWhereRaw(`content ILIKE ?`, [`%${filters.search}%`])
      })
    }

    // Get total count before pagination
    const countRow = await this.db(query.clone() as any)
      .count('* as count')
      .first()
    const count = Number(countRow?.['count'] ?? 0)

    // Apply ordering and pagination
    const offset = filters.offset || 0
    const limit = filters.limit || 10

    query = query
      .orderBy('published_at', 'desc')
      .orderBy('created_at', 'desc')
      .limit(limit)
      .offset(offset)

    const blogs = await query

    return {
      blogs: blogs.map(b => this.formatBlog(b)),
      total: count
    }
  }

  /**
   * Delete a blog post
   */
  async deleteBlog(id: bigint): Promise<boolean> {
    const result = await this.db('blogs')
      .where({ id })
      .delete()

    return result > 0
  }

  /**
   * Create or update tag
   */
  async upsertTag(name: string): Promise<BlogTag> {
    const slug = this.generateSlug(name)

    const [tag] = await this.db('blog_tags')
      .insert({ name, slug, usage_count: 1 })
      .onConflict('slug')
      .merge({ usage_count: this.db.raw('usage_count + 1') })
      .returning('*')

    return tag
  }

  /**
   * Get all tags
   */
  async getTags(limit: number = 50): Promise<BlogTag[]> {
    return this.db('blog_tags')
      .orderBy('usage_count', 'desc')
      .limit(limit)
  }

  /**
   * Create or update category
   */
  async upsertCategory(name: string, description?: string): Promise<BlogCategory> {
    const slug = this.generateSlug(name)

    const [category] = await this.db('blog_categories')
      .insert({ name, slug, description, usage_count: 1 })
      .onConflict('slug')
      .merge({ usage_count: this.db.raw('usage_count + 1') })
      .returning('*')

    return category
  }

  /**
   * Get all categories
   */
  async getCategories(): Promise<BlogCategory[]> {
    return this.db('blog_categories')
      .orderBy('name', 'asc')
  }

  /**
   * Update only the auto-tag related columns. Used by the auto-tag pipeline
   * so blog edits flowing through updateBlog don't accidentally clobber
   * suggestions (and vice versa).
   */
  async updateAutoTagColumns(
    id: bigint,
    fields: {
      suggested_tags?: BlogSuggestedTags | null
      rejected_tags?: string[]
      auto_tagged_at?: Date | null
      tags?: string[]
      ai_suggested_tags?: boolean
    }
  ): Promise<void> {
    const updateData: Record<string, unknown> = { updated_at: new Date() }
    if (fields.suggested_tags !== undefined) {
      updateData['suggested_tags'] =
        fields.suggested_tags === null ? null : JSON.stringify(fields.suggested_tags)
    }
    if (fields.rejected_tags !== undefined) {
      updateData['rejected_tags'] = JSON.stringify(fields.rejected_tags)
    }
    if (fields.auto_tagged_at !== undefined) {
      updateData['auto_tagged_at'] = fields.auto_tagged_at
    }
    if (fields.tags !== undefined) {
      updateData['tags'] = JSON.stringify(fields.tags)
    }
    if (fields.ai_suggested_tags !== undefined) {
      updateData['ai_suggested_tags'] = fields.ai_suggested_tags
    }
    await this.db('blogs').where({ id }).update(updateData)
  }

  /**
   * Return blogs missing auto_tagged_at (used by the backfill script).
   */
  async getBlogsMissingAutoTags(limit = 500): Promise<Blog[]> {
    const rows = await this.db('blogs')
      .whereNull('auto_tagged_at')
      .orderBy('created_at', 'asc')
      .limit(limit)
    return rows.map(b => this.formatBlog(b))
  }

  /**
   * Format blog from database (parse JSON fields)
   */
  private formatBlog(blog: any): Blog {
    const parseJsonField = (v: unknown, fallback: unknown) => {
      if (v === null || v === undefined) return fallback
      if (typeof v === 'string') {
        try {
          return JSON.parse(v)
        } catch {
          return fallback
        }
      }
      return v
    }
    return {
      ...blog,
      id: BigInt(blog.id),
      tags: Array.isArray(blog.tags) ? blog.tags : JSON.parse(blog.tags || '[]'),
      categories: Array.isArray(blog.categories) ? blog.categories : JSON.parse(blog.categories || '[]'),
      meta_keywords: Array.isArray(blog.meta_keywords) ? blog.meta_keywords : JSON.parse(blog.meta_keywords || '[]'),
      suggested_tags: parseJsonField(blog.suggested_tags, null) as BlogSuggestedTags | null,
      rejected_tags: parseJsonField(blog.rejected_tags, []) as string[],
      auto_tagged_at: blog.auto_tagged_at ? new Date(blog.auto_tagged_at) : null
    }
  }

  /**
   * Generate URL slug from text
   */
  private generateSlug(text: string): string {
    return text
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
  }
}
