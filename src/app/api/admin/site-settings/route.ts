import { NextResponse } from 'next/server'
import { loadSiteSettings, saveSiteSettings } from '@/utils/siteSettings'
import type { SiteSettings } from '@/configs/defaults/site-settings'

export async function GET() {
  try {
    const settings = await loadSiteSettings()
    return NextResponse.json(settings)
  } catch (error) {
    console.error('[SiteSettings] Failed to load:', error)
    return NextResponse.json({ error: 'Failed to load settings' }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  try {
    const body = (await request.json()) as SiteSettings
    await saveSiteSettings(body)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[SiteSettings] Failed to save:', error)
    return NextResponse.json({ error: 'Failed to save settings' }, { status: 500 })
  }
}
