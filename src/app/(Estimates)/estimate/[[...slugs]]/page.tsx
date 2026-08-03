/* eslint-disable react/destructuring-assignment */
import React, { Suspense } from 'react'
import { type Metadata } from 'next'
import { features } from 'features'

import content from '@configs/content'
import type { EstimateData } from '@configs/estimate/types'
import Page404Template from '@/components/templates/Page404Template'
import { tenant } from '@/configs/tenant.config'
import { EstimateRouteWrapper } from '@pages/estimate'
import StructuredData from '@shared/StructuredData'

import { APIEstimate } from 'services/API'
import EstimateProvider from 'providers/EstimateProvider'
import EstimateStepsProvider from 'providers/EstimateStepsProvider'
import SearchProvider from 'providers/SearchProvider'
import SelectOptionsProvider from 'providers/SelectOptionsProvider'
import { formatShortAddress } from 'utils/properties'
import { breadcrumbSchema, faqSchema } from 'utils/structuredData'

import { parseEstimateParams } from './utils'

export type PageProps = {
  params: Promise<{
    slugs?: string[]
    clientId?: string
  }>
  searchParams: Promise<{
    ulid?: string
    estimateId?: string
    clientId?: string
    step?: string
    s?: string
    [key: string]: string | undefined // Allow additional query parameters
  }>
}

const generateResultMetadata = (
  estimateData: EstimateData | null
): Metadata => {
  const address = estimateData?.payload?.address || {}
  const localAddress = formatShortAddress(address)
  const { area, city, neighborhood } = address
  const location = area || city || neighborhood || ''

  const meta = content.estimateResultMetadata
  return {
    title: {
      absolute: String(meta.title || '').replace('$', localAddress)
    },
    description: String(meta.description || '').replace('$', location)
  }
}

export const generateMetadata = async (props: PageProps) => {
  const params = await props.params
  const searchParams = await props.searchParams
  const { estimateId, step } = parseEstimateParams(params, searchParams)

  // treat estimates without steps as result page
  if (estimateId && !step) {
    try {
      const isUlid = String(estimateId).length > 10 // TODO: think about better way to check it
      const estimateData = await APIEstimate.fetchEstimate(estimateId, isUlid)
      return generateResultMetadata(estimateData)
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) {
      return {}
    }
  }

  const base = content.estimateMetadata || {}
  const canonical = `${tenant.brand.siteUrl}/estimate`
  const title =
    (base as Metadata).title ||
    `Free Home Valuation Tool | ${tenant.brand.siteName}`
  const description =
    (base as Metadata).description ||
    `Get a free instant home valuation for your property. AI-powered estimates from ${tenant.brand.teamName}.`

  return {
    ...base,
    alternates: { canonical },
    openGraph: {
      type: 'website',
      title: typeof title === 'string' ? title : undefined,
      description: typeof description === 'string' ? description : undefined,
      url: canonical,
      siteName: tenant.brand.siteName
    },
    twitter: {
      card: 'summary_large_image',
      title: typeof title === 'string' ? title : undefined,
      description: typeof description === 'string' ? description : undefined
    }
  } as Metadata
}

const EstimatePageContent = async (props: PageProps) => {
  const searchParams = await props.searchParams
  const params = await props.params

  const { step, estimateId, clientId, signature, rest } = parseEstimateParams(
    params,
    searchParams
  )

  if (!features.estimate) return <Page404Template />

  const baseUrl = tenant.brand.siteUrl
  const isResultPage = !!(estimateId && !step)

  // Only render structured data on the landing/intro state, not on
  // result pages that already have their own per-property metadata.
  const breadcrumbItems = [
    { name: 'Home', url: baseUrl },
    { name: 'Home Valuation', url: `${baseUrl}/estimate` }
  ]

  const estimateFaqs = [
    {
      question: 'How does the home valuation tool work?',
      answer:
        'Our AI-powered tool analyzes recent property sales, current market conditions, property characteristics, and comparable homes in your area to provide an instant valuation estimate.'
    },
    {
      question: 'Is the valuation accurate?',
      answer: `Our valuations are based on publicly available data and market comparables. While highly accurate, they serve as estimates. For a precise appraisal, consult ${tenant.brand.teamName} or a licensed appraiser.`
    },
    {
      question: 'How long does the valuation take?',
      answer:
        'Most valuations are completed instantly after you provide basic property information. The entire process typically takes 3-5 minutes.'
    },
    {
      question: 'Is the valuation tool free?',
      answer:
        'Yes! Our home valuation tool is completely free. No credit card required.'
    },
    {
      question: 'What information do I need to get a valuation?',
      answer:
        "You'll need your property address, number of bedrooms and bathrooms, square footage (if known), and year built. The more details you provide, the more accurate the estimate."
    }
  ]

  return (
    <SearchProvider>
      <SelectOptionsProvider>
        {!isResultPage && (
          <>
            <StructuredData data={breadcrumbSchema(breadcrumbItems)} />
            <StructuredData data={faqSchema(estimateFaqs)} />
          </>
        )}
        <EstimateProvider
          step={step}
          clientId={clientId}
          estimateId={estimateId}
          signature={signature}
          rest={rest}
        >
          <EstimateStepsProvider>
            <Suspense>
              <EstimateRouteWrapper />
            </Suspense>
          </EstimateStepsProvider>
        </EstimateProvider>
      </SelectOptionsProvider>
    </SearchProvider>
  )
}

export default EstimatePageContent
