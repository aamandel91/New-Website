/**
 * Google Page Feed for Dynamic Search Ads
 * Generates a page feed for Google Dynamic Search Ad campaigns
 *
 * Usage: GET /api/feed/google-page-feed?format=csv|json&limit=1000
 */

import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

import {
  type RemarketingPropertyData,
  toCSV,
  toGooglePageFeed
} from 'services/marketing'

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
    const limit = parseInt(searchParams.get('limit') || '5000', 10)
    const offset = parseInt(searchParams.get('offset') || '0', 10)

    // Fetch properties
    // TODO: Pass limit and offset when implementing: await fetchProperties(limit, offset)
    const properties = await fetchProperties()

    // Convert to Google Page Feed format
    const feedItems = toGooglePageFeed(properties, baseUrl)

    // Return based on format
    if (format === 'csv') {
      const csv = toCSV(feedItems)

      return new NextResponse(csv, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': 'attachment; filename="google-page-feed.csv"'
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
    console.error('Error generating Google Page Feed:', error)
    return NextResponse.json(
      { error: 'Failed to generate feed' },
      { status: 500 }
    )
  }
}
