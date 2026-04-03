import type { MetadataRoute } from 'next'

import { targetCounties, subTypes } from '@configs/page-generation'
import { fetchCountyCities } from 'services/pageGeneration'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://floridahomefinder.com'

  // Static pages
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 1.0,
    },
    {
      url: `${baseUrl}/about`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/blog`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/contact`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: `${baseUrl}/listings`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/agents`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/home-value`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: `${baseUrl}/search/gallery`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/search/advanced`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/privacy`,
      lastModified: new Date(),
      changeFrequency: 'yearly',
      priority: 0.5,
    },
    {
      url: `${baseUrl}/terms`,
      lastModified: new Date(),
      changeFrequency: 'yearly',
      priority: 0.5,
    },
  ]

  // Blog posts
  let blogPages: MetadataRoute.Sitemap = []
  try {
    const APIBlogs = (await import('services/API/APIBlogs')).default
    const { blogs } = await APIBlogs.getBlogs({ status: 'published', limit: 1000 })
    blogPages = blogs.map((blog: { slug: string; updated_at: Date; published_at: Date | null }) => ({
      url: `${baseUrl}/blog/${blog.slug}`,
      lastModified: new Date(blog.updated_at || blog.published_at || new Date()),
      changeFrequency: 'monthly' as const,
      priority: 0.6,
    }))
  } catch {
    /* API not available at build time */
  }

  // City pages and sub-type pages from locations API
  const cityPages: MetadataRoute.Sitemap = []
  try {
    for (const county of targetCounties) {
      const cities = await fetchCountyCities(county)
      for (const city of cities) {
        const citySlug = city.name.toLowerCase().replace(/\s+/g, '-')
        cityPages.push({
          url: `${baseUrl}/${citySlug}`,
          lastModified: new Date(),
          changeFrequency: 'daily',
          priority: 0.8,
        })
        // Sub-type pages for each city
        for (const st of subTypes) {
          cityPages.push({
            url: `${baseUrl}/${citySlug}/${st.slug}`,
            lastModified: new Date(),
            changeFrequency: 'weekly',
            priority: 0.6,
          })
        }
      }
    }
  } catch {
    /* Locations API not available at build time */
  }

  // Listing pages from search API
  let listingPages: MetadataRoute.Sitemap = []
  try {
    const { APISearch } = await import('services/API')
    const response = await APISearch.fetch(
      {
        get: {
          status: 'A',
          resultsPerPage: 500,
          sortBy: 'createdOnDesc',
          listings: true,
          fields: 'mlsNumber,address,updatedOn',
        },
        post: {},
      },
      undefined
    )
    if (response?.listings) {
      const { generatePropertyUrl } = await import('utils/propertyUrls')
      listingPages = response.listings.map((listing: any) => ({
        url: `${baseUrl}${generatePropertyUrl(listing.address || {}, listing.mlsNumber)}`,
        lastModified: listing.updatedOn ? new Date(listing.updatedOn) : new Date(),
        changeFrequency: 'weekly' as const,
        priority: 0.7,
      }))
    }
  } catch {
    /* Search API not available at build time */
  }

  return [...staticPages, ...blogPages, ...cityPages, ...listingPages]
}
