/**
 * TENANT CONFIG — change once, update everywhere.
 *
 * This file is the single source of truth for every brand, team, contact, and
 * visual-identity value used across the site. Footer, header, About page,
 * structured data, AI prompt context, OG images, email templates, MUI theme,
 * logo references, hero imagery, and integrations all read from here.
 *
 * Email addresses are intentionally split:
 *   contact.email       — marketing / general / public-facing inbox
 *   contact.legalEmail  — DMCA notices, account termination requests,
 *                         copyright claims, and other legal correspondence
 *
 * To rebrand the site:
 * 1. Edit values below (including `visualIdentity` for colors, logo, fonts)
 * 2. Replace logo asset(s) referenced by `visualIdentity.logo.src` in /public
 * 3. Replace hero image asset(s) referenced by `visualIdentity.heroImages` in /public
 * 4. If a backend value changed, also update backend/src/config/tenant.config.ts
 *    (until a shared workspace is set up, the backend mirrors brand fields)
 * 5. Restart the dev server
 *
 * Values NOT in this config (intentional):
 * - Market geography (counties, cities) — see src/configs/defaults/page-generation.ts
 * - SEO meta titles/descriptions — see src/configs/defaults/site-settings.ts and
 *   the live page generators (e.g. src/app/[...slugs]/page.tsx). Per-page-type
 *   SEO coverage is documented in docs/seo/seo-coverage.md.
 *
 * Visual identity: most touchpoints (MUI palette, OG generators, logo, hero
 * image, footer/header brand colors) read from `visualIdentity` below.
 * Residual hardcoded references that still require manual editing are
 * catalogued in docs/template/visual-identity-residuals.md.
 */

export interface TenantVisualIdentity {
  // Color tokens
  colors: {
    primary: string         // main brand color (CTAs, links, header accents)
    primaryDark: string     // hover/pressed state
    primaryLight: string    // tints, secondary surfaces
    accent: string          // highlight color (OG image accent, dividers)
    accentDark: string
    accentLight: string
    text: string            // primary text color
    textMuted: string
    background: string
    surface: string
    border: string
    success: string
    warning: string
    error: string
    info: string
    // Header/footer chrome (dark navy band on every page)
    headerBackground: string
    footerBackground: string
    // Marketing/OG image specific
    ogBackground: string    // dark navy used in OG image background
    ogMuted: string         // muted text on OG images
  }
  // Logo assets
  logo: {
    src: string             // path to header logo (SVG/PNG in /public)
    footerSrc: string       // path to footer logo (often a different aspect)
    alt: string             // alt text (typically the brand name)
    width: number           // intrinsic width of header logo
    height: number          // intrinsic height of header logo
    footerWidth: number
    footerHeight: number
  }
  // Fonts
  fonts: {
    heading: string         // CSS font-family stack for headings
    body: string            // CSS font-family stack for body
    googleFontsUrl?: string // optional Google Fonts CDN URL (if not using next/font)
  }
  // Hero / marketing imagery
  heroImages: {
    homepage: string        // homepage hero image URL or path (empty = use gradient fallback)
    homepageGradient: string // CSS gradient used when homepage hero image is unset
    citySearch?: string     // city landing page hero
    propertyDetail?: string // PDP fallback hero
  }
  // OG image text styling
  ogImage: {
    fontFamily: string      // sans-serif/serif fallback for OG ImageResponse
  }
}

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
    email: string                // "info@floridahomefinder.com" — marketing/general inbox
    legalEmail: string           // "andy@mandelteam.com" — DMCA / account / legal correspondence
    notificationsEmail: string   // "notifications@mandelteam.com" — listing-alerts team sender
    inboundReplyDomain: string   // "reply.floridahomefinder.com" — SendGrid Inbound Parse host
    fallbackAgentEmail: string   // catches replies that can't be routed
    address: {
      street: string
      city: string
      state: string
      zip: string
      full: string               // computed: full single-line address
    }
  }
  // Repliers infra (used by listing-alerts client provisioning)
  repliers: {
    agentId: number              // default Repliers Agent ID; 0 = unset (graceful degrade)
    baseUrl: string
    csrUrl: string
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
  // Visual identity (colors, logo, fonts, hero imagery)
  visualIdentity: TenantVisualIdentity
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
    legalEmail: 'andy@mandelteam.com',
    notificationsEmail: 'notifications@mandelteam.com',
    inboundReplyDomain: 'reply.floridahomefinder.com',
    fallbackAgentEmail: 'andy@mandelteam.com',
    address: {
      ...ADDRESS,
      full: `${ADDRESS.street}, ${ADDRESS.city}, ${ADDRESS.state} ${ADDRESS.zip}`,
    },
  },
  repliers: {
    agentId: parseInt(process.env['REPLIERS_AGENT_ID'] || process.env['NEXT_PUBLIC_REPLIERS_AGENT_ID'] || '0'),
    baseUrl: process.env['REPLIERS_BASE_URL'] || 'https://api.repliers.io',
    csrUrl: process.env['REPLIERS_CSR_URL'] || 'https://csr-api.repliers.io',
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
      ogBackground: '#1a1a2e',  // deep navy used as OG image background
      ogMuted: '#9b9b9b',
    },
    logo: {
      src: '/logo.svg',
      footerSrc: '/logo-footer.svg',
      alt: 'Florida Home Finder',
      width: 36,
      height: 36,
      footerWidth: 80,
      footerHeight: 100,
    },
    fonts: {
      heading: 'var(--font-montserrat), Montserrat, Arial, Helvetica, sans-serif',
      body: 'var(--font-montserrat), Montserrat, Arial, Helvetica, sans-serif',
    },
    heroImages: {
      homepage: '/splashscreen.webp',
      // Default gradient if no homepage hero image is set in admin
      homepageGradient: 'linear-gradient(135deg, #0F1621 0%, #1a3a4a 100%)',
    },
    ogImage: {
      fontFamily: 'sans-serif',
    },
  },
}
