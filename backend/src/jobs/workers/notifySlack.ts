import { inject, injectable } from 'tsyringe'
import type { Logger } from 'pino'
import type { AppConfig } from '../../config.js'

/**
 * notify.slack — posts a message to the incoming-webhook URL in
 * SLACK_WEBHOOK_URL. Skips gracefully with a log line when unset (the
 * repo has no dedicated Slack client, so this is a plain webhook POST).
 */
@injectable()
export default class NotifySlackWorker {
  fetchFn: typeof fetch = (...args) => fetch(...args)

  constructor(
    @inject('logger') private logger: Logger,
    @inject('config') private config: AppConfig
  ) {}

  async notify(payload: { text?: string }): Promise<void> {
    const url = this.config.integrations.slack_webhook_url
    if (!url) {
      this.logger.info(
        { data: { text: payload.text } },
        '[notify.slack]: SLACK_WEBHOOK_URL unset; skipping Slack notification'
      )
      return
    }
    const response = await this.fetchFn(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: payload.text ?? '' })
    })
    if (!response.ok) {
      throw new Error(`Slack webhook responded ${response.status}`)
    }
  }
}
