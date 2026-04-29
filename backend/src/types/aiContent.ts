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
  searchVolume: number
  difficulty: number
  opportunityScore: number
  relatedKeywords: string[]
}

export interface AIPageContentRequest {
  pageType: string
  keyword: string
  location?: string
  propertyType?: string
  tone?: string
}

/**
 * Module of structured page content (matches the shape used by the CMS
 * ContentPage so AI-generated output can be saved directly as a page).
 */
export interface AIContentModule {
  type: string
  data: Record<string, any>
}

export interface AIPageContentResponse {
  content: {
    modules: AIContentModule[]
    sidebar: AIContentModule[]
  }
  meta_title: string
  meta_description: string
  meta_keywords: string[]
  structured_data?: Record<string, any>
}

export interface BulkPageGenerationRequest {
  pageType: 'city' | 'zipcode' | 'neighborhood' | 'property_type' | 'school_district'
  selectedIds: number[]
  template?: string
  autoPublish?: boolean
}

export interface BulkPageGenerationResponse {
  total: number
  created: number
  failed: number
  pages: {
    id: bigint
    title: string
    slug: string
    status: string
  }[]
  errors: string[]
}
