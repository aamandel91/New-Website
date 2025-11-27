/**
 * Utility functions for handling agent subdomain detection and SEO
 */

/**
 * Check if the current request is from an agent subdomain (client-side)
 */
export function isAgentSubdomain(): boolean {
  if (typeof window === 'undefined') return false

  const hostname = window.location.hostname
  const parts = hostname.split('.')

  // Exclude common non-agent subdomains
  const excludedSubdomains = ['www', 'admin', 'api', 'staging', 'dev', 'test', 'localhost']

  if (parts.length >= 2) {
    const firstPart = parts[0]
    return !excludedSubdomains.includes(firstPart)
  }

  return false
}

/**
 * Get the agent subdomain name (client-side)
 */
export function getAgentSubdomain(): string | null {
  if (typeof window === 'undefined') return null

  const hostname = window.location.hostname
  const parts = hostname.split('.')

  const excludedSubdomains = ['www', 'admin', 'api', 'staging', 'dev', 'test', 'localhost']

  if (parts.length >= 2) {
    const firstPart = parts[0]
    if (!excludedSubdomains.includes(firstPart)) {
      return firstPart
    }
  }

  return null
}

/**
 * Check if request is from an agent subdomain (server-side)
 */
export function isAgentSubdomainServer(hostname: string): boolean {
  const parts = hostname.split('.')
  const excludedSubdomains = ['www', 'admin', 'api', 'staging', 'dev', 'test', 'localhost']

  if (parts.length >= 2) {
    const firstPart = parts[0]
    return !excludedSubdomains.includes(firstPart)
  }

  return false
}

/**
 * Get agent subdomain from hostname (server-side)
 */
export function getAgentSubdomainServer(hostname: string): string | null {
  const parts = hostname.split('.')
  const excludedSubdomains = ['www', 'admin', 'api', 'staging', 'dev', 'test', 'localhost']

  if (parts.length >= 2) {
    const firstPart = parts[0]
    if (!excludedSubdomains.includes(firstPart)) {
      return firstPart
    }
  }

  return null
}
