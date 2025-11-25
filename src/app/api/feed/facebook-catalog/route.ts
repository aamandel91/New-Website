/**
 * Facebook Dynamic Remarketing Catalog Feed
 * Generates a product feed for Facebook dynamic ads
 *
 * Usage: GET /api/feed/facebook-catalog?format=json|csv&limit=1000
 */

import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

import content from '@configs/content'

import {
  type RemarketingPropertyData,
  toCSV,
  toFacebookCatalog
} from 'services/marketing'

const { siteName } = content
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
    const format = searchParams.get('format') || 'json'
    const limit = parseInt(searchParams.get('limit') || '1000', 10)
    const offset = parseInt(searchParams.get('offset') || '0', 10)

    // Fetch properties
    // TODO: Pass limit and offset when implementing: await fetchProperties(limit, offset)
    const properties = await fetchProperties()

    // Convert to Facebook catalog format
    const catalogItems = toFacebookCatalog(properties, baseUrl, siteName)

    // Return based on format
    if (format === 'csv') {
      const csv = toCSV(
        catalogItems.map((item) => ({
          id: item.id,
          title: item.title,
          description: item.description,
          availability: item.availability,
          condition: item.condition,
          price: item.price,
          link: item.link,
          image_link: item.image_link,
          brand: item.brand,
          google_product_category: item.google_product_category,
          'address.addr1': item.address.addr1,
          'address.city': item.address.city,
          'address.region': item.address.region,
          'address.postal_code': item.address.postal_code,
          'address.country': item.address.country,
          property_type: item.property_type,
          num_beds: item.num_beds,
          num_baths: item.num_baths,
          'area_size.value': item.area_size.value,
          'area_size.unit': item.area_size.unit,
          latitude: item.latitude || '',
          longitude: item.longitude || ''
        }))
      )

      return new NextResponse(csv, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': 'attachment; filename="facebook-catalog.csv"'
        }
      })
    }

    // Default to JSON
    return NextResponse.json({
      data: catalogItems,
      meta: {
        total: catalogItems.length,
        limit,
        offset,
        generated_at: new Date().toISOString()
      }
    })
  } catch (error) {
    console.error('Error generating Facebook catalog:', error)
    return NextResponse.json(
      { error: 'Failed to generate catalog' },
      { status: 500 }
    )
  }
}
