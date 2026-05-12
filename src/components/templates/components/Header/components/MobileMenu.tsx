'use client'

import React, { useEffect, useState } from 'react'

import CloseIcon from '@mui/icons-material/Close'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import MenuIcon from '@mui/icons-material/Menu'
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  Button,
  Drawer,
  IconButton,
  Link,
  Stack,
  Typography,
} from '@mui/material'

import routes from '@configs/routes'

import { useDialogContext } from 'providers/DialogProvider'
import { useUser } from 'providers/UserProvider'
import useBreakpoints from 'hooks/useBreakpoints'

import { cityItems, countyItems, propertyTypeItems } from '../navData'

const ACCORDION_SX = {
  bgcolor: 'transparent',
  boxShadow: 'none',
  '&:before': { display: 'none' },
  '&:hover': { boxShadow: 'none' },
  '& .MuiAccordionSummary-root': {
    px: 0,
    minHeight: 44,
  },
  '& .MuiAccordionSummary-content': {
    my: 0,
  },
  '& .MuiAccordionDetails-root': {
    px: 0,
    pt: 0,
  },
}

const MOBILE_LINK_SX = {
  color: 'white',
  textDecoration: 'none',
  fontSize: '14px',
  fontWeight: 500,
  letterSpacing: '1.5px',
  textTransform: 'uppercase' as const,
  py: 0.5,
  display: 'block',
  '&:hover': { color: 'rgba(255,255,255,0.7)' },
}

const DROPDOWN_LINK_SX = {
  color: 'rgba(255,255,255,0.7)',
  textDecoration: 'none',
  fontSize: '13px',
  py: 0.5,
  display: 'block',
  '&:hover': { color: 'white' },
}

const MobileMenu = () => {
  const [open, setOpen] = useState(false)
  const { desktop } = useBreakpoints()
  const { showDialog } = useDialogContext()
  const { logged, logout } = useUser()

  useEffect(() => {
    if (desktop) setOpen(false)
  }, [desktop])

  const handleClose = () => setOpen(false)

  return (
    <>
      <IconButton onClick={() => setOpen(!open)} sx={{ color: 'white' }}>
        <MenuIcon />
      </IconButton>
      <Drawer
        anchor="right"
        open={open}
        onClose={handleClose}
        sx={{
          zIndex: 'modal',
          '& .MuiDrawer-paper': {
            width: '80%',
            maxWidth: 320,
            bgcolor: '#0F1621',
            borderRadius: 0,
            boxShadow: 'none',
          },
        }}
      >
        <Box sx={{ p: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
            <IconButton onClick={handleClose} sx={{ color: 'white' }}>
              <CloseIcon />
            </IconButton>
          </Box>

          <Stack spacing={0.5}>
            <Link href="/search/advanced" onClick={handleClose} sx={MOBILE_LINK_SX}>
              Search
            </Link>

            <Link href="/ai-search" onClick={handleClose} sx={MOBILE_LINK_SX}>
              AI Search
            </Link>

            <Accordion sx={ACCORDION_SX} disableGutters>
              <AccordionSummary expandIcon={<ExpandMoreIcon sx={{ color: 'white' }} />}>
                <Typography sx={{ ...MOBILE_LINK_SX, py: 0 }}>Cities</Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Stack spacing={0.5} sx={{ pl: 2 }}>
                  {cityItems.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={handleClose}
                      sx={DROPDOWN_LINK_SX}
                    >
                      {item.label}
                    </Link>
                  ))}
                </Stack>
              </AccordionDetails>
            </Accordion>

            <Accordion sx={ACCORDION_SX} disableGutters>
              <AccordionSummary expandIcon={<ExpandMoreIcon sx={{ color: 'white' }} />}>
                <Typography sx={{ ...MOBILE_LINK_SX, py: 0 }}>Counties</Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Stack spacing={0.5} sx={{ pl: 2 }}>
                  {countyItems.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={handleClose}
                      sx={DROPDOWN_LINK_SX}
                    >
                      {item.label}
                    </Link>
                  ))}
                </Stack>
              </AccordionDetails>
            </Accordion>

            <Accordion sx={ACCORDION_SX} disableGutters>
              <AccordionSummary expandIcon={<ExpandMoreIcon sx={{ color: 'white' }} />}>
                <Typography sx={{ ...MOBILE_LINK_SX, py: 0 }}>Property Type</Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Stack spacing={0.5} sx={{ pl: 2 }}>
                  {propertyTypeItems.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={handleClose}
                      sx={DROPDOWN_LINK_SX}
                    >
                      {item.label}
                    </Link>
                  ))}
                </Stack>
              </AccordionDetails>
            </Accordion>

            <Link href="/sell" onClick={handleClose} sx={MOBILE_LINK_SX}>
              Sell
            </Link>

            <Box sx={{ borderTop: '1px solid rgba(255,255,255,0.1)', my: 2 }} />

            {logged ? (
              <Button
                onClick={() => {
                  handleClose()
                  logout()
                }}
                sx={{ ...MOBILE_LINK_SX, textAlign: 'left', justifyContent: 'flex-start', p: 0 }}
              >
                Sign Out
              </Button>
            ) : (
              <Button
                onClick={() => {
                  handleClose()
                  showDialog('auth')
                }}
                sx={{ ...MOBILE_LINK_SX, textAlign: 'left', justifyContent: 'flex-start', p: 0 }}
              >
                Login / Register
              </Button>
            )}

            <Link href="/blog" onClick={handleClose} sx={MOBILE_LINK_SX}>
              Blog
            </Link>
          </Stack>
        </Box>
      </Drawer>
    </>
  )
}

export default MobileMenu
