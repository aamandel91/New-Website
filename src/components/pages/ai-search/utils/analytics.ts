import { pushToDataLayer } from 'services/marketing/dataLayer'

import type { AiSearchFilters } from '../types'

export const trackAiPromptSubmitted = (prompt: string) => {
  pushToDataLayer({
    event: 'ai_search_prompt_submitted',
    search_term: prompt
  } as any)
}

export const trackAiResultsShown = (
  count: number,
  filters: AiSearchFilters
) => {
  pushToDataLayer({
    event: 'ai_search_results_shown',
    result_count: count,
    search_filters: {
      city: filters.city,
      property_type: filters.propertyTypes.join(',') || undefined,
      min_price: filters.minPrice,
      max_price: filters.maxPrice,
      min_bedrooms: filters.minBedrooms
    }
  } as any)
}

export const trackAiListingClick = (mlsNumber: string) => {
  pushToDataLayer({
    event: 'ai_search_listing_click',
    listing_id: mlsNumber
  } as any)
}
