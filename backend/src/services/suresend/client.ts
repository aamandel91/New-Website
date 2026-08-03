import { inject, injectable } from 'tsyringe'
import type { Logger } from 'pino'
import type { AppConfig } from '../../config.js'
import type {
  SureSendApiResponse,
  SureSendAppointment,
  SureSendAppointmentInput,
  SureSendCustomField,
  SureSendCustomFieldInput,
  SureSendEmailInput,
  SureSendEvent,
  SureSendEventInput,
  SureSendGroup,
  SureSendIdentity,
  SureSendMessage,
  SureSendNote,
  SureSendNoteInput,
  SureSendPerson,
  SureSendPersonInput,
  SureSendPersonSearchResult,
  SureSendTask,
  SureSendTaskInput,
  SureSendTextInput,
  SureSendUpdateFlags,
  SureSendUser,
  SureSendWebhook,
  SureSendWebhookInput
} from './types.js'

export class SureSendApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public body?: string
  ) {
    super(message)
    this.name = 'SureSendApiError'
  }
}

/** Max attempts when the API answers 429 (waits Retry-After between tries). */
const MAX_RATE_LIMIT_ATTEMPTS = 5
/** Max attempts when the API answers 5xx (exponential backoff between tries). */
const MAX_SERVER_ERROR_ATTEMPTS = 3
const BACKOFF_BASE_MS = 500
const DEFAULT_RETRY_AFTER_MS = 2000

/**
 * Thin wrapper over fetch for the SureSend Partner API
 * (https://api.suresend.ai/api/partner, Bearer auth, 600 req/min).
 *
 * fetchFn/sleepFn are swappable so unit tests can mock the transport and
 * skip real waits.
 */
@injectable()
export default class SureSendService {
  fetchFn: typeof fetch = (...args) => fetch(...args)
  sleepFn: (ms: number) => Promise<void> = (ms) =>
    new Promise((resolve) => setTimeout(resolve, ms))

  constructor(
    @inject('logger') private logger: Logger,
    @inject('config') private config: AppConfig
  ) {}

  get enabled(): boolean {
    return this.config.suresend.enabled
  }

