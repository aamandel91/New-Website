import { NextResponse } from 'next/server'
import { join } from 'path'

import { requireAdmin } from '@/utils/adminAuth'

import { readFile, writeFile } from 'fs/promises'

const CONFIG_PATH = join(process.cwd(), 'data', 'sidebar-config.json')

async function readConfig() {
  try {
    const raw = await readFile(CONFIG_PATH, 'utf-8')
    return JSON.parse(raw)
  } catch {
    return null
  }
}

export async function GET(request: Request) {
  const denied = await requireAdmin(request)
  if (denied) return denied

  const config = await readConfig()
  if (!config) {
    return NextResponse.json({ error: 'Config not found' }, { status: 404 })
  }
  return NextResponse.json(config)
}

export async function POST(request: Request) {
  const denied = await requireAdmin(request)
  if (denied) return denied

  try {
    const body = await request.json()
    await writeFile(CONFIG_PATH, JSON.stringify(body, null, 2), 'utf-8')
    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json(
      { error: 'Failed to save config' },
      { status: 500 }
    )
  }
}
