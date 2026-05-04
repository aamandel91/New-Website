import { error, success } from '@configs/colors'

const whiteColor = '#fff'
const fillOpacity = 0.2
const strokeOpacityHex = 'B3' // ~70% alpha as hex suffix

const lineWidth = 1.8
const pointRadius = 7
const midpointRadius = 5

// Shape color is determined per-feature by `properties.zoneType`. `case`
// expressions let MapboxDraw render include zones in green and exclude
// zones in red within the same draw layer.
const fillColor: any = [
  'case',
  ['==', ['get', 'user_zoneType'], 'exclude'],
  error,
  success
]

const lineColor: any = [
  'case',
  ['==', ['get', 'user_zoneType'], 'exclude'],
  error,
  success
]

const customStyles = [
  {
    id: 'gl-draw-polygon-fill-inactive',
    type: 'fill',
    filter: [
      'all',
      ['==', 'active', 'false'],
      ['==', '$type', 'Polygon'],
      ['!=', 'mode', 'static']
    ],
    paint: {
      'fill-color': fillColor,
      'fill-outline-color': fillColor,
      'fill-opacity': fillOpacity
    }
  },
  {
    id: 'gl-draw-polygon-fill-active',
    type: 'fill',
    filter: ['all', ['==', 'active', 'true'], ['==', '$type', 'Polygon']],
    paint: {
      'fill-color': fillColor,
      'fill-outline-color': fillColor,
      'fill-opacity': fillOpacity + 0.05
    }
  },
  {
    id: 'gl-draw-polygon-stroke-inactive',
    type: 'line',
    filter: [
      'all',
      ['==', 'active', 'false'],
      ['==', '$type', 'Polygon'],
      ['!=', 'mode', 'static']
    ],
    layout: {
      'line-cap': 'round',
      'line-join': 'round'
    },
    paint: {
      'line-color': lineColor,
      'line-width': lineWidth,
      'line-opacity': 0.7
    }
  },
  {
    id: 'gl-draw-polygon-stroke-active',
    type: 'line',
    filter: ['all', ['==', 'active', 'true'], ['==', '$type', 'Polygon']],
    layout: {
      'line-cap': 'round',
      'line-join': 'round'
    },
    paint: {
      'line-color': lineColor,
      'line-width': lineWidth,
      'line-opacity': 0.9
    }
  },
  {
    id: 'gl-draw-line-inactive',
    type: 'line',
    filter: ['all', ['==', '$type', 'LineString'], ['!=', 'mode', 'static']],
    layout: {
      'line-cap': 'round',
      'line-join': 'round'
    },
    paint: {
      'line-color': lineColor,
      'line-width': lineWidth
    }
  },
  {
    id: 'gl-draw-polygon-midpoint-halo',
    type: 'circle',
    filter: ['all', ['==', '$type', 'Point'], ['==', 'meta', 'midpoint']],
    paint: {
      'circle-radius': 5,
      'circle-color': lineColor
    }
  },
  {
    id: 'gl-draw-polygon-midpoint',
    type: 'circle',
    filter: ['all', ['==', '$type', 'Point'], ['==', 'meta', 'midpoint']],
    paint: {
      'circle-radius': 3.5,
      'circle-color': whiteColor
    }
  },
  {
    id: 'gl-draw-polygon-and-line-vertex-stroke-inactive',
    type: 'circle',
    filter: [
      'all',
      ['==', 'meta', 'vertex'],
      ['==', '$type', 'Point'],
      ['!=', 'mode', 'static']
    ],
    paint: {
      'circle-radius': pointRadius,
      'circle-color': lineColor
    }
  },
  {
    id: 'gl-draw-polygon-and-line-vertex-inactive',
    type: 'circle',
    filter: [
      'all',
      ['==', 'meta', 'vertex'],
      ['==', '$type', 'Point'],
      ['!=', 'mode', 'static']
    ],
    paint: {
      'circle-radius': pointRadius - lineWidth,
      'circle-color': whiteColor
    }
  },
  {
    id: 'gl-draw-point-point-stroke-inactive',
    type: 'circle',
    filter: [
      'all',
      ['==', 'active', 'false'],
      ['==', '$type', 'Point'],
      ['==', 'meta', 'feature'],
      ['!=', 'mode', 'static']
    ],
    paint: {
      'circle-radius': midpointRadius,
      'circle-opacity': 1,
      'circle-color': whiteColor
    }
  },
  {
    id: 'gl-draw-point-inactive',
    type: 'circle',
    filter: [
      'all',
      ['==', 'active', 'false'],
      ['==', '$type', 'Point'],
      ['==', 'meta', 'feature'],
      ['!=', 'mode', 'static']
    ],
    paint: {
      'circle-radius': midpointRadius - lineWidth,
      'circle-color': lineColor
    }
  },
  {
    id: 'gl-draw-point-stroke-active',
    type: 'circle',
    filter: [
      'all',
      ['==', '$type', 'Point'],
      ['==', 'active', 'true'],
      ['!=', 'meta', 'midpoint']
    ],
    paint: {
      'circle-radius': pointRadius,
      'circle-color': whiteColor
    }
  },
  {
    id: 'gl-draw-point-active',
    type: 'circle',
    filter: [
      'all',
      ['==', '$type', 'Point'],
      ['!=', 'meta', 'midpoint'],
      ['==', 'active', 'true']
    ],
    paint: {
      'circle-radius': pointRadius - lineWidth,
      'circle-color': lineColor
    }
  }
]

// `strokeOpacityHex` retained for callers that want a fixed alpha-suffixed hex.
void strokeOpacityHex

export default customStyles
