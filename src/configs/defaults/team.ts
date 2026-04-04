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
    name: 'Andy Mandel',
    role: 'Team Leader',
    phone: '(954) 610-0563',
    license: '3284048',
  },
]
