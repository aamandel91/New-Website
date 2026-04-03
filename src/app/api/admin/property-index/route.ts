import { NextResponse } from 'next/server'

import { loadPropertyIndex } from 'services/propertyIndex'

export async function GET() {
  try {
    const entries = await loadPropertyIndex()
    return NextResponse.json({ entries })
  } catch (error) {
    console.error('Failed to load property index:', error)
    return NextResponse.json(
      { error: 'Failed to load property index', entries: [] },
      { status: 500 }
    )
  }
}
