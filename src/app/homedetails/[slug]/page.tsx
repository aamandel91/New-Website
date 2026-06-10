import { headers } from 'next/headers'
import type React from 'react'

import content from '@configs/content'
import searchConfig from '@configs/search'
import { Property404Template, PropertyPageTemplate } from '@templates'
import StructuredData from '@shared/StructuredData'

import { formatMetadata } from 'utils/properties'
import {
  generatePropertyBreadcrumbJsonLd,
  generatePropertyJsonLd
} from 'utils/propertySchema'
import {
  extractMlsFromSlug,
  generatePropertyUrl,
  generateStaticPropertyUrl
} from 'utils/propertyUrls'
import { getProtocolHost } from 'utils/urls'

import { fetchMarketStats, fetchSimilarProperties } from './similarProperties'
import { fetchNearbies, fetchProperty } from './utils'

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
    const meta = formatMetadata(property, host)
    const canonical = property.address
      ? generateStaticPropertyUrl(property.address)
      : undefined
    return {
      ...meta,
      ...(canonical && { alternates: { canonical } })
    }
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
      fetchSimilarProperties(property, 6),
      property.address?.city && property.address?.state
        ? fetchMarketStats(
            property.address.city,
            property.address.state,
            boardId
          )
        : Promise.resolve(null)
    ])

    // Generate JSON-LD structured data for SEO
    const propertyJsonLd = generatePropertyJsonLd(property, propertyUrl)
    const breadcrumbJsonLd = generatePropertyBreadcrumbJsonLd(property, host)

    return (
      <>
        <StructuredData data={propertyJsonLd} />
        <StructuredData data={breadcrumbJsonLd} />
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
