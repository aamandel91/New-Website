import APIBase from './APIBase'

export interface DropdownItem {
  label: string
  url: string
  page_id: string | null
  open_new_tab: boolean
}

export interface MegaMenuConfig {
  columns: Array<{
    title: string
    items: DropdownItem[]
  }>
}

export interface NavigationItem {
  id: string
  org_id: string
  label: string
  type: string
  url: string | null
  page_id: string | null
  position: string
  icon: string | null
  dropdown_items: DropdownItem[]
  mega_menu_config: MegaMenuConfig | null
  order_index: number
  is_visible: boolean
  open_new_tab: boolean
  created_at: string
  updated_at: string
}

export interface CreateNavigationItemInput {
  label: string
  type: string
  url?: string
  page_id?: string
  position: string
  icon?: string
  dropdown_items?: DropdownItem[]
  mega_menu_config?: MegaMenuConfig
  is_visible?: boolean
  open_new_tab?: boolean
}

export interface UpdateNavigationItemInput {
  label?: string
  type?: string
  url?: string
  page_id?: string
  position?: string
  icon?: string
  dropdown_items?: DropdownItem[]
  mega_menu_config?: MegaMenuConfig
  is_visible?: boolean
  open_new_tab?: boolean
}

export interface NavigationFilters {
  position?: string
  is_visible?: boolean
}

export interface NavigationItemsResponse {
  items: NavigationItem[]
}

class APINavigation extends APIBase {
  /**
   * Get navigation items with filtering
   */
  async getItems(
    filters?: NavigationFilters
  ): Promise<NavigationItemsResponse> {
    const params = new URLSearchParams()

    if (filters?.position) params.append('position', filters.position)
    if (filters?.is_visible !== undefined)
      params.append('is_visible', filters.is_visible.toString())

    const queryString = params.toString()
    const url = queryString ? `/navigation?${queryString}` : '/navigation'

    return this.fetchJSON<NavigationItemsResponse>(url)
  }

  /**
   * Get navigation item by ID
   */
  async getItemById(id: string): Promise<NavigationItem> {
    const response = await this.fetchJSON<{ item: NavigationItem }>(
      `/navigation/${id}`
    )
    return response.item
  }

  /**
   * Create navigation item
   */
  async createItem(data: CreateNavigationItemInput): Promise<NavigationItem> {
    const response = await this.fetchJSON<{ item: NavigationItem }>(
      '/navigation',
      {
        method: 'POST',
        body: JSON.stringify(data)
      }
    )
    return response.item
  }

  /**
   * Update navigation item
   */
  async updateItem(
    id: string,
    data: UpdateNavigationItemInput
  ): Promise<NavigationItem> {
    const response = await this.fetchJSON<{ item: NavigationItem }>(
      `/navigation/${id}`,
      {
        method: 'PATCH',
        body: JSON.stringify(data)
      }
    )
    return response.item
  }

  /**
   * Delete navigation item
   */
  async deleteItem(id: string): Promise<{ success: boolean }> {
    return this.fetchJSON<{ success: boolean }>(`/navigation/${id}`, {
      method: 'DELETE'
    })
  }

  /**
   * Reorder navigation items
   */
  async reorderItems(
    position: string,
    itemIds: string[]
  ): Promise<NavigationItem[]> {
    const response = await this.fetchJSON<{ items: NavigationItem[] }>(
      '/navigation/reorder',
      {
        method: 'POST',
        body: JSON.stringify({ position, itemIds })
      }
    )
    return response.items
  }

  /**
   * Duplicate navigation item
   */
  async duplicateItem(id: string): Promise<NavigationItem> {
    const response = await this.fetchJSON<{ item: NavigationItem }>(
      `/navigation/${id}/duplicate`,
      {
        method: 'POST'
      }
    )
    return response.item
  }

  /**
   * Toggle visibility of navigation item
   */
  async toggleVisibility(id: string): Promise<NavigationItem> {
    const response = await this.fetchJSON<{ item: NavigationItem }>(
      `/navigation/${id}/toggle-visibility`,
      {
        method: 'POST'
      }
    )
    return response.item
  }
}

const apiNavigationInstance = new APINavigation()
export default apiNavigationInstance
