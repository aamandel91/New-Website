import { injectable, inject } from 'tsyringe'
import type { Knex } from 'knex'
import type {
  Organization,
  UpdateOrganizationInput,
  OrganizationMember,
  Invitation,
  AgentSubdomain
} from '../types/organization.js'
import crypto from 'crypto'

@injectable()
export class OrganizationRepository {
  constructor(@inject('db') private db: Knex) {}

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
    const org = await this.db('organizations')
      .where({ primary_domain: domain })
      .first()
    return org || null
  }

  /**
   * Find organization by custom domain
   */
  async findByCustomDomain(domain: string): Promise<Organization | null> {
    const org = await this.db('organizations')
      .where({ custom_domain: domain })
      .first()
    return org || null
  }

  /**
   * Update organization
   */
  async updateOrganization(
    id: bigint,
    input: UpdateOrganizationInput
  ): Promise<Organization> {
    const updateData: any = {
      updated_at: new Date()
    }

    if (input.name) updateData.name = input.name
    if (input.plan) updateData.plan = input.plan
    if (input.status) updateData.status = input.status
    if (input.settings) updateData.settings = JSON.stringify(input.settings)
    if (input.primary_domain) updateData.primary_domain = input.primary_domain
    if (input.custom_domain !== undefined)
      updateData.custom_domain = input.custom_domain
    if (input.logo_cloudinary_id !== undefined)
      updateData.logo_cloudinary_id = input.logo_cloudinary_id
    if (input.primary_color) updateData.primary_color = input.primary_color
    if (input.secondary_color)
      updateData.secondary_color = input.secondary_color
    if (input.contact_email !== undefined)
      updateData.contact_email = input.contact_email
    if (input.contact_phone !== undefined)
      updateData.contact_phone = input.contact_phone

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
  async addMember(
    orgId: bigint,
    email: string,
    role: string,
    invitedBy: string
  ): Promise<OrganizationMember> {
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
  async updateMemberRole(
    orgId: bigint,
    email: string,
    role: string
  ): Promise<OrganizationMember> {
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
  async createInvitation(
    orgId: bigint,
    email: string,
    role: string,
    invitedBy: string
  ): Promise<Invitation> {
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
   * Get agents with subdomains for an organization
   */
  async getAgentSubdomains(orgId: bigint): Promise<AgentSubdomain[]> {
    return this.db('agents')
      .where({ org_id: orgId })
      .whereNotNull('subdomain')
      .select(
        'id',
        'org_id',
        'email',
        'first_name',
        'last_name',
        'full_name',
        'subdomain',
        'active'
      )
  }

  /**
   * Find agent by subdomain
   */
  async findAgentBySubdomain(
    orgId: bigint,
    subdomain: string
  ): Promise<AgentSubdomain | null> {
    const agent = await this.db('agents')
      .where({ org_id: orgId, subdomain })
      .first()

    return agent || null
  }
}
