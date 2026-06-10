import { NextResponse } from 'next/server'

import { createTask } from '@/services/suresend/client'
import type { SureSendTaskType } from '@/services/suresend/types'

export async function POST(request: Request) {
  try {
    const { personId, name, type, dueDateTime } = (await request.json()) as {
      personId: string
      name: string
      type?: SureSendTaskType
      dueDateTime?: string
    }

    if (!personId || !name) {
      return NextResponse.json(
        { error: 'Missing required fields: personId, name' },
        { status: 400 }
      )
    }

    const result = await createTask(
      personId,
      name,
      type || 'follow_up',
      dueDateTime
    )
    return NextResponse.json(result)
  } catch (error) {
    console.error('[SureSend] Admin task error:', error)
    return NextResponse.json(
      { error: 'Failed to create task' },
      { status: 502 }
    )
  }
}
