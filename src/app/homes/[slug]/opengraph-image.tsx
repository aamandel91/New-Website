import { ImageResponse } from 'next/og'

import { parseAddressSlug } from 'utils/propertyUrls'

// Next.js auto-generated OG image for /homes/[slug] property pages.
// See: https://nextjs.org/docs/app/api-reference/file-conventions/metadata/opengraph-image
export const runtime = 'edge'
export const alt = 'South Florida Property — Florida Home Finder'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

const NAVY = '#1a1a2e'
const GOLD = '#b19a55'
const WHITE = '#f5f5f5'
const MUTED = '#9b9b9b'

interface Props {
  params: { slug: string }
}

/**
 * Title-case a slug-derived string ("123 main st" -> "123 Main St").
 */
function titleCase(str: string): string {
  return str
    .split(' ')
    .map((word) => (word ? word[0].toUpperCase() + word.slice(1) : ''))
    .join(' ')
}

export default async function Image({ params }: Props) {
  const parsed = parseAddressSlug(params.slug)

  // Fall back to the raw slug if parsing fails so we still ship a card.
  const street = parsed ? titleCase(parsed.street) : ''
  const city = parsed ? titleCase(parsed.city) : ''
  const region = parsed ? `${parsed.state} ${parsed.zip}` : ''

  const addressLine1 = street || params.slug.replace(/-/g, ' ')
  const addressLine2 = city && region ? `${city}, ${region}` : ''

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
        {/* Eyebrow / category label */}
        <div
          style={{
            display: 'flex',
            color: GOLD,
            fontSize: '24px',
            fontWeight: 600,
            letterSpacing: '0.15em',
            textTransform: 'uppercase',
            marginBottom: '28px',
          }}
        >
          South Florida Property
        </div>

        {/* Subtle gold accent bar */}
        <div
          style={{
            display: 'flex',
            width: '120px',
            height: '4px',
            backgroundColor: GOLD,
            marginBottom: '36px',
          }}
        />

        {/* Address line 1 — street */}
        <div
          style={{
            display: 'flex',
            color: WHITE,
            fontSize: '64px',
            fontWeight: 700,
            lineHeight: 1.1,
            textAlign: 'center',
            maxWidth: '1000px',
            letterSpacing: '-0.02em',
          }}
        >
          {addressLine1}
        </div>

        {/* Address line 2 — city, state zip */}
        {addressLine2 ? (
          <div
            style={{
              display: 'flex',
              color: GOLD,
              fontSize: '36px',
              fontWeight: 500,
              marginTop: '24px',
              textAlign: 'center',
            }}
          >
            {addressLine2}
          </div>
        ) : null}

        {/* Site brand */}
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
          FloridaHomeFinder.com
        </div>
      </div>
    ),
    {
      ...size,
    }
  )
}
