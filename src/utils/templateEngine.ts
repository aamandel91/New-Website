import type { TemplateVariables } from '@configs/page-generation'

/**
 * Replaces {{variable}} placeholders in template content
 */
export function processTemplate(template: string, variables: TemplateVariables): string {
  return template.replace(/\{\{(\w+)\}\}/g, (match, key) => {
    const value = variables[key as keyof TemplateVariables]
    return value !== undefined ? String(value) : match
  })
}

/**
 * Generates SEO-optimized meta title from city + subType
 */
export function generateMetaTitle(city: string, subType: string, count: number): string {
  return `${subType} in ${city}, FL | ${count}+ Listings | Florida Home Finder`
}

/**
 * Generates SEO-optimized meta description
 */
export function generateMetaDescription(city: string, county: string, subType: string, count: number): string {
  return `Browse ${count}+ ${subType.toLowerCase()} for sale in ${city}, ${county} County, FL. View photos, prices, and details on the latest listings.`
}

/**
 * Generates slug from state, county, city, and optional subtype
 */
export function generateSlug(city: string, county?: string, subTypeSlug?: string): string {
  const slugify = (str: string) =>
    str
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')

  const parts = ['florida']
  if (county) parts.push(`${slugify(county)}-county`)
  parts.push(slugify(city))
  if (subTypeSlug) parts.push(subTypeSlug)
  return parts.join('/')
}
