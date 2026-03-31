import { NextResponse } from 'next/server'
import { readFile, writeFile } from 'fs/promises'
import path from 'path'

const ROBOTS_PATH = path.join(process.cwd(), 'public', 'robots.txt')

export async function GET() {
  try {
    const content = await readFile(ROBOTS_PATH, 'utf-8')
    return NextResponse.json({ content })
  } catch (err) {
    console.error('Failed to read robots.txt:', err)
    return NextResponse.json(
      { error: 'Failed to read robots.txt' },
      { status: 500 }
    )
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json()
    const { content } = body

    if (!content || typeof content !== 'string' || content.trim().length === 0) {
      return NextResponse.json(
        { error: 'Content must be a non-empty string' },
        { status: 400 }
      )
    }

    if (!content.includes('User-agent')) {
      return NextResponse.json(
        { error: 'robots.txt must contain at least one "User-agent" directive' },
        { status: 400 }
      )
    }

    await writeFile(ROBOTS_PATH, content, 'utf-8')

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('Failed to write robots.txt:', err)
    return NextResponse.json(
      { error: 'Failed to write robots.txt' },
      { status: 500 }
    )
  }
}
