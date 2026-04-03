import { headers } from 'next/headers'
import type React from 'react'

import content from '@configs/content'
import searchConfig from '@configs/search'
import StructuredData from '@shared/StructuredData'
import { Property404Template, PropertyPageTemplate } from '@templates'

import { formatMetadata } from 'utils/properties'
import { getProtocolHost } from 'utils/urls'
import { extractMlsFromSlug, generatePropertyUrl } from 'utils/propertyUrls'
import { generatePropertyJsonLd, generatePropertyBreadcrumbJsonLd } from 'utils/propertySchema'

import { fetchNearbies, fetchProperty } from './utils'
import { fetchSimilarProperties, fetchMarketStats } from './similarProperties'

export const revalidate = 300

type PropertyDetailPageProps = {
  params: Promise<{
    slug: string
  }>
  searchParams: Promise<{
    boardId?: string
  }>
}

// NextJS SSR metadata generation
export const generateMetadata = async (props: PropertyDetailPageProps) => {
  const params = await props.params
  const searchParams = await props.searchParams
  const host = getProtocolHost(await headers())

  const mlsNumber = extractMlsFromSlug(params.slug)
  const boardId = searchParams.boardId
    ? Number(searchParams.boardId)
    : searchConfig.defaultBoardId

  try {
    const property = await fetchProperty(mlsNumber, boardId)
    return formatMetadata(property, host)
  } catch (error: any) {
    return content.missingPropertyMetadata
  }
}

const PropertyDetailPage = async (props: PropertyDetailPageProps) => {
  const params = await props.params
  const searchParams = await props.searchParams

  const mlsNumber = extractMlsFromSlug(params.slug)
  const boardId = searchParams.boardId
    ? Number(searchParams.boardId)
    : searchConfig.defaultBoardId

  try {
    const property = await fetchProperty(mlsNumber, boardId)
    const host = getProtocolHost(await headers())
    const propertyUrl = `${host}${generatePropertyUrl(property.address || {}, property.mlsNumber)}`

    // Fetch similar properties and market stats in parallel
    const [similarProperties, marketStats] = await Promise.all([
      fetchSimilarProperties(property, 6).catch(() => []),
      property.address?.city && property.address?.state
        ? fetchMarketStats(property.address.city, property.address.state, boardId).catch(() => null)
        : Promise.resolve(null)
    ])

    // Generate JSON-LD structured data for SEO (graceful fallback if property shape differs)
    let propertyJsonLd = null
    let breadcrumbJsonLd = null
    try {
      propertyJsonLd = generatePropertyJsonLd(property, propertyUrl)
      breadcrumbJsonLd = generatePropertyBreadcrumbJsonLd(property, host)
    } catch (e) {
      console.error('Error generating structured data:', e)
    }

    return (
      <>
        {propertyJsonLd && <StructuredData data={propertyJsonLd} />}
        {breadcrumbJsonLd && <StructuredData data={breadcrumbJsonLd} />}
        <PropertyPageTemplate
          property={property}
          similarProperties={similarProperties}
          marketStats={marketStats}
        />
      </>
    )
  } catch (error: any) {
    // Try to fetch nearby properties for 404 page
    const properties = await fetchNearbies(params.slug)
    return (
      <Property404Template
        listingName={params.slug}
        properties={properties}
        error={error}
      />
    )
  }
}

export default PropertyDetailPage
