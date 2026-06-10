import { inject, injectable } from 'tsyringe'
import type { Knex } from 'knex'
import type { Logger } from 'pino'
import RepliersClients from './repliers/clients.js'
import { tenant as backendTenant } from '../config/tenant.config.js'

export interface SiteUserRecord {
  id: number
  email: string
  name?: string | null
  phone?: string | null
  repliers_client_id?: number | null
}

export interface ProvisionResult {
  repliersClientId: number | null
  agentId: number
  skipped?: 'no-agent-id' | 'already-provisioned'
}

/**
 * Wraps Repliers /clients API calls and the agent_assignments history table
 * so that:
 *   - On signup, every site_user is paired with a Repliers Client and an
 *     active agent_assignments row.
 *   - Re-assigning an agent appends a new row and closes the previous one
 *     (assignments are append-only history; the active row is the one with
 *     unassigned_at IS NULL).
 *
 * Failures here do NOT block signup; we log and the nightly backfill picks
 * up missing repliers_client_id values.
 */
@injectable()
export default class RepliersClientsService {
  constructor(
    @inject('logger') private logger: Logger,
    @inject('db') private db: Knex,
    private repliersClients: RepliersClients
  ) {}

  /**
   * Provision a Repliers Client for a freshly-created site_user. Idempotent:
   * if the user already has a repliers_client_id, returns it without re-creating.
   * If REPLIERS_AGENT_ID is unset, logs and skips gracefully so signup proceeds.
   */
  async provisionForUser(user: SiteUserRecord): Promise<ProvisionResult> {
    const agentId = backendTenant.repliers.agentId
    if (!agentId) {
      this.logger.warn(
        { data: { userId: user.id } },
        '[RepliersClientsService.provisionForUser]: REPLIERS_AGENT_ID is unset; skipping Repliers client provisioning. Set the env var and run backfill.'
      )
      return { repliersClientId: null, agentId: 0, skipped: 'no-agent-id' }
    }

    if (user.repliers_client_id) {
      return {
        repliersClientId: user.repliers_client_id,
        agentId,
        skipped: 'already-provisioned'
      }
    }

    const { fname, lname } = splitName(user.name)

    try {
      const created = await this.repliersClients.create({
        agentId,
        email: user.email,
        ...(fname ? { fname } : {}),
        ...(lname ? { lname } : {}),
        ...(user.phone ? { phone: user.phone } : {}),
        preferences: { email: true, sms: !!user.phone, unsubscribe: false },
        status: true
      })

      await this.db('site_users')
        .where({ id: user.id })
        .update({ repliers_client_id: created.clientId })

      await this.recordAssignment(user.id, agentId, 'default')

      return { repliersClientId: created.clientId, agentId }
    } catch (err) {
      this.logger.error(
        { err, data: { userId: user.id, agentId } },
        '[RepliersClientsService.provisionForUser]: Repliers client provisioning failed; user will be backfilled.'
      )
      return { repliersClientId: null, agentId }
    }
  }

  /**
   * Re-assign a user to a different Repliers agent. Closes the current
   * assignment row, opens a new one, and (best-effort) updates the Repliers
   * Client record so its server-side agentId matches.
   */
  async reassignAgent(
    userId: number,
    newAgentId: number,
    reason: string = 'manual'
  ): Promise<void> {
    await this.db('agent_assignments')
      .where({ user_id: userId })
      .whereNull('unassigned_at')
      .update({ unassigned_at: this.db.fn.now() })

    await this.recordAssignment(userId, newAgentId, reason)

    const user = await this.db('site_users')
      .where({ id: userId })
      .first<SiteUserRecord>()
    if (user?.repliers_client_id) {
      try {
        await this.repliersClients.update({
          clientId: user.repliers_client_id,
          agentId: newAgentId
        })
      } catch (err) {
        this.logger.error(
          { err, data: { userId, newAgentId } },
          '[RepliersClientsService.reassignAgent]: Failed to update Repliers client agentId; local assignment row is correct, will retry on next sync.'
        )
      }
    }
  }

  async getCurrentAssignedAgent(
    userId: number
  ): Promise<{ agentId: number; assignedAt: Date } | null> {
    const row = await this.db('agent_assignments')
      .where({ user_id: userId })
      .whereNull('unassigned_at')
      .orderBy('assigned_at', 'desc')
      .first<{ repliers_agent_id: number; assigned_at: Date }>()
    if (!row) return null
    return {
      agentId: Number(row.repliers_agent_id),
      assignedAt: row.assigned_at
    }
  }

  /**
   * Backfill: find site_users with no repliers_client_id and try again.
   * Useful for users created before this rollout, or whose initial
   * provision failed.
   */
  async backfillMissing(
    limit: number = 50
  ): Promise<{ attempted: number; provisioned: number }> {
    const users = await this.db('site_users')
      .whereNull('repliers_client_id')
      .limit(limit)
      .select<
        SiteUserRecord[]
      >('id', 'email', 'name', 'phone', 'repliers_client_id')

    let provisioned = 0
    for (const u of users) {
      const r = await this.provisionForUser(u)
      if (r.repliersClientId) provisioned++
    }
    return { attempted: users.length, provisioned }
  }

  private async recordAssignment(
    userId: number,
    agentId: number,
    reason: string
  ): Promise<void> {
    await this.db('agent_assignments').insert({
      user_id: userId,
      repliers_agent_id: agentId,
      reason
    })
  }
}

function splitName(name?: string | null): { fname?: string; lname?: string } {
  if (!name) return {}
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return {}
  if (parts.length === 1) {
    const f = parts[0]
    return f ? { fname: f } : {}
  }
  const f = parts[0]
  const l = parts.slice(1).join(' ')
  if (!f) return l ? { lname: l } : {}
  return { fname: f, lname: l }
}
