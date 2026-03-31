import type { ApiStatisticRecord } from 'services/API'
import APISearch from 'services/API/APISearch'

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

  // Compare the average of the last 3 months vs first 3 months
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
  const months = params.months ?? 12
  const minDate = new Date()
  minDate.setDate(1)
  minDate.setMonth(minDate.getMonth() - months)
  const minSoldDate = minDate.toISOString().split('T')[0]

  const maxDate = new Date()
  maxDate.setDate(1)
  maxDate.setMonth(maxDate.getMonth() + 1)
  maxDate.setDate(0) // last day of current month
  const maxSoldDate = maxDate.toISOString().split('T')[0]

  // Build query params
  const getParams: Record<string, unknown> = {
    status: 'U',
    lastStatus: 'Sld',
    city: params.city,
    statistics: 'avg-soldPrice,med-soldPrice,avg-daysOnMarket,grp-mth',
    minSoldDate,
    maxSoldDate,
    listings: false,
    pageSize: 1,
  }

  if (params.propertyType) {
    getParams.propertyType = params.propertyType
  }
  if (params.beds) {
    getParams.minBeds = params.beds
  }
  if (params.baths) {
    getParams.minBaths = params.baths
  }
  if (params.minPrice) {
    getParams.minPrice = params.minPrice
  }
  if (params.maxPrice) {
    getParams.maxPrice = params.maxPrice
  }

  try {
    const response = await APISearch.fetch({
      get: getParams,
      post: {},
    })

    const soldPriceMth = response?.statistics?.soldPrice?.mth
    const domMth = response?.statistics?.daysOnMarket?.mth

    if (!soldPriceMth) {
      return {
        data: [],
        trend: { direction: 'flat', percentage: 0 },
        summary: { avgPrice: 0, medPrice: 0, avgDaysOnMarket: 0 },
      }
    }

    // Convert monthly data to sorted array
    const entries = Object.entries(soldPriceMth)
      .map(([date, record]: [string, ApiStatisticRecord]) => ({
        date,
        avgPrice: Math.round(record.avg),
        medPrice: Math.round(record.med),
        count: record.count,
      }))
      .sort((a, b) => a.date.localeCompare(b.date))
      .slice(-months)

    const trend = computeTrend(entries)

    // Summary from the full response stats
    const avgPrice = response?.statistics?.soldPrice?.avg
      ? Math.round(response.statistics.soldPrice.avg)
      : entries.length > 0
        ? Math.round(entries.reduce((s, d) => s + d.avgPrice, 0) / entries.length)
        : 0

    const medPrice = response?.statistics?.soldPrice?.med
      ? Math.round(response.statistics.soldPrice.med)
      : entries.length > 0
        ? Math.round(entries.reduce((s, d) => s + d.medPrice, 0) / entries.length)
        : 0

    const avgDaysOnMarket = response?.statistics?.daysOnMarket?.avg
      ? Math.round(response.statistics.daysOnMarket.avg)
      : domMth
        ? Math.round(
            Object.values(domMth as Record<string, ApiStatisticRecord>).reduce(
              (s, r) => s + r.avg,
              0
            ) /
              Object.keys(domMth).length
          )
        : 0

    return {
      data: entries,
      trend,
      summary: { avgPrice, medPrice, avgDaysOnMarket },
    }
  } catch (error) {
    console.error('[MarketTimeline] error fetching data', error)
    return {
      data: [],
      trend: { direction: 'flat', percentage: 0 },
      summary: { avgPrice: 0, medPrice: 0, avgDaysOnMarket: 0 },
    }
  }
}
