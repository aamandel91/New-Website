# Repliers API Advanced Features

This document describes the advanced features of the Repliers API that have been integrated into the application.

## 1. Enhanced Market Statistics

**Location**: `src/app/homedetails/[slug]/similarProperties.ts`

The market statistics now use the API's built-in statistical analysis instead of manual calculations:

- **Month-over-Month Changes**: Automatically calculated from API statistics
- **Year-over-Year Changes**: Historical price trends from monthly data
- **Accurate Days on Market**: API-calculated averages
- **Inventory Months**: Based on actual sales velocity from API data

### Usage

```typescript
import { fetchMarketStats } from './similarProperties'

const stats = await fetchMarketStats(city, state, boardId)
// Returns: {
//   averagePrice, medianPrice, averageDaysOnMarket,
//   totalActiveListings, pricePerSqft, inventoryMonths,
//   monthOverMonthChange, yearOverYearChange
// }
```

## 2. Comparable Sales (CMA)

**Location**: `src/components/property-detail/PropertyComparables.tsx`

Displays automatically-selected comparable sales from the Repliers API.

### Features

- Side-by-side property comparison
- Price difference calculations
- Responsive table and card views
- Sold vs Active status indicators

### Data Structure

The API returns comparables in the property response:

```typescript
property.comparables: Partial<Property>[]
```

Each comparable includes:
- Address, beds, baths, sqft
- List/sold price
- Property status

## 3. Image Quality Sorting & Classification

**Location**: `src/utils/imageQuality.ts`

Enhanced image handling using AI-powered quality scores and room classification.

### Features

- **Quality Sorting**: Images automatically sorted by quality score (highest first)
- **Room Classification**: AI identifies room types (kitchen, bedroom, bathroom, etc.)
- **Quality Labels**: Human-readable quality ratings (excellent, good, average, etc.)

### API Data

```typescript
property.imagesScore: number[]  // Quality scores 0-1
property.imageInsights: {
  images: Array<{
    image: string
    quality: {
      qualitative: 'excellent' | 'above average' | 'average' | 'below average' | 'poor'
      quantitative: number  // 0-1 score
    }
    classification: {
      imageOf: string  // room type
      prediction: number  // confidence 0-1
    }
  }>
}
```

### Usage

```typescript
import { sortImagesByQuality, groupImagesByRoom, getHeroPhoto } from 'utils/imageQuality'

// Sort images by quality
const sortedPhotos = sortImagesByQuality(
  property.images,
  property.imagesScore,
  property.imageInsights
)

// Group by room type
const groupedPhotos = groupImagesByRoom(
  property.images,
  property.imageInsights
)
// Returns: { 'All Photos': [...], 'Kitchen': [...], 'Bedrooms': [...], ... }

// Get best quality image
const heroImage = getHeroPhoto(property)
```

## 4. Advanced Search Notifications

**Location**: `src/components/shared/Dialogs/SaveSearchDialog/SaveSearchForm.tsx`

Enhanced notification preferences for saved searches.

### Features

- **Notification Frequency**: Instant, daily, weekly, monthly
- **Price Change Alerts**: Get notified when prices drop/increase
- **Sold Alerts**: Notifications when properties sell
- **Smart Filtering**: Only relevant notifications based on preferences

### API Parameters

```typescript
{
  notificationFrequency: 'instant' | 'daily' | 'weekly' | 'monthly'
  priceChangeNotifications: boolean
  soldNotifications: boolean
}
```

## 5. Property Normalization API

**Backend Location**: `backend/src/services/repliers/normalize.ts`

The Repliers API includes a normalization endpoint for standardizing property data from various sources.

### Purpose

- Converts non-standard property data to consistent format
- Cleans and validates property information
- Maps different MLS field formats to standard schema

### Endpoint

```typescript
POST /property/normalize
Body: { listings: RplListingsSingleRETS[] }
Returns: { value: NormalizedData[] }
```

### Fields Normalized

- Lot size and measurements
- Annual tax amounts
- HOA/Association fees
- Property sub-types and styles
- Bathrooms, bedrooms, parking
- Construction materials, heating, pool features
- Year built and square footage

### When to Use

