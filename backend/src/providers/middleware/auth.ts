import type { Context, Next } from 'koa'

/**
 * Simple auth middleware placeholder
 * In production, this should validate JWT tokens
 * For now, passes through to allow development
 */
export const requireAuth = async (ctx: Context, next: Next) => {
  // TODO: Implement proper JWT validation
  // For development, pass through
  await next()
}
