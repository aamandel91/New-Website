import { permanentRedirect } from 'next/navigation'

import searchConfig from '@configs/search'
import { Property404Template } from '@templates'

import {
  extractMlsFromSlug,
  generateStaticPropertyUrl,
} from 'utils/propertyUrls'

import { fetchProperty, fetchNearbies } from '../utils'

export const revalidate = 300

export const metadata = {
  robots: { index: false, follow: false },
}

interface PageProps {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ boardId?: string }>
}

/**
 * Legacy `/listing/[slug]/offer` route.
 *
 * The canonical offer form now lives at `/homes/[slug]/offer`. This handler
 * resolves the legacy MLS-shaped slug to the property's address-based slug
 * and 301-redirects, preserving any inbound links from emails or bookmarks.
 */
export default async function LegacyOfferPage(props: PageProps) {
  const params = await props.params
  const searchParams = await props.searchParams

  const mlsNumber = extractMlsFromSlug(params.slug)
  const boardId = searchParams.boardId
    ? Number(searchParams.boardId)
    : searchConfig.defaultBoardId

  try {
    const property = await fetchProperty(mlsNumber, boardId)
    const target = property?.address
      ? `${generateStaticPropertyUrl(property.address)}/offer`
      : null

    if (target && target.startsWith('/homes/')) {
      permanentRedirect(target)
    }
  } catch {
    // Listing not found / removed / API error — fall through to fallback.
  }

  const properties = await fetchNearbies(params.slug)
  return (
    <Property404Template
      listingName={params.slug}
      properties={properties}
      error={new Error('Listing no longer available')}
    />
  )
}
