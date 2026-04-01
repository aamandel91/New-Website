import {
  type MouseEvent,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState
} from 'react'
import { type Position } from 'geojson'
import { type LngLat, type LngLatBounds, Map as MapboxMap } from 'mapbox-gl'
import { useLocale, useMessages } from 'next-intl'
import { useRouter } from 'next/navigation'

import { Stack } from '@mui/material'

import gridConfig from '@configs/cards-grids'
import mapConfig from '@configs/map'
import { SaveSearchDialog } from '@shared/Dialogs'
import { MapNavigation, MapStyleSwitch } from '@shared/Map'

import { type Property } from 'services/API'
import MapService from 'services/Map'
import SearchService from 'services/Search'
import { useFeatures } from 'providers/FeaturesProvider'
import { useMapOptions } from 'providers/MapOptionsProvider'
import { useSearch } from 'providers/SearchProvider'
import { useUser } from 'providers/UserProvider'
import useBreakpoints from 'hooks/useBreakpoints'
import useIntersectionObserver from 'hooks/useIntersectionObserver'
import { getDefaultBounds, getMapStyleUrl } from 'utils/map'
import { addPolygon, removePolygon } from 'utils/map'
import { getSeoUrl } from 'utils/properties'

import {
  GridContent,
  GridDesktopContainer,
  GridFilters,
  GridMobileDrawer,
  // TODO: consider moving those components to the `shared/Map` folder
  MapContainer,
  MapDrawButton,
  MapTitle,
  MapTransitionContainer,
  MobileCircularProgress,
  OpenDrawerButton,
  SaveSearchCanvas,
  TableContent
} from './components'

type MapRootProps = {
  zoom: number
  center: LngLat | null
  polygon?: Position[] | null
  onMove: (bounds: LngLatBounds, center: LngLat, zoom: number) => void
  onLoad: (bounds: LngLatBounds, center: LngLat, zoom: number) => void
}

const { mapboxDefaults } = mapConfig

