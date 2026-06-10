import type { ContactFormData } from '@/components/property-detail/PropertyContactForm'

interface FormFilterResult {
  blocked: boolean
  matchedWord?: string
}

export function isFormBlocked(
  formData: ContactFormData,
  blockedWords: string[]
): FormFilterResult {
  const fieldsToCheck = [
    formData.name,
    formData.email,
    formData.phone,
    formData.message
  ]

  const combined = fieldsToCheck.join(' ').toLowerCase()

  for (const word of blockedWords) {
    if (combined.includes(word.toLowerCase())) {
      return { blocked: true, matchedWord: word }
    }
  }

  return { blocked: false }
}
