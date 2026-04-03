import { promises as fs } from 'fs'
import path from 'path'

export interface PropertyIndexEntry {
  slug: string
  status: 'active' | 'sold' | 'pending' | 'off-market'
  lastUpdated: string
  score: number
  indexDirective: string
  mlsNumber?: string
  soldPrice?: number
  soldDate?: string
}

const INDEX_PATH = path.join(process.cwd(), 'data', 'property-index.json')

export async function loadPropertyIndex(): Promise<PropertyIndexEntry[]> {
  try {
    const raw = await fs.readFile(INDEX_PATH, 'utf-8')
    return JSON.parse(raw) as PropertyIndexEntry[]
  } catch {
    return []
  }
}

export async function savePropertyIndex(entries: PropertyIndexEntry[]): Promise<void> {
  const dir = path.dirname(INDEX_PATH)
  await fs.mkdir(dir, { recursive: true })
  await fs.writeFile(INDEX_PATH, JSON.stringify(entries, null, 2), 'utf-8')
}

export async function addToPropertyIndex(entry: PropertyIndexEntry): Promise<void> {
  const entries = await loadPropertyIndex()
  const existing = entries.findIndex((e) => e.slug === entry.slug)
  if (existing >= 0) {
    entries[existing] = entry
  } else {
    entries.push(entry)
  }
  await savePropertyIndex(entries)
}
