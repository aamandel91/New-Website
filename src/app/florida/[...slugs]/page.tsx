import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import nextDynamic from 'next/dynamic'
import { Box, Container, Typography, Breadcrumbs, Link, Grid, Chip, Card, CardContent, Skeleton } from '@mui/material'

import { PageTemplate } from '@templates'
import StructuredData from '@shared/StructuredData'

const MarketTimelineGraph = nextDynamic(() => import('@shared/MarketTimelineGraph'), {
  ssr: false,
  loading: () => <Skeleton variant="rectangular" height={300} sx={{ borderRadius: 1 }} />,
})

import { subTypes, getSubTypeBySlug, slugToCounty } from '@configs/page-generation'
import { breadcrumbSchema, localBusinessSchema } from 'utils/structuredData'
import {
  parseSlug,
  slugToDisplayName,
  generateMetaTitle,
  generateMetaDescription,
  generateHeadingVariations,
} from 'utils/templateEngine'
import type { FloridaPageType, ParsedSlug, HeadingVariations } from 'utils/templateEngine'
import APIContentPages from 'services/API/APIContentPages'
import type { ContentPage } from 'services/API/APIContentPages'
import {
  fetchCountyCities,
  fetchCityNeighborhoods,
  fetchListingCount,
  fetchSubTypeCount,
  fetchZipCodesForCity,
  buildSubTypeFilters,
} from 'services/pageGeneration'

export const dynamic = 'force-dynamic'
export const revalidate = 3600 // revalidate every hour

interface FloridaPageProps {
  params: Promise<{ slugs: string[] }>
}

// ---------------------------------------------------------------------------
// Metadata
// ---------------------------------------------------------------------------

export async function generateMetadata(props: FloridaPageProps): Promise<Metadata> {
  const { slugs } = await props.params
  const parsed = parseSlug(slugs)
  if (!parsed) return {}

  const countyName = slugToCounty(parsed.county)
  if (!countyName) return {}

  const baseUrl = 'https://floridahomefinder.com'

  switch (parsed.pageType) {
    case 'county': {
      const cities = await fetchCountyCities(countyName)
      const totalCount = cities.reduce((sum, c) => sum + (c.activeCount ?? 0), 0)
      return {
        title: `${totalCount} Homes for Sale in ${countyName} County, FL (${new Date().getFullYear()})`,
        description: `Browse ${totalCount} properties for sale in ${countyName} County, Florida. View listings, market data, and neighborhood info. Updated daily.`,
        alternates: { canonical: `${baseUrl}/florida/${parsed.county}` },
      }
    }
    case 'city': {
      const cityName = slugToDisplayName(parsed.city!)
      const count = await fetchListingCount(cityName)
      return {
        title: `${count} Homes for Sale in ${cityName}, FL (${new Date().getFullYear()})`,
        description: `Browse ${count} homes for sale in ${cityName}, ${countyName} County, FL. View photos, prices, and property details. Updated daily on Florida Home Finder.`,
        alternates: { canonical: `${baseUrl}/florida/${parsed.county}/${parsed.city}` },
      }
    }
    case 'city-subtype': {
      const cityName = slugToDisplayName(parsed.city!)
      const stConfig = getSubTypeBySlug(parsed.subType!)
      if (!stConfig) return {}
      const count = await fetchSubTypeCount(cityName, stConfig)
      return {
        title: generateMetaTitle(cityName, stConfig.label, count),
        description: generateMetaDescription(cityName, countyName, stConfig.label, count),
        alternates: { canonical: `${baseUrl}/florida/${parsed.county}/${parsed.city}/${parsed.subType}` },
      }
    }
    case 'city-schools': {
      const cityName = slugToDisplayName(parsed.city!)
      return {
        title: `Schools in ${cityName}, FL - ${countyName} County`,
        description: `Explore schools in ${cityName}, ${countyName} County, Florida. Find top-rated public and private schools near your new home.`,
      }
    }
    case 'city-zip': {
      const cityName = slugToDisplayName(parsed.city!)
      const count = await fetchListingCount(cityName, { zip: parsed.zip })
      return {
        title: `${count} Homes for Sale in ${cityName}, FL ${parsed.zip} (${new Date().getFullYear()})`,
        description: `Browse ${count} homes for sale in ${cityName} zip code ${parsed.zip}, ${countyName} County, FL. Updated daily.`,
      }
    }
    case 'city-neighborhood': {
      const cityName = slugToDisplayName(parsed.city!)
      const neighborhoodName = slugToDisplayName(parsed.neighborhood!)
      return {
        title: `Homes for Sale in ${neighborhoodName}, ${cityName}, FL`,
        description: `Browse homes for sale in ${neighborhoodName}, ${cityName}, ${countyName} County, FL. View photos, prices, and property details.`,
      }
    }
  }
}

