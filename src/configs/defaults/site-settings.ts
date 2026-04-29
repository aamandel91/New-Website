export interface SiteSettings {
  siteName: string
  brokerage: string
  phone: string
  email: string
  address: string
  heroImageUrl: string
  social: {
    facebook: string
    instagram: string
    linkedin: string
    youtube: string
    zillow: string
  }
  metaTitle: string
  metaDescription: string
  metaKeywords: string
}

export const siteSettings: SiteSettings = {
  siteName: 'Florida Home Finder',
  brokerage: 'eXp Realty',
  phone: '(954) 610-0563',
  email: 'info@floridahomefinder.com',
  address: '10101 W Sample Rd, Coral Springs, FL 33065',
  heroImageUrl: '',
  social: {
    facebook: 'https://www.facebook.com/TheMandelTeam/',
    instagram: 'https://www.instagram.com/themandelteam/',
    linkedin: 'http://www.linkedin.com/in/andy-mandel-0a391a51/',
    youtube: 'https://www.youtube.com/user/themandelteam/',
    zillow: 'https://www.zillow.com/profile/Andy-Mandel/',
  },
  metaTitle: 'South Florida Homes for Sale — Miami-Dade, Broward, Palm Beach & Treasure Coast',
  metaDescription:
    'Search homes for sale across South Florida. Browse listings in Miami-Dade, Broward, Palm Beach, Martin, and St. Lucie Counties with photos, virtual tours, maps, and school info.',
  metaKeywords:
    'south florida real estate, miami real estate, broward county homes, palm beach homes, coral springs real estate, boca raton real estate, miami beach homes, treasure coast real estate, port st lucie homes, stuart florida real estate',
}
