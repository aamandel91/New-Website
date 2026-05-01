import { headers } from 'next/headers'
import { permanentRedirect } from 'next/navigation'

import content from '@configs/content'
import searchConfig from '@configs/search'
import { Property404Template } from '@templates'

import { formatMetadata } from 'utils/properties'
import { getProtocolHost } from 'utils/urls'
import {
  extractMlsFromSlug,
  generatePropertyUrl,
  generateStaticPropertyUrl,
} from 'utils/propertyUrls'

import { fetchNearbies, fetchProperty } from './utils'

export const revalidate = 300

type LegacyListingPageProps = {
  params: Promise<{
    slug: string
  }>
  searchParams: Promise<{
    boardId?: string
  }>
}

// Kept for the `/listings/[[...slugs]]` catalog route, which delegates
// metadata for legacy listingId-shaped URLs back to this handler.
export const generateMetadata = async (props: LegacyListingPageProps) => {
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
      ...(canonical && { alternates: { canonical } }),
    }
  } catch {
    return content.missingPropertyMetadata
  }
}

/**
 * Legacy `/listing/[slug]` route.
 *
 * Every property-link emitter site-wide now points at the permanent
 * `/homes/[slug]` route. This handler exists solely to serve a 301
 * `permanentRedirect` so already-indexed `/listing/` URLs (Google
 * results, social shares, bookmarks) transfer their SEO equity to the
 * permanent URL.
 *
 * Subroutes under `/listing/[slug]/` (e.g. `/offer`, `/openhouse`) are
 * distinct route files and are unaffected.
 */
const LegacyListingPage = async (props: LegacyListingPageProps) => {
  const params = await props.params
  const searchParams = await props.searchParams

  const mlsNumber = extractMlsFromSlug(params.slug)
  const boardId = searchParams.boardId
    ? Number(searchParams.boardId)
    : searchConfig.defaultBoardId

  try {
    const property = await fetchProperty(mlsNumber, boardId)
    const target = property?.address
      ? generateStaticPropertyUrl(property.address)
      : generatePropertyUrl(property?.address || {}, mlsNumber)

    // Avoid a redirect loop when no address is recoverable and the
    // generator falls back to /listing/<mls>.
    if (target && !target.startsWith('/listing/')) {
      permanentRedirect(target)
    }
  } catch {
    // Listing not found / removed / API error — render the gentle
    // "no longer available" template below instead of looping.
  }

  // Listing has no address (sold/expired/scrubbed) or fetch failed.
  // Render a graceful fallback with nearby alternatives.
  const properties = await fetchNearbies(params.slug)
  return (
    <Property404Template
      listingName={params.slug}
      properties={properties}
      error={new Error('Listing no longer available')}
    />
  )
}

export default LegacyListingPage
