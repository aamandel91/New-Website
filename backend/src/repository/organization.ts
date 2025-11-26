import { injectable, inject } from 'tsyringe'
import type { Knex } from 'knex'
import type {
  Organization,
  CreateOrganizationInput,
  UpdateOrganizationInput,
  OrganizationMember,
  Invitation,
  OrganizationUsage,
  AgentSubdomain
} from '../types/organization.js'
import crypto from 'crypto'

@injectable()
export class OrganizationRepository {
  constructor(@inject('db') private db: Knex) {}

  /**
   * Create a new organization
   */
  async createOrganization(input: CreateOrganizationInput): Promise<Organization> {
    const now = new Date()
    const trialEndsAt = new Date()
    trialEndsAt.setDate(trialEndsAt.getDate() + 14) // 14-day trial

    const [org] = await this.db.transaction(async (trx) => {
      // Create organization
      const [organization] = await trx('organizations')
        .insert({
          name: input.name,
          slug: input.slug,
          plan: input.plan || 'trial',
          status: 'active',
          primary_domain: input.primary_domain,
          contact_email: input.contact_email || null,
          contact_phone: input.contact_phone || null,
          trial_ends_at: trialEndsAt,
          created_at: now,
          updated_at: now
        })
        .returning('*')

      // Add owner as member
      await trx('organization_members').insert({
        org_id: organization.id,
        email: input.owner_email,
        role: 'owner',
        joined_at: now,
        created_at: now
      })

      // Add owner to ACL with admin role (role = 3)
      await trx('acl').insert({
        email: input.owner_email,
        role: 3, // Admin
        org_id: organization.id,
        created_at: now
      })

      return [organization]
    })

    return org
  }

  /**
   * Find organization by ID
   */
  async findById(id: bigint): Promise<Organization | null> {
    const org = await this.db('organizations').where({ id }).first()
    return org || null
  }

  /**
   * Find organization by slug
   */
  async findBySlug(slug: string): Promise<Organization | null> {
    const org = await this.db('organizations').where({ slug }).first()
    return org || null
  }

  /**
   * Find organization by subdomain (primary_domain)
   */
  async findByPrimaryDomain(domain: string): Promise<Organization | null> {
    const org = await this.db('organizations').where({ primary_domain: domain }).first()
    return org || null
  }

  /**
   * Find organization by custom domain
   */
  async findByCustomDomain(domain: string): Promise<Organization | null> {
    const org = await this.db('organizations').where({ custom_domain: domain }).first()
    return org || null
  }

  /**
   * Update organization
   */
  async updateOrganization(id: bigint, input: UpdateOrganizationInput): Promise<Organization> {
    const updateData: any = {
      updated_at: new Date()
    }

    if (input.name) updateData.name = input.name
    if (input.plan) updateData.plan = input.plan
    if (input.status) updateData.status = input.status
    if (input.settings) updateData.settings = JSON.stringify(input.settings)
    if (input.primary_domain) updateData.primary_domain = input.primary_domain
    if (input.custom_domain !== undefined) updateData.custom_domain = input.custom_domain
    if (input.logo_cloudinary_id !== undefined) updateData.logo_cloudinary_id = input.logo_cloudinary_id
    if (input.primary_color) updateData.primary_color = input.primary_color
    if (input.secondary_color) updateData.secondary_color = input.secondary_color
    if (input.contact_email !== undefined) updateData.contact_email = input.contact_email
    if (input.contact_phone !== undefined) updateData.contact_phone = input.contact_phone

    const [org] = await this.db('organizations')
      .where({ id })
      .update(updateData)
      .returning('*')

    return org
  }

  /**
   * Get organization members
   */
  async getMembers(orgId: bigint): Promise<OrganizationMember[]> {
    return this.db('organization_members')
      .where({ org_id: orgId })
      .orderBy('created_at', 'desc')
  }

  /**
   * Add member to organization
   */
  async addMember(orgId: bigint, email: string, role: string, invitedBy: string): Promise<OrganizationMember> {
    const now = new Date()

    const [member] = await this.db('organization_members')
      .insert({
        org_id: orgId,
        email,
        role,
        invited_by: invitedBy,
        invited_at: now,
        created_at: now
      })
      .returning('*')

    return member
  }

  /**
   * Update member role
   */
  async updateMemberRole(orgId: bigint, email: string, role: string): Promise<OrganizationMember> {
    const [member] = await this.db('organization_members')
      .where({ org_id: orgId, email })
      .update({ role })
      .returning('*')

    return member
  }

