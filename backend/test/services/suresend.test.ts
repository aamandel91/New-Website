import assert from 'assert'
import type { Logger } from 'pino'
import SureSendService, {
  SureSendApiError
} from '../../src/services/suresend/client.js'
import type { AppConfig } from '../../src/config.js'

const noopLogger = {
  info() {},
  warn() {},
  error() {}
} as unknown as Logger

function makeService(responses: Response[]) {
  const config = {
    suresend: {
      enabled: true,
      api_token: 'test-token',
      base_url: 'https://suresend.test/api/partner',
      webhook_secret: ''
    },
    integrations: {
      send_lead_alerts: false,
      slack_webhook_url: '',
      webhook_base_url: ''
    }
  } as unknown as AppConfig
  const service = new SureSendService(noopLogger, config)
  const calls: { url: string; init: RequestInit | undefined }[] = []
  const waits: number[] = []
  let i = 0
  service.fetchFn = (async (url: string, init?: RequestInit) => {
    calls.push({ url, init })
    const response = responses[Math.min(i, responses.length - 1)]
    i += 1
    return response
  }) as unknown as typeof fetch
  service.sleepFn = async (ms: number) => {
    waits.push(ms)
  }
  return { service, calls, waits }
}

function jsonResponse(
  status: number,
  body: unknown,
  headers?: Record<string, string>
) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', ...(headers ?? {}) }
  })
}

describe('SureSendService', function () {
  it('returns parsed JSON on success', async function () {
    const { service, calls } = makeService([
      jsonResponse(200, {
        data: { teamName: 'The Mandel Team' },
        success: true
      })
    ])
    const identity = await service.getIdentity()
    assert.equal(identity.data.teamName, 'The Mandel Team')
    assert.equal(calls.length, 1)
    const headers = calls[0]?.init?.headers as Record<string, string>
    assert.equal(headers['Authorization'], 'Bearer test-token')
  })

  it('honors Retry-After on 429 and then succeeds', async function () {
    const { service, calls, waits } = makeService([
      new Response('', { status: 429, headers: { 'Retry-After': '3' } }),
      jsonResponse(200, { data: { id: 'p1' }, success: true })
    ])
    const person = await service.createPerson({
      firstName: 'Test',
      lastName: 'Person'
    })
    assert.equal(person.data.id, 'p1')
    assert.equal(calls.length, 2)
    assert.deepEqual(waits, [3000])
  })

  it('gives up after 5 attempts of 429', async function () {
    const { service, calls } = makeService([
      new Response('', { status: 429, headers: { 'Retry-After': '1' } })
    ])
    await assert.rejects(
      () => service.getIdentity(),
      (err: SureSendApiError) => err.status === 429
    )
    assert.equal(calls.length, 5)
  })

  it('backs off exponentially on 5xx and then succeeds', async function () {
    const { service, calls, waits } = makeService([
      new Response('oops', { status: 500 }),
      jsonResponse(200, { data: [], success: true })
    ])
    await service.listGroups()
    assert.equal(calls.length, 2)
    assert.deepEqual(waits, [500])
  })

  it('gives up after 3 attempts of 5xx', async function () {
    const { service, calls, waits } = makeService([
      new Response('oops', { status: 503 })
    ])
    await assert.rejects(
      () => service.listUsers(),
      (err: SureSendApiError) => err.status === 503
    )
    assert.equal(calls.length, 3)
    assert.deepEqual(waits, [500, 1000])
  })

  it('does not retry 4xx errors', async function () {
    const { service, calls } = makeService([
      new Response('bad request', { status: 400 })
    ])
    await assert.rejects(
      () => service.getIdentity(),
      (err: SureSendApiError) => err.status === 400
    )
    assert.equal(calls.length, 1)
  })

  it('passes merge flags as query params on updatePerson', async function () {
    const { service, calls } = makeService([
      jsonResponse(200, { data: { id: 'p1' }, success: true })
    ])
    await service.updatePerson(
      'p1',
      { firstName: 'New' },
      { mergeTags: true, mergeEmails: true, mergePhones: true }
    )
    assert.ok(
      calls[0]?.url.includes(
        '/people/p1?mergeTags=true&mergeEmails=true&mergePhones=true'
      )
    )
  })

  it('sendText sets send:true and logText sets send:false', async function () {
    const { service, calls } = makeService([
      jsonResponse(200, { data: { id: 't1' }, success: true }),
      jsonResponse(200, { data: { id: 't2' }, success: true })
    ])
    await service.sendText({ personId: 'p1', message: 'hi' })
    await service.logText({ personId: 'p1', message: 'hi' })
    assert.equal(JSON.parse(calls[0]?.init?.body as string).send, true)
    assert.equal(JSON.parse(calls[1]?.init?.body as string).send, false)
  })

  it('verifyConnection returns null on failure instead of throwing', async function () {
    const { service } = makeService([new Response('nope', { status: 401 })])
    const identity = await service.verifyConnection()
    assert.equal(identity, null)
  })
})
