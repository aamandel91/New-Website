import { headers } from 'next/headers'
import type React from 'react'

import content from '@configs/content'
import searchConfig from '@configs/search'
import { Property404Template, PropertyPageTemplate } from '@templates'

import { formatMetadata } from 'utils/properties'
import { getProtocolHost } from 'utils/urls'
import { extractMlsFromSlug, generatePropertyUrl } from 'utils/propertyUrls'
import { generatePropertyJsonLd, generatePropertyBreadcrumbJsonLd } from 'utils/propertySchema'

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

    // Generate JSON-LD structured data for SEO
    const propertyJsonLd = generatePropertyJsonLd(property, propertyUrl)
    const breadcrumbJsonLd = generatePropertyBreadcrumbJsonLd(property, host)

    return (
      <>
        {/* JSON-LD Structured Data for Property */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(propertyJsonLd) }}
        />
        {/* JSON-LD Structured Data for Breadcrumbs */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
        />
        <PropertyPageTemplate property={property} />
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
