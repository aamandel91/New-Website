import { NextResponse } from 'next/server'

import type { SiteSettings } from '@/configs/defaults/site-settings'
import { requireAdmin } from '@/utils/adminAuth'
import { loadSiteSettings, saveSiteSettings } from '@/utils/siteSettings'

export async function GET(request: Request) {
  const denied = await requireAdmin(request)
  if (denied) return denied

  try {
    const settings = await loadSiteSettings()
    return NextResponse.json(settings)
  } catch (error) {
    console.error('[SiteSettings] Failed to load:', error)
    return NextResponse.json(
      { error: 'Failed to load settings' },
      { status: 500 }
    )
  }
}

export async function PUT(request: Request) {
  const denied = await requireAdmin(request)
  if (denied) return denied

  try {
    const body = (await request.json()) as SiteSettings
    await saveSiteSettings(body)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[SiteSettings] Failed to save:', error)
    return NextResponse.json(
      { error: 'Failed to save settings' },
      { status: 500 }
    )
  }
}
