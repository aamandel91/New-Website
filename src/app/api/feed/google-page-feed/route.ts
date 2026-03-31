/**
 * Google Page Feed for Dynamic Search Ads
 * Generates a page feed for Google Dynamic Search Ad campaigns
 *
 * Usage: GET /api/feed/google-page-feed?format=csv|json&limit=1000
 */

import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

import { toCSV, toGooglePageFeed } from 'services/marketing'
import { fetchFeedProperties } from 'services/marketing/fetchFeedProperties'

const baseUrl = process.env.NEXT_PUBLIC_APP_DOMAIN || 'https://example.com'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const format = searchParams.get('format') || 'csv'
    const limit = parseInt(searchParams.get('limit') || '5000', 10)
    const offset = parseInt(searchParams.get('offset') || '0', 10)

    // Fetch properties
    const properties = await fetchFeedProperties({ limit, offset })

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
