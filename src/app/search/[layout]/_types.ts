import { type MapStyle } from '@configs/map'

export type Params = {
  layout: 'map' | 'grid' | 'table' | 'gallery'
  style: MapStyle
}

export type SearchParams = {
  searchId: number
  aiImage: string
  aiFeature: string
  location: string
  minPrice: string
  maxPrice: string
  [key: string]: string | number
}
