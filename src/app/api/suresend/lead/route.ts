import { NextResponse } from 'next/server'

import { enqueueFailedLead } from '@/services/leadQueue'
import type { QueuedLeadPayload } from '@/services/leadQueue'
import { syncLeadToSureSend } from '@/services/suresend/leadSync'

/**
 * Universal lead-capture endpoint used by every form on the site
 * (contact page, sell, home-value, property contact, offer wizard, ...).
 *
 * Leads are NEVER lost and visitors NEVER see a CRM error:
 * - sync succeeds  -> 200 { personId }
 * - sync fails     -> lead is persisted to the retry queue
 *                     (admin: /admin/lead-queue) and we still return
 *                     200 { queued: true }
 */
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { name, email, formType } = body as QueuedLeadPayload

    if (!name || !email || !formType) {
      return NextResponse.json(
        { error: 'Missing required fields: name, email, formType' },
        { status: 400 }
      )
    }

    const payload: QueuedLeadPayload = {
      name,
      email,
      phone: body.phone,
      message: body.message,
      formType,
      propertyAddress: body.propertyAddress,
      mlsNumber: body.mlsNumber,
      source: body.source
    }

    try {
      const { personId } = await syncLeadToSureSend(payload)
      return NextResponse.json({ personId })
    } catch (err) {
      console.error('[SureSend] Lead sync failed, queueing for retry:', err)
      await enqueueFailedLead(payload, 'lead_form', err)
      return NextResponse.json({ success: true, queued: true })
    }
  } catch (error) {
    console.error('[SureSend] Lead route error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
