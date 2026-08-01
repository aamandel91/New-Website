import ClientSidePageTemplate from '@/components/templates/ClientSidePageTemplate'
import { AgentClientsContent } from '@pages/agent'

const AgentClientsPage = () => {
  return (
    <ClientSidePageTemplate
      loginRedirect
      roles={['agent', 'admin']}
      bgcolor="background.default"
    >
      <AgentClientsContent />
    </ClientSidePageTemplate>
  )
}

export default AgentClientsPage
