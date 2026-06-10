import { Box, Grid, Skeleton, Stack } from '@mui/material'

export default function SearchLoading() {
  return (
    <Box sx={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Filters bar */}
      <Stack direction="row" spacing={1} sx={{ p: 2 }}>
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton
            key={i}
            variant="rectangular"
            width={100}
            height={36}
            sx={{ borderRadius: 1 }}
          />
        ))}
      </Stack>

      {/* Map + grid layout */}
      <Stack direction="row" sx={{ flex: 1 }}>
        {/* Map area */}
        <Skeleton variant="rectangular" sx={{ flex: 1, borderRadius: 0 }} />

        {/* Property cards */}
        <Box sx={{ width: 400, p: 2, display: { xs: 'none', md: 'block' } }}>
          <Grid container spacing={2}>
            {Array.from({ length: 6 }).map((_, i) => (
              <Grid item xs={12} key={i}>
                <Skeleton
                  variant="rectangular"
                  height={120}
                  sx={{ borderRadius: 1 }}
                />
              </Grid>
            ))}
          </Grid>
        </Box>
      </Stack>
    </Box>
  )
}
