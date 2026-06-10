import { v2 as cloudinary } from 'cloudinary'

// Initialize Cloudinary
cloudinary.config({
  cloud_name: process.env['CLOUDINARY_CLOUD_NAME'] || '',
  api_key: process.env['CLOUDINARY_API_KEY'] || '',
  api_secret: process.env['CLOUDINARY_API_SECRET'] || ''
})

export interface CloudinaryUploadResult {
  public_id: string
  url: string
  secure_url: string
  width: number
  height: number
  format: string
  bytes: number
}

export interface CloudinaryTransformUrl {
  url: string
  webpUrl: string
  thumbnailUrl: string
}

/**
 * Upload file to Cloudinary with automatic WebP conversion
 */
export async function uploadToCloudinary(
  fileBuffer: Buffer,
  fileName: string,
  folder: string = 'blog'
): Promise<CloudinaryUploadResult> {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        resource_type: 'auto',
        folder,
        public_id: `${Date.now()}-${fileName.split('.')[0]}`,
        quality: 'auto',
        fetch_format: 'auto', // Automatically optimize format (WebP for compatible browsers)
        flags: 'progressive', // Progressive loading for images
        eager: [
          {
            format: 'webp',
            quality: 'auto',
            fetch_format: 'webp'
          }
        ]
      },
      (error, result) => {
        if (error) reject(error)
        else resolve(result as CloudinaryUploadResult)
      }
    )

    uploadStream.end(fileBuffer)
  })
}

/**
 * Delete file from Cloudinary by public ID
 */
export async function deleteFromCloudinary(publicId: string): Promise<void> {
  return new Promise((resolve, reject) => {
    cloudinary.uploader.destroy(publicId, (error) => {
      if (error) reject(error)
      else resolve()
    })
  })
}

/**
 * Generate Cloudinary image URLs with transformations
 */
export function generateCloudinaryUrls(
  publicId: string
): CloudinaryTransformUrl {
  return {
    // Original image with WebP format for modern browsers
    url: cloudinary.url(publicId, {
      fetch_format: 'auto',
      quality: 'auto'
    }),
    // WebP format specifically
    webpUrl: cloudinary.url(publicId, {
      format: 'webp',
      quality: 'auto'
    }),
    // Thumbnail for listings (400x300)
    thumbnailUrl: cloudinary.url(publicId, {
      width: 400,
      height: 300,
      crop: 'fill',
      format: 'webp',
      quality: 'auto'
    })
  }
}

/**
 * Get optimized image URL for different use cases
 */
export function getOptimizedImageUrl(
  publicId: string,
  width?: number,
  height?: number,
  crop: string = 'fill'
): string {
  return cloudinary.url(publicId, {
    width,
    height,
    crop,
    fetch_format: 'auto',
    quality: 'auto',
    flags: 'progressive'
  })
}
