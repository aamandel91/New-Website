import { injectable, inject } from 'tsyringe'
import type { Knex } from 'knex'
import type {
  ContentPage,
  CreateContentPageInput,
  UpdateContentPageInput,
  ContentPageFilters
} from '../types/contentPage.js'

@injectable()
export class ContentPagesRepository {
  constructor(@inject('db') private db: Knex) {}

  /**
   * Create a new content page
   */
  async createPage(orgId: bigint, input: CreateContentPageInput): Promise<ContentPage> {
    const now = new Date()
    const slug = input.slug || this.generateSlug(input.title)

    const [page] = await this.db('content_pages')
      .insert({
        org_id: orgId,
        title: input.title,
        slug,
        content: JSON.stringify(input.content || { modules: [], sidebar: [] }),
        status: input.status || 'draft',
        featured_image_url: input.featured_image_url || null,
        featured_image_cloudinary_id: input.featured_image_cloudinary_id || null,
        is_template: input.is_template || false,
        template_name: input.template_name || null,
        parent_page_id: input.parent_page_id || null,
        category: input.category || null,
        meta_title: input.meta_title || null,
        meta_description: input.meta_description || null,
        meta_keywords: JSON.stringify(input.meta_keywords || []),
        robots: input.robots || 'index,follow',
        custom_css: input.custom_css || null,
        custom_js: input.custom_js || null,
        created_at: now,
        updated_at: now
      })
      .returning('*')

    return this.formatPage(page)
  }

  /**
   * Update a content page
   */
  async updatePage(orgId: bigint, id: bigint, input: UpdateContentPageInput): Promise<ContentPage> {
    const updateData: any = {
      updated_at: new Date()
    }

    if (input.title !== undefined) {
      updateData.title = input.title
      updateData.slug = this.generateSlug(input.title)
    }
    if (input.slug !== undefined) updateData.slug = input.slug
    if (input.content !== undefined) updateData.content = JSON.stringify(input.content)
    if (input.status !== undefined) updateData.status = input.status
    if (input.featured_image_url !== undefined)
      updateData.featured_image_url = input.featured_image_url
    if (input.featured_image_cloudinary_id !== undefined)
      updateData.featured_image_cloudinary_id = input.featured_image_cloudinary_id
    if (input.is_template !== undefined) updateData.is_template = input.is_template
    if (input.template_name !== undefined) updateData.template_name = input.template_name
    if (input.parent_page_id !== undefined) updateData.parent_page_id = input.parent_page_id
    if (input.category !== undefined) updateData.category = input.category
    if (input.meta_title !== undefined) updateData.meta_title = input.meta_title
    if (input.meta_description !== undefined)
      updateData.meta_description = input.meta_description
    if (input.meta_keywords !== undefined)
      updateData.meta_keywords = JSON.stringify(input.meta_keywords)
    if (input.robots !== undefined) updateData.robots = input.robots
    if (input.custom_css !== undefined) updateData.custom_css = input.custom_css
    if (input.custom_js !== undefined) updateData.custom_js = input.custom_js
    if (input.published_at !== undefined) updateData.published_at = input.published_at

    const [page] = await this.db('content_pages')
      .where({ id, org_id: orgId })
      .update(updateData)
      .returning('*')

    return this.formatPage(page)
  }

  /**
   * Get page by ID
   */
  async getPageById(orgId: bigint, id: bigint): Promise<ContentPage | null> {
    const page = await this.db('content_pages').where({ id, org_id: orgId }).first()

    return page ? this.formatPage(page) : null
  }

  /**
   * Get page by slug
   */
  async getPageBySlug(orgId: bigint, slug: string): Promise<ContentPage | null> {
    const page = await this.db('content_pages').where({ slug, org_id: orgId }).first()

    return page ? this.formatPage(page) : null
  }

  /**
   * Get pages with filtering
   */
  async getPages(
    orgId: bigint,
    filters: ContentPageFilters = {}
  ): Promise<{ pages: ContentPage[]; total: number }> {
    let query = this.db('content_pages').where({ org_id: orgId })

    if (filters.status) {
      query = query.where({ status: filters.status })
    }

    if (filters.category) {
      query = query.where({ category: filters.category })
    }

    if (filters.is_template !== undefined) {
      query = query.where({ is_template: filters.is_template })
    }

    if (filters.search) {
      query = query.where((builder) => {
        builder.where('title', 'ilike', `%${filters.search}%`).orWhere('slug', 'ilike', `%${filters.search}%`)
      })
    }

    // Get total count
    const countRow = await query.clone().count('* as count').first()
    const count = Number(countRow?.['count'] ?? 0)

    // Apply pagination
    const limit = filters.limit || 50
    const offset = filters.offset || 0

    const pages = await query.orderBy('created_at', 'desc').limit(limit).offset(offset)

    return {
      pages: pages.map((page) => this.formatPage(page)),
      total: Number(count)
    }
  }

  /**
   * Delete a page
   */
  async deletePage(orgId: bigint, id: bigint): Promise<boolean> {
    const deleted = await this.db('content_pages').where({ id, org_id: orgId }).delete()

    return deleted > 0
  }

  /**
   * Publish a page
   */
  async publishPage(orgId: bigint, id: bigint): Promise<ContentPage> {
    return this.updatePage(orgId, id, {
      status: 'published',
      published_at: new Date()
    })
  }

  /**
   * Get minimal page rows for sitemap generation (published only).
   */
  async getSitemapPages(
    orgId: bigint
  ): Promise<Array<{ id: string; slug: string; updated_at: Date; published_at: Date | null }>> {
    const rows = await this.db('content_pages')
      .select('id', 'slug', 'updated_at', 'published_at')
      .where({ org_id: orgId, status: 'published' })
      .orderBy('published_at', 'desc')
      .limit(5000)

    return rows.map((r: any) => ({
      id: String(r.id),
      slug: r.slug,
      updated_at: r.updated_at,
      published_at: r.published_at
    }))
  }

  /**
   * Get templates
   */
  async getTemplates(orgId: bigint): Promise<ContentPage[]> {
    const templates = await this.db('content_pages')
      .where({ org_id: orgId, is_template: true })
      .orderBy('template_name', 'asc')

    return templates.map((page) => this.formatPage(page))
  }

  /**
   * Duplicate page from template
   */
  async duplicateFromTemplate(
    orgId: bigint,
    templateId: bigint,
    newTitle: string
  ): Promise<ContentPage> {
    const template = await this.getPageById(orgId, templateId)

    if (!template) {
      throw new Error('Template not found')
    }

    const input: CreateContentPageInput = {
      title: newTitle,
      content: template.content,
      status: 'draft',
      meta_keywords: template.meta_keywords,
      robots: template.robots
    }
    if (template.category !== null) input.category = template.category
    return this.createPage(orgId, input)
  }

  /**
   * Format page object
   */
  private formatPage(page: any): ContentPage {
    return {
      ...page,
      content: JSON.parse(page.content || '{"modules":[],"sidebar":[]}'),
      meta_keywords: JSON.parse(page.meta_keywords || '[]')
    }
  }

  /**
   * Generate URL-safe slug
   */
  private generateSlug(title: string): string {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
  }
}
