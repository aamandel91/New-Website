import { NextResponse } from 'next/server'
import path from 'path'

import type { OpenHouseSession, OpenHouseVisitor } from '@/types/openHouse'

import { mkdir, readFile, writeFile } from 'fs/promises'

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

function visitorsToCsv(
  visitors: OpenHouseVisitor[],
  propertyAddress: string
): string {
  const headers = [
    'Name',
    'Email',
    'Phone',
    'Working With Agent',
    'How Did You Hear',
    'Pre-Approved',
    'Signed In At',
    'Property Address'
  ]

  const rows = visitors.map((v) => [
    v.name,
    v.email,
    v.phone,
    v.workingWithAgent,
    v.hearAbout,
    v.preApproved,
    v.signedInAt,
    propertyAddress
  ])

  const escape = (val: string) => {
    if (val.includes(',') || val.includes('"') || val.includes('\n')) {
      return `"${val.replace(/"/g, '""')}"`
    }
    return val
  }

  const lines = [headers.join(',')]
  for (const row of rows) {
    lines.push(row.map(escape).join(','))
  }

  return lines.join('\n')
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  try {
    const { sessionId } = await params
    const { searchParams } = new URL(request.url)
    const format = searchParams.get('format')

    const sessions = await getSessions()
    const session = sessions.find((s) => s.id === sessionId)

    if (!session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 })
    }

    if (format === 'csv') {
      const csv = visitorsToCsv(session.visitors, session.propertyAddress)
      return new NextResponse(csv, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="open-house-visitors-${sessionId}.csv"`
        }
      })
    }

    return NextResponse.json({ visitors: session.visitors })
  } catch (error) {
    console.error('Failed to get visitors:', error)
    return NextResponse.json(
      { error: 'Failed to get visitors' },
      { status: 500 }
    )
  }
}
