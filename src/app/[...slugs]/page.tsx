import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { Box, Container, Typography, Breadcrumbs, Link, Grid, Chip, Card, CardContent } from '@mui/material'

import { PageTemplate } from '@templates'
import ListingsGrid from '@shared/ListingsGrid'
import MarketTimelineGraph from '@shared/MarketTimelineGraph'
import AreaValueTrends from '@shared/AreaValueTrends'
import StructuredData from '@shared/StructuredData'

import { subTypes, getSubTypeBySlug } from '@configs/page-generation'
import { breadcrumbSchema, localBusinessSchema } from 'utils/structuredData'
import {
  parseCleanSlug,
  slugToDisplayName,
  generateMetaTitle,
  generateHeadingVariations,
  generateCleanUrl,
} from 'utils/templateEngine'
import type { ParsedCleanSlug } from 'utils/templateEngine'
import APIContentPages from 'services/API/APIContentPages'
import type { ContentPage } from 'services/API/APIContentPages'
import {
  fetchCityNeighborhoods,
  fetchListingCount,
  fetchSubTypeCount,
  fetchZipCodesForCity,
} from 'services/pageGeneration'

// Nearby cities for internal linking, grouped by county
const nearbyCities: Record<string, string[]> = {
  'Broward': ['Fort Lauderdale', 'Coral Springs', 'Pompano Beach', 'Deerfield Beach', 'Boca Raton', 'Hollywood', 'Plantation', 'Davie', 'Weston', 'Coconut Creek', 'Parkland', 'Sunrise', 'Tamarac', 'Lighthouse Point'],
  'Palm Beach': ['West Palm Beach', 'Boca Raton', 'Delray Beach', 'Boynton Beach', 'Palm Beach Gardens', 'Jupiter', 'Wellington', 'Lake Worth'],
}

export const dynamic = 'force-dynamic'
export const revalidate = 3600

// Build breadcrumb items for structured data
function buildBreadcrumbs(
  parsed: ParsedCleanSlug,
  cityName: string,
  baseUrl: string
): Array<{ name: string; url: string }> {
  const items: Array<{ name: string; url: string }> = [
    { name: 'Home', url: baseUrl },
    { name: 'Florida', url: `${baseUrl}/search/gallery` },
  ]

  if (cityName) {
    items.push({ name: cityName, url: `${baseUrl}/${parsed.city}` })
  }

  if (parsed.pageType === 'subType' && parsed.subType) {
    const stConfig = getSubTypeBySlug(parsed.subType)
    items.push({ name: stConfig?.label || slugToDisplayName(parsed.subType), url: `${baseUrl}/${parsed.city}/${parsed.subType}` })
  } else if (parsed.pageType === 'neighborhood' && parsed.subType) {
    items.push({ name: slugToDisplayName(parsed.subType), url: `${baseUrl}/${parsed.city}/${parsed.subType}` })
  } else if (parsed.pageType === 'zip' && parsed.subType) {
    items.push({ name: parsed.subType, url: `${baseUrl}/${parsed.city}/${parsed.subType}` })
  } else if (parsed.pageType === 'schools') {
    items.push({ name: 'Schools', url: `${baseUrl}/${parsed.city}/schools` })
  }

  return items
}

interface CleanPageProps {
  params: Promise<{ slugs: string[] }>
}

// ---------------------------------------------------------------------------
// Metadata
// ---------------------------------------------------------------------------

