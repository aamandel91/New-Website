import assert from 'assert'
import type { Logger } from 'pino'
import RepliersListingWorker, {
  normalizeStatus
} from '../../src/jobs/workers/repliersListing.js'
import LeadAlertService from '../../src/jobs/lib/alerts.js'
import type SureSendService from '../../src/services/suresend/client.js'
import type { SureSendIntegrationRepository } from '../../src/repository/suresendIntegration.js'
import type PersonMapService from '../../src/jobs/lib/personMap.js'
import type { AppConfig } from '../../src/config.js'

const noopLogger = {
  info() {},
  warn() {},
  error() {}
} as unknown as Logger

function makeWorker(opts: { sendLeadAlerts: boolean; fans: number[] }) {
  const suresendCalls: { method: string; args: unknown }[] = []
  const suresend = {
    async sendText(args: unknown) {
      suresendCalls.push({ method: 'sendText', args })
      return { data: {}, success: true }
    },
    async createTask(args: unknown) {
      suresendCalls.push({ method: 'createTask', args })
      return { data: {}, success: true }
    },
    async createNote(args: unknown) {
      suresendCalls.push({ method: 'createNote', args })
      return { data: {}, success: true }
    }
  } as unknown as SureSendService

  const pendingAlerts: Record<string, unknown>[] = []
  const statusLog: Record<string, unknown>[] = []
  const repo = {
    async markProcessed() {
      return true
    },
    async fansOfListing() {
      return opts.fans
    },
    async insertPendingAlert(params: Record<string, unknown>) {
      pendingAlerts.push(params)
    },
    async logListingStatus(params: Record<string, unknown>) {
      statusLog.push(params)
    },
    async markFavoriteRemoved() {}
  } as unknown as SureSendIntegrationRepository

  const personMap = {
    async findByClientId(id: number) {
      return `person-${id}`
    }
  } as unknown as PersonMapService

  const config = {
    integrations: {
      send_lead_alerts: opts.sendLeadAlerts,
      slack_webhook_url: '',
      webhook_base_url: ''
    },
    suresend: { enabled: true }
  } as unknown as AppConfig

  const alerts = new LeadAlertService(noopLogger, config, suresend, repo)
  const worker = new RepliersListingWorker(
    noopLogger,
    suresend,
    repo,
    personMap,
    alerts
  )
  return { worker, suresendCalls, pendingAlerts, statusLog }
}

describe('RepliersListingWorker (price drop branch)', function () {
  const priceDropPayload = {
    mlsNumber: 'A123',
    listPrice: 450000,
    updatedOn: '2026-08-03T12:00:00Z',
    address: { streetNumber: '1', streetName: 'Main', city: 'Boca Raton' },
    previous: { listPrice: 500000 }
  }

  it('with SEND_LEAD_ALERTS off: queues the text to pending_alerts, always creates task and note', async function () {
    const { worker, suresendCalls, pendingAlerts } = makeWorker({
      sendLeadAlerts: false,
      fans: [7]
    })
    await worker.updated({ ...priceDropPayload })

    // Lead-facing text is held back
    assert.equal(pendingAlerts.length, 1)
    assert.equal(pendingAlerts[0]?.['channel'], 'text')
    assert.ok(String(pendingAlerts[0]?.['reason']).includes('price-drop'))
    assert.equal(suresendCalls.filter((c) => c.method === 'sendText').length, 0)

    // Agent-facing task + note are live
    const task = suresendCalls.find((c) => c.method === 'createTask')
    assert.ok(task, 'expected a call task')
    const taskArgs = task?.args as {
      personId: string
      type: string
      dueDateTime: string
    }
    assert.equal(taskArgs.personId, 'person-7')
    assert.equal(taskArgs.type, 'call')
    const dueInMs = new Date(taskArgs.dueDateTime).getTime() - Date.now()
    assert.ok(
      dueInMs > 1.9 * 60 * 60 * 1000 && dueInMs <= 2 * 60 * 60 * 1000,
      'task should be due about +2h'
    )
    const note = suresendCalls.find((c) => c.method === 'createNote')
    assert.ok(note, 'expected a note')
    assert.ok(
      String((note?.args as { body: string }).body).includes('$450,000')
    )
  })

  it('with SEND_LEAD_ALERTS on: sends the text instead of queueing', async function () {
    const { worker, suresendCalls, pendingAlerts } = makeWorker({
      sendLeadAlerts: true,
      fans: [7]
    })
    await worker.updated({ ...priceDropPayload })
    assert.equal(pendingAlerts.length, 0)
    const text = suresendCalls.find((c) => c.method === 'sendText')
    assert.ok(text, 'expected a sent text')
    assert.ok(
      String((text?.args as { message: string }).message).includes('Price drop')
    )
  })

  it('does nothing lead-facing when there are no fans', async function () {
    const { worker, suresendCalls, pendingAlerts } = makeWorker({
      sendLeadAlerts: false,
      fans: []
    })
    await worker.updated({ ...priceDropPayload })
    assert.equal(pendingAlerts.length, 0)
    assert.equal(suresendCalls.length, 0)
  })

  it('routes Expired/Withdrawn/Terminated to listing_status_log with no lead-facing action', async function () {
    const { worker, suresendCalls, pendingAlerts, statusLog } = makeWorker({
      sendLeadAlerts: true,
      fans: [7]
    })
    await worker.updated({
      mlsNumber: 'B456',
      updatedOn: '2026-08-03T13:00:00Z',
      lastStatus: 'Exp',
      previous: { lastStatus: 'A' }
    })
    assert.equal(statusLog.length, 1)
    assert.equal(statusLog[0]?.['newStatus'], 'Exp')
    assert.equal(pendingAlerts.length, 0)
    assert.equal(suresendCalls.length, 0)
  })
})

describe('normalizeStatus', function () {
  it('maps long names and MLS codes onto normalized statuses', function () {
    assert.equal(normalizeStatus('Active'), 'active')
    assert.equal(normalizeStatus('A'), 'active')
    assert.equal(normalizeStatus('Pending'), 'pending')
    assert.equal(normalizeStatus('Sld'), 'sold')
    assert.equal(normalizeStatus('Exp'), 'expired')
    assert.equal(normalizeStatus('Ter'), 'terminated')
    assert.equal(normalizeStatus(undefined), 'unknown')
  })
})
