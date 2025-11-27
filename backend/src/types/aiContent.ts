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
  template: string
  variables: Record<string, string>
  pageType: string
}

export interface AIPageContentResponse {
  title: string
  content: string
  meta_title: string
  meta_description: string
  meta_keywords: string[]
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