export async function generateMetadata(props: CleanPageProps): Promise<Metadata> {
  const { slugs } = await props.params
  const parsed = parseCleanSlug(slugs)
  if (!parsed) return {}

  const baseUrl = 'https://floridahomefinder.com'
  const cityName = slugToDisplayName(parsed.city)

  switch (parsed.pageType) {
    case 'city': {
      const count = await fetchListingCount(cityName)
      const title = `${count} Homes for Sale in ${cityName}, FL (${new Date().getFullYear()})`
      const description = `Browse ${count} homes for sale in ${cityName}, FL. View photos, prices, and property details. Updated daily on Florida Home Finder.`
      return {
        title,
        description,
        alternates: { canonical: `${baseUrl}/${parsed.city}` },
        openGraph: { title, description, type: 'website' },
        twitter: { card: 'summary_large_image', title, description },
      }
    }
    case 'city-subtype': {
      const stConfig = getSubTypeBySlug(parsed.subType!)
      if (!stConfig) return {}
      const count = await fetchSubTypeCount(cityName, stConfig)
      const title = generateMetaTitle(cityName, stConfig.label, count)
      const description = `Browse ${count} ${stConfig.label} for sale in ${cityName}, FL. View photos, prices, and property details. Updated daily on Florida Home Finder.`
      return {
        title,
        description,
        alternates: { canonical: `${baseUrl}/${parsed.city}/${parsed.subType}` },
        openGraph: { title, description, type: 'website' },
        twitter: { card: 'summary_large_image', title, description },
      }
    }
    case 'city-schools': {
      const title = `Schools in ${cityName}, FL`
      const description = `Explore schools in ${cityName}, Florida. Find top-rated public and private schools near your new home.`
      return {
        title,
        description,
        openGraph: { title, description, type: 'website' },
        twitter: { card: 'summary_large_image', title, description },
      }
    }
    case 'city-zip': {
      const count = await fetchListingCount(cityName, { zip: parsed.zip })
      const title = `${count} Homes for Sale in ${cityName}, FL ${parsed.zip} (${new Date().getFullYear()})`
      const description = `Browse ${count} homes for sale in ${cityName} zip code ${parsed.zip}, FL. Updated daily.`
      return {
        title,
        description,
        openGraph: { title, description, type: 'website' },
        twitter: { card: 'summary_large_image', title, description },
      }
    }
    case 'city-neighborhood': {
      const neighborhoodName = slugToDisplayName(parsed.neighborhood!)
      const title = `Homes for Sale in ${neighborhoodName}, ${cityName}, FL`
      const description = `Browse homes for sale in ${neighborhoodName}, ${cityName}, FL. View photos, prices, and property details.`
      return {
        title,
        description,
        openGraph: { title, description, type: 'website' },
        twitter: { card: 'summary_large_image', title, description },
      }
    }
  }
}

// ---------------------------------------------------------------------------
// Page Component
// ---------------------------------------------------------------------------

export default async function CleanCatchAllPage(props: CleanPageProps) {
  const { slugs } = await props.params
  const parsed = parseCleanSlug(slugs)
  if (!parsed) notFound()

  const cityName = slugToDisplayName(parsed.city)

  // Check CMS for a content page matching this slug
  const fullSlug = slugs.join('/')
  let cmsPage: ContentPage | null = null
  try {
    cmsPage = await APIContentPages.getPageBySlug(fullSlug)
  } catch {
    // No CMS page found — fall back to dynamic rendering
  }

  const baseUrl = 'https://floridahomefinder.com'

  if (cmsPage && cmsPage.status === 'published') {
    return renderCmsPage(cmsPage, parsed, cityName, baseUrl)
  }

  switch (parsed.pageType) {
    case 'city':
      return renderCityPage(parsed, cityName, baseUrl)
    case 'city-subtype':
      return renderSubTypePage(parsed, cityName, baseUrl)
    case 'city-schools':
      return renderSchoolsPage(parsed, cityName, baseUrl)
    case 'city-zip':
      return renderZipPage(parsed, cityName, baseUrl)
    case 'city-neighborhood':
      return renderNeighborhoodPage(parsed, cityName, baseUrl)
    default:
      notFound()
  }
}

// ---------------------------------------------------------------------------
// CMS Page Renderer
// ---------------------------------------------------------------------------

