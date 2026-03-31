import { headers } from 'next/headers'

import searchConfig from '@configs/search'
import { fetchProperty } from '@/app/listing/[slug]/utils'
import SinglePropertyPage from '@/components/property-site/SinglePropertyPage'
import StructuredData from '@shared/StructuredData'

import { formatFullAddress, formatShortAddress } from 'utils/properties'
import { getCDNPath, getProtocolHost } from 'utils/urls'

type SinglePropertyPageProps = {
  params: Promise<{
    mlsNumber: string
  }>
  searchParams: Promise<{
    boardId?: string
  }>
}

export const generateMetadata = async (props: SinglePropertyPageProps) => {
  const params = await props.params
  const searchParams = await props.searchParams
  const host = getProtocolHost(await headers())

  const boardId = searchParams.boardId
    ? Number(searchParams.boardId)
    : searchConfig.defaultBoardId

  try {
    const property = await fetchProperty(params.mlsNumber, boardId)
    const shortAddr = formatShortAddress(property.address)
    const fullAddr = formatFullAddress(property.address)
    const price = property.listPrice
      ? new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: 'USD',
          minimumFractionDigits: 0,
          maximumFractionDigits: 0
        }).format(parseFloat(property.listPrice))
      : ''
    const description =
      property.details?.description || `Property for sale at ${fullAddr}`
    const image = property.images?.[0]
      ? getCDNPath(property.images[0], 'large')
      : undefined

    return {
      title: `${shortAddr} | ${price} | Property for Sale`,
      description,
      openGraph: {
        title: `${shortAddr} - ${price}`,
        description,
        url: `${host}/property/${params.mlsNumber}`,
        type: 'website',
        ...(image && {
          images: [{ url: image, width: 1200, height: 630, alt: fullAddr }]
        })
      },
      twitter: {
        card: 'summary_large_image',
        title: `${shortAddr} - ${price}`,
        description,
        ...(image && { images: [image] })
      }
    }
  } catch {
    return {
      title: 'Property Not Found',
      description: 'The requested property could not be found.'
    }
  }
}

function generateSinglePropertyJsonLd(
  property: Awaited<ReturnType<typeof fetchProperty>>,
  url: string
) {
  const { address, details, images, mlsNumber, listPrice } = property
  const street =
    `${address?.streetNumber || ''} ${address?.streetName || ''} ${address?.streetSuffix || ''}`.trim()
  const fullAddress = `${street}, ${address?.city || ''}, ${address?.state || ''} ${address?.zip || ''}`
  const beds = details?.numBedrooms ? parseInt(details.numBedrooms) : undefined
  const baths = details?.numBathrooms
    ? parseInt(details.numBathrooms)
    : undefined
  const sqft = details?.sqft ? parseFloat(details.sqft) : undefined
  const price = listPrice ? parseFloat(listPrice) : undefined

  const jsonLd: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'SingleFamilyResidence',
    '@id': url,
    url,
    name: fullAddress,
    description:
      details?.description ||
      `${beds || ''} bed, ${baths || ''} bath property for sale`,
    ...(price && {
      offers: {
        '@type': 'Offer',
        price,
        priceCurrency: 'USD'
      }
    }),
    ...(beds && { numberOfBedrooms: beds }),
    ...(baths && { numberOfBathroomsTotal: baths }),
    ...(sqft && {
      floorSize: {
        '@type': 'QuantitativeValue',
        value: sqft,
        unitCode: 'FTK',
        unitText: 'sq ft'
      }
    }),
    address: {
      '@type': 'PostalAddress',
      streetAddress: street,
      addressLocality: address?.city || '',
      addressRegion: address?.state || '',
      postalCode: address?.zip || '',
      addressCountry: 'US'
    },
    ...(details?.yearBuilt && { yearBuilt: parseInt(details.yearBuilt) }),
    ...(images?.length && { image: getCDNPath(images[0], 'large') }),
    identifier: mlsNumber
  }

  return JSON.parse(JSON.stringify(jsonLd))
}

const PropertySitePage = async (props: SinglePropertyPageProps) => {
  const params = await props.params
  const searchParams = await props.searchParams

  const boardId = searchParams.boardId
    ? Number(searchParams.boardId)
    : searchConfig.defaultBoardId

  try {
    const property = await fetchProperty(params.mlsNumber, boardId)
    const host = getProtocolHost(await headers())
    const propertyUrl = `${host}/property/${params.mlsNumber}`

    const jsonLd = generateSinglePropertyJsonLd(property, propertyUrl)

    return (
      <>
        <StructuredData data={jsonLd} />
        <SinglePropertyPage property={property} />
      </>
    )
  } catch {
    const { notFound } = await import('next/navigation')
    notFound()
  }
}

export default PropertySitePage
