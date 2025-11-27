'use client'

import React, { useState } from 'react'
import {
  Box,
  Dialog,
  IconButton,
  Typography,
  Grid,
  useTheme,
  useMediaQuery,
  Chip,
} from '@mui/material'
import CloseIcon from '@mui/icons-material/Close'
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft'
import ChevronRightIcon from '@mui/icons-material/ChevronRight'
import PhotoLibraryIcon from '@mui/icons-material/PhotoLibrary'
import StarIcon from '@mui/icons-material/Star'
import Image from 'next/image'

import { type Property } from 'services/API'
import { sortImagesByQuality, type EnhancedPhoto } from 'utils/imageQuality'

interface PropertyPhoto {
  url: string
  caption?: string
  order?: number
}

interface PropertyPhotoGalleryProps {
  photos?: PropertyPhoto[]
  property?: Property
  propertyAddress?: string
}

const PropertyPhotoGallery: React.FC<PropertyPhotoGalleryProps> = ({
  photos,
  property,
  propertyAddress,
}) => {
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('md'))
  const [lightboxOpen, setLightboxOpen] = useState(false)
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0)

  // Use enhanced image sorting if property data is available, otherwise use basic photos
  const sortedPhotos: EnhancedPhoto[] = property
    ? sortImagesByQuality(
        property.images || [],
        property.imagesScore,
        property.imageInsights
      )
    : photos
    ? [...photos].sort((a, b) => (a.order || 0) - (b.order || 0))
    : []

  const heroPhoto = sortedPhotos[0]
  const thumbnailPhotos = sortedPhotos.slice(1, isMobile ? 4 : 5)

  const handleOpenLightbox = (index: number) => {
    setCurrentPhotoIndex(index)
    setLightboxOpen(true)
  }

  const handleNextPhoto = () => {
    setCurrentPhotoIndex((prev) => (prev + 1) % sortedPhotos.length)
  }

  const handlePrevPhoto = () => {
    setCurrentPhotoIndex((prev) => (prev - 1 + sortedPhotos.length) % sortedPhotos.length)
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowRight') handleNextPhoto()
    if (e.key === 'ArrowLeft') handlePrevPhoto()
    if (e.key === 'Escape') setLightboxOpen(false)
  }

  if (!sortedPhotos.length) {
    return (
      <Box
        sx={{
          height: { xs: 300, md: 600 },
          bgcolor: 'grey.200',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Typography color="text.secondary">No photos available</Typography>
      </Box>
    )
  }

  return (
    <>
      {/* Photo Gallery Grid */}
      <Box sx={{ width: '100%', mb: 4 }}>
        <Grid container spacing={1}>
          {/* Hero Image - Full width on mobile, 2/3 on desktop */}
          <Grid item xs={12} md={8}>
            <Box
              onClick={() => handleOpenLightbox(0)}
              sx={{
                position: 'relative',
                height: { xs: 300, md: 600 },
                overflow: 'hidden',
                borderRadius: 2,
                cursor: 'pointer',
                '&:hover': {
                  '& .photo-overlay': {
                    opacity: 1,
                  },
                },
              }}
            >
              <Image
                src={heroPhoto.url}
                alt={propertyAddress || 'Property photo'}
                fill
                style={{ objectFit: 'cover' }}
                priority
                sizes="(max-width: 768px) 100vw, 66vw"
              />
              {/* Photo count and quality overlay */}
              <Box
                className="photo-overlay"
                sx={{
                  position: 'absolute',
                  bottom: 16,
                  right: 16,
                  display: 'flex',
                  alignItems: 'center',
                  flexDirection: 'column',
                  gap: 0.5,
                  opacity: { xs: 1, md: 0 },
                  transition: 'opacity 0.2s',
                }}
              >
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1,
                    bgcolor: 'rgba(0, 0, 0, 0.7)',
                    color: 'white',
                    px: 2,
                    py: 1,
                    borderRadius: 2,
                  }}
                >
                  <PhotoLibraryIcon fontSize="small" />
                  <Typography variant="body2" fontWeight="medium">
                    {sortedPhotos.length} Photos
                  </Typography>
                </Box>
                {heroPhoto.qualityLabel && (
                  <Chip
                    icon={<StarIcon />}
                    label={heroPhoto.qualityLabel}
                    size="small"
                    sx={{
                      bgcolor: 'rgba(0, 0, 0, 0.7)',
                      color: 'white',
                      '& .MuiChip-icon': { color: 'gold' },
                    }}
                  />
                )}
              </Box>
            </Box>
          </Grid>

          {/* Thumbnail Grid - 1/3 on desktop, hidden on mobile initially */}
          <Grid item xs={12} md={4} sx={{ display: { xs: 'none', md: 'block' } }}>
            <Grid container spacing={1}>
              {thumbnailPhotos.map((photo, index) => (
                <Grid item xs={6} key={index}>
                  <Box
                    onClick={() => handleOpenLightbox(index + 1)}
                    sx={{
                      position: 'relative',
                      height: index === thumbnailPhotos.length - 1 ? 295 : 145,
                      overflow: 'hidden',
                      borderRadius: 2,
                      cursor: 'pointer',
                      '&:hover': {
                        transform: 'scale(1.02)',
                        transition: 'transform 0.2s',
                      },
                    }}
                  >
                    <Image
                      src={photo.url}
                      alt={`Property photo ${index + 2}`}
                      fill
                      style={{ objectFit: 'cover' }}
                      sizes="(max-width: 768px) 50vw, 16vw"
                    />
                    {/* View All Photos button on last thumbnail */}
                    {index === thumbnailPhotos.length - 1 && sortedPhotos.length > 5 && (
                      <Box
                        sx={{
                          position: 'absolute',
                          inset: 0,
                          bgcolor: 'rgba(0, 0, 0, 0.5)',
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: 1,
                        }}
                      >
                        <PhotoLibraryIcon sx={{ fontSize: 40, color: 'white' }} />
                        <Typography variant="h6" color="white" fontWeight="bold">
                          View All
                        </Typography>
                        <Typography variant="body2" color="white">
                          {sortedPhotos.length} Photos
                        </Typography>
                      </Box>
                    )}
                  </Box>
                </Grid>
              ))}
            </Grid>
          </Grid>

          {/* Mobile thumbnail strip */}
          <Grid item xs={12} sx={{ display: { xs: 'block', md: 'none' } }}>
            <Box sx={{ display: 'flex', gap: 1, overflowX: 'auto', pb: 1 }}>
              {thumbnailPhotos.map((photo, index) => (
                <Box
                  key={index}
                  onClick={() => handleOpenLightbox(index + 1)}
                  sx={{
                    position: 'relative',
                    minWidth: 100,
                    height: 80,
                    borderRadius: 1,
                    overflow: 'hidden',
                    cursor: 'pointer',
                  }}
                >
                  <Image
                    src={photo.url}
                    alt={`Thumbnail ${index + 2}`}
                    fill
                    style={{ objectFit: 'cover' }}
                    sizes="100px"
                  />
                </Box>
              ))}
              {sortedPhotos.length > 4 && (
                <Box
                  onClick={() => handleOpenLightbox(4)}
                  sx={{
                    position: 'relative',
                    minWidth: 100,
                    height: 80,
                    borderRadius: 1,
                    overflow: 'hidden',
                    cursor: 'pointer',
                    bgcolor: 'grey.800',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Typography color="white" fontWeight="bold">
                    +{sortedPhotos.length - 4}
                  </Typography>
                </Box>
              )}
            </Box>
          </Grid>
        </Grid>
      </Box>

      {/* Lightbox Modal */}
      <Dialog
        open={lightboxOpen}
        onClose={() => setLightboxOpen(false)}
        maxWidth={false}
        fullScreen
        PaperProps={{
          sx: {
            bgcolor: 'black',
          },
        }}
      >
        <Box
          onKeyDown={handleKeyPress}
          tabIndex={0}
          sx={{
            position: 'relative',
            width: '100vw',
            height: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            outline: 'none',
          }}
        >
          {/* Close button */}
          <IconButton
            onClick={() => setLightboxOpen(false)}
            sx={{
              position: 'absolute',
              top: 16,
              right: 16,
              color: 'white',
              bgcolor: 'rgba(0, 0, 0, 0.5)',
              '&:hover': {
                bgcolor: 'rgba(0, 0, 0, 0.7)',
              },
              zIndex: 2,
            }}
          >
            <CloseIcon />
          </IconButton>

          {/* Photo counter and info */}
          <Box
            sx={{
              position: 'absolute',
              top: 16,
              left: '50%',
              transform: 'translateX(-50%)',
              color: 'white',
              bgcolor: 'rgba(0, 0, 0, 0.5)',
              px: 2,
              py: 1,
              borderRadius: 2,
              zIndex: 2,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 0.5,
            }}
          >
            <Typography variant="body2">
              {currentPhotoIndex + 1} / {sortedPhotos.length}
            </Typography>
            {sortedPhotos[currentPhotoIndex]?.roomType && (
              <Typography variant="caption" sx={{ opacity: 0.8 }}>
                {sortedPhotos[currentPhotoIndex].roomType}
              </Typography>
            )}
            {sortedPhotos[currentPhotoIndex]?.qualityLabel && (
              <Chip
                icon={<StarIcon />}
                label={sortedPhotos[currentPhotoIndex].qualityLabel}
                size="small"
                sx={{
                  height: 20,
                  fontSize: '0.7rem',
                  bgcolor: 'rgba(255, 255, 255, 0.2)',
                  color: 'white',
                  '& .MuiChip-icon': { color: 'gold', fontSize: 14 },
                }}
              />
            )}
          </Box>

          {/* Previous button */}
          {currentPhotoIndex > 0 && (
            <IconButton
              onClick={handlePrevPhoto}
              sx={{
                position: 'absolute',
                left: 16,
                color: 'white',
                bgcolor: 'rgba(0, 0, 0, 0.5)',
                '&:hover': {
                  bgcolor: 'rgba(0, 0, 0, 0.7)',
                },
                zIndex: 2,
              }}
            >
              <ChevronLeftIcon fontSize="large" />
            </IconButton>
          )}

          {/* Current photo */}
          <Box
            sx={{
              position: 'relative',
              width: '90%',
              height: '90%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Image
              src={sortedPhotos[currentPhotoIndex].url}
              alt={`Photo ${currentPhotoIndex + 1}`}
              fill
              style={{ objectFit: 'contain' }}
              sizes="90vw"
            />
          </Box>

          {/* Next button */}
          {currentPhotoIndex < sortedPhotos.length - 1 && (
            <IconButton
              onClick={handleNextPhoto}
              sx={{
                position: 'absolute',
                right: 16,
                color: 'white',
                bgcolor: 'rgba(0, 0, 0, 0.5)',
                '&:hover': {
                  bgcolor: 'rgba(0, 0, 0, 0.7)',
                },
                zIndex: 2,
              }}
            >
              <ChevronRightIcon fontSize="large" />
            </IconButton>
          )}
        </Box>
      </Dialog>
    </>
  )
}

export default PropertyPhotoGallery
