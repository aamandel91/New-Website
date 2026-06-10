import apiConfig from '@configs/api'

const DEFAULT_QUALITY = 75

/**
 * Returns an optimized image URL.
 *
 * - For Repliers CDN images: appends webp and size class query params.
 * - For other external URLs: routes through the Next.js image optimization API
 *   so the built-in loader can convert to WebP/AVIF and resize on the fly.
 * - For relative/local paths: returns as-is (handled by next/image automatically).
 */
export function getOptimizedImageUrl(
  url: string,
  width?: number,
  quality: number = DEFAULT_QUALITY
): string {
  if (!url) return ''

  // Relative URLs are handled by next/image automatically
  if (url.startsWith('/')) return url

  // Repliers CDN images already support webp via query params
  const repliersCdn = apiConfig?.repliersCdn || 'https://cdn.repliers.io'
  if (url.includes('cdn.repliers.io') || url.includes(repliersCdn)) {
    return url
  }

  // External URLs: route through Next.js image optimization API
  const params = new URLSearchParams({
    url,
    w: String(width || 1080),
    q: String(quality)
  })

  return `/_next/image?${params.toString()}`
}

/**
 * Maps a Repliers CDN filename to a full CDN URL with size class.
 * Convenience wrapper around the existing getCDNPath pattern.
 */
export function getReliersImageUrl(
  fileName: string,
  size: 'small' | 'medium' | 'large' = 'large'
): string {
  if (!fileName) return ''
  const repliersCdn = apiConfig?.repliersCdn || 'https://cdn.repliers.io'
  return `${repliersCdn}/${fileName}?&webp&class=${size}`
}
