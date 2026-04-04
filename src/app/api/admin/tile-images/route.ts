import { NextResponse } from 'next/server'
import { loadTileImages, saveTileImages } from '@/utils/tileImages'
import type { TileImages } from '@/utils/tileImages'

export async function GET() {
  try {
    const images = await loadTileImages()
    return NextResponse.json(images)
  } catch (error) {
    console.error('[TileImages] Failed to load:', error)
    return NextResponse.json({ error: 'Failed to load tile images' }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  try {
    const body = (await request.json()) as TileImages
    await saveTileImages(body)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[TileImages] Failed to save:', error)
    return NextResponse.json({ error: 'Failed to save tile images' }, { status: 500 })
  }
}