1. **Importing from Third-Party APIs**: When integrating listings from non-standard sources
2. **Data Migration**: Converting existing property data to Repliers format
3. **Multi-MLS Integration**: Standardizing data across different MLS boards

### Example Usage

```typescript
import RepliersNormalize from 'backend/src/services/repliers/normalize'

const normalize = new RepliersNormalize()

// Normalize property data
const response = await normalize.normalizeRETS([propertyData])
const normalizedData = response.value

// Map normalized data back to listing
const updatedListing = normalize.mapNormalizedData(
  normalizedData[0],
  originalListing
)
```

## 6. Natural Language Search

**Backend Endpoint**: `POST /listings/nlp`

The NLP endpoint allows natural language property searches.

### Features

- Converts natural language to structured search filters
- Understands location, price, beds/baths, features
- Returns search parameters and summary

### Example Request

```typescript
POST /listings/nlp
Body: {
  prompt: "Find me a 3 bedroom house near good schools under $500k"
  nlpId?: string  // Optional: for conversation continuity
}
```

### Response

```typescript
{
  nlpId: string,  // Use for follow-up queries
  request: {
    body: { filters: {...} },  // API search parameters
    params: {...},
    summary: "Searching for 3 bedroom homes under $500,000 near schools"
  }
}
```

### Integration Points

- **Search Dialog**: `src/components/shared/Dialogs/AiSearchDialog/`
- **API Client**: `src/services/API/APIChat.ts`

## 7. Market Trends Visualization

**Location**: `src/components/shared/MarketTrends/`

A reusable widget for displaying real estate market trends on any page.

### Features

- **Interactive Charts**: Recharts-based visualization showing median price and days on market
- **Summary Statistics**: Cards displaying median price, days on market, active listings, and market condition
- **Market Condition Indicator**: Automatically determines seller's/buyer's/balanced market based on inventory
- **Flexible Integration**: Can be added to any page with minimal configuration
- **Server-Side Rendering**: Fetches data on server for optimal performance

### Components

- `MarketTrendsWidget`: Main async server component
- `MarketTrendsChart`: Recharts visualization component
- `fetchMarketTrends`: Cached data fetching utility

### Usage

```typescript
import { MarketTrendsWidget } from '@shared/MarketTrends'

<MarketTrendsWidget
  city="Denver"
  state="CO"
  boardId={1}
  monthsBack={12}
  showDaysOnMarket={true}
  title="Denver Market Trends"
/>
```

### Example Pages

- **City Pages**: `/city/[state]/[city]/page.tsx`
- **Neighborhood Pages**: `/neighborhood/[state]/[city]/[neighborhood]/page.tsx`

### Market Conditions

The widget determines market condition based on inventory months:
- **Seller's Market** (< 5 months): High demand, low inventory
- **Balanced Market** (5-7 months): Supply meets demand
- **Buyer's Market** (> 7 months): Low demand, high inventory

## Summary of Integrations

| Feature | Status | Files Modified |
|---------|--------|----------------|
| Enhanced Market Stats | ✅ Implemented | `src/app/{homedetails,listing}/[slug]/similarProperties.ts` |
| Comparables Display | ✅ Implemented | `src/components/property-detail/PropertyComparables.tsx` |
| Image Quality Sorting | ✅ Implemented | `src/utils/imageQuality.ts`, `PropertyPhotoGallery.tsx` |
| Advanced Notifications | ✅ Implemented | `SaveSearchDialog/SaveSearchForm.tsx` |
| Market Trends Widget | ✅ Implemented | `src/components/shared/MarketTrends/`, example city/neighborhood pages |
| Normalization API | 📚 Documented | Backend already implemented |
| NLP Search | ⚠️ Partially Used | Basic implementation exists |

## Future Enhancements

1. **Room-Filtered Gallery**: Add UI tabs to filter photos by room type
2. **Automated CMA Reports**: Generate PDF reports using comparables
3. **Smart Recommendations**: Use NLP to suggest properties based on user behavior
4. **Image Quality Warnings**: Alert agents about low-quality photos before listing
5. **Multi-City Comparison**: Compare market trends across multiple cities side-by-side
