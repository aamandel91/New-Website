import { Box, Container, Grid, Skeleton, Stack } from '@mui/material'

export default function ListingLoading() {
  return (
    <Container maxWidth="lg" sx={{ py: 3 }}>
      {/* Gallery placeholder */}
      <Skeleton
        variant="rectangular"
        height={400}
        sx={{ borderRadius: 2, mb: 3 }}
      />

      {/* Header info */}
      <Stack spacing={1} sx={{ mb: 3 }}>
        <Skeleton variant="text" width="60%" height={40} />
        <Skeleton variant="text" width="40%" height={28} />
        <Skeleton variant="text" width="30%" height={28} />
      </Stack>

      {/* Main content + sidebar */}
      <Stack direction={{ xs: 'column', md: 'row' }} spacing={4}>
        <Box sx={{ flex: 1 }}>
          {/* Description */}
          <Skeleton
            variant="rectangular"
            height={200}
            sx={{ borderRadius: 1, mb: 3 }}
          />
          {/* Map */}
          <Skeleton
            variant="rectangular"
            height={300}
            sx={{ borderRadius: 1, mb: 3 }}
          />
          {/* Details */}
          <Grid container spacing={2}>
            {Array.from({ length: 6 }).map((_, i) => (
              <Grid item xs={6} sm={4} key={i}>
                <Skeleton
                  variant="rectangular"
                  height={80}
                  sx={{ borderRadius: 1 }}
                />
              </Grid>
            ))}
          </Grid>
        </Box>

        {/* Sidebar */}
        <Box sx={{ width: { xs: '100%', md: 300 }, flexShrink: 0 }}>
          <Skeleton
            variant="rectangular"
            height={400}
            sx={{ borderRadius: 1 }}
          />
        </Box>
      </Stack>
    </Container>
  )
}
