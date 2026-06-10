import {
  Box,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  Typography
} from '@mui/material'
import type { SelectChangeEvent } from '@mui/material/Select'

import { type Filters, type SchoolLevel } from 'services/Search'

const ratingOptions: [string, number][] = [
  ['Any', 0],
  ['6+', 6],
  ['7+', 7],
  ['8+', 8],
  ['9+', 9],
  ['10', 10]
]

const levelOptions: [string, SchoolLevel][] = [
  ['Any', 'any'],
  ['Elementary', 'elementary'],
  ['Middle', 'middle'],
  ['High', 'high']
]

const SchoolFilterSection = ({
  dialogState,
  onChange
}: {
  dialogState: Filters
  onChange: (mutation: Partial<Filters>) => void
}) => {
  const { schoolRating = 0, schoolLevel = 'any' } = dialogState

  const handleRating = (e: SelectChangeEvent<number>) => {
    const value = Number(e.target.value) || 0
    if (value === 0) {
      // turning the filter off — also clear level back to 'any'
      onChange({ schoolRating: 0, schoolLevel: 'any' })
    } else {
      onChange({ schoolRating: value })
    }
  }

  const handleLevel = (e: SelectChangeEvent<SchoolLevel>) => {
    onChange({ schoolLevel: e.target.value as SchoolLevel })
  }

  return (
    <Box>
      <Typography fontWeight={500} sx={{ mb: 1 }}>
        Schools
      </Typography>
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
        <FormControl size="small" fullWidth>
          <InputLabel id="school-rating-label">Minimum rating</InputLabel>
          <Select<number>
            labelId="school-rating-label"
            label="Minimum rating"
            value={schoolRating}
            onChange={handleRating}
          >
            {ratingOptions.map(([label, value]) => (
              <MenuItem key={value} value={value}>
                {label}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        <FormControl size="small" fullWidth disabled={!schoolRating}>
          <InputLabel id="school-level-label">School level</InputLabel>
          <Select<SchoolLevel>
            labelId="school-level-label"
            label="School level"
            value={schoolLevel}
            onChange={handleLevel}
          >
            {levelOptions.map(([label, value]) => (
              <MenuItem key={value} value={value}>
                {label}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Stack>
      {!!schoolRating && (
        <Typography
          variant="caption"
          color="text.secondary"
          sx={{ mt: 1, display: 'block' }}
        >
          Listings will be checked against nearby schools. This search uses a
          slower path and may take a moment longer.
        </Typography>
      )}
    </Box>
  )
}

export default SchoolFilterSection
