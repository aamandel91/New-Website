interface VideoSchemaProps {
  videoId: string
  title?: string
  description?: string
  /**
   * ISO date the video was uploaded. Required for accurate VideoObject
   * schema — defaulting to "today" causes every page render to claim the
   * video was uploaded that day, which is incorrect. Optional: when absent
   * the `uploadDate` field is simply omitted from the emitted JSON-LD.
   */
  uploadDate?: string
}

const VideoSchema = ({
  videoId,
  title = 'Video',
  description = '',
  uploadDate
}: VideoSchemaProps) => {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'VideoObject',
    name: title,
    description,
    // `hqdefault.jpg` is guaranteed to exist for every YouTube video;
    // `maxresdefault.jpg` 404s on videos uploaded below 720p.
    thumbnailUrl: `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`,
    ...(uploadDate ? { uploadDate } : {}),
    contentUrl: `https://www.youtube.com/watch?v=${videoId}`,
    embedUrl: `https://www.youtube.com/embed/${videoId}`
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  )
}

export default VideoSchema
