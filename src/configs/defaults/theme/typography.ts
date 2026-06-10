import { tenant } from '@/configs/tenant.config'

import { toRem } from 'utils/theme'

import { type TypographyOptions } from '@mui/material/styles/createTypography'

const typography: TypographyOptions = {
  htmlFontSize: 16, // HTML base font size in pixels
  fontSize: 14, // 14px to match floridahomefinder.com
  fontFamily: tenant.visualIdentity.fonts.body,

  h1: {
    fontWeight: 400,
    fontSize: toRem(48),
    lineHeight: toRem(56)
  },
  h2: {
    fontWeight: 400,
    fontSize: toRem(32),
    lineHeight: toRem(40)
  },
  h3: {
    fontWeight: 400,
    fontSize: toRem(24),
    lineHeight: toRem(32)
  },
  h4: {
    fontWeight: 400,
    fontSize: toRem(18),
    lineHeight: toRem(26)
  },
  h5: {
    fontWeight: 400,
    fontSize: toRem(16),
    lineHeight: toRem(24)
  },
  h6: {
    fontWeight: 400,
    fontSize: toRem(14),
    lineHeight: toRem(20)
  },

  subtitle2: {},

  // NOTE: `body1` is the default text size in Material UI
  body1: {
    fontWeight: 400,
    fontSize: toRem(14),
    lineHeight: 1.43
  },

  body2: {
    fontSize: toRem(13),
    lineHeight: 1.43
  },

  caption: {
    fontSize: toRem(11),
    lineHeight: 1.43
  },

  button: {
    lineHeight: 1.75,
    fontSize: toRem(14),
    fontWeight: 400,
    textTransform: 'none'
  }
}

export default typography
