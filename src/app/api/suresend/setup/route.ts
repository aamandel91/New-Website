import { NextResponse } from 'next/server'

import { createCustomField, listCustomFields } from '@/services/suresend/client'
import type { SureSendCustomFieldInput } from '@/services/suresend/types'

const REQUIRED_FIELDS: SureSendCustomFieldInput[] = [
  {
    name: 'property_interest_type',
    type: 'dropdown',
    options: [
      'Single Family',
      'Condo',
      'Townhouse',
      'Villa',
      'Multi-Family',
      'Land',
      'Luxury',
      'Other'
    ]
  },
  { name: 'budget_min', type: 'number' },
  { name: 'budget_max', type: 'number' },
  { name: 'preferred_cities', type: 'text' },
  {
    name: 'pre_approved',
    type: 'dropdown',
    options: ['Yes', 'No', 'Not Yet']
  },
  {
    name: 'working_with_agent',
    type: 'dropdown',
    options: ['Yes', 'No']
  },
  { name: 'lead_source_page', type: 'text' }
]

export async function GET() {
  try {
    // Get existing custom fields
    const existing = await listCustomFields()
    const existingNames = new Set(existing.data.map((f) => f.name))

    const created: string[] = []
    const skipped: string[] = []

    for (const field of REQUIRED_FIELDS) {
      if (existingNames.has(field.name)) {
        skipped.push(field.name)
        continue
      }
      await createCustomField(field)
      created.push(field.name)
    }

    return NextResponse.json({
      success: true,
      created,
      skipped,
      message: `Created ${created.length} field(s), skipped ${skipped.length} existing field(s).`
    })
  } catch (error) {
    console.error('[SureSend] Setup route error:', error)
    return NextResponse.json(
      { error: 'Failed to set up custom fields' },
      { status: 502 }
    )
  }
}
