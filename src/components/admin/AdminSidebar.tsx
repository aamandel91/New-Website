'use client'

import React from 'react'
import { usePathname, useRouter } from 'next/navigation'
import {
  Box,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Typography,
  Divider
} from '@mui/material'
import {
  Dashboard as DashboardIcon,
  People as PeopleIcon,
  Article as ArticleIcon,
  Settings as SettingsIcon,
  Business as BusinessIcon,
  Contacts as ContactsIcon,
  BarChart as BarChartIcon
} from '@mui/icons-material'

const drawerWidth = 260

interface NavItem {
  title: string
  path: string
  icon: React.ReactNode
  divider?: boolean
}

const navItems: NavItem[] = [
  {
    title: 'Analytics',
    path: '/admin/analytics',
    icon: <BarChartIcon />
  },
  {
    title: 'Leads',
    path: '/admin/leads',
    icon: <ContactsIcon />,
    divider: true
  },
  {
    title: 'Agents',
    path: '/admin/agents',
    icon: <PeopleIcon />
  },
  {
    title: 'Organization',
    path: '/admin/organization',
    icon: <BusinessIcon />,
    divider: true
  },
  {
    title: 'Blog',
    path: '/admin/blog',
    icon: <ArticleIcon />
  },
  {
    title: 'Settings',
    path: '/admin/settings',
    icon: <SettingsIcon />
  }
]

export default function AdminSidebar() {
  const pathname = usePathname()
  const router = useRouter()

  const handleNavigation = (path: string) => {
    router.push(path)
  }

  return (
    <Drawer
      variant="permanent"
      sx={{
        width: drawerWidth,
        flexShrink: 0,
        '& .MuiDrawer-paper': {
          width: drawerWidth,
          boxSizing: 'border-box',
          borderRight: '1px solid',
          borderColor: 'divider'
        }
      }}
    >
      <Box sx={{ p: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
        <DashboardIcon color="primary" />
        <Typography variant="h6" component="div">
          Admin Panel
        </Typography>
      </Box>
      <Divider />
      <List>
        {navItems.map((item) => (
          <React.Fragment key={item.path}>
            <ListItem disablePadding>
              <ListItemButton
                selected={pathname === item.path || pathname?.startsWith(item.path + '/')}
                onClick={() => handleNavigation(item.path)}
                sx={{
                  '&.Mui-selected': {
                    bgcolor: 'action.selected',
                    '&:hover': {
                      bgcolor: 'action.selected'
                    }
                  }
                }}
              >
                <ListItemIcon
                  sx={{
                    color:
                      pathname === item.path || pathname?.startsWith(item.path + '/')
                        ? 'primary.main'
                        : 'text.secondary'
                  }}
                >
                  {item.icon}
                </ListItemIcon>
                <ListItemText primary={item.title} />
              </ListItemButton>
            </ListItem>
            {item.divider && <Divider sx={{ my: 1 }} />}
          </React.Fragment>
        ))}
      </List>
    </Drawer>
  )
}
