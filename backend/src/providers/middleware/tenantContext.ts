import type { Context, Middleware, Next } from 'koa'
import { instanceCachingFactory } from 'tsyringe'
import { OrganizationService } from '../../services/organization.js'

/**
 * Tenant Context Middleware
 *
 * This middleware detects the organization (tenant) from the request and sets it in ctx.state
 * Detection priority:
 * 1. X-Organization-ID header (for API clients)
 * 2. Custom domain
 * 3. Primary domain/subdomain from hostname
 * 4. Query parameter org_id (for development/testing)
 */

export default {
  token: 'middleware.tenantContext',
  useFactory: instanceCachingFactory<Middleware>(() => {
    return async (ctx: Context, next: Next) => {
      let orgId: bigint | null = null
      let org: any = null

      const orgService = ctx.state['container'].resolve(OrganizationService)
      const hostname = ctx.request.hostname
      const orgHeader = ctx.request.headers['x-organization-id']
      const orgParam = ctx.query['org_id']

      try {
        // Priority 1: Header (for API clients)
        if (orgHeader && typeof orgHeader === 'string') {
          orgId = BigInt(orgHeader)
          org = await orgService.getOrganization(orgId)
        }

        // Priority 2: Query parameter (for development/testing)
        else if (orgParam && typeof orgParam === 'string') {
          orgId = BigInt(orgParam)
          org = await orgService.getOrganization(orgId)
        }

        // Priority 3: Hostname resolution (production)
        else {
          org = await orgService.resolveOrganizationByHostname(hostname)
          orgId = org?.id || null
        }

        // Priority 4: orgId from JWT token
        if (!org && ctx.state['user']?.orgId) {
          orgId = BigInt(ctx.state['user'].orgId)
          org = await orgService.getOrganization(orgId)
        }

        // If still no org found, try to get default organization
        if (!org) {
          org = await orgService.getOrganizationBySlug('default')
          orgId = org?.id || null
        }

        // Set in context
        ctx.state['orgId'] = orgId
        ctx.state['org'] = org

        // Also check if request is from an agent subdomain
        if (org && hostname) {
          const parts = hostname.split('.')
          if (parts.length >= 2) {
            const possibleSubdomain = parts[0]
            if (possibleSubdomain) {
              // Check if this is an agent subdomain
              const agent = await orgService.findAgentBySubdomain(org.id, possibleSubdomain)
              if (agent) {
                ctx.state['agentSubdomain'] = possibleSubdomain
                ctx.state['agent'] = agent
              }
            }
          }
        }
      } catch (error) {
        console.error('Error in tenant context middleware:', error)
        // Don't fail the request, just log the error
      }

      await next()
    }
  })
}
