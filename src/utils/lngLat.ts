/**
 * Lightweight POJO replacements for mapbox-gl's `LngLat` and `LngLatBounds`.
 *
 * Mapbox's runtime accepts plain `[lng, lat]` arrays and `{ lng, lat }` objects
 * for most APIs, so these shims work as drop-in inputs anywhere mapbox-gl is
 * used. Keeping them here lets `utils/map.ts` (and its 18 importers) avoid
 * pulling the ~700KB mapbox-gl bundle into routes that don't render a map.
 *
 * The actual <MapRoot> / <HomeMap> / <PropertyLocation> components are loaded
 * via `next/dynamic({ ssr: false })`, so they get the real mapbox-gl runtime
 * when (and only when) a map is rendered.
 */

export type LngLatLike =
  | LngLat
  | [number, number]
  | { lng: number; lat: number }

const toLngLat = (input: LngLatLike): LngLat => {
  if (input instanceof LngLat) return input
  if (Array.isArray(input)) return new LngLat(input[0], input[1])
  return new LngLat(input.lng, input.lat)
}

export class LngLat {
  lng: number

  lat: number

  constructor(lng: number, lat: number) {
    this.lng = lng
    this.lat = lat
  }

  toArray(): [number, number] {
    return [this.lng, this.lat]
  }

  toString(): string {
    return `LngLat(${this.lng}, ${this.lat})`
  }

  /**
   * Great-circle distance in meters between two points (haversine formula).
   * Mirrors mapbox-gl's `LngLat.distanceTo()` API.
   */
  distanceTo(other: LngLatLike): number {
    const target = toLngLat(other)
    const EARTH_RADIUS_M = 6371008.8
    const toRad = (deg: number) => (deg * Math.PI) / 180
    const dLat = toRad(target.lat - this.lat)
    const dLng = toRad(target.lng - this.lng)
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos(toRad(this.lat)) *
        Math.cos(toRad(target.lat)) *
        Math.sin(dLng / 2) ** 2
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
    return EARTH_RADIUS_M * c
  }
}

export class LngLatBounds {
  private _sw: LngLat

  private _ne: LngLat

  constructor(sw: LngLatLike, ne: LngLatLike) {
    this._sw = toLngLat(sw)
    this._ne = toLngLat(ne)
  }

  getSouthWest(): LngLat {
    return this._sw
  }

  getNorthEast(): LngLat {
    return this._ne
  }

  getNorthWest(): LngLat {
    return new LngLat(this._sw.lng, this._ne.lat)
  }

  getSouthEast(): LngLat {
    return new LngLat(this._ne.lng, this._sw.lat)
  }

  getWest(): number {
    return this._sw.lng
  }

  getEast(): number {
    return this._ne.lng
  }

  getSouth(): number {
    return this._sw.lat
  }

  getNorth(): number {
    return this._ne.lat
  }

  getCenter(): LngLat {
    return new LngLat(
      (this._sw.lng + this._ne.lng) / 2,
      (this._sw.lat + this._ne.lat) / 2
    )
  }

  /**
   * Returns `[[swLng, swLat], [neLng, neLat]]` — the array form mapbox-gl
   * accepts as `LngLatBoundsLike`. Use this when passing our shim into a real
   * mapbox-gl API like `map.fitBounds()`.
   */
  toArray(): [[number, number], [number, number]] {
    return [
      [this._sw.lng, this._sw.lat],
      [this._ne.lng, this._ne.lat]
    ]
  }
}