function renderCmsPage(
  page: ContentPage,
  parsed: ParsedCleanSlug,
  cityName: string,
  baseUrl: string
) {
  const breadcrumbItems = buildBreadcrumbs(parsed, cityName, baseUrl)

  return (
    <PageTemplate>
      <StructuredData data={breadcrumbSchema(breadcrumbItems)} />
      {page.structured_data && <StructuredData data={page.structured_data} />}
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Breadcrumbs sx={{ mb: 3 }}>
          {breadcrumbItems.map((item, i) =>
            i < breadcrumbItems.length - 1 ? (
              <Link key={item.url} href={item.url} color="inherit">
                {item.name}
              </Link>
            ) : (
              <Typography key={item.url} color="text.primary">
                {item.name}
              </Typography>
            )
          )}
        </Breadcrumbs>
        <Typography variant="h3" component="h1" gutterBottom>
          {page.title}
        </Typography>
        {page.content?.modules?.map((mod: { type: string; data: { content?: string } }, i: number) => (
          <Box key={i} sx={{ mb: 3 }}>
            {mod.type === 'text' && (
              <Typography
                variant="body1"
                dangerouslySetInnerHTML={{ __html: mod.data.content ?? '' }}
              />
            )}
          </Box>
        ))}
      </Container>
    </PageTemplate>
  )
}

// ---------------------------------------------------------------------------
// City Page
// ---------------------------------------------------------------------------

async function renderCityPage(
  parsed: ParsedCleanSlug,
  cityName: string,
  baseUrl: string
) {
  const [count, neighborhoods, zipCodes] = await Promise.all([
    fetchListingCount(cityName),
    fetchCityNeighborhoods(cityName),
    fetchZipCodesForCity(cityName),
  ])
  const breadcrumbItems = buildBreadcrumbs(parsed, cityName, baseUrl)

  return (
    <PageTemplate>
      <StructuredData data={breadcrumbSchema(breadcrumbItems)} />
      <StructuredData
        data={localBusinessSchema({ city: cityName, state: 'FL', zipCode: zipCodes[0] ?? '' })}
      />
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Breadcrumbs sx={{ mb: 3 }}>
          {breadcrumbItems.map((item, i) =>
            i < breadcrumbItems.length - 1 ? (
              <Link key={item.url} href={item.url} color="inherit">
                {item.name}
              </Link>
            ) : (
              <Typography key={item.url} color="text.primary">
                {item.name}
              </Typography>
            )
          )}
        </Breadcrumbs>

        <Box sx={{ mb: 4 }}>
          <Typography variant="h3" component="h1" gutterBottom>
            {count.toLocaleString()} Homes for Sale in {cityName}, FL
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Browse homes for sale in {cityName}, Florida.
          </Typography>
        </Box>

        {/* Property Listings */}
        <ListingsGrid city={cityName} limit={12} />

        {/* Market Timeline Graph */}
        <Typography variant="h5" component="h2" gutterBottom sx={{ mt: 4 }}>
          {cityName} Housing Market
        </Typography>
        <MarketTimelineGraph city={cityName} />
        <AreaValueTrends city={cityName} />

        {/* Sub-types */}
        <Typography variant="h5" component="h3" gutterBottom sx={{ mt: 4 }}>
          {cityName} Florida Real Estate — Browse by Property Type
        </Typography>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 4 }}>
          {subTypes.map((st) => (
            <Chip
              key={st.slug}
              label={st.label}
              component="a"
              href={generateCleanUrl(cityName, st.slug)}
              clickable
              variant="outlined"
            />
          ))}
        </Box>

        {/* Neighborhoods */}
        {neighborhoods.length > 0 && (
          <>
            <Typography variant="h5" gutterBottom sx={{ mt: 4 }}>
              Neighborhoods in {cityName}
            </Typography>
            <Grid container spacing={2}>
              {neighborhoods
                .sort((a, b) => (b.activeCount ?? 0) - (a.activeCount ?? 0))
                .map((hood) => {
                  const hoodSlug = hood.name.toLowerCase().replace(/\s+/g, '-')
                  return (
                    <Grid item xs={12} sm={6} md={4} key={hood.name}>
                      <Card variant="outlined">
                        <CardContent>
                          <Link
                            href={generateCleanUrl(cityName, hoodSlug)}
                            underline="hover"
                          >
                            <Typography variant="h6">{hood.name}</Typography>
                          </Link>
                          <Typography variant="body2" color="text.secondary">
                            {(hood.activeCount ?? 0).toLocaleString()} active listings
                          </Typography>
                        </CardContent>
                      </Card>
                    </Grid>
                  )
                })}
            </Grid>
          </>
        )}

        {/* Zip Codes */}
        {zipCodes.length > 0 && (
          <>
            <Typography variant="h5" gutterBottom sx={{ mt: 4 }}>
              Zip Codes in {cityName}
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              {zipCodes.map((zip) => (
                <Chip
                  key={zip}
                  label={zip}
                  component="a"
                  href={generateCleanUrl(cityName, zip)}
                  clickable
                  variant="outlined"
                />
              ))}
            </Box>
          </>
        )}

        {/* Nearby Cities */}
        {(() => {
          const nearby = Object.entries(nearbyCities)
            .filter(([, cities]) => cities.some((c) => c.toLowerCase() === cityName.toLowerCase()))
            .flatMap(([, cities]) => cities)
            .filter((c) => c.toLowerCase() !== cityName.toLowerCase())
          if (nearby.length === 0) return null
          const unique = [...new Set(nearby)]
          return (
            <Box sx={{ mt: 4 }}>
              <Typography variant="h5" gutterBottom>
                Explore Nearby Cities
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {unique.map((city) => (
                  <Chip
                    key={city}
                    label={city}
                    component="a"
                    href={generateCleanUrl(city)}
                    clickable
                    variant="outlined"
                  />
                ))}
              </Box>
            </Box>
          )
        })()}

        {/* Links */}
        <Box sx={{ mt: 4, p: 3, bgcolor: 'grey.100', borderRadius: 2 }}>
          <Typography variant="h6" gutterBottom>
            Explore More
          </Typography>
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
            <Link href={generateCleanUrl(cityName, 'schools')}>
              <Typography variant="body2" color="primary" fontWeight="bold">
                Schools in {cityName} →
              </Typography>
            </Link>
            <Link href={`/listings/${parsed.city}`}>
              <Typography variant="body2" color="primary" fontWeight="bold">
                Search All Listings in {cityName} →
              </Typography>
            </Link>
          </Box>
        </Box>
      </Container>
    </PageTemplate>
  )
}

