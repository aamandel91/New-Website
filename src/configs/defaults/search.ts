import { allActiveBoardIds } from '@configs/page-generation'

const config = {
  // header autosuggest
  trieMaxResults: 3,
  minCharsToSuggest: 3,
  // card grid
  pageSize: 24,
  resultsPerPage: 96,
  // clustering
  clusterPrecision: 12,
  clusterLimit: 200,
  // boards
  defaultBoardId: allActiveBoardIds[0] ?? 2,
  // VOW boards explanation:
  // https://repliers.com/understanding-mls-data-feeds-idx-vow-and-back-office-whats-the-difference/
  vowBoardId: allActiveBoardIds[0] ?? 2, // same as defaultBoardId
  boardIds: allActiveBoardIds,

  similarListingsRadius: 15
}

export type SearchConfig = typeof config

export default config
