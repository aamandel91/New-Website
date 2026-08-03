import propsConfig from '@configs/properties'

import { type PropertyAddress } from 'services/API'

export const sanitizeScrubbed = (value: string) =>
  String(value).replaceAll(propsConfig.scrubbedDataString, '')

export const sanitizeStreetNumber = (value: string) =>
  sanitizeScrubbed(String(value)).match(/^0+$/) ? '' : value

export const sanitizeAddress = (address: PropertyAddress) => {
  const {
    unitNumber = '',
    streetNumber = '',
    streetName = '',
    streetSuffix = '',
    streetDirection = '',
    city = '',
    zip = ''
  } = address

  const parts = [
    unitNumber,
    streetNumber,
    streetName,
    streetSuffix,
    streetDirection,
    city,
    zip
  ]

  return parts
    .map((part) => part?.trim().replaceAll(propsConfig.scrubbedDataString, ''))
    .filter(Boolean)
    .join('-')
    .replace(/#/g, '')
    .replace(/[/\\'`]/g, '-')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .toLowerCase()
}

// NOTE: sanitizePhoneNumber moved to utils/phone — it needs libphonenumber-js,
// which must stay out of the root layout's module graph.

export const sanitizeEmail = (value: string | null | undefined) => {
  if (!value) return ''
  return String(value).trim().toLowerCase()
}
