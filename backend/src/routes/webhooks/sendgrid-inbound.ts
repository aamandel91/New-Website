import Router from '@koa/router'
import { Logger } from 'pino'
import type { Knex } from 'knex'
import SendGridService, { decodeAssignment } from '../../services/sendgrid.js'
import type { AppConfig } from '../../config.js'

/**
 * SendGrid Inbound Parse receiver.
 *
 * SETUP CHECKLIST (one-time, manual):
 *  1. DNS:  reply.floridahomefinder.com  MX 10 mx.sendgrid.net
 *  2. SendGrid → Settings → Inbound Parse → Add Host:
 *       Host:    reply.floridahomefinder.com
 *       URL:     https://api.floridahomefinder.com/api/webhooks/sendgrid-inbound
 *       "POST raw fields" — leave OFF (we read the parsed multipart fields)
 *  3. Optional: set SENDGRID_INBOUND_SIGNING_SECRET and append
 *       ?secret=<value> to the URL above to enforce a shared-secret check.
 *  4. Test: send any email to reply+test@reply.floridahomefinder.com and
 *     watch this route's logs.
 *
 * Routing:
 *  - Reply-To address shape:  reply+<base64(userId:agentId)>@<reply-domain>
 *  - We extract the encoded segment, decode to (userId, agentId), look up
 *    the user's currently-assigned agent, and forward the body to that
 *    agent's email via SendGrid.
 *  - On failure (no agent, decode fails, no SendGrid key, etc.), we fall
 *    back to LISTING_ALERTS_FALLBACK_EMAIL so nothing is silently dropped.
 */

const router = new Router({ prefix: '/sendgrid-inbound' })

router.post('/', async (ctx) => {
  const logger = ctx.state.container.resolve<Logger>('logger')
  const config = ctx.state.container.resolve<AppConfig>('config')
  const db = ctx.state.container.resolve<Knex>('db')
  const sendgrid = ctx.state.container.resolve(SendGridService)

  const expectedSecret = config.sendgrid.inbound_signing_secret
  if (expectedSecret) {
    const provided = (ctx.query['secret'] as string) || ''
    if (provided !== expectedSecret) {
      logger.warn('[webhook:sendgrid-inbound] missing/incorrect ?secret=')
      ctx.status = 401
      ctx.body = { error: 'unauthorized' }
      return
    }
  }

  // SendGrid Inbound Parse posts multipart/form-data. koa-body parses fields
  // into ctx.request.body for the standard fields; attachments are exposed
  // via ctx.request.files but we don't process them here (W3 may).
  const fields = (ctx.request.body as Record<string, unknown>) || {}
  const to = String(fields['to'] || '')
  const from = String(fields['from'] || '')
  const subject = String(fields['subject'] || '')
  const text = String(fields['text'] || '')
  const html = String(fields['html'] || '')

  const fromParsed = parseEmailAddress(from)
  const assignmentToken = extractAssignmentToken(to)
  const assignment = assignmentToken ? decodeAssignment(assignmentToken) : null

  let agentEmail = config.sendgrid.fallback_agent_email
  let routedToAssigned = false

  if (assignment) {
    try {
      // Verify the assignment is still current (defense against stale tokens).
      const current = await db('agent_assignments')
        .where({ user_id: assignment.userId })
        .whereNull('unassigned_at')
        .orderBy('assigned_at', 'desc')
        .first<{ repliers_agent_id: number }>()
      if (current) {
        // Look up the agent's email from Repliers — but we don't have a
        // first-class agents store; fall back to the env-driven REPLIERS_AGENT_EMAIL
        // if the IDs match, otherwise use fallback. W3 will replace this with
        // a proper agents table.
        const expectedEmail = process.env['REPLIERS_AGENT_EMAIL']
        if (
          Number(current.repliers_agent_id) === Number(assignment.agentId) &&
          expectedEmail
        ) {
          agentEmail = expectedEmail
          routedToAssigned = true
        }
      }
    } catch (err) {
      logger.error(
        { err, data: { assignment } },
        '[webhook:sendgrid-inbound] assignment lookup failed'
      )
    }
  }

  logger.info(
    {
      data: {
        from: fromParsed.email,
        to,
        subject,
        assignment,
        routedToAssigned,
        forwardingTo: agentEmail
      }
    },
    '[webhook:sendgrid-inbound] received'
  )

  try {
    await sendgrid.forwardReplyToAgent({
      agentEmail,
      fromClient: {
        email: fromParsed.email,
        ...(fromParsed.name ? { name: fromParsed.name } : {})
      },
      subject,
      bodyText: text,
      ...(html ? { bodyHtml: html } : {})
    })
  } catch (err) {
    logger.error({ err }, '[webhook:sendgrid-inbound] forward failed')
    // Still return 200 so SendGrid doesn't retry indefinitely.
  }

  ctx.status = 200
  ctx.body = {
    ok: true,
    routed: routedToAssigned ? 'assigned-agent' : 'fallback'
  }
})

function parseEmailAddress(raw: string): { email: string; name?: string } {
  const match = raw.match(/^\s*"?([^"<]*)"?\s*<([^>]+)>\s*$/)
  if (match) {
    const email = (match[2] || '').trim()
    const name = (match[1] || '').trim()
    return name ? { email, name } : { email }
  }
  return { email: raw.trim() }
}

function extractAssignmentToken(toAddress: string): string | null {
  const match = toAddress.match(/reply\+([A-Za-z0-9_-]+)@/)
  return match ? match[1]! : null
}

export default router
