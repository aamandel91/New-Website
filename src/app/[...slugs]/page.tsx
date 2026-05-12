import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { Box, Container, Typography, Breadcrumbs, Link, Grid, Chip, Card, CardContent } from '@mui/material'

import { PageTemplate } from '@templates'
import ListingsGrid from '@shared/ListingsGrid'
import AreaValueTrends from '@shared/AreaValueTrends'
import MarketTimelineGraph from '@shared/MarketTimelineGraph'
import StructuredData from '@shared/StructuredData'
import PageWithSidebar from '@/components/layouts/PageWithSidebar'
import CitySidebar from '@/components/sidebar/CitySidebar'

import { subTypes, getSubTypeBySlug, findNearbyCities, activeMarkets, allActiveCities } from '@configs/page-generation'
import AboutTheArea from '@/components/property-detail/sections/AboutTheArea'
import { breadcrumbSchema, faqSchema, localBusinessSchema } from 'utils/structuredData'
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
import { tenant } from '@/configs/tenant.config'
import { scoreAreaPage } from 'utils/areaPageScoring'
import {
  fetchCityNeighborhoods,
  fetchListingCount,
  fetchSubTypeCount,
  fetchZipCodesForCity,
} from 'services/pageGeneration'

export const revalidate = 300

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

  if (parsed.pageType === 'property-type' && parsed.subType) {
    const stConfig = getSubTypeBySlug(parsed.subType)
    items.push({
      name: stConfig?.label || slugToDisplayName(parsed.subType),
      url: `${baseUrl}/${parsed.subType}`,
    })
    return items
  }

  if (cityName) {
    items.push({ name: cityName, url: `${baseUrl}/${parsed.city}` })
  }

  if (parsed.pageType === 'city-subtype' && parsed.subType) {
    const stConfig = getSubTypeBySlug(parsed.subType)
    items.push({ name: stConfig?.label || slugToDisplayName(parsed.subType), url: `${baseUrl}/${parsed.city}/${parsed.subType}` })
  } else if (parsed.pageType === 'city-neighborhood' && parsed.neighborhood) {
    items.push({ name: slugToDisplayName(parsed.neighborhood), url: `${baseUrl}/${parsed.city}/${parsed.neighborhood}` })
  } else if (parsed.pageType === 'city-zip' && parsed.zip) {
    items.push({ name: parsed.zip, url: `${baseUrl}/${parsed.city}/${parsed.zip}` })
  } else if (parsed.pageType === 'city-schools') {
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

  const baseUrl = tenant.brand.siteUrl
  const cityName = slugToDisplayName(parsed.city)

  // Check CMS content for scoring
  const fullSlug = slugs.join('/')
  let hasCmsContent = false
  try {
    const cmsPage = await APIContentPages.getPageBySlug(fullSlug)
    hasCmsContent = !!(cmsPage && cmsPage.status === 'published')
  } catch {
    // No CMS page
  }

  switch (parsed.pageType) {
    case 'property-type': {
      const stConfig = getSubTypeBySlug(parsed.subType!)
      if (!stConfig) return {}
      const marketLabel = activeMarkets[0]?.label ?? 'South Florida'
      const title = `${stConfig.label} for Sale in ${marketLabel} (${new Date().getFullYear()})`
      const description = `Browse ${stConfig.label.toLowerCase()} for sale across ${marketLabel}. View photos, prices, and property details. Updated daily on ${tenant.brand.siteName}.`
      const ogImageUrl = `${baseUrl}/api/og/city?slug=${encodeURIComponent(parsed.subType!)}`
      return {
        title,
        description,
        alternates: { canonical: `${baseUrl}/${parsed.subType}` },
        openGraph: {
          title,
          description,
          type: 'website',
          images: [{ url: ogImageUrl, width: 1200, height: 630 }],
        },
        twitter: { card: 'summary_large_image', title, description, images: [ogImageUrl] },
      }
    }
    case 'city': {
      const count = await fetchListingCount(cityName)
      const pageScore = scoreAreaPage({ pageType: 'city', listingCount: count, hasCmsContent })
      const title = `${count} Homes for Sale in ${cityName}, FL (${new Date().getFullYear()})`
      const description = `Browse ${count} homes for sale in ${cityName}, FL. View photos, prices, and property details. Updated daily on ${tenant.brand.siteName}.`
      const ogImageUrl = `${baseUrl}/api/og/city?slug=${encodeURIComponent(parsed.city)}`
      return {
        title,
        description,
        robots: pageScore.indexDirective,
        alternates: { canonical: `${baseUrl}/${parsed.city}` },
        openGraph: {
          title,
          description,
          type: 'website',
          images: [{ url: ogImageUrl, width: 1200, height: 630 }],
        },
        twitter: { card: 'summary_large_image', title, description, images: [ogImageUrl] },
      }
    }
    case 'city-subtype': {
      const stConfig = getSubTypeBySlug(parsed.subType!)
      if (!stConfig) return {}
      const count = await fetchSubTypeCount(cityName, stConfig)
      const pageScore = scoreAreaPage({ pageType: 'subType', listingCount: count, subTypeSlug: stConfig.slug, hasCmsContent })
      const title = generateMetaTitle(cityName, stConfig.label, count)
      const description = `Browse ${count} ${stConfig.label} for sale in ${cityName}, FL. View photos, prices, and property details. Updated daily on ${tenant.brand.siteName}.`
      const ogImageUrl = `${baseUrl}/api/og/city?slug=${encodeURIComponent(`${parsed.city}/${parsed.subType}`)}`
      return {
        title,
        description,
        robots: pageScore.indexDirective,
        alternates: { canonical: `${baseUrl}/${parsed.city}/${parsed.subType}` },
        openGraph: {
          title,
          description,
          type: 'website',
          images: [{ url: ogImageUrl, width: 1200, height: 630 }],
        },
        twitter: { card: 'summary_large_image', title, description, images: [ogImageUrl] },
      }
    }
    case 'city-schools': {
      const pageScore = scoreAreaPage({ pageType: 'schools', listingCount: 0, hasCmsContent })
      const title = `Schools in ${cityName}, FL`
      const description = `Explore schools in ${cityName}, Florida. Find top-rated public and private schools near your new home.`
      const ogImageUrl = `${baseUrl}/api/og/city?slug=${encodeURIComponent(`${parsed.city}/schools`)}`
      return {
        title,
        description,
        robots: pageScore.indexDirective,
        openGraph: {
          title,
          description,
          type: 'website',
          images: [{ url: ogImageUrl, width: 1200, height: 630 }],
        },
        twitter: { card: 'summary_large_image', title, description, images: [ogImageUrl] },
      }
    }
    case 'city-zip': {
      const count = await fetchListingCount(cityName, { zip: parsed.zip })
      const pageScore = scoreAreaPage({ pageType: 'zip', listingCount: count, hasCmsContent })
      const title = `${count} Homes for Sale in ${cityName}, FL ${parsed.zip} (${new Date().getFullYear()})`
      const description = `Browse ${count} homes for sale in ${cityName} zip code ${parsed.zip}, FL. Updated daily.`
      const ogImageUrl = `${baseUrl}/api/og/city?slug=${encodeURIComponent(`${parsed.city}/${parsed.zip}`)}`
      return {
        title,
        description,
        robots: pageScore.indexDirective,
        openGraph: {
          title,
          description,
          type: 'website',
          images: [{ url: ogImageUrl, width: 1200, height: 630 }],
        },
        twitter: { card: 'summary_large_image', title, description, images: [ogImageUrl] },
      }
    }
    case 'city-neighborhood': {
      const count = await fetchListingCount(cityName)
      const pageScore = scoreAreaPage({ pageType: 'neighborhood', listingCount: count, hasCmsContent })
      const neighborhoodName = slugToDisplayName(parsed.neighborhood!)
      const title = `Homes for Sale in ${neighborhoodName}, ${cityName}, FL`
      const description = `Browse homes for sale in ${neighborhoodName}, ${cityName}, FL. View photos, prices, and property details.`
      const ogImageUrl = `${baseUrl}/api/og/city?slug=${encodeURIComponent(`${parsed.city}/${parsed.neighborhood}`)}`
      return {
        title,
        description,
        robots: pageScore.indexDirective,
        openGraph: {
          title,
          description,
          type: 'website',
          images: [{ url: ogImageUrl, width: 1200, height: 630 }],
        },
        twitter: { card: 'summary_large_image', title, description, images: [ogImageUrl] },
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

  const baseUrl = tenant.brand.siteUrl
  const hasCmsContent = !!(cmsPage && cmsPage.status === 'published')

  if (hasCmsContent && cmsPage) {
    return renderCmsPage(cmsPage, parsed, cityName, baseUrl)
  }

  switch (parsed.pageType) {
    case 'property-type':
      return renderPropertyTypePage(parsed, baseUrl)
    case 'city':
      return renderCityPage(parsed, cityName, baseUrl, hasCmsContent)
    case 'city-subtype':
      return renderSubTypePage(parsed, cityName, baseUrl, hasCmsContent)
    case 'city-schools':
      return renderSchoolsPage(parsed, cityName, baseUrl, hasCmsContent)
    case 'city-zip':
      return renderZipPage(parsed, cityName, baseUrl, hasCmsContent)
    case 'city-neighborhood':
      return renderNeighborhoodPage(parsed, cityName, baseUrl, hasCmsContent)
    default:
      notFound()
  }
}

// ---------------------------------------------------------------------------
// Property-Type (Global Aggregate) Page
// ---------------------------------------------------------------------------

async function renderPropertyTypePage(parsed: ParsedCleanSlug, baseUrl: string) {
  const stConfig = getSubTypeBySlug(parsed.subType!)
  if (!stConfig) notFound()

  const marketLabel = activeMarkets[0]?.label ?? 'South Florida'
  const countyNames = activeMarkets.flatMap((m) => m.counties)
  const countyList = countyNames.length > 0
    ? `${countyNames.slice(0, -1).join(', ')}${countyNames.length > 1 ? ', and ' : ''}${countyNames[countyNames.length - 1]} ${countyNames.length === 1 ? 'County' : 'Counties'}`
    : marketLabel

  const allCities: string[] = []
  for (const market of activeMarkets) {
    for (const cities of Object.values(market.citiesByCounty)) {
      for (const city of cities) {
        if (!allCities.includes(city.name)) allCities.push(city.name)
      }
    }
  }

  const breadcrumbItems = buildBreadcrumbs(parsed, '', baseUrl)

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
          <Typography variant="h3" component="h1" fontWeight="bold" gutterBottom>
            {stConfig.label} for Sale in {marketLabel}
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Browse {stConfig.label.toLowerCase()} listings across {countyList}.
          </Typography>
        </Box>

        {/* Property Listings — global, no city filter */}
        <ListingsGrid propertyType={stConfig.propertyType || stConfig.label} limit={24} />

        {/* Cities grid — internal links to per-city subtype pages */}
        {allCities.length > 0 && (
          <Box sx={{ mt: 5 }}>
            <Typography variant="h5" component="h2" gutterBottom>
              Find {stConfig.label} in
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              {allCities.map((city) => (
                <Chip
                  key={city}
                  label={city}
                  component="a"
                  href={generateCleanUrl(city, parsed.subType)}
                  clickable
                  variant="outlined"
                />
              ))}
            </Box>
          </Box>
        )}

        <Box sx={{ mt: 5, p: 3, bgcolor: 'grey.100', borderRadius: 2 }}>
          <Typography variant="h6" gutterBottom>
            Explore More
          </Typography>
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
            {subTypes
              .filter((st) => st.slug !== parsed.subType)
              .slice(0, 12)
              .map((st) => (
                <Chip
                  key={st.slug}
                  label={st.label}
                  component="a"
                  href={`/${st.slug}`}
                  clickable
                  variant="outlined"
                />
              ))}
          </Box>
        </Box>
      </Container>

      <StructuredData
        data={faqSchema([
          {
            question: `How many ${stConfig.label.toLowerCase()} are for sale in ${marketLabel}?`,
            answer: `Inventory for ${stConfig.label.toLowerCase()} across ${marketLabel} changes daily. Browse our live listings on ${tenant.brand.siteName} to see all currently available ${stConfig.label.toLowerCase()}.`,
          },
          {
            question: `What's the average price of ${stConfig.label.toLowerCase()} in ${marketLabel}?`,
            answer: `${stConfig.label} prices vary widely by city and neighborhood across ${marketLabel}. Browse current listings on ${tenant.brand.siteName} for up-to-date pricing in your target area.`,
          },
          {
            question: `Which cities have the most ${stConfig.label.toLowerCase()} available?`,
            answer: `${stConfig.label} are available across all major cities in ${marketLabel}. Click any city above to see local inventory and pricing.`,
          },
          {
            question: `How do I buy ${stConfig.label.toLowerCase()} in ${marketLabel}?`,
            answer: `Buying ${stConfig.label.toLowerCase()} in ${marketLabel} typically takes 30-60 days from accepted offer to closing. ${tenant.brand.teamName} guides you through every step.`,
          },
        ])}
      />
    </PageTemplate>
  )
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
  baseUrl: string,
  hasCmsContent: boolean
) {
  const [count, neighborhoods, zipCodes] = await Promise.all([
    fetchListingCount(cityName),
    fetchCityNeighborhoods(cityName),
    fetchZipCodesForCity(cityName),
  ])
  const breadcrumbItems = buildBreadcrumbs(parsed, cityName, baseUrl)
  const pageScore = scoreAreaPage({ pageType: 'city', listingCount: count, hasCmsContent })

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

        <PageWithSidebar sidebar={<CitySidebar city={cityName} />}>
          <Box sx={{ mb: 4 }}>
            <Typography variant="h3" component="h1" gutterBottom>
              {count.toLocaleString()} Homes for Sale in {cityName}, FL
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Browse homes for sale in {cityName}, Florida.
            </Typography>
          </Box>

          {/* Living in {City} — demographics, schools, market stats. SSR'd
              so the rich content is in the HTML for crawlers. */}
          {(() => {
            const cityCoord = allActiveCities.find(
              (c) => c.name.toLowerCase() === cityName.toLowerCase()
            )
            return (
              <AboutTheArea
                cityName={cityName}
                coordinates={
                  cityCoord
                    ? { lat: cityCoord.lat, lng: cityCoord.lng }
                    : undefined
                }
                variant="city"
                id="living-in"
              />
            )
          })()}

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
            // Radius-based: 20 miles, expanding to 50 if fewer than 12 found.
            const radiusMatches = findNearbyCities(cityName)
            // Fallback: city has no coords or isn't in active markets — fall
            // back to the full active-market city list so the section still
            // renders meaningful links (e.g., CMS pages for cities outside
            // the markets config).
            const unique = radiusMatches.length > 0
              ? radiusMatches
              : [...new Set(
                  activeMarkets
                    .flatMap(m => Object.values(m.citiesByCounty).flat())
                    .map(c => c.name)
                    .filter(n => n.toLowerCase() !== cityName.toLowerCase())
                )]
            if (unique.length === 0) return null
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
        </PageWithSidebar>
      </Container>
      {process.env.NODE_ENV === 'development' && (
        <Box sx={{ position: 'fixed', bottom: 80, right: 10, bgcolor: 'rgba(0,0,0,0.7)', color: '#fff', p: 1, borderRadius: 1, fontSize: 11, zIndex: 9999 }}>
          Area Score: {pageScore.score} | {pageScore.indexDirective}
        </Box>
      )}
      <StructuredData
        data={faqSchema([
          {
            question: `How much does it cost to buy a home in ${cityName}, FL?`,
            answer: `Home prices in ${cityName} vary by property type. Browse current listings on ${tenant.brand.siteName} for up-to-date pricing.`,
          },
          {
            question: `Is ${cityName}, FL a good place to buy real estate?`,
            answer: `${cityName} is located in South Florida and offers a strong real estate market. Contact ${tenant.brand.teamName} for a personalized market analysis.`,
          },
          {
            question: `How long does it take to buy a home in ${cityName}?`,
            answer: `The home buying process in ${cityName} typically takes 30-60 days from accepted offer to closing, depending on financing and inspection timelines.`,
          },
          {
            question: `What neighborhoods are popular in ${cityName}, FL?`,
            answer: `${cityName} has several sought-after neighborhoods. Browse our neighborhood guides to explore options that match your lifestyle.`,
          },
        ])}
      />
    </PageTemplate>
  )
}

// ---------------------------------------------------------------------------
// Sub-Type Page
// ---------------------------------------------------------------------------

async function renderSubTypePage(
  parsed: ParsedCleanSlug,
  cityName: string,
  baseUrl: string,
  hasCmsContent: boolean
) {
  const stConfig = getSubTypeBySlug(parsed.subType!)
  if (!stConfig) notFound()

  const count = await fetchSubTypeCount(cityName, stConfig)
  const breadcrumbItems = buildBreadcrumbs(parsed, cityName, baseUrl)
  const headings = generateHeadingVariations(cityName, '', 'Florida', stConfig.label, count)
  const pageScore = scoreAreaPage({ pageType: 'subType', listingCount: count, subTypeSlug: stConfig.slug, hasCmsContent })

  const otherSubTypes = subTypes.filter((st) => st.slug !== parsed.subType)

  return (
    <PageTemplate>
      <StructuredData data={breadcrumbSchema(breadcrumbItems)} />
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <PageWithSidebar sidebar={<CitySidebar city={cityName} />}>
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
            <MarketTimelineGraph city={cityName} />
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
        </PageWithSidebar>
      </Container>
      {process.env.NODE_ENV === 'development' && (
        <Box sx={{ position: 'fixed', bottom: 80, right: 10, bgcolor: 'rgba(0,0,0,0.7)', color: '#fff', p: 1, borderRadius: 1, fontSize: 11, zIndex: 9999 }}>
          Area Score: {pageScore.score} | {pageScore.indexDirective}
        </Box>
      )}
      <StructuredData
        data={faqSchema([
          {
            question: `How much does a ${stConfig.label.toLowerCase()} cost in ${cityName}, FL?`,
            answer: `${stConfig.label} prices in ${cityName} vary by location, size, and amenities. Browse current ${stConfig.label.toLowerCase()} listings on ${tenant.brand.siteName} for up-to-date pricing in your target neighborhoods.`,
          },
          {
            question: `Are ${stConfig.label.toLowerCase()} a good investment in ${cityName}, FL?`,
            answer: `${stConfig.label} in ${cityName} can be a strong investment depending on your goals — primary residence, vacation home, or rental. Contact ${tenant.brand.teamName} for a personalized market analysis specific to ${stConfig.label.toLowerCase()} in ${cityName}.`,
          },
          {
            question: `How many ${stConfig.label.toLowerCase()} are available in ${cityName}?`,
            answer: `Inventory for ${stConfig.label.toLowerCase()} in ${cityName} changes daily. Browse our live listings on ${tenant.brand.siteName} to see all currently available ${stConfig.label.toLowerCase()} matching your criteria.`,
          },
          {
            question: `What's the buying process for ${stConfig.label.toLowerCase()} in ${cityName}, FL?`,
            answer: `Buying a ${stConfig.label.toLowerCase().replace(/s$/, '')} in ${cityName} typically takes 30-60 days from accepted offer to closing, depending on financing and inspection timelines. ${tenant.brand.teamName} guides you through every step.`,
          },
        ])}
      />
    </PageTemplate>
  )
}

// ---------------------------------------------------------------------------
// Neighborhood Page
// ---------------------------------------------------------------------------

async function renderNeighborhoodPage(
  parsed: ParsedCleanSlug,
  cityName: string,
  baseUrl: string,
  hasCmsContent: boolean
) {
  const neighborhoodName = slugToDisplayName(parsed.subType || '')
  const breadcrumbItems = buildBreadcrumbs(parsed, cityName, baseUrl)
  const count = await fetchListingCount(cityName)
  const pageScore = scoreAreaPage({ pageType: 'neighborhood', listingCount: count, hasCmsContent })

  return (
    <PageTemplate>
      <StructuredData data={breadcrumbSchema(breadcrumbItems)} />
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <PageWithSidebar sidebar={<CitySidebar city={cityName} neighborhood={neighborhoodName} />}>
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
        </PageWithSidebar>
      </Container>
      {process.env.NODE_ENV === 'development' && (
        <Box sx={{ position: 'fixed', bottom: 80, right: 10, bgcolor: 'rgba(0,0,0,0.7)', color: '#fff', p: 1, borderRadius: 1, fontSize: 11, zIndex: 9999 }}>
          Area Score: {pageScore.score} | {pageScore.indexDirective}
        </Box>
      )}
    </PageTemplate>
  )
}

// ---------------------------------------------------------------------------
// Zip Code Page
// ---------------------------------------------------------------------------

async function renderZipPage(
  parsed: ParsedCleanSlug,
  cityName: string,
  baseUrl: string,
  hasCmsContent: boolean
) {
  const zip = parsed.subType || ''
  const breadcrumbItems = buildBreadcrumbs(parsed, cityName, baseUrl)
  const count = await fetchListingCount(cityName, { zip })
  const pageScore = scoreAreaPage({ pageType: 'zip', listingCount: count, hasCmsContent })

  return (
    <PageTemplate>
      <StructuredData data={breadcrumbSchema(breadcrumbItems)} />
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <PageWithSidebar sidebar={<CitySidebar city={cityName} />}>
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
        </PageWithSidebar>
      </Container>
      {process.env.NODE_ENV === 'development' && (
        <Box sx={{ position: 'fixed', bottom: 80, right: 10, bgcolor: 'rgba(0,0,0,0.7)', color: '#fff', p: 1, borderRadius: 1, fontSize: 11, zIndex: 9999 }}>
          Area Score: {pageScore.score} | {pageScore.indexDirective}
        </Box>
      )}
    </PageTemplate>
  )
}

// ---------------------------------------------------------------------------
// Schools Page
// ---------------------------------------------------------------------------

async function renderSchoolsPage(
  parsed: ParsedCleanSlug,
  cityName: string,
  baseUrl: string,
  hasCmsContent: boolean
) {
  const breadcrumbItems = buildBreadcrumbs(parsed, cityName, baseUrl)
  const pageScore = scoreAreaPage({ pageType: 'schools', listingCount: 0, hasCmsContent })

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
      {process.env.NODE_ENV === 'development' && (
        <Box sx={{ position: 'fixed', bottom: 80, right: 10, bgcolor: 'rgba(0,0,0,0.7)', color: '#fff', p: 1, borderRadius: 1, fontSize: 11, zIndex: 9999 }}>
          Area Score: {pageScore.score} | {pageScore.indexDirective}
        </Box>
      )}
    </PageTemplate>
  )
}