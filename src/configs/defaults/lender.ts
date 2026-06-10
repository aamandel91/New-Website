import { tenant } from '@/configs/tenant.config'

const lenderConfig = {
  badgeLabel: 'PREFERRED MORTGAGE PARTNER',
  companyName: tenant.integrations.lender.name,
  loanOfficer: 'John Smith',
  nmls: '123456',
  companyNmls: '3029',
  phone: '(555) 555-0100',
  ctaLabel: 'ASK A LENDER',
  ctaUrl: tenant.integrations.lender.applyUrl
}

export default lenderConfig
