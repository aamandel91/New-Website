'use client'

import { useEffect, useRef } from 'react'

import type { Property } from 'services/API'
import { trackPropertyListView } from 'utils/analytics'

const TrackListView = ({ listings }: { listings: Property[] }) => {
  const tracked = useRef(false)

  useEffect(() => {
    if (listings.length > 0 && !tracked.current) {
      tracked.current = true
      trackPropertyListView(listings)
    }
  }, [listings])

  return null
}

export default TrackListView
