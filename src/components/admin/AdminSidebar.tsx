'use client'

import React, { useState } from 'react'
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
  Collapse,
  IconButton,
  useMediaQuery,
  useTheme
} from '@mui/material'
import {
  Dashboard as DashboardIcon,
  Description as DescriptionIcon,
  AutoAwesome as AutoAwesomeIcon,
  Article as ArticleIcon,
  ImportExport as ImportExportIcon,
  People as PeopleIcon,
  House as HouseIcon,
  Menu as MenuIcon,
  Settings as SettingsIcon,
  BarChart as BarChartIcon,
  Search as SearchIcon,
  Security as SecurityIcon,
  DynamicFeed as PageGenIcon,
  Navigation as NavigationIcon,
  AdminPanelSettings as AdminUsersIcon,
  ContactPhone as CrmIcon,
  Inventory as InventoryIcon,
  ExpandLess,
  ExpandMore
} from '@mui/icons-material'

const DRAWER_WIDTH = 260
const BG_COLOR = '#0F1621'
const ACTIVE_COLOR = '#C4A96E'
const ACTIVE_BG = 'rgba(196, 169, 110, 0.08)'

interface NavItem {
  title: string
  path: string
  icon: React.ReactNode
  children?: NavItem[]
}

const navItems: NavItem[] = [
  { title: 'Dashboard', path: '/admin', icon: <DashboardIcon /> },
  { title: 'Pages', path: '/admin/content-pages', icon: <DescriptionIcon /> },
  { title: 'Page Generator', path: '/admin/page-generator', icon: <PageGenIcon /> },
  { title: 'Blog', path: '/admin/blog', icon: <ArticleIcon /> },
  { title: 'Blog Import', path: '/admin/blog/import', icon: <ImportExportIcon /> },
  { title: 'Leads', path: '/admin/leads', icon: <PeopleIcon /> },
  { title: 'Open House', path: '/admin/open-house', icon: <HouseIcon /> },
  { title: 'CRM', path: '/admin/crm', icon: <CrmIcon /> },
  { title: 'Navigation', path: '/admin/navigation', icon: <NavigationIcon /> },
  {
    title: 'SEO Tools',
    path: '/admin/seo',
    icon: <SearchIcon />,
    children: [
      { title: 'Robots.txt', path: '/admin/robots', icon: <SecurityIcon /> },
      { title: 'AI Content', path: '/admin/ai-content', icon: <AutoAwesomeIcon /> },
      { title: 'Property Index', path: '/admin/property-index', icon: <InventoryIcon /> }
    ]
  },
  { title: 'Users', path: '/admin/users', icon: <AdminUsersIcon /> },
  { title: 'Settings', path: '/admin/settings', icon: <SettingsIcon /> },
  { title: 'Analytics', path: '/admin/analytics', icon: <BarChartIcon /> }
]

function isActive(pathname: string, itemPath: string): boolean {
  if (itemPath === '/admin') return pathname === '/admin'
  return pathname === itemPath || pathname.startsWith(itemPath + '/')
}

interface AdminSidebarProps {
  mobileOpen?: boolean
  onMobileClose?: () => void
}

