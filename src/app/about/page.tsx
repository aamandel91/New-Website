import React from 'react'
import type { Metadata } from 'next'
import { Box, Container, Grid2 as Grid, Paper, Stack, Typography, Avatar } from '@mui/material'
import PhoneIcon from '@mui/icons-material/Phone'
import BadgeIcon from '@mui/icons-material/Badge'

import { teamMembers } from '@/configs/defaults/team'
import { siteSettings } from '@/configs/defaults/site-settings'
import { tenant } from '@/configs/tenant.config'
import PageWithSidebar from '@/components/layouts/PageWithSidebar'
import InfoPageSidebar from '@/components/sidebar/InfoPageSidebar'
import StructuredData from '@shared/StructuredData'
import { breadcrumbSchema } from 'utils/structuredData'

export const metadata: Metadata = {
  title: `${tenant.brand.leaderName} | Top South Florida Real Estate Agent | ${tenant.brand.teamName}`,
  description: `${tenant.brand.leaderName} leads ${tenant.brand.teamName} at ${tenant.brand.brokerageLuxury} in Broward and Palm Beach County, FL. ${tenant.brand.leaderYearsExperience}+ years experience, 200+ transactions annually. Search South Florida homes with a top-ranked team.`,
  keywords: [
    'South Florida real estate agent',
    'Broward County realtor',
    'Palm Beach County homes',
    `${tenant.brand.teamName.replace(/^The /, '')} ${tenant.brand.brokerage}`,
    'Coral Springs real estate',
    'Boca Raton homes for sale',
  ],
  alternates: {
    canonical: `${tenant.brand.siteUrl}/about`,
  },
}

const NAVY = '#0F1621'
const GOLD = '#C4A96E'

/**
 * JSON-LD Person schema for Andy Mandel — helps Google build a Knowledge
 * Graph entry, enables rich result eligibility, and ties this page to the
 * organization schema on the homepage via worksFor.
 */
const andyMandelPersonSchema = {
  '@context': 'https://schema.org',
  '@type': 'Person',
  name: tenant.brand.leaderName,
  jobTitle: 'Team Leader',
  worksFor: {
    '@type': 'RealEstateAgent',
    name: `${tenant.brand.teamName} at ${tenant.brand.siteName}`,
    url: tenant.brand.siteUrl,
  },
  url: `${tenant.brand.siteUrl}/about`,
  telephone: tenant.contact.phoneE164,
  email: tenant.contact.email,
  address: {
    '@type': 'PostalAddress',
    addressLocality: tenant.contact.address.city,
    addressRegion: tenant.contact.address.state,
    addressCountry: 'US',
  },
  sameAs: [
    siteSettings.social.facebook,
    siteSettings.social.instagram,
    siteSettings.social.linkedin,
    siteSettings.social.youtube,
    siteSettings.social.zillow,
  ],
  knowsAbout: [
    'Real Estate',
    'South Florida Real Estate',
    'Broward County',
    'Palm Beach County',
    'Luxury Real Estate',
    'Home Buying',
    'Home Selling',
  ],
  hasCredential: [
    {
      '@type': 'EducationalOccupationalCredential',
      credentialCategory: 'Florida Real Estate License',
      recognizedBy: {
        '@type': 'Organization',
        name: 'Florida Department of Business and Professional Regulation',
      },
    },
  ],
}

const aboutBreadcrumbItems = [
  { name: 'Home', url: tenant.brand.siteUrl },
  { name: 'About', url: `${tenant.brand.siteUrl}/about` },
]

export default function AboutPage() {
  return (
    <Box>
      <StructuredData data={andyMandelPersonSchema} />
      <StructuredData data={breadcrumbSchema(aboutBreadcrumbItems)} />
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
            {tenant.brand.teamName} — We are South Floridians – born &amp; raised.
          </Typography>
        </Container>
      </Box>

      {/* Main Content with Sidebar */}
      <Container maxWidth="lg" sx={{ py: { xs: 6, md: 10 } }}>
        <PageWithSidebar sidebar={<InfoPageSidebar />}>
          {/* About */}
          <Box sx={{ textAlign: 'center', mb: 6 }}>
            <Typography variant="h4" fontWeight={700} sx={{ mb: 3 }}>
              About Our Team
            </Typography>
            <Typography color="text.secondary" sx={{ lineHeight: 1.8, maxWidth: 700, mx: 'auto' }}>
              {tenant.brand.teamName} has been helping families buy and sell homes across South Florida for
              years. We pride ourselves on our deep knowledge of the local market, our unwavering
              commitment to our clients, and our results-driven approach. Whether you&apos;re buying your
              first home or selling a luxury estate, we have the expertise and passion to guide you every
              step of the way.
            </Typography>
          </Box>

          {/* Team Grid */}
          <Box sx={{ bgcolor: '#f5f5f5', py: { xs: 4, md: 6 }, px: 3, borderRadius: 2 }}>
            <Typography variant="h4" fontWeight={700} textAlign="center" sx={{ mb: 5 }}>
              Meet The Team
            </Typography>
            <Grid container spacing={4} justifyContent="center">
              {teamMembers.map((member) => (
                <Grid key={member.name} size={{ xs: 12, sm: 6 }}>
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
          </Box>
        </PageWithSidebar>
      </Container>
    </Box>
  )
}
