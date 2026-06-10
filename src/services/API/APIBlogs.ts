import type { AISuggestions, Blog, BlogSuggestedTags } from '@/types/blog'

import APIBase from './APIBase'

interface BlogFilters {
  status?: 'draft' | 'published'
  search?: string
  tag?: string
  category?: string
  limit?: number
  offset?: number
}

interface BlogResponse {
  blog: Blog
  related?: Blog[]
}

interface BlogsListResponse {
  blogs: Blog[]
  total: number
}

export class APIBlogs extends APIBase {
  /**
   * Get published blogs
   */
  async getBlogs(filters?: BlogFilters): Promise<BlogsListResponse> {
    const params = new URLSearchParams()

    if (filters?.search) params.append('search', filters.search)
    if (filters?.tag) params.append('tag', filters.tag)
    if (filters?.category) params.append('category', filters.category)
    if (filters?.limit) params.append('limit', filters.limit.toString())
    if (filters?.offset) params.append('offset', filters.offset.toString())

    const queryString = params.toString()
    const url = queryString ? `/blogs?${queryString}` : '/blogs'

    return this.fetchJSON<BlogsListResponse>(url)
  }

  /**
   * Get featured blogs
   */
  async getFeaturedBlogs(): Promise<{ blogs: Blog[] }> {
    return this.fetchJSON<{ blogs: Blog[] }>('/blogs/featured')
  }

  /**
   * Get all tags
   */
  async getTags(): Promise<{ tags: any[] }> {
    return this.fetchJSON<{ tags: any[] }>('/blogs/tags')
  }

  /**
   * Get all categories
   */
  async getCategories(): Promise<{ categories: any[] }> {
    return this.fetchJSON<{ categories: any[] }>('/blogs/categories')
  }

  /**
   * Get blog by slug
   */
  async getBlogBySlug(slug: string): Promise<BlogResponse> {
    return this.fetchJSON<BlogResponse>(`/blogs/${slug}`)
  }

  /**
   * Get related blogs
   */
  async getRelatedBlogs(id: number): Promise<{ related: Blog[] }> {
    return this.fetchJSON<{ related: Blog[] }>(`/blogs/${id}/related`)
  }

  /**
   * Create blog (admin only)
   */
  async createBlog(
    blog: Omit<Blog, 'id' | 'created_at' | 'updated_at'>
  ): Promise<BlogResponse> {
    return this.fetchJSON<BlogResponse>('/blogs', {
      method: 'POST',
      body: JSON.stringify(blog)
    })
  }

  /**
   * Update blog (admin only)
   */
  async updateBlog(id: number, updates: Partial<Blog>): Promise<BlogResponse> {
    return this.fetchJSON<BlogResponse>(`/blogs/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(updates)
    })
  }

  /**
   * Publish blog (admin only)
   */
  async publishBlog(id: number): Promise<BlogResponse> {
    return this.fetchJSON<BlogResponse>(`/blogs/${id}/publish`, {
      method: 'POST',
      body: JSON.stringify({})
    })
  }

  /**
   * Delete blog (admin only)
   */
  async deleteBlog(id: number): Promise<{ success: boolean }> {
    return this.fetchJSON<{ success: boolean }>(`/blogs/${id}`, {
      method: 'DELETE'
    })
  }

  /**
   * Get all blogs for admin (draft + published)
   */
  async getAdminBlogs(filters?: BlogFilters): Promise<BlogsListResponse> {
    const params = new URLSearchParams()

    if (filters?.search) params.append('search', filters.search)
    if (filters?.tag) params.append('tag', filters.tag)
    if (filters?.category) params.append('category', filters.category)
    if (filters?.limit) params.append('limit', filters.limit.toString())
    if (filters?.offset) params.append('offset', filters.offset.toString())

    const queryString = params.toString()
    const url = queryString
      ? `/blogs/admin/all?${queryString}`
      : '/blogs/admin/all'

    return this.fetchJSON<BlogsListResponse>(url)
  }

  /**
   * Get blog for editing
   */
  async getAdminBlog(id: number): Promise<BlogResponse> {
    return this.fetchJSON<BlogResponse>(`/blogs/admin/${id}`)
  }

  /**
   * Generate AI suggestions for meta and tags
   */
  async generateAISuggestions(
    title: string,
    description: string,
    content: string
  ): Promise<{ suggestions: AISuggestions }> {
    return this.fetchJSON<{ suggestions: AISuggestions }>(
      '/blogs/ai/suggestions',
      {
        method: 'POST',
        body: JSON.stringify({ title, description, content })
      }
    )
  }

  /**
   * Re-run AI auto-tagging (Track 3). Returns the freshly computed
   * structured suggestion plus the refreshed blog.
   */
  async runAutoTag(id: number): Promise<{
    result: {
      structured: BlogSuggestedTags
      flatTags: string[]
      meta: Record<string, unknown>
    }
    blog: Blog
  }> {
    return this.fetchJSON(`/blogs/admin/${id}/auto-tag`, {
      method: 'POST',
      body: JSON.stringify({})
    })
  }

  /**
   * Apply admin decisions on the latest AI suggestions. Accepted tags merge
   * into blog.tags; rejected tags are stored so future AI runs won't
   * re-propose them.
   */
  async applyAutoTagDecisions(
    id: number,
    decisions: { accepted: string[]; rejected: string[] }
  ): Promise<BlogResponse> {
    return this.fetchJSON<BlogResponse>(`/blogs/admin/${id}/auto-tag/apply`, {
      method: 'POST',
      body: JSON.stringify(decisions)
    })
  }
}

export default new APIBlogs()
