import APIBase from './APIBase'

export interface Organization {
  id: string
  name: string
  slug: string
  plan: string
  status: string
  settings: Record<string, any>
  primary_domain: string
  custom_domain: string | null
  logo_cloudinary_id: string | null
  primary_color: string
  secondary_color: string
  contact_email: string | null
  contact_phone: string | null
  created_at: string
  updated_at: string
}

export interface OrganizationMember {
  id: string
  org_id: string
  email: string
  role: string
  invited_by: string | null
  invited_at: string | null
  joined_at: string | null
  created_at: string
}

export interface Invitation {
  id: string
  org_id: string
  email: string
  role: string
  token: string
  invited_by: string | null
  expires_at: string | null
  accepted_at: string | null
  created_at: string
}

export interface AgentSubdomain {
  id: string
  org_id: string
  email: string
  first_name: string | null
  last_name: string | null
  full_name: string | null
  subdomain: string | null
  active: boolean
}

export interface UpdateOrganizationInput {
  name?: string
  plan?: string
  status?: string
  settings?: Record<string, any>
  primary_domain?: string
  custom_domain?: string | null
  logo_cloudinary_id?: string | null
  primary_color?: string
  secondary_color?: string
  contact_email?: string | null
  contact_phone?: string | null
}

class APIOrganization extends APIBase {
  /**
   * Get current organization (based on hostname or user's org)
   */
  async getCurrent(): Promise<Organization> {
    return this.fetchJSON<Organization>('/organization/current')
  }

  /**
   * Resolve organization by hostname (public endpoint)
   */
  async resolve(): Promise<Organization> {
    return this.fetchJSON<Organization>('/organization/resolve')
  }

  /**
   * Get organization by ID
   */
  async getById(orgId: string): Promise<Organization> {
    return this.fetchJSON<Organization>(`/organization/${orgId}`)
  }

  /**
   * Update organization (admin only)
   */
  async update(orgId: string, data: UpdateOrganizationInput): Promise<Organization> {
    return this.fetchJSON<Organization>(`/organization/${orgId}`, {
      method: 'PATCH',
      body: JSON.stringify(data)
    })
  }

  /**
   * Get organization members
   */
  async getMembers(orgId: string): Promise<OrganizationMember[]> {
    return this.fetchJSON<OrganizationMember[]>(`/organization/${orgId}/members`)
  }

  /**
   * Add member to organization (admin only)
   */
  async addMember(
    orgId: string,
    data: { email: string; role: string }
  ): Promise<OrganizationMember> {
    return this.fetchJSON<OrganizationMember>(`/organization/${orgId}/members`, {
      method: 'POST',
      body: JSON.stringify(data)
    })
  }

  /**
   * Update member role (admin only)
   */
  async updateMemberRole(
    orgId: string,
    email: string,
    role: string
  ): Promise<OrganizationMember> {
    return this.fetchJSON<OrganizationMember>(`/organization/${orgId}/members/${email}`, {
      method: 'PATCH',
      body: JSON.stringify({ role })
    })
  }

  /**
   * Remove member from organization (admin only)
   */
  async removeMember(orgId: string, email: string): Promise<{ success: boolean }> {
    return this.fetchJSON<{ success: boolean }>(`/organization/${orgId}/members/${email}`, {
      method: 'DELETE'
    })
  }

  /**
   * Create invitation (admin only)
   */
  async createInvitation(
    orgId: string,
    data: { email: string; role: string }
  ): Promise<Invitation> {
    return this.fetchJSON<Invitation>(`/organization/${orgId}/invitations`, {
      method: 'POST',
      body: JSON.stringify(data)
    })
  }

  /**
   * Accept invitation
   */
  async acceptInvitation(
    token: string
  ): Promise<{ organization: Organization; member: OrganizationMember }> {
    return this.fetchJSON<{ organization: Organization; member: OrganizationMember }>(
      `/organization/invitations/${token}/accept`,
      {
        method: 'POST'
      }
    )
  }

  /**
   * Get agents with subdomains
   */
  async getAgentSubdomains(orgId: string): Promise<AgentSubdomain[]> {
    return this.fetchJSON<AgentSubdomain[]>(`/organization/${orgId}/agents/subdomains`)
  }

  /**
   * Find agent by subdomain
   */
  async findAgentBySubdomain(orgId: string, subdomain: string): Promise<AgentSubdomain> {
    return this.fetchJSON<AgentSubdomain>(
      `/organization/${orgId}/agents/subdomain/${subdomain}`
    )
  }
}

const apiOrganizationInstance = new APIOrganization()
export default apiOrganizationInstance
