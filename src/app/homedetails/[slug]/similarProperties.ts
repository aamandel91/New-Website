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
 * Calculates average price, median price, average DOM, etc.
 */
export const fetchMarketStats = cache(
  async (city: string, state: string, boardId: number = searchConfig.defaultBoardId) => {
    try {
      // Fetch active listings in the area
      const searchParams = {
        get: {
          boardId,
          page: 1,
          pageSize: 100, // Get enough for statistical analysis
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
      const { listings, count } = response

      if (listings.length === 0) {
        return null
      }

      // Calculate statistics
      const prices = listings.map((p: Property) => p.price || 0).filter((p: number) => p > 0)
      const sqfts = listings.map((p: Property) => p.sqft || 0).filter((s: number) => s > 0)
      const daysOnMarket = listings
        .map((p: Property) => {
          if (!p.listingDate) return null
          const days = Math.floor(
            (Date.now() - new Date(p.listingDate).getTime()) / (1000 * 60 * 60 * 24)
          )
          return days
        })
        .filter((d): d is number => d !== null)

      // Calculate average
      const average = (arr: number[]) =>
        arr.length > 0 ? arr.reduce((sum, val) => sum + val, 0) / arr.length : 0

      // Calculate median
      const median = (arr: number[]) => {
        if (arr.length === 0) return 0
        const sorted = [...arr].sort((a, b) => a - b)
        const mid = Math.floor(sorted.length / 2)
        return sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid]
      }

      const averagePrice = Math.round(average(prices))
      const medianPrice = Math.round(median(prices))
      const averageDaysOnMarket = Math.round(average(daysOnMarket))
      const pricePerSqft = sqfts.length > 0 ? Math.round(average(prices) / average(sqfts)) : 0

      // Estimate inventory months (simplified calculation)
      // Typical: (Active Listings / Avg Monthly Sales)
      // Using rough estimate: assume 10% of active listings sell per month
      const inventoryMonths = count > 0 ? count / (count * 0.1) : 0

      return {
        averagePrice,
        medianPrice,
        averageDaysOnMarket,
        totalActiveListings: count,
        pricePerSqft,
        inventoryMonths: Math.round(inventoryMonths * 10) / 10, // Round to 1 decimal
        // These would need historical data from API
        monthOverMonthChange: undefined,
        yearOverYearChange: undefined,
      }
    } catch (error) {
      console.error('Error fetching market stats:', error)
      return null
    }
  }
)
