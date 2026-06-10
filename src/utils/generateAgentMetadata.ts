import { type Metadata } from 'next'
import { headers } from 'next/headers'

import { isAgentSubdomainServer } from './agentSubdomain'

/**
 * Generate metadata with noindex/nofollow for agent subdomains
 *
 * Use this in your page.tsx files to generate proper metadata:
 *
 * export async function generateMetadata(): Promise<Metadata> {
 *   return generateAgentMetadata({
 *     title: 'Page Title',
 *     description: 'Page description'
 *   })
 * }
 */
export async function generateAgentMetadata(
  baseMetadata: Metadata = {}
): Promise<Metadata> {
  const headersList = await headers()
  const hostname = headersList.get('host') || ''

  const isAgent = isAgentSubdomainServer(hostname)

  if (isAgent) {
    // Add noindex/nofollow for agent subdomains
    return {
      ...baseMetadata,
      robots: {
        index: false,
        follow: false,
        nocache: true,
        googleBot: {
          index: false,
          follow: false
        }
      }
    }
  }

  // Return base metadata for main site
  return baseMetadata
}

/**
 * Check if current page is on an agent subdomain (server-side)
 */
export async function checkIsAgentSubdomain(): Promise<boolean> {
  const headersList = await headers()
  const hostname = headersList.get('host') || ''
  return isAgentSubdomainServer(hostname)
}

/**
 * Get agent subdomain name (server-side)
 */
export async function getAgentSubdomainName(): Promise<string | null> {
  const headersList = await headers()
  const hostname = headersList.get('host') || ''

  const parts = hostname.split('.')
  const excludedSubdomains = [
    'www',
    'admin',
    'api',
    'staging',
    'dev',
    'test',
    'localhost'
  ]

  if (parts.length >= 2) {
    const firstPart = parts[0]
    if (!excludedSubdomains.includes(firstPart)) {
      return firstPart
    }
  }

  return null
}
