import { NextResponse } from 'next/server'

const SITE_TOKEN_KEY = 'site_token'
const COOKIE_MAX_AGE_SEC = 30 * 24 * 60 * 60 // 30 days

/**
 * Magic-link redemption endpoint. Reads ?token=<uuid>, asks the backend to
 * verify+consume it, then sets the site_token cookie and redirects the user
 * to the original destination_path (or '/').
 *
 * On invalid/expired/used tokens we redirect to /login?error=invalid-token
 * so the user is prompted to request a fresh link.
 *
 * The cookie name (`site_token`) and shape match SiteUserProvider (30-day
 * expiry, path '/'). HttpOnly is intentionally NOT set so the existing
 * client-side `js-cookie` reader keeps working.
 */
export async function GET(request: Request) {
  const url = new URL(request.url)
  const token = url.searchParams.get('token')

  if (!token) {
    return NextResponse.redirect(new URL('/login?error=missing-token', url.origin))
  }

  const apiBase =
    process.env.NEXT_PUBLIC_API_URL ||
    process.env.API_URL ||
    `${url.origin}`

  let result: {
    token: string
    user: { id: number; email: string; name: string | null; phone: string | null }
    destinationPath: string | null
  } | null = null

  try {
    const res = await fetch(`${apiBase.replace(/\/$/, '')}/api/auth/magic-link/redeem`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token }),
    })
    if (!res.ok) {
      console.warn('[magic-link] backend rejected token', { status: res.status })
      return NextResponse.redirect(new URL('/login?error=invalid-token', url.origin))
    }
    result = await res.json()
  } catch (err) {
    console.error('[magic-link] backend redeem failed', err)
    return NextResponse.redirect(new URL('/login?error=server-error', url.origin))
  }

  if (!result?.token) {
    return NextResponse.redirect(new URL('/login?error=invalid-token', url.origin))
  }

  const destination = result.destinationPath || '/'
  const safeDestination = destination.startsWith('/') ? destination : '/'
  const redirectUrl = new URL(safeDestination, url.origin)

  const response = NextResponse.redirect(redirectUrl)
  response.cookies.set(SITE_TOKEN_KEY, result.token, {
    path: '/',
    maxAge: COOKIE_MAX_AGE_SEC,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
  })
  return response
}
