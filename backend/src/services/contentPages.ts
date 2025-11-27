import { injectable, inject } from 'tsyringe'
import { ContentPagesRepository } from '../repository/contentPages.js'
import type {
  ContentPage,
  CreateContentPageInput,
  UpdateContentPageInput,
  ContentPageFilters
} from '../types/contentPage.js'
import { ApiError } from '../lib/errors.js'
import { deleteFromCloudinary } from '../utils/cloudinary.js'

@injectable()
export class ContentPagesService {
  constructor(@inject(ContentPagesRepository) private pagesRepo: ContentPagesRepository) {}

  /**
   * Create a new page
   */
  async createPage(orgId: bigint, input: CreateContentPageInput): Promise<ContentPage> {
    // Validate title
    if (!input.title) {
      throw new ApiError('Title is required', { status: 400 })
    }

    // Check for duplicate slug
    if (input.slug) {
      const existing = await this.pagesRepo.getPageBySlug(orgId, input.slug)
      if (existing) {
        throw new ApiError('A page with this slug already exists', { status: 409 })
      }
    }

    return this.pagesRepo.createPage(orgId, input)
  }

  /**
   * Update a page
   */
  async updatePage(orgId: bigint, id: bigint, input: UpdateContentPageInput): Promise<ContentPage> {
    const existing = await this.pagesRepo.getPageById(orgId, id)

    if (!existing) {
      throw new ApiError('Page not found', { status: 404 })
    }

    // Check for slug conflicts
    if (input.slug && input.slug !== existing.slug) {
      const conflict = await this.pagesRepo.getPageBySlug(orgId, input.slug)
      if (conflict) {
        throw new ApiError('A page with this slug already exists', { status: 409 })
      }
    }

    return this.pagesRepo.updatePage(orgId, id, input)
  }

  /**
   * Get page by ID
   */
  async getPageById(orgId: bigint, id: bigint): Promise<ContentPage | null> {
    return this.pagesRepo.getPageById(orgId, id)
  }

  /**
   * Get page by slug
   */
  async getPageBySlug(orgId: bigint, slug: string): Promise<ContentPage | null> {
    return this.pagesRepo.getPageBySlug(orgId, slug)
  }

  /**
   * Get pages with filtering
   */
  async getPages(orgId: bigint, filters: ContentPageFilters = {}) {
    return this.pagesRepo.getPages(orgId, filters)
  }

  /**
   * Delete a page
   */
  async deletePage(orgId: bigint, id: bigint): Promise<boolean> {
    const page = await this.pagesRepo.getPageById(orgId, id)

    if (!page) {
      throw new ApiError('Page not found', { status: 404 })
    }

    // Delete featured image from Cloudinary if exists
    if (page.featured_image_cloudinary_id) {
      try {
        await deleteFromCloudinary(page.featured_image_cloudinary_id)
      } catch (error) {
        console.error('Error deleting image from Cloudinary:', error)
        // Continue with page deletion even if image deletion fails
      }
    }

    return this.pagesRepo.deletePage(orgId, id)
  }

  /**
   * Publish a page
   */
  async publishPage(orgId: bigint, id: bigint): Promise<ContentPage> {
    const page = await this.pagesRepo.getPageById(orgId, id)

    if (!page) {
      throw new ApiError('Page not found', { status: 404 })
    }

    return this.pagesRepo.publishPage(orgId, id)
  }

  /**
   * Get templates
   */
  async getTemplates(orgId: bigint): Promise<ContentPage[]> {
    return this.pagesRepo.getTemplates(orgId)
  }

  /**
   * Duplicate from template
   */
  async duplicateFromTemplate(
    orgId: bigint,
    templateId: bigint,
    newTitle: string
  ): Promise<ContentPage> {
    const template = await this.pagesRepo.getPageById(orgId, templateId)

    if (!template) {
      throw new ApiError('Template not found', { status: 404 })
    }

    if (!template.is_template) {
      throw new ApiError('Page is not a template', { status: 400 })
    }

    return this.pagesRepo.duplicateFromTemplate(orgId, templateId, newTitle)
  }
}
