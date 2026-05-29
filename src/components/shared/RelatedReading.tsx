import NextLink from 'next/link'
import { Box, Card, CardContent, Grid, Typography, Link as MuiLink } from '@mui/material'

import { tenant } from '@/configs/tenant.config'

type PageType =
  | 'city'
  | 'city_subtype'
  | 'neighborhood'
  | 'zip'
  | 'property_type'
  | 'search'

interface RelatedReadingProps {
  pageType: PageType
  city?: string
  citySlug?: string
  subtype?: string
  subtypeLabel?: string
  neighborhood?: string
  zip?: string
  county?: string
  propertyType?: string
  propertyTypeLabel?: string
  /** When true, render the slim variant for /search pages. */
  variant?: 'default' | 'slim'
  /** Optional limit override (default: 5 default / 3 slim). */
  limit?: number
}

interface BlogPostSummary {
  id: string
  slug: string
  title: string
  description: string
  featured_image_url: string | null
  tags: string[]
  published_at: string | null
  score: number
}

function getApiBase(): string {
  return process.env.NEXT_PUBLIC_API_URL || ''
}

function formatPubDate(value: string | null): string | null {
  if (!value) return null
  try {
    return new Date(value).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  } catch {
    return null
  }
}

async function fetchRelated(opts: RelatedReadingProps): Promise<BlogPostSummary[]> {
  const base = getApiBase()
  if (!base) return []
  const params = new URLSearchParams()
  params.set('pageType', opts.pageType)
  if (opts.city) params.set('city', opts.city)
  if (opts.citySlug) params.set('citySlug', opts.citySlug)
  if (opts.subtype) params.set('subtype', opts.subtype)
  if (opts.neighborhood) params.set('neighborhood', opts.neighborhood)
  if (opts.zip) params.set('zip', opts.zip)
  if (opts.county) params.set('county', opts.county)
  if (opts.propertyType) params.set('propertyType', opts.propertyType)
  const limit = opts.limit ?? (opts.variant === 'slim' ? 3 : 5)
  params.set('limit', String(limit))

  try {
    const url = `${base}/api/related-blog-posts?${params.toString()}`
    const res = await fetch(url, { next: { revalidate: 3600 } })
    if (!res.ok) return []
    const data = (await res.json()) as { posts?: BlogPostSummary[] }
    return Array.isArray(data.posts) ? data.posts : []
  } catch {
    return []
  }
}

function getHeading(opts: RelatedReadingProps): string {
  const subtypeLabel = opts.subtypeLabel || opts.subtype
  const propertyTypeLabel = opts.propertyTypeLabel || opts.propertyType
  if (opts.pageType === 'city' && opts.city) {
    return `Helpful Reading About ${opts.city}`
  }
  if (opts.pageType === 'city_subtype' && opts.city && subtypeLabel) {
    return `More About ${opts.city} ${subtypeLabel}`
  }
  if (opts.pageType === 'neighborhood' && opts.neighborhood) {
    return `More About ${opts.neighborhood}`
  }
  if (opts.pageType === 'zip' && opts.city && opts.zip) {
    return `More About ${opts.city} ${opts.zip}`
  }
  if (opts.pageType === 'property_type' && propertyTypeLabel) {
    return `More About ${propertyTypeLabel} in South Florida`
  }
  return 'Related Articles'
}

const FALLBACK_IMAGE = '/images/blog-placeholder.jpg'

const RelatedReading = async (props: RelatedReadingProps) => {
  const variant = props.variant ?? 'default'
  const posts = await fetchRelated(props)

  // Hide section entirely if not enough matches.
  if (posts.length < 2) return null

  const heading = getHeading(props)
  const accent = tenant.visualIdentity.colors.primary
  const muted = tenant.visualIdentity.colors.textMuted
  const border = tenant.visualIdentity.colors.border

  if (variant === 'slim') {
    return (
      <Box
        component="section"
        aria-label={heading}
        sx={{ mt: 4, pt: 3, borderTop: `1px solid ${border}` }}
      >
        <Typography
          variant="subtitle1"
          component="h2"
          sx={{ fontWeight: 700, mb: 1.5, color: 'text.primary' }}
        >
          {heading}
        </Typography>
        <Box component="ul" sx={{ listStyle: 'none', p: 0, m: 0 }}>
          {posts.map((post) => {
            const href = `/blog/${post.slug}`
            const date = formatPubDate(post.published_at)
            return (
              <Box
                key={post.id}
                component="li"
                sx={{ mb: 1, '&:last-child': { mb: 0 } }}
              >
                <MuiLink
                  component={NextLink}
                  href={href}
                  underline="hover"
                  sx={{
                    color: accent,
                    fontWeight: 600,
                    fontSize: '0.95rem',
                    display: 'block',
                  }}
                >
                  {post.title}
                </MuiLink>
                {post.description && (
                  <Typography
                    variant="caption"
                    sx={{
                      color: muted,
                      display: '-webkit-box',
                      WebkitLineClamp: 1,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden',
                    }}
                  >
                    {post.description}
                  </Typography>
                )}
                {date && (
                  <Typography variant="caption" sx={{ color: muted, ml: 1 }}>
                    · {date}
                  </Typography>
                )}
              </Box>
            )
          })}
        </Box>
        <MuiLink
          component={NextLink}
          href="/blog"
          underline="hover"
          sx={{ fontSize: '0.85rem', color: accent, mt: 1, display: 'inline-block' }}
        >
          More articles from our blog
        </MuiLink>
      </Box>
    )
  }

  return (
    <Box component="section" aria-label={heading} sx={{ mt: 5 }}>
      <Typography
        variant="h4"
        component="h2"
        sx={{ fontWeight: 700, mb: 2.5 }}
      >
        {heading}
      </Typography>
      <Grid container spacing={2}>
        {posts.map((post) => {
          const href = `/blog/${post.slug}`
          const image = post.featured_image_url || FALLBACK_IMAGE
          const date = formatPubDate(post.published_at)
          return (
            <Grid item xs={12} sm={6} md={4} key={post.id}>
              <Card
                variant="outlined"
                sx={{
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  borderColor: border,
                  transition: 'border-color 120ms ease, transform 120ms ease',
                  '&:hover': {
                    borderColor: accent,
                  },
                }}
              >
                <NextLink
                  href={href}
                  aria-label={post.title}
                  style={{
                    display: 'block',
                    width: '100%',
                    aspectRatio: '16 / 9',
                    backgroundImage: `url(${image})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    backgroundColor: '#eee',
                  }}
                />
                <CardContent sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                  <MuiLink
                    component={NextLink}
                    href={href}
                    underline="hover"
                    sx={{ color: 'text.primary', fontWeight: 700 }}
                  >
                    <Typography
                      variant="subtitle1"
                      component="h3"
                      sx={{
                        fontWeight: 700,
                        mb: 0.5,
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                      }}
                    >
                      {post.title}
                    </Typography>
                  </MuiLink>
                  {post.description && (
                    <Typography
                      variant="body2"
                      sx={{
                        color: muted,
                        mb: 1,
                        flex: 1,
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                      }}
                    >
                      {post.description}
                    </Typography>
                  )}
                  <Box
                    sx={{
                      mt: 'auto',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                    }}
                  >
                    {date && (
                      <Typography variant="caption" sx={{ color: muted }}>
                        {date}
                      </Typography>
                    )}
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          )
        })}
      </Grid>
    </Box>
  )
}

export default RelatedReading
