import { features } from 'features'

import { Page404Template, PageTemplate } from '@templates'
import CatalogPageContent from '@pages/catalog'
import StructuredData from '@shared/StructuredData'

import { generateMetadata as generatePropertyMetadata } from 'app/listing/[slug]/page'
import PropertyPage from 'app/listing/[slug]/page'

import { type ApiBoardCity } from 'services/API'
import { localBusinessSchema, breadcrumbSchema } from 'utils/structuredData'
import { getCatalogUrl } from 'utils/urls'

import { parseUrlFilters, parseUrlParams } from './_parsers'
import { fetchListings, fetchLocations } from './_requests'
import { generateCatalogMetadata } from './_ssg'
import { extractCities, extractLocation } from './_utils'

// catalog pages CANT BE STATICALLY GENERATED (SSG)
// because we need a token cookie to fetch listings from the client side
export const dynamic = 'force-dynamic'
export const revalidate = 86400

export type Params = {
  slugs: string[]
}

export type SearchParams = {
  page?: number
}

type LocationsPageProps = {
  params: Promise<Params>
  searchParams: Promise<SearchParams>
}

// export { genetareStaticParams } from './_ssg'

export const generateMetadata = async (props: LocationsPageProps) => {
  const params = await props.params
  const searchParams = await props.searchParams
  const { listingId, boardId, localAddress } = parseUrlParams(params.slugs)

  if (listingId) {
    return generatePropertyMetadata({
      params: Promise.resolve({ slug: `${localAddress}-${listingId}` }),
      searchParams: Promise.resolve({ boardId })
    })
  }

  return generateCatalogMetadata({ params, searchParams })
}

const LocationsCatalogPage = async (props: {
  params: Promise<Params>
  searchParams: Promise<SearchParams>
}) => {
  const searchParams = await props.searchParams
  const params = await props.params
  const page = Number(searchParams.page) || 1
  const { slugs } = params

  if (!features.listings) return <Page404Template />

  const {
    filters,
    boardId,
    listingId,
    localAddress,
    location: { area, city, neighborhood: hood }
  } = parseUrlParams(slugs)

  // render property page component if listingId is present and emulate its old url format
  if (listingId) {
    return (
      <PropertyPage
        params={Promise.resolve({ slug: `${localAddress}-${listingId}` })}
        searchParams={Promise.resolve({ boardId })}
      />
    )
  }
  const searchFilters = parseUrlFilters(filters) // NOTE: those are just the minus separated strings from the url
  const { listings, count } = await fetchListings({
    area,
    city,
    hood,
    filters: searchFilters,
    page
  })

  if ((city || hood || page > 1) && !listings.length) return <Page404Template />

  const byCount = (a: any, b: any) => b.activeCount - a.activeCount

  const areas = await fetchLocations(city, hood)
  const currentArea = area ? areas.find((a) => a.name === area) : null
  const currentLocation = city ? extractLocation(areas, city, hood) : undefined
  const cities = extractCities(currentArea ? [currentArea] : areas).sort(
    byCount
  )

  const hoods =
    city && currentLocation
      ? (currentLocation as ApiBoardCity).neighborhoods || []
      : []

  const baseUrl = 'https://floridahomefinder.com'
  const breadcrumbItems = [
    { name: 'Home', url: baseUrl },
    { name: 'Listings', url: `${baseUrl}/listings` }
  ]
  if (city) {
    breadcrumbItems.push({ name: city, url: `${baseUrl}${getCatalogUrl(city)}` })
  }
  if (hood) {
    breadcrumbItems.push({ name: hood, url: `${baseUrl}${getCatalogUrl(city, hood)}` })
  }

  return (
    <>
      {city && (
        <StructuredData
          data={localBusinessSchema({ city, state: 'FL', zipCode: '' })}
        />
      )}
      <StructuredData data={breadcrumbSchema(breadcrumbItems)} />
      <PageTemplate>
        <CatalogPageContent
          listings={listings}
          count={count}
          page={page}
          area={area}
          city={city}
          hood={hood}
          areas={areas}
          hoods={hoods}
          cities={cities}
          location={currentLocation}
          urlFilters={filters}
          searchFilters={searchFilters}
        />
      </PageTemplate>
    </>
  )
}

export default LocationsCatalogPage
