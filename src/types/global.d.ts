/* Global Window type augmentations */

declare global {
  interface Window {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    dataLayer: any[]
    fbq?: (
      action: string,
      event: string,
      params?: Record<string, unknown>
    ) => void
  }
}

export {}
