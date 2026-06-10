import { type NextRequest, NextResponse } from 'next/server'

import type { MarketTimelineParams } from 'services/marketTimeline'
import { fetchMarketTimeline } from 'services/marketTimeline'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const city = searchParams.get('city')

  if (!city) {
    return NextResponse.json(
      { error: 'city parameter is required' },
      { status: 400 }
    )
  }

  const months = searchParams.get('months')
  const params: MarketTimelineParams = {
    city,
    propertyType: searchParams.get('propertyType') ?? undefined,
    beds: searchParams.get('beds') ?? undefined,
    baths: searchParams.get('baths') ?? undefined,
    minPrice: searchParams.get('minPrice') ?? undefined,
    maxPrice: searchParams.get('maxPrice') ?? undefined,
    months: months ? parseInt(months, 10) : 12
  }

  try {
    const result = await fetchMarketTimeline(params)
    return NextResponse.json(result, {
      headers: {
        'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=7200'
      }
    })
  } catch {
    return NextResponse.json(
      { error: 'Failed to fetch market timeline data' },
      { status: 500 }
    )
  }
}
