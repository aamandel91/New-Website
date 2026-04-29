'use client'

/**
 * Client wrapper that lazy-loads the real <MarketTrendsChart> (which pulls in
 * recharts ~120KB gzipped). City / neighborhood pages render this widget below
 * the fold, so deferring the chart bundle keeps the initial page load smaller
 * and improves Core Web Vitals on the SEO pages Google crawls most.
 *
 * Why this wrapper exists:
 *   `MarketTrendsWidget` is an async Server Component. Server Components can't
 *   call `dynamic({ ssr: false })` directly. The fix is a thin Client
 *   Component (this file) that does the dynamic import on the browser side.
 */
import dynamic from 'next/dynamic'
import { Skeleton } from '@mui/material'

import { type MarketTrendsData } from './utils'

const MarketTrendsChart = dynamic(() => import('./MarketTrendsChart'), {
  ssr: false,
  loading: () => (
    <Skeleton variant="rectangular" height={400} sx={{ borderRadius: 1 }} />
  ),
})

interface Props {
  data: MarketTrendsData[]
  showDaysOnMarket?: boolean
  height?: number
}

const MarketTrendsChartLazy: React.FC<Props> = (props) => {
  return <MarketTrendsChart {...props} />
}

export default MarketTrendsChartLazy
