'use client'
import { features } from 'features'

import ClientSidePageTemplate from '@/components/templates/ClientSidePageTemplate'
import Page404Template from '@/components/templates/Page404Template'
import ProfilePageContent from '@pages/profile'

const ProfilePage = () => {
  if (!features.profile) return <Page404Template />

  return (
    <ClientSidePageTemplate loginRequired>
      <ProfilePageContent />
    </ClientSidePageTemplate>
  )
}
export default ProfilePage
