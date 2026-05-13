import APIBase from './APIBase'

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

export const SEO_PAGE_TYPES: SeoPageType[] = [
  'city',
  'city_subtype',
  'neighborhood',
  'zipcode',
  'property_type',
  'county',
  'school_elementary',
  'school_middle',
  'school_high',
  'school_district',
  'popular_search'
]

export const ACTIVE_SEO_PAGE_TYPES: SeoPageType[] = [
  'city',
  'city_subtype',
  'neighborhood',
  'zipcode',
  'property_type'
]

export interface SeoMetaTemplate {
  id: string
  page_type: SeoPageType
  title_template: string
  description_template: string
  enabled: boolean
  updated_at: string
  updated_by_user_id: string | null
}

export interface PreviewResponse {
  preview: {
    title: string
    description: string
    context: Record<string, string>
  }
}

class APISeoMetaTemplates extends APIBase {
  async getAll(): Promise<SeoMetaTemplate[]> {
    const r = await this.fetchJSON<{ templates: SeoMetaTemplate[] }>('/seo-meta-templates')
    return r.templates
  }

  async getByPageType(pageType: SeoPageType): Promise<SeoMetaTemplate | null> {
    try {
      const r = await this.fetchJSON<{ template: SeoMetaTemplate }>(`/seo-meta-templates/page-type/${pageType}`)
      return r.template
    } catch {
      return null
    }
  }

  async upsert(input: {
    pageType: SeoPageType
    titleTemplate: string
    descriptionTemplate: string
    enabled?: boolean
  }): Promise<SeoMetaTemplate> {
    const r = await this.fetchJSON<{ template: SeoMetaTemplate }>('/seo-meta-templates', {
      method: 'POST',
      body: JSON.stringify(input)
    })
    return r.template
  }

  async resetToDefault(pageType: SeoPageType): Promise<SeoMetaTemplate> {
    const r = await this.fetchJSON<{ template: SeoMetaTemplate }>(`/seo-meta-templates/${pageType}`, {
      method: 'DELETE'
    })
    return r.template
  }

  async previewSaved(pageType: SeoPageType): Promise<PreviewResponse['preview']> {
    const r = await this.fetchJSON<PreviewResponse>(`/seo-meta-templates/preview/${pageType}`)
    return r.preview
  }

  async previewLive(
    pageType: SeoPageType,
    titleTemplate: string,
    descriptionTemplate: string
  ): Promise<PreviewResponse['preview']> {
    const r = await this.fetchJSON<PreviewResponse>(`/seo-meta-templates/preview/${pageType}`, {
      method: 'POST',
      body: JSON.stringify({ titleTemplate, descriptionTemplate })
    })
    return r.preview
  }
}

const apiSeoMetaTemplates = new APISeoMetaTemplates()
export default apiSeoMetaTemplates
