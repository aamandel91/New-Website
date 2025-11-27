import { injectable, inject } from 'tsyringe'
import { OrganizationRepository } from '../repository/organization.js'
import type {
  Organization,
  CreateOrganizationInput,
  UpdateOrganizationInput,
  OrganizationMember,
  Invitation,
  OrganizationUsage,
  AgentSubdomain
} from '../types/organization.js'
import { ApiError } from '../lib/errors.js'

// Plan limits for usage enforcement
const PLAN_LIMITS: Record<string, Record<string, number>> = {
  trial: {
    api_calls: 1000,
    storage_mb: 100,
    users: 2,
    leads: 50,
    pages: 10,
    agents: 1
  },
  starter: {
    api_calls: 10000,
    storage_mb: 1000,
    users: 5,
    leads: 500,
    pages: 50,
    agents: 3
  },
  professional: {
    api_calls: 100000,
    storage_mb: 10000,
    users: 25,
    leads: 5000,
    pages: 500,
    agents: 10
  },
  enterprise: {
    api_calls: Infinity,
    storage_mb: Infinity,
    users: Infinity,
    leads: Infinity,
    pages: Infinity,
    agents: Infinity
  }
}

@injectable()
export class OrganizationService {
  constructor(@inject(OrganizationRepository) private orgRepo: OrganizationRepository) {}

  /**
   * Create a new organization
   */
  async createOrganization(input: CreateOrganizationInput): Promise<Organization> {
    // Check if slug is already taken
    const existing = await this.orgRepo.findBySlug(input.slug)
    if (existing) {
      throw new ApiError('Organization slug already exists', { status: 409 })
    }

    return this.orgRepo.createOrganization(input)
  }

  /**
   * Get organization by ID
   */
  async getOrganization(id: bigint): Promise<Organization | null> {
    return this.orgRepo.findById(id)
  }

  /**
   * Get organization by slug
   */
  async getOrganizationBySlug(slug: string): Promise<Organization | null> {
    return this.orgRepo.findBySlug(slug)
  }

  /**
   * Get organization by primary domain
   */
  async getOrganizationByPrimaryDomain(domain: string): Promise<Organization | null> {
    return this.orgRepo.findByPrimaryDomain(domain)
  }

  /**
   * Get organization by custom domain
   */
  async getOrganizationByCustomDomain(domain: string): Promise<Organization | null> {
    return this.orgRepo.findByCustomDomain(domain)
  }

  /**
   * Resolve organization from hostname (primary domain or custom domain)
   */
  async resolveOrganizationByHostname(hostname: string): Promise<Organization | null> {
    // Try custom domain first
    let org = await this.orgRepo.findByCustomDomain(hostname)
    if (org) return org

    // Try primary domain (extract subdomain if present)
    const parts = hostname.split('.')
    if (parts.length >= 2) {
      // Try full hostname
      org = await this.orgRepo.findByPrimaryDomain(hostname)
      if (org) return org

      // Try base domain (remove first subdomain)
      const baseDomain = parts.slice(1).join('.')
      org = await this.orgRepo.findByPrimaryDomain(baseDomain)
      if (org) return org
    }

    return null
  }

  /**
   * Update organization
   */
  async updateOrganization(id: bigint, input: UpdateOrganizationInput): Promise<Organization> {
    const org = await this.orgRepo.findById(id)
    if (!org) {
      throw new ApiError('Organization not found', { status: 404 })
    }

    // If updating slug, check for conflicts
    if (input.name && input.name !== org.name) {
      const newSlug = this.generateSlug(input.name)
      const existing = await this.orgRepo.findBySlug(newSlug)
      if (existing && existing.id !== id) {
        throw new ApiError('Organization slug already exists', { status: 409 })
      }
    }

    return this.orgRepo.updateOrganization(id, input)
  }

  /**
   * Get organization members
   */
  async getMembers(orgId: bigint): Promise<OrganizationMember[]> {
    return this.orgRepo.getMembers(orgId)
  }

  /**
   * Add member to organization
   */
  async addMember(orgId: bigint, email: string, role: string, invitedBy: string): Promise<OrganizationMember> {
    const org = await this.orgRepo.findById(orgId)
    if (!org) {
      throw new ApiError('Organization not found', { status: 404 })
    }

    // Check plan limits for users
    const currentMembers = await this.orgRepo.getMembers(orgId)
    const limit = PLAN_LIMITS[org.plan]?.users || 2

    if (currentMembers.length >= limit) {
      throw new ApiError(`User limit reached for ${org.plan} plan (${limit} users)`, {
        status: 429,
        limit,
        current: currentMembers.length
      })
    }

    return this.orgRepo.addMember(orgId, email, role, invitedBy)
  }

