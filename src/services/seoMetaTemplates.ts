/**
 * Server-side helper to fetch the seo_meta_templates row for a given page type
 * and resolve placeholders. Designed for use inside Next.js generateMetadata.
 *
 * Behavior:
 * - Calls the public `/api/seo-meta-templates/page-type/:pageType` endpoint.
 * - If the row is missing or the call fails (e.g. backend down, DB empty
 *   during a first rollout), returns `null` so the caller can fall back to
 *   its existing hardcoded defaults — this preserves prior behavior and
 *   makes the rollout safe.
 * - Replaces `{TOKEN}` patterns using the supplied context. Unresolved tokens
 *   are stripped: this renders public-facing titles, so a missing value (e.g.
 *   the live count fetch failed) must not leak a literal "{COUNT}" to users.
 *   The admin preview (backend service) keeps unknown tokens visible instead.
 * - The "live" placeholders (COUNT, AVG_PRICE, etc.) are computed by the
 *   caller and passed in via context — the helper does not call Repliers.
 */

import { tenant } from '@/configs/tenant.config'

const API_URL = `${process.env.NEXT_PUBLIC_API_URL}/api`

export type SeoPageType =
  | 'city'
  | 'city_subtype'
  | 'neighborhood'
  | 'zipcode'
  | 'property_type'
  | 'county'
  | 'school_elementary'
  | 'school_middle'
  | 'school_high'
  | 'school_district'
  | 'popular_search'

export interface SeoMetaTemplate {
  id: string
  page_type: SeoPageType
  title_template: string
  description_template: string
  enabled: boolean
  updated_at: string
}

export type TemplateContext = Record<string, string | undefined>

// Process-local cache so repeated generateMetadata calls inside one render
// don't refetch the same template row. 60-second TTL matches the live-stats
// cache in the backend service.
const TEMPLATE_CACHE_TTL_MS = 60 * 1000
const templateCache = new Map<
  string,
  { value: SeoMetaTemplate | null; expiresAt: number }
>()

export async function fetchSeoMetaTemplate(
  pageType: SeoPageType
): Promise<SeoMetaTemplate | null> {
  const now = Date.now()
  const hit = templateCache.get(pageType)
  if (hit && hit.expiresAt > now) return hit.value

  try {
    const res = await fetch(
      `${API_URL}/seo-meta-templates/page-type/${pageType}`,
      {
        // Don't blow up if the backend is sluggish — generateMetadata has its
        // own implicit budget from Next.js.
        next: { revalidate: 60 }
      }
    )
    if (!res.ok) {
      templateCache.set(pageType, {
        value: null,
        expiresAt: now + TEMPLATE_CACHE_TTL_MS
      })
      return null
    }
    const data = (await res.json()) as { template: SeoMetaTemplate }
    const value = data.template ?? null
    templateCache.set(pageType, {
      value,
      expiresAt: now + TEMPLATE_CACHE_TTL_MS
    })
    return value
  } catch {
    templateCache.set(pageType, {
      value: null,
      expiresAt: now + TEMPLATE_CACHE_TTL_MS
    })
    return null
  }
}

export function resolveTemplate(
  template: string,
  context: TemplateContext
): string {
  if (!template) return ''
  const result = template.replace(/\{([A-Z_]+)\}/g, (_match, key) => {
    return context[key] ?? ''
  })
  return result
    .replace(/\s{2,}/g, ' ')
    .replace(/\s+,/g, ',')
    .replace(/,\s*,/g, ',')
    .replace(/\(\s*\)/g, '')
    .trim()
}

/**
 * Render a {title, description} pair against the saved template if one exists
 * and is enabled. Returns null when the template row is missing/disabled so
 * callers can fall back to their hardcoded defaults.
 */
export async function renderSeoMeta(
  pageType: SeoPageType,
  context: TemplateContext
): Promise<{ title: string; description: string } | null> {
  const template = await fetchSeoMetaTemplate(pageType)
  if (!template || !template.enabled) return null
  const baseContext: TemplateContext = {
    COMPANY: tenant.brand.teamName,
    STATE: 'FL',
    STATE_FULL: 'Florida',
    ...context
  }
  return {
    title: resolveTemplate(template.title_template, baseContext),
    description: resolveTemplate(template.description_template, baseContext)
  }
}
