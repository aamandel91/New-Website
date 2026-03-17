'use client'

import React from 'react'
import { Box, Dialog, DialogContent, IconButton } from '@mui/material'
import CloseIcon from '@mui/icons-material/Close'

interface VideoDialogProps {
  open: boolean
  videoUrl: string
  onClose: () => void
}

const VideoDialog = ({ open, videoUrl, onClose }: VideoDialogProps) => {
  const getYouTubeId = (url: string) => {
    const match = url.match(
      /(?:youtube\.com\/(?:[^/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?/\s]{11})/
    )
    return match?.[1] || ''
  }

  const videoId = getYouTubeId(videoUrl)

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: { bgcolor: 'black', overflow: 'hidden' }
      }}
    >
      <IconButton
        onClick={onClose}
        sx={{
          position: 'absolute',
          top: 8,
          right: 8,
          color: 'white',
          zIndex: 1,
          bgcolor: 'rgba(0,0,0,0.5)',
          '&:hover': { bgcolor: 'rgba(0,0,0,0.7)' },
        }}
      >
        <CloseIcon />
      </IconButton>
      <DialogContent sx={{ p: 0, aspectRatio: '16/9' }}>
        {videoId && (
          <Box
            component="iframe"
            src={`https://www.youtube.com/embed/${videoId}?autoplay=1`}
            title="Neighbourhood Video"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            sx={{
              width: '100%',
              height: '100%',
              border: 'none',
            }}
          />
        )}
      </DialogContent>
    </Dialog>
  )
}

export default VideoDialog
