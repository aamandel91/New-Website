import { NextResponse } from 'next/server'

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

const TAG_MAP: Record<LeadFormType, string[]> = {
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

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const {
      name,
      email,
      phone,
      message,
      formType,
      propertyAddress,
      mlsNumber,
      source
    } = body as {
      name: string
      email: string
      phone: string
      message: string
      formType: LeadFormType
      propertyAddress?: string
      mlsNumber?: string
      source?: string
    }

    if (!name || !email || !formType) {
      return NextResponse.json(
        { error: 'Missing required fields: name, email, formType' },
        { status: 400 }
      )
    }

    const { firstName, lastName } = splitName(name)

    // ─── Deduplicate by email: create or update person ────────
    let personId: string

    try {
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
    } catch (err) {
      console.error('[SureSend] Failed to create/update person:', err)
      return NextResponse.json(
        { error: 'Failed to sync contact with CRM' },
        { status: 502 }
      )
    }

    // ─── Apply tags based on form type ────────────────────────
    const tags = TAG_MAP[formType] || ['website_lead']
    try {
      await applyTags(personId, tags)
    } catch (err) {
      console.error('[SureSend] Failed to apply tags:', err)
    }

    // ─── Create event ─────────────────────────────────────────
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

    // ─── Create task for tour requests ────────────────────────
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

    // ─── Create note with message ─────────────────────────────
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

    return NextResponse.json({ personId })
  } catch (error) {
    console.error('[SureSend] Lead route error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
