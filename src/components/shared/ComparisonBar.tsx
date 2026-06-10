'use client'

import React from 'react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'

import CloseIcon from '@mui/icons-material/Close'
import CompareArrowsIcon from '@mui/icons-material/CompareArrows'
import {
  Box,
  Button,
  Chip,
  IconButton,
  Paper,
  Slide,
  Stack,
  Typography,
  useTheme
} from '@mui/material'

import { usePropertyComparison } from '@/hooks/usePropertyComparison'

import { generatePropertyUrl } from 'utils/propertyUrls'

const ComparisonBar: React.FC = () => {
  const theme = useTheme()
  const router = useRouter()
  const { properties, removeProperty, clearAll } = usePropertyComparison()

  if (properties.length === 0) {
    return null
  }

  const handleCompare = () => {
    // Navigate to comparison page with MLS numbers as query params
    const mlsNumbers = properties.map((p) => p.mlsNumber).join(',')
    router.push(`/compare?properties=${mlsNumbers}`)
  }

  const formatPrice = (price: number | undefined) => {
    if (!price) return 'N/A'
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(price)
  }

  return (
    <Slide direction="up" in={properties.length > 0} mountOnEnter unmountOnExit>
      <Paper
        elevation={8}
        sx={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          zIndex: 1200,
          borderRadius: 0,
          borderTop: `3px solid ${theme.palette.primary.main}`
        }}
      >
        <Box sx={{ px: 3, py: 2 }}>
          <Stack
            direction="row"
            alignItems="center"
            justifyContent="space-between"
          >
            <Stack direction="row" alignItems="center" spacing={2}>
              <CompareArrowsIcon color="primary" fontSize="large" />
              <Box>
                <Typography variant="h6">Compare Properties</Typography>
                <Typography variant="caption" color="text.secondary">
                  {properties.length} of 4 selected
                </Typography>
              </Box>
            </Stack>

            {/* Property Cards */}
            <Stack
              direction="row"
              spacing={2}
              sx={{ flex: 1, mx: 3, overflowX: 'auto' }}
            >
              {properties.map((property: any) => (
                <Paper
                  key={property.mlsNumber}
                  elevation={2}
                  sx={{
                    position: 'relative',
                    width: 200,
                    flex: '0 0 auto',
                    overflow: 'hidden'
                  }}
                >
                  <IconButton
                    size="small"
                    onClick={() => removeProperty(property.mlsNumber)}
                    sx={{
                      position: 'absolute',
                      top: 4,
                      right: 4,
                      bgcolor: 'rgba(255,255,255,0.9)',
                      '&:hover': {
                        bgcolor: 'rgba(255,255,255,1)'
                      },
                      zIndex: 1
                    }}
                  >
                    <CloseIcon fontSize="small" />
                  </IconButton>

                  {/* Property Image */}
                  <Box
                    sx={{
                      position: 'relative',
                      height: 100,
                      bgcolor: 'grey.200'
                    }}
                  >
                    {property.images?.[0] ? (
                      <Image
                        src={
                          typeof property.images[0] === 'string'
                            ? property.images[0]
                            : ''
                        }
                        alt={`Property ${property.mlsNumber}`}
                        fill
                        style={{ objectFit: 'cover' }}
                      />
                    ) : (
                      <Box
                        sx={{
                          height: '100%',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}
                      >
                        <Typography variant="caption" color="text.secondary">
                          No Image
                        </Typography>
                      </Box>
                    )}
                  </Box>

                  {/* Property Info */}
                  <Box sx={{ p: 1.5 }}>
                    <Typography
                      variant="h6"
                      fontSize="1rem"
                      fontWeight="bold"
                      gutterBottom
                    >
                      {formatPrice(property.price)}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" noWrap>
                      {property.address?.street || 'Address N/A'}
                    </Typography>
                    <Stack direction="row" spacing={1} sx={{ mt: 0.5 }}>
                      <Chip label={`${property.beds || 0} beds`} size="small" />
                      <Chip
                        label={`${property.baths || 0} baths`}
                        size="small"
                      />
                    </Stack>
                  </Box>
                </Paper>
              ))}

              {/* Empty slots */}
              {Array.from({ length: 4 - properties.length }).map((_, index) => (
                <Paper
                  key={`empty-${index}`}
                  elevation={0}
                  sx={{
                    width: 200,
                    height: 220,
                    flex: '0 0 auto',
                    border: '2px dashed',
                    borderColor: 'divider',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  <Typography variant="caption" color="text.secondary">
                    Add property
                  </Typography>
                </Paper>
              ))}
            </Stack>

            {/* Actions */}
            <Stack direction="row" spacing={1}>
              <Button variant="outlined" onClick={clearAll} size="small">
                Clear All
              </Button>
              <Button
                variant="contained"
                onClick={handleCompare}
                disabled={properties.length < 2}
                size="large"
                startIcon={<CompareArrowsIcon />}
              >
                Compare
              </Button>
            </Stack>
          </Stack>
        </Box>
      </Paper>
    </Slide>
  )
}

export default ComparisonBar
