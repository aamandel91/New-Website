'use client'

import React from 'react'
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from 'recharts'

import { divider } from '@configs/colors'
import {
  ChartTooltip,
  getMinMaxDays,
  getMinMaxPrice,
  getTickInterval,
  lineProps,
  tooltipProps,
  xAxisProps,
  yAxisProps
} from '@shared/Stats'

import { formatEnglishPrice, formatPrice } from 'utils/formatters'
import { pluralize } from 'utils/strings'

import { type MarketTrendsData } from './utils'

interface MarketTrendsChartProps {
  data: MarketTrendsData[]
  showDaysOnMarket?: boolean
  height?: number
}

const MarketTrendsChart: React.FC<MarketTrendsChartProps> = ({
  data,
  showDaysOnMarket = true,
  height = 400
}) => {
  if (!data || data.length === 0) {
    return null
  }

  // Calculate domain for price axis
  const prices = data
    .map((d) => d.medianPrice)
    .filter((p): p is number => p !== null)
  const minMaxPrice = getMinMaxPrice(prices, 20000)

  // Calculate domain for days on market axis if shown
  const days = data
    .map((d) => d.daysOnMarket)
    .filter((d): d is number => d !== null)
  const minMaxDays = showDaysOnMarket ? getMinMaxDays(days, 10) : [0, 0]

  const interval = getTickInterval(data.length)

  // Chart labels for tooltip
  const labels = {
    medianPrice: {
      color: '#1976d2',
      label: 'Median Price',
      formatter: (value: number) => formatEnglishPrice(value)
    },
    ...(showDaysOnMarket && {
      daysOnMarket: {
        color: '#f57c00',
        label: 'Days on Market',
        formatter: (value: number) =>
          pluralize(value, { one: '$ day', many: '$ days' })
      }
    })
  }

  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={data} margin={{ top: 12, bottom: 0, left: 8, right: 8 }}>
        <CartesianGrid stroke={divider} />

        {/* Primary Y-Axis: Price */}
        <YAxis
          yAxisId="left"
          orientation="left"
          domain={minMaxPrice}
          tickFormatter={(value) => formatPrice(value)}
          {...yAxisProps}
        />

        {/* Secondary Y-Axis: Days on Market */}
        {showDaysOnMarket && (
          <YAxis
            yAxisId="right"
            orientation="right"
            domain={minMaxDays}
            tickFormatter={(value) =>
              !value
                ? ''
                : pluralize(value, {
                    one: '$ day',
                    many: '$ days'
                  })
            }
            {...yAxisProps}
          />
        )}

        {/* X-Axis: Date */}
        <XAxis dataKey="date" interval={interval} {...xAxisProps} />

        {/* Tooltip */}
        <Tooltip content={<ChartTooltip labels={labels} />} {...tooltipProps} />

        {/* Price Line */}
        <Line
          dataKey="medianPrice"
          yAxisId="left"
          stroke={labels.medianPrice.color}
          {...lineProps}
          isAnimationActive={true}
        />

        {/* Days on Market Line */}
        {showDaysOnMarket && (
          <Line
            dataKey="daysOnMarket"
            yAxisId="right"
            stroke={labels.daysOnMarket?.color}
            {...lineProps}
            isAnimationActive={true}
            animationBegin={500}
          />
        )}
      </LineChart>
    </ResponsiveContainer>
  )
}

export default MarketTrendsChart
