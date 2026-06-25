/**
 * SFL COUNTRY CLUB HOMES backend tenant.
 *
 * Currently identical to Florida Home Finder EXCEPT brand.siteName,
 * brand.domain, brand.domainDisplay, and brand.siteUrl. Mirrors the brand
 * fields of the frontend src/configs/tenants/countryclub.ts. Shape is defined
 * by BackendTenantConfig in ../tenant.config.ts. Edit this file to customize
 * the country club backend values. Selected via APP_TENANT=countryclub.
 */

import type { BackendTenantConfig } from '../tenant.config.js'

export const tenant: BackendTenantConfig = {
  brand: {
    siteName: 'SFL Country Club Homes',
    teamName: 'The Mandel Team',
    leaderName: 'Andy Mandel',
    leaderYearsExperience: 14,
    brokerage: 'eXp Realty',
    brokerageLuxury: 'eXp Luxury',
    domain: 'sflcountryclubhomes.com',
    domainDisplay: 'SFLCountryClubHomes.com',
    siteUrl: 'https://sflcountryclubhomes.com'
  },
  contact: {
    notificationsEmail: 'andy@mandelteam.com',
    // No SendGrid Inbound Parse subdomain exists for the country club brand,
    // so we use the bare real domain (routes to a real mailbox) rather than an
    // unconfigured reply.* host. Reply-To is built as reply[+token]@<this>.
    inboundReplyDomain: 'mandelteam.com',
    fallbackAgentEmail: 'andy@mandelteam.com'
  },
  repliers: {
    agentId: parseInt(process.env['REPLIERS_AGENT_ID'] || '0'),
    baseUrl: process.env['REPLIERS_BASE_URL'] || 'https://api.repliers.io',
    csrUrl: process.env['REPLIERS_CSR_URL'] || 'https://csr-api.repliers.io'
  }
}
