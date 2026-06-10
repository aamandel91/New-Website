import { NextResponse } from 'next/server'

import { subTypes, targetCounties } from '@configs/page-generation'
import { requireAdmin } from '@/utils/adminAuth'

import { fetchCountyCities, fetchSubTypeCount } from 'services/pageGeneration'
import { scoreAreaPage } from 'utils/areaPageScoring'

export interface AreaScoreEntry {
  url: string
  pageType: 'city' | 'subType'
  city: string
  subType?: string
  listingCount: number
  score: number
  indexDirective: string
}

export async function GET(request: Request) {
  const denied = await requireAdmin(request)
  if (denied) return denied

  try {
    const entries: AreaScoreEntry[] = []

    for (const county of targetCounties) {
      const cities = await fetchCountyCities(county)

      for (const city of cities) {
        const citySlug = city.name.toLowerCase().replace(/\s+/g, '-')
        const cityCount = city.activeCount ?? 0
        const cityScore = scoreAreaPage({
          pageType: 'city',
          listingCount: cityCount
        })

        entries.push({
          url: `/${citySlug}`,
          pageType: 'city',
          city: city.name,
          listingCount: cityCount,
          score: cityScore.score,
          indexDirective: cityScore.indexDirective
        })

        // Sample first 5 sub-types per city to keep response fast
        for (const st of subTypes.slice(0, 5)) {
          const stCount = await fetchSubTypeCount(city.name, st)
          const stScore = scoreAreaPage({
            pageType: 'subType',
            listingCount: stCount,
            subTypeSlug: st.slug
          })

          entries.push({
            url: `/${citySlug}/${st.slug}`,
            pageType: 'subType',
            city: city.name,
            subType: st.label,
            listingCount: stCount,
            score: stScore.score,
            indexDirective: stScore.indexDirective
          })
        }
      }
    }

    return NextResponse.json({ entries })
  } catch (error) {
    console.error('Failed to generate area scores:', error)
    return NextResponse.json(
      { error: 'Failed to generate area scores', entries: [] },
      { status: 500 }
    )
  }
}
