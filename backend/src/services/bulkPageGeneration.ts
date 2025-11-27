import { injectable, inject } from 'tsyringe'
import { ContentPagesRepository } from '../repository/contentPages.js'
import { AIContentService } from './aiContent.js'
import type {
  CreateContentPageInput,
  ContentPage
} from '../types/contentPage.js'
import type {
  BulkPageGenerationRequest,
  BulkPageGenerationResult
} from '../types/aiContent.js'
import { ApiError } from '../lib/errors.js'
import knex from '../db/knex.js'

interface LocationData {
  id: number
  name: string
  type: 'city' | 'zipcode' | 'neighborhood'
  state?: string
  county?: string
}

interface PropertyTypeData {
  id: number
  name: string
  slug: string
}

@injectable()
export class BulkPageGenerationService {
  constructor(
    @inject(ContentPagesRepository) private pagesRepo: ContentPagesRepository,
    @inject(AIContentService) private aiService: AIContentService
  ) {}

  /**
   * Generate multiple pages in bulk
   */
  async generatePages(
    orgId: bigint,
    request: BulkPageGenerationRequest
  ): Promise<BulkPageGenerationResult> {
    const results: ContentPage[] = []
    const errors: { id: number; error: string }[] = []

    // Get the data for the selected items
    const items = await this.getItemsData(request.pageType, request.selectedIds)

    if (items.length === 0) {
      throw new ApiError('No valid items found for the selected IDs', { status: 400 })
    }

    // Generate pages for each item
    for (const item of items) {
      try {
        const page = await this.generateSinglePage(orgId, request.pageType, item, request)
        results.push(page)
      } catch (error: any) {
        console.error(`Error generating page for ${item.name}:`, error)
        errors.push({
          id: item.id,
          error: error.message || 'Failed to generate page'
        })
      }
    }

    return {
      generated: results.length,
      failed: errors.length,
      results,
      errors
    }
  }

  /**
   * Get data for the selected items based on page type
   */
  private async getItemsData(
    pageType: string,
    selectedIds: number[]
  ): Promise<Array<LocationData | PropertyTypeData>> {
    switch (pageType) {
      case 'city':
        return this.getCitiesData(selectedIds)
      case 'zipcode':
        return this.getZipCodesData(selectedIds)
      case 'neighborhood':
        return this.getNeighborhoodsData(selectedIds)
      case 'property_type':
        return this.getPropertyTypesData(selectedIds)
      default:
        throw new ApiError('Invalid page type', { status: 400 })
    }
  }

  /**
   * Get cities data
   */
  private async getCitiesData(ids: number[]): Promise<LocationData[]> {
    // This assumes you have a cities table or can query from listings
    const cities = await knex('listings')
      .select('city as name')
      .select(knex.raw('ROW_NUMBER() OVER (ORDER BY city) as id'))
      .whereIn('city', ids.map((id) => id.toString()))
      .groupBy('city')
      .limit(100)

    return cities.map((city: any) => ({
      id: city.id,
      name: city.name,
      type: 'city' as const
    }))
  }

  /**
   * Get zip codes data
   */
  private async getZipCodesData(ids: number[]): Promise<LocationData[]> {
    const zipCodes = await knex('listings')
      .select('postal_code as name')
      .select('city')
      .select(knex.raw('ROW_NUMBER() OVER (ORDER BY postal_code) as id'))
      .whereIn('postal_code', ids.map((id) => id.toString()))
      .groupBy('postal_code', 'city')
      .limit(100)

    return zipCodes.map((zip: any) => ({
      id: zip.id,
      name: zip.name,
      type: 'zipcode' as const,
      state: zip.city
    }))
  }

  /**
   * Get neighborhoods data
   */
  private async getNeighborhoodsData(ids: number[]): Promise<LocationData[]> {
    // Assuming you have neighborhood data in listings or a separate table
    const neighborhoods = await knex('listings')
      .select('area as name')
      .select('city')
      .select(knex.raw('ROW_NUMBER() OVER (ORDER BY area) as id'))
      .whereIn('area', ids.map((id) => id.toString()))
      .whereNotNull('area')
      .groupBy('area', 'city')
      .limit(100)

    return neighborhoods.map((n: any) => ({
      id: n.id,
      name: n.name,
      type: 'neighborhood' as const,
      state: n.city
    }))
  }

  /**
   * Get property types data
   */
  private async getPropertyTypesData(ids: number[]): Promise<PropertyTypeData[]> {
    // Common property types
    const propertyTypes = [
      { id: 1, name: 'Single Family Homes', slug: 'single-family' },
      { id: 2, name: 'Condos', slug: 'condos' },
      { id: 3, name: 'Townhomes', slug: 'townhomes' },
      { id: 4, name: 'Multi-Family', slug: 'multi-family' },
      { id: 5, name: 'Land', slug: 'land' },
      { id: 6, name: 'Commercial', slug: 'commercial' },
      { id: 7, name: 'Luxury Homes', slug: 'luxury' },
      { id: 8, name: 'New Construction', slug: 'new-construction' }
    ]

    return propertyTypes.filter((pt) => ids.includes(pt.id))
  }

