import React from 'react'

import { Box, List, ListItem, ListItemText, Typography } from '@mui/material'

const NAVY = '#0F1621'

const defaultLinks = [
  { label: 'Mortgage Calculator', href: '/search/gallery' },
  { label: 'First Time Buyers', href: '/search/gallery' },
  { label: 'Making an Offer', href: '/contact' },
  { label: 'What Are Closing Costs?', href: '/contact' }
]

interface BuyerResourcesProps {
  links?: Array<{ label: string; href: string }>
}

export default function BuyerResources({
  links = defaultLinks
}: BuyerResourcesProps) {
  return (
    <Box>
      <Typography
        variant="subtitle1"
        fontWeight={700}
        sx={{ mb: 1, color: NAVY }}
      >
        Buyer Resources
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
                    '&:hover': { textDecoration: 'underline' }
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
