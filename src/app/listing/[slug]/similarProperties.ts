import { cache } from 'react'
import { APISearch, type Property } from 'services/API'
import searchConfig from '@configs/search'

/**
 * Fetch similar properties based on a given property's characteristics
 * Uses price range, beds, baths, and location to find similar listings
 */
export const fetchSimilarProperties = cache(
  async (property: Property, limit: number = 6): Promise<Property[]> => {
    try {
      const { price, beds, baths, address, boardId = searchConfig.defaultBoardId } = property

      if (!price || !address?.city) {
        return []
      }

      // Calculate price range (+/- 20%)
      const priceMin = Math.floor(price * 0.8)
      const priceMax = Math.ceil(price * 1.2)

      // Build search parameters
      const searchParams = {
        get: {
          boardId,
          page: 1,
          pageSize: limit + 1, // Get one extra in case current property is in results
        },
        post: {
          filters: {
            // Price range
            'price.current': {
              $gte: priceMin,
              $lte: priceMax,
            },
            // Same city
            'address.city': address.city,
            // Similar bed count (+/- 1)
            ...(beds && {
              beds: {
                $gte: Math.max(0, beds - 1),
                $lte: beds + 1,
              },
            }),
            // Similar bath count (+/- 1)
            ...(baths && {
              baths: {
                $gte: Math.max(0, baths - 1),
                $lte: baths + 1,
              },
            }),
            // Only active listings
            status: 'active',
          },
        },
      }

      const response = await APISearch.fetch(searchParams)

      // Filter out the current property and limit results
      const similarProperties = response.listings
        .filter((p: Property) => p.mlsNumber !== property.mlsNumber)
        .slice(0, limit)

      return similarProperties
    } catch (error) {
      console.error('Error fetching similar properties:', error)
      return []
    }
  }
)

/**
 * Fetch market statistics for a specific area
 * Uses API-provided statistics for accurate market data
 */
export const fetchMarketStats = cache(
  async (city: string, state: string, boardId: number = searchConfig.defaultBoardId) => {
    try {
      // Fetch active listings with statistics
      const searchParams = {
        get: {
          boardId,
          page: 1,
          pageSize: 100,
        },
        post: {
          filters: {
            'address.city': city,
            'address.state': state,
            status: 'active',
          },
        },
      }

      const response = await APISearch.fetch(searchParams)
      const { listings, count, statistics } = response

      if (!statistics || count === 0) {
        return null
      }

      // Use API-provided statistics for accuracy
      const averagePrice = statistics.listPrice ?
        Math.round((parseFloat(statistics.listPrice.min) + parseFloat(statistics.listPrice.max)) / 2) :
        0

      const medianPrice = statistics.soldPrice?.med || 0
      const averageDaysOnMarket = Math.round(statistics.daysOnMarket?.avg || 0)

      // Calculate price per sqft from listings
      const sqfts = listings.map((p: Property) => p.sqft || 0).filter((s: number) => s > 0)
      const prices = listings.map((p: Property) => p.price || 0).filter((p: number) => p > 0)
      const pricePerSqft = sqfts.length > 0 && prices.length > 0 ?
        Math.round(prices.reduce((sum, p) => sum + p, 0) / prices.length /
                   (sqfts.reduce((sum, s) => sum + s, 0) / sqfts.length)) : 0

      // Calculate month-over-month change from monthly statistics
      let monthOverMonthChange: number | undefined
      if (statistics.soldPrice?.mth) {
        const months = Object.keys(statistics.soldPrice.mth).sort().reverse()
        if (months.length >= 2) {
          const currentMonth = statistics.soldPrice.mth[months[0]]
          const previousMonth = statistics.soldPrice.mth[months[1]]
          if (currentMonth && previousMonth && previousMonth.avg > 0) {
            monthOverMonthChange = ((currentMonth.avg - previousMonth.avg) / previousMonth.avg) * 100
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
            yearOverYearChange = ((currentMonth.avg - yearAgoMonth.avg) / yearAgoMonth.avg) * 100
          }
        }
      }

      // Estimate inventory months using sold statistics
      let inventoryMonths = 10 // Default balanced market
      if (statistics.soldPrice?.mth) {
        const months = Object.keys(statistics.soldPrice.mth).sort().reverse()
        if (months.length > 0) {
          const recentMonths = months.slice(0, 3)
          const avgMonthlySales = recentMonths.reduce((sum, month) => {
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
        pricePerSqft,
        inventoryMonths: Math.round(inventoryMonths * 10) / 10,
        monthOverMonthChange: monthOverMonthChange ? Math.round(monthOverMonthChange * 10) / 10 : undefined,
        yearOverYearChange: yearOverYearChange ? Math.round(yearOverYearChange * 10) / 10 : undefined,
      }
    } catch (error) {
      console.error('Error fetching market stats:', error)
      return null
    }
  }
)
