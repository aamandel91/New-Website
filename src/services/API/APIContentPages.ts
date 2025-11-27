import APIBase from './APIBase'

export interface ContentModule {
  type: string
  data: Record<string, any>
}

export interface ContentPageContent {
  modules: ContentModule[]
  sidebar: ContentModule[]
}

export interface ContentPage {
  id: string
  org_id: string
  title: string
  slug: string
  content: ContentPageContent
  status: string
  meta_title: string | null
  meta_description: string | null
  meta_keywords: string[]
  featured_image_url: string | null
  featured_image_cloudinary_id: string | null
  robots: string
  canonical_url: string | null
  structured_data: Record<string, any> | null
  is_template: boolean
  template_name: string | null
  published_at: string | null
  created_at: string
  updated_at: string
}

export interface CreateContentPageInput {
  title: string
  slug?: string
  content?: ContentPageContent
  status?: string
  meta_title?: string
  meta_description?: string
  meta_keywords?: string[]
  featured_image_url?: string
  robots?: string
  canonical_url?: string
  structured_data?: Record<string, any>
  is_template?: boolean
  template_name?: string
}

export interface UpdateContentPageInput {
  title?: string
  slug?: string
  content?: ContentPageContent
  status?: string
  meta_title?: string
  meta_description?: string
  meta_keywords?: string[]
  featured_image_url?: string
  robots?: string
  canonical_url?: string
  structured_data?: Record<string, any>
  is_template?: boolean
  template_name?: string
}

export interface ContentPageFilters {
  status?: string
  is_template?: boolean
}

export interface ContentPagesResponse {
  pages: ContentPage[]
}

class APIContentPages extends APIBase {
  /**
   * Get content pages with filtering
   */
  async getPages(filters?: ContentPageFilters): Promise<ContentPagesResponse> {
    const params = new URLSearchParams()

    if (filters?.status) params.append('status', filters.status)
    if (filters?.is_template !== undefined) params.append('is_template', filters.is_template.toString())

    const queryString = params.toString()
    const url = queryString ? `/content-pages?${queryString}` : '/content-pages'

    return this.fetchJSON<ContentPagesResponse>(url)
  }

  /**
   * Get page templates
   */
  async getTemplates(): Promise<ContentPage[]> {
    const response = await this.fetchJSON<{ templates: ContentPage[] }>('/content-pages/templates')
    return response.templates
  }

  /**
   * Get page by ID
   */
  async getPageById(id: string): Promise<ContentPage> {
    const response = await this.fetchJSON<{ page: ContentPage }>(`/content-pages/${id}`)
    return response.page
  }

  /**
   * Get page by slug
   */
  async getPageBySlug(slug: string): Promise<ContentPage> {
    const response = await this.fetchJSON<{ page: ContentPage }>(`/content-pages/slug/${slug}`)
    return response.page
  }

  /**
   * Create page
   */
  async createPage(data: CreateContentPageInput): Promise<ContentPage> {
    const response = await this.fetchJSON<{ page: ContentPage }>('/content-pages', {
      method: 'POST',
      body: JSON.stringify(data)
    })
    return response.page
  }

  /**
   * Update page
   */
  async updatePage(id: string, data: UpdateContentPageInput): Promise<ContentPage> {
    const response = await this.fetchJSON<{ page: ContentPage }>(`/content-pages/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data)
    })
    return response.page
  }

  /**
   * Delete page
   */
  async deletePage(id: string): Promise<{ success: boolean }> {
    return this.fetchJSON<{ success: boolean }>(`/content-pages/${id}`, {
      method: 'DELETE'
    })
  }

  /**
   * Publish page
   */
  async publishPage(id: string): Promise<ContentPage> {
    const response = await this.fetchJSON<{ page: ContentPage }>(`/content-pages/${id}/publish`, {
      method: 'POST'
    })
    return response.page
  }

  /**
   * Duplicate page from template
   */
  async duplicateFromTemplate(templateId: string, title: string): Promise<ContentPage> {
    const response = await this.fetchJSON<{ page: ContentPage }>(
      `/content-pages/${templateId}/duplicate`,
      {
        method: 'POST',
        body: JSON.stringify({ title })
      }
    )
    return response.page
  }
}

const apiContentPagesInstance = new APIContentPages()
export default apiContentPagesInstance
