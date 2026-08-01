import deepmerge from 'deepmerge'

import { TYPE_CONDO } from '@configs/filter-types'
import { type PropertyClass } from '@configs/filters'
import { type LocationStatsParams } from '@shared/Stats'

import { type ApiStatisticResponse } from 'services/API'
import { capitalize, joinNonEmpty } from 'utils/strings'

import { dates, defaultWidgetData, dropCurrentMonth } from './constants'

export const getPropertyClass = (payload: any): PropertyClass => {
  const { propertyType = '' } = payload?.details || {}
  if (TYPE_CONDO.includes(propertyType)) {
    return 'condo'
  }
  return 'residential'
}

export const getLocationName = (params: LocationStatsParams): string => {
  const { name, area, city, neighborhood } = params
  return (
    name ||
    joinNonEmpty([area, city, neighborhood].flat().map(capitalize), ' / ')
  )
}

export { getLastMonthes } from './constants'

export type Widget = {
  values: (number | string)[]
  labels: string[]
  dates: string[]
}

export type WidgetsData = {
  activeListings: Widget
  soldPrices: Widget
  soldListings: Widget
  daysOnMarket: Widget
  newListings: Widget
}

export const toWidgetsData = (response: ApiStatisticResponse): WidgetsData => {
  const { widgets } = response

  const activeListings = [widgets?.active?.count?.value || 0]

  const soldPrices = [
    widgets?.sold?.prices?.mth[dates[dropCurrentMonth]]?.med || 0
  ]

  const soldListings = defaultWidgetData.soldListings.dates.map(
    (date) => widgets?.sold?.count?.mth?.[date]?.value || 0
  )

  const daysOnMarket = defaultWidgetData.daysOnMarket.dates.map(
    (date) => widgets?.sold?.dom?.mth?.[date]?.med || 0
  )

  const newListings = defaultWidgetData.newListings.dates.map(
    (date) => widgets?.new?.count?.mth?.[date]?.value || 0
  )

  const result = deepmerge(
    defaultWidgetData,
    {
      activeListings: {
        values: activeListings
      },
      soldPrices: {
        values: soldPrices
      },
      newListings: {
        values: newListings
      },
      soldListings: {
        values: soldListings
      },
      daysOnMarket: {
        values: daysOnMarket
      }
    },
    { arrayMerge: (_prevArray, newArray) => newArray }
  )
  return result
}
