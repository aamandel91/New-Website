import { type MapStyle } from '@configs/map'

export type Params = {
  layout: 'map' | 'grid' | 'table'
  style: MapStyle
}

export type SearchParams = {
  searchId: number
  aiImage: string
  aiFeature: string
}
