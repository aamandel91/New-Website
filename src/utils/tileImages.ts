import { promises as fs } from 'fs'
import path from 'path'

import {
  exploreTileImages,
  lifestyleTileImages
} from '@/configs/defaults/tile-images'

import 'server-only'

export interface TileImages {
  explore: Record<string, string>
  lifestyle: Record<string, string>
}

const TILE_IMAGES_PATH = path.join(process.cwd(), 'data', 'tile-images.json')

export async function loadTileImages(): Promise<TileImages> {
  const defaults: TileImages = {
    explore: { ...exploreTileImages },
    lifestyle: { ...lifestyleTileImages }
  }
  try {
    const raw = await fs.readFile(TILE_IMAGES_PATH, 'utf-8')
    const saved = JSON.parse(raw)
    return {
      explore: { ...defaults.explore, ...saved.explore },
      lifestyle: { ...defaults.lifestyle, ...saved.lifestyle }
    }
  } catch {
    return defaults
  }
}

export async function saveTileImages(images: TileImages): Promise<void> {
  const dir = path.dirname(TILE_IMAGES_PATH)
  await fs.mkdir(dir, { recursive: true })
  await fs.writeFile(TILE_IMAGES_PATH, JSON.stringify(images, null, 2), 'utf-8')
}