// ---------------------------------------------------------------------------
// Page Component
// ---------------------------------------------------------------------------

export default async function FloridaPage(props: FloridaPageProps) {
  const { slugs } = await props.params
  const parsed = parseSlug(slugs)
  if (!parsed) notFound()

  const countyName = slugToCounty(parsed.county)
  if (!countyName) notFound()

  // Check CMS for a content page matching this slug
  const fullSlug = `florida/${slugs.join('/')}`
  let cmsPage: ContentPage | null = null
  try {
    cmsPage = await APIContentPages.getPageBySlug(fullSlug)
  } catch {
    // No CMS page found — fall back to dynamic rendering
  }

  const baseUrl = 'https://floridahomefinder.com'

  if (cmsPage && cmsPage.status === 'published') {
    return renderCmsPage(cmsPage, parsed, countyName, baseUrl)
  }

  // Dynamic rendering based on page type
  switch (parsed.pageType) {
    case 'county':
      return renderCountyPage(parsed, countyName, baseUrl)
    case 'city':
      return renderCityPage(parsed, countyName, baseUrl)
    case 'city-subtype':
      return renderSubTypePage(parsed, countyName, baseUrl)
    case 'city-schools':
      return renderSchoolsPage(parsed, countyName, baseUrl)
    case 'city-zip':
      return renderZipPage(parsed, countyName, baseUrl)
    case 'city-neighborhood':
      return renderNeighborhoodPage(parsed, countyName, baseUrl)
    default:
      notFound()
  }
}

// ---------------------------------------------------------------------------
// CMS Page Renderer
// ---------------------------------------------------------------------------

