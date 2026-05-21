'use client'
import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState
} from 'react'
import { type Position } from 'geojson'

import { defaultFilters } from '@configs/filters'

import { APISearch, type ApiQueryResponse, type Property } from 'services/API'
import SearchService, { type Filters } from 'services/Search'
import { type KeywordParseResult } from 'utils/keywordSearch'
import { type PolygonZone, polygonToZones } from 'utils/map'
import { sortPropertyScoredImages } from 'utils/properties'

import {
  type SavedResponse,
  type SchoolSearchMeta,
  type SearchContextType
} from './types'

const isSchoolFilterActive = (filters: Record<string, unknown> = {}): boolean => {
  const r = filters['schoolRating']
  return typeof r === 'number' && r > 0
}

export const SearchContext = createContext<SearchContextType | undefined>(
  undefined
)

const emptySavedResponse = {
  count: 0,
  page: 0,
  pages: 0,
  list: [],
  clusters: [],
  statistics: {}
}

const SearchProvider = ({
  filters,
  polygon,
  polygons,
  children
}: {
  filters?: Filters
  polygon?: Position[]
  polygons?: PolygonZone[]
  children?: React.ReactNode
}) => {
  const [loading, setLoading] = useState(false)
  const [saved, setSaved] = useState<SavedResponse>(emptySavedResponse)
  const [multiUnits, saveMultiUnits] = useState<Property[]>([])

  const [searchFilters, setFilters] = useState(filters || defaultFilters)

  const initialZones: PolygonZone[] = polygons?.length
    ? polygons
    : polygonToZones(polygon)

  const [searchPolygons, setSearchPolygons] =
    useState<PolygonZone[]>(initialZones)

  const [keywordFilter, setKeywordFilter] =
    useState<KeywordParseResult | null>(null)

  const setFilter = (key: keyof Filters, value: any) =>
    setFilters((prev) => ({ ...prev, [key]: value }))

  const addFilters = (newFilters: Filters) =>
    setFilters((prev) => ({ ...prev, ...newFilters }))

  const removeFilter = (key: keyof Filters) =>
    setFilters((prev) => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { [key]: _, ...rest } = prev
      return rest
    })

  const removeFilters = (keys: (keyof Filters)[]) =>
    setFilters((prev) => {
      const newFilters = { ...prev }
      keys.forEach((key) => {
        delete newFilters[key]
      })
      return newFilters
    })

  const resetFilters = () => setFilters(defaultFilters)

  // Multi-polygon ops
  const setPolygons = (zones: PolygonZone[]) => setSearchPolygons(zones)
  const addPolygonZone = (zone: PolygonZone) =>
    setSearchPolygons((prev) => [...prev, zone])
  const removePolygonZone = (index: number) =>
    setSearchPolygons((prev) => prev.filter((_z, i) => i !== index))
  const clearPolygons = () => setSearchPolygons([])

  // Backward-compat single-polygon ops: replace ALL zones with one inclusion
  // shape (matches old single-polygon semantics for callers that haven't
  // migrated to the multi-zone API yet).
  const setPolygon = (coords: Position[]) =>
    setSearchPolygons([{ type: 'include', coords }])
  const clearPolygon = () => setSearchPolygons([])

  // Derived: legacy `polygon` is the first inclusion zone's coords (if any).
  const legacyPolygon =
    searchPolygons.find((z) => z.type === 'include')?.coords || null

  const save = (response: ApiQueryResponse) => {
    setLoading(true)

    const { listings, count, page, numPages, aggregates, statistics } = response

    // Capture school metadata if the backend with-schools endpoint replied.
    const schoolEnriched = response as ApiQueryResponse & {
      totalBeforeSchoolFilter?: number
      totalAfterSchoolFilter?: number
      schoolDataByMlsNumber?: Record<string, any>
    }
    const schoolMeta: SchoolSearchMeta | undefined =
      schoolEnriched.schoolDataByMlsNumber
        ? {
            active: true,
            totalBeforeSchoolFilter: schoolEnriched.totalBeforeSchoolFilter,
            totalAfterSchoolFilter: schoolEnriched.totalAfterSchoolFilter,
            schoolDataByMlsNumber: schoolEnriched.schoolDataByMlsNumber
          }
        : undefined

    const remappedResponse: SavedResponse = {
      page,
      pages: numPages,
      count,
      statistics,
      list: listings.map(sortPropertyScoredImages),
      clusters: aggregates ? aggregates.map.clusters : [],
      ...(schoolMeta ? { schoolMeta } : {})
    }

    setSaved(remappedResponse)
    return remappedResponse
  }

  const search = async (params: any) => {
    let response
    try {
      setLoading(true)
      if (isSchoolFilterActive(params)) {
        // Route through the backend so we get per-listing school lookup +
        // filtering. Strip school-only keys before forwarding the rest to
        // Repliers.
        const {
          schoolRating,
          schoolLevel = 'any',
          sortBy,
          resultsPerPage,
          pageSize,
          pageNum,
          page,
          ...filters
        } = params
        const sizeArg = Number(pageSize ?? resultsPerPage) || 24
        const pageArg = Number(pageNum ?? page) || 1
        try {
          response = (await APISearch.searchWithSchools({
            filters,
            schoolRating: Number(schoolRating),
            schoolLevel,
            ...(sortBy ? { sortBy } : {}),
            pageSize: sizeArg,
            page: pageArg
          })) as unknown as ApiQueryResponse
        } catch (err) {
          console.error('[searchWithSchools] failed', err)
          response = undefined
        }
      } else {
        response = await SearchService.fetch(params)
      }
    } finally {
      setLoading(false)
    }
    return response
  }

  // special effect to clear up the grid and show loading placeholders
  // instead of "No Results" message
  useEffect(() => {
    if (filters?.imageSearchItems) setSaved({ ...saved, page: 0 })
  }, [filters])

  // saving the response object takes time, so we need to show loading and placeholders
  useEffect(() => setLoading(false), [saved])

  const contextValue = useMemo(
    () => ({
      loading,
      filters: searchFilters,
      setFilter,
      setFilters,
      addFilters,
      removeFilter,
      removeFilters,
      resetFilters,
      search,
      save,
      ...saved, // destructured saved object shorthands
      polygon: legacyPolygon,
      setPolygon,
      clearPolygon,
      polygons: searchPolygons,
      setPolygons,
      addPolygonZone,
      removePolygonZone,
      clearPolygons,
      multiUnits,
      saveMultiUnits,
      clearMultiUnits: () => saveMultiUnits([]),
      keywordFilter,
      setKeywordFilter
    }),
    [searchFilters, searchPolygons, loading, saved, multiUnits, keywordFilter]
  )

  return (
    <SearchContext.Provider value={contextValue}>
      {children}
    </SearchContext.Provider>
  )
}
export default SearchProvider

export const useSearch = () => {
  const context = useContext(SearchContext)
  if (context === undefined) {
    throw Error('useSearch must be used within an SearchProvider')
  }
  return context
}
