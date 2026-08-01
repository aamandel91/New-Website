import { features } from 'features'

import DashboardPageTemplate from '@/components/templates/DashboardPageTemplate'
import Page404Template from '@/components/templates/Page404Template'
import FavoritesPageContent from '@pages/favorites'

const FavoritesPage = () => {
  if (!features.favorites) return <Page404Template />

  return (
    <DashboardPageTemplate>
      <FavoritesPageContent />
    </DashboardPageTemplate>
  )
}

export default FavoritesPage
