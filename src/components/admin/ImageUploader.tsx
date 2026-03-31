'use client'

import { useState, useRef, useCallback } from 'react'
import {
  Box,
  Typography,
  IconButton,
  LinearProgress,
  Stack,
  Tooltip,
  Alert
} from '@mui/material'
import CloudUploadIcon from '@mui/icons-material/CloudUpload'
import ContentCopyIcon from '@mui/icons-material/ContentCopy'
import AddPhotoAlternateIcon from '@mui/icons-material/AddPhotoAlternate'
import DeleteIcon from '@mui/icons-material/Delete'

interface UploadedImage {
  url: string
  filename: string
  size: number
}

interface ImageUploaderProps {
  images: UploadedImage[]
  onImagesChange: (images: UploadedImage[]) => void
  onInsert?: (markdown: string) => void
  onFirstUpload?: (url: string) => void
}

const ImageUploader = ({
  images,
  onImagesChange,
  onInsert,
  onFirstUpload
}: ImageUploaderProps) => {
  const [dragActive, setDragActive] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [copyFeedback, setCopyFeedback] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const hasUploaded = useRef(images.length > 0)

  const uploadFiles = useCallback(
    async (files: FileList | File[]) => {
      const fileArray = Array.from(files)
      if (fileArray.length === 0) return

      setError(null)
      setUploading(true)
      setUploadProgress(10)

      try {
        const formData = new FormData()
        fileArray.forEach(file => formData.append('files', file))

        setUploadProgress(30)

        const res = await fetch('/api/upload', {
          method: 'POST',
          body: formData
        })

        setUploadProgress(80)

        if (!res.ok) {
          const data = await res.json()
          throw new Error(data.error || 'Upload failed')
        }

        const data = await res.json()
        const newImages: UploadedImage[] = data.images

        // Auto-set first upload as featured image
        if (!hasUploaded.current && newImages.length > 0 && onFirstUpload) {
          onFirstUpload(newImages[0].url)
          hasUploaded.current = true
        }

        onImagesChange([...images, ...newImages])
        setUploadProgress(100)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Upload failed')
      } finally {
        setTimeout(() => {
          setUploading(false)
          setUploadProgress(0)
        }, 500)
      }
    },
    [images, onImagesChange, onFirstUpload]
  )

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
  }, [])

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      e.stopPropagation()
      setDragActive(false)
      if (e.dataTransfer.files.length > 0) {
        uploadFiles(e.dataTransfer.files)
      }
    },
    [uploadFiles]
  )

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files.length > 0) {
        uploadFiles(e.target.files)
        e.target.value = ''
      }
    },
    [uploadFiles]
  )

  const handleCopyMarkdown = useCallback(
    (image: UploadedImage) => {
      const markdown = `![${image.filename}](${image.url})`
      navigator.clipboard.writeText(markdown)
      setCopyFeedback(image.filename)
      setTimeout(() => setCopyFeedback(null), 2000)
    },
    []
  )

  const handleInsert = useCallback(
    (image: UploadedImage) => {
      if (onInsert) {
        onInsert(`![${image.filename}](${image.url})`)
      }
    },
    [onInsert]
  )

  const handleDelete = useCallback(
    async (image: UploadedImage) => {
      try {
        await fetch('/api/upload', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ filename: image.filename })
        })
      } catch {
        // Proceed with UI removal even if server delete fails
      }
      onImagesChange(images.filter(img => img.filename !== image.filename))
    },
    [images, onImagesChange]
  )

  const formatSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  return (
    <Box>
      {error && (
        <Alert severity="error" onClose={() => setError(null)} sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {/* Drop Zone */}
      <Box
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        sx={{
          border: '2px dashed',
          borderColor: dragActive ? 'primary.main' : 'divider',
          borderRadius: 2,
          p: 3,
          textAlign: 'center',
          cursor: 'pointer',
          bgcolor: dragActive ? 'action.hover' : 'transparent',
          transition: 'all 0.2s',
          '&:hover': {
            borderColor: 'primary.light',
            bgcolor: 'action.hover'
          }
        }}
      >
        <CloudUploadIcon sx={{ fontSize: 40, color: 'text.secondary', mb: 1 }} />
        <Typography variant="body1" color="text.secondary">
          Drag & drop images here or click to browse
        </Typography>
        <Typography variant="caption" color="text.disabled">
          JPEG, PNG, GIF, WebP, SVG — max 10MB each
        </Typography>
      </Box>

      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="image/jpeg,image/png,image/gif,image/webp,image/svg+xml"
        onChange={handleFileSelect}
        style={{ display: 'none' }}
      />

      {/* Upload Progress */}
      {uploading && (
        <Box sx={{ mt: 2 }}>
          <LinearProgress variant="determinate" value={uploadProgress} />
          <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5 }}>
            Uploading...
          </Typography>
        </Box>
      )}

      {/* Image Gallery */}
      {images.length > 0 && (
        <Stack spacing={1} sx={{ mt: 2 }}>
          {images.map(image => (
            <Box
              key={image.filename}
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1.5,
                p: 1,
                border: '1px solid',
                borderColor: 'divider',
                borderRadius: 1,
                '&:hover': { bgcolor: 'action.hover' }
              }}
            >
              {/* Thumbnail */}
              <Box
                component="img"
                src={image.url}
                alt={image.filename}
                sx={{
                  width: 56,
                  height: 56,
                  objectFit: 'cover',
                  borderRadius: 0.5,
                  flexShrink: 0
                }}
              />

              {/* Info */}
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography variant="body2" noWrap>
                  {image.filename}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {formatSize(image.size)}
                </Typography>
              </Box>

              {/* Actions */}
              <Stack direction="row" spacing={0.5}>
                <Tooltip title={copyFeedback === image.filename ? 'Copied!' : 'Copy markdown'}>
                  <IconButton size="small" onClick={() => handleCopyMarkdown(image)}>
                    <ContentCopyIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
                {onInsert && (
                  <Tooltip title="Insert into editor">
                    <IconButton size="small" onClick={() => handleInsert(image)}>
                      <AddPhotoAlternateIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                )}
                <Tooltip title="Delete">
                  <IconButton size="small" onClick={() => handleDelete(image)} color="error">
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              </Stack>
            </Box>
          ))}
        </Stack>
      )}
    </Box>
  )
}

export default ImageUploader
