'use client'

import { useEffect } from 'react'
import dynamic from 'next/dynamic'
import { useSearchParams } from 'next/navigation'

// Direct imports: the '@shared/Dialogs' barrel re-exports every dialog in the
// app (gallery, estimate, advanced filters, ...), dragging their full provider
// chains - including the mapbox-gl runtime - into every page's bundle.
// CookieDialog stays eager: it auto-shows the consent prompt on mount.
import CookieDialog from '@shared/Dialogs/CookieDialog'

import { hasDialog, useDialogContext } from 'providers/DialogProvider'
import { useFeatures } from 'providers/FeaturesProvider'

import LazyDialog from './LazyDialog'

// Interaction-only dialogs load in their own client chunks (ssr:false — they
// render nothing until opened) and mount on first useDialog(name).visible via
// LazyDialog, keeping auth forms + validation out of the initial page load.
const AuthDialog = dynamic(() => import('@shared/Dialogs/AuthDialog'), {
  ssr: false
})
const OtpAuthDialog = dynamic(() => import('@shared/Dialogs/OtpAuthDialog'), {
  ssr: false
})
const FavoriteRemoveDialog = dynamic(
  () => import('@shared/Dialogs/FavoriteRemoveDialog'),
  { ssr: false }
)
const SaveSearchRemoveDialog = dynamic(
  () => import('@shared/Dialogs/SaveSearchRemoveDialog'),
  { ssr: false }
)
const ImageFavoriteRemoveDialog = dynamic(
  () => import('@shared/Dialogs/ImageFavoriteRemoveDialog'),
  { ssr: false }
)

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
      <LazyDialog name="auth" component={AuthDialog} />
      <LazyDialog name="otp-auth" component={OtpAuthDialog} />
      {features.favorites && (
        <LazyDialog name="remove-favorite" component={FavoriteRemoveDialog} />
      )}
      {features.saveSearch && (
        <LazyDialog
          name="delete-saved-search"
          component={SaveSearchRemoveDialog}
        />
      )}
      {features.imageFavorites && (
        <LazyDialog name="remove-image" component={ImageFavoriteRemoveDialog} />
      )}
      {features.cookieConsent && <CookieDialog />}
    </>
  )
}

export default DialogWindows
