import { ImageResponse } from 'next/og'
import type { NextRequest } from 'next/server'

import { getSubTypeBySlug } from '@configs/page-generation'
import { parseCleanSlug, slugToDisplayName } from 'utils/templateEngine'
import { tenant } from '@/configs/tenant.config'

export const runtime = 'edge'

const NAVY = '#1a1a2e'
const GOLD = '#b19a55'
const WHITE = '#f5f5f5'
const MUTED = '#9b9b9b'

function getHeading(slugs: string[] | undefined): string {
  if (!slugs || slugs.length === 0) return 'South Florida Real Estate'
  const parsed = parseCleanSlug(slugs)
  if (!parsed) return slugToDisplayName(slugs[0] || 'South Florida')

  const cityName = slugToDisplayName(parsed.city)

  switch (parsed.pageType) {
    case 'city':
      return `Homes for Sale in ${cityName}`
    case 'city-subtype': {
      const stConfig = parsed.subType ? getSubTypeBySlug(parsed.subType) : null
      const label = stConfig?.label || slugToDisplayName(parsed.subType || '')
      return `${label} in ${cityName}`
    }
    case 'city-neighborhood':
      return `${slugToDisplayName(parsed.neighborhood || '')}, ${cityName}`
    case 'city-zip':
      return `Homes in ${cityName} ${parsed.zip || ''}`
    case 'city-schools':
      return `Schools in ${cityName}`
    default:
      return cityName
  }
}

export async function GET(req: NextRequest) {
  const slugParam = req.nextUrl.searchParams.get('slug') ?? ''
  const slugs = slugParam ? slugParam.split('/').filter(Boolean) : []
  const heading = getHeading(slugs)

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: NAVY,
          backgroundImage: `radial-gradient(circle at 25% 30%, rgba(177, 154, 85, 0.18) 0%, transparent 60%), radial-gradient(circle at 75% 70%, rgba(177, 154, 85, 0.10) 0%, transparent 50%)`,
          padding: '80px',
          fontFamily: 'sans-serif',
        }}
      >
        <div
          style={{
            display: 'flex',
            width: '120px',
            height: '4px',
            backgroundColor: GOLD,
            marginBottom: '40px',
          }}
        />

        <div
          style={{
            display: 'flex',
            color: GOLD,
            fontSize: '76px',
            fontWeight: 700,
            lineHeight: 1.1,
            textAlign: 'center',
            maxWidth: '1000px',
            letterSpacing: '-0.02em',
          }}
        >
          {heading}
        </div>

        <div
          style={{
            display: 'flex',
            color: WHITE,
            fontSize: '32px',
            fontWeight: 400,
            marginTop: '32px',
            textAlign: 'center',
          }}
        >
          South Florida Real Estate
        </div>

        <div
          style={{
            display: 'flex',
            color: MUTED,
            fontSize: '24px',
            fontWeight: 500,
            marginTop: '60px',
            letterSpacing: '0.05em',
          }}
        >
          {tenant.brand.domainDisplay}
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
    }
  )
}
