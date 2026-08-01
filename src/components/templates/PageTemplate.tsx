import { type ReactNode, Suspense } from 'react'

import { Box, Stack } from '@mui/material'

import LazyHydrate from '@shared/LazyHydrate'

import { LoadingView } from 'components/atoms'

import DialogWindows from './components/DialogWindows'
import Footer from './components/Footer'
import Header from './components/Header'

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
        {/* Footer is below the fold on every page: server-rendered as usual,
            hydrated only when scrolled near (its links work without JS). */}
        {!noFooter && (
          <LazyHydrate>
            <Footer />
          </LazyHydrate>
        )}
      </Stack>
    </>
  )
}

export default PageTemplate
