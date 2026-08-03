import { Suspense } from 'react'

import Page404Template from '@/components/templates/Page404Template'

export default function Custom404Page() {
  return (
    <Suspense>
      <Page404Template />
    </Suspense>
  )
}
