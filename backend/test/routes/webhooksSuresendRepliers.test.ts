import assert from 'assert'
import crypto from 'node:crypto'
import supertest from 'supertest'
import TestAgent from 'supertest/lib/agent.js'
import { container } from 'tsyringe'
import app from '../../src/app.js'
import type { AppConfig } from '../../src/config.js'
import { SureSendIntegrationRepository } from '../../src/repository/suresendIntegration.js'

/**
 * Integration tests for the Repliers per-event receiver
 * (/api/webhooks/repliers/<event>) and the SureSend inbound receiver
 * (/api/webhooks/suresend). The integration repository and pg-boss are
 * replaced with in-memory fakes so no database is needed.
 */

class FakeIntegrationRepo {
  secrets = new Map<string, string>()
  processed = new Set<string>()

  async saveWebhookSecret(source: string, event: string, secret: string) {
    this.secrets.set(`${source}/${event}`, secret)
  }

  async getWebhookSecret(source: string, event: string) {
    const secret = this.secrets.get(`${source}/${event}`)
    return secret ? { source, event, secret } : undefined
  }

  async markProcessed(_source: string, dedupeKey: string) {
    if (this.processed.has(dedupeKey)) return false
    this.processed.add(dedupeKey)
    return true
  }
}

class FakeBoss {
  sent: { queue: string; data: unknown }[] = []
  async send(queue: string, data: unknown) {
    this.sent.push({ queue, data })
    return 'job-id'
  }
}

const WEBHOOK_SECRET = 'test-suresend-webhook-secret'

describe('Webhooks: Repliers per-event + SureSend inbound', function () {
  let appInstance: TestAgent
  let repo: FakeIntegrationRepo
  let boss: FakeBoss

  before(function () {
    repo = new FakeIntegrationRepo()
    boss = new FakeBoss()
    container.registerInstance(
      SureSendIntegrationRepository,
      repo as unknown as SureSendIntegrationRepository
    )
    container.registerInstance('pgboss', boss)
    const config = container.resolve<AppConfig>('config')
    config.suresend.webhook_secret = WEBHOOK_SECRET
    appInstance = supertest(app.callback())
  })

  describe('Repliers handshake', function () {
    it('persists the X-Hook-Secret and echoes it back on empty body', async function () {
      const response = await appInstance
        .post('/api/webhooks/repliers/listing-updated')
        .set('X-Hook-Secret', 'hook-secret-123')
        .send()
      assert.equal(response.status, 200)
      assert.equal(response.headers['x-hook-secret'], 'hook-secret-123')
      assert.equal(
        repo.secrets.get('repliers/listing-updated'),
        'hook-secret-123'
      )
    })
  })

  describe('Repliers delivery auth', function () {
    it('rejects deliveries with a wrong x-api-key', async function () {
      const response = await appInstance
        .post('/api/webhooks/repliers/listing-updated')
        .set('x-api-key', 'wrong-secret')
        .send({ mlsNumber: 'A123', listPrice: 500000 })
      assert.equal(response.status, 401)
      assert.equal(boss.sent.length, 0)
    })

    it('rejects deliveries when no handshake secret is stored', async function () {
      const response = await appInstance
        .post('/api/webhooks/repliers/favorite-created')
        .set('x-api-key', 'anything')
        .send({ clientId: 5, mlsNumber: 'A123' })
      assert.equal(response.status, 401)
    })

    it('enqueues the payload on a valid x-api-key', async function () {
      const response = await appInstance
        .post('/api/webhooks/repliers/listing-updated')
        .set('x-api-key', 'hook-secret-123')
        .send({ mlsNumber: 'A123', listPrice: 450000 })
      assert.equal(response.status, 200)
      assert.equal(boss.sent.length, 1)
      assert.equal(boss.sent[0]?.queue, 'repliers.listing-updated')
      assert.deepEqual(boss.sent[0]?.data, {
        mlsNumber: 'A123',
        listPrice: 450000
      })
    })
  })

  describe('SureSend HMAC verification', function () {
    function sign(rawBody: string): string {
      return crypto
        .createHmac('sha256', WEBHOOK_SECRET)
        .update(rawBody, 'utf8')
        .digest('hex')
    }

    it('accepts a correctly signed delivery and enqueues it', async function () {
      const payload = {
        eventId: 'evt-1',
        event: 'peopleStageUpdated',
        data: { id: 'p1', email: 'lead@example.com', stage: 'Hot' }
      }
      const rawBody = JSON.stringify(payload)
      const sentBefore = boss.sent.length
      const response = await appInstance
        .post('/api/webhooks/suresend')
        .set('Content-Type', 'application/json')
        .set('X-Webhook-Signature', sign(rawBody))
        .send(rawBody)
      assert.equal(response.status, 200)
      assert.equal(boss.sent.length, sentBefore + 1)
      assert.equal(
        boss.sent[boss.sent.length - 1]?.queue,
        'suresend.peopleStageUpdated'
      )
    })

    it('dedupes on eventId', async function () {
      const payload = {
        eventId: 'evt-1',
        event: 'peopleStageUpdated',
        data: { id: 'p1' }
      }
      const rawBody = JSON.stringify(payload)
      const sentBefore = boss.sent.length
      const response = await appInstance
        .post('/api/webhooks/suresend')
        .set('Content-Type', 'application/json')
        .set('X-Webhook-Signature', sign(rawBody))
        .send(rawBody)
      assert.equal(response.status, 200)
      assert.equal(response.body.duplicate, true)
      assert.equal(boss.sent.length, sentBefore)
    })

    it('rejects an invalid signature', async function () {
      const rawBody = JSON.stringify({
        eventId: 'evt-2',
        event: 'peopleUpdated'
      })
      const response = await appInstance
        .post('/api/webhooks/suresend')
        .set('Content-Type', 'application/json')
        .set('X-Webhook-Signature', 'deadbeef')
        .send(rawBody)
      assert.equal(response.status, 401)
    })

    it('rejects when the signature header is missing', async function () {
      const response = await appInstance
        .post('/api/webhooks/suresend')
        .set('Content-Type', 'application/json')
        .send(JSON.stringify({ eventId: 'evt-3' }))
      assert.equal(response.status, 401)
    })
  })
})
