import { features } from 'features'

import { DashboardPageTemplate, Page404Template } from '@templates'
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
