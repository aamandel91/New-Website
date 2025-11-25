export type BlogStatus = 'draft' | 'published'

export interface Blog {
  id: bigint
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

  published_at: Date | null
  created_at: Date
  updated_at: Date
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

export interface CreateBlogInput {
  title: string
  description: string
  content: string
  featured_image_url?: string
  featured_image_cloudinary_id?: string
  author_email: string
  status: BlogStatus
  tags?: string[]
  categories?: string[]
  meta_title?: string
  meta_description?: string
  meta_keywords?: string[]
  published_at?: Date | null
}

export interface UpdateBlogInput extends Partial<CreateBlogInput> {
  id: bigint
}

export interface BlogFilters {
  status?: BlogStatus
  author_email?: string
  tag?: string
  category?: string
  search?: string
  limit?: number
  offset?: number
}

export interface AISuggestions {
  meta_title: string
  meta_description: string
  meta_keywords: string[]
  tags: string[]
}
