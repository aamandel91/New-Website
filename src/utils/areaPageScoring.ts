export interface AreaPageScore {
  score: number
  indexDirective: 'index, follow' | 'noindex, follow' | 'noindex, nofollow'
  reasons: string[]
}

// Major sub-types that always have search volume
const MAJOR_SUBTYPES = [
  'single-family-homes',
  'condos',
  'townhomes',
  'luxury',
  'waterfront',
  'new-construction',
  'land'
]

// Niche sub-types with lower search volume
const NICHE_SUBTYPES = [
  'va-approved',
  'fha-approved',
  'pet-friendly-condos',
  'one-story',
  'two-story',
  'one-acre-plus',
  'foreclosures',
  'country-club',
  'ocean-access'
]

export function scoreAreaPage(params: {
  pageType: 'city' | 'subType' | 'neighborhood' | 'zip' | 'schools'
  listingCount: number
  subTypeSlug?: string
  hasCmsContent?: boolean
}): AreaPageScore {
  let score = 0
  const reasons: string[] = []

  // Listing count scoring
  if (params.listingCount >= 10) {
    score += 3
    reasons.push(`+3 has ${params.listingCount} active listings`)
  } else if (params.listingCount >= 5) {
    score += 1
    reasons.push(`+1 has ${params.listingCount} listings (borderline)`)
  } else {
    score -= 2
    reasons.push(`-2 only ${params.listingCount} listings (thin)`)
  }

  // Has custom CMS content
  if (params.hasCmsContent) {
    score += 3
    reasons.push('+3 has custom CMS content')
  }

  // Page type scoring
  if (params.pageType === 'city') {
    score += 2
    reasons.push('+2 city page (always has volume)')
  } else if (params.pageType === 'zip' && params.listingCount >= 20) {
    score += 1
    reasons.push('+1 zip code with 20+ listings')
  } else if (params.pageType === 'neighborhood' && params.listingCount >= 10) {
    score += 1
    reasons.push('+1 neighborhood with 10+ listings')
  }

  // Sub-type category scoring
  if (params.pageType === 'subType' && params.subTypeSlug) {
    if (MAJOR_SUBTYPES.includes(params.subTypeSlug)) {
      score += 1
      reasons.push('+1 major sub-type category')
    } else if (NICHE_SUBTYPES.includes(params.subTypeSlug)) {
      score -= 1
      reasons.push('-1 niche sub-type (needs listings to justify)')
    }
  }

  // Schools page — only index if we have actual school data
  if (params.pageType === 'schools') {
    score -= 1
    reasons.push('-1 schools page (needs school data to justify)')
  }

  // Determine directive
  let indexDirective: AreaPageScore['indexDirective']
  if (score >= 3) {
    indexDirective = 'index, follow'
  } else if (score >= 1) {
    indexDirective = 'noindex, follow'
  } else {
    indexDirective = 'noindex, nofollow'
  }

  return { score, indexDirective, reasons }
}
