import { permanentRedirect } from 'next/navigation'

import searchConfig from '@configs/search'
import { Property404Template } from '@templates'

import {
  extractMlsFromSlug,
  generateStaticPropertyUrl
} from 'utils/propertyUrls'

import { fetchNearbies, fetchProperty } from '../utils'

export const revalidate = 300

export const metadata = {
  robots: { index: false, follow: false }
}

interface PageProps {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ boardId?: string }>
}

/**
 * Legacy `/listing/[slug]/openhouse` route.
 *
 * The canonical open-house sign-in now lives at `/homes/[slug]/openhouse`.
 * This handler resolves the legacy MLS-shaped slug to the address-based
 * slug and 301-redirects, preserving any inbound links.
 */
export default async function LegacyOpenHousePage(props: PageProps) {
  const params = await props.params
  const searchParams = await props.searchParams

  const mlsNumber = extractMlsFromSlug(params.slug)
  const boardId = searchParams.boardId
    ? Number(searchParams.boardId)
    : searchConfig.defaultBoardId

  try {
    const property = await fetchProperty(mlsNumber, boardId)
    const target = property?.address
      ? `${generateStaticPropertyUrl(property.address)}/openhouse`
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
