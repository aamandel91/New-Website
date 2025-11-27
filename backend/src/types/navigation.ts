export interface NavigationItem {
  id: bigint
  org_id: bigint
  label: string
  type: string
  url: string | null
  icon: string | null
  position: string
  dropdown_items: DropdownItem[]
  target: string
  css_classes: string | null
  visible: boolean
  order_index: number
  created_at: Date
  updated_at: Date
}

export interface DropdownItem {
  label: string
  url: string
  icon?: string
  target?: string
}

export interface CreateNavigationItemInput {
  label: string
  type: string
  url?: string
  icon?: string
  position: string
  dropdown_items?: DropdownItem[]
  target?: string
  css_classes?: string
  visible?: boolean
  order_index?: number
}

export interface UpdateNavigationItemInput {
  label?: string
  type?: string
  url?: string
  icon?: string
  position?: string
  dropdown_items?: DropdownItem[]
  target?: string
  css_classes?: string
  visible?: boolean
  order_index?: number
}

export interface NavigationFilters {
  position?: string
  visible?: boolean
}
