import { NextResponse } from 'next/server'
import { existsSync } from 'fs'
import path from 'path'

import { mkdir, unlink, writeFile } from 'fs/promises'

const ALLOWED_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'image/svg+xml'
])

const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB

const UPLOAD_DIR = path.join(process.cwd(), 'public', 'uploads', 'blog')

function generateFilename(originalName: string): string {
  const ext = path.extname(originalName).toLowerCase()
  const base = path
    .basename(originalName, ext)
    .replace(/[^a-zA-Z0-9-_]/g, '-')
    .substring(0, 50)
  const timestamp = Date.now()
  const random = Math.random().toString(36).substring(2, 8)
  return `${base}-${timestamp}-${random}${ext}`
}

export async function POST(request: Request) {
  try {
    if (!existsSync(UPLOAD_DIR)) {
      await mkdir(UPLOAD_DIR, { recursive: true })
    }

    const formData = await request.formData()
    const files = formData.getAll('files')

    if (files.length === 0) {
      return NextResponse.json({ error: 'No files provided' }, { status: 400 })
    }

    const images: Array<{
      url: string
      filename: string
      size: number
    }> = []

    for (const file of files) {
      if (!(file instanceof File)) {
        continue
      }

      if (!ALLOWED_TYPES.has(file.type)) {
        return NextResponse.json(
          {
            error: `Invalid file type: ${file.type}. Allowed: jpeg, png, gif, webp, svg`
          },
          { status: 400 }
        )
      }

      if (file.size > MAX_FILE_SIZE) {
        return NextResponse.json(
          { error: `File "${file.name}" exceeds 10MB limit` },
          { status: 400 }
        )
      }

      const filename = generateFilename(file.name)
      const filepath = path.join(UPLOAD_DIR, filename)
      const buffer = Buffer.from(await file.arrayBuffer())

      await writeFile(filepath, buffer)

      images.push({
        url: `/uploads/blog/${filename}`,
        filename,
        size: file.size
      })
    }

    return NextResponse.json({ images })
  } catch (err) {
    console.error('Upload error:', err)
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  try {
    const { filename } = await request.json()

    if (!filename || typeof filename !== 'string') {
      return NextResponse.json(
        { error: 'Filename is required' },
        { status: 400 }
      )
    }

    // Prevent directory traversal
    const safeName = path.basename(filename)
    const filepath = path.join(UPLOAD_DIR, safeName)

    if (!existsSync(filepath)) {
      return NextResponse.json({ error: 'File not found' }, { status: 404 })
    }

    await unlink(filepath)
    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('Delete error:', err)
    return NextResponse.json({ error: 'Delete failed' }, { status: 500 })
  }
}
