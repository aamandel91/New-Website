/**
 * BACKEND TENANT CONFIG — mirrors src/configs/tenant.config.ts brand fields.
 *
 * Backend needs brand identity (team name, leader, years experience,
 * brokerage, site name) for AI prompt context, plus contact & repliers infra
 * used by listing-alerts plumbing (SendGrid sender, inbound reply domain,
 * default Repliers agent). Keep this in sync with the frontend tenant.config.ts
 * until a shared workspace exists.
 *
 * To rebrand: edit values in src/configs/tenant.config.ts AND here.
 */

export interface BackendTenantBrand {
  siteName: string
  teamName: string
  leaderName: string
  leaderYearsExperience: number
  brokerage: string
  brokerageLuxury: string
  domain: string
  domainDisplay: string
  siteUrl: string
}

export interface BackendTenantContact {
  notificationsEmail: string
  inboundReplyDomain: string
  fallbackAgentEmail: string
}

export interface BackendTenantRepliers {
  /**
   * Default Repliers Agent ID used when provisioning new clients on signup.
   *
   * If you don't yet have a Repliers Agent ID, create one via POST /agents
   * (e.g. with the Repliers MCP tool), then set REPLIERS_AGENT_ID. The agent
   * record represents the team; clients are assigned to it. With agentId=0
   * RepliersClientsService.provisionForUser logs a warning and skips
   * provisioning so signup still succeeds; backfill later.
   */
  agentId: number
  baseUrl: string
  csrUrl: string
}

export interface BackendTenantConfig {
  brand: BackendTenantBrand
  contact: BackendTenantContact
  repliers: BackendTenantRepliers
}

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
    siteUrl: 'https://floridahomefinder.com',
  },
  contact: {
    notificationsEmail: 'notifications@mandelteam.com',
    inboundReplyDomain: 'reply.floridahomefinder.com',
    fallbackAgentEmail: 'andy@mandelteam.com',
  },
  repliers: {
    agentId: parseInt(process.env['REPLIERS_AGENT_ID'] || '0'),
    baseUrl: process.env['REPLIERS_BASE_URL'] || 'https://api.repliers.io',
    csrUrl: process.env['REPLIERS_CSR_URL'] || 'https://csr-api.repliers.io',
  },
}
