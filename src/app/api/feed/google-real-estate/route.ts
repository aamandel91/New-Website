/**
 * Google Real Estate Feed for Display Network Remarketing
 * Generates a property feed for Google Ads dynamic remarketing
 *
 * Usage: GET /api/feed/google-real-estate?format=csv|xml|json&limit=1000
 */

import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

import content from '@configs/content'

import {
  type RemarketingPropertyData,
  toCSV,
  toGoogleRealEstateFeed,
  toXML
} from 'services/marketing'

const { siteName, siteDescription } = content
const baseUrl = process.env.NEXT_PUBLIC_APP_DOMAIN || 'https://example.com'

// Mock function - replace with actual property fetching logic
// TODO: Add parameters when implementing: async function fetchProperties(limit: number, offset: number)
async function fetchProperties(): Promise<RemarketingPropertyData[]> {
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
    // TODO: Pass limit and offset when implementing: await fetchProperties(limit, offset)
    const properties = await fetchProperties()

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
          'Content-Disposition':
            'attachment; filename="google-real-estate-feed.xml"'
        }
      })
    }

    if (format === 'csv') {
      const csv = toCSV(feedItems)

      return new NextResponse(csv, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition':
            'attachment; filename="google-real-estate-feed.csv"'
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
