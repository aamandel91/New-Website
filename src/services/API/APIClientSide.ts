const CSR_API_URL = 'https://csr-api.repliers.io'
const CSR_API_KEY = process.env.NEXT_PUBLIC_REPLIERS_CSR_KEY || ''

class APIClientSide {
  async fetch(endpoint: string, params?: Record<string, unknown>): Promise<any> {
    const searchParams = new URLSearchParams()
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
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
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        console.error(`CSR API Error: ${response.status}`, endpoint)
        return null
      }

      return response.json()
    } catch (error) {
      console.error(`CSR API fetch error:`, endpoint, error)
      return null
    }
  }
}

export default APIClientSide
