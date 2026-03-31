import { NextResponse } from 'next/server'
import { readFile, writeFile, mkdir } from 'fs/promises'
import path from 'path'
import crypto from 'crypto'

import type { OpenHouseSession } from '@/types/openHouse'

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

export async function GET() {
  try {
    const sessions = await getSessions()
    const sessionsWithoutVisitors = sessions.map(({ visitors, ...rest }) => ({
      ...rest,
      visitorCount: visitors.length
    }))
    return NextResponse.json({ sessions: sessionsWithoutVisitors })
  } catch (error) {
    console.error('Failed to get open house sessions:', error)
    return NextResponse.json(
      { error: 'Failed to get sessions' },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { mlsNumber, agentName, agentEmail, propertyAddress, propertyImage, propertyPrice } = body

    if (!mlsNumber || !agentName || !propertyAddress) {
      return NextResponse.json(
        { error: 'Missing required fields: mlsNumber, agentName, propertyAddress' },
        { status: 400 }
      )
    }

    const sessionId = crypto.randomUUID()
    const session: OpenHouseSession = {
      id: sessionId,
      mlsNumber,
      agentName,
      agentEmail: agentEmail || '',
      propertyAddress,
      propertyImage: propertyImage || '',
      propertyPrice: propertyPrice || '',
      createdAt: new Date().toISOString(),
      visitors: []
    }

    const sessions = await getSessions()
    sessions.push(session)
    await saveSessions(sessions)

    return NextResponse.json({
      sessionId,
      signInUrl: `/open-house/sign-in/${sessionId}`
    })
  } catch (error) {
    console.error('Failed to create open house session:', error)
    return NextResponse.json(
      { error: 'Failed to create session' },
      { status: 500 }
    )
  }
}
