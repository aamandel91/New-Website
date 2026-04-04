import React from 'react'
import type { Metadata } from 'next'
import { Box, Container, Grid2 as Grid, Paper, Stack, Typography, Avatar } from '@mui/material'
import PhoneIcon from '@mui/icons-material/Phone'
import BadgeIcon from '@mui/icons-material/Badge'
import { teamMembers } from '@/configs/defaults/team'

export const metadata: Metadata = {
  title: 'About The Mandel Team',
  description:
    'Meet The Mandel Team — South Florida real estate experts. Born and raised in South Florida, we bring local expertise and dedication to every client.',
}

const NAVY = '#0F1621'
const GOLD = '#C4A96E'

export default function AboutPage() {
  return (
    <Box>
      {/* Hero */}
      <Box sx={{ bgcolor: NAVY, py: { xs: 8, md: 12 }, px: 3, textAlign: 'center' }}>
        <Container maxWidth="md">
          <Typography
            variant="h3"
            component="h1"
            sx={{ color: GOLD, fontWeight: 700, mb: 2, fontSize: { xs: '1.5rem', md: '2.5rem' } }}
          >
            #TheAgentYouWorkWithMatters
          </Typography>
          <Typography sx={{ color: 'rgba(255,255,255,0.8)', fontSize: '1.1rem', maxWidth: 600, mx: 'auto' }}>
            The Mandel Team — We are South Floridians – born &amp; raised.
          </Typography>
        </Container>
      </Box>

      {/* About */}
      <Container maxWidth="md" sx={{ py: { xs: 6, md: 10 }, textAlign: 'center' }}>
        <Typography variant="h4" fontWeight={700} sx={{ mb: 3 }}>
          About Our Team
        </Typography>
        <Typography color="text.secondary" sx={{ lineHeight: 1.8, maxWidth: 700, mx: 'auto' }}>
          The Mandel Team has been helping families buy and sell homes across South Florida for
          years. We pride ourselves on our deep knowledge of the local market, our unwavering
          commitment to our clients, and our results-driven approach. Whether you&apos;re buying your
          first home or selling a luxury estate, we have the expertise and passion to guide you every
          step of the way.
        </Typography>
      </Container>

      {/* Team Grid */}
      <Box sx={{ bgcolor: '#f5f5f5', py: { xs: 6, md: 10 } }}>
        <Container maxWidth="lg">
          <Typography variant="h4" fontWeight={700} textAlign="center" sx={{ mb: 5 }}>
            Meet The Team
          </Typography>
          <Grid container spacing={4} justifyContent="center">
            {teamMembers.map((member) => (
              <Grid key={member.name} size={{ xs: 12, sm: 6, md: 4 }}>
                <Paper elevation={2} sx={{ p: 4, textAlign: 'center', height: '100%' }}>
                  <Avatar
                    src={member.photo}
                    alt={member.name}
                    sx={{
                      width: 100,
                      height: 100,
                      mx: 'auto',
                      mb: 2,
                      bgcolor: NAVY,
                      fontSize: '2rem',
                    }}
                  >
                    {member.name
                      .split(' ')
                      .map((n) => n[0])
                      .join('')}
                  </Avatar>
                  <Typography variant="h6" fontWeight={700}>
                    {member.name}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    {member.role}
                  </Typography>
                  <Stack spacing={1} alignItems="center">
                    <Stack direction="row" spacing={0.5} alignItems="center">
                      <PhoneIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                      <Typography variant="body2">
                        <a
                          href={`tel:${member.phone.replace(/\D/g, '')}`}
                          style={{ textDecoration: 'none', color: 'inherit' }}
                        >
                          {member.phone}
                        </a>
                      </Typography>
                    </Stack>
                    <Stack direction="row" spacing={0.5} alignItems="center">
                      <BadgeIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                      <Typography variant="body2" color="text.secondary">
                        License #{member.license}
                      </Typography>
                    </Stack>
                  </Stack>
                </Paper>
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>
    </Box>
  )
}
