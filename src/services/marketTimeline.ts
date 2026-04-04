import APISearchCSR from 'services/API/APISearchCSR'

export interface MonthlyDataPoint {
  date: string
  avgPrice: number
  medPrice: number
  count: number
}

export interface MarketTimelineParams {
  city: string
  propertyType?: string
  beds?: string
  baths?: string
  minPrice?: string
  maxPrice?: string
  months?: number
}

export interface MarketTimelineResult {
  data: MonthlyDataPoint[]
  trend: {
    direction: 'up' | 'down' | 'flat'
    percentage: number
  }
  summary: {
    avgPrice: number
    medPrice: number
    avgDaysOnMarket: number
  }
}

function computeTrend(data: MonthlyDataPoint[]): MarketTimelineResult['trend'] {
  if (data.length < 2) return { direction: 'flat', percentage: 0 }

  const recentSlice = data.slice(-3)
  const earlierSlice = data.slice(0, 3)

  const recentAvg =
    recentSlice.reduce((s, d) => s + d.avgPrice, 0) / recentSlice.length
  const earlierAvg =
    earlierSlice.reduce((s, d) => s + d.avgPrice, 0) / earlierSlice.length

  if (earlierAvg === 0) return { direction: 'flat', percentage: 0 }

  const pct = ((recentAvg - earlierAvg) / earlierAvg) * 100
  const rounded = Math.round(pct * 10) / 10

  return {
    direction: rounded > 0.5 ? 'up' : rounded < -0.5 ? 'down' : 'flat',
    percentage: Math.abs(rounded),
  }
}

export async function fetchMarketTimeline(
  params: MarketTimelineParams
): Promise<MarketTimelineResult> {
  const emptyResult: MarketTimelineResult = {
    data: [],
    trend: { direction: 'flat', percentage: 0 },
    summary: { avgPrice: 0, medPrice: 0, avgDaysOnMarket: 0 },
  }

  try {
    const result = await APISearchCSR.searchListings({
      boardId: 110,
      city: params.city,
      propertyType: params.propertyType,
      status: 'U',
      lastStatus: 'Sld',
      listings: false,
      statistics: 'soldPrice',
      resultsPerPage: 1,
      ...(params.beds && { minBeds: parseInt(params.beds) }),
      ...(params.baths && { minBaths: parseInt(params.baths) }),
      ...(params.minPrice && { minPrice: parseInt(params.minPrice) }),
      ...(params.maxPrice && { maxPrice: parseInt(params.maxPrice) }),
    })

    if (!result?.statistics?.soldPrice?.mth) return emptyResult

    const months = result.statistics.soldPrice.mth
    const entries = Object.entries(months)
      .map(([month, data]: [string, any]) => ({
        date: month,
        avgPrice: data.avg || 0,
        medPrice: data.med || data.avg || 0,
        count: data.count || 0,
      }))
      .sort((a, b) => a.date.localeCompare(b.date))
      .slice(-(params.months || 12))

    const trend = computeTrend(entries)

    const avgPrice = entries.length > 0
      ? Math.round(entries.reduce((s, d) => s + d.avgPrice, 0) / entries.length)
      : 0
    const medPrice = entries.length > 0
      ? Math.round(entries.reduce((s, d) => s + d.medPrice, 0) / entries.length)
      : 0

    return {
      data: entries,
      trend,
      summary: { avgPrice, medPrice, avgDaysOnMarket: 0 },
    }
  } catch (error) {
    console.error('Error fetching market timeline:', error)
    return emptyResult
  }
}
