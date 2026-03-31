'use client'

import { useCallback, useRef, useState } from 'react'

import {
  InputAdornment,
  TextField,
  Tooltip
} from '@mui/material'
import SearchIcon from '@mui/icons-material/Search'

import { parseKeywordQuery, type KeywordParseResult } from 'utils/keywordSearch'

const DEBOUNCE_MS = 300

const HELPER_TEXT =
  'Search descriptions. Use quotes for exact phrases, | for OR, - to exclude.'

type KeywordSearchInputProps = {
  onSearch: (result: KeywordParseResult) => void
  size?: 'small' | 'medium'
}

const KeywordSearchInput = ({
  onSearch,
  size = 'small'
}: KeywordSearchInputProps) => {
  const [value, setValue] = useState('')
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const newValue = e.target.value
      setValue(newValue)

      if (timerRef.current) clearTimeout(timerRef.current)

      timerRef.current = setTimeout(() => {
        onSearch(parseKeywordQuery(newValue))
      }, DEBOUNCE_MS)
    },
    [onSearch]
  )

  return (
    <Tooltip title={HELPER_TEXT} arrow placement="bottom">
      <TextField
        size={size}
        value={value}
        onChange={handleChange}
        placeholder="Keywords..."
        slotProps={{
          input: {
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon fontSize="small" />
              </InputAdornment>
            )
          }
        }}
        sx={{
          minWidth: 160,
          maxWidth: 220,
          '& .MuiOutlinedInput-root': {
            borderRadius: 2,
            bgcolor: 'background.paper'
          }
        }}
      />
    </Tooltip>
  )
}

export default KeywordSearchInput
