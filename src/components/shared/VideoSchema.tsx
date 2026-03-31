interface VideoSchemaProps {
  videoId: string
  title?: string
  description?: string
  uploadDate?: string
}

const VideoSchema = ({
  videoId,
  title = 'Video',
  description = '',
  uploadDate = new Date().toISOString().split('T')[0]
}: VideoSchemaProps) => {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'VideoObject',
    name: title,
    description,
    thumbnailUrl: `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`,
    uploadDate,
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
