'use client'

import React from 'react'
import { Box } from '@mui/material'
import PlayCircleOutlineIcon from '@mui/icons-material/PlayCircleOutline'

interface VideoThumbnailProps {
  videoUrl: string
  active: boolean
  onClick: () => void
}

const VideoThumbnail = ({ videoUrl, active, onClick }: VideoThumbnailProps) => {
  // Extract YouTube video ID from URL
  const getYouTubeId = (url: string) => {
    const match = url.match(
      /(?:youtube\.com\/(?:[^/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?/\s]{11})/
    )
    return match?.[1] || ''
  }

  const videoId = getYouTubeId(videoUrl)
  if (!videoId) return null

  const thumbnailUrl = `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`

  return (
    <Box
      onClick={onClick}
      sx={{
        position: 'relative',
        width: '100%',
        aspectRatio: '16/9',
        borderRadius: 1,
        overflow: 'hidden',
        cursor: 'pointer',
        border: active ? 2 : 0,
        borderColor: 'primary.main',
        opacity: active ? 1 : 0.7,
        transition: 'opacity 0.2s ease',
        '&:hover': { opacity: 1 },
      }}
    >
      <Box
        component="img"
        src={thumbnailUrl}
        alt="Neighbourhood video"
        sx={{
          width: '100%',
          height: '100%',
          objectFit: 'cover',
        }}
      />
      <Box
        sx={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          bgcolor: 'rgba(0,0,0,0.3)',
        }}
      >
        <PlayCircleOutlineIcon sx={{ fontSize: 36, color: 'white' }} />
      </Box>
    </Box>
  )
}

export default VideoThumbnail
