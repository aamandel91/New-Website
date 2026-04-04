import { promises as fs } from 'fs'
import path from 'path'
import { siteSettings as defaults } from '@/configs/defaults/site-settings'
import type { SiteSettings } from '@/configs/defaults/site-settings'

const SETTINGS_PATH = path.join(process.cwd(), 'data', 'site-settings.json')

export async function loadSiteSettings(): Promise<SiteSettings> {
  try {
    const raw = await fs.readFile(SETTINGS_PATH, 'utf-8')
    return { ...defaults, ...JSON.parse(raw) }
  } catch {
    return defaults
  }
}

export async function saveSiteSettings(settings: SiteSettings): Promise<void> {
  const dir = path.dirname(SETTINGS_PATH)
  await fs.mkdir(dir, { recursive: true })
  await fs.writeFile(SETTINGS_PATH, JSON.stringify(settings, null, 2), 'utf-8')
}
