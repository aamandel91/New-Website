import { ImageResponse } from 'next/og'
import type { NextRequest } from 'next/server'

import { getSubTypeBySlug } from '@configs/page-generation'
import { tenant } from '@/configs/tenant.config'

import { parseCleanSlug, slugToDisplayName } from 'utils/templateEngine'

export const runtime = 'edge'

const NAVY = tenant.visualIdentity.colors.ogBackground
const GOLD = tenant.visualIdentity.colors.accent
const WHITE = '#f5f5f5'
const MUTED = tenant.visualIdentity.colors.ogMuted
const OG_FONT = tenant.visualIdentity.ogImage.fontFamily

function hexToRgb(hex: string): string {
  const h = hex.replace('#', '')
  const r = parseInt(h.slice(0, 2), 16)
  const g = parseInt(h.slice(2, 4), 16)
  const b = parseInt(h.slice(4, 6), 16)
  return `${r}, ${g}, ${b}`
}
const GOLD_RGB = hexToRgb(GOLD)

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
          backgroundImage: `radial-gradient(circle at 25% 30%, rgba(${GOLD_RGB}, 0.18) 0%, transparent 60%), radial-gradient(circle at 75% 70%, rgba(${GOLD_RGB}, 0.10) 0%, transparent 50%)`,
          padding: '80px',
          fontFamily: OG_FONT
        }}
      >
        <div
          style={{
            display: 'flex',
            width: '120px',
            height: '4px',
            backgroundColor: GOLD,
            marginBottom: '40px'
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
            letterSpacing: '-0.02em'
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
            textAlign: 'center'
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
            letterSpacing: '0.05em'
          }}
        >
          {tenant.brand.domainDisplay}
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630
    }
  )
}
