import { features } from 'features'

import ClientSidePageTemplate from '@/components/templates/ClientSidePageTemplate'
import Page404Template from '@/components/templates/Page404Template'
import DashboardPageContent from '@pages/dashboard'

import SearchProvider from 'providers/SearchProvider'

const DashboardPage = () => {
  if (!features.dashboard) return <Page404Template />

  return (
    <ClientSidePageTemplate>
      <SearchProvider>
        <DashboardPageContent />
      </SearchProvider>
    </ClientSidePageTemplate>
  )
}

export default DashboardPage
