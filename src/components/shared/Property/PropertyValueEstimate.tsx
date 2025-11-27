import { useTranslations } from 'next-intl'
import { Box, Stack, Typography, alpha, useTheme } from '@mui/material'
import TrendingUpIcon from '@mui/icons-material/TrendingUp'

import { type PropertyEstimate } from 'services/API'
import { formatPrice } from 'utils/formatters'

type PropertyValueEstimateProps = {
  estimate: PropertyEstimate
  variant?: 'compact' | 'detailed'
  showIcon?: boolean
}

const PropertyValueEstimate = ({
  estimate,
  variant = 'compact',
  showIcon = true
}: PropertyValueEstimateProps) => {
  const t = useTranslations()
  const theme = useTheme()

  if (!estimate) return null

  const { value, low, high, confidence } = estimate
  const confidencePercent = Math.round(confidence * 100)

  if (variant === 'compact') {
    return (
      <Box
        sx={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 0.5,
          px: 1.5,
          py: 0.75,
          borderRadius: 1,
          bgcolor: alpha(theme.palette.primary.main, 0.08),
          border: '1px solid',
          borderColor: alpha(theme.palette.primary.main, 0.2)
        }}
      >
        {showIcon && (
          <TrendingUpIcon
            sx={{
              fontSize: 16,
              color: 'primary.main'
            }}
          />
        )}
        <Stack direction="row" spacing={0.5} alignItems="baseline">
          <Typography
            variant="caption"
            sx={{
              color: 'primary.main',
              fontWeight: 600,
              fontSize: '0.75rem'
            }}
          >
            Est. Value:
          </Typography>
          <Typography
            variant="body2"
            sx={{
              color: 'primary.dark',
              fontWeight: 700,
              fontSize: '0.875rem'
            }}
          >
            {formatPrice(value)}
          </Typography>
        </Stack>
      </Box>
    )
  }

  return (
    <Box
      sx={{
        p: 2,
        borderRadius: 2,
        bgcolor: 'background.paper',
        border: '1px solid',
        borderColor: 'divider'
      }}
    >
      <Stack spacing={2}>
        <Stack direction="row" alignItems="center" spacing={1}>
          {showIcon && (
            <TrendingUpIcon
              sx={{
                fontSize: 24,
                color: 'primary.main'
              }}
            />
          )}
          <Typography
            variant="h6"
            sx={{
              color: 'text.primary',
              fontWeight: 600
            }}
          >
            VALERY INSIGHTS™ Est.
          </Typography>
        </Stack>

        <Stack spacing={1}>
          <Typography
            variant="h4"
            sx={{
              color: 'primary.main',
              fontWeight: 700
            }}
          >
            {formatPrice(value)}
          </Typography>

          <Typography
            variant="body2"
            sx={{
              color: 'text.secondary'
            }}
          >
            Range: {formatPrice(low)} - {formatPrice(high)}
          </Typography>

          <Box
            sx={{
              mt: 1,
              display: 'flex',
              alignItems: 'center',
              gap: 1
            }}
          >
            <Box
              sx={{
                flex: 1,
                height: 6,
                bgcolor: 'grey.200',
                borderRadius: 1,
                overflow: 'hidden'
              }}
            >
              <Box
                sx={{
                  width: `${confidencePercent}%`,
                  height: '100%',
                  bgcolor:
                    confidencePercent >= 80
                      ? 'success.main'
                      : confidencePercent >= 60
                        ? 'warning.main'
                        : 'error.main',
                  borderRadius: 1
                }}
              />
            </Box>
            <Typography
              variant="caption"
              sx={{
                color: 'text.secondary',
                fontWeight: 600,
                minWidth: 40,
                textAlign: 'right'
              }}
            >
              {confidencePercent}%
            </Typography>
          </Box>
          <Typography
            variant="caption"
            sx={{
              color: 'text.secondary'
            }}
          >
            Confidence Level
          </Typography>
        </Stack>
      </Stack>
    </Box>
  )
}

export default PropertyValueEstimate
