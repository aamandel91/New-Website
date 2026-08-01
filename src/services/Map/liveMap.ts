// Dependency-free registry for the live mapbox map instance.
//
// Search and the site-wide Header need to reach the map singleton when it
// exists, but importing (even dynamically) anything that touches the
// 'services/Map' barrel registers the mapbox-gl runtime (~420KB) as a client
// entry on EVERY route. This module has a type-only mapbox import, so it costs
// nothing in the bundle: MapService.setMap/removeMap write here, consumers
// read via getLiveMap(). It is null everywhere except real map pages.
import type { Map } from 'mapbox-gl'

let liveMap: Map | null = null

export const setLiveMap = (map: Map | null): void => {
  liveMap = map
}

export const getLiveMap = (): Map | null => liveMap