// ---------------------------------------------------------------------------
// Sub-Type Page
// ---------------------------------------------------------------------------

async function renderSubTypePage(
  parsed: ParsedCleanSlug,
  cityName: string,
  baseUrl: string
) {
  const stConfig = getSubTypeBySlug(parsed.subType!)
  if (!stConfig) notFound()

  const count = await fetchSubTypeCount(cityName, stConfig)
  const breadcrumbItems = buildBreadcrumbs(parsed, cityName, baseUrl)
  const headings = generateHeadingVariations(cityName, '', 'Florida', stConfig.label, count)

  const otherSubTypes = subTypes.filter((st) => st.slug !== parsed.subType)

  return (
    <PageTemplate>
      <StructuredData data={breadcrumbSchema(breadcrumbItems)} />
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Typography variant="h3" component="h1" fontWeight="bold" gutterBottom>
          {headings.h1 || `${stConfig.label} in ${cityName}, FL`}
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
          Browse {count} {stConfig.label.toLowerCase()} currently available in {cityName}, Florida.
        </Typography>

        {/* Property Listings */}
        <ListingsGrid city={cityName} propertyType={stConfig.propertyType || stConfig.label} limit={12} />

        {/* Market Timeline */}
        <Box sx={{ mb: 4 }}>
          <MarketTimelineGraph city={cityName} propertyType={stConfig.label} />
        </Box>

        {/* Other Sub-Types */}
        <Box sx={{ mt: 4, p: 3, bgcolor: 'grey.100', borderRadius: 2 }}>
          <Typography variant="h6" gutterBottom>
            More in {cityName}
          </Typography>
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            {otherSubTypes.slice(0, 10).map((st) => (
              <Chip
                key={st.slug}
                label={st.label}
                component={Link}
                href={generateCleanUrl(cityName, st.slug)}
                clickable
                variant="outlined"
              />
            ))}
          </Box>
        </Box>
      </Container>
    </PageTemplate>
  )
}

