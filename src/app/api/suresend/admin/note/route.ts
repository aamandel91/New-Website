import { NextResponse } from 'next/server'

import { createNote } from '@/services/suresend/client'

export async function POST(request: Request) {
  try {
    const { personId, subject, body } = await request.json()

    if (!personId || !subject || !body) {
      return NextResponse.json(
        { error: 'Missing required fields: personId, subject, body' },
        { status: 400 }
      )
    }

    const result = await createNote(personId, subject, body)
    return NextResponse.json(result)
  } catch (error) {
    console.error('[SureSend] Admin note error:', error)
    return NextResponse.json(
      { error: 'Failed to create note' },
      { status: 502 }
    )
  }
}
