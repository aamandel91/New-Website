/**
 * BACKEND TENANT CONFIG — mirrors src/configs/tenant.config.ts brand fields.
 *
 * The backend currently only needs brand identity (team name, leader, years
 * experience, brokerage, site name) for AI prompt context. Keep this in sync
 * with the frontend tenant.config.ts until a shared workspace exists.
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

export interface BackendTenantConfig {
  brand: BackendTenantBrand
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
}