// ---------------------------------------------------------------------------
// Neighborhood Page
// ---------------------------------------------------------------------------

async function renderNeighborhoodPage(
  parsed: ParsedCleanSlug,
  cityName: string,
  baseUrl: string
) {
  const neighborhoodName = slugToDisplayName(parsed.subType || '')
  const breadcrumbItems = buildBreadcrumbs(parsed, cityName, baseUrl)
  const count = await fetchListingCount(cityName)

  return (
    <PageTemplate>
      <StructuredData data={breadcrumbSchema(breadcrumbItems)} />
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Typography variant="h3" component="h1" fontWeight="bold" gutterBottom>
          {neighborhoodName} in {cityName}, FL
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
          Explore homes for sale in the {neighborhoodName} neighborhood of {cityName}, Florida.
        </Typography>

        {/* Property Listings */}
        <ListingsGrid city={cityName} neighborhood={neighborhoodName} limit={12} />

        <Box sx={{ mb: 4 }}>
          <MarketTimelineGraph city={cityName} />
        </Box>
        <AreaValueTrends city={cityName} neighborhood={neighborhoodName} />

        <Box sx={{ mt: 4, p: 3, bgcolor: 'grey.100', borderRadius: 2 }}>
          <Typography variant="h6" gutterBottom>
            Explore {cityName}
          </Typography>
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
            <Link href={generateCleanUrl(cityName)}>
              <Typography variant="body2" color="primary" fontWeight="bold">
                All Homes in {cityName} →
              </Typography>
            </Link>
          </Box>
        </Box>
      </Container>
    </PageTemplate>
  )
}

// ---------------------------------------------------------------------------
// Zip Code Page
// ---------------------------------------------------------------------------

async function renderZipPage(
  parsed: ParsedCleanSlug,
  cityName: string,
  baseUrl: string
) {
  const zip = parsed.subType || ''
  const breadcrumbItems = buildBreadcrumbs(parsed, cityName, baseUrl)

  return (
    <PageTemplate>
      <StructuredData data={breadcrumbSchema(breadcrumbItems)} />
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Typography variant="h3" component="h1" fontWeight="bold" gutterBottom>
          Homes for Sale in {cityName}, FL {zip}
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
          Browse homes and real estate in the {zip} zip code area of {cityName}, Florida.
        </Typography>

        {/* Property Listings */}
        <ListingsGrid city={cityName} zip={zip} limit={12} />

        <Box sx={{ mb: 4 }}>
          <MarketTimelineGraph city={cityName} />
        </Box>

        <Box sx={{ mt: 4, p: 3, bgcolor: 'grey.100', borderRadius: 2 }}>
          <Typography variant="h6" gutterBottom>
            Explore {cityName}
          </Typography>
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
            <Link href={generateCleanUrl(cityName)}>
              <Typography variant="body2" color="primary" fontWeight="bold">
                All Homes in {cityName} →
              </Typography>
            </Link>
          </Box>
        </Box>
      </Container>
    </PageTemplate>
  )
}

// ---------------------------------------------------------------------------
// Schools Page
// ---------------------------------------------------------------------------

async function renderSchoolsPage(
  parsed: ParsedCleanSlug,
  cityName: string,
  baseUrl: string
) {
  const breadcrumbItems = buildBreadcrumbs(parsed, cityName, baseUrl)

  return (
    <PageTemplate>
      <StructuredData data={breadcrumbSchema(breadcrumbItems)} />
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Typography variant="h3" component="h1" fontWeight="bold" gutterBottom>
          Schools in {cityName}, FL
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
          Find schools and school district information for {cityName}, Florida. School data coming soon.
        </Typography>

        <Box sx={{ mt: 4, p: 3, bgcolor: 'grey.100', borderRadius: 2 }}>
          <Typography variant="h6" gutterBottom>
            Explore {cityName}
          </Typography>
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
            <Link href={generateCleanUrl(cityName)}>
              <Typography variant="body2" color="primary" fontWeight="bold">
                All Homes in {cityName} →
              </Typography>
            </Link>
          </Box>
        </Box>
      </Container>
    </PageTemplate>
  )
}