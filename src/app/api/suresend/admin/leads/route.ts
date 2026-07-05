import { NextResponse } from 'next/server'

import { listPeople } from '@/services/suresend/client'
import { requireAdmin } from '@/utils/adminAuth'

export async function GET(request: Request) {
  const denied = await requireAdmin(request)
  if (denied) return denied

  try {
    const result = await listPeople(20, 0)

    const oneWeekAgo = new Date()
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7)

    const thisWeek = result.data.filter(
      (p) => p.createdAt && new Date(p.createdAt) >= oneWeekAgo
    ).length

    const bySource: Record<string, number> = {}
    for (const person of result.data) {
      const src = person.source || 'unknown'
      bySource[src] = (bySource[src] || 0) + 1
    }

    return NextResponse.json({
      people: result.data,
      stats: {
        total: result.total,
        thisWeek,
        bySource
      }
    })
  } catch (error) {
    console.error('[SureSend] Admin leads error:', error)
    return NextResponse.json(
      {
        error: 'Failed to fetch leads from CRM',
        people: [],
        stats: { total: 0, thisWeek: 0, bySource: {} }
      },
      { status: 502 }
    )
  }
}
