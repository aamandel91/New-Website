'use client'

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { type Property } from 'services/API'

interface RecentlyViewedStore {
  properties: Property[]
  addProperty: (property: Property) => void
  clearAll: () => void
}

const MAX_RECENTLY_VIEWED = 20

export const useRecentlyViewed = create<RecentlyViewedStore>()(
  persist(
    (set) => ({
      properties: [],

      addProperty: (property) =>
        set((state) => {
          // Remove if already exists (to move to front)
          const filtered = state.properties.filter(
            (p) => p.mlsNumber !== property.mlsNumber
          )

          // Add to front and limit to max
          return {
            properties: [property, ...filtered].slice(0, MAX_RECENTLY_VIEWED),
          }
        }),

      clearAll: () => set({ properties: [] }),
    }),
    {
      name: 'recently-viewed-storage',
    }
  )
)
