export interface ContentPage {
  id: bigint
  org_id: bigint
  title: string
  slug: string
  content: ContentPageContent
  status: string
  featured_image_url: string | null
  featured_image_cloudinary_id: string | null
  is_template: boolean
  template_name: string | null
  parent_page_id: bigint | null
  category: string | null
  meta_title: string | null
  meta_description: string | null
  meta_keywords: string[]
  robots: string
  custom_css: string | null
  custom_js: string | null
  published_at: Date | null
  created_at: Date
  updated_at: Date
}

export interface ContentPageContent {
  modules: ContentModule[]
  sidebar: SidebarSection[]
}

export interface ContentModule {
  id: string
  type: ModuleType
  config: Record<string, any>
}

export type ModuleType =
  | 'rich_text'
  | 'statistics'
  | 'videos_grid'
  | 'single_video'
  | 'links'
  | 'contact_form'
  | 'contact_details'
  | 'team_members'
  | 'testimonials'
  | 'blog_posts'
  | 'saved_search_listings'
  | 'mortgage_calculator'
  | 'seller_tool'

export interface SidebarSection {
  id: string
  type: SidebarType
  config: Record<string, any>
}

export type SidebarType =
  | 'contact_form'
  | 'featured_properties'
  | 'recent_listings'
  | 'market_stats'
  | 'neighborhoods'
  | 'quick_links'
  | 'search_widget'
  | 'custom_html'

export interface CreateContentPageInput {
  title: string
  slug?: string
  content?: ContentPageContent
  status?: string
  featured_image_url?: string
  featured_image_cloudinary_id?: string
  is_template?: boolean
  template_name?: string
  parent_page_id?: bigint
  category?: string
  meta_title?: string
  meta_description?: string
  meta_keywords?: string[]
  robots?: string
  custom_css?: string
  custom_js?: string
}

export interface UpdateContentPageInput {
  title?: string
  slug?: string
  content?: ContentPageContent
  status?: string
  featured_image_url?: string
  featured_image_cloudinary_id?: string
  is_template?: boolean
  template_name?: string
  parent_page_id?: bigint
  category?: string
  meta_title?: string
  meta_description?: string
  meta_keywords?: string[]
  robots?: string
  custom_css?: string
  custom_js?: string
  published_at?: Date
}

export interface ContentPageFilters {
  status?: string
  category?: string
  is_template?: boolean
  search?: string
  limit?: number
  offset?: number
}
