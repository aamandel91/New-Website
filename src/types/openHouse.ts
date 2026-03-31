export interface OpenHouseSession {
  id: string
  mlsNumber: string
  agentName: string
  agentEmail: string
  propertyAddress: string
  propertyImage: string
  propertyPrice: string
  createdAt: string
  visitors: OpenHouseVisitor[]
}

export interface OpenHouseVisitor {
  id: string
  name: string
  email: string
  phone: string
  workingWithAgent: 'yes' | 'no' | ''
  hearAbout: string
  preApproved: 'yes' | 'no' | 'not_yet' | ''
  customAnswers: Record<string, string>
  signedInAt: string
}
