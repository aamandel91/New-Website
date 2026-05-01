import { darken, lighten } from '@mui/material'

import { tenant } from '@/configs/tenant.config'

const vi = tenant.visualIdentity.colors

export const white = '#FFFFFF'
export const light = '#999999'
export const medium = vi.textMuted
export const dark = vi.text
export const black = '#202020'

export const background = vi.background

// main brand accent
export const primary = vi.primary
// secondary accent
export const secondary = vi.accent
// markers color, normally the same as secondary
export const marker = secondary
export const soldMarker = darken(marker, 0.2)
export const rentMarker = marker

export const hint = light
export const disabled = light
export const divider = vi.border

// alert / toast / snackbar colors

export const info = vi.info
export const error = vi.error
export const success = vi.success
export const warning = vi.warning

// Chart colors

export const chartColors = [secondary, lighten(primary, 0.5), success]
export const inventoryColors = [success, warning, error]
