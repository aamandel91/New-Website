import APIBase from './APIBase'

export interface Lead {
  id: string
  org_id: string
  first_name: string | null
  last_name: string | null
  email: string
  phone: string | null
  source: string | null
  status: string
  assigned_to: string | null
  property_interest: string | null
  tags: string[]
  custom_fields: Record<string, any>
  notes: string | null
  last_contact_at: string | null
  created_at: string
  updated_at: string
}

export interface LeadActivity {
  id: string
  org_id: string
  lead_id: string
  activity_type: string
  description: string | null
  performed_by: string | null
  metadata: Record<string, any>
  created_at: string
}

export interface CreateLeadInput {
  first_name?: string
  last_name?: string
  email: string
  phone?: string
  source?: string
  status?: string
  assigned_to?: string
  property_interest?: string
  tags?: string[]
  custom_fields?: Record<string, any>
  notes?: string
}

export interface UpdateLeadInput {
  first_name?: string
  last_name?: string
  email?: string
  phone?: string
  source?: string
  status?: string
  assigned_to?: string
  property_interest?: string
  tags?: string[]
  custom_fields?: Record<string, any>
  notes?: string
  last_contact_at?: string
}

export interface CreateActivityInput {
  activity_type: string
  description?: string
  metadata?: Record<string, any>
}

export interface LeadFilters {
  status?: string
  source?: string
  assigned_to?: string
  search?: string
  tags?: string[]
  limit?: number
  offset?: number
}

export interface LeadsResponse {
  leads: Lead[]
  total: number
}

export interface LeadStats {
  total: number
  byStatus: Record<string, number>
  bySource: Record<string, number>
}

class APILeads extends APIBase {
  /**
   * Get leads with filtering
   */
  async getLeads(filters?: LeadFilters): Promise<LeadsResponse> {
    const params = new URLSearchParams()

    if (filters?.status) params.append('status', filters.status)
    if (filters?.source) params.append('source', filters.source)
    if (filters?.assigned_to) params.append('assigned_to', filters.assigned_to)
    if (filters?.search) params.append('search', filters.search)
    if (filters?.tags && filters.tags.length > 0) {
      filters.tags.forEach((tag) => params.append('tags', tag))
    }
    if (filters?.limit) params.append('limit', filters.limit.toString())
    if (filters?.offset) params.append('offset', filters.offset.toString())

    const queryString = params.toString()
    const url = queryString ? `/leads?${queryString}` : '/leads'

    return this.fetchJSON<LeadsResponse>(url)
  }

  /**
   * Get lead statistics
   */
  async getStats(): Promise<LeadStats> {
    return this.fetchJSON<LeadStats>('/leads/stats')
  }

  /**
   * Get lead by ID
   */
  async getLeadById(id: string): Promise<Lead> {
    return this.fetchJSON<Lead>(`/leads/${id}`)
  }

  /**
   * Create lead
   */
  async createLead(data: CreateLeadInput): Promise<Lead> {
    return this.fetchJSON<Lead>('/leads', {
      method: 'POST',
      body: JSON.stringify(data)
    })
  }

  /**
   * Update lead
   */
  async updateLead(id: string, data: UpdateLeadInput): Promise<Lead> {
    return this.fetchJSON<Lead>(`/leads/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data)
    })
  }

  /**
   * Delete lead
   */
  async deleteLead(id: string): Promise<{ success: boolean }> {
    return this.fetchJSON<{ success: boolean }>(`/leads/${id}`, {
      method: 'DELETE'
    })
  }

  /**
   * Get lead activities
   */
  async getActivities(leadId: string): Promise<LeadActivity[]> {
    return this.fetchJSON<LeadActivity[]>(`/leads/${leadId}/activities`)
  }

  /**
   * Add activity to lead
   */
  async addActivity(
    leadId: string,
    data: CreateActivityInput
  ): Promise<LeadActivity> {
    return this.fetchJSON<LeadActivity>(`/leads/${leadId}/activities`, {
      method: 'POST',
      body: JSON.stringify(data)
    })
  }

  /**
   * Bulk update leads
   */
  async bulkUpdate(
    leadIds: string[],
    updates: UpdateLeadInput
  ): Promise<{ updated: number; results: Lead[] }> {
    return this.fetchJSON<{ updated: number; results: Lead[] }>(
      '/leads/bulk/update',
      {
        method: 'POST',
        body: JSON.stringify({
          lead_ids: leadIds,
          updates
        })
      }
    )
  }
}

const apiLeadsInstance = new APILeads()
export default apiLeadsInstance
