'use client'

import { type ComponentType, useRef } from 'react'

import { type DialogName, useDialog } from 'providers/DialogProvider'

/**
 * Defers a dialog's bundle until it is first opened. Dialogs mount on every
 * page but are interaction-only UI, so their chunks (forms, validation, etc.)
 * shouldn't be part of the initial page load. Once opened, the dialog stays
 * mounted so close animations and internal state keep working.
 */
const LazyDialog = ({
  name,
  component: Component
}: {
  name: DialogName
  component: ComponentType
}) => {
  const { visible } = useDialog(name)
  const everVisible = useRef(false)

  if (visible) everVisible.current = true
  if (!everVisible.current) return null

  return <Component />
}

export default LazyDialog
