'use client'

import React, { useState } from 'react'

import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import { Box, Button, Menu, MenuItem } from '@mui/material'

interface NavItem {
  label: string
  href: string
}

interface NavDropdownProps {
  label: string
  items: NavItem[]
}

const NAV_LINK_SX = {
  color: 'white',
  fontSize: '14px',
  fontWeight: 500,
  letterSpacing: '1.5px',
  textTransform: 'uppercase' as const,
  whiteSpace: 'nowrap' as const,
  px: 1.5,
  py: 0.5,
  minWidth: 0,
  '&:hover': {
    bgcolor: 'rgba(255,255,255,0.08)',
  },
}

export const NavLink = ({ label, href }: { label: string; href: string }) => (
  <Button href={href} sx={NAV_LINK_SX}>
    {label}
  </Button>
)

export const NavDropdown = ({ label, items }: NavDropdownProps) => {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null)
  const open = Boolean(anchorEl)

  return (
    <Box>
      <Button
        onClick={(e) => setAnchorEl(e.currentTarget)}
        endIcon={
          <ExpandMoreIcon
            sx={{
              fontSize: '18px !important',
              color: 'white',
              transition: 'transform 0.2s',
              transform: open ? 'rotate(180deg)' : 'rotate(0deg)',
            }}
          />
        }
        sx={NAV_LINK_SX}
      >
        {label}
      </Button>
      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={() => setAnchorEl(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
        transformOrigin={{ vertical: 'top', horizontal: 'left' }}
        slotProps={{
          paper: {
            sx: {
              mt: 1,
              maxHeight: 400,
              borderRadius: '4px',
            },
          },
        }}
      >
        {items.map((item) => (
          <MenuItem
            key={item.href}
            component="a"
            href={item.href}
            onClick={() => setAnchorEl(null)}
            sx={{ fontSize: '14px', py: 1, px: 3 }}
          >
            {item.label}
          </MenuItem>
        ))}
      </Menu>
    </Box>
  )
}
