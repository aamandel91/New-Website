import { useEffect } from 'react'
import Image from 'next/image'

import { Box, DialogContent, DialogTitle } from '@mui/material'

import { type GalleryDialogProps, useDialog } from 'providers/DialogProvider'
import { getCDNPath } from 'utils/urls'

import { BaseFullscreenDialog } from '.'

const dialogName = 'fullscreen-ribbon'

const FullscreenRibbonDialog = () => {
  const { getOptions } = useDialog<GalleryDialogProps>(dialogName)
  const { images = [], active = 0 } = getOptions()
  const { visible } = useDialog(dialogName)

  useEffect(() => {
    if (visible) {
      setTimeout(() => {
        document.getElementById(`img-${active}`)?.scrollIntoView()
      }, 100)
    }
  }, [active, visible])

  return (
    <BaseFullscreenDialog name={dialogName}>
      <DialogTitle>{images.length} Images</DialogTitle>
      <DialogContent>
        {images.map((image, index) => (
          <Box key={index} id={`img-${index}`} sx={{ position: 'relative', width: '100%', mb: 2 }}>
            <Image
              src={getCDNPath(image, 'medium')}
              alt={`Property image ${index + 1}`}
              width={1200}
              height={800}
              style={{ width: '100%', height: 'auto' }}
              sizes="100vw"
              quality={75}
            />
          </Box>
        ))}
      </DialogContent>
    </BaseFullscreenDialog>
  )
}

export default FullscreenRibbonDialog