  /**
   * Generate a single page
   */
  private async generateSinglePage(
    orgId: bigint,
    pageType: string,
    item: LocationData | PropertyTypeData,
    request: BulkPageGenerationRequest
  ): Promise<ContentPage> {
    // Determine the title and slug based on page type
    let title: string
    let slug: string
    let keyword: string

    if ('type' in item) {
      // Location-based page
      const location = item as LocationData
      switch (pageType) {
        case 'city':
          title = `Real Estate in ${location.name}`
          slug = `real-estate-${this.slugify(location.name)}`
          keyword = `real estate ${location.name}`
          break
        case 'zipcode':
          title = `Homes for Sale in ${location.name}`
          slug = `homes-for-sale-${location.name}`
          keyword = `homes for sale ${location.name}`
          break
        case 'neighborhood':
          title = `${location.name} Homes for Sale`
          slug = `${this.slugify(location.name)}-homes-for-sale`
          keyword = `${location.name} homes for sale`
          break
        default:
          throw new ApiError('Invalid page type', { status: 400 })
      }
    } else {
      // Property type page
      const propType = item as PropertyTypeData
      title = `${propType.name} for Sale`
      slug = `${propType.slug}-for-sale`
      keyword = `${propType.name} for sale`
    }

    // Use template if provided, otherwise generate with AI
    let content: any
    let metaTitle: string
    let metaDescription: string

    if (request.template) {
      // Use template and replace variables
      content = this.applyTemplate(request.template, item)
      metaTitle = title
      metaDescription = `Find ${title.toLowerCase()} with detailed listings, photos, and market insights.`
    } else {
      // Generate with AI
      const aiContent = await this.aiService.generatePageContent({
        pageType,
        keyword,
        location: 'type' in item ? (item as LocationData).name : undefined,
        propertyType: 'slug' in item ? (item as PropertyTypeData).name : undefined
      })

      content = aiContent.content
      metaTitle = aiContent.meta_title
      metaDescription = aiContent.meta_description
    }

    // Check if page already exists
    const existingPage = await this.pagesRepo.getPageBySlug(orgId, slug)
    if (existingPage) {
      throw new ApiError(`Page with slug "${slug}" already exists`, { status: 409 })
    }

    // Create the page
    const pageInput: CreateContentPageInput = {
      title,
      slug,
      content,
      status: request.autoPublish ? 'published' : 'draft',
      meta_title: metaTitle,
      meta_description: metaDescription,
      featured_image_url: null,
      is_template: false
    }

    const page = await this.pagesRepo.createPage(orgId, pageInput)

    // Auto-publish if requested
    if (request.autoPublish && page.status === 'draft') {
      return this.pagesRepo.publishPage(orgId, page.id)
    }

    return page
  }

  /**
   * Apply template to item data
   */
  private applyTemplate(template: string, item: LocationData | PropertyTypeData): any {
    // Replace template variables like {{name}}, {{city}}, etc.
    let processedTemplate = template

    if ('type' in item) {
      const location = item as LocationData
      processedTemplate = processedTemplate
        .replace(/\{\{name\}\}/g, location.name)
        .replace(/\{\{city\}\}/g, location.state || '')
        .replace(/\{\{type\}\}/g, location.type)
    } else {
      const propType = item as PropertyTypeData
      processedTemplate = processedTemplate
        .replace(/\{\{name\}\}/g, propType.name)
        .replace(/\{\{slug\}\}/g, propType.slug)
    }

    return {
      modules: [
        {
          type: 'rich_text',
          data: {
            content: processedTemplate
          }
        }
      ],
      sidebar: []
    }
  }

  /**
   * Generate slug from string
   */
  private slugify(text: string): string {
    return text
      .toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/--+/g, '-')
      .trim()
  }

  /**
   * Preview bulk generation (doesn't create pages)
   */
  async previewPages(
    request: BulkPageGenerationRequest
  ): Promise<Array<{ title: string; slug: string }>> {
    const items = await this.getItemsData(request.pageType, request.selectedIds)

    return items.map((item) => {
      let title: string
      let slug: string

      if ('type' in item) {
        const location = item as LocationData
        switch (request.pageType) {
          case 'city':
            title = `Real Estate in ${location.name}`
            slug = `real-estate-${this.slugify(location.name)}`
            break
          case 'zipcode':
            title = `Homes for Sale in ${location.name}`
            slug = `homes-for-sale-${location.name}`
            break
          case 'neighborhood':
            title = `${location.name} Homes for Sale`
            slug = `${this.slugify(location.name)}-homes-for-sale`
            break
          default:
            title = location.name
            slug = this.slugify(location.name)
        }
      } else {
        const propType = item as PropertyTypeData
        title = `${propType.name} for Sale`
        slug = `${propType.slug}-for-sale`
      }

      return { title, slug }
    })
  }
}
