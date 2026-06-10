import { NextResponse } from 'next/server'

import {
  listQueuedLeads,
  recordRetryResult,
  removeQueuedLead
} from '@/services/leadQueue'
import { syncLeadToSureSend } from '@/services/suresend/leadSync'
import { requireAdmin } from '@/utils/adminAuth'

/**
 * Admin API for the failed-lead retry queue (/admin/lead-queue).
 *
 * GET    -> list queued leads
 * POST   -> { id } retry one lead, or { all: true } retry everything
 * DELETE -> { id } remove a lead from the queue without retrying
 */

export async function GET(request: Request) {
  const denied = await requireAdmin(request)
  if (denied) return denied

  const leads = await listQueuedLeads()
  return NextResponse.json({ leads })
}

export async function POST(request: Request) {
  const denied = await requireAdmin(request)
  if (denied) return denied

  const body = (await request.json().catch(() => ({}))) as {
    id?: string
    all?: boolean
  }

  const queue = await listQueuedLeads()
  const targets = body.all
    ? queue
    : queue.filter((l) => l.id === body.id)

  if (targets.length === 0) {
    return NextResponse.json(
      { error: 'No matching queued leads' },
      { status: 404 }
    )
  }

  const results: Array<{ id: string; success: boolean; error?: string }> = []
  for (const lead of targets) {
    try {
      await syncLeadToSureSend(lead.payload)
      await recordRetryResult(lead.id, true)
      results.push({ id: lead.id, success: true })
    } catch (err) {
      await recordRetryResult(lead.id, false, err)
      results.push({
        id: lead.id,
        success: false,
        error: err instanceof Error ? err.message.slice(0, 300) : String(err)
      })
    }
  }

  const succeeded = results.filter((r) => r.success).length
  return NextResponse.json({
    retried: results.length,
    succeeded,
    failed: results.length - succeeded,
    results
  })
}

export async function DELETE(request: Request) {
  const denied = await requireAdmin(request)
  if (denied) return denied

  const body = (await request.json().catch(() => ({}))) as { id?: string }
  if (!body.id) {
    return NextResponse.json({ error: 'id is required' }, { status: 400 })
  }

  const removed = await removeQueuedLead(body.id)
  if (!removed) {
    return NextResponse.json({ error: 'Lead not found' }, { status: 404 })
  }
  return NextResponse.json({ success: true })
}
