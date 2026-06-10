import { Box, Container, Skeleton, Stack } from '@mui/material'

export default function HomeValueLoading() {
  return (
    <Box
      sx={{
        minHeight: '100vh',
        bgcolor: '#0a1628',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        py: 4
      }}
    >
      <Container maxWidth="sm">
        {/* Heading */}
        <Stack spacing={1} alignItems="center" sx={{ mb: 4 }}>
          <Skeleton
            variant="text"
            width="80%"
            height={48}
            sx={{ bgcolor: 'rgba(255,255,255,0.1)' }}
          />
          <Skeleton
            variant="text"
            width="60%"
            height={28}
            sx={{ bgcolor: 'rgba(255,255,255,0.1)' }}
          />
        </Stack>

        {/* Stepper */}
        <Stack
          direction="row"
          spacing={2}
          justifyContent="center"
          sx={{ mb: 4 }}
        >
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton
              key={i}
              variant="circular"
              width={32}
              height={32}
              sx={{ bgcolor: 'rgba(255,255,255,0.1)' }}
            />
          ))}
        </Stack>

        {/* Form fields */}
        <Stack spacing={2}>
          <Skeleton
            variant="rectangular"
            height={56}
            sx={{ borderRadius: 1, bgcolor: 'rgba(255,255,255,0.1)' }}
          />
          <Stack direction="row" spacing={2}>
            <Skeleton
              variant="rectangular"
              height={56}
              sx={{
                flex: 1,
                borderRadius: 1,
                bgcolor: 'rgba(255,255,255,0.1)'
              }}
            />
            <Skeleton
              variant="rectangular"
              height={56}
              sx={{
                flex: 1,
                borderRadius: 1,
                bgcolor: 'rgba(255,255,255,0.1)'
              }}
            />
          </Stack>
          <Skeleton
            variant="rectangular"
            height={56}
            sx={{ borderRadius: 1, bgcolor: 'rgba(255,255,255,0.1)' }}
          />
        </Stack>
      </Container>
    </Box>
  )
}
