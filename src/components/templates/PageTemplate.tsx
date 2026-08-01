import { type ReactNode, Suspense } from 'react'
import dynamic from 'next/dynamic'

import { Box, Stack } from '@mui/material'

import { LoadingView } from 'components/atoms'

import DialogWindows from './components/DialogWindows'
import Header from './components/Header'

// Below the fold on every page: SSR stays on (HTML/SEO unchanged), but the
// client chunk loads separately from the critical bundle.
const Footer = dynamic(() => import('./components/Footer'))

const PageTemplate = ({
  loading = false,
  noHeader = false,
  noFooter = false,
  bgcolor = '',
  children
}: {
  loading?: boolean
  noHeader?: boolean
  noFooter?: boolean
  bgcolor?: string
  children: ReactNode
}) => {
  return (
    <>
      <Suspense>
        <DialogWindows />
      </Suspense>
      <Stack direction="column" minHeight="100svh" bgcolor={bgcolor}>
        {!noHeader && (
          <Suspense>
            <Header />
          </Suspense>
        )}
        {loading ? (
          <LoadingView noHeader={noHeader} />
        ) : (
          <Box flex={1}>{children}</Box>
        )}
        {!noFooter && <Footer />}
      </Stack>
    </>
  )
}

export default PageTemplate
