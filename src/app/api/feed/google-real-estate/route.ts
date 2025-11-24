/**
 * Google Real Estate Feed for Display Network Remarketing
 * Generates a property feed for Google Ads dynamic remarketing
 *
 * Usage: GET /api/feed/google-real-estate?format=csv|xml|json&limit=1000
 */

import { NextRequest, NextResponse } from 'next/server'

import {
  toGoogleRealEstateFeed,
  toCSV,
  toXML,
  type RemarketingPropertyData
} from 'services/marketing'

import content from '@configs/content'

const { siteName, siteDescription } = content
const baseUrl = process.env.NEXT_PUBLIC_APP_DOMAIN || 'https://example.com'

// Mock function - replace with actual property fetching logic
async function fetchProperties(
  limit: number,
  offset: number
): Promise<RemarketingPropertyData[]> {
  // TODO: Replace with actual API call to fetch properties
  // Example: return await APISearch.getListings({ limit, offset })

  // For now, return empty array - implement actual data fetching
  return []
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const format = searchParams.get('format') || 'csv'
    const limit = parseInt(searchParams.get('limit') || '1000', 10)
    const offset = parseInt(searchParams.get('offset') || '0', 10)

    // Fetch properties
    const properties = await fetchProperties(limit, offset)

    // Convert to Google Real Estate feed format
    const feedItems = toGoogleRealEstateFeed(properties, baseUrl)

    // Return based on format
    if (format === 'xml') {
      const xml = toXML(
        properties,
        baseUrl,
        `${siteName} Property Feed`,
        siteDescription || `Real estate listings from ${siteName}`
      )

      return new NextResponse(xml, {
        headers: {
          'Content-Type': 'application/xml',
          'Content-Disposition': 'attachment; filename="google-real-estate-feed.xml"'
        }
      })
    }

    if (format === 'csv') {
      const csv = toCSV(feedItems)

      return new NextResponse(csv, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': 'attachment; filename="google-real-estate-feed.csv"'
        }
      })
    }

    // Default to JSON
    return NextResponse.json({
      data: feedItems,
      meta: {
        total: feedItems.length,
        limit,
        offset,
        generated_at: new Date().toISOString()
      }
    })
  } catch (error) {
    console.error('Error generating Google Real Estate feed:', error)
    return NextResponse.json(
      { error: 'Failed to generate feed' },
      { status: 500 }
    )
  }
}
