import APIClientSide from './APIClientSide'

const DEFAULT_BOARD_ID = 110

export interface AggregateItem {
  name: string
  count: number
}

export interface AggregatesResponse {
  aggregates?: Record<string, Record<string, number>>
  count?: number
}

class APIAggregates extends APIClientSide {
  async getPropertyTypes(boardId = DEFAULT_BOARD_ID): Promise<AggregateItem[]> {
    const data: AggregatesResponse = await this.fetch('/listings', {
      aggregates: 'details.propertyType',
      listings: false,
      boardId,
    })
    return this.parseAggregate(data, 'details.propertyType')
  }

  async getCities(boardId = DEFAULT_BOARD_ID): Promise<AggregateItem[]> {
    const data: AggregatesResponse = await this.fetch('/listings', {
      aggregates: 'address.city',
      listings: false,
      boardId,
    })
    return this.parseAggregate(data, 'address.city')
  }

  async getNeighborhoods(city: string, boardId = DEFAULT_BOARD_ID): Promise<AggregateItem[]> {
    const data: AggregatesResponse = await this.fetch('/listings', {
      aggregates: 'address.neighborhood',
      listings: false,
      boardId,
      city,
    })
    return this.parseAggregate(data, 'address.neighborhood')
  }

  async getStyles(boardId = DEFAULT_BOARD_ID): Promise<AggregateItem[]> {
    const data: AggregatesResponse = await this.fetch('/listings', {
      aggregates: 'details.style',
      listings: false,
      boardId,
    })
    return this.parseAggregate(data, 'details.style')
  }

  async getMultiple(
    fields: string[],
    filters?: Record<string, string>,
    boardId = DEFAULT_BOARD_ID
  ): Promise<Record<string, AggregateItem[]>> {
    const data: AggregatesResponse = await this.fetch('/listings', {
      aggregates: fields.join(','),
      listings: false,
      boardId,
      ...filters,
    })
    const result: Record<string, AggregateItem[]> = {}
    for (const field of fields) {
      result[field] = this.parseAggregate(data, field)
    }
    return result
  }

  private parseAggregate(data: AggregatesResponse | null, field: string): AggregateItem[] {
    if (!data?.aggregates) return []
    const bucket = data.aggregates[field]
    if (!bucket || typeof bucket !== 'object') return []
    return Object.entries(bucket)
      .map(([name, count]) => ({ name, count: Number(count) }))
      .sort((a, b) => b.count - a.count)
  }
}

const apiAggregatesInstance = new APIAggregates()
export default apiAggregatesInstance
