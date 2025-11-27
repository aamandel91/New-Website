import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

/**
 * Next.js Middleware for Agent Subdomain Routing
 *
 * This middleware handles routing for agent subdomains (e.g., john-smith.yoursite.com)
 * and adds SEO meta tags (noindex, nofollow) to prevent indexing agent-specific pages.
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