const MapRoot = ({ zoom, center, polygon, onMove, onLoad }: MapRootProps) => {
  const locale = useLocale()
  const messages = useMessages()
  const features = useFeatures()
  const router = useRouter()
  const [mapVisible, mapContainerRef] = useIntersectionObserver(0)

  const [showDrawer, setShowDrawer] = useState(false)

  const {
    list,
    loading,
    clusters,
    multiUnits,
    saveMultiUnits,
    clearMultiUnits
  } = useSearch()

  const { mobile, tablet } = useBreakpoints()
  const { layout, style, setMapRef } = useMapOptions()
  const multiUnitsRef = useRef(multiUnits)
  const { logged } = useUser()

  const onUserInteractionStart = useCallback(() => {
    SearchService.disableRequests()
  }, [])

  const onUserInteractionEnd = useCallback(() => {
    SearchService.enableRequests()
  }, [])

  const onMapStyleLoad = useCallback(() => {
    // Hide house numbers for non-authenticated users
    if (features.hideMapStreetNumberRestrictedProperty && !logged) {
      // Hide building/house number labels on all map styles
      const style = MapService.map?.getStyle()
      const { layers } = style || {}
      if (layers) {
        layers.forEach((layer) => {
          if (
            layer.id.includes('housenum') ||
            layer.id.includes('house-num') ||
            layer.id.includes('building-number') ||
            layer.id.includes('address')
          ) {
            MapService.map?.setLayoutProperty(layer.id, 'visibility', 'none')
          }
        })
      }
    }
  }, [logged])

  const onLoadRef = useRef(onLoad)
  const onMoveRef = useRef(onMove)

  useEffect(() => {
    onLoadRef.current = onLoad
  }, [onLoad])

  useEffect(() => {
    onMoveRef.current = onMove
  }, [onMove])

  const initializeMap = (container: HTMLElement) => {
    // `center` and `zoom` params are passed from the server-side
    // we should use `defaultBounds` rectangle if they were not passed
    const initialPosition =
      center && zoom ? { center, zoom } : { bounds: getDefaultBounds() }

    const map = new MapboxMap({
      container,
      ...mapboxDefaults,
      style: getMapStyleUrl(style),
      // we should use `defaultBounds` rectangle if there is no `center` point
      // passed in the URL
      ...initialPosition
    })

    map.on('load', () => {
      if (polygon) addPolygon(map, polygon)
      // prevent stale closures in the `onLoad` and `onMove` callbacks
      onLoadRef.current(map.getBounds()!, map.getCenter(), map.getZoom())
    })

    map.on('moveend', () => {
      // prevent stale closures in the `onLoad` and `onMove` callbacks
      onMoveRef.current(map.getBounds()!, map.getCenter(), map.getZoom())
    })

    // there is a slight difference between `dragstart` and `movestart` events,
    // as the drag/zoom could be initiated by the user ONLY and not the map
    // repositioning or animations
    map.on('dragstart', onUserInteractionStart)
    map.on('zoomstart', onUserInteractionStart)
    map.on('dragend', onUserInteractionEnd)
    map.on('zoomend', onUserInteractionEnd)
    map.on('style.load', onMapStyleLoad)
    map.on('click', () => MapService.hidePopup())

    setMapRef(map) // MapOptionsProvider
    MapService.setMap(map)
    MapService.popupExtension.setIntlProviderData(locale, messages)
  }

  const updateMultiUnits = useCallback(
    (property: Property) => {
      const { streetName, streetNumber } = property.address

      const updatedUnits = list.filter(
        (p) =>
          p.address.streetName === streetName &&
          p.address.streetNumber === streetNumber
      )
      saveMultiUnits(updatedUnits)
    },
    [list, saveMultiUnits]
  )

  const handleCardClick = useCallback(
    (e: MouseEvent, property: Property, multiUnit?: boolean) => {
      const url = getSeoUrl(property)

      // Middle-click or ctrl/meta-click: open in new tab
      if (e.button === 1 || e.ctrlKey || e.metaKey) {
        e.preventDefault()
        window.open(url, '_blank')
        return
      }

      if (multiUnit) updateMultiUnits(property)

      // Navigate to full listing page
      e.preventDefault()
      router.push(url)
    },
    [updateMultiUnits, router]
  )

  const handleMarkerTap = useCallback(
    (property: Property, multiUnit: boolean) => {
      if (multiUnit) {
        updateMultiUnits(property)
      } else {
        clearMultiUnits()
      }

      // Navigate to full listing page
      router.push(getSeoUrl(property))
    },
    [updateMultiUnits, clearMultiUnits, router]
  )

  const handleOpenDrawerClick = useCallback(() => {
    setShowDrawer(!showDrawer)
  }, [showDrawer])

  // NOTE: memoized object connecting property markers with their event handlers
  // to use in the next effect below
  const markers = useMemo(
    () => ({
      properties: list,
      onClick: handleCardClick,
      onTap: handleMarkerTap
    }),
    [list, handleCardClick, handleMarkerTap]
  )

  useEffect(() => {
    MapService.showMarkers(markers)
  }, [markers])

  useEffect(() => {
    MapService.showClusterMarkers({ clusters })
  }, [clusters])

  useEffect(() => {
    multiUnitsRef.current = multiUnits
  }, [multiUnits])

  useEffect(() => {
    MapService.map?.resize()
  }, [mapVisible])

  // resize map after returning from the grid layout
  useEffect(() => {
    // TODO: add debouncing
    if (layout === 'map') setTimeout(() => MapService.map?.resize(), 700)
  }, [layout])

  useEffect(() => {
    MapService.map?.setStyle(getMapStyleUrl(style))
  }, [style])

  useEffect(() => {
    if (MapService.map && !polygon) {
      removePolygon(MapService.map)
    }
  }, [polygon])

  useEffect(() => {
    if (mapContainerRef.current) {
      initializeMap(mapContainerRef.current)
    }

    return () => MapService.removeMap()
  }, [])

  return (
    <Stack
      direction="row"
      alignItems="stretch"
      sx={{
        left: 0,
        right: 0,
        bottom: 0,
        top: gridConfig.mapTopOffset,
        position: 'fixed'
      }}
    >
      <MapTransitionContainer>
        <MapContainer ref={mapContainerRef} />
        {features.saveSearch && <MapDrawButton />}
        <MapNavigation />
        <MapStyleSwitch />
        <MapTitle />
        <SaveSearchCanvas />
        {(mobile || tablet) && (
          <>
            <OpenDrawerButton onClick={handleOpenDrawerClick} />
            {loading && <MobileCircularProgress />}
          </>
        )}
        {/* PropertyDrawer disabled — all clicks navigate to /listing/[slug] */}
      </MapTransitionContainer>

      {mobile || tablet ? (
        <GridMobileDrawer show={showDrawer}>
          <GridFilters />
          <GridContent onCardClick={handleCardClick} />
        </GridMobileDrawer>
      ) : layout === 'table' ? (
        <TableContent />
      ) : (
        <GridDesktopContainer>
          <GridFilters />
          <GridContent onCardClick={handleCardClick} />
        </GridDesktopContainer>
      )}

      {features.saveSearch && <SaveSearchDialog />}
    </Stack>
  )
}

export default MapRoot
