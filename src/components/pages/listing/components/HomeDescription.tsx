import { Stack, Typography } from '@mui/material'

import propsConfig from '@configs/properties'

import { ScrubbedText } from 'components/atoms'

import { useProperty } from 'providers/PropertyProvider'
import { scrubbed } from 'utils/properties'

/**
 * Split a free-text listing description into paragraphs. Any `<-more->`
 * divider Repliers may include is stripped. Empty paragraphs are dropped so a
 * description ending with a trailing newline doesn't render a blank box.
 */
const toParagraphs = (text: string): string[] => {
  const cleaned = text.replace(/<-more->/g, ' ').replace(/\r/g, '').trim()
  const divider = cleaned.includes('\n\n') ? /\n\n+/ : /\n+/
  return cleaned
    .split(divider)
    .map((p) => p.replace(/\s+/g, ' ').trim())
    .filter(Boolean)
}

const HomeDescription = () => {
  const {
    property: {
      details: { description }
    }
  } = useProperty()

  const paragraphs = toParagraphs(description || '')

  return (
    <Stack spacing={3} id="description" sx={{ mt: '-33px', pt: 4 }}>
      <Typography variant="h4">Description</Typography>
      <Typography
        component="div"
        sx={{
          my: -2,
          overflow: 'hidden',
          color: 'text.secondary'
        }}
      >
        {scrubbed(description) ? (
          <p>
            <ScrubbedText replace={propsConfig.scrubbedDescriptionLabel} />
          </p>
        ) : (
          paragraphs.map((p, i) => (
            <p key={i} style={{ margin: '16px 0' }}>
              {p}
            </p>
          ))
        )}
      </Typography>
    </Stack>
  )
}

export default HomeDescription
