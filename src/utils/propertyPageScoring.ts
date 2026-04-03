export interface PageScore {
  score: number
  indexDirective: 'index, follow' | 'noindex, follow' | 'noindex, nofollow'
  reason: string[]
}

export function scorePropertyPage(property: {
  status?: string
  lastStatus?: string
  soldDate?: string | null
  soldPrice?: number | string | null
  images?: string[]
  history?: any[]
  estimate?: { value?: number } | null
  details?: { description?: string } | null
  address?: { city?: string; area?: string } | null
}): PageScore {
  let score = 0
  const reasons: string[] = []

  // Active listing: +3
  if (property.status === 'A') {
    score += 3
    reasons.push('+3 active listing')
  }

  // Sold within 90 days: +2
  if (property.soldDate) {
    const soldDate = new Date(property.soldDate)
    const daysSinceSold = (Date.now() - soldDate.getTime()) / (1000 * 60 * 60 * 24)
    if (daysSinceSold <= 90) {
      score += 2
      reasons.push('+2 sold within 90 days')
    }
  }

  // Has 5+ photos: +2
  if (property.images && property.images.length >= 5) {
    score += 2
    reasons.push(`+2 has ${property.images.length} photos`)
  }

  // Has 2+ transactions in history: +1
  if (property.history && property.history.length >= 2) {
    score += 1
    reasons.push(`+1 has ${property.history.length} transactions`)
  }

  // Has estimate data: +1
  if (property.estimate?.value) {
    score += 1
    reasons.push('+1 has estimate data')
  }

  // In target city (Broward/Palm Beach area): +1
  const targetAreas = ['broward', 'palm beach', 'miami-dade']
  if (
    property.address?.area &&
    targetAreas.some((a) => property.address!.area!.toLowerCase().includes(a))
  ) {
    score += 1
    reasons.push('+1 target area')
  }

  // No photos: -2
  if (!property.images || property.images.length === 0) {
    score -= 2
    reasons.push('-2 no photos')
  }

  // Only 1 transaction with no description: -2
  if (
    (!property.history || property.history.length <= 1) &&
    !property.details?.description
  ) {
    score -= 2
    reasons.push('-2 thin content (1 transaction, no description)')
  }

  // Determine directive
  let indexDirective: PageScore['indexDirective']
  if (score >= 3) {
    indexDirective = 'index, follow'
  } else if (score >= 1) {
    indexDirective = 'noindex, follow'
  } else {
    indexDirective = 'noindex, nofollow'
  }

  return { score, indexDirective, reason: reasons }
}
