'use client'

import React from 'react'
import {
  Box,
  Card,
  CardActionArea,
  CardContent,
  Grid,
  Paper,
  Typography,
  List,
  ListItem,
  ListItemIcon,
  ListItemText
} from '@mui/material'
import {
  Description as DescriptionIcon,
  Article as ArticleIcon,
  People as PeopleIcon,
  House as HouseIcon,
  Add as AddIcon,
  Edit as EditIcon,
  DynamicFeed as PageGenIcon
} from '@mui/icons-material'
import { useRouter } from 'next/navigation'
import { useOrganization } from '@/providers/OrganizationProvider'

const GOLD = '#C4A96E'

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
        <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2, p: 0, '&:last-child': { pb: 0 } }}>
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
  { text: 'Homepage content updated', time: '2 hours ago', icon: <EditIcon fontSize="small" /> },
  { text: 'New blog post published: "Market Trends 2026"', time: '5 hours ago', icon: <ArticleIcon fontSize="small" /> },
  { text: 'New lead received from contact form', time: '1 day ago', icon: <PeopleIcon fontSize="small" /> },
  { text: '3 neighborhood pages generated', time: '2 days ago', icon: <PageGenIcon fontSize="small" /> },
  { text: 'Open house listing added for 123 Main St', time: '3 days ago', icon: <HouseIcon fontSize="small" /> }
]

export default function AdminDashboard() {
  const { organization } = useOrganization()

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
          <StatCard title="Total Pages" value={24} icon={<DescriptionIcon />} color={GOLD} />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard title="Total Blog Posts" value={18} icon={<ArticleIcon />} color={GOLD} />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard title="Total Leads" value={156} icon={<PeopleIcon />} color={GOLD} />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard title="Active Open Houses" value={5} icon={<HouseIcon />} color={GOLD} />
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
            <ListItem
              key={index}
              divider={index < recentActivity.length - 1}
            >
              <ListItemIcon sx={{ minWidth: 40, color: 'text.secondary' }}>
                {item.icon}
              </ListItemIcon>
              <ListItemText
                primary={item.text}
                secondary={item.time}
              />
            </ListItem>
          ))}
        </List>
      </Paper>
    </Box>
  )
}