  /**
   * Update member role
   */
  async updateMemberRole(orgId: bigint, email: string, role: string): Promise<OrganizationMember> {
    return this.orgRepo.updateMemberRole(orgId, email, role)
  }

  /**
   * Remove member from organization
   */
  async removeMember(orgId: bigint, email: string): Promise<boolean> {
    // Prevent removing the last owner
    const members = await this.orgRepo.getMembers(orgId)
    const owners = members.filter((m) => m.role === 'owner')

    if (owners.length === 1 && owners[0].email === email) {
      throw new ApiError('Cannot remove the last owner', { status: 400 })
    }

    return this.orgRepo.removeMember(orgId, email)
  }

  /**
   * Create invitation
   */
  async createInvitation(orgId: bigint, email: string, role: string, invitedBy: string): Promise<Invitation> {
    return this.orgRepo.createInvitation(orgId, email, role, invitedBy)
  }

  /**
   * Get invitation by token
   */
  async getInvitationByToken(token: string): Promise<Invitation | null> {
    return this.orgRepo.findInvitationByToken(token)
  }

  /**
   * Accept invitation
   */
  async acceptInvitation(token: string, userEmail: string): Promise<{ organization: Organization; member: OrganizationMember }> {
    const invitation = await this.orgRepo.findInvitationByToken(token)

    if (!invitation) {
      throw new ApiError('Invalid or expired invitation', { status: 404 })
    }

    if (invitation.email !== userEmail) {
      throw new ApiError('Invitation email does not match', { status: 403 })
    }

    // Accept invitation
    await this.orgRepo.acceptInvitation(token)

    // Add member
    const member = await this.orgRepo.addMember(invitation.org_id, invitation.email, invitation.role, invitation.invited_by!)

    // Mark as joined
    await this.orgRepo.updateMemberRole(invitation.org_id, invitation.email, invitation.role)

    const organization = await this.orgRepo.findById(invitation.org_id)

    return {
      organization: organization!,
      member
    }
  }

  /**
   * Track usage metric
   */
  async trackUsage(orgId: bigint, metric: string, value: number = 1): Promise<void> {
    await this.orgRepo.trackUsage(orgId, metric, value)
  }

  /**
   * Get usage for organization
   */
  async getUsage(orgId: bigint, metric?: string, startDate?: Date, endDate?: Date): Promise<OrganizationUsage[]> {
    return this.orgRepo.getUsage(orgId, metric, startDate, endDate)
  }

  /**
   * Check if organization has reached usage limit for a metric
   */
  async checkUsageLimit(orgId: bigint, metric: string): Promise<{ allowed: boolean; current: number; limit: number }> {
    const org = await this.orgRepo.findById(orgId)
    if (!org) {
      throw new ApiError('Organization not found', { status: 404 })
    }

    const limit = PLAN_LIMITS[org.plan]?.[metric] || 0
    const current = await this.orgRepo.getCurrentUsage(orgId, metric)

    return {
      allowed: current < limit,
      current,
      limit
    }
  }

  /**
   * Get agents with subdomains
   */
  async getAgentSubdomains(orgId: bigint): Promise<AgentSubdomain[]> {
    return this.orgRepo.getAgentSubdomains(orgId)
  }

  /**
   * Find agent by subdomain
   */
  async findAgentBySubdomain(orgId: bigint, subdomain: string): Promise<AgentSubdomain | null> {
    return this.orgRepo.findAgentBySubdomain(orgId, subdomain)
  }

  /**
   * List all organizations (admin only)
   */
  async listOrganizations(limit: number = 50, offset: number = 0) {
    return this.orgRepo.listOrganizations(limit, offset)
  }

  /**
   * Generate URL-safe slug from name
   */
  private generateSlug(name: string): string {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
  }

  /**
   * Get plan limits for an organization
   */
  async getPlanLimits(orgId: bigint): Promise<Record<string, number>> {
    const org = await this.orgRepo.findById(orgId)
    if (!org) {
      throw new ApiError('Organization not found', { status: 404 })
    }

    return PLAN_LIMITS[org.plan] || PLAN_LIMITS.trial
  }
}