  private async request<T>(
    path: string,
    options: RequestInit = {}
  ): Promise<T> {
    if (!this.config.suresend.api_token) {
      throw new SureSendApiError('SURESEND_API_TOKEN is not set', 0)
    }
    const url = `${this.config.suresend.base_url}${path}`
    let rateLimitAttempts = 0
    let serverErrorAttempts = 0

    // Retry loop: 429 honors Retry-After (max 5 attempts), 5xx uses
    // exponential backoff (max 3 attempts). Everything else is terminal.
    for (;;) {
      const response = await this.fetchFn(url, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.config.suresend.api_token}`,
          ...(options.headers as Record<string, string> | undefined)
        }
      })

      if (response.status === 429) {
        rateLimitAttempts += 1
        if (rateLimitAttempts >= MAX_RATE_LIMIT_ATTEMPTS) {
          throw new SureSendApiError(
            `SureSend rate limit: gave up after ${rateLimitAttempts} attempts`,
            429
          )
        }
        const retryAfter = response.headers.get('Retry-After')
        const waitMs = retryAfter
          ? parseInt(retryAfter, 10) * 1000
          : DEFAULT_RETRY_AFTER_MS
        this.logger.warn(
          { data: { path, waitMs, attempt: rateLimitAttempts } },
          '[SureSendService]: 429 received, honoring Retry-After'
        )
        await this.sleepFn(waitMs)
        continue
      }

      if (response.status >= 500) {
        serverErrorAttempts += 1
        if (serverErrorAttempts >= MAX_SERVER_ERROR_ATTEMPTS) {
          const body = await response.text().catch(() => '')
          throw new SureSendApiError(
            `SureSend server error ${response.status} after ${serverErrorAttempts} attempts`,
            response.status,
            body
          )
        }
        const waitMs = BACKOFF_BASE_MS * 2 ** (serverErrorAttempts - 1)
        this.logger.warn(
          { data: { path, status: response.status, waitMs } },
          '[SureSendService]: 5xx received, backing off'
        )
        await this.sleepFn(waitMs)
        continue
      }

      if (!response.ok) {
        const body = await response.text().catch(() => '')
        throw new SureSendApiError(
          `SureSend API error: ${response.status} ${response.statusText}`,
          response.status,
          body
        )
      }

      if (response.status === 204) return {} as T
      return (await response.json()) as T
    }
  }

  // ─── Identity ──────────────────────────────────────────────────

  async getIdentity(): Promise<SureSendApiResponse<SureSendIdentity>> {
    return this.request('/identity')
  }

  /**
   * Calls GET /identity and logs the connected team name. Returns the
   * identity on success, null on failure (logged, not thrown) so health
   * checks can report status without crashing.
   */
  async verifyConnection(): Promise<SureSendIdentity | null> {
    try {
      const res = await this.getIdentity()
      const identity = res.data ?? (res as unknown as SureSendIdentity)
      this.logger.info(
        { data: { teamName: identity.teamName ?? identity.name } },
        '[SureSendService]: connection verified'
      )
      return identity
    } catch (err) {
      this.logger.error({ err }, '[SureSendService]: connection check failed')
      return null
    }
  }

  // ─── People ────────────────────────────────────────────────────

  async createPerson(
    data: SureSendPersonInput
  ): Promise<SureSendApiResponse<SureSendPerson>> {
    return this.request('/people', {
      method: 'POST',
      body: JSON.stringify(data)
    })
  }

  async updatePerson(
    id: string,
    data: Partial<SureSendPersonInput>,
    flags: SureSendUpdateFlags = {}
  ): Promise<SureSendApiResponse<SureSendPerson>> {
    const params = new URLSearchParams()
    if (flags.mergeTags) params.set('mergeTags', 'true')
    if (flags.mergeEmails) params.set('mergeEmails', 'true')
    if (flags.mergePhones) params.set('mergePhones', 'true')
    const qs = params.size > 0 ? `?${params.toString()}` : ''
    return this.request(`/people/${id}${qs}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    })
  }

  async findPeople(query: {
    email?: string
    phone?: string
  }): Promise<SureSendPersonSearchResult> {
    const params = new URLSearchParams()
    if (query.email) params.set('email', query.email)
    if (query.phone) params.set('phone', query.phone)
    return this.request(`/people/search?${params.toString()}`)
  }

  // ─── Tags ──────────────────────────────────────────────────────

  async applyTags(
    personId: string,
    tags: string[]
  ): Promise<SureSendApiResponse<void>> {
    return this.request(`/people/${personId}/tags`, {
      method: 'POST',
      body: JSON.stringify({ tags })
    })
  }

  async removeTags(
    personId: string,
    tags: string[]
  ): Promise<SureSendApiResponse<void>> {
    return this.request(`/people/${personId}/tags`, {
      method: 'DELETE',
      body: JSON.stringify({ tags })
    })
  }

  // ─── Events / Notes / Tasks / Appointments ─────────────────────

  async createEvent(
    data: SureSendEventInput
  ): Promise<SureSendApiResponse<SureSendEvent>> {
    return this.request('/events', {
      method: 'POST',
      body: JSON.stringify(data)
    })
  }

  async createNote(
    data: SureSendNoteInput
  ): Promise<SureSendApiResponse<SureSendNote>> {
    return this.request('/notes', {
      method: 'POST',
      body: JSON.stringify(data)
    })
  }

  async createTask(
    data: SureSendTaskInput
  ): Promise<SureSendApiResponse<SureSendTask>> {
    return this.request('/tasks', {
      method: 'POST',
      body: JSON.stringify(data)
    })
  }

  async createAppointment(
    data: SureSendAppointmentInput
  ): Promise<SureSendApiResponse<SureSendAppointment>> {
    return this.request('/appointments', {
      method: 'POST',
      body: JSON.stringify(data)
    })
  }

  // ─── Texts / Emails ────────────────────────────────────────────
  // send:true delivers to the lead; send:false only logs the message on
  // the person's timeline. Callers should gate send:true behind
  // config.integrations.send_lead_alerts.

  async sendText(
    data: Omit<SureSendTextInput, 'send'>
  ): Promise<SureSendApiResponse<SureSendMessage>> {
    return this.request('/texts', {
      method: 'POST',
      body: JSON.stringify({ ...data, send: true })
    })
  }

  async logText(
    data: Omit<SureSendTextInput, 'send'>
  ): Promise<SureSendApiResponse<SureSendMessage>> {
    return this.request('/texts', {
      method: 'POST',
      body: JSON.stringify({ ...data, send: false })
    })
  }

  async sendEmail(
    data: Omit<SureSendEmailInput, 'send'>
  ): Promise<SureSendApiResponse<SureSendMessage>> {
    return this.request('/emails', {
      method: 'POST',
      body: JSON.stringify({ ...data, send: true })
    })
  }

  async logEmail(
    data: Omit<SureSendEmailInput, 'send'>
  ): Promise<SureSendApiResponse<SureSendMessage>> {
    return this.request('/emails', {
      method: 'POST',
      body: JSON.stringify({ ...data, send: false })
    })
  }

  // ─── Roster (never hardcode agents — always fetch live) ────────

  async listGroups(): Promise<SureSendApiResponse<SureSendGroup[]>> {
    return this.request('/groups')
  }

  async listUsers(): Promise<SureSendApiResponse<SureSendUser[]>> {
    return this.request('/users')
  }

  // ─── Custom fields ─────────────────────────────────────────────

  async listCustomFields(): Promise<
    SureSendApiResponse<SureSendCustomField[]>
  > {
    return this.request('/custom-fields')
  }

  async createCustomField(
    data: SureSendCustomFieldInput
  ): Promise<SureSendApiResponse<SureSendCustomField>> {
    return this.request('/custom-fields', {
      method: 'POST',
      body: JSON.stringify(data)
    })
  }

  // ─── Webhooks ──────────────────────────────────────────────────

  async createWebhook(
    data: SureSendWebhookInput
  ): Promise<SureSendApiResponse<SureSendWebhook>> {
    return this.request('/webhooks', {
      method: 'POST',
      body: JSON.stringify(data)
    })
  }

  async listWebhooks(): Promise<SureSendApiResponse<SureSendWebhook[]>> {
    return this.request('/webhooks')
  }

  async testWebhook(id: string): Promise<SureSendApiResponse<unknown>> {
    return this.request(`/webhooks/${id}/test`, { method: 'POST' })
  }
}
