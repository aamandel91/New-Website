import { cache } from 'react'

import APISearchCSR from 'services/API/APISearchCSR'

export interface MarketTrendsData {
  date: string
  medianPrice: number | null
  averagePrice: number | null
  daysOnMarket: number | null
  listingsCount: number | null
}

export interface MarketTrendsSummary {
  currentMedianPrice: number
  monthOverMonthChange?: number
  yearOverYearChange?: number
  averageDaysOnMarket: number
  totalActiveListings: number
  inventoryMonths: number
}

/**
 * Fetch market trends data for charting
 * Returns monthly historical data for price and market metrics
 */
export const fetchMarketTrends = cache(
  async (
    city: string,
    _state: string,
    boardId: number = 110,
    monthsBack: number = 12
  ): Promise<{
    chartData: MarketTrendsData[]
    summary: MarketTrendsSummary | null
  }> => {
    try {
      const response = await APISearchCSR.searchListings({
        boardId,
        city,
        status: 'U',
        lastStatus: 'Sld',
        listings: false,
        statistics: 'avg-soldPrice,med-soldPrice,avg-daysOnMarket,grp-mth',
        resultsPerPage: 1,
      })

      if (!response) {
        return { chartData: [], summary: null }
      }

      const { count, statistics } = response

      if (!statistics) {
        return { chartData: [], summary: null }
      }

      // Extract monthly data for charting
      const chartData: MarketTrendsData[] = []

      if (statistics.soldPrice?.mth) {
        const months = Object.keys(statistics.soldPrice.mth).sort()
        const recentMonths = months.slice(-monthsBack)

        recentMonths.forEach((month) => {
          const priceData = statistics.soldPrice?.mth[month]
          const domData = statistics.daysOnMarket?.mth?.[month]

          chartData.push({
            date: month,
            medianPrice: priceData?.med || null,
            averagePrice: priceData?.avg || null,
            daysOnMarket: domData?.med || null,
            listingsCount: priceData?.count || null,
          })
        })
      }

      // Calculate summary statistics
      const months = Object.keys(statistics.soldPrice?.mth || {}).sort().reverse()
      let summary: MarketTrendsSummary | null = null

      if (months.length > 0) {
        const currentMonth = statistics.soldPrice?.mth[months[0]]
        const averageDaysOnMarket = Math.round(statistics.daysOnMarket?.avg || 0)

        // Month-over-month change
        let monthOverMonthChange: number | undefined
        if (months.length >= 2) {
          const previousMonth = statistics.soldPrice?.mth[months[1]]
          if (currentMonth && previousMonth && previousMonth.avg > 0) {
            monthOverMonthChange =
              ((currentMonth.avg - previousMonth.avg) / previousMonth.avg) * 100
          }
        }

        // Year-over-year change
        let yearOverYearChange: number | undefined
        if (months.length >= 12) {
          const yearAgoMonth = statistics.soldPrice?.mth[months[11]]
          if (currentMonth && yearAgoMonth && yearAgoMonth.avg > 0) {
            yearOverYearChange =
              ((currentMonth.avg - yearAgoMonth.avg) / yearAgoMonth.avg) * 100
          }
        }

        // Calculate inventory months
        let inventoryMonths = 10 // Default balanced market
        const recentMonths = months.slice(0, 3)
        const avgMonthlySales =
          recentMonths.reduce((sum, month) => {
            return sum + (statistics.soldPrice?.mth[month]?.count || 0)
          }, 0) / recentMonths.length

        if (avgMonthlySales > 0) {
          inventoryMonths = count / avgMonthlySales
        }

        summary = {
          currentMedianPrice: currentMonth?.med || 0,
          monthOverMonthChange: monthOverMonthChange
            ? Math.round(monthOverMonthChange * 10) / 10
            : undefined,
          yearOverYearChange: yearOverYearChange
            ? Math.round(yearOverYearChange * 10) / 10
            : undefined,
          averageDaysOnMarket,
          totalActiveListings: count,
          inventoryMonths: Math.round(inventoryMonths * 10) / 10,
        }
      }

      return { chartData, summary }
    } catch (error) {
      console.error('Error fetching market trends:', error)
      return { chartData: [], summary: null }
    }
  }
)

/**
 * Determines market condition based on inventory months
 */
export const getMarketCondition = (
  inventoryMonths: number
): { label: string; color: string } => {
  if (inventoryMonths < 5) {
    return { label: "Seller's Market", color: '#d32f2f' }
  } else if (inventoryMonths > 7) {
    return { label: "Buyer's Market", color: '#1976d2' }
  } else {
    return { label: 'Balanced Market', color: '#388e3c' }
  }
}
