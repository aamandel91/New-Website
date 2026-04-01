import { subTypes } from '@configs/page-generation'

/** South Florida cities served */
const cities = [
  'Coral Springs',
  'Boca Raton',
  'Fort Lauderdale',
  'Miami',
  'Pompano Beach',
  'Deerfield Beach',
  'Delray Beach',
  'Boynton Beach',
  'West Palm Beach',
  'Hollywood',
  'Plantation',
  'Davie',
  'Weston',
  'Coconut Creek',
  'Parkland',
  'Sunrise',
  'Tamarac',
  'Lighthouse Point',
  'Highland Beach',
  'Cooper City',
  'Palm Beach Gardens',
] as const

const counties = [
  { name: 'Broward County', slug: 'broward-county' },
  { name: 'Palm Beach County', slug: 'palm-beach-county' },
] as const

function cityToSlug(city: string) {
  return city.toLowerCase().replace(/\s+/g, '-')
}

export const cityItems = cities.map((city) => ({
  label: city,
  href: `/${cityToSlug(city)}`,
}))

export const countyItems = counties.map((c) => ({
  label: c.name,
  href: `/search?county=${encodeURIComponent(c.name)}`,
}))

export const propertyTypeItems = subTypes.map((st) => ({
  label: st.label,
  href: `/coral-springs/${st.slug}`,
}))
