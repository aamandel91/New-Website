/**
 * FLORIDA HOME FINDER backend tenant — the default brand.
 *
 * Mirrors the brand fields of the frontend
 * src/configs/tenants/floridahomefinder.ts. Shape is defined by
 * BackendTenantConfig in ../tenant.config.ts. Edit this file to customize
 * Florida Home Finder backend values.
 */

import type { BackendTenantConfig } from '../tenant.config.js'

export const tenant: BackendTenantConfig = {
  brand: {
    siteName: 'Florida Home Finder',
    teamName: 'The Mandel Team',
    leaderName: 'Andy Mandel',
    leaderYearsExperience: 14,
    brokerage: 'eXp Realty',
    brokerageLuxury: 'eXp Luxury',
    domain: 'floridahomefinder.com',
    domainDisplay: 'FloridaHomeFinder.com',
    siteUrl: 'https://floridahomefinder.com'
  },
  contact: {
    notificationsEmail: 'notifications@mandelteam.com',
    inboundReplyDomain: 'reply.floridahomefinder.com',
    fallbackAgentEmail: 'andy@mandelteam.com'
  },
  repliers: {
    agentId: parseInt(process.env['REPLIERS_AGENT_ID'] || '0'),
    baseUrl: process.env['REPLIERS_BASE_URL'] || 'https://api.repliers.io',
    csrUrl: process.env['REPLIERS_CSR_URL'] || 'https://csr-api.repliers.io'
  }
}
