import type { Context, Next } from 'koa'

/**
 * Simple admin role middleware placeholder
 * In production, this should check user role
 * For now, passes through to allow development
 */
export const requireAdmin = async (ctx: Context, next: Next) => {
  // TODO: Implement proper role checking
  // For development, pass through
  await next()
}
