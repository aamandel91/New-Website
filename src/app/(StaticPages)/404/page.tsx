import { Suspense } from 'react'

import { Page404Template } from '@templates'

export default function Custom404Page() {
  return (
    <Suspense>
      <Page404Template />
    </Suspense>
  )
}
