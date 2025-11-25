'use client'

import React from 'react'
import { Box, Container, Grid, Paper, Skeleton, Stack, Divider } from '@mui/material'

const PropertyDetailSkeleton: React.FC = () => {
  return (
    <Box>
      {/* Photo Gallery Skeleton */}
      <Box sx={{ width: '100%', height: { xs: 400, md: 600 }, bgcolor: 'grey.200' }}>
        <Skeleton variant="rectangular" width="100%" height="100%" animation="wave" />
      </Box>

      <Container maxWidth="xl" sx={{ py: 4 }}>
        {/* Header Skeleton */}
        <Stack spacing={3} sx={{ py: 4 }}>
          {/* Badges */}
          <Stack direction="row" spacing={1}>
            <Skeleton variant="rounded" width={80} height={32} />
            <Skeleton variant="rounded" width={100} height={32} />
          </Stack>

          {/* Price */}
          <Skeleton variant="text" width={200} height={60} />

          {/* Address */}
          <Skeleton variant="text" width={400} height={40} />

          <Divider />

          {/* Stats Row */}
          <Grid container spacing={4}>
            {[1, 2, 3, 4].map((i) => (
              <Grid item xs={6} sm={3} key={i}>
                <Stack direction="row" spacing={1}>
                  <Skeleton variant="circular" width={40} height={40} />
                  <Box>
                    <Skeleton variant="text" width={60} height={32} />
                    <Skeleton variant="text" width={40} height={24} />
                  </Box>
                </Stack>
              </Grid>
            ))}
          </Grid>

          <Divider />

          {/* Action Buttons */}
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
            <Skeleton variant="rounded" width="100%" height={48} />
            <Skeleton variant="rounded" width="100%" height={48} />
          </Stack>
        </Stack>

        {/* Two-Column Layout */}
        <Grid container spacing={4} sx={{ mt: 2 }}>
          {/* Left Column */}
          <Grid item xs={12} lg={8}>
            <Stack spacing={3}>
              {/* Description */}
              <Paper elevation={2} sx={{ p: 3 }}>
                <Skeleton variant="text" width={150} height={32} sx={{ mb: 2 }} />
                <Skeleton variant="text" width="100%" />
                <Skeleton variant="text" width="100%" />
                <Skeleton variant="text" width="90%" />
                <Skeleton variant="text" width="85%" />
              </Paper>

              {/* Key Facts */}
              <Paper elevation={2} sx={{ p: 3 }}>
                <Skeleton variant="text" width={120} height={32} sx={{ mb: 2 }} />
                <Grid container spacing={2}>
                  {[1, 2, 3, 4, 5, 6].map((i) => (
                    <Grid item xs={12} sm={6} key={i}>
                      <Stack direction="row" spacing={2}>
                        <Skeleton variant="circular" width={24} height={24} />
                        <Box sx={{ flex: 1 }}>
                          <Skeleton variant="text" width="60%" />
                          <Skeleton variant="text" width="40%" />
                        </Box>
                      </Stack>
                    </Grid>
                  ))}
                </Grid>
              </Paper>

              {/* Features */}
              <Paper elevation={2} sx={{ p: 3 }}>
                <Skeleton variant="text" width={100} height={32} sx={{ mb: 2 }} />
                <Grid container spacing={2}>
                  {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                    <Grid item xs={12} sm={6} key={i}>
                      <Stack direction="row" spacing={1}>
                        <Skeleton variant="circular" width={20} height={20} />
                        <Skeleton variant="text" width="80%" />
                      </Stack>
                    </Grid>
                  ))}
                </Grid>
              </Paper>

              {/* History */}
              <Paper elevation={2} sx={{ p: 3 }}>
                <Skeleton variant="text" width={180} height={32} sx={{ mb: 2 }} />
                <Stack spacing={2}>
                  {[1, 2, 3].map((i) => (
                    <Stack direction="row" spacing={2} key={i}>
                      <Skeleton variant="circular" width={40} height={40} />
                      <Box sx={{ flex: 1 }}>
                        <Skeleton variant="text" width="40%" />
                        <Skeleton variant="text" width="30%" />
                      </Box>
                    </Stack>
                  ))}
                </Stack>
              </Paper>

              {/* Location/Map */}
              <Paper elevation={2} sx={{ p: 3 }}>
                <Skeleton variant="text" width={100} height={32} sx={{ mb: 2 }} />
                <Skeleton variant="rectangular" width="100%" height={400} />
              </Paper>

              {/* Similar Properties */}
              <Paper elevation={2} sx={{ p: 3 }}>
                <Skeleton variant="text" width={180} height={32} sx={{ mb: 2 }} />
                <Stack direction="row" spacing={2}>
                  {[1, 2, 3].map((i) => (
                    <Box key={i} sx={{ width: 320, flex: '0 0 auto' }}>
                      <Skeleton variant="rectangular" width="100%" height={200} />
                      <Box sx={{ p: 2 }}>
                        <Skeleton variant="text" width="60%" />
                        <Skeleton variant="text" width="80%" />
                      </Box>
                    </Box>
                  ))}
                </Stack>
              </Paper>
            </Stack>
          </Grid>

          {/* Right Column - Contact Form */}
          <Grid item xs={12} lg={4}>
            <Paper elevation={3} sx={{ p: 3, position: 'sticky', top: 96 }}>
              <Skeleton variant="text" width={150} height={32} sx={{ mb: 2 }} />

              {/* Agent Info */}
              <Stack direction="row" spacing={2} sx={{ mb: 3 }}>
                <Skeleton variant="circular" width={60} height={60} />
                <Box sx={{ flex: 1 }}>
                  <Skeleton variant="text" width="80%" />
                  <Skeleton variant="text" width="60%" />
                </Box>
              </Stack>

              {/* Form Fields */}
              <Stack spacing={2}>
                <Skeleton variant="rounded" width="100%" height={56} />
                <Skeleton variant="rounded" width="100%" height={56} />
                <Skeleton variant="rounded" width="100%" height={56} />
                <Skeleton variant="rounded" width="100%" height={120} />
                <Skeleton variant="rounded" width="100%" height={48} />
              </Stack>
            </Paper>
          </Grid>
        </Grid>
      </Container>
    </Box>
  )
}

export default PropertyDetailSkeleton
