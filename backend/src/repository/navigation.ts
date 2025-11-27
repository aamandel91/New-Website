import { injectable, inject } from 'tsyringe'
import type { Knex } from 'knex'
import type {
  NavigationItem,
  CreateNavigationItemInput,
  UpdateNavigationItemInput,
  NavigationFilters
} from '../types/navigation.js'

@injectable()
export class NavigationRepository {
  constructor(@inject('db') private db: Knex) {}

  /**
   * Create a navigation item
   */
  async createItem(orgId: bigint, input: CreateNavigationItemInput): Promise<NavigationItem> {
    const now = new Date()

    const [item] = await this.db('navigation_items')
      .insert({
        org_id: orgId,
        label: input.label,
        type: input.type,
        url: input.url || null,
        icon: input.icon || null,
        position: input.position,
        dropdown_items: JSON.stringify(input.dropdown_items || []),
        target: input.target || '_self',
        css_classes: input.css_classes || null,
        visible: input.visible !== undefined ? input.visible : true,
        order_index: input.order_index || 0,
        created_at: now,
        updated_at: now
      })
      .returning('*')

    return this.formatItem(item)
  }

  /**
   * Update a navigation item
   */
  async updateItem(
    orgId: bigint,
    id: bigint,
    input: UpdateNavigationItemInput
  ): Promise<NavigationItem> {
    const updateData: any = {
      updated_at: new Date()
    }

    if (input.label !== undefined) updateData.label = input.label
    if (input.type !== undefined) updateData.type = input.type
    if (input.url !== undefined) updateData.url = input.url
    if (input.icon !== undefined) updateData.icon = input.icon
    if (input.position !== undefined) updateData.position = input.position
    if (input.dropdown_items !== undefined)
      updateData.dropdown_items = JSON.stringify(input.dropdown_items)
    if (input.target !== undefined) updateData.target = input.target
    if (input.css_classes !== undefined) updateData.css_classes = input.css_classes
    if (input.visible !== undefined) updateData.visible = input.visible
    if (input.order_index !== undefined) updateData.order_index = input.order_index

    const [item] = await this.db('navigation_items')
      .where({ id, org_id: orgId })
      .update(updateData)
      .returning('*')

    return this.formatItem(item)
  }

  /**
   * Get item by ID
   */
  async getItemById(orgId: bigint, id: bigint): Promise<NavigationItem | null> {
    const item = await this.db('navigation_items').where({ id, org_id: orgId }).first()

    return item ? this.formatItem(item) : null
  }

  /**
   * Get items with filtering
   */
  async getItems(orgId: bigint, filters: NavigationFilters = {}): Promise<NavigationItem[]> {
    let query = this.db('navigation_items').where({ org_id: orgId })

    if (filters.position) {
      query = query.where({ position: filters.position })
    }

    if (filters.visible !== undefined) {
      query = query.where({ visible: filters.visible })
    }

    const items = await query.orderBy('order_index', 'asc')

    return items.map((item) => this.formatItem(item))
  }

  /**
   * Delete an item
   */
  async deleteItem(orgId: bigint, id: bigint): Promise<boolean> {
    const deleted = await this.db('navigation_items').where({ id, org_id: orgId }).delete()

    return deleted > 0
  }

  /**
   * Reorder items
   */
  async reorderItems(orgId: bigint, itemIds: bigint[]): Promise<void> {
    await this.db.transaction(async (trx) => {
      for (let i = 0; i < itemIds.length; i++) {
        await trx('navigation_items')
          .where({ id: itemIds[i], org_id: orgId })
          .update({ order_index: i })
      }
    })
  }

  /**
   * Format navigation item
   */
  private formatItem(item: any): NavigationItem {
    return {
      ...item,
      dropdown_items: JSON.parse(item.dropdown_items || '[]')
    }
  }
}
