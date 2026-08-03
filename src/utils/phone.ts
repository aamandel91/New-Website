import i18nConfig from '@configs/i18n'

import parsePhoneNumber, { AsYouType } from 'libphonenumber-js/min'

// libphonenumber-js (~30KB gz) lives in this module only. Import it from
// interaction-driven code (forms, dialogs) or via `await import('utils/phone')`
// — never from anything reachable by the root layout; display-only formatting
// belongs in utils/formatters.formatPhoneNumber, which is dependency-free.

export const formatPhoneNumberAsYouType = (
  newVal: string,
  currentVal: string | null = ''
) => {
  // backspace handling
  if (newVal.length < (currentVal || '').length) return newVal
  // library formating
  return new AsYouType(i18nConfig.phoneNumberLocale).input(newVal)
}

export const sanitizePhoneNumber = (value: string | null | undefined) => {
  if (!value) return ''
  const phoneNumber = parsePhoneNumber(value, i18nConfig.phoneNumberLocale)
  return (phoneNumber?.number || '').replace('+', '')
}
