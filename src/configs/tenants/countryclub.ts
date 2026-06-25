/**
 * SFL COUNTRY CLUB HOMES tenant.
 *
 * Currently identical to Florida Home Finder EXCEPT brand.siteName,
 * brand.domain, brand.domainDisplay, and brand.siteUrl. Edit this file to
 * customize the country club brand (contact, integrations, visual identity,
 * etc.) — it is a plain, standalone config so changes here never touch the
 * Florida Home Finder brand.
 *
 * Shape is defined by TenantConfig in ../tenant.config.ts; both tenants must
 * satisfy it. Selected at startup via NEXT_PUBLIC_TENANT=countryclub.
 */

import type { TenantConfig } from '../tenant.config'

const PHONE_DISPLAY = '(954) 610-0563'
const PHONE_DIGITS = PHONE_DISPLAY.replace(/\D/g, '')

const ADDRESS = {
  street: '10101 W Sample Rd',
  city: 'Coral Springs',
  state: 'FL',
  zip: '33065'
}

export const tenant: TenantConfig = {
  brand: {
    siteName: 'SFL Country Club Homes',
    teamName: 'The Mandel Team',
    leaderName: 'Andy Mandel',
    leaderYearsExperience: 14,
    slogan: 'The agent you work with matters.',
    brokerage: 'eXp Realty',
    brokerageLuxury: 'eXp Luxury',
    domain: 'sflcountryclubhomes.com',
    domainDisplay: 'SFLCountryClubHomes.com',
    siteUrl: 'https://sflcountryclubhomes.com'
  },
  contact: {
    phone: PHONE_DISPLAY,
    phoneE164: `+1${PHONE_DIGITS}`,
    phoneDigits: PHONE_DIGITS,
    email: 'andy@mandelteam.com',
    legalEmail: 'andy@mandelteam.com',
    notificationsEmail: 'andy@mandelteam.com',
    // No SendGrid Inbound Parse subdomain exists for the country club brand,
    // so we use the bare real domain (routes to a real mailbox) rather than an
    // unconfigured reply.* host. Reply-To is built as reply[+token]@<this>.
    inboundReplyDomain: 'mandelteam.com',
    fallbackAgentEmail: 'andy@mandelteam.com',
    address: {
      ...ADDRESS,
      full: `${ADDRESS.street}, ${ADDRESS.city}, ${ADDRESS.state} ${ADDRESS.zip}`
    }
  },
  repliers: {
    agentId: parseInt(
      process.env['REPLIERS_AGENT_ID'] ||
        process.env['NEXT_PUBLIC_REPLIERS_AGENT_ID'] ||
        '0'
    ),
    baseUrl: process.env['REPLIERS_BASE_URL'] || 'https://api.repliers.io',
    csrUrl: process.env['REPLIERS_CSR_URL'] || 'https://csr-api.repliers.io'
  },
  integrations: {
    lender: {
      name: 'Cross Country Mortgage',
      applyUrl: 'https://app.crosscountrymortgage.com/#/choose-loan-type'
    },
    instantOffer: {
      provider: 'HiFello',
      url: 'https://mandelteam.hifello.com/lp/64233cdf7d0caf0019a96a13'
    },
    crm: {
      provider: 'suresend',
      pixelId: 'SS-UGWGMAAAPH'
    }
  },
  visualIdentity: {
    colors: {
      // Gold/tan brand accent — used for primary MUI palette
      primary: '#b19a55',
      primaryDark: '#8d7b44',
      primaryLight: '#d8c890',
      accent: '#b19a55',
      accentDark: '#8d7b44',
      accentLight: '#d8c890',
      text: '#1a1a1a',
      textMuted: '#666666',
      background: '#FFFFFF',
      surface: '#FFFFFF',
      border: '#d9d9d9',
      success: '#4CAF50',
      warning: '#FFC107',
      error: '#F44336',
      info: '#2196F3',
      // Header/footer chrome
      headerBackground: '#0F1621',
      footerBackground: '#0F1621',
      // Marketing/OG image specific
      ogBackground: '#1a1a2e', // deep navy used as OG image background
      ogMuted: '#9b9b9b'
    },
    logo: {
      src: '/logo.svg',
      footerSrc: '/logo-footer.svg',
      alt: 'SFL Country Club Homes',
      width: 36,
      height: 36,
      footerWidth: 80,
      footerHeight: 100
    },
    fonts: {
      heading:
        'var(--font-montserrat), Montserrat, Arial, Helvetica, sans-serif',
      body: 'var(--font-montserrat), Montserrat, Arial, Helvetica, sans-serif'
    },
    heroImages: {
      homepage: '/splashscreen.webp',
      // Default gradient if no homepage hero image is set in admin
      homepageGradient: 'linear-gradient(135deg, #0F1621 0%, #1a3a4a 100%)'
    },
    ogImage: {
      fontFamily: 'sans-serif'
    }
  }
}
