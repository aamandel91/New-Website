'use client'

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { type Property } from 'services/API'

interface ComparisonStore {
  properties: Property[]
  addProperty: (property: Property) => void
  removeProperty: (mlsNumber: string) => void
  clearAll: () => void
  isComparing: (mlsNumber: string) => boolean
  canAddMore: () => boolean
}

const MAX_COMPARISON_PROPERTIES = 4

export const usePropertyComparison = create<ComparisonStore>()(
  persist(
    (set, get) => ({
      properties: [],

      addProperty: (property) =>
        set((state) => {
          // Don't add if already in comparison
          if (state.properties.some((p) => p.mlsNumber === property.mlsNumber)) {
            return state
          }

          // Don't add if at max capacity
          if (state.properties.length >= MAX_COMPARISON_PROPERTIES) {
            return state
          }

          return {
            properties: [...state.properties, property],
          }
        }),

      removeProperty: (mlsNumber) =>
        set((state) => ({
          properties: state.properties.filter((p) => p.mlsNumber !== mlsNumber),
        })),

      clearAll: () => set({ properties: [] }),

      isComparing: (mlsNumber) => {
        const { properties } = get()
        return properties.some((p) => p.mlsNumber === mlsNumber)
      },

      canAddMore: () => {
        const { properties } = get()
        return properties.length < MAX_COMPARISON_PROPERTIES
      },
    }),
    {
      name: 'property-comparison-storage',
    }
  )
)
