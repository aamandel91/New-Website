import { NextResponse } from 'next/server'

const REPLIERS_API_KEY = process.env.REPLIERS_API_KEY || ''
const ESTIMATE_API_URL = 'https://api.repliers.io/estimates'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const {
      streetAddress,
      city,
      state,
      zipCode,
      bedrooms,
      bathrooms,
      squareFeet,
      propertyType,
      style,
      yearBuilt,
      garageSpaces,
      overallQuality,
      annualTaxes,
      lotDepth,
      lotWidth
    } = body as {
      streetAddress: string
      city: string
      state?: string
      zipCode: string
      bedrooms: number
      bathrooms: number
      squareFeet: number
      propertyType?: string
      style?: string
      yearBuilt?: number
      garageSpaces?: number
      overallQuality?: string
      annualTaxes?: number
      lotDepth?: number
      lotWidth?: number
    }

    if (
      !streetAddress ||
      !city ||
      !zipCode ||
      !bedrooms ||
      !bathrooms ||
      !squareFeet
    ) {
      return NextResponse.json(
        {
          error:
            'Missing required fields: streetAddress, city, zipCode, bedrooms, bathrooms, squareFeet'
        },
        { status: 400 }
      )
    }

    const payload: Record<string, unknown> = {
      boardId: 110,
      address: {
        streetNumber: streetAddress.split(' ')[0] || '',
        streetName:
          streetAddress.split(' ').slice(1).join(' ') || streetAddress,
        city,
        state: state || 'FL',
        zip: zipCode
      },
      details: {
        numBedrooms: bedrooms,
        numBathrooms: bathrooms,
        sqft: squareFeet,
        ...(propertyType ? { propertyType } : {}),
        ...(style ? { style } : {}),
        ...(yearBuilt ? { yearBuilt } : {}),
        ...(garageSpaces != null ? { numGarageSpaces: garageSpaces } : {}),
        ...(overallQuality ? { overallQuality } : {})
      },
      taxes: annualTaxes ? { annualAmount: annualTaxes } : undefined,
      lot:
        lotDepth || lotWidth
          ? {
              ...(lotDepth ? { depth: lotDepth } : {}),
              ...(lotWidth ? { width: lotWidth } : {})
            }
          : undefined
    }

    // Remove undefined keys
    Object.keys(payload).forEach((key) => {
      if (payload[key] === undefined) delete payload[key]
    })

    const response = await fetch(ESTIMATE_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'REPLIERS-API-KEY': REPLIERS_API_KEY
      },
      body: JSON.stringify(payload)
    })

    if (!response.ok) {
      const errText = await response.text().catch(() => '')
      console.error('[Estimates] API error:', response.status, errText)
      return NextResponse.json(
        { error: 'Failed to generate estimate' },
        { status: response.status >= 500 ? 502 : response.status }
      )
    }

    const data = await response.json()

    return NextResponse.json(data, {
      headers: {
        'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=7200'
      }
    })
  } catch (error) {
    console.error('[Estimates] Route error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
