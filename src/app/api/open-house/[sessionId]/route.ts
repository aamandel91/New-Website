import { NextResponse } from 'next/server'
import { readFile, writeFile, mkdir } from 'fs/promises'
import path from 'path'
import crypto from 'crypto'

import type { OpenHouseSession, OpenHouseVisitor } from '@/types/openHouse'

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
