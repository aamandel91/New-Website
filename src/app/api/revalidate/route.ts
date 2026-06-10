import { revalidateTag } from 'next/cache'
import { NextResponse } from 'next/server'

const ALLOWED_TAGS = new Set(['sitemap-pages'])

export async function POST(request: Request) {
  const url = new URL(request.url)
  const tag = url.searchParams.get('tag')
  if (!tag || !ALLOWED_TAGS.has(tag)) {
    return NextResponse.json(
      { error: `tag must be one of: ${Array.from(ALLOWED_TAGS).join(', ')}` },
      { status: 400 }
    )
  }

  // Authorize either by shared secret (for external/server callers) or by
  // same-origin requests (admin browser triggering after a publish).
  const provided = request.headers.get('x-revalidate-secret')
  const secret = process.env.REVALIDATE_SECRET
  const hasValidSecret = secret && provided === secret

  let isSameOrigin = false
  const origin = request.headers.get('origin')
  if (origin) {
    try {
      isSameOrigin = new URL(origin).host === url.host
    } catch {
      isSameOrigin = false
    }
  }

  if (!hasValidSecret && !isSameOrigin) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }

  revalidateTag(tag)
  return NextResponse.json({ revalidated: true, tag })
}
