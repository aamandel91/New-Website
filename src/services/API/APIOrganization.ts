import APIBase from './APIBase'

export interface Organization {
  id: string
  name: string
  slug: string
  plan: string
  status: string
  settings: Record<string, any>
  stripe_customer_id: string | null
  stripe_subscription_id: string | null
  trial_ends_at: string | null
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

export interface OrganizationUsage {
  id: string
  org_id: string
  metric: string
  value: number
  period_start: string
  period_end: string
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

export interface CreateOrganizationInput {
  name: string
  slug: string
  plan?: string
  primary_domain: string
  owner_email: string
  contact_email?: string
  contact_phone?: string
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
   * Get usage metrics
   */
  async getUsage(
    orgId: string,
    metric?: string,
    startDate?: string,
    endDate?: string
  ): Promise<OrganizationUsage[]> {
    const params = new URLSearchParams()
    if (metric) params.append('metric', metric)
    if (startDate) params.append('start_date', startDate)
    if (endDate) params.append('end_date', endDate)

    const queryString = params.toString()
    const url = queryString
      ? `/organization/${orgId}/usage?${queryString}`
      : `/organization/${orgId}/usage`

    return this.fetchJSON<OrganizationUsage[]>(url)
  }

  /**
   * Check usage limit for a metric
   */
  async checkUsageLimit(
    orgId: string,
    metric: string
  ): Promise<{ allowed: boolean; current: number; limit: number }> {
    return this.fetchJSON<{ allowed: boolean; current: number; limit: number }>(
      `/organization/${orgId}/usage/${metric}/check`
    )
  }

  /**
   * Get plan limits
   */
  async getPlanLimits(orgId: string): Promise<Record<string, number>> {
    return this.fetchJSON<Record<string, number>>(`/organization/${orgId}/limits`)
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

  /**
   * List all organizations (root only)
   */
  async list(
    limit: number = 50,
    offset: number = 0
  ): Promise<{ organizations: Organization[]; total: number }> {
    return this.fetchJSON<{ organizations: Organization[]; total: number }>(
      `/organization?limit=${limit}&offset=${offset}`
    )
  }

  /**
   * Create new organization (root only)
   */
  async create(data: CreateOrganizationInput): Promise<Organization> {
    return this.fetchJSON<Organization>('/organization', {
      method: 'POST',
      body: JSON.stringify(data)
    })
  }
}

const apiOrganizationInstance = new APIOrganization()
export default apiOrganizationInstance
