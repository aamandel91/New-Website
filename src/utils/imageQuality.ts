import { type Property, type PropertyImageInsights } from 'services/API'

export interface EnhancedPhoto {
  url: string
  caption?: string
  order?: number
  quality?: number
  qualityLabel?: string
  roomType?: string
  roomConfidence?: number
}

/**
 * Sorts property images by quality score (highest first)
 * Falls back to original order if no quality data available
 */
export const sortImagesByQuality = (
  images: string[],
  imagesScore?: number[],
  imageInsights?: { images: PropertyImageInsights[] }
): EnhancedPhoto[] => {
  const photos: EnhancedPhoto[] = images.map((url, index) => {
    const photo: EnhancedPhoto = {
      url,
      order: index
    }

    // Add quality score if available
    if (imagesScore && imagesScore[index] !== undefined) {
      photo.quality = imagesScore[index]
    }

    // Add insights data if available
    if (imageInsights?.images) {
      const insight = imageInsights.images.find((img) => img.image === url)
      if (insight) {
        photo.quality = insight.quality?.quantitative || photo.quality
        photo.qualityLabel = insight.quality?.qualitative
        photo.roomType = insight.classification?.imageOf
        photo.roomConfidence = insight.classification?.prediction
      }
    }

    return photo
  })

  // Sort by quality (highest first), maintaining original order for equal quality
  return photos.sort((a, b) => {
    const qualityA = a.quality ?? -1
    const qualityB = b.quality ?? -1

    if (qualityA !== qualityB) {
      return qualityB - qualityA // Higher quality first
    }

    // If quality is equal, maintain original order
    return (a.order || 0) - (b.order || 0)
  })
}

/**
 * Groups images by room type based on AI classification
 * Useful for organizing property photos by room
 */
export const groupImagesByRoom = (
  images: string[],
  imageInsights?: { images: PropertyImageInsights[] }
): Record<string, EnhancedPhoto[]> => {
  const grouped: Record<string, EnhancedPhoto[]> = {
    'All Photos': []
  }

  images.forEach((url, index) => {
    const photo: EnhancedPhoto = {
      url,
      order: index
    }

    if (imageInsights?.images) {
      const insight = imageInsights.images.find((img) => img.image === url)
      if (insight) {
        photo.quality = insight.quality?.quantitative
        photo.qualityLabel = insight.quality?.qualitative
        photo.roomType = insight.classification?.imageOf
        photo.roomConfidence = insight.classification?.prediction

        // Group by room type if confidence is high enough
        if (
          photo.roomType &&
          photo.roomConfidence &&
          photo.roomConfidence > 0.7
        ) {
          const roomLabel = formatRoomType(photo.roomType)
          if (!grouped[roomLabel]) {
            grouped[roomLabel] = []
          }
          grouped[roomLabel].push(photo)
        }
      }
    }

    grouped['All Photos'].push(photo)
  })

  // Sort each group by quality
  Object.keys(grouped).forEach((room) => {
    grouped[room].sort((a, b) => {
      const qualityA = a.quality ?? -1
      const qualityB = b.quality ?? -1
      return qualityB - qualityA
    })
  })

  return grouped
}

/**
 * Formats room type strings for display
 */
export const formatRoomType = (roomType: string): string => {
  const roomMap: Record<string, string> = {
    kitchen: 'Kitchen',
    'living room': 'Living Room',
    bedroom: 'Bedrooms',
    bathroom: 'Bathrooms',
    dining: 'Dining Room',
    exterior: 'Exterior',
    'front of structure': 'Exterior',
    pool: 'Pool & Outdoor',
    backyard: 'Backyard',
    garage: 'Garage'
  }

  return roomMap[roomType.toLowerCase()] || roomType
}

/**
 * Gets the best quality photo for use as hero image
 */
export const getHeroPhoto = (property: Property): string | undefined => {
  if (!property.images || property.images.length === 0) {
    return undefined
  }

  const sortedPhotos = sortImagesByQuality(
    property.images,
    property.imagesScore,
    property.imageInsights
  )

  return sortedPhotos[0]?.url
}

/**
 * Filters images by quality threshold
 */
export const filterImagesByQuality = (
  photos: EnhancedPhoto[],
  minQuality: number = 0.5
): EnhancedPhoto[] => {
  return photos.filter((photo) => {
    if (photo.quality === undefined) return true // Keep photos with no quality score
    return photo.quality >= minQuality
  })
}
