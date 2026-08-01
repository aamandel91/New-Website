import { features } from 'features'

import DashboardPageTemplate from '@/components/templates/DashboardPageTemplate'
import Page404Template from '@/components/templates/Page404Template'
import SavedSearchesPageContent from '@pages/saved-searches'

import MapOptionsProvider from 'providers/MapOptionsProvider'
import SearchProvider from 'providers/SearchProvider'

const FavoritesPage = () => {
  if (!features.saveSearch) return <Page404Template />

  return (
    <DashboardPageTemplate>
      <SearchProvider>
        <MapOptionsProvider layout="map" style="map">
          <SavedSearchesPageContent />
        </MapOptionsProvider>
      </SearchProvider>
    </DashboardPageTemplate>
  )
}

export default FavoritesPage
