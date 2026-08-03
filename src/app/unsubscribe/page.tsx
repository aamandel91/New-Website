import ClientSidePageTemplate from '@/components/templates/ClientSidePageTemplate'
import { UnsubscribePageContent } from '@pages/profile'

const UnsubscribePage = () => {
  return (
    <ClientSidePageTemplate loginRedirect>
      <UnsubscribePageContent />
    </ClientSidePageTemplate>
  )
}

export default UnsubscribePage
