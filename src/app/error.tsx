'use client'

// Error components MUST be Client Components

import ErrorPageTemplate, { type ErrorPageProps } from '@/components/templates/ErrorPageTemplate'

export default function ErrorPage({ error, reset }: ErrorPageProps) {
  return <ErrorPageTemplate error={error} reset={reset} />
}
