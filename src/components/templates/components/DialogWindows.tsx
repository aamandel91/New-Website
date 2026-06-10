'use client'

import { useEffect } from 'react'
import { useSearchParams } from 'next/navigation'

// Direct imports: the '@shared/Dialogs' barrel re-exports every dialog in the
// app (gallery, estimate, advanced filters, ...), dragging their full provider
// chains - including the mapbox-gl runtime - into every page's bundle.
import AuthDialog from '@shared/Dialogs/AuthDialog'
import CookieDialog from '@shared/Dialogs/CookieDialog'
import FavoriteRemoveDialog from '@shared/Dialogs/FavoriteRemoveDialog'
import ImageFavoriteRemoveDialog from '@shared/Dialogs/ImageFavoriteRemoveDialog'
import OtpAuthDialog from '@shared/Dialogs/OtpAuthDialog'
import SaveSearchRemoveDialog from '@shared/Dialogs/SaveSearchRemoveDialog'

import { hasDialog, useDialogContext } from 'providers/DialogProvider'
import { useFeatures } from 'providers/FeaturesProvider'

const DialogWindows = () => {
  const features = useFeatures()
  const params = useSearchParams()
  const { showDialogInstantly } = useDialogContext()
  const dialogName = params.get('dialog') || ''

  useEffect(() => {
    if (params && hasDialog(dialogName)) {
      showDialogInstantly(dialogName)
    }
  }, [])

  return (
    <>
      <AuthDialog />
      <OtpAuthDialog />
      {features.favorites && <FavoriteRemoveDialog />}
      {features.saveSearch && <SaveSearchRemoveDialog />}
      {features.imageFavorites && <ImageFavoriteRemoveDialog />}
      {features.cookieConsent && <CookieDialog />}
    </>
  )
}

export default DialogWindows
