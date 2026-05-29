export type BlogStatus = 'draft' | 'published'

export interface BlogSuggestedTags {
  cities: string[]
  neighborhoods: string[]
  counties: string[]
  topics: string[]
  audience: string[]
  seasonality: string[]
  reasoning?: string
  model: string
  ran_at: string
  input_tokens: number
  output_tokens: number
  truncated: boolean
  input_size_bytes: number
  ok: boolean
  error?: string
}

export interface Blog {
  id: number
  slug: string
  title: string
  description: string
  content: string // Markdown
  featured_image_url: string | null
  featured_image_cloudinary_id: string | null
  author_email: string
  status: BlogStatus
  tags: string[]
  categories: string[]

  // SEO
  meta_title: string | null
  meta_description: string | null
  meta_keywords: string[]

  // AI flags
  ai_suggested_meta: boolean
  ai_suggested_tags: boolean

  // Auto-tagging (Track 3)
  suggested_tags: BlogSuggestedTags | null
  rejected_tags: string[]
  auto_tagged_at: string | null

  published_at: Date | null
  created_at: Date
  updated_at: Date
}

export interface AISuggestions {
  meta_title: string
  meta_description: string
  meta_keywords: string[]
  tags: string[]
}

export interface BlogTag {
  id: number
  name: string
  slug: string
  usage_count: number
  created_at: Date
}

export interface BlogCategory {
  id: number
  name: string
  slug: string
  description: string | null
  usage_count: number
  created_at: Date
}
