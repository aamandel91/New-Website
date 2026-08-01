'use client'

import React, { useEffect, useRef, useState } from 'react'
import dynamic from 'next/dynamic'

import MenuIcon from '@mui/icons-material/Menu'
import { IconButton } from '@mui/material'

import useBreakpoints from 'hooks/useBreakpoints'

// A closed MUI Drawer renders nothing, so the SSR output of this component is
// just the hamburger button. Loading the drawer (Accordions + nav data) in its
// own chunk on first tap keeps it out of every page's hydration cost.
const MobileMenuDrawer = dynamic(() => import('./MobileMenuDrawer'), {
  ssr: false
})

const MobileMenu = () => {
  const [open, setOpen] = useState(false)
  const everOpened = useRef(false)
  const { desktop } = useBreakpoints()

  useEffect(() => {
    if (desktop) setOpen(false)
  }, [desktop])

  if (open) everOpened.current = true

  return (
    <>
      <IconButton onClick={() => setOpen(!open)} sx={{ color: 'white' }}>
        <MenuIcon />
      </IconButton>
      {everOpened.current && (
        <MobileMenuDrawer open={open} onClose={() => setOpen(false)} />
      )}
    </>
  )
}

export default MobileMenu
