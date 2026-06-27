import { type Metadata } from 'next'
import { features } from 'features'
import { type Position } from 'geojson'

import { Container } from '@mui/material'

import { Page404Template, PageTemplate } from '@templates'
import { tenant } from '@/configs/tenant.config'
import MapPageContent from '@pages/search'
import RelatedReading from '@shared/RelatedReading'
import StructuredData from '@shared/StructuredData'

import { APISaveSearch } from 'services/API'
import { type Filters } from 'services/Search'
import AiSearchProvider from 'providers/AiSearchProvider'
import MapOptionsProvider from 'providers/MapOptionsProvider'
import SearchProvider from 'providers/SearchProvider'
import { type PolygonZone } from 'utils/map'
import { breadcrumbSchema } from 'utils/structuredData'

import { type Params, type SearchParams } from './_types'
import {
  getFiltersFromParams,
  getFiltersFromSavedSearch,
  getPositionFromPolygon
} from './_utils'

const SITE_URL = tenant.brand.siteUrl
const SITE_NAME = tenant.brand.siteName

const pickStr = (
  v: string | string[] | number | undefined
): string | undefined => {
  if (Array.isArray(v)) return v[0]
  if (v === undefined || v === null) return undefined
  return String(v)
}

export async function generateMetadata(props: {
  params: Promise<Params>
  searchParams: Promise<SearchParams>
}): Promise<Metadata> {
  const params = await props.params
  const searchParams = await props.searchParams

  const location = pickStr(searchParams.location)
  const minPrice = pickStr(searchParams.minPrice)
  const maxPrice = pickStr(searchParams.maxPrice)
  // `SearchParams` has an index signature of `string | number`, so reading
  // these fields by string key is already type-safe.
  const bedrooms = pickStr(searchParams.bedrooms)
  const propertyType = pickStr(searchParams.propertyType)

  let title = `Homes for Sale in South Florida | ${SITE_NAME}`
  let description = `Search homes for sale in South Florida. Filter by city, neighborhood, price, beds, baths, property type, and more on ${SITE_NAME}.`

  if (location) {
    title = `Homes for Sale in ${location}, FL`
    description = `Search homes for sale in ${location}, Florida.`
    if (bedrooms) title += ` — ${bedrooms} Bedrooms`
    if (minPrice && maxPrice) {
      title += ` — $${minPrice} to $${maxPrice}`
      description += ` Priced between $${minPrice} and $${maxPrice}.`
    }
    if (propertyType) {
      title += ` — ${propertyType}`
    }
    title += ` | ${SITE_NAME}`
  }

  // Faceted filter combinations are noindex (filtered duplicates of the
  // canonical /[city] landing pages). Core /search/{layout} remains indexable.
  const hasFilters = !!(
    location ||
    minPrice ||
    maxPrice ||
    bedrooms ||
    propertyType
  )
  const robots = hasFilters
    ? { index: false, follow: true }
    : { index: true, follow: true }

  // Canonical: only the main layout URL gets a canonical to avoid
  // confusing Google with every filter combination.
  const canonical = `${SITE_URL}/search/${params.layout || 'gallery'}`

  return {
    title,
    description,
    robots,
    alternates: { canonical },
    openGraph: {
      title,
      description,
      type: 'website',
      url: canonical,
      siteName: SITE_NAME
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description
    }
  }
}

const MapPage = async (props: {
  params: Promise<Params>
  searchParams: Promise<SearchParams>
}) => {
  const searchParams = await props.searchParams
  const params = await props.params
  const { style, layout } = params
  const { searchId, aiImage, aiFeature } = searchParams

  let title: string | undefined
  let position: any | undefined
  let filters: Filters | undefined
  let polygon: Position[] | undefined
  let polygons: PolygonZone[] | undefined

  if (searchId) {
    const savedSearch = await APISaveSearch.fetch(searchId)
    const { name, map } = savedSearch
    polygon = map[0]

    // Reassemble multi-zone polygons from the saved search payload:
    // every entry in `map` is an inclusion zone, plus any exclusion zones
    // persisted alongside via the `excludePolygons` field.
    const includes: PolygonZone[] = (map || []).map((coords: any) => ({
      type: 'include',
      coords
    }))
    const excludes: PolygonZone[] = (savedSearch.excludePolygons || []).map(
      (coords) => ({ type: 'exclude', coords })
    )
    polygons = [...includes, ...excludes]

    title = name // use saved search name as map title (show special header)
    filters = getFiltersFromSavedSearch(savedSearch)
    position = getPositionFromPolygon(polygon)
  } else {
    filters = getFiltersFromParams(searchParams)
  }

  if (!features.map) return <Page404Template />

  const searchLocation = pickStr(searchParams.location)

  return (
    <PageTemplate noFooter>
      <StructuredData
        data={breadcrumbSchema([
          { name: 'Home', url: SITE_URL },
          { name: 'Search', url: `${SITE_URL}/search/gallery` }
        ])}
      />
      <MapOptionsProvider
        title={title}
        position={position}
        layout={layout}
        style={style}
      >
        <SearchProvider filters={filters} polygon={polygon} polygons={polygons}>
          <AiSearchProvider image={aiImage} feature={aiFeature}>
            <MapPageContent />
          </AiSearchProvider>
        </SearchProvider>
      </MapOptionsProvider>
      {/* Slim related-reading footer — SEO-focused, hidden if no matches */}
      <Container maxWidth="lg" sx={{ pb: 4 }}>
        <RelatedReading
          pageType="search"
          variant="slim"
          {...(searchLocation ? { city: searchLocation } : {})}
        />
      </Container>
    </PageTemplate>
  )
}

export default MapPage
