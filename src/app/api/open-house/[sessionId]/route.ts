import { NextResponse } from 'next/server'
import { readFile, writeFile, mkdir } from 'fs/promises'
import path from 'path'
import crypto from 'crypto'

import type { OpenHouseSession, OpenHouseVisitor } from '@/types/openHouse'
import {
  searchPeople,
  createPerson,
  updatePerson,
  applyTags,
  createEvent,
  createNote,
} from '@/services/suresend/client'

const DATA_DIR = path.join(process.cwd(), 'data')
const DATA_FILE = path.join(DATA_DIR, 'open-house-sessions.json')

async function getSessions(): Promise<OpenHouseSession[]> {
  try {
    const data = await readFile(DATA_FILE, 'utf-8')
    return JSON.parse(data)
  } catch {
    await mkdir(DATA_DIR, { recursive: true })
    await writeFile(DATA_FILE, '[]', 'utf-8')
    return []
  }
}

async function saveSessions(sessions: OpenHouseSession[]): Promise<void> {
  await mkdir(DATA_DIR, { recursive: true })
  await writeFile(DATA_FILE, JSON.stringify(sessions, null, 2), 'utf-8')
}

/** Fire-and-forget: sync open house visitor to SureSend CRM */
async function syncVisitorToSureSend(
  visitor: OpenHouseVisitor,
  propertyAddress: string,
  mlsNumber: string
) {
  try {
    const nameParts = visitor.name.trim().split(/\s+/)
    const firstName = nameParts[0] || ''
    const lastName = nameParts.slice(1).join(' ') || ''

    let personId: string
    const existing = await searchPeople(visitor.email)
    if (existing.data.length > 0) {
      personId = existing.data[0].id
      await updatePerson(personId, { firstName, lastName, phone: visitor.phone })
    } else {
      const created = await createPerson({
        firstName,
        lastName,
        email: visitor.email,
        phone: visitor.phone,
        source: 'open_house',
      })
      personId = created.data.id
    }

    await applyTags(personId, ['website_lead', 'open_house', 'in_person'])

    await createEvent({
      type: 'form_submission',
      personId,
      property: { address: propertyAddress, mlsNumber },
      metadata: { formType: 'open_house' },
    })

    const noteLines = [`Open House Sign-In at ${propertyAddress}`]
    if (visitor.workingWithAgent) {
      noteLines.push(`Working with agent: ${visitor.workingWithAgent}`)
    }
    if (visitor.preApproved) {
      noteLines.push(`Pre-approved: ${visitor.preApproved}`)
    }
    if (visitor.hearAbout) {
      noteLines.push(`How they heard about it: ${visitor.hearAbout}`)
    }
    if (visitor.customAnswers && Object.keys(visitor.customAnswers).length > 0) {
      for (const [question, answer] of Object.entries(visitor.customAnswers)) {
        noteLines.push(`${question}: ${answer}`)
      }
    }

    await createNote(
      personId,
      `Open House Sign-In — ${propertyAddress}`,
      noteLines.join('\n')
    )
  } catch (err) {
    console.error('[SureSend] Open house visitor sync failed:', err)
  }
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  try {
    const { sessionId } = await params
    const sessions = await getSessions()
    const session = sessions.find(s => s.id === sessionId)

    if (!session) {
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ session })
  } catch (error) {
    console.error('Failed to get session:', error)
    return NextResponse.json(
      { error: 'Failed to get session' },
      { status: 500 }
    )
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  try {
    const { sessionId } = await params
    const body = await request.json()
    const { name, email, phone, workingWithAgent, hearAbout, preApproved, customAnswers } = body

    if (!name || !email || !phone) {
      return NextResponse.json(
        { error: 'Missing required fields: name, email, phone' },
        { status: 400 }
      )
    }

    const sessions = await getSessions()
    const sessionIndex = sessions.findIndex(s => s.id === sessionId)

    if (sessionIndex === -1) {
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 404 }
      )
    }

    const visitor: OpenHouseVisitor = {
      id: crypto.randomUUID(),
      name,
      email,
      phone,
      workingWithAgent: workingWithAgent || '',
      hearAbout: hearAbout || '',
      preApproved: preApproved || '',
      customAnswers: customAnswers || {},
      signedInAt: new Date().toISOString()
    }

    sessions[sessionIndex].visitors.push(visitor)
    await saveSessions(sessions)

    // Fire-and-forget: sync visitor to SureSend CRM (don't block response)
    const session = sessions[sessionIndex]
    syncVisitorToSureSend(visitor, session.propertyAddress, session.mlsNumber)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to add visitor:', error)
    return NextResponse.json(
      { error: 'Failed to sign in visitor' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  try {
    const { sessionId } = await params
    const sessions = await getSessions()
    const filtered = sessions.filter(s => s.id !== sessionId)

    if (filtered.length === sessions.length) {
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 404 }
      )
    }

    await saveSessions(filtered)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to delete session:', error)
    return NextResponse.json(
      { error: 'Failed to delete session' },
      { status: 500 }
    )
  }
}