function renderCmsPage(
  page: ContentPage,
  parsed: ParsedSlug,
  countyName: string,
  baseUrl: string
) {
  const breadcrumbItems = buildBreadcrumbs(parsed, countyName, baseUrl)

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
        {page.content?.modules?.map((mod, i) => (
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
// County Page
// ---------------------------------------------------------------------------

async function renderCountyPage(
  parsed: ParsedSlug,
  countyName: string,
  baseUrl: string
) {
  const cities = await fetchCountyCities(countyName)
  const totalCount = cities.reduce((sum, c) => sum + (c.activeCount ?? 0), 0)
  const breadcrumbItems = buildBreadcrumbs(parsed, countyName, baseUrl)

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: `Real Estate in ${countyName} County, FL`,
    numberOfItems: cities.length,
    itemListElement: cities.slice(0, 20).map((city, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: city.name,
      url: `${baseUrl}/florida/${parsed.county}/${city.name.toLowerCase().replace(/\s+/g, '-')}`,
    })),
  }

  return (
    <PageTemplate>
      <StructuredData data={breadcrumbSchema(breadcrumbItems)} />
      <StructuredData data={jsonLd} />
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
            {countyName} County, FL Real Estate
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Explore {totalCount.toLocaleString()} homes for sale across{' '}
            {cities.length} cities in {countyName} County, Florida.
          </Typography>
        </Box>

        <Typography variant="h5" gutterBottom sx={{ mt: 4 }}>
          Cities in {countyName} County
        </Typography>
        <Grid container spacing={2}>
          {cities
            .sort((a, b) => (b.activeCount ?? 0) - (a.activeCount ?? 0))
            .map((city) => {
              const citySlug = city.name.toLowerCase().replace(/\s+/g, '-')
              return (
                <Grid item xs={12} sm={6} md={4} key={city.name}>
                  <Card variant="outlined">
                    <CardContent>
                      <Link
                        href={`/florida/${parsed.county}/${citySlug}`}
                        underline="hover"
                      >
                        <Typography variant="h6">{city.name}</Typography>
                      </Link>
                      <Typography variant="body2" color="text.secondary">
                        {(city.activeCount ?? 0).toLocaleString()} active listings
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              )
            })}
        </Grid>
      </Container>
    </PageTemplate>
  )
}

// ---------------------------------------------------------------------------
// City Page
// ---------------------------------------------------------------------------

async function renderCityPage(
  parsed: ParsedSlug,
  countyName: string,
  baseUrl: string
) {
  const cityName = slugToDisplayName(parsed.city!)
  const [count, neighborhoods, zipCodes] = await Promise.all([
    fetchListingCount(cityName),
    fetchCityNeighborhoods(cityName),
    fetchZipCodesForCity(cityName),
  ])
  const breadcrumbItems = buildBreadcrumbs(parsed, countyName, baseUrl)

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
            Browse homes for sale in {cityName},{' '}
            {countyName} County, Florida.
          </Typography>
        </Box>

        {/* Market Timeline Graph */}
        <Typography variant="h5" component="h2" gutterBottom sx={{ mt: 4 }}>
          {countyName} County Housing Market
        </Typography>
        <MarketTimelineGraph city={cityName} />

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
              href={`/florida/${parsed.county}/${parsed.city}/${st.slug}`}
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
                            href={`/florida/${parsed.county}/${parsed.city}/neighborhoods/${hoodSlug}`}
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
                  href={`/florida/${parsed.county}/${parsed.city}/zip/${zip}`}
                  clickable
                  variant="outlined"
                />
              ))}
            </Box>
          </>
        )}

        {/* Links */}
        <Box sx={{ mt: 4, p: 3, bgcolor: 'grey.100', borderRadius: 2 }}>
          <Typography variant="h6" gutterBottom>
            Explore More
          </Typography>
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
            <Link href={`/florida/${parsed.county}/${parsed.city}/schools`}>
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
  parsed: ParsedSlug,
  countyName: string,
  baseUrl: string
) {
  const cityName = slugToDisplayName(parsed.city!)
  const stConfig = getSubTypeBySlug(parsed.subType!)
  if (!stConfig) notFound()

  const count = await fetchSubTypeCount(cityName, stConfig)
  const breadcrumbItems = buildBreadcrumbs(parsed, countyName, baseUrl)
  const headings = generateHeadingVariations(cityName, countyName, 'Florida', stConfig.label, count)

  // Other sub-types for cross-linking
  const otherSubTypes = subTypes.filter((st) => st.slug !== parsed.subType)

  return (
    <PageTemplate>
      <StructuredData data={breadcrumbSchema(breadcrumbItems)} />
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
            {headings.h1}
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Explore {count.toLocaleString()} {stConfig.label.toLowerCase()} currently
            available in {cityName}, FL. Browse the latest listings with photos, prices,
            and details.
          </Typography>
        </Box>

        {/* Search widget placeholder */}
        <Box
          sx={{
            p: 4,
            mb: 4,
            border: '1px dashed',
            borderColor: 'divider',
            borderRadius: 2,
            textAlign: 'center',
          }}
        >
          <Typography variant="body1" color="text.secondary" gutterBottom>
            Property Search Widget
          </Typography>
          <Link
            href={`/search/grid?city=${encodeURIComponent(cityName)}&class=${stConfig.filterType}`}
          >
            <Typography variant="body2" color="primary" fontWeight="bold">
              Search {stConfig.label} in {cityName} →
            </Typography>
          </Link>
        </Box>

        {/* Market Timeline Graph */}
        <Typography variant="h5" component="h2" gutterBottom sx={{ mt: 4 }}>
          {headings.h2}
        </Typography>
        <MarketTimelineGraph city={cityName} />

        {/* About section */}
        <Box sx={{ mb: 4, mt: 4 }}>
          <Typography variant="h5" component="h3" gutterBottom>
            {headings.h3}
          </Typography>
          <Typography variant="body1" color="text.secondary" paragraph>
            {cityName} offers a variety of {stConfig.label.toLowerCase()} options across
            different neighborhoods and price ranges in {countyName} County, Florida.
            Whether you&apos;re a first-time buyer or looking to upgrade, our listings
            are updated daily with the latest available properties.
          </Typography>
        </Box>

        {/* Explore more sub-types */}
        <Typography variant="h5" component="h4" gutterBottom sx={{ mt: 4 }}>
          {headings.h4}
        </Typography>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 3 }}>
          {otherSubTypes.slice(0, 12).map((st) => (
            <Chip
              key={st.slug}
              label={st.label}
              component="a"
              href={`/florida/${parsed.county}/${parsed.city}/${st.slug}`}
              clickable
              variant="outlined"
              size="small"
            />
          ))}
        </Box>
        <Link href={`/florida/${parsed.county}/${parsed.city}`}>
          <Typography variant="body2" color="primary" fontWeight="bold">
            ← Back to {cityName} Real Estate
          </Typography>
        </Link>
      </Container>
    </PageTemplate>
  )
}

