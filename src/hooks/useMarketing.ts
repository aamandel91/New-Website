/**
 * useMarketing Hook
 * Provides easy access to marketing tracking functions for components
 */

'use client'

import { useCallback } from 'react'

import {
  type EnhancedConversionData,
  initPageRemarketing,
  type RemarketingPropertyData,
  setUserData,
  trackAddToFavorites,
  trackContactSubmit,
  trackConversion,
  trackLead,
  trackPropertyImpression,
  trackPropertyView,
  trackScheduleShowing,
  trackSearchResults
} from 'services/marketing'

export const useMarketing = () => {
  // Track when a user views a property listing
  const onPropertyView = useCallback((property: RemarketingPropertyData) => {
    trackPropertyView(property)
  }, [])

  // Track when properties are shown in a list
  const onPropertyImpression = useCallback(
    (properties: RemarketingPropertyData[]) => {
      trackPropertyImpression(properties)
    },
    []
  )

  // Track search results
  const onSearchResults = useCallback(
    (
      searchTerm: string,
      filters: {
        city?: string
        property_type?: string
        min_price?: number
        max_price?: number
        bedrooms?: number
        bathrooms?: number
      },
      resultsCount: number
    ) => {
      trackSearchResults(searchTerm, filters, resultsCount)
    },
    []
  )

  // Track lead generation with optional enhanced conversion data
  const onLead = useCallback(
    async (
      value: number,
      currency: string = 'USD',
      userData?: EnhancedConversionData
    ) => {
      await trackLead(value, currency, userData)
    },
    []
  )

  // Track conversion with enhanced conversions
  const onConversion = useCallback(
    async (
      conversionLabel: string,
      value?: number,
      currency?: string,
      transactionId?: string,
      userData?: EnhancedConversionData
    ) => {
      await trackConversion(
        conversionLabel,
        value,
        currency,
        transactionId,
        userData
      )
    },
    []
  )

  // Track contact form submission
  const onContactSubmit = useCallback(
    async (propertyId: string | null, userData: EnhancedConversionData) => {
      await trackContactSubmit(propertyId, userData)
    },
    []
  )

  // Track showing/tour request
  const onScheduleShowing = useCallback(
    async (
      property: RemarketingPropertyData,
      userData: EnhancedConversionData
    ) => {
      await trackScheduleShowing(property, userData)
    },
    []
  )

  // Track adding property to favorites
  const onAddToFavorites = useCallback((property: RemarketingPropertyData) => {
    trackAddToFavorites(property)
  }, [])

  // Set persistent user data for enhanced conversions
  const onSetUserData = useCallback(
    async (userData: EnhancedConversionData) => {
      await setUserData(userData)
    },
    []
  )

  // Initialize page type for remarketing
  const onPageInit = useCallback(
    (
      pageType: 'home' | 'search' | 'listing' | 'category' | 'other',
      additionalData?: Record<string, unknown>
    ) => {
      initPageRemarketing(pageType, additionalData)
    },
    []
  )

  return {
    onPropertyView,
    onPropertyImpression,
    onSearchResults,
    onLead,
    onConversion,
    onContactSubmit,
    onScheduleShowing,
    onAddToFavorites,
    onSetUserData,
    onPageInit
  }
}

export default useMarketing
