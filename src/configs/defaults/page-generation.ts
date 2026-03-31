export const targetCounties = ['Broward', 'Palm Beach']

export interface SubType {
  slug: string
  label: string
  filterType: string
  propertyType?: string
  minPrice?: number
  keywords?: string
  stories?: number
  lastStatus?: string
  minLotSize?: number
}

export const subTypes: SubType[] = [
  { slug: 'single-family-homes', label: 'Single Family Homes', filterType: 'residential', propertyType: 'Detached' },
  { slug: 'condos', label: 'Condos', filterType: 'condo', propertyType: 'Apartment' },
  { slug: 'townhomes', label: 'Townhomes', filterType: 'residential', propertyType: 'Att/Row/Twnhouse' },
  { slug: 'multi-family', label: 'Multi-Family Homes', filterType: 'residential', propertyType: 'Multi-Family' },
  { slug: 'luxury', label: 'Luxury Homes', filterType: 'residential', minPrice: 1000000 },
  { slug: 'waterfront', label: 'Waterfront Homes', filterType: 'residential', keywords: 'waterfront' },
  { slug: 'pool-homes', label: 'Pool Homes', filterType: 'residential', keywords: 'pool' },
  { slug: 'new-construction', label: 'New Construction', filterType: 'residential', keywords: 'new construction' },
  { slug: '55-plus', label: '55+ Communities', filterType: 'residential', keywords: '55+' },
  { slug: 'gated-communities', label: 'Gated Communities', filterType: 'residential', keywords: 'gated' },
  { slug: 'no-hoa', label: 'No HOA Homes', filterType: 'residential', keywords: 'no hoa' },
  { slug: 'ocean-access', label: 'Ocean Access Homes', filterType: 'residential', keywords: 'ocean access' },
  { slug: 'country-club', label: 'Country Club Homes', filterType: 'residential', keywords: 'country club' },
  { slug: 'one-story', label: '1 Story Homes', filterType: 'residential', stories: 1 },
  { slug: 'two-story', label: '2 Story Homes', filterType: 'residential', stories: 2 },
  { slug: 'foreclosures', label: 'Foreclosures', filterType: 'residential', lastStatus: 'Lc' },
  { slug: 'one-acre-plus', label: '1+ Acre Properties', filterType: 'residential', minLotSize: 43560 },
  { slug: 'fha-approved', label: 'FHA Approved', filterType: 'condo', keywords: 'fha' },
  { slug: 'va-approved', label: 'VA Approved', filterType: 'residential', keywords: 'va approved' },
  { slug: 'pet-friendly-condos', label: 'Pet Friendly Condos', filterType: 'condo', keywords: 'pet' },
  { slug: 'rentals', label: 'Rentals', filterType: 'rental' },
  { slug: 'land', label: 'Lots & Land', filterType: 'land' },
]

export interface TemplateVariables {
  city: string
  county: string
  state: string
  stateCode: string
  subType: string
  subTypeSlug: string
  count: number
  year: number
}
