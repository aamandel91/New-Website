'use client'

import React, {
  createContext,
  type ReactNode,
  useContext,
  useEffect,
  useState
} from 'react'

import APIOrganization, {
  type AgentSubdomain,
  type Organization,
  type OrganizationMember,
  type UpdateOrganizationInput
} from '@/services/API/APIOrganization'

export type OrganizationContextType = {
  organization: Organization | null
  loading: boolean
  error: string | null
  members: OrganizationMember[]
  agentSubdomains: AgentSubdomain[]
  isAgentSubdomain: boolean
  currentAgent: AgentSubdomain | null
  refresh: () => Promise<void>
  updateOrganization: (
    data: UpdateOrganizationInput
  ) => Promise<Organization | null>
  fetchMembers: () => Promise<void>
  addMember: (email: string, role: string) => Promise<OrganizationMember | null>
  removeMember: (email: string) => Promise<boolean>
  updateMemberRole: (
    email: string,
    role: string
  ) => Promise<OrganizationMember | null>
}

const OrganizationContext = createContext<OrganizationContextType | undefined>(
  undefined
)

export const OrganizationProvider = ({ children }: { children: ReactNode }) => {
  const [organization, setOrganization] = useState<Organization | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [members, setMembers] = useState<OrganizationMember[]>([])
  const [agentSubdomains, setAgentSubdomains] = useState<AgentSubdomain[]>([])
  const [currentAgent, setCurrentAgent] = useState<AgentSubdomain | null>(null)

  // Detect if current domain is an agent subdomain
  const detectAgentSubdomain = async (org: Organization) => {
    if (typeof window === 'undefined') return

    const hostname = window.location.hostname
    const parts = hostname.split('.')

    // Check if this looks like a subdomain (has at least 3 parts)
    if (parts.length >= 2 && org) {
      const possibleSubdomain = parts[0]

      try {
        const agent = await APIOrganization.findAgentBySubdomain(
          org.id,
          possibleSubdomain
        )
        setCurrentAgent(agent)
      } catch (err) {
        // Not an agent subdomain, that's fine
        setCurrentAgent(null)
      }
    }
  }

  const fetchOrganization = async () => {
    try {
      setLoading(true)
      setError(null)

      const org = await APIOrganization.getCurrent()
      setOrganization(org)

      // Detect if we're on an agent subdomain
      await detectAgentSubdomain(org)
    } catch (err: any) {
      console.error('Failed to fetch organization:', err)
      setError(err?.message || 'Failed to load organization')
      setOrganization(null)
    } finally {
      setLoading(false)
    }
  }

  const fetchMembers = async () => {
    if (!organization) return

    try {
      const membersList = await APIOrganization.getMembers(organization.id)
      setMembers(membersList)
    } catch (err: any) {
      console.error('Failed to fetch members:', err)
    }
  }

  const fetchAgentSubdomains = async () => {
    if (!organization) return

    try {
      const agents = await APIOrganization.getAgentSubdomains(organization.id)
      setAgentSubdomains(agents)
    } catch (err: any) {
      console.error('Failed to fetch agent subdomains:', err)
    }
  }

  const updateOrganization = async (
    data: UpdateOrganizationInput
  ): Promise<Organization | null> => {
    if (!organization) return null

    try {
      const updated = await APIOrganization.update(organization.id, data)
      setOrganization(updated)
      return updated
    } catch (err: any) {
      console.error('Failed to update organization:', err)
      return null
    }
  }

  const addMember = async (
    email: string,
    role: string
  ): Promise<OrganizationMember | null> => {
    if (!organization) return null

    try {
      const member = await APIOrganization.addMember(organization.id, {
        email,
        role
      })
      setMembers((prev) => [...prev, member])
      return member
    } catch (err: any) {
      console.error('Failed to add member:', err)
      return null
    }
  }

  const removeMember = async (email: string): Promise<boolean> => {
    if (!organization) return false

    try {
      const result = await APIOrganization.removeMember(organization.id, email)
      if (result.success) {
        setMembers((prev) => prev.filter((m) => m.email !== email))
      }
      return result.success
    } catch (err: any) {
      console.error('Failed to remove member:', err)
      return false
    }
  }

  const updateMemberRole = async (
    email: string,
    role: string
  ): Promise<OrganizationMember | null> => {
    if (!organization) return null

    try {
      const updated = await APIOrganization.updateMemberRole(
        organization.id,
        email,
        role
      )
      setMembers((prev) => prev.map((m) => (m.email === email ? updated : m)))
      return updated
    } catch (err: any) {
      console.error('Failed to update member role:', err)
      return null
    }
  }

  const refresh = async () => {
    await fetchOrganization()
  }

  useEffect(() => {
    fetchOrganization()
  }, [])

  const value: OrganizationContextType = {
    organization,
    loading,
    error,
    members,
    agentSubdomains,
    isAgentSubdomain: currentAgent !== null,
    currentAgent,
    refresh,
    updateOrganization,
    fetchMembers,
    addMember,
    removeMember,
    updateMemberRole
  }

  return (
    <OrganizationContext.Provider value={value}>
      {children}
    </OrganizationContext.Provider>
  )
}

export const useOrganization = (): OrganizationContextType => {
  const context = useContext(OrganizationContext)
  if (!context) {
    throw new Error(
      'useOrganization must be used within an OrganizationProvider'
    )
  }
  return context
}
