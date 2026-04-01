import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import {
  blockedCountries,
  geoBlockingEnabled,
} from '@/configs/defaults/geo-blocking'

/**
 * County slug pattern — matches slugs like "broward-county", "palm-beach-county"
 */
const COUNTY_SLUG_RE = /^[a-z-]+-county$/

/**
 * Next.js Middleware for Agent Subdomain Routing & Geo-Blocking
 *
 * This middleware handles:
 * 1. Geo-blocking — blocks requests from configured countries
 * 2. Agent subdomain routing (e.g., john-smith.yoursite.com)
 *    and adds SEO meta tags (noindex, nofollow) to prevent indexing agent-specific pages.
 */

export function middleware(request: NextRequest) {
  const hostname = request.headers.get('host') || ''
  const url = request.nextUrl.clone()

  // Skip middleware for API routes, static files, and Next.js internals
  if (
    url.pathname.startsWith('/api') ||
    url.pathname.startsWith('/_next') ||
    url.pathname.startsWith('/static') ||
    url.pathname.match(/\.(ico|png|jpg|jpeg|svg|gif|woff|woff2|ttf|eot|css|js)$/)
  ) {
    return NextResponse.next()
  }

  // --- Geo-Blocking ---
  if (geoBlockingEnabled) {
    const isLocalhost =
      hostname.includes('localhost') || hostname.includes('127.0.0.1')

    if (!isLocalhost) {
      const country =
        request.headers.get('x-vercel-ip-country') ||
        request.headers.get('cf-ipcountry') ||
        (request as NextRequest & { geo?: { country?: string } }).geo?.country ||
        ''

      if (country && blockedCountries.includes(country)) {
        console.log(
          `[geo-block] Blocked request from country=${country} path=${url.pathname}`
        )
        return new NextResponse('Access Denied', { status: 403 })
      }
    }
  }

  // --- /florida/* redirect to clean URLs ---
  if (url.pathname.startsWith('/florida/') || url.pathname === '/florida') {
    // Strip /florida and any county prefix, redirect to clean URL
    const segments = url.pathname.replace(/^\/florida\/?/, '').split('/').filter(Boolean)

    if (segments.length === 0) {
      // /florida → redirect to search
      url.pathname = '/search'
      return NextResponse.redirect(url, 301)
    }

    // Check if first segment is a county slug (e.g., "broward-county")
    if (COUNTY_SLUG_RE.test(segments[0])) {
      // Strip the county slug, keep the rest
      const remaining = segments.slice(1)

      if (remaining.length === 0) {
        // /florida/broward-county → redirect to search with county filter
        url.pathname = '/search'
        return NextResponse.redirect(url, 301)
      }

      const citySlug = remaining[0]
      const rest = remaining.slice(1)

      // Handle old nested patterns: /florida/county/city/neighborhoods/x → /city/x
      if (rest.length >= 2 && rest[0] === 'neighborhoods') {
        url.pathname = `/${citySlug}/${rest[1]}`
        return NextResponse.redirect(url, 301)
      }

      // Handle old zip pattern: /florida/county/city/zip/33071 → /city/33071
      if (rest.length >= 2 && rest[0] === 'zip') {
        url.pathname = `/${citySlug}/${rest[1]}`
        return NextResponse.redirect(url, 301)
      }

      // /florida/county/city → /city
      // /florida/county/city/condos → /city/condos
      // /florida/county/city/schools → /city/schools
      url.pathname = `/${citySlug}${rest.length > 0 ? '/' + rest.join('/') : ''}`
      return NextResponse.redirect(url, 301)
    }

    // No county prefix: /florida/fort-lauderdale/condos → /fort-lauderdale/condos
    url.pathname = `/${segments.join('/')}`
    return NextResponse.redirect(url, 301)
  }

  // Extract subdomain from hostname
  const parts = hostname.split('.')

  // Determine if this is an agent subdomain
  // Agent subdomains: agent-name.yoursite.com or agent-name.localhost:3000
  let isAgentSubdomain = false
  let agentSubdomain = ''

  if (parts.length >= 2) {
    const firstPart = parts[0]

    // Exclude common non-agent subdomains
    const excludedSubdomains = ['www', 'admin', 'api', 'staging', 'dev', 'test']

    if (!excludedSubdomains.includes(firstPart)) {
      // This might be an agent subdomain
      isAgentSubdomain = true
      agentSubdomain = firstPart
    }
  }

  // Create the response
  const response = NextResponse.next()

  // If it's an agent subdomain, add custom headers and SEO directives
  if (isAgentSubdomain && agentSubdomain) {
    // Add custom headers for the app to detect agent subdomain
    response.headers.set('x-agent-subdomain', agentSubdomain)
    response.headers.set('x-is-agent-subdomain', 'true')

    // Add SEO directives to prevent indexing
    // These will be read by the page components to add <meta> tags
    response.headers.set('x-robots-tag', 'noindex, nofollow')

    // Optional: Rewrite URL to agent-specific route
    // Uncomment if you want to create agent-specific pages
    // url.pathname = `/agent/${agentSubdomain}${url.pathname}`
    // return NextResponse.rewrite(url)
  } else {
    // Main site - allow indexing (default behavior)
    response.headers.set('x-is-agent-subdomain', 'false')
  }

  return response
}

export const config = {
  /*
   * Match all request paths except for:
   * - api (API routes)
   * - _next/static (static files)
   * - _next/image (image optimization files)
   * - favicon.ico (favicon file)
   * - public files with extensions
   */
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\..*|public).*)'
  ]
}