// ---------------------------------------------------------------------------
// Schools Page (stub — needs external data source)
// ---------------------------------------------------------------------------

async function renderSchoolsPage(
  parsed: ParsedSlug,
  countyName: string,
  baseUrl: string
) {
  const cityName = slugToDisplayName(parsed.city!)
  const breadcrumbItems = buildBreadcrumbs(parsed, countyName, baseUrl)

  return (
    <PageTemplate>
      <StructuredData data={breadcrumbSchema(breadcrumbItems)} />
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
            Schools in {cityName}, FL
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Explore top-rated public and private schools in {cityName},{' '}
            {countyName} County, Florida.
          </Typography>
        </Box>

        {/* Placeholder for school data integration */}
        <Box
          sx={{
            p: 4,
            mb: 4,
            border: '1px dashed',
            borderColor: 'divider',
            borderRadius: 2,
            textAlign: 'center',
          }}
        >
          <Typography variant="body1" color="text.secondary">
            School data integration coming soon.
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            This page will display schools from GreatSchools or NCES data sources.
          </Typography>
        </Box>

        <Link href={`/florida/${parsed.county}/${parsed.city}`}>
          <Typography variant="body2" color="primary" fontWeight="bold">
            ← Back to {cityName} Real Estate
          </Typography>
        </Link>
      </Container>
    </PageTemplate>
  )
}

// ---------------------------------------------------------------------------
// Zip Code Page
// ---------------------------------------------------------------------------

async function renderZipPage(
  parsed: ParsedSlug,
  countyName: string,
  baseUrl: string
) {
  const cityName = slugToDisplayName(parsed.city!)
  const count = await fetchListingCount(cityName, { zip: parsed.zip })
  const breadcrumbItems = buildBreadcrumbs(parsed, countyName, baseUrl)

  return (
    <PageTemplate>
      <StructuredData data={breadcrumbSchema(breadcrumbItems)} />
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
            Homes for Sale in {cityName}, FL {parsed.zip}
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Browse {count.toLocaleString()} properties in zip code {parsed.zip},{' '}
            {cityName}, {countyName} County, Florida.
          </Typography>
        </Box>

        {/* Search link */}
        <Box sx={{ p: 3, bgcolor: 'grey.100', borderRadius: 2, mb: 4 }}>
          <Link
            href={`/search/grid?city=${encodeURIComponent(cityName)}&zip=${parsed.zip}`}
          >
            <Typography variant="body2" color="primary" fontWeight="bold">
              Search Properties in {parsed.zip} →
            </Typography>
          </Link>
        </Box>

        <Link href={`/florida/${parsed.county}/${parsed.city}`}>
          <Typography variant="body2" color="primary" fontWeight="bold">
            ← Back to {cityName} Real Estate
          </Typography>
        </Link>
      </Container>
    </PageTemplate>
  )
}

