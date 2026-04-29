/**
 * TENANT CONFIG — change once, update everywhere.
 *
 * This file is the single source of truth for every brand, team, and
 * contact value used across the site. Footer, header, About page,
 * structured data, AI prompt context, OG images, email templates,
 * and integrations all read from here.
 *
 * To rebrand the site:
 * 1. Edit values below
 * 2. If a backend value changed, also update backend/src/config/tenant.config.ts
 *    (until a shared workspace is set up, the backend mirrors brand fields)
 * 3. Restart the dev server
 *
 * Values NOT in this config (intentional):
 * - Market geography (counties, cities) — see src/configs/defaults/page-generation.ts
 * - SEO meta titles/descriptions — see src/configs/defaults/site-settings.ts and
 *   the various `_seo-template.tsx` files (these are market-tuned, not tenant-tuned)
 * - Brand colors and logo — currently inlined in OG image generators and pages
 *   (visual identity refactor is a future pass)
 */

export interface TenantConfig {
  // Brand identity
  brand: {
    siteName: string             // "Florida Home Finder"
    teamName: string             // "The Mandel Team"
    leaderName: string           // "Andy Mandel"
    leaderYearsExperience: number
    slogan: string               // "The agent you work with matters."
    brokerage: string            // display brokerage (footer, about, contact), e.g. "eXp Realty"
    brokerageLuxury: string      // luxury sub-brand used in AI prompt context, e.g. "eXp Luxury"
    domain: string               // "floridahomefinder.com"
    domainDisplay: string        // "FloridaHomeFinder.com" — branded casing for headings/footers
    siteUrl: string              // "https://floridahomefinder.com"
  }
  // Contact
  contact: {
    phone: string                // display format "(954) 610-0563"
    phoneE164: string            // "+19546100563" — for tel: links and structured data
    phoneDigits: string          // "9546100563" — for raw uses
    email: string                // "info@floridahomefinder.com"
    address: {
      street: string
      city: string
      state: string
      zip: string
      full: string               // computed: full single-line address
    }
  }
  // Integrations
  integrations: {
    lender: {
      name: string               // "Cross Country Mortgage"
      applyUrl: string           // pre-approval landing URL
    }
    instantOffer: {
      provider: string           // "HiFello"
      url: string                // landing URL
    }
    crm: {
      provider: 'suresend' | 'fub' | string
      pixelId: string
    }
  }
}

const PHONE_DISPLAY = '(954) 610-0563'
const PHONE_DIGITS = PHONE_DISPLAY.replace(/\D/g, '')

const ADDRESS = {
  street: '10101 W Sample Rd',
  city: 'Coral Springs',
  state: 'FL',
  zip: '33065',
}

export const tenant: TenantConfig = {
  brand: {
    siteName: 'Florida Home Finder',
    teamName: 'The Mandel Team',
    leaderName: 'Andy Mandel',
    leaderYearsExperience: 14,
    slogan: 'The agent you work with matters.',
    brokerage: 'eXp Realty',
    brokerageLuxury: 'eXp Luxury',
    domain: 'floridahomefinder.com',
    domainDisplay: 'FloridaHomeFinder.com',
    siteUrl: 'https://floridahomefinder.com',
  },
  contact: {
    phone: PHONE_DISPLAY,
    phoneE164: `+1${PHONE_DIGITS}`,
    phoneDigits: PHONE_DIGITS,
    email: 'info@floridahomefinder.com',
    address: {
      ...ADDRESS,
      full: `${ADDRESS.street}, ${ADDRESS.city}, ${ADDRESS.state} ${ADDRESS.zip}`,
    },
  },
  integrations: {
    lender: {
      name: 'Cross Country Mortgage',
      applyUrl: 'https://app.crosscountrymortgage.com/#/choose-loan-type',
    },
    instantOffer: {
      provider: 'HiFello',
      url: 'https://mandelteam.hifello.com/lp/64233cdf7d0caf0019a96a13',
    },
    crm: {
      provider: 'suresend',
      pixelId: 'SS-UGWGMAAAPH',
    },
  },
}
