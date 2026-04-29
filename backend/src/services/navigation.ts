import { injectable, inject } from 'tsyringe'
import { NavigationRepository } from '../repository/navigation.js'
import type {
  NavigationItem,
  CreateNavigationItemInput,
  UpdateNavigationItemInput,
  NavigationFilters
} from '../types/navigation.js'
import { ApiError } from '../lib/errors.js'

@injectable()
export class NavigationService {
  constructor(@inject(NavigationRepository) private navRepo: NavigationRepository) {}

  /**
   * Create a new navigation item
   */
  async createItem(orgId: bigint, input: CreateNavigationItemInput): Promise<NavigationItem> {
    // Validate label
    if (!input.label) {
      throw new ApiError('Label is required', { status: 400 })
    }

    // Validate type
    const validTypes = ['internal', 'external', 'dropdown', 'mega_menu']
    if (input.type && !validTypes.includes(input.type)) {
      throw new ApiError('Invalid navigation type', { status: 400 })
    }

    // Validate position
    const validPositions = ['left', 'right', 'mobile', 'footer']
    if (input.position && !validPositions.includes(input.position)) {
      throw new ApiError('Invalid navigation position', { status: 400 })
    }

    // For non-dropdown types, URL is required
    if (input.type !== 'dropdown' && input.type !== 'mega_menu' && !input.url) {
      throw new ApiError('URL is required for this navigation type', { status: 400 })
    }

    return this.navRepo.createItem(orgId, input)
  }

  /**
   * Update a navigation item
   */
  async updateItem(
    orgId: bigint,
    id: bigint,
    input: UpdateNavigationItemInput
  ): Promise<NavigationItem> {
    const existing = await this.navRepo.getItemById(orgId, id)

    if (!existing) {
      throw new ApiError('Navigation item not found', { status: 404 })
    }

    // Validate type if provided
    if (input.type) {
      const validTypes = ['internal', 'external', 'dropdown', 'mega_menu']
      if (!validTypes.includes(input.type)) {
        throw new ApiError('Invalid navigation type', { status: 400 })
      }
    }

    // Validate position if provided
    if (input.position) {
      const validPositions = ['left', 'right', 'mobile', 'footer']
      if (!validPositions.includes(input.position)) {
        throw new ApiError('Invalid navigation position', { status: 400 })
      }
    }

    return this.navRepo.updateItem(orgId, id, input)
  }

  /**
   * Get navigation item by ID
   */
  async getItemById(orgId: bigint, id: bigint): Promise<NavigationItem | null> {
    return this.navRepo.getItemById(orgId, id)
  }

  /**
   * Get navigation items with filtering
   */
  async getItems(orgId: bigint, filters: NavigationFilters = {}): Promise<NavigationItem[]> {
    return this.navRepo.getItems(orgId, filters)
  }

  /**
   * Delete a navigation item
   */
  async deleteItem(orgId: bigint, id: bigint): Promise<boolean> {
    const item = await this.navRepo.getItemById(orgId, id)

    if (!item) {
      throw new ApiError('Navigation item not found', { status: 404 })
    }

    return this.navRepo.deleteItem(orgId, id)
  }

  /**
   * Reorder navigation items
   */
  async reorderItems(
    orgId: bigint,
    position: string,
    itemIds: bigint[]
  ): Promise<NavigationItem[]> {
    // Validate position
    const validPositions = ['left', 'right', 'mobile', 'footer']
    if (!validPositions.includes(position)) {
      throw new ApiError('Invalid navigation position', { status: 400 })
    }

    // Validate all items exist and belong to this org
    const items = await this.navRepo.getItems(orgId, { position })
    const existingIds = items.map((item) => item.id)

    for (const id of itemIds) {
      if (!existingIds.includes(id)) {
        throw new ApiError(`Navigation item ${id} not found in position ${position}`, {
          status: 404
        })
      }
    }

    await this.navRepo.reorderItems(orgId, itemIds)
    return this.navRepo.getItems(orgId, { position })
  }

  /**
   * Duplicate a navigation item
   */
  async duplicateItem(orgId: bigint, id: bigint): Promise<NavigationItem> {
    const item = await this.navRepo.getItemById(orgId, id)

    if (!item) {
      throw new ApiError('Navigation item not found', { status: 404 })
    }

    const input: CreateNavigationItemInput = {
      label: `${item.label} (Copy)`,
      type: item.type,
      position: item.position,
      visible: item.visible,
      order_index: item.order_index,
      dropdown_items: item.dropdown_items,
      target: item.target
    }
    if (item.url !== null) input.url = item.url
    if (item.icon !== null) input.icon = item.icon
    if (item.css_classes !== null) input.css_classes = item.css_classes

    return this.navRepo.createItem(orgId, input)
  }

  /**
   * Toggle visibility of a navigation item
   */
  async toggleVisibility(orgId: bigint, id: bigint): Promise<NavigationItem> {
    const item = await this.navRepo.getItemById(orgId, id)

    if (!item) {
      throw new ApiError('Navigation item not found', { status: 404 })
    }

    return this.navRepo.updateItem(orgId, id, {
      visible: !item.visible
    })
  }
}
