import { NextResponse } from 'next/server'

import { requireAdmin } from '@/utils/adminAuth'

import { loadPropertyIndex } from 'services/propertyIndex'

export async function GET(request: Request) {
  const denied = await requireAdmin(request)
  if (denied) return denied

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
