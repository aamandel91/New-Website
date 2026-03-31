/**
 * YouTube URL detection and extraction utilities for markdown content.
 *
 * Detects patterns:
 *   https://www.youtube.com/watch?v=VIDEO_ID
 *   https://youtube.com/watch?v=VIDEO_ID
 *   https://youtu.be/VIDEO_ID
 *   https://www.youtube.com/embed/VIDEO_ID
 */

const YOUTUBE_REGEX =
  /https?:\/\/(?:www\.)?(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([\w-]{11})(?:[&?][\w=&-]*)?/g

const YOUTUBE_SINGLE_REGEX =
  /https?:\/\/(?:www\.)?(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([\w-]{11})(?:[&?][\w=&-]*)?/

/**
 * Extract the video ID from a YouTube URL.
 * Returns null if the URL is not a valid YouTube URL.
 */
export function extractYouTubeVideoId(url: string): string | null {
  const match = url.match(YOUTUBE_SINGLE_REGEX)
  return match ? match[1] : null
}

/**
 * Get all unique YouTube video IDs from markdown content.
 */
export function getYouTubeVideoIds(content: string): string[] {
  const ids = new Set<string>()
  let match: RegExpExecArray | null

  // Reset lastIndex for global regex
  YOUTUBE_REGEX.lastIndex = 0
  while ((match = YOUTUBE_REGEX.exec(content)) !== null) {
    ids.add(match[1])
  }

  return Array.from(ids)
}

/**
 * Replace bare YouTube URLs in markdown content with a placeholder token
 * that can be used for component rendering.
 *
 * Only replaces URLs that appear on their own line (not inside links or images).
 * Returns the processed content and the list of video IDs found.
 */
export function processYouTubeUrls(content: string): {
  processedContent: string
  videoIds: string[]
} {
  const videoIds: string[] = []
  const seen = new Set<string>()

  // Match YouTube URLs that are on their own line (not in markdown links/images)
  const lineRegex =
    /^(https?:\/\/(?:www\.)?(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([\w-]{11})(?:[&?][\w=&-]*)?)$/gm

  const processedContent = content.replace(lineRegex, (_match, _url, videoId) => {
    if (!seen.has(videoId)) {
      seen.add(videoId)
      videoIds.push(videoId)
    }
    return `%%YOUTUBE:${videoId}%%`
  })

  return { processedContent, videoIds }
}

/**
 * Split processed markdown content into segments: text segments and YouTube
 * video placeholders. This is used by the renderer to interleave markdown
 * text with YouTubeFacade components.
 */
export function splitContentByYouTube(
  processedContent: string
): Array<{ type: 'text'; content: string } | { type: 'youtube'; videoId: string }> {
  const parts = processedContent.split(/(%%YOUTUBE:[\w-]{11}%%)/)
  const segments: Array<
    { type: 'text'; content: string } | { type: 'youtube'; videoId: string }
  > = []

  for (const part of parts) {
    const ytMatch = part.match(/^%%YOUTUBE:([\w-]{11})%%$/)
    if (ytMatch) {
      segments.push({ type: 'youtube', videoId: ytMatch[1] })
    } else if (part.trim()) {
      segments.push({ type: 'text', content: part })
    }
  }

  return segments
}
