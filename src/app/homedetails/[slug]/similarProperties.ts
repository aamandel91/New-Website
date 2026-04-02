import { cache } from 'react'

import type { Property } from 'services/API'
import APISearchCSR from 'services/API/APISearchCSR'

/**
 * Fetch similar properties based on a given property's characteristics.
 * Uses price range, beds, baths, and location to find similar listings
 * via the Repliers CSR API (GET params only).
 */
export const fetchSimilarProperties = cache(
  async (property: Property, limit: number = 6): Promise<Property[]> => {
    try {
      const listPrice = parseFloat(property.listPrice)
      const city = property.address?.city

      if (!listPrice || !city) {
        return []
      }

      const beds = parseInt(property.details?.numBedrooms) || 0
      const baths = parseInt(property.details?.numBathrooms) || 0
      const boardId = property.boardId || 110

      const result = await APISearchCSR.searchListings({
        boardId,
        city,
        class: property.class,
        status: 'A',
        minPrice: Math.round(listPrice * 0.8),
        maxPrice: Math.round(listPrice * 1.2),
        ...(beds > 0 && {
          minBeds: Math.max(0, beds - 1),
          maxBeds: beds + 1,
        }),
        ...(baths > 0 && {
          minBaths: Math.max(0, baths - 1),
          maxBaths: baths + 1,
        }),
        resultsPerPage: limit + 1,
        sortBy: 'createdOnDesc',
      })

      if (!result?.listings) return []

      // Filter out the current property and limit results
      return result.listings
        .filter((p: Property) => p.mlsNumber !== property.mlsNumber)
        .slice(0, limit)
    } catch (error) {
      console.error('Error fetching similar properties:', error)
      return []
    }
  }
)

/**
 * Fetch market statistics for a specific area.
 * Uses the CSR API with statistics parameter for sold data.
 */
export const fetchMarketStats = cache(
  async (city: string, _state: string, boardId: number = 110) => {
    try {
      const result = await APISearchCSR.searchListings({
        boardId,
        city,
        status: 'U',
        lastStatus: 'Sld',
        listings: false,
        statistics: 'avg-listPrice,min-listPrice,max-listPrice,avg-soldPrice,med-soldPrice,avg-daysOnMarket,grp-mth',
        resultsPerPage: 1,
      })

      if (!result) return null

      const { count, statistics } = result

      if (!statistics || count === 0) {
        return null
      }

      const averagePrice = statistics.listPrice
        ? Math.round(
            (parseFloat(statistics.listPrice.min) +
              parseFloat(statistics.listPrice.max)) /
              2
          )
        : 0

      const medianPrice = statistics.soldPrice?.med || 0
      const averageDaysOnMarket = Math.round(
        statistics.daysOnMarket?.avg || 0
      )

      // Calculate month-over-month change from monthly statistics
      let monthOverMonthChange: number | undefined
      if (statistics.soldPrice?.mth) {
        const months = Object.keys(statistics.soldPrice.mth).sort().reverse()
        if (months.length >= 2) {
          const currentMonth = statistics.soldPrice.mth[months[0]]
          const previousMonth = statistics.soldPrice.mth[months[1]]
          if (currentMonth && previousMonth && previousMonth.avg > 0) {
            monthOverMonthChange =
              ((currentMonth.avg - previousMonth.avg) / previousMonth.avg) * 100
          }
        }
      }

      // Calculate year-over-year change from monthly statistics
      let yearOverYearChange: number | undefined
      if (statistics.soldPrice?.mth) {
        const months = Object.keys(statistics.soldPrice.mth).sort().reverse()
        if (months.length >= 12) {
          const currentMonth = statistics.soldPrice.mth[months[0]]
          const yearAgoMonth = statistics.soldPrice.mth[months[11]]
          if (currentMonth && yearAgoMonth && yearAgoMonth.avg > 0) {
            yearOverYearChange =
              ((currentMonth.avg - yearAgoMonth.avg) / yearAgoMonth.avg) * 100
          }
        }
      }

      // Estimate inventory months using sold statistics
      let inventoryMonths = 10
      if (statistics.soldPrice?.mth) {
        const months = Object.keys(statistics.soldPrice.mth).sort().reverse()
        if (months.length > 0) {
          const recentMonths = months.slice(0, 3)
          const avgMonthlySales =
            recentMonths.reduce((sum, month) => {
              return sum + (statistics.soldPrice?.mth[month]?.count || 0)
            }, 0) / recentMonths.length

          if (avgMonthlySales > 0) {
            inventoryMonths = count / avgMonthlySales
          }
        }
      }

      return {
        averagePrice,
        medianPrice,
        averageDaysOnMarket,
        totalActiveListings: count,
        pricePerSqft: 0,
        inventoryMonths: Math.round(inventoryMonths * 10) / 10,
        monthOverMonthChange: monthOverMonthChange
          ? Math.round(monthOverMonthChange * 10) / 10
          : undefined,
        yearOverYearChange: yearOverYearChange
          ? Math.round(yearOverYearChange * 10) / 10
          : undefined,
      }
    } catch (error) {
      console.error('Error fetching market stats:', error)
      return null
    }
  }
)
