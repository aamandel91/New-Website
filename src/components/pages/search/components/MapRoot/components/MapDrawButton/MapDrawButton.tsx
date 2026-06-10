'use client'

import { useEffect, useRef } from 'react'
import { type GeoJSON, type Position } from 'geojson'

import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline'
import RemoveCircleOutlineIcon from '@mui/icons-material/RemoveCircleOutline'
import { alpha, Box, Button, Stack, Tooltip } from '@mui/material'

import { error as errorColor, success as successColor } from '@configs/colors'
import MapboxDraw from '@mapbox/mapbox-gl-draw'

import { useMapOptions } from 'providers/MapOptionsProvider'
import { useSearch } from 'providers/SearchProvider'
import { useUser } from 'providers/UserProvider'
import useClientSide from 'hooks/useClientSide'
import { type PolygonZone, removePolygon, removeZonesLayers } from 'utils/map'

import './styles.css'
import drawStyles from './styles'

const includeWelcomeTitle = 'Click to draw an INCLUDE area (results inside)'
const excludeWelcomeTitle = 'Click to draw an EXCLUDE area (results outside)'
const polygonSelectTitle = 'Click inside a polygon to edit it'
const vertexEditModeTitle = 'Click on points to edit them'
const buttonTooltip = 'This feature is available for registered users only.'

