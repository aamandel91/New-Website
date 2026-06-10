'use client'

import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

import AddIcon from '@mui/icons-material/Add'
import ArticleIcon from '@mui/icons-material/Article'
import DescriptionIcon from '@mui/icons-material/Description'
import PageGenIcon from '@mui/icons-material/DynamicFeed'
import EditIcon from '@mui/icons-material/Edit'
import HouseIcon from '@mui/icons-material/House'
import PeopleIcon from '@mui/icons-material/People'
import {
  Box,
  Card,
  CardActionArea,
  CardContent,
  Grid,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Paper,
  Typography
} from '@mui/material'

import { useOrganization } from '@/providers/OrganizationProvider'

import { getTokenSync } from 'utils/tokens'

const GOLD = '#C4A96E'

interface StatCardProps {
  title: string
  value: React.ReactNode
  icon: React.ReactNode
  color: string
}

function StatCard({ title, value, icon, color }: StatCardProps) {
  return (
    <Paper sx={{ p: 3 }}>
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start'
        }}
      >
        <Box>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            {title}
          </Typography>
          <Typography variant="h4" component="div" fontWeight={700}>
            {value}
          </Typography>
        </Box>
        <Box
          sx={{
            bgcolor: `${color}20`,
            borderRadius: 2,
            p: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color
          }}
        >
          {icon}
        </Box>
      </Box>
    </Paper>
  )
}

interface QuickActionProps {
  title: string
  description: string
  icon: React.ReactNode
  href: string
}

function QuickAction({ title, description, icon, href }: QuickActionProps) {
  const router = useRouter()
  return (
    <Card variant="outlined">
      <CardActionArea onClick={() => router.push(href)} sx={{ p: 2 }}>
        <CardContent
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 2,
            p: 0,
            '&:last-child': { pb: 0 }
          }}
        >
          <Box
            sx={{
              bgcolor: `${GOLD}15`,
              borderRadius: 2,
              p: 1.5,
              display: 'flex',
              color: GOLD
            }}
          >
            {icon}
          </Box>
          <Box>
            <Typography variant="subtitle1" fontWeight={600}>
              {title}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {description}
            </Typography>
          </Box>
        </CardContent>
      </CardActionArea>
    </Card>
  )
}

const recentActivity = [
  {
    text: 'Homepage content updated',
    time: '2 hours ago',
    icon: <EditIcon fontSize="small" />
  },
  {
    text: 'New blog post published: "Market Trends 2026"',
    time: '5 hours ago',
    icon: <ArticleIcon fontSize="small" />
  },
  {
    text: 'New lead received from contact form',
    time: '1 day ago',
    icon: <PeopleIcon fontSize="small" />
  },
  {
    text: '3 neighborhood pages generated',
    time: '2 days ago',
    icon: <PageGenIcon fontSize="small" />
  },
  {
    text: 'Open house listing added for 123 Main St',
    time: '3 days ago',
    icon: <HouseIcon fontSize="small" />
  }
]

const API_URL = `${process.env.NEXT_PUBLIC_API_URL}/api`

async function fetchWithAuth(path: string) {
  const token = getTokenSync()
  const headers: Record<string, string> = { 'Content-Type': 'application/json' }
  if (token) headers['Authorization'] = `Bearer ${token}`
  const res = await fetch(`${API_URL}${path}`, { headers })
  if (!res.ok) throw new Error(`${res.status}`)
  return res.json()
}

interface DashboardStats {
  pages: number | null
  blogs: number | null
  leads: number | null
  users: number | null
}

export default function AdminDashboard() {
  const { organization } = useOrganization()
  const [stats, setStats] = useState<DashboardStats>({
    pages: null,
    blogs: null,
    leads: null,
    users: null
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadStats() {
      const results: DashboardStats = {
        pages: null,
        blogs: null,
        leads: null,
        users: null
      }

      const [pagesRes, blogsRes, leadsRes, usersRes] = await Promise.allSettled(
        [
          fetchWithAuth('/content-pages'),
          fetchWithAuth('/blogs/admin/all'),
          fetchWithAuth('/leads'),
          fetchWithAuth('/admin/users')
        ]
      )

      if (pagesRes.status === 'fulfilled') {
        const data = pagesRes.value
        results.pages = Array.isArray(data)
          ? data.length
          : (data?.pages?.length ?? data?.total ?? 0)
      }
      if (blogsRes.status === 'fulfilled') {
        const data = blogsRes.value
        results.blogs = Array.isArray(data)
          ? data.length
          : (data?.blogs?.length ?? data?.total ?? 0)
      }
      if (leadsRes.status === 'fulfilled') {
        const data = leadsRes.value
        results.leads = Array.isArray(data)
          ? data.length
          : (data?.leads?.length ?? data?.total ?? 0)
      }
      if (usersRes.status === 'fulfilled') {
        const data = usersRes.value
        results.users = Array.isArray(data) ? data.length : 0
      }

      setStats(results)
      setLoading(false)
    }

    loadStats()
  }, [])

  const formatStat = (value: number | null): string | React.ReactNode => {
    if (loading) return '...'
    if (value === null) return '\u2013'
    return value.toString()
  }

  return (
    <Box>
      <Typography variant="h4" fontWeight={700} gutterBottom>
        Welcome{organization?.name ? ` to ${organization.name}` : ''}
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
        Manage your website content, leads, and settings from one place.
      </Typography>

      {/* Stats Row */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Total Pages"
            value={formatStat(stats.pages)}
            icon={<DescriptionIcon />}
            color={GOLD}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Total Blog Posts"
            value={formatStat(stats.blogs)}
            icon={<ArticleIcon />}
            color={GOLD}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Total Leads"
            value={formatStat(stats.leads)}
            icon={<PeopleIcon />}
            color={GOLD}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Admin Users"
            value={formatStat(stats.users)}
            icon={<HouseIcon />}
            color={GOLD}
          />
        </Grid>
      </Grid>

      {/* Quick Actions */}
      <Typography variant="h6" fontWeight={600} sx={{ mb: 2 }}>
        Quick Actions
      </Typography>
      <Grid container spacing={2} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <QuickAction
            title="Create New Page"
            description="Add a new content page"
            icon={<AddIcon />}
            href="/admin/content-pages"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <QuickAction
            title="Write Blog Post"
            description="Create a new blog article"
            icon={<ArticleIcon />}
            href="/admin/blog/new"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <QuickAction
            title="Generate Pages"
            description="Bulk create location pages"
            icon={<PageGenIcon />}
            href="/admin/page-generator"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <QuickAction
            title="View Leads"
            description="See recent lead activity"
            icon={<PeopleIcon />}
            href="/admin/leads"
          />
        </Grid>
      </Grid>

      {/* Recent Activity */}
      <Typography variant="h6" fontWeight={600} sx={{ mb: 2 }}>
        Recent Activity
      </Typography>
      <Paper variant="outlined">
        <List>
          {recentActivity.map((item, index) => (
            <ListItem key={index} divider={index < recentActivity.length - 1}>
              <ListItemIcon sx={{ minWidth: 40, color: 'text.secondary' }}>
                {item.icon}
              </ListItemIcon>
              <ListItemText primary={item.text} secondary={item.time} />
            </ListItem>
          ))}
        </List>
      </Paper>
    </Box>
  )
}
