export interface PlaceItem {
  name: string
  type: string
  distance?: string
  distanceKm?: number
  rating?: number
  address?: string
  level?: string
}

export interface PlacesResponse {
  schools?: PlaceItem[]
  parks?: PlaceItem[]
  transit?: PlaceItem[]
  shopping?: PlaceItem[]
  dining?: PlaceItem[]
  healthcare?: PlaceItem[]
  [key: string]: PlaceItem[] | undefined
}

const PLACES_API_URL = `${process.env.NEXT_PUBLIC_API_URL || ''}/api/places`

class APIPlaces {
  async getPlaces(lat: number, lng: number): Promise<PlacesResponse> {
    const params = new URLSearchParams({
      lat: String(lat),
      long: String(lng),
    })
    try {
      const response = await fetch(`${PLACES_API_URL}?${params.toString()}`)
      if (!response.ok) return {}
      const data = await response.json()
      if (!data) return {}
      return this.normalizePlaces(data)
    } catch {
      return {}
    }
  }

  private normalizePlaces(raw: any): PlacesResponse {
    const result: PlacesResponse = {}

    if (raw.schools && Array.isArray(raw.schools)) {
      result.schools = raw.schools.map((s: any) => ({
        name: s.name || s.school_name || '',
        type: 'school',
        distance: this.formatDistance(s.distance || s.distanceKm),
        distanceKm: s.distance || s.distanceKm,
        rating: s.rating,
        level: s.level || s.type || s.grade || '',
      }))
    }

    if (raw.parks && Array.isArray(raw.parks)) {
      result.parks = raw.parks.map((p: any) => ({
        name: p.name || '',
        type: 'park',
        distance: this.formatDistance(p.distance || p.distanceKm),
        distanceKm: p.distance || p.distanceKm,
      }))
    }

    if (raw.transit && Array.isArray(raw.transit)) {
      result.transit = raw.transit.map((t: any) => ({
        name: t.name || '',
        type: 'transit',
        distance: this.formatDistance(t.distance || t.distanceKm),
        distanceKm: t.distance || t.distanceKm,
      }))
    }

    if (raw.shopping && Array.isArray(raw.shopping)) {
      result.shopping = raw.shopping.map((s: any) => ({
        name: s.name || '',
        type: 'shopping',
        distance: this.formatDistance(s.distance || s.distanceKm),
        distanceKm: s.distance || s.distanceKm,
        rating: s.rating,
      }))
    }

    if (raw.dining && Array.isArray(raw.dining)) {
      result.dining = raw.dining.map((d: any) => ({
        name: d.name || '',
        type: 'restaurant',
        distance: this.formatDistance(d.distance || d.distanceKm),
        distanceKm: d.distance || d.distanceKm,
        rating: d.rating,
      }))
    }

    if (raw.healthcare && Array.isArray(raw.healthcare)) {
      result.healthcare = raw.healthcare.map((h: any) => ({
        name: h.name || '',
        type: 'hospital',
        distance: this.formatDistance(h.distance || h.distanceKm),
        distanceKm: h.distance || h.distanceKm,
        rating: h.rating,
      }))
    }

    return result
  }

  private formatDistance(km: number | undefined): string {
    if (!km) return ''
    const miles = km * 0.621371
    if (miles < 0.1) return `${Math.round(miles * 5280)} ft`
    return `${miles.toFixed(1)} mi`
  }
}

const apiPlacesInstance = new APIPlaces()
export default apiPlacesInstance
