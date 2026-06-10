'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'

import BookmarkIcon from '@mui/icons-material/Bookmark'
import FavoriteIcon from '@mui/icons-material/Favorite'
import HistoryIcon from '@mui/icons-material/History'
import LogoutIcon from '@mui/icons-material/Logout'
import PersonIcon from '@mui/icons-material/Person'
import SettingsIcon from '@mui/icons-material/Settings'
import {
  Avatar,
  Box,
  Button,
  Divider,
  ListItemIcon,
  ListItemText,
  Menu,
  MenuItem
} from '@mui/material'

import { useSiteUser } from 'providers/SiteUserProvider'

import LoginDialog from './LoginDialog'

const NAV_TEXT_SX = {
  color: 'white',
  fontSize: '13px',
  fontWeight: 500,
  letterSpacing: '1.5px',
  textTransform: 'uppercase' as const,
  whiteSpace: 'nowrap' as const,
  px: 1,
  py: 0.5,
  minWidth: 0,
  '&:hover': {
    bgcolor: 'rgba(255,255,255,0.08)'
  }
}

const UserMenu = () => {
  const router = useRouter()
  const { isLoggedIn, user, logout } = useSiteUser()
  const [loginOpen, setLoginOpen] = useState(false)
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null)

  if (!isLoggedIn) {
    return (
      <>
        <Button onClick={() => setLoginOpen(true)} sx={NAV_TEXT_SX}>
          Sign In
        </Button>
        <LoginDialog open={loginOpen} onClose={() => setLoginOpen(false)} />
      </>
    )
  }

  const initial = (user?.name || user?.email || 'U').charAt(0).toUpperCase()

  const handleMenuClose = () => setAnchorEl(null)

  const navigate = (path: string) => {
    handleMenuClose()
    router.push(path)
  }

  return (
    <>
      <Box
        onClick={(e) => setAnchorEl(e.currentTarget)}
        sx={{ cursor: 'pointer', display: 'flex', alignItems: 'center' }}
      >
        <Avatar
          sx={{
            width: 32,
            height: 32,
            bgcolor: '#c8a951',
            color: '#0F1621',
            fontSize: '0.875rem',
            fontWeight: 700
          }}
        >
          {initial}
        </Avatar>
      </Box>

      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        slotProps={{
          paper: {
            sx: { minWidth: 200, mt: 1 }
          }
        }}
      >
        <MenuItem disabled sx={{ opacity: '1 !important' }}>
          <ListItemIcon>
            <PersonIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText
            primary={user?.name || user?.email}
            primaryTypographyProps={{ variant: 'body2', fontWeight: 600 }}
          />
        </MenuItem>
        <Divider />
        <MenuItem onClick={() => navigate('/account/saved-searches')}>
          <ListItemIcon>
            <BookmarkIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText primary="My Saved Searches" />
        </MenuItem>
        <MenuItem onClick={() => navigate('/account/favorites')}>
          <ListItemIcon>
            <FavoriteIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText primary="My Favorites" />
        </MenuItem>
        <MenuItem onClick={() => navigate('/account/history')}>
          <ListItemIcon>
            <HistoryIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText primary="Search History" />
        </MenuItem>
        <MenuItem onClick={() => navigate('/account/settings')}>
          <ListItemIcon>
            <SettingsIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText primary="Account Settings" />
        </MenuItem>
        <Divider />
        <MenuItem
          onClick={() => {
            handleMenuClose()
            logout()
          }}
        >
          <ListItemIcon>
            <LogoutIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText primary="Sign Out" />
        </MenuItem>
      </Menu>
    </>
  )
}

export default UserMenu
