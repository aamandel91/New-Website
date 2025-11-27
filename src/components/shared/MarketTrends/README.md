# Market Trends Widget

A reusable widget for displaying real estate market trends on any page. Shows historical price data, market statistics, and trend charts.

## Features

- **Interactive Charts**: Displays median price and days on market trends using Recharts
- **Summary Statistics**: Shows key metrics including median price, days on market, active listings, and market condition
- **Flexible Integration**: Can be added to any page with minimal configuration
- **Responsive Design**: Works on mobile, tablet, and desktop
- **Server Component**: Fetches data server-side for optimal performance

## Usage

### Basic Usage

```tsx
import { MarketTrendsWidget } from '@shared/MarketTrends'

export default async function MyPage() {
  return (
    <MarketTrendsWidget
      city="Denver"
      state="CO"
    />
  )
}
```

### Advanced Usage

```tsx
import { MarketTrendsWidget } from '@shared/MarketTrends'

export default async function MyPage() {
  return (
    <MarketTrendsWidget
      city="Denver"
      state="CO"
      boardId={1}
      monthsBack={24}
      showDaysOnMarket={true}
      title="Denver Market Trends"
    />
  )
}
```

### With Loading State

```tsx
import { MarketTrendsWidget, MarketTrendsWidgetSkeleton } from '@shared/MarketTrends'
import { Suspense } from 'react'

export default function MyPage() {
  return (
    <Suspense fallback={<MarketTrendsWidgetSkeleton />}>
      <MarketTrendsWidget city="Denver" state="CO" />
    </Suspense>
  )
}
```

## Props

| Prop | Type | Default | Required | Description |
|------|------|---------|----------|-------------|
| `city` | `string` | - | ✅ | City name (e.g., "Denver") |
| `state` | `string` | - | ✅ | State abbreviation (e.g., "CO") |
| `boardId` | `number` | `searchConfig.defaultBoardId` | ❌ | MLS board ID |
| `monthsBack` | `number` | `12` | ❌ | Number of months of historical data to display |
| `showDaysOnMarket` | `boolean` | `true` | ❌ | Whether to show days on market chart line |
| `title` | `string` | `"Market Trends"` | ❌ | Widget title |

## Examples

### City Page

See: `/src/app/city/[state]/[city]/page.tsx`

Example URL: `/city/co/denver`

```tsx
<MarketTrendsWidget
  city="Denver"
  state="CO"
  monthsBack={12}
  title="Denver Market Trends"
/>
```

### Neighborhood Page

See: `/src/app/neighborhood/[state]/[city]/[neighborhood]/page.tsx`

Example URL: `/neighborhood/co/denver/capitol-hill`

```tsx
<MarketTrendsWidget
  city="Denver"
  state="CO"
  monthsBack={12}
  title="Denver Market Trends"
/>
```

### Search Results Page

Add market trends to search results based on filtered location:

```tsx
{filters?.city && filters?.state && (
  <MarketTrendsWidget
    city={filters.city}
    state={filters.state}
    monthsBack={6}
    showDaysOnMarket={false}
  />
)}
```

## Data Source

The widget uses the Repliers API's enhanced market statistics, leveraging the `fetchMarketTrends` utility which pulls from:

- **Monthly Statistics**: Median/average prices, days on market, listing counts
- **Historical Trends**: Month-over-month and year-over-year changes
- **Market Velocity**: Inventory months calculated from sales data

## Market Conditions

The widget automatically determines market condition based on inventory months:

- **Seller's Market** (< 5 months): High demand, low inventory
- **Balanced Market** (5-7 months): Supply meets demand
- **Buyer's Market** (> 7 months): Low demand, high inventory

## Components

- `MarketTrendsWidget`: Main widget component (async server component)
- `MarketTrendsChart`: Chart component using Recharts
- `MarketTrendsWidgetSkeleton`: Loading state skeleton
- `fetchMarketTrends`: Data fetching utility (cached)
- `getMarketCondition`: Helper for determining market condition

## Styling

The widget uses Material-UI components and follows the application's theme. All colors, spacing, and typography are theme-aware.

## Performance

- **Server-side rendering**: Data fetched on server for fast initial load
- **React cache**: Prevents duplicate API calls for the same location
- **Responsive charts**: Recharts optimizes rendering for different screen sizes
- **Lazy loading**: Use with Suspense for optimal loading states

## Future Enhancements

- Add property type filtering (single-family, condo, etc.)
- Support for neighborhood-level statistics when available
- Export chart data as CSV/PDF
- Compare multiple cities side-by-side
- Add predictive trends using historical data
