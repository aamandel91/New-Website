import { NextResponse } from 'next/server'

import { createEvent } from '@/services/suresend/client'
import type { SureSendEventType } from '@/services/suresend/types'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { type, personId, email, property, propertySearch, metadata } =
      body as {
        type: SureSendEventType
        personId?: string
        email?: string
        property?: {
          mlsNumber?: string
          address?: string
          price?: number
          propertyType?: string
        }
        propertySearch?: {
          query?: string
          filters?: Record<string, string | number | boolean>
          resultCount?: number
        }
        metadata?: Record<string, string | number | boolean>
      }

    if (!type) {
      return NextResponse.json(
        { error: 'Missing required field: type' },
        { status: 400 }
      )
    }

    const result = await createEvent({
      type,
      personId,
      email,
      property,
      propertySearch,
      metadata
    })

    return NextResponse.json(result)
  } catch (error) {
    console.error('[SureSend] Event route error:', error)
    return NextResponse.json(
      { error: 'Failed to create event' },
      { status: 502 }
    )
  }
}
