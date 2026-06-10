import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import crypto from 'crypto'

import storageConfig from '@configs/storage'

import 'server-only'

/**
 * Server-side admin authentication guard for /api/admin/* routes.
 *
 * Verifies the RS256 signature of the JWT issued by the backend using the
 * backend's public key (JWT_PUBLIC_KEY env var, PEM format). This is the
 * same key pair the backend uses to sign tokens (see backend JWT_PRIVATE_KEY /
 * JWT_PUBLIC_KEY). Fails CLOSED: if the public key is not configured, all
 * admin API requests are rejected.
 *
 * Usage in a route handler:
 *
 *   export async function PUT(request: Request) {
 *     const denied = await requireAdmin(request)
 *     if (denied) return denied
 *     // ... authorized logic
 *   }
 */

const ADMIN_ROLE = 3 // UserRole.Admin, must match backend role enum

interface JwtPayload {
  role?: number
  exp?: number
  [key: string]: unknown
}

const base64UrlDecode = (input: string): Buffer =>
  Buffer.from(input.replace(/-/g, '+').replace(/_/g, '/'), 'base64')

/**
 * Verify an RS256 JWT signature + expiry + admin role.
 * Returns the decoded payload if valid, otherwise null.
 */
export const verifyAdminToken = (token: string): JwtPayload | null => {
  const publicKey = process.env.JWT_PUBLIC_KEY
  if (!publicKey) return null

  const parts = token.split('.')
  if (parts.length !== 3) return null

  const [headerB64, payloadB64, signatureB64] = parts

  try {
    const header = JSON.parse(base64UrlDecode(headerB64).toString('utf-8'))
    // Pin the algorithm to prevent alg-substitution attacks (e.g. "none", HS256)
    if (header.alg !== 'RS256') return null

    const verified = crypto.verify(
      'RSA-SHA256',
      Buffer.from(`${headerB64}.${payloadB64}`),
      publicKey.replace(/\\n/g, '\n'),
      base64UrlDecode(signatureB64)
    )
    if (!verified) return null

    const payload: JwtPayload = JSON.parse(
      base64UrlDecode(payloadB64).toString('utf-8')
    )

    const now = Math.floor(Date.now() / 1000)
    if (typeof payload.exp !== 'number' || payload.exp <= now) return null
    if (payload.role !== ADMIN_ROLE) return null

    return payload
  } catch {
    return null
  }
}

const extractToken = async (request: Request): Promise<string | null> => {
  // 1. Authorization: Bearer <token>
  const authHeader = request.headers.get('authorization')
  if (authHeader?.startsWith('Bearer ')) {
    return authHeader.slice(7)
  }
  // 2. Session cookie (same cookie the rest of the app uses)
  try {
    const cookieStore = await cookies()
    return cookieStore.get(storageConfig.tokenKey)?.value || null
  } catch {
    return null
  }
}

/**
 * Guard for admin API route handlers.
 * Returns null when the request is authorized, otherwise a NextResponse
 * (401/503) that the handler must return immediately.
 */
export const requireAdmin = async (
  request: Request
): Promise<NextResponse | null> => {
  if (!process.env.JWT_PUBLIC_KEY) {
    console.error(
      '[adminAuth] JWT_PUBLIC_KEY is not configured - rejecting admin API request. ' +
        'Set JWT_PUBLIC_KEY to the PEM contents of the backend JWT public key.'
    )
    return NextResponse.json(
      { error: 'Admin API is not configured' },
      { status: 503 }
    )
  }

  const token = await extractToken(request)
  if (!token || !verifyAdminToken(token)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  return null
}
