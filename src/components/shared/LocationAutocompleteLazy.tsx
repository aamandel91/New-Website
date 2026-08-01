'use client'

import React, {
  type ComponentProps,
  type ComponentType,
  useEffect,
  useState
} from 'react'

import { TextField } from '@mui/material'

import type LocationAutocompleteImpl from './LocationAutocomplete'

type Props = ComponentProps<typeof LocationAutocompleteImpl>

let Loaded: ComponentType<Props> | null = null

/**
 * Splits LocationAutocomplete (MUI Autocomplete + Popper + fetch logic) into
 * its own client chunk so above-the-fold pages don't pay for it in the initial
 * bundle. Until the chunk arrives (right after hydration), renders a lookalike
 * TextField with the same placeholder and variant skin, so there is no layout
 * shift and the field is visually identical.
 */
const LocationAutocompleteLazy = (props: Props) => {
  const [Component, setComponent] = useState<ComponentType<Props> | null>(
    () => Loaded
  )

  useEffect(() => {
    if (Component) return
    let cancelled = false
    import('./LocationAutocomplete').then((mod) => {
      Loaded = mod.default
      if (!cancelled) setComponent(() => mod.default)
    })
    return () => {
      cancelled = true
    }
  }, [Component])

  if (Component) return <Component {...props} />

  const isDark = (props.variant ?? 'dark') === 'dark'
  const placeholderStyles = isDark
    ? {
        '& .MuiOutlinedInput-root': {
          color: '#fff',
          '& fieldset': { borderColor: 'rgba(255,255,255,0.3)' }
        },
        '& .MuiInputBase-input::placeholder': {
          color: 'rgba(255,255,255,0.6)',
          opacity: 1
        }
      }
    : {
        '& .MuiOutlinedInput-root': {
          color: '#0F1621',
          '& fieldset': { borderColor: '#ccc' }
        },
        '& .MuiInputBase-input::placeholder': {
          color: 'rgba(0,0,0,0.4)',
          opacity: 1
        }
      }

  return (
    <TextField
      fullWidth
      size="small"
      variant="outlined"
      autoComplete="off"
      placeholder={props.placeholder ?? 'Search location...'}
      defaultValue={props.defaultValue}
      sx={[placeholderStyles, ...(Array.isArray(props.sx) ? props.sx : [props.sx])]}
    />
  )
}

export default LocationAutocompleteLazy
