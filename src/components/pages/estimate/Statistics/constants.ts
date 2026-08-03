import dayjs from 'dayjs'

// Type-only import: safe within the constants <-> utils pair. getLastMonthes
// lives here (not in utils.ts) because this module calls it during its own
// evaluation — importing it back from utils.ts made the two modules circular
// and crashed with "Cannot access 'X' before initialization" when utils.ts
// happened to load first.
import { type WidgetsData } from './utils'

type MonthData = {
  date: string
  label: string
}

export const getLastMonthes = (): MonthData[] => {
  const months = new Array(4).fill(null)

  return months.reduce((acc, _, index) => {
    const date = dayjs().subtract(index, 'month')
    acc[index] = {
      date: date.format('YYYY-MM'),
      label: date.format('MMM YYYY')
    }
    return acc
  }, [])
}

const lastMonthes = getLastMonthes()

export const dropCurrentMonth = dayjs().date() <= 20 ? 1 : 0
export const labels = lastMonthes.map((month) => month.label)
export const dates = lastMonthes.map((month) => month.date)

export const defaultWidgetData: WidgetsData = {
  activeListings: {
    values: [0],
    dates: dates.slice(0, 1),
    labels: labels.slice(0, 1)
  },
  soldPrices: {
    values: [0, 0, 0],
    dates: dates.slice(dropCurrentMonth),
    labels: labels.slice(dropCurrentMonth)
  },
  newListings: {
    values: [0, 0, 0],
    dates: dates.slice(0, 3),
    labels: labels.slice(0, 3)
  },
  soldListings: {
    values: [0, 0, 0],
    dates: dates.slice(dropCurrentMonth),
    labels: labels.slice(dropCurrentMonth)
  },
  daysOnMarket: {
    values: [0, 0, 0],
    dates: dates.slice(dropCurrentMonth),
    labels: labels.slice(dropCurrentMonth)
  }
}
