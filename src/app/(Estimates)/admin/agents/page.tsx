import ClientSidePageTemplate from '@/components/templates/ClientSidePageTemplate'
import AgentsPageContent from '@pages/admin/agents/AgentsPageContent'

const AgentsPage = () => {
  return (
    <ClientSidePageTemplate
      loginRedirect
      roles={['admin']}
      bgcolor="background.default"
    >
      <AgentsPageContent />
    </ClientSidePageTemplate>
  )
}

export default AgentsPage
