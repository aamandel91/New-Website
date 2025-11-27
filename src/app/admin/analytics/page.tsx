'use client'

import React, { useEffect, useState } from 'react'
import {
  Box,
  Container,
  Grid,
  Paper,
  Typography,
  CircularProgress,
  Alert
} from '@mui/material'
import {
  TrendingUp,
  People,
  ContactMail,
  ShowChart
} from '@mui/icons-material'
import APILeads from '@/services/API/APILeads'
import { useOrganization } from '@/providers/OrganizationProvider'

interface StatCardProps {
  title: string
  value: string | number
  icon: React.ReactNode
  color: string
}

function StatCard({ title, value, icon, color }: StatCardProps) {
  return (
    <Paper sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <Box>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            {title}
          </Typography>
          <Typography variant="h4" component="div">
            {value}
          </Typography>
        </Box>
        <Box
          sx={{
            bgcolor: color,
            borderRadius: 2,
            p: 1.5,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          {icon}
        </Box>
      </Box>
    </Paper>
  )
}

export default function AnalyticsPage() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [stats, setStats] = useState<any>(null)
  const { organization } = useOrganization()

  useEffect(() => {
    fetchStats()
  }, [])

  const fetchStats = async () => {
    try {
      setLoading(true)
      setError(null)

      const leadStats = await APILeads.getStats()
      setStats(leadStats)
    } catch (err: any) {
      setError(err?.message || 'Failed to load statistics')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <Container maxWidth="xl">
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
          <CircularProgress />
        </Box>
      </Container>
    )
  }

  return (
    <Container maxWidth="xl">
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Analytics Dashboard
        </Typography>
        <Typography variant="body1" color="text.secondary">
          {organization?.name} - {organization?.plan.toUpperCase()} Plan
        </Typography>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Key Metrics */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Total Leads"
            value={stats?.total || 0}
            icon={<ContactMail sx={{ color: 'white' }} />}
            color="primary.main"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="New Leads"
            value={stats?.byStatus?.new || 0}
            icon={<People sx={{ color: 'white' }} />}
            color="info.main"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Qualified"
            value={stats?.byStatus?.qualified || 0}
            icon={<TrendingUp sx={{ color: 'white' }} />}
            color="success.main"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Closed"
            value={stats?.byStatus?.closed || 0}
            icon={<ShowChart sx={{ color: 'white' }} />}
            color="warning.main"
          />
        </Grid>
      </Grid>

      {/* Lead by Status */}
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Leads by Status
            </Typography>
            <Box sx={{ mt: 2 }}>
              {stats?.byStatus &&
                Object.entries(stats.byStatus).map(([status, count]: [string, any]) => (
                  <Box
                    key={status}
                    sx={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      py: 1,
                      borderBottom: '1px solid',
                      borderColor: 'divider'
                    }}
                  >
                    <Typography>{status.replace('_', ' ').toUpperCase()}</Typography>
                    <Typography fontWeight="bold">{count}</Typography>
                  </Box>
                ))}
            </Box>
          </Paper>
        </Grid>

        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Leads by Source
            </Typography>
            <Box sx={{ mt: 2 }}>
              {stats?.bySource &&
                Object.entries(stats.bySource).map(([source, count]: [string, any]) => (
                  <Box
                    key={source}
                    sx={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      py: 1,
                      borderBottom: '1px solid',
                      borderColor: 'divider'
                    }}
                  >
                    <Typography>{source.toUpperCase()}</Typography>
                    <Typography fontWeight="bold">{count}</Typography>
                  </Box>
                ))}
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Container>
  )
}
