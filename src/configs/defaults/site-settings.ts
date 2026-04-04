export interface SiteSettings {
  siteName: string
  brokerage: string
  phone: string
  email: string
  address: string
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
  phone: '(954) 251-0694',
  email: 'info@floridahomefinder.com',
  address: '10101 W Sample Rd, Coral Springs, FL 33065',
  social: {
    facebook: 'https://www.facebook.com/TheMandelTeam/',
    instagram: 'https://www.instagram.com/themandelteam/',
    linkedin: 'http://www.linkedin.com/in/andy-mandel-0a391a51/',
    youtube: 'https://www.youtube.com/user/themandelteam/',
    zillow: 'https://www.zillow.com/profile/Andy-Mandel/',
  },
  metaTitle: 'South Florida Homes for Sale — Broward & Palm Beach County',
  metaDescription:
    'Search homes for sale in South Florida. Browse Broward & Palm Beach County listings with photos, virtual tours, maps, school info and more.',
  metaKeywords:
    'south florida real estate, boca raton real estate, coral springs real estate, parkland real estate, delray beach real estate, pompano beach real estate',
}
