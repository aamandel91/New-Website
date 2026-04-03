import { Box, Container, Grid, Skeleton, Stack } from '@mui/material'

export default function SlugsLoading() {
  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Breadcrumbs */}
      <Skeleton variant="text" width="30%" height={24} sx={{ mb: 3 }} />

      {/* Page heading */}
      <Skeleton variant="text" width="50%" height={48} sx={{ mb: 1 }} />
      <Skeleton variant="text" width="70%" height={24} sx={{ mb: 4 }} />

      {/* Listings grid */}
      <Grid container spacing={2} sx={{ mb: 4 }}>
        {Array.from({ length: 6 }).map((_, i) => (
          <Grid item xs={12} sm={6} md={4} key={i}>
            <Skeleton variant="rectangular" height={280} sx={{ borderRadius: 1 }} />
          </Grid>
        ))}
      </Grid>

      {/* Market graph placeholder */}
      <Stack spacing={2}>
        <Skeleton variant="text" width="40%" height={32} />
        <Skeleton variant="rectangular" height={300} sx={{ borderRadius: 1 }} />
      </Stack>
    </Container>
  )
}
