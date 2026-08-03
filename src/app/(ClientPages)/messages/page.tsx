import { features } from 'features'

import DashboardPageTemplate from '@/components/templates/DashboardPageTemplate'
import Page404Template from '@/components/templates/Page404Template'
import MessagesPageContent from '@pages/messages'

const MessagesPage = () => {
  if (!features.messaging) return <Page404Template />

  return (
    <DashboardPageTemplate>
      <MessagesPageContent />
    </DashboardPageTemplate>
  )
}

export default MessagesPage
