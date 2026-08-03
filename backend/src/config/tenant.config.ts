/**
 * BACKEND TENANT CONFIG SELECTOR — mirrors the frontend tenant brand fields.
 *
 * Backend needs brand identity (team name, leader, years experience,
 * brokerage, site name) for AI prompt context, plus contact & repliers infra
 * used by listing-alerts plumbing (SendGrid sender, inbound reply domain,
 * default Repliers agent). Per-brand values live in
 * backend/src/config/tenants/<brand>.ts; this file defines the shape and
 * selects the active brand at startup based on APP_TENANT.
 *
 * The backend cannot read NEXT_PUBLIC_* (those are frontend build-time vars),
 * so it uses APP_TENANT with the same accepted values and default as the
 * frontend's NEXT_PUBLIC_TENANT.
 *
 * Accepted APP_TENANT values:
 *   floridahomefinder  (default — used when unset or unrecognized)
 *   countryclub
 *
 * To customize a brand: edit backend/src/config/tenants/<brand>.ts AND the
 * matching frontend src/configs/tenants/<brand>.ts (until a shared workspace
 * exists, the backend mirrors brand fields).
 */

import { tenant as floridahomefinder } from './tenants/floridahomefinder.js'
import { tenant as countryclub } from './tenants/countryclub.js'

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

const TENANTS = {
  floridahomefinder,
  countryclub
} satisfies Record<string, BackendTenantConfig>

const DEFAULT_TENANT: keyof typeof TENANTS = 'floridahomefinder'

const requested = process.env['APP_TENANT']

// Unknown/unset values fall back to the default brand.
export const tenantKey: keyof typeof TENANTS =
  requested && requested in TENANTS
    ? (requested as keyof typeof TENANTS)
    : DEFAULT_TENANT

export const tenant: BackendTenantConfig = TENANTS[tenantKey]
