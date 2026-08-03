import { features } from 'features'

import DashboardPageTemplate from '@/components/templates/DashboardPageTemplate'
import Page404Template from '@/components/templates/Page404Template'
import ImageFavoritesPageContent from '@pages/image-favorites'

const ImageFavoritesPage = () => {
  if (!features.imageFavorites) return <Page404Template />

  return (
    <DashboardPageTemplate>
      <ImageFavoritesPageContent />
    </DashboardPageTemplate>
  )
}

export default ImageFavoritesPage
