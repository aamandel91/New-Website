export const defaultBlockedWords = [
  'whatsapp',
  'telegram',
  'bitcoin',
  'crypto',
  'western union',
  'wire transfer',
  'cash app'
]

export interface FormFilterConfig {
  blockedWords: string[]
  enabled: boolean
}
