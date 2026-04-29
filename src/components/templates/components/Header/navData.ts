import { subTypes, primaryCity } from '@configs/page-generation'

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
  // Miami-Dade
  'Miami Beach',
  'Coral Gables',
  'Aventura',
  'Sunny Isles Beach',
  'Doral',
  'Hialeah',
  'Homestead',
  'Kendall',
  'Pinecrest',
  // Martin/St. Lucie
  'Stuart',
  'Palm City',
  'Port St. Lucie',
  'Fort Pierce',
  'Jensen Beach',
  'Hobe Sound',
  'Tradition',
] as const

const counties = [
  { name: 'Broward County', slug: 'broward-county' },
  { name: 'Palm Beach County', slug: 'palm-beach-county' },
  { name: 'Miami-Dade County', slug: 'miami-dade-county' },
  { name: 'Martin County', slug: 'martin-county' },
  { name: 'St. Lucie County', slug: 'st-lucie-county' },
] as const

function cityToSlug(city: string) {
  return city.toLowerCase().replace(/\s+/g, '-')
}

const primaryCitySlug = primaryCity.toLowerCase().replace(/\s+/g, '-')

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
  href: `/${primaryCitySlug}/${st.slug}`,
}))