  /**
   * Remove member from organization
   */
  async removeMember(orgId: bigint, email: string): Promise<boolean> {
    const deleted = await this.db('organization_members')
      .where({ org_id: orgId, email })
      .delete()

    return deleted > 0
  }

  /**
   * Create invitation
   */
  async createInvitation(orgId: bigint, email: string, role: string, invitedBy: string): Promise<Invitation> {
    const now = new Date()
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + 7) // 7-day expiration

    const token = crypto.randomBytes(32).toString('hex')

    const [invitation] = await this.db('invitations')
      .insert({
        org_id: orgId,
        email,
        role,
        token,
        invited_by: invitedBy,
        expires_at: expiresAt,
        created_at: now
      })
      .returning('*')

    return invitation
  }

  /**
   * Find invitation by token
   */
  async findInvitationByToken(token: string): Promise<Invitation | null> {
    const invitation = await this.db('invitations')
      .where({ token })
      .whereNull('accepted_at')
      .where('expires_at', '>', new Date())
      .first()

    return invitation || null
  }

  /**
   * Accept invitation
   */
  async acceptInvitation(token: string): Promise<Invitation> {
    const [invitation] = await this.db('invitations')
      .where({ token })
      .update({ accepted_at: new Date() })
      .returning('*')

    return invitation
  }

  /**
   * Track usage metric
   */
  async trackUsage(orgId: bigint, metric: string, value: number): Promise<OrganizationUsage> {
    const now = new Date()
    const periodStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()) // Start of day
    const periodEnd = new Date(periodStart)
    periodEnd.setDate(periodEnd.getDate() + 1) // End of day

    // Upsert: increment if exists, insert if not
    const existing = await this.db('organization_usage')
      .where({ org_id: orgId, metric, period_start: periodStart })
      .first()

    if (existing) {
      const [usage] = await this.db('organization_usage')
        .where({ id: existing.id })
        .update({ value: existing.value + value })
        .returning('*')
      return usage
    }

    const [usage] = await this.db('organization_usage')
      .insert({
        org_id: orgId,
        metric,
        value,
        period_start: periodStart,
        period_end: periodEnd,
        created_at: now
      })
      .returning('*')

    return usage
  }

  /**
   * Get usage metrics for organization
   */
  async getUsage(
    orgId: bigint,
    metric?: string,
    startDate?: Date,
    endDate?: Date
  ): Promise<OrganizationUsage[]> {
    let query = this.db('organization_usage').where({ org_id: orgId })

    if (metric) {
      query = query.where({ metric })
    }

    if (startDate) {
      query = query.where('period_start', '>=', startDate)
    }

    if (endDate) {
      query = query.where('period_end', '<=', endDate)
    }

    return query.orderBy('period_start', 'desc')
  }

  /**
   * Get total usage for a metric in the current period
   */
  async getCurrentUsage(orgId: bigint, metric: string): Promise<number> {
    const now = new Date()
    const periodStart = new Date(now.getFullYear(), now.getMonth(), 1) // Start of month

    const result = await this.db('organization_usage')
      .where({ org_id: orgId, metric })
      .where('period_start', '>=', periodStart)
      .sum('value as total')
      .first()

    return Number(result?.total || 0)
  }

  /**
   * Get agents with subdomains for an organization
   */
  async getAgentSubdomains(orgId: bigint): Promise<AgentSubdomain[]> {
    return this.db('agents')
      .where({ org_id: orgId })
      .whereNotNull('subdomain')
      .select('id', 'org_id', 'email', 'first_name', 'last_name', 'full_name', 'subdomain', 'active')
  }

  /**
   * Find agent by subdomain
   */
  async findAgentBySubdomain(orgId: bigint, subdomain: string): Promise<AgentSubdomain | null> {
    const agent = await this.db('agents')
      .where({ org_id: orgId, subdomain })
      .first()

    return agent || null
  }

  /**
   * List all organizations
   */
  async listOrganizations(limit: number = 50, offset: number = 0): Promise<{ organizations: Organization[]; total: number }> {
    const organizations = await this.db('organizations')
      .orderBy('created_at', 'desc')
      .limit(limit)
      .offset(offset)

    const [{ count }] = await this.db('organizations').count('* as count')

    return {
      organizations,
      total: Number(count)
    }
  }
}
