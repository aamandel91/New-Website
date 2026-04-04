import React from 'react'
import { Box, List, ListItem, ListItemText, Typography } from '@mui/material'

const NAVY = '#0F1621'

const defaultLinks = [
  { label: 'Free Market Analysis', href: '/sell#sell-form' },
  { label: 'Marketing Your Home', href: '/sell' },
  { label: 'Pricing Your Home', href: '/sell' },
  { label: 'Adding Value', href: '/sell' },
  { label: 'Showing Your Home', href: '/sell' },
]

interface SellerResourcesProps {
  links?: Array<{ label: string; href: string }>
}

export default function SellerResources({ links = defaultLinks }: SellerResourcesProps) {
  return (
    <Box>
      <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 1, color: NAVY }}>
        Seller Resources
      </Typography>
      <List dense disablePadding>
        {links.map((link) => (
          <ListItem key={link.label} disablePadding sx={{ py: 0.25 }}>
            <ListItemText
              primary={
                <Typography
                  component="a"
                  href={link.href}
                  variant="body2"
                  sx={{
                    color: 'primary.main',
                    textDecoration: 'none',
                    '&:hover': { textDecoration: 'underline' },
                  }}
                >
                  {link.label}
                </Typography>
              }
            />
          </ListItem>
        ))}
      </List>
    </Box>
  )
}
