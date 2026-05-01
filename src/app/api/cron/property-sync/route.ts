import { NextResponse } from 'next/server'

import APISearchCSR from 'services/API/APISearchCSR'
import { generateStaticPropertyUrl } from 'utils/propertyUrls'
import { scorePropertyPage } from '@/utils/propertyPageScoring'
import {
  loadPropertyIndex,
  savePropertyIndex,
} from 'services/propertyIndex'
import type { PropertyIndexEntry } from 'services/propertyIndex'

function scoreListing(listing: any): { score: ReturnType<typeof scorePropertyPage>; slug: string } {
  const pageScore = scorePropertyPage({
    status: listing.status,
    lastStatus: listing.lastStatus,
    soldDate: listing.soldDate ?? undefined,
    soldPrice: listing.soldPrice,
    images: listing.images,
    history: listing.history,
    estimate: listing.estimate,
    details: listing.details
      ? { description: listing.details.description }
      : null,
    address: listing.address
      ? { city: listing.address.city, area: listing.address.area }
      : null,
  })

  const slug = generateStaticPropertyUrl(listing.address || {}).replace(
    /^\/homes\//,
    ''
  )

  return { score: pageScore, slug }
}

function statusFromListing(listing: any): PropertyIndexEntry['status'] {
  if (listing.status === 'A') {
    if (
      listing.lastStatus === 'Sc' ||
      listing.lastStatus === 'Pc' ||
      listing.lastStatus === 'Lc'
    ) {
      return 'pending'
    }
    return 'active'
  }
  if (listing.lastStatus === 'Sld') return 'sold'
  return 'off-market'
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const secret = searchParams.get('secret')

  if (!process.env.CRON_SECRET || secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const newEntries: PropertyIndexEntry[] = []

    // 1. Fetch active listings
    const activeResult = await APISearchCSR.searchListings({
      status: 'A',
      resultsPerPage: 500,
      sortBy: 'updatedOnDesc',
      fields:
        'mlsNumber,status,lastStatus,soldDate,soldPrice,images[1],updatedOn,address,details.description,history,estimate.value',
    })

    if (activeResult?.listings) {
      for (const listing of activeResult.listings) {
        const { score, slug } = scoreListing(listing)
        newEntries.push({
          slug,
          status: statusFromListing(listing),
          lastUpdated: listing.updatedOn || new Date().toISOString(),
          score: score.score,
          indexDirective: score.indexDirective,
          mlsNumber: listing.mlsNumber,
        })
      }
    }

    // 2. Fetch recently sold (last 7 days)
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
    const minSoldDate = sevenDaysAgo.toISOString().split('T')[0]

    const soldResult = await APISearchCSR.searchListings({
      status: 'U',
      lastStatus: 'Sld',
      resultsPerPage: 500,
      sortBy: 'updatedOnDesc',
      minSoldDate,
      fields:
        'mlsNumber,status,lastStatus,soldDate,soldPrice,images[1],updatedOn,address,details.description,history,estimate.value',
    })

    if (soldResult?.listings) {
      for (const listing of soldResult.listings) {
        const { score, slug } = scoreListing(listing)
        newEntries.push({
          slug,
          status: 'sold',
          lastUpdated: listing.updatedOn || listing.soldDate || new Date().toISOString(),
          score: score.score,
          indexDirective: score.indexDirective,
          mlsNumber: listing.mlsNumber,
          soldPrice: listing.soldPrice ? parseFloat(listing.soldPrice) : undefined,
          soldDate: listing.soldDate ?? undefined,
        })
      }
    }

    // 3. Merge with existing index
    const existingIndex = await loadPropertyIndex()
    const mergedMap = new Map<string, PropertyIndexEntry>()
    for (const entry of existingIndex) {
      mergedMap.set(entry.slug, entry)
    }
    for (const entry of newEntries) {
      mergedMap.set(entry.slug, entry)
    }
    const merged = Array.from(mergedMap.values())

    // 4. Save updated index
    await savePropertyIndex(merged)

    return NextResponse.json({
      total: merged.length,
      newEntries: newEntries.length,
      activeFound: activeResult?.listings?.length ?? 0,
      soldFound: soldResult?.listings?.length ?? 0,
    })
  } catch (error) {
    console.error('Property sync error:', error)
    return NextResponse.json(
      { error: 'Sync failed', details: String(error) },
      { status: 500 }
    )
  }
}
