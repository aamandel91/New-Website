import { NextResponse } from 'next/server'
import crypto from 'crypto'

const WEBHOOK_SECRET = process.env.SURESEND_WEBHOOK_SECRET || ''

function verifySignature(body: string, signature: string): boolean {
  if (!WEBHOOK_SECRET) return false
  const expected = crypto
    .createHmac('sha256', WEBHOOK_SECRET)
    .update(body)
    .digest('hex')
  return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected))
}

const HANDLED_EVENTS = new Set([
  'peopleCreated',
  'peopleUpdated',
  'peopleStageUpdated',
  'peopleAssigned',
  'tasksCreated',
  'tasksCompleted',
  'appointmentsCreated'
])

export async function POST(request: Request) {
  const rawBody = await request.text()
  const signature = request.headers.get('X-Webhook-Signature') || ''

  if (!verifySignature(rawBody, signature)) {
    console.warn('[SureSend Webhook] Invalid signature')
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
  }

  // Return 200 immediately — process async below
  const body = JSON.parse(rawBody) as {
    event: string
    data: Record<string, unknown>
    timestamp?: string
  }

  if (!HANDLED_EVENTS.has(body.event)) {
    return NextResponse.json({ received: true, handled: false })
  }

  // Log the event for admin lead activity (info level — intentional production log)
  console.info(
    `[SureSend Webhook] ${body.event}:`,
    JSON.stringify({
      event: body.event,
      timestamp: body.timestamp || new Date().toISOString(),
      data: body.data
    })
  )

  return NextResponse.json({ received: true, handled: true })
}
