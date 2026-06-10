import 'server-only'

import {
  applyTags,
  createEvent,
  createNote,
  createPerson,
  createTask,
  searchPeople,
  updatePerson
} from '@/services/suresend/client'
import type { LeadFormType } from '@/services/suresend/types'
import type { QueuedLeadPayload } from '@/services/leadQueue'

/**
 * The single source of truth for pushing a website lead into SureSend:
 * person upsert (dedup by email) -> tags -> event -> task (tours) -> note.
 *
 * Used by BOTH the live form route (/api/suresend/lead) and the admin
 * retry queue (/api/admin/lead-queue), so a retried lead goes through the
 * exact same pipeline as a fresh one.
 *
 * Throws if the person upsert fails (the lead did NOT reach the CRM).
 * Secondary steps (tags/event/task/note) log-and-continue, same as before.
 */

const TAG_MAP: Record<string, string[]> = {
  tour_request: ['website_lead', 'tour_request', 'high_intent'],
  contact: ['website_lead', 'contact_form'],
  open_house: ['website_lead', 'open_house', 'in_person'],
  offer: ['website_lead', 'offer_interest', 'hot_lead']
}

function getNextBusinessDay(): string {
  const date = new Date()
  date.setDate(date.getDate() + 1)
  // Skip weekends
  while (date.getDay() === 0 || date.getDay() === 6) {
    date.setDate(date.getDate() + 1)
  }
  date.setHours(9, 0, 0, 0)
  return date.toISOString()
}

function splitName(fullName: string): { firstName: string; lastName: string } {
  const parts = fullName.trim().split(/\s+/)
  const firstName = parts[0] || ''
  const lastName = parts.slice(1).join(' ') || ''
  return { firstName, lastName }
}

export async function syncLeadToSureSend(
  lead: QueuedLeadPayload
): Promise<{ personId: string }> {
  const { name, email, phone, message, propertyAddress, mlsNumber, source } =
    lead
  const formType = lead.formType as LeadFormType
  const { firstName, lastName } = splitName(name)

  // ─── Deduplicate by email: create or update person ──────────────────────
  // This is the step that MUST succeed for the lead to exist in the CRM.
  // Failures here propagate to the caller, which queues the lead for retry.
  let personId: string
  const existing = await searchPeople(email)
  if (existing.data.length > 0) {
    personId = existing.data[0].id
    await updatePerson(personId, {
      firstName,
      lastName,
      phone,
      source: source || 'website'
    })
  } else {
    const created = await createPerson({
      firstName,
      lastName,
      email,
      phone,
      source: source || 'website'
    })
    personId = created.data.id
  }

  // ─── Apply tags based on form type ───────────────────────────────────────
  const tags = TAG_MAP[formType] || ['website_lead']
  try {
    await applyTags(personId, tags)
  } catch (err) {
    console.error('[SureSend] Failed to apply tags:', err)
  }

  // ─── Create event ────────────────────────────────────────────────────────
  try {
    await createEvent({
      type: formType === 'tour_request' ? 'inquiry' : 'form_submission',
      personId,
      ...(propertyAddress || mlsNumber
        ? {
            property: {
              address: propertyAddress,
              mlsNumber
            }
          }
        : {}),
      metadata: {
        formType,
        source: source || 'website'
      }
    })
  } catch (err) {
    console.error('[SureSend] Failed to create event:', err)
  }

  // ─── Create task for tour requests ───────────────────────────────────────
  if (formType === 'tour_request') {
    try {
      await createTask(
        personId,
        `Follow up: Tour request for ${propertyAddress || 'property'}`,
        'call',
        getNextBusinessDay()
      )
    } catch (err) {
      console.error('[SureSend] Failed to create task:', err)
    }
  }

  // ─── Create note with message ────────────────────────────────────────────
  if (message) {
    try {
      const subject =
        formType === 'tour_request'
          ? `Tour Request — ${propertyAddress || 'Website'}`
          : formType === 'open_house'
            ? `Open House Sign-In — ${propertyAddress || 'Website'}`
            : `Contact Form — ${propertyAddress || 'Website'}`

      await createNote(personId, subject, message)
    } catch (err) {
      console.error('[SureSend] Failed to create note:', err)
    }
  }

  return { personId }
}
