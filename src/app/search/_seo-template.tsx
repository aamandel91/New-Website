/**
 * SEARCH RESULTS PAGE - SEO IMPLEMENTATION TEMPLATE
 *
 * Apply this pattern to: /src/app/search/[layout]/page.tsx
 *
 * This template shows how to:
 * - Generate metadata for search result pages
 * - Handle dynamic filter parameters
 * - Create breadcrumbs for search navigation
 * - Optimize for search intent keywords
 * - Manage canonical URLs with query parameters
 */

import type { Metadata } from 'next'
import StructuredData from '@shared/StructuredData'
import { breadcrumbSchema } from 'utils/structuredData'

/**
 * Example search context interface
 */
interface SearchContext {
  layout: string
  location?: string
  minPrice?: number
  maxPrice?: number
  bedrooms?: number
  propertyType?: string
  resultsCount: number
  searchType: 'map' | 'list' | 'grid'
}

/**
 * Generate dynamic metadata for search results
 *
 * Note: Search result pages are tricky for SEO because:
 * - Query parameters change frequently
 * - Search results can be empty or minimal
 * - User-generated searches aren't typically target for ranking
 *
 * Best practice: Keep metadata generic or mark as noindex for filter pages
 */
export async function generateMetadata(props: {
  params: { layout: string }
  searchParams?: Record<string, string | string[]>
}): Promise<Metadata> {
  // Extract search parameters
  const location = props.searchParams?.location as string
  const minPrice = props.searchParams?.minPrice as string
  const maxPrice = props.searchParams?.maxPrice as string
  const bedrooms = props.searchParams?.bedrooms as string
  const propertyType = props.searchParams?.propertyType as string

  // Build dynamic title and description from filters
  let title = 'Property Search'
  let description = 'Search for homes and properties in Florida'

  if (location) {
    title = `Homes for Sale in ${location}`
    description = `Search homes for sale in ${location}, Florida`
  }

  if (bedrooms) {
    title += ` - ${bedrooms} Bedrooms`
  }

  if (minPrice && maxPrice) {
    title += ` - $${minPrice} to $${maxPrice}`
    description += ` between $${minPrice} and $${maxPrice}`
  }

  title += ' | Florida Home Finder'

  return {
    title,
    description,
    // Mark filtered search results as noindex to avoid duplicate content
    // The location-based pages (like /listings/miami) should be indexed instead
    robots: location ? { index: true, follow: true } : { index: false, follow: true },
    alternates: {
      // For search results, don't set canonical to avoid confusing Google
      // Let Google determine the canonical based on the main listing pages
    }
  }
}

/**
 * Example search results page component
 */
export default function SearchPage(props: {
  params: { layout: string }
  searchParams?: Record<string, string | string[]>
}) {
  const layout = props.params.layout || 'map'
  const location = props.searchParams?.location as string
  const resultsCount = 42 // TODO: Get actual count from API

  // Generate breadcrumbs for search context
  const breadcrumbItems = [
    { name: 'Home', url: 'https://floridahomefinder.com' },
    { name: 'Search', url: 'https://floridahomefinder.com/search/map' }
  ]

  if (location) {
    breadcrumbItems.push({
      name: location,
      url: `https://floridahomefinder.com/search/${layout}?location=${encodeURIComponent(location)}`
    })
  }

  const breadcrumbs = breadcrumbSchema(breadcrumbItems)

  return (
    <>
      {/* Inject breadcrumb schema */}
      <StructuredData data={breadcrumbs} />

      {/* Your search results page content */}
      <div className="search-page">
        <header>
          <h1>Property Search</h1>
          {location && <p className="location">{location}</p>}
          <p className="results-count">{resultsCount} properties found</p>
        </header>

        {/* Search filters component */}
        <aside className="search-filters">
          <h2>Refine Your Search</h2>
          {/* TODO: Add filter components */}
        </aside>

        {/* Search results display based on layout */}
        <main className={`search-results search-${layout}`}>
          {layout === 'map' && (
            <div className="map-container">
              {/* TODO: Add map component with property markers */}
              <p>Map view would be rendered here</p>
            </div>
          )}

          {layout === 'list' && (
            <div className="list-view">
              {/* TODO: Add list view component */}
              <p>List view would be rendered here</p>
            </div>
          )}

          {layout === 'grid' && (
            <div className="grid-view">
              {/* TODO: Add grid view component */}
              <p>Grid view would be rendered here</p>
            </div>
          )}
        </main>
      </div>
    </>
  )
}

/**
 * SEARCH RESULTS PAGE - SEO BEST PRACTICES
 *
 * 1. NOINDEX FILTERED PAGES
 *    - Mark dynamic filter combinations as noindex
 *    - Keep only core searches indexed (location-based pages)
 *    - This prevents duplicate content issues
 *
 * 2. CANONICAL URLS
 *    - For similar searches with different parameter orders,
 *      set canonical to the normalized version
 *    - Example: ?location=miami&bedrooms=3&price=500000
 *
 * 3. BREADCRUMBS
 *    - Show clear navigation path
 *    - Help users understand search context
 *
 * 4. MOBILE OPTIMIZATION
 *    - Search results need responsive design
 *    - Map, list, and grid views should work on all devices
 *
 * 5. FACETED NAVIGATION
 *    - Organize filters logically
 *    - Show filter options clearly
 *
 * 6. ALTERNATIVE PAGES
 *    - Always link to the main location pages (/listings/miami)
 *    - These should be the primary indexed pages
 *    - Search results are supplementary
 *
 * 7. META TAGS
 *    - Generate title from most important filters
 *    - Description should summarize the search
 *    - Keep both concise and keyword-rich
 */
