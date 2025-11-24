import React from 'react'
import Image from 'next/legacy/image'

import { Box } from '@mui/material'

import content from '@configs/content'

const { siteName, siteSplashscreen } = content

const BannerImage = () => {
  return (
    <Box
      width="100%"
      height="100%"
      position="absolute"
      bgcolor="background.default"
    >
      <Image
        unoptimized
        layout="fill"
        loading="lazy"
        priority={false}
        objectFit="cover"
        objectPosition="center"
        src={siteSplashscreen}
        alt={siteName}
      />
      {/* Dark overlay for better text readability */}
      <Box
        sx={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'linear-gradient(to right, rgba(0,0,0,0.6) 0%, rgba(0,0,0,0.3) 50%, rgba(0,0,0,0.1) 100%)'
        }}
      />
    </Box>
  )
}

export default BannerImage