// ---------------------------------------------------------------------------
// Neighborhood Page
// ---------------------------------------------------------------------------

async function renderNeighborhoodPage(
  parsed: ParsedSlug,
  countyName: string,
  baseUrl: string
) {
  const cityName = slugToDisplayName(parsed.city!)
  const neighborhoodName = slugToDisplayName(parsed.neighborhood!)
  const count = await fetchListingCount(cityName, { neighborhood: neighborhoodName })
  const breadcrumbItems = buildBreadcrumbs(parsed, countyName, baseUrl)

  return (
    <PageTemplate>
      <StructuredData data={breadcrumbSchema(breadcrumbItems)} />
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
            {neighborhoodName}, {cityName}, FL Real Estate
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Browse {count.toLocaleString()} homes for sale in {neighborhoodName},{' '}
            {cityName}, {countyName} County, Florida.
          </Typography>
        </Box>

        {/* Sub-types for this neighborhood */}
        <Typography variant="h5" gutterBottom sx={{ mt: 4 }}>
          Browse by Property Type
        </Typography>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 4 }}>
          {subTypes.slice(0, 10).map((st) => (
            <Chip
              key={st.slug}
              label={st.label}
              component="a"
              href={`/florida/${parsed.county}/${parsed.city}/${st.slug}`}
              clickable
              variant="outlined"
              size="small"
            />
          ))}
        </Box>

        <Link href={`/florida/${parsed.county}/${parsed.city}`}>
          <Typography variant="body2" color="primary" fontWeight="bold">
            ← Back to {cityName} Real Estate
          </Typography>
        </Link>
      </Container>
    </PageTemplate>
  )
}

// ---------------------------------------------------------------------------
// Breadcrumb Helper
// ---------------------------------------------------------------------------

function buildBreadcrumbs(
  parsed: ParsedSlug,
  countyName: string,
  baseUrl: string
): Array<{ name: string; url: string }> {
  const items: Array<{ name: string; url: string }> = [
    { name: 'Home', url: baseUrl },
    { name: 'Florida', url: `${baseUrl}/florida` },
    { name: `${countyName} County`, url: `${baseUrl}/florida/${parsed.county}` },
  ]

  if (parsed.city) {
    const cityName = slugToDisplayName(parsed.city)
    items.push({
      name: cityName,
      url: `${baseUrl}/florida/${parsed.county}/${parsed.city}`,
    })
  }

  switch (parsed.pageType) {
    case 'city-subtype': {
      const stConfig = getSubTypeBySlug(parsed.subType!)
      if (stConfig) {
        items.push({
          name: stConfig.label,
          url: `${baseUrl}/florida/${parsed.county}/${parsed.city}/${parsed.subType}`,
        })
      }
      break
    }
    case 'city-schools':
      items.push({
        name: 'Schools',
        url: `${baseUrl}/florida/${parsed.county}/${parsed.city}/schools`,
      })
      break
    case 'city-zip':
      items.push({
        name: `Zip ${parsed.zip}`,
        url: `${baseUrl}/florida/${parsed.county}/${parsed.city}/zip/${parsed.zip}`,
      })
      break
    case 'city-neighborhood': {
      const hoodName = slugToDisplayName(parsed.neighborhood!)
      items.push({
        name: hoodName,
        url: `${baseUrl}/florida/${parsed.county}/${parsed.city}/neighborhoods/${parsed.neighborhood}`,
      })
      break
    }
  }

  return items
}
