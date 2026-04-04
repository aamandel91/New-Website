import APISearchCSR from 'services/API/APISearchCSR'

export async function fetchSimilarProperties(property: any, limit = 6) {
  try {
    const price = parseFloat(property.listPrice) || 0
    const result = await APISearchCSR.searchListings({
      boardId: property.boardId || 110,
      city: property.address?.city,
      status: 'A',
      minPrice: Math.round(price * 0.7),
      maxPrice: Math.round(price * 1.3),
      resultsPerPage: limit + 1,
    })

    if (!result?.listings) return []

    return result.listings
      .filter((l: any) => l.mlsNumber !== property.mlsNumber)
      .slice(0, limit)
  } catch (error) {
    console.error('Error fetching similar properties:', error)
    return []
  }
}

export async function fetchMarketStats(city: string, state: string, boardId = 110) {
  try {
    const result = await APISearchCSR.searchListings({
      boardId,
      city,
      status: 'A',
      listings: false,
      statistics: 'listPrice',
      resultsPerPage: 1,
    })

    if (!result?.statistics) return null

    return {
      averagePrice: result.statistics?.soldPrice?.avg ?? null,
      medianPrice: result.statistics?.soldPrice?.med ?? null,
      totalActiveListings: result.count,
      pricePerSqft: null,
      averageDaysOnMarket: result.statistics?.daysOnMarket?.avg ?? null,
      inventoryMonths: null,
    }
  } catch (error) {
    console.error('Error fetching market stats:', error)
    return null
  }
}
