import crypto from 'node:crypto'
import { inject, injectable } from 'tsyringe'
import type { Knex } from 'knex'
import type { Logger } from 'pino'
import { tenant as backendTenant } from '../config/tenant.config.js'

export interface MagicLinkGenerateOpts {
  userId: number
  purpose: string
  destinationPath?: string
  ttlDays?: number
}

export interface MagicLinkRedeemResult {
  userId: number
  destinationPath: string | null
  purpose: string
}

const DEFAULT_TTL_DAYS = 30

/**
 * Single-use, expiring magic links for passwordless auth and
 * one-click email actions (saved-search view, favorite view, etc).
 *
 * Tokens are UUIDv4. Redemption marks used_at, so a token can only be
 * redeemed once. invalidated_at supports bulk-revocation (logout-all,
 * password change).
 */
@injectable()
export default class MagicLinkService {
  constructor(
    @inject('logger') private logger: Logger,
    @inject('db') private db: Knex
  ) {}

  async generate(
    opts: MagicLinkGenerateOpts
  ): Promise<{ token: string; url: string; expiresAt: Date }> {
    const token = crypto.randomUUID()
    const ttlDays = opts.ttlDays ?? DEFAULT_TTL_DAYS
    const expiresAt = new Date(Date.now() + ttlDays * 24 * 60 * 60 * 1000)

    await this.db('magic_links').insert({
      token,
      user_id: opts.userId,
      purpose: opts.purpose,
      destination_path: opts.destinationPath ?? null,
      expires_at: expiresAt
    })

    const siteUrl = backendTenant.brand.siteUrl.replace(/\/$/, '')
    const url = `${siteUrl}/api/auth/magic-link?token=${encodeURIComponent(token)}`

    return { token, url, expiresAt }
  }

  async redeem(token: string): Promise<MagicLinkRedeemResult | null> {
    const row = await this.db('magic_links')
      .where({ token })
      .whereNull('used_at')
      .whereNull('invalidated_at')
      .where('expires_at', '>', this.db.fn.now())
      .first<{
        id: number
        user_id: number
        purpose: string
        destination_path: string | null
      }>()

    if (!row) {
      this.logger.warn(
        { data: { token: token.slice(0, 8) + '…' } },
        '[MagicLinkService.redeem]: token missing/expired/used'
      )
      return null
    }

    await this.db('magic_links')
      .where({ id: row.id })
      .update({ used_at: this.db.fn.now() })

    this.logger.info(
      { data: { userId: row.user_id, purpose: row.purpose } },
      '[MagicLinkService.redeem]: token redeemed'
    )

    return {
      userId: row.user_id,
      destinationPath: row.destination_path,
      purpose: row.purpose
    }
  }

  async invalidateAllForUser(userId: number, reason: string): Promise<void> {
    const updated = await this.db('magic_links')
      .where({ user_id: userId })
      .whereNull('used_at')
      .whereNull('invalidated_at')
      .update({ invalidated_at: this.db.fn.now() })

    this.logger.info(
      { data: { userId, reason, count: updated } },
      '[MagicLinkService.invalidateAllForUser]: invalidated active magic links'
    )
  }
}
