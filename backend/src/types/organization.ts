export interface Organization {
  id: bigint
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
  created_at: Date
  updated_at: Date
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

export interface OrganizationMember {
  id: bigint
  org_id: bigint
  email: string
  role: string
  invited_by: string | null
  invited_at: Date | null
  joined_at: Date | null
  created_at: Date
}

export interface Invitation {
  id: bigint
  org_id: bigint
  email: string
  role: string
  token: string
  invited_by: string | null
  expires_at: Date | null
  accepted_at: Date | null
  created_at: Date
}

export interface AgentSubdomain {
  id: bigint
  org_id: bigint
  email: string
  first_name: string | null
  last_name: string | null
  full_name: string | null
  subdomain: string | null
  active: boolean
}
