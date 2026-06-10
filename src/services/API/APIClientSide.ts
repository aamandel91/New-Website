const CSR_API_URL = 'https://csr-api.repliers.io'
const CSR_API_KEY = process.env.NEXT_PUBLIC_REPLIERS_CSR_KEY || ''

// Valid Repliers CSR API parameters — anything not in this list gets stripped
const VALID_CSR_PARAMS = new Set([
  'boardId',
  'resultsPerPage',
  'pageNum',
  'sortBy',
  'fields',
  'status',
  'lastStatus',
  'type',
  'class',
  'city',
  'area',
  'neighborhood',
  'zip',
  'address.city',
  'address.area',
  'address.neighborhood',
  'address.zip',
  'address.streetNumber',
  'address.streetName',
  'minPrice',
  'maxPrice',
  'minBedrooms',
  'maxBedrooms',
  'minBathrooms',
  'maxBathrooms',
  'minSqft',
  'maxSqft',
  'minLotSize',
  'maxLotSize',
  'minYearBuilt',
  'maxYearBuilt',
  'propertyType',
  'style',
  'minOpenHouseDate',
  'maxOpenHouseDate',
  'listings',
  'aggregates',
  'statistics',
  'clusterPrecision',
  'clusterFields',
  'lat',
  'long',
  'radius',
  'minLatitude',
  'maxLatitude',
  'minLongitude',
  'maxLongitude',
  'hasImages',
  'updatedOnMin',
  'updatedOnMax',
  'keywords',
  'operator',
  'search',
  'state',
  'resultType'
])

class APIClientSide {
  async fetch(
    endpoint: string,
    params?: Record<string, unknown>
  ): Promise<any> {
    const searchParams = new URLSearchParams()
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          // Strip params the CSR API doesn't recognize
          if (!VALID_CSR_PARAMS.has(key)) return
          if (Array.isArray(value)) {
            value.forEach((v) => {
              if (v !== undefined && v !== null && v !== '') {
                searchParams.append(key, String(v))
              }
            })
          } else {
            searchParams.set(key, String(value))
          }
        }
      })
    }

    const queryStr = searchParams.toString()
    const url = queryStr
      ? `${CSR_API_URL}${endpoint}?${queryStr}`
      : `${CSR_API_URL}${endpoint}`

    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'REPLIERS-API-KEY': CSR_API_KEY,
          'Content-Type': 'application/json'
        },
        // Cache listing stats server-side for 15 min - keeps SEO pages
        // ISR-compatible and cuts Repliers API usage. Ignored in the browser.
        next: { revalidate: 900 }
      })

      if (!response.ok) {
        console.error(`CSR API Error: ${response.status}`, endpoint)
        return null
      }

      return response.json()
    } catch (error) {
      console.error('CSR API fetch error:', endpoint, error)
      return null
    }
  }
}

export default APIClientSide
