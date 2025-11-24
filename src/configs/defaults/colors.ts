import { darken, lighten } from '@mui/material'

export const white = '#FFFFFF'
export const light = '#999999'
export const medium = '#666666'
export const dark = '#1a1a1a'
export const black = '#202020'

export const background = '#1a1a1a'

// main gold/tan accent
export const primary = '#b19a55'
// secondary gold accent
export const secondary = '#b19a55'
// markers color, normally the same as secondary
export const marker = secondary
export const soldMarker = darken(marker, 0.2)
export const rentMarker = marker

export const hint = light
export const disabled = light
export const divider = '#d9d9d9'

// alert / toast / snackbar colors

export const info = '#2196F3'
export const error = '#F44336'
export const success = '#4CAF50'
export const warning = '#FFC107'

// Chart colors

export const chartColors = [secondary, lighten(primary, 0.5), success]
export const inventoryColors = [success, warning, error]
