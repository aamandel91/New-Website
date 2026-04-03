import { NextResponse } from 'next/server'

import APISearchCSR from 'services/API/APISearchCSR'
import { generateStaticPropertyUrl } from 'utils/propertyUrls'
import { scorePropertyPage } from '@/utils/propertyPageScoring'
import {
  loadPropertyIndex,
  savePropertyIndex,
} from 'services/propertyIndex'
import type { PropertyIndexEntry } from 'services/propertyIndex'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const county = searchParams.get('county') || 'Broward'
  const months = parseInt(searchParams.get('months') || '24', 10)

  // Calculate date range
  const minSoldDate = new Date()
  minSoldDate.setMonth(minSoldDate.getMonth() - months)
  const minSoldDateStr = minSoldDate.toISOString().split('T')[0]

  const allEntries: PropertyIndexEntry[] = []
  let pageNum = 1
  const maxPages = 20 // 500 per page * 20 = 10,000 max
  let totalFetched = 0

  try {
    while (pageNum <= maxPages) {
      const result = await APISearchCSR.searchListings({
        status: 'U',
        lastStatus: 'Sld',
        area: county,
        resultsPerPage: 500,
        pageNum,
        sortBy: 'updatedOnDesc',
        minSoldDate: minSoldDateStr,
      })

      if (!result?.listings || result.listings.length === 0) break

      for (const listing of result.listings) {
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

        allEntries.push({
          slug,
          status: 'sold',
          lastUpdated: listing.updatedOn || listing.soldDate || new Date().toISOString(),
          score: pageScore.score,
          indexDirective: pageScore.indexDirective,
          mlsNumber: listing.mlsNumber,
          soldPrice: listing.soldPrice ? parseFloat(listing.soldPrice) : undefined,
          soldDate: listing.soldDate ?? undefined,
        })
      }

      totalFetched += result.listings.length

      // Check if there are more pages
      const totalCount = result.count || 0
      if (totalFetched >= totalCount) break
      pageNum++
    }

    // Merge with existing index
    const existingIndex = await loadPropertyIndex()
    const mergedMap = new Map<string, PropertyIndexEntry>()
    for (const entry of existingIndex) {
      mergedMap.set(entry.slug, entry)
    }
    for (const entry of allEntries) {
      mergedMap.set(entry.slug, entry)
    }
    const merged = Array.from(mergedMap.values())
    await savePropertyIndex(merged)

    // Compute stats
    const indexed = merged.filter((e) => e.score >= 3).length
    const noindexFollow = merged.filter((e) => e.score >= 1 && e.score < 3).length
    const noindexNofollow = merged.filter((e) => e.score < 1).length
    const sampleUrls = merged
      .filter((e) => e.score >= 3)
      .slice(0, 10)
      .map((e) => `/homes/${e.slug}`)

    return NextResponse.json({
      total: merged.length,
      fetched: allEntries.length,
      indexed,
      noindexFollow,
      noindexNofollow,
      sampleUrls,
    })
  } catch (error) {
    console.error('Backfill error:', error)
    return NextResponse.json(
      { error: 'Backfill failed', details: String(error) },
      { status: 500 }
    )
  }
}
