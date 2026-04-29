import { tenant } from '@/configs/tenant.config'

export interface TeamMember {
  name: string
  role: string
  phone: string
  license: string
  photo?: string
  email?: string
}

export const teamMembers: TeamMember[] = [
  {
    name: tenant.brand.leaderName,
    role: 'Team Leader',
    phone: tenant.contact.phone,
    license: '3284048',
  },
]
