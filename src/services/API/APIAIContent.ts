import APIBase from './APIBase'

export interface AIBlogPostRequest {
  keyword: string
  city?: string
  tone?: string
  length?: number
}

export interface AIBlogPostResponse {
  title: string
  excerpt: string
  content: string
  meta_title: string
  meta_description: string
  meta_keywords: string[]
  tags: string[]
}

export interface AIKeywordSuggestion {
  keyword: string
  searchVolume: string
  difficulty: string
  intent: string
  relevance: number
}

export interface AIPageContentRequest {
  pageType: string
  keyword: string
  location?: string
  propertyType?: string
  tone?: string
}

export interface AIPageContentResponse {
  content: {
    modules: Array<{
      type: string
      data: Record<string, any>
    }>
    sidebar: Array<{
      type: string
      data: Record<string, any>
    }>
  }
  meta_title: string
  meta_description: string
  meta_keywords: string[]
  structured_data?: Record<string, any>
}

export interface BulkPageGenerationRequest {
  pageType: 'city' | 'zipcode' | 'neighborhood' | 'property_type'
  selectedIds: number[]
  template?: string
  autoPublish?: boolean
}

export interface BulkPagePreview {
  title: string
  slug: string
}

export interface BulkPageGenerationResult {
  generated: number
  failed: number
  results: Array<{
    id: string
    title: string
    slug: string
  }>
  errors: Array<{
    id: number
    error: string
  }>
}

export interface CityLocation {
  id: number
  name: string
  county: string
}

export interface ZipLocation {
  id: number
  zip: string
  city: string
  county: string
}

export interface NeighborhoodLocation {
  id: number
  name: string
  city: string
  county: string
}

class APIAIContent extends APIBase {
  /**
   * Generate a blog post with AI
   */
  async generateBlogPost(request: AIBlogPostRequest): Promise<AIBlogPostResponse> {
    return this.fetchJSON<AIBlogPostResponse>('/ai-content/blog', {
      method: 'POST',
      body: JSON.stringify(request)
    })
  }

  /**
   * Suggest keywords for a topic
   */
  async suggestKeywords(topic: string, city?: string): Promise<AIKeywordSuggestion[]> {
    const response = await this.fetchJSON<{ keywords: AIKeywordSuggestion[] }>(
      '/ai-content/keywords',
      {
        method: 'POST',
        body: JSON.stringify({ topic, city })
      }
    )
    return response.keywords
  }

  /**
   * Generate page content with AI
   */
  async generatePageContent(request: AIPageContentRequest): Promise<AIPageContentResponse> {
    return this.fetchJSON<AIPageContentResponse>('/ai-content/page', {
      method: 'POST',
      body: JSON.stringify(request)
    })
  }

  /**
   * Generate multiple pages with AI in batch
   */
  async generateBatchContent(
    requests: AIPageContentRequest[]
  ): Promise<AIPageContentResponse[]> {
    const response = await this.fetchJSON<{ results: AIPageContentResponse[] }>(
      '/ai-content/batch',
      {
        method: 'POST',
        body: JSON.stringify({ requests })
      }
    )
    return response.results
  }

  /**
   * Preview bulk page generation
   */
  async previewBulkPages(request: BulkPageGenerationRequest): Promise<BulkPagePreview[]> {
    const response = await this.fetchJSON<{ preview: BulkPagePreview[] }>(
      '/ai-content/bulk-pages/preview',
      {
        method: 'POST',
        body: JSON.stringify(request)
      }
    )
    return response.preview
  }

  /**
   * Generate pages in bulk
   */
  async generateBulkPages(request: BulkPageGenerationRequest): Promise<BulkPageGenerationResult> {
    return this.fetchJSON<BulkPageGenerationResult>('/ai-content/bulk-pages/generate', {
      method: 'POST',
      body: JSON.stringify(request)
    })
  }

  /**
   * List Broward + Palm Beach cities from Repliers (for the bulk-pages picker).
   */
  async getLocationCities(): Promise<CityLocation[]> {
    const response = await this.fetchJSON<{ cities: CityLocation[] }>(
      '/ai-content/locations/cities'
    )
    return response.cities
  }

  /**
   * List zip codes in the target counties.
   */
  async getLocationZipCodes(): Promise<ZipLocation[]> {
    const response = await this.fetchJSON<{ zipcodes: ZipLocation[] }>(
      '/ai-content/locations/zipcodes'
    )
    return response.zipcodes
  }

  /**
   * List neighborhoods (optionally filtered by parent city) in the target
   * counties.
   */
  async getLocationNeighborhoods(
    city?: string
  ): Promise<NeighborhoodLocation[]> {
    const qs = city ? `?city=${encodeURIComponent(city)}` : ''
    const response = await this.fetchJSON<{
      neighborhoods: NeighborhoodLocation[]
    }>(`/ai-content/locations/neighborhoods${qs}`)
    return response.neighborhoods
  }
}

const apiAIContentInstance = new APIAIContent()
export default apiAIContentInstance
