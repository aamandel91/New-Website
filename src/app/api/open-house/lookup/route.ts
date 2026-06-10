import { NextResponse } from 'next/server'

import searchConfig from '@configs/search'

import { APIPropertyDetails } from 'services/API'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const mls = searchParams.get('mls')

    if (!mls) {
      return NextResponse.json(
        { error: 'MLS number is required' },
        { status: 400 }
      )
    }

    const property = await APIPropertyDetails.fetchProperty(
      mls,
      searchConfig.defaultBoardId
    )

    if (!property) {
      return NextResponse.json({ error: 'Property not found' }, { status: 404 })
    }

    return NextResponse.json({
      property: {
        mlsNumber: property.mlsNumber,
        address: property.address,
        listPrice: property.listPrice,
        images: property.images || []
      }
    })
  } catch (error: any) {
    console.error('Failed to look up property:', error)

    if (error?.status === 404) {
      return NextResponse.json({ error: 'Property not found' }, { status: 404 })
    }

    return NextResponse.json(
      { error: 'Failed to look up property' },
      { status: 500 }
    )
  }
}
