import { type Position } from 'geojson'
import { type LngLatBounds } from 'utils/lngLat'

import {
  type ApiSavedSearch,
  type ApiSavedSearchUpdateRequest
} from 'services/API'
import type { Filters } from 'services/Search'
import {
  type PolygonZone,
  type PolygonZoneType
} from 'utils/map'

import { type notifications } from './constants'

export type NotificationFrequency = (typeof notifications)[number]

export type { PolygonZone, PolygonZoneType }

export type CreateSearchParams = {
  name?: string
  bounds?: LngLatBounds
  // legacy single-polygon (treated as a single 'include' zone)
  polygon?: Position[]
  polygons?: PolygonZone[]
  filters?: Filters
  notificationFrequency?: NotificationFrequency
  priceChangeNotifications?: boolean
  soldNotifications?: boolean
}

export type SaveSearchContextType = {
  list: ApiSavedSearch[]
  loading: boolean
  processing: boolean
  createSearch: ({
    name,
    bounds,
    filters,
    polygon,
    polygons,
    notificationFrequency
  }: CreateSearchParams) => Promise<void>
  editSearch: (id: number, params: ApiSavedSearchUpdateRequest) => void
  deleteSearch: (id: number) => void
  cancelDelete: () => void
  cancelEdit: () => void
  deleteId: number | null
  setDeleteId: (id: number | null) => void
  editId: number | null
  setEditId: (id: number | null) => void
}
