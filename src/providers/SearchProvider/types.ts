import type { Position } from 'geojson'

import {
  type ApiCluster,
  type ApiQueryResponse,
  type Property
} from 'services/API'
import { type Filters } from 'services/Search'
import { type KeywordParseResult } from 'utils/keywordSearch'
import { type PolygonZone } from 'utils/map'

export type SchoolSummary = {
  elementary?: { name: string; rating?: number }
  middle?: { name: string; rating?: number }
  high?: { name: string; rating?: number }
}

export type SchoolSearchMeta = {
  // Only meaningful when the school filter is active. When active, the
  // search routed through the backend /api/search/with-schools endpoint and
  // the response includes per-listing school data + before/after totals.
  active: boolean
  totalBeforeSchoolFilter?: number
  totalAfterSchoolFilter?: number
  schoolDataByMlsNumber?: Record<string, SchoolSummary>
}

export type SavedResponse = {
  count: number
  page: number
  pages: number
  list: Property[]
  clusters: ApiCluster[]
  statistics: { [key: string]: any }
  schoolMeta?: SchoolSearchMeta
}

export type SearchContextType = SavedResponse & {
  loading: boolean
  filters: Partial<Filters>
  setFilter: (key: keyof Filters, value: any) => void
  setFilters: (filters: Partial<Filters>) => void
  addFilters: (newFilters: Partial<Filters>) => void
  removeFilter: (key: keyof Filters) => void
  removeFilters: (keys: (keyof Filters)[]) => void
  resetFilters: () => void
  search: (params: any) => Promise<ApiQueryResponse | undefined>
  save: (response: ApiQueryResponse) => SavedResponse
  // Backward-compat single-polygon accessors. `polygon` is the coords of the
  // first inclusion zone (if any); `setPolygon`/`clearPolygon` operate on the
  // single-include shape, replacing the entire `polygons` collection.
  polygon: Position[] | null
  setPolygon: (polygon: Position[]) => void
  clearPolygon: () => void
  // Multi-polygon API
  polygons: PolygonZone[]
  setPolygons: (polygons: PolygonZone[]) => void
  addPolygonZone: (zone: PolygonZone) => void
  removePolygonZone: (index: number) => void
  clearPolygons: () => void
  multiUnits: Property[]
  saveMultiUnits: (properties: Property[]) => void
  clearMultiUnits: () => void
  keywordFilter: KeywordParseResult | null
  setKeywordFilter: (result: KeywordParseResult | null) => void
}
