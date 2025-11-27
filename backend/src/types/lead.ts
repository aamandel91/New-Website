export interface Lead {
  id: bigint
  org_id: bigint
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
  last_contact_at: Date | null
  created_at: Date
  updated_at: Date
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
  last_contact_at?: Date
}

export interface LeadActivity {
  id: bigint
  org_id: bigint
  lead_id: bigint
  activity_type: string
  description: string | null
  performed_by: string | null
  metadata: Record<string, any>
  created_at: Date
}

export interface CreateActivityInput {
  activity_type: string
  description?: string
  performed_by?: string
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
