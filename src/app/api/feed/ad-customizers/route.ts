/**
 * Ad Customizers Feed for Dynamic Search PPC
 * Generates ad customizer data for dynamic ad copy and automation
 *
 * Usage: GET /api/feed/ad-customizers?format=csv|json&campaign=Campaign&adgroup=AdGroup
 */

import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

import type { RemarketingPropertyData } from 'services/marketing'
import { toAdCustomizerFeed, toCSV } from 'services/marketing'
import { fetchFeedProperties } from 'services/marketing/fetchFeedProperties'

// Aggregate properties by city and property type
function aggregateProperties(properties: RemarketingPropertyData[]) {
  const aggregated = new Map<
    string,
    {
      city: string
      property_type: string
      count: number
      min_price: number
      max_price: number
      currency: string
    }
  >()

  properties.forEach((property) => {
    const key = `${property.city}|${property.property_type}`
    const existing = aggregated.get(key)

    if (existing) {
      existing.count++
      existing.min_price = Math.min(existing.min_price, property.price)
      existing.max_price = Math.max(existing.max_price, property.price)
    } else {
      aggregated.set(key, {
        city: property.city,
        property_type: property.property_type,
        count: 1,
        min_price: property.price,
        max_price: property.price,
        currency: property.currency
      })
    }
  })

  return Array.from(aggregated.values())
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const format = searchParams.get('format') || 'csv'
    const campaign = searchParams.get('campaign') || ''
    const adGroup = searchParams.get('adgroup') || ''

    // Fetch all properties
    const properties = await fetchFeedProperties({ limit: 10000 })

    // Aggregate by city and property type
    const aggregatedData = aggregateProperties(properties)

    // Convert to Ad Customizer feed format
    const feedItems = toAdCustomizerFeed(aggregatedData, campaign, adGroup)

    // Return based on format
    if (format === 'csv') {
      const csv = toCSV(feedItems as unknown as Record<string, unknown>[])

      return new NextResponse(csv, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': 'attachment; filename="ad-customizers.csv"'
        }
      })
    }

    // Default to JSON
    return NextResponse.json({
      data: feedItems,
      meta: {
        total: feedItems.length,
        aggregated_from: properties.length,
        campaign,
        adGroup,
        generated_at: new Date().toISOString()
      }
    })
  } catch (error) {
    console.error('Error generating Ad Customizers feed:', error)
    return NextResponse.json(
      { error: 'Failed to generate feed' },
      { status: 500 }
    )
  }
}