export default function AdminSidebar({ mobileOpen = false, onMobileClose }: AdminSidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('md'))
  const [seoOpen, setSeoOpen] = useState(
    pathname.startsWith('/admin/robots') || pathname.startsWith('/admin/ai-content') || pathname.startsWith('/admin/property-index')
  )

  const handleNavigation = (path: string) => {
    router.push(path)
    if (isMobile && onMobileClose) {
      onMobileClose()
    }
  }

  const drawerContent = (
    <Box sx={{ height: '100%', bgcolor: BG_COLOR, display: 'flex', flexDirection: 'column' }}>
      <Box sx={{ p: 2, display: 'flex', alignItems: 'center', gap: 1.5 }}>
        <DashboardIcon sx={{ color: ACTIVE_COLOR }} />
        <Typography variant="h6" sx={{ color: '#fff', fontWeight: 700, fontSize: 18 }}>
          Admin CMS
        </Typography>
      </Box>

      <List sx={{ flex: 1, px: 1 }}>
        {navItems.map((item) => {
          if (item.children) {
            const childActive = item.children.some((c) => isActive(pathname, c.path))
            return (
              <React.Fragment key={item.title}>
                <ListItem disablePadding>
                  <ListItemButton
                    onClick={() => setSeoOpen(!seoOpen)}
                    sx={{
                      borderRadius: 1,
                      mb: 0.5,
                      borderLeft: childActive ? `3px solid ${ACTIVE_COLOR}` : '3px solid transparent',
                      bgcolor: childActive ? ACTIVE_BG : 'transparent',
                      '&:hover': { bgcolor: 'rgba(255,255,255,0.05)' }
                    }}
                  >
                    <ListItemIcon sx={{ color: childActive ? ACTIVE_COLOR : 'rgba(255,255,255,0.6)', minWidth: 40 }}>
                      {item.icon}
                    </ListItemIcon>
                    <ListItemText
                      primary={item.title}
                      primaryTypographyProps={{ fontSize: 14, color: childActive ? '#fff' : 'rgba(255,255,255,0.7)' }}
                    />
                    {seoOpen ? <ExpandLess sx={{ color: 'rgba(255,255,255,0.5)' }} /> : <ExpandMore sx={{ color: 'rgba(255,255,255,0.5)' }} />}
                  </ListItemButton>
                </ListItem>
                <Collapse in={seoOpen} timeout="auto" unmountOnExit>
                  <List disablePadding>
                    {item.children.map((child) => {
                      const active = isActive(pathname, child.path)
                      return (
                        <ListItem key={child.path} disablePadding>
                          <ListItemButton
                            onClick={() => handleNavigation(child.path)}
                            sx={{
                              pl: 4,
                              borderRadius: 1,
                              mb: 0.5,
                              borderLeft: active ? `3px solid ${ACTIVE_COLOR}` : '3px solid transparent',
                              bgcolor: active ? ACTIVE_BG : 'transparent',
                              '&:hover': { bgcolor: 'rgba(255,255,255,0.05)' }
                            }}
                          >
                            <ListItemIcon sx={{ color: active ? ACTIVE_COLOR : 'rgba(255,255,255,0.5)', minWidth: 36 }}>
                              {child.icon}
                            </ListItemIcon>
                            <ListItemText
                              primary={child.title}
                              primaryTypographyProps={{ fontSize: 13, color: active ? '#fff' : 'rgba(255,255,255,0.6)' }}
                            />
                          </ListItemButton>
                        </ListItem>
                      )
                    })}
                  </List>
                </Collapse>
              </React.Fragment>
            )
          }

          const active = isActive(pathname, item.path)
          return (
            <ListItem key={item.path} disablePadding>
              <ListItemButton
                onClick={() => handleNavigation(item.path)}
                sx={{
                  borderRadius: 1,
                  mb: 0.5,
                  borderLeft: active ? `3px solid ${ACTIVE_COLOR}` : '3px solid transparent',
                  bgcolor: active ? ACTIVE_BG : 'transparent',
                  '&:hover': { bgcolor: 'rgba(255,255,255,0.05)' }
                }}
              >
                <ListItemIcon sx={{ color: active ? ACTIVE_COLOR : 'rgba(255,255,255,0.6)', minWidth: 40 }}>
                  {item.icon}
                </ListItemIcon>
                <ListItemText
                  primary={item.title}
                  primaryTypographyProps={{ fontSize: 14, color: active ? '#fff' : 'rgba(255,255,255,0.7)' }}
                />
              </ListItemButton>
            </ListItem>
          )
        })}
      </List>
    </Box>
  )

  if (isMobile) {
    return (
      <Drawer
        variant="temporary"
        open={mobileOpen}
        onClose={onMobileClose}
        ModalProps={{ keepMounted: true }}
        sx={{
          '& .MuiDrawer-paper': {
            width: DRAWER_WIDTH,
            boxSizing: 'border-box',
            border: 'none'
          }
        }}
      >
        {drawerContent}
      </Drawer>
    )
  }

  return (
    <Drawer
      variant="permanent"
      sx={{
        width: DRAWER_WIDTH,
        flexShrink: 0,
        '& .MuiDrawer-paper': {
          width: DRAWER_WIDTH,
          boxSizing: 'border-box',
          border: 'none'
        }
      }}
    >
      {drawerContent}
    </Drawer>
  )
}

export { MenuIcon, DRAWER_WIDTH }
