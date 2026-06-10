import crypto from 'node:crypto'
import { inject, injectable } from 'tsyringe'
import sgMail from '@sendgrid/mail'
import type { Logger } from 'pino'
import type { AppConfig } from '../config.js'
import { tenant as backendTenant } from '../config/tenant.config.js'

export interface SendGridSendOpts {
  to: { email: string; name?: string }
  fromName: string
  subject: string
  html: string
  text?: string
  /**
   * Where direct replies should land. If omitted, we generate a
   * `reply+<encoded-assignment>@<inboundReplyDomain>` address that the
   * inbound-parse receiver decodes to find the assigned agent.
   */
  replyTo?: string
  /**
   * If provided, we encode { userId, agentId } into the reply-to address so
   * the inbound webhook can route the reply back to the right agent without
   * a DB lookup on the encoded id alone.
   */
  assignment?: { userId: number; agentId: number }
  customHeaders?: Record<string, string>
  templateId?: string
  dynamicTemplateData?: Record<string, unknown>
  customArgs?: Record<string, string>
}

export interface SendGridSendResult {
  messageId: string | null
  skipped?: 'sendgrid-disabled'
}

const ASSIGNMENT_HEADER = 'X-Mandel-Assignment-ID'

/**
 * Encodes { userId, agentId } as a URL-safe base64 token suitable for the
 * local-part of an email address (`reply+<token>@...`). Used by both
 * outgoing send (to set Reply-To) and the inbound webhook (to decode).
 */
export function encodeAssignment(userId: number, agentId: number): string {
  const payload = `${userId}:${agentId}`
  return Buffer.from(payload, 'utf8')
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '')
}

export function decodeAssignment(
  token: string
): { userId: number; agentId: number } | null {
  try {
    const padded = token.replace(/-/g, '+').replace(/_/g, '/')
    const padding =
      padded.length % 4 === 0 ? '' : '='.repeat(4 - (padded.length % 4))
    const decoded = Buffer.from(padded + padding, 'base64').toString('utf8')
    const [userIdRaw, agentIdRaw] = decoded.split(':')
    const userId = Number(userIdRaw)
    const agentId = Number(agentIdRaw)
    if (!Number.isFinite(userId) || !Number.isFinite(agentId)) return null
    return { userId, agentId }
  } catch {
    return null
  }
}

/**
 * Wraps @sendgrid/mail. From-name is per-message (the assigned agent's name)
 * but the From-email is always the team sender (notifications@mandelteam.com)
 * so SPF/DKIM stay aligned with the sending domain.
 *
 * If SENDGRID_API_KEY is unset, send() is a no-op that logs and returns
 * { messageId: null, skipped: 'sendgrid-disabled' }. This lets the
 * notification-flow code be wired in W3 without breaking local dev.
 */
@injectable()
export default class SendGridService {
  private initialized = false

  constructor(
    @inject('logger') private logger: Logger,
    @inject('config') private config: AppConfig
  ) {
    if (this.config.sendgrid.enabled) {
      sgMail.setApiKey(this.config.sendgrid.api_key)
      this.initialized = true
    }
  }

  async send(opts: SendGridSendOpts): Promise<SendGridSendResult> {
    if (!this.initialized) {
      this.logger.warn(
        { data: { to: opts.to.email, subject: opts.subject } },
        '[SendGridService.send]: SENDGRID_API_KEY unset; skipping send.'
      )
      return { messageId: null, skipped: 'sendgrid-disabled' }
    }

    const fromEmail = this.config.sendgrid.notifications_from_email
    const replyTo =
      opts.replyTo ??
      (opts.assignment
        ? `reply+${encodeAssignment(opts.assignment.userId, opts.assignment.agentId)}@${this.config.sendgrid.inbound_reply_domain}`
        : `reply@${this.config.sendgrid.inbound_reply_domain}`)

    const headers: Record<string, string> = { ...(opts.customHeaders ?? {}) }
    if (opts.assignment) {
      headers[ASSIGNMENT_HEADER] = encodeAssignment(
        opts.assignment.userId,
        opts.assignment.agentId
      )
    }

    const customArgs: Record<string, string> = { ...(opts.customArgs ?? {}) }
    if (opts.assignment) {
      customArgs['user_id'] = String(opts.assignment.userId)
      customArgs['agent_id'] = String(opts.assignment.agentId)
    }

    try {
      const msg: Parameters<typeof sgMail.send>[0] = {
        to: {
          email: opts.to.email,
          ...(opts.to.name ? { name: opts.to.name } : {})
        },
        from: { email: fromEmail, name: opts.fromName },
        replyTo,
        subject: opts.subject,
        html: opts.html,
        text: opts.text ?? stripHtml(opts.html),
        headers,
        customArgs,
        ...(opts.templateId
          ? {
              templateId: opts.templateId,
              dynamicTemplateData: opts.dynamicTemplateData ?? {}
            }
          : {})
      } as any

      const [response] = await sgMail.send(msg as any)
      const messageId =
        (response.headers as Record<string, string>)['x-message-id'] ||
        (response.headers as Record<string, string>)['X-Message-Id'] ||
        crypto.randomUUID()
      return { messageId }
    } catch (err) {
      this.logger.error(
        { err, data: { to: opts.to.email, subject: opts.subject } },
        '[SendGridService.send]: SendGrid request failed'
      )
      throw err
    }
  }

  /**
   * Used by the inbound-parse receiver to forward a client reply to the
   * assigned agent. Plain forward, no template — preserves the body verbatim.
   */
  async forwardReplyToAgent(opts: {
    agentEmail: string
    agentName?: string
    fromClient: { email: string; name?: string }
    subject: string
    bodyText: string
    bodyHtml?: string
  }): Promise<SendGridSendResult> {
    const subject = opts.subject?.startsWith('[Client Reply]')
      ? opts.subject
      : `[Client Reply] ${opts.subject || '(no subject)'}`
    const intro = `From: ${opts.fromClient.name || ''} <${opts.fromClient.email}>\n\n`
    return this.send({
      to: {
        email: opts.agentEmail,
        ...(opts.agentName ? { name: opts.agentName } : {})
      },
      fromName: backendTenant.brand.teamName,
      subject,
      replyTo: opts.fromClient.email,
      text: intro + opts.bodyText,
      html:
        `<p style="color:#666;font-size:13px">From: <strong>${escapeHtml(opts.fromClient.name || '')}</strong> &lt;${escapeHtml(opts.fromClient.email)}&gt;</p>` +
        (opts.bodyHtml ||
          `<pre style="white-space:pre-wrap;font-family:inherit">${escapeHtml(opts.bodyText)}</pre>`)
    })
  }
}

function stripHtml(html: string): string {
  return html
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<[^>]+>/g, '')
    .replace(/\s+\n/g, '\n')
    .trim()
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}
