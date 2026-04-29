import { injectable, inject } from 'tsyringe'
import { ContentPagesRepository } from '../repository/contentPages.js'
import { AIContentService } from './aiContent.js'
import { RepliersLocationsService } from './repliersLocations.js'
import type {
  CreateContentPageInput,
  ContentPage
} from '../types/contentPage.js'
import type {
  BulkPageGenerationRequest,
  BulkPageGenerationResult,
  CrossProductGenerationRequest,
  CrossProductGenerationResult
} from '../types/aiContent.js'
import { ApiError } from '../lib/errors.js'

interface LocationData {
  id: number
  name: string
  type: 'city' | 'zipcode' | 'neighborhood'
  /** For zipcodes/neighborhoods: the parent city name. */
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
    @inject(AIContentService) private aiService: AIContentService,
    @inject(RepliersLocationsService)
    private locationsService: RepliersLocationsService
  ) {}

  /**
   * Generate multiple pages in bulk
   */
  async generatePages(
    orgId: bigint,
    request: BulkPageGenerationRequest
  ): Promise<BulkPageGenerationResult> {
    const created: ContentPage[] = []
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
        created.push(page)
      } catch (error: any) {
        console.error(`Error generating page for ${item.name}:`, error)
        errors.push({
          id: item.id,
          error: error.message || 'Failed to generate page'
        })
      }
    }

    return {
      generated: created.length,
      failed: errors.length,
      results: created.map((p) => ({
        id: String(p.id),
        title: p.title,
        slug: p.slug
      })),
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
   * Get cities data from the Repliers Locations API.
   * Listings live in Repliers — not a local DB — so we fetch the canonical
   * Broward + Palm Beach city list there and match against the IDs the
   * UI passed in.
   */
  private async getCitiesData(ids: number[]): Promise<LocationData[]> {
    const cities = await this.locationsService.getCitiesByIds(ids)
    return cities.map((c) => ({
      id: c.id,
      name: c.name,
      type: 'city' as const,
      county: c.county,
    }))
  }

  /**
   * Get zip codes data from the Repliers Locations API.
   */
  private async getZipCodesData(ids: number[]): Promise<LocationData[]> {
    const zips = await this.locationsService.getZipCodesByIds(ids)
    return zips.map((z) => ({
      id: z.id,
      name: z.zip,
      type: 'zipcode' as const,
      state: z.city, // parent city (existing field name reused)
      county: z.county,
    }))
  }

  /**
   * Get neighborhoods data from the Repliers Locations API.
   */
  private async getNeighborhoodsData(ids: number[]): Promise<LocationData[]> {
    const neighborhoods = await this.locationsService.getNeighborhoodsByIds(ids)
    return neighborhoods.map((n) => ({
      id: n.id,
      name: n.name,
      type: 'neighborhood' as const,
      state: n.city,
      county: n.county,
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
      // Generate with AI. Build the request without spreading undefineds so
      // we stay compatible with `exactOptionalPropertyTypes: true`.
      const aiRequest: import('../types/aiContent.js').AIPageContentRequest = {
        pageType,
        keyword,
      }
      if ('type' in item) aiRequest.location = (item as LocationData).name
      if ('slug' in item) aiRequest.propertyType = (item as PropertyTypeData).name
      const aiContent = await this.aiService.generatePageContent(aiRequest)

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
   * Generate one CMS page per (city, subtype) combination.
   *
   * Slug pattern: `{citySlug}/{subtypeSlug}` — must match what
   * SEOCoverageMap reads back from the page list and what the public
   * `[...slugs]` route expects.
   *
   * Idempotent: if a page with the target slug already exists for this
   * org, the combo is reported as `skipped` and not regenerated.
   */
  async generateCrossProductPages(
    orgId: bigint,
    request: CrossProductGenerationRequest
  ): Promise<CrossProductGenerationResult> {
    const combinations = request.combinations || []
    if (combinations.length === 0) {
      throw new ApiError('At least one combination is required', { status: 400 })
    }

    const result: CrossProductGenerationResult = {
      generated: 0,
      skipped: 0,
      failed: [],
      pages: []
    }

    for (const combo of combinations) {
      const city = (combo.city || '').trim()
      const subtype = (combo.subtype || '').trim()
      if (!city || !subtype) {
        result.failed.push({
          city: combo.city || '',
          subtype: combo.subtype || '',
          error: 'Missing city or subtype'
        })
        continue
      }

      const citySlug = this.slugify(city)
      const subtypeSlug = this.slugify(subtype)
      const slug = `${citySlug}/${subtypeSlug}`
      const subtypeLabel = combo.subtypeLabel || this.titleize(subtype)
      const title = `${subtypeLabel} in ${city}`

      try {
        const existing = await this.pagesRepo.getPageBySlug(orgId, slug)
        if (existing) {
          result.skipped += 1
          result.pages.push({
            id: String(existing.id),
            slug: existing.slug,
            city,
            subtype: subtypeSlug,
            status: 'skipped'
          })
          continue
        }

        const aiContent = await this.aiService.generatePageContent({
          pageType: 'city_subtype',
          keyword: `${subtypeLabel} in ${city}, FL`,
          location: combo.county ? `${city}, ${combo.county} County, FL` : `${city}, FL`,
          propertyType: subtypeLabel
        })

        // Default to draft so a human can review AI-generated SEO copy
        // before it goes live. autoPublish is opt-in (mirrors single-axis).
        const pageInput: CreateContentPageInput = {
          title,
          slug,
          content: aiContent.content as any,
          status: request.autoPublish ? 'published' : 'draft',
          meta_title: aiContent.meta_title,
          meta_description: aiContent.meta_description,
          meta_keywords: aiContent.meta_keywords,
          is_template: false
        }
        const page = await this.pagesRepo.createPage(orgId, pageInput)

        let finalPage = page
        if (request.autoPublish && page.status === 'draft') {
          finalPage = await this.pagesRepo.publishPage(orgId, page.id)
        }

        result.generated += 1
        result.pages.push({
          id: String(finalPage.id),
          slug: finalPage.slug,
          city,
          subtype: subtypeSlug,
          status: finalPage.status === 'published' ? 'published' : 'draft'
        })
      } catch (error: any) {
        console.error(
          `Error generating cross-product page for ${city}/${subtypeSlug}:`,
          error
        )
        result.failed.push({
          city,
          subtype: subtypeSlug,
          error: error?.message || 'Failed to generate page'
        })
      }
    }

    return result
  }

  /** "single-family-homes" → "Single Family Homes" */
  private titleize(slug: string): string {
    return slug
      .split('-')
      .map((w) => (w.length === 0 ? w : w[0]!.toUpperCase() + w.slice(1)))
      .join(' ')
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
