'use client'

import { useCallback, useState } from 'react'

import { Box } from '@mui/material'

interface YouTubeFacadeProps {
  videoId: string
  title?: string
}

const YouTubeFacade = ({
  videoId,
  title = 'YouTube video'
}: YouTubeFacadeProps) => {
  const [loaded, setLoaded] = useState(false)

  const handleClick = useCallback(() => {
    setLoaded(true)
  }, [])

  const thumbnailUrl = `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`

  if (loaded) {
    return (
      <Box
        sx={{
          position: 'relative',
          width: '100%',
          paddingTop: '56.25%',
          my: 2,
          borderRadius: 1,
          overflow: 'hidden'
        }}
      >
        <iframe
          src={`https://www.youtube.com/embed/${videoId}?autoplay=1`}
          title={title}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            border: 0
          }}
        />
      </Box>
    )
  }

  return (
    <Box
      onClick={handleClick}
      role="button"
      tabIndex={0}
      aria-label={`Play ${title}`}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          handleClick()
        }
      }}
      sx={{
        position: 'relative',
        width: '100%',
        paddingTop: '56.25%',
        my: 2,
        borderRadius: 1,
        overflow: 'hidden',
        cursor: 'pointer',
        '&:hover .play-overlay': {
          bgcolor: 'rgba(255,0,0,0.9)'
        }
      }}
    >
      {/* Thumbnail */}
      <Box
        component="img"
        src={thumbnailUrl}
        alt={title}
        loading="lazy"
        sx={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          objectFit: 'cover'
        }}
      />

      {/* Play Button Overlay */}
      <Box
        className="play-overlay"
        sx={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: 68,
          height: 48,
          bgcolor: 'rgba(255,0,0,0.8)',
          borderRadius: '12px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'background-color 0.2s'
        }}
      >
        <Box
          component="svg"
          viewBox="0 0 24 24"
          sx={{ width: 28, height: 28, fill: '#fff', ml: '2px' }}
        >
          <path d="M8 5v14l11-7z" />
        </Box>
      </Box>
    </Box>
  )
}

export default YouTubeFacade