const MapDrawButton = ({
  onChange
}: {
  onChange?: (zones: PolygonZone[]) => void
}) => {
  const { logged } = useUser()
  const clientSide = useClientSide()
  const mapDrawRef = useRef<MapboxDraw | null>(null)
  const { polygons, setPolygons } = useSearch()
  const { setTitle, editMode, setEditMode, clearEditMode } = useMapOptions()
  const { mapRef } = useMapOptions()
  const map = mapRef.current

  // Track latest zones in a ref so the draw callbacks don't capture stale state
  const polygonsRef = useRef<PolygonZone[]>(polygons)
  useEffect(() => {
    polygonsRef.current = polygons
  }, [polygons])

  const drawIncludeMode = editMode === 'draw-include'
  const drawExcludeMode = editMode === 'draw-exclude'
  const drawMode = drawIncludeMode || drawExcludeMode || editMode === 'draw'

  const tooltipTitle = clientSide && !logged ? buttonTooltip : ''

  const disableMarkerEvents = () =>
    map?.getContainer().classList.add('disable-pointer-events')

  const enableMarkerEvents = () =>
    map?.getContainer().classList.remove('disable-pointer-events')

  // Read all features from the draw control and convert them to PolygonZone[].
  const collectZones = (): PolygonZone[] => {
    const features = mapDrawRef.current?.getAll().features || []
    const zones: PolygonZone[] = []
    for (const f of features) {
      if (f.geometry?.type !== 'Polygon') continue
      const ring = (f.geometry as GeoJSON.Polygon).coordinates[0] as Position[]
      if (!ring || ring.length < 3) continue
      // Drop the closing duplicate point if present, to keep coords compact.
      const coords =
        ring.length > 1 &&
        ring[0][0] === ring[ring.length - 1][0] &&
        ring[0][1] === ring[ring.length - 1][1]
          ? ring.slice(0, -1)
          : ring
      const zoneType =
        (f.properties as any)?.zoneType === 'exclude' ? 'exclude' : 'include'
      zones.push({ coords, type: zoneType })
    }
    return zones
  }

  const flushZones = () => {
    enableMarkerEvents()
    const zones = collectZones()
    setTitle(polygonSelectTitle)
    disableMarkerEvents()
    if (map) {
      removePolygon(map)
      // Static rendered zones are handled by MapRoot; clear them while
      // mapbox-draw owns the rendering during edit.
      removeZonesLayers(map)
    }
    setPolygons(zones)
    onChange?.(zones)
  }

  const onDrawCreate = (e: any) => {
    const feature = e.features?.[0]
    if (feature && mapDrawRef.current) {
      const zoneType = editMode === 'draw-exclude' ? 'exclude' : 'include'
      mapDrawRef.current.setFeatureProperty(feature.id, 'zoneType', zoneType)
    }
    flushZones()
  }

  const onDrawUpdate = () => flushZones()
  const onDrawDelete = () => flushZones()

  const enterDrawMode = (zoneType: 'include' | 'exclude') => {
    if (!map) return
    if (!mapDrawRef.current) {
      const mapDraw = new MapboxDraw({
        displayControlsDefault: false,
        controls: { polygon: false, trash: false },
        defaultMode: 'draw_polygon',
        clickBuffer: 15,
        touchBuffer: 15,
        styles: drawStyles,
        userProperties: true
      })

      disableMarkerEvents()

      // Hide the static multi-zone rendering while mapbox-draw owns the layers
      removeZonesLayers(map)
      removePolygon(map)

      map.addControl(mapDraw)
      mapDrawRef.current = mapDraw

      // Seed mapbox-draw with the zones already in state so the user can
      // edit/delete them without losing prior shapes.
      for (const z of polygonsRef.current) {
        const ring =
          z.coords.length &&
          (z.coords[0][0] !== z.coords[z.coords.length - 1][0] ||
            z.coords[0][1] !== z.coords[z.coords.length - 1][1])
            ? [...z.coords, z.coords[0]]
            : z.coords
        mapDraw.add({
          type: 'Feature',
          properties: { zoneType: z.type },
          geometry: { type: 'Polygon', coordinates: [ring] }
        } as any)
      }

      map.on('draw.create', onDrawCreate)
      map.on('draw.update', onDrawUpdate)
      map.on('draw.delete', onDrawDelete)

      map.on('draw.selectionchange', (data: any) => {
        if (data.features.length) {
          disableMarkerEvents()
          setTitle(vertexEditModeTitle)
        } else {
          enableMarkerEvents()
          setTitle(polygonSelectTitle)
        }
      })
    } else {
      // already mounted — just (re)enter draw mode for new shape
      mapDrawRef.current.changeMode('draw_polygon')
    }
    void zoneType
  }

  const exitDrawMode = () => {
    enableMarkerEvents()
    if (!map || !mapDrawRef.current) return

    // Snapshot zones once more before tearing down (in case of pending
    // unsaved drawing — mapbox-draw drops in-progress shapes silently).
    const finalZones = collectZones()

    map.off('draw.create', onDrawCreate)
    map.off('draw.update', onDrawUpdate)
    map.off('draw.delete', onDrawDelete)

    map.removeControl(mapDrawRef.current)
    mapDrawRef.current = null

    if (
      finalZones.length !== polygonsRef.current.length ||
      JSON.stringify(finalZones) !== JSON.stringify(polygonsRef.current)
    ) {
      setPolygons(finalZones)
      onChange?.(finalZones)
    }
  }

  const handleDrawClick = (zoneType: 'include' | 'exclude') => () => {
    const targetMode = zoneType === 'exclude' ? 'draw-exclude' : 'draw-include'
    const isAlreadyInTarget = editMode === targetMode

    if (isAlreadyInTarget) {
      setTitle(null)
      clearEditMode()
      return
    }

    setTitle(zoneType === 'exclude' ? excludeWelcomeTitle : includeWelcomeTitle)
    setEditMode(targetMode)
  }

  useEffect(() => {
    if (editMode === 'draw-include' || editMode === 'draw' /* legacy */) {
      enterDrawMode('include')
    } else if (editMode === 'draw-exclude') {
      enterDrawMode('exclude')
    } else {
      exitDrawMode()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editMode])

  // When zones change externally (e.g. removed via the panel), if we're in
  // draw mode, sync the draw control's features.
  useEffect(() => {
    if (!mapDrawRef.current) return
    const draw = mapDrawRef.current
    const current = collectZones()
    if (JSON.stringify(current) === JSON.stringify(polygons)) return

    draw.deleteAll()
    for (const z of polygons) {
      const ring =
        z.coords.length &&
        (z.coords[0][0] !== z.coords[z.coords.length - 1][0] ||
          z.coords[0][1] !== z.coords[z.coords.length - 1][1])
          ? [...z.coords, z.coords[0]]
          : z.coords
      draw.add({
        type: 'Feature',
        properties: { zoneType: z.type },
        geometry: { type: 'Polygon', coordinates: [ring] }
      } as any)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [polygons])

  const baseSx = (active: boolean, color: string) => ({
    p: 0.75,
    width: 36,
    height: 36,
    minWidth: 0,
    backdropFilter: 'blur(4px)',
    color: active ? 'common.white' : color,
    bgcolor: active ? alpha(color, 0.85) : alpha('#FFFFFF', 0.7),
    '&:hover': {
      bgcolor: active ? alpha(color, 0.95) : alpha('#FFFFFF', 0.9)
    }
  })

  return (
    <Tooltip title={tooltipTitle} arrow placement="top-end">
      <Box
        sx={{
          right: 16,
          bottom: 159,
          zIndex: 'fab',
          position: 'absolute',
          display: { xs: 'none', sm: 'block' }
        }}
      >
        <Stack direction="column" spacing={1}>
          <Tooltip title="Draw an area to include" arrow placement="left">
            <span>
              <Button
                disabled={!clientSide || !logged}
                onClick={handleDrawClick('include')}
                sx={{ ...baseSx(drawIncludeMode, successColor), boxShadow: 1 }}
              >
                <AddCircleOutlineIcon sx={{ fontSize: 22 }} />
              </Button>
            </span>
          </Tooltip>
          <Tooltip title="Draw an area to exclude" arrow placement="left">
            <span>
              <Button
                disabled={!clientSide || !logged}
                onClick={handleDrawClick('exclude')}
                sx={{ ...baseSx(drawExcludeMode, errorColor), boxShadow: 1 }}
              >
                <RemoveCircleOutlineIcon sx={{ fontSize: 22 }} />
              </Button>
            </span>
          </Tooltip>
        </Stack>
      </Box>
    </Tooltip>
  )
}

export default MapDrawButton
