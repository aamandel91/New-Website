# Admin Panel Implementation Plan - SAAS Adaptation

## Overview
This document outlines how to adapt the Lovable admin panel specification to work with the existing infrastructure (PostgreSQL + Koa + Next.js) and make it SAAS-ready for resale.

---

## Phase 1: Foundation & Multi-Tenant Architecture (CRITICAL FOR SAAS)

### 1.1 Database Schema - Multi-Tenant Foundation

**New Tables Required:**

```sql
-- Organizations/Workspaces (SAAS tenants)
CREATE TABLE organizations (
  id BIGSERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(100) UNIQUE NOT NULL,
  plan VARCHAR(50) DEFAULT 'trial', -- 'trial', 'starter', 'professional', 'enterprise'
  status VARCHAR(50) DEFAULT 'active', -- 'active', 'suspended', 'cancelled'
  settings JSONB DEFAULT '{}', -- Custom branding, features enabled, etc.
  stripe_customer_id VARCHAR(255),
  stripe_subscription_id VARCHAR(255),
  trial_ends_at TIMESTAMP,
  subdomain VARCHAR(100) UNIQUE,
  custom_domain VARCHAR(255),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Organization Members
CREATE TABLE organization_members (
  id BIGSERIAL PRIMARY KEY,
  org_id BIGINT REFERENCES organizations(id) ON DELETE CASCADE,
  email VARCHAR(255) NOT NULL,
  role VARCHAR(50) NOT NULL, -- 'owner', 'admin', 'agent', 'member'
  invited_by VARCHAR(255),
  invited_at TIMESTAMP,
  joined_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(org_id, email)
);

-- Usage Tracking (for billing)
CREATE TABLE organization_usage (
  id BIGSERIAL PRIMARY KEY,
  org_id BIGINT REFERENCES organizations(id) ON DELETE CASCADE,
  metric VARCHAR(100), -- 'api_calls', 'storage_mb', 'users', 'leads'
  value INTEGER,
  period_start TIMESTAMP,
  period_end TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Invitations
CREATE TABLE invitations (
  id BIGSERIAL PRIMARY KEY,
  org_id BIGINT REFERENCES organizations(id) ON DELETE CASCADE,
  email VARCHAR(255) NOT NULL,
  role VARCHAR(50) NOT NULL,
  token VARCHAR(255) UNIQUE NOT NULL,
  invited_by VARCHAR(255),
  expires_at TIMESTAMP,
  accepted_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);
```

**Migrate Existing Tables:**

```sql
-- Add org_id to existing tables
ALTER TABLE acl ADD COLUMN org_id BIGINT REFERENCES organizations(id);
ALTER TABLE blogs ADD COLUMN org_id BIGINT REFERENCES organizations(id);
ALTER TABLE admin_settings ADD COLUMN org_id BIGINT REFERENCES organizations(id);
ALTER TABLE assets ADD COLUMN org_id BIGINT REFERENCES organizations(id);

-- Create indexes
CREATE INDEX idx_acl_org_id ON acl(org_id);
CREATE INDEX idx_blogs_org_id ON blogs(org_id);
CREATE INDEX idx_admin_settings_org_id ON admin_settings(org_id);
CREATE INDEX idx_org_members_org_id ON organization_members(org_id);
CREATE INDEX idx_org_members_email ON organization_members(email);
```

### 1.2 Backend Middleware - Tenant Context

**File:** `backend/src/middleware/tenantContext.ts`

```typescript
import { Context, Next } from 'koa';
import { OrganizationService } from '../services/OrganizationService';

export const tenantContext = async (ctx: Context, next: Next) => {
  let orgId: number | null = null;

  // Detect organization from:
  // 1. Subdomain (tenant.yourdomain.com)
  // 2. Custom domain
  // 3. Header (for API clients)
  // 4. Query param (for testing)

  const host = ctx.request.hostname;
  const orgHeader = ctx.request.headers['x-organization-id'];
  const orgParam = ctx.query.org_id;

  if (orgHeader) {
    orgId = parseInt(orgHeader as string);
  } else if (orgParam) {
    orgId = parseInt(orgParam as string);
  } else {
    // Extract subdomain
    const parts = host.split('.');
    if (parts.length >= 3) {
      const subdomain = parts[0];
      const org = await OrganizationService.findBySubdomain(subdomain);
      orgId = org?.id || null;
    } else {
      // Try custom domain
      const org = await OrganizationService.findByCustomDomain(host);
      orgId = org?.id || null;
    }
  }

  ctx.state.orgId = orgId;
  ctx.state.org = orgId ? await OrganizationService.findById(orgId) : null;

  await next();
};
```

### 1.3 Backend Service - Organization Management

**File:** `backend/src/services/OrganizationService.ts`

```typescript
export class OrganizationService {

  static async create(data: {
    name: string;
    slug: string;
    plan?: string;
    subdomain: string;
    ownerEmail: string;
  }) {
    const org = await knex('organizations').insert({
      name: data.name,
      slug: data.slug,
      plan: data.plan || 'trial',
      subdomain: data.subdomain,
      trial_ends_at: knex.raw("NOW() + INTERVAL '14 days'")
    }).returning('*');

    // Add owner as member
    await knex('organization_members').insert({
      org_id: org[0].id,
      email: data.ownerEmail,
      role: 'owner',
      joined_at: knex.raw('NOW()')
    });

    // Add owner to ACL
    await knex('acl').insert({
      email: data.ownerEmail,
      role: UserRole.Admin, // Admin role in new org
      org_id: org[0].id
    });

    return org[0];
  }

  static async findBySubdomain(subdomain: string) {
    return knex('organizations').where({ subdomain }).first();
  }

  static async findByCustomDomain(domain: string) {
    return knex('organizations').where({ custom_domain: domain }).first();
  }

  static async getMembers(orgId: number) {
    return knex('organization_members')
      .where({ org_id: orgId })
      .orderBy('created_at', 'desc');
  }

  static async addMember(orgId: number, email: string, role: string, invitedBy: string) {
    return knex('organization_members').insert({
      org_id: orgId,
      email,
      role,
      invited_by: invitedBy,
      invited_at: knex.raw('NOW()')
    }).returning('*');
  }

  static async updateSettings(orgId: number, settings: object) {
    return knex('organizations')
      .where({ id: orgId })
      .update({
        settings: knex.raw('settings || ?', [JSON.stringify(settings)]),
        updated_at: knex.raw('NOW()')
      })
      .returning('*');
  }

  static async trackUsage(orgId: number, metric: string, value: number) {
    return knex('organization_usage').insert({
      org_id: orgId,
      metric,
      value,
      period_start: knex.raw('DATE_TRUNC(\'day\', NOW())'),
      period_end: knex.raw('DATE_TRUNC(\'day\', NOW()) + INTERVAL \'1 day\'')
    });
  }
}
```

### 1.4 Frontend Context - Organization Provider

**File:** `src/providers/OrganizationProvider.tsx`

```typescript
'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { APIOrganization } from '@/api/APIOrganization';

interface Organization {
  id: number;
  name: string;
  slug: string;
  plan: string;
  status: string;
  settings: any;
  subdomain: string;
  custom_domain?: string;
}

interface OrganizationContextValue {
  organization: Organization | null;
  loading: boolean;
  members: any[];
  fetchMembers: () => Promise<void>;
  inviteMember: (email: string, role: string) => Promise<void>;
  updateSettings: (settings: any) => Promise<void>;
}

const OrganizationContext = createContext<OrganizationContextValue | undefined>(undefined);

export const OrganizationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [loading, setLoading] = useState(true);
  const [members, setMembers] = useState<any[]>([]);

  const apiOrg = new APIOrganization();

  useEffect(() => {
    fetchOrganization();
  }, []);

  const fetchOrganization = async () => {
    try {
      const org = await apiOrg.getCurrent();
      setOrganization(org);
    } catch (error) {
      console.error('Failed to fetch organization:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMembers = async () => {
    if (!organization) return;
    const data = await apiOrg.getMembers(organization.id);
    setMembers(data);
  };

  const inviteMember = async (email: string, role: string) => {
    if (!organization) return;
    await apiOrg.inviteMember(organization.id, { email, role });
    await fetchMembers();
  };

  const updateSettings = async (settings: any) => {
    if (!organization) return;
    const updated = await apiOrg.updateSettings(organization.id, settings);
    setOrganization(updated);
  };

  return (
    <OrganizationContext.Provider value={{
      organization,
      loading,
      members,
      fetchMembers,
      inviteMember,
      updateSettings
    }}>
      {children}
    </OrganizationContext.Provider>
  );
};

export const useOrganization = () => {
  const context = useContext(OrganizationContext);
  if (!context) throw new Error('useOrganization must be used within OrganizationProvider');
  return context;
};
```

---

## Phase 2: Admin Panel Core Features

### 2.1 Analytics Dashboard (`/admin/analytics`)

**Database Tables:**

```sql
CREATE TABLE analytics_events (
  id BIGSERIAL PRIMARY KEY,
  org_id BIGINT REFERENCES organizations(id),
  event_type VARCHAR(100), -- 'page_view', 'lead_created', 'property_view', 'search'
  user_email VARCHAR(255),
  properties JSONB, -- Custom event properties
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_analytics_org_event ON analytics_events(org_id, event_type, created_at);

CREATE TABLE analytics_metrics (
  id BIGSERIAL PRIMARY KEY,
  org_id BIGINT REFERENCES organizations(id),
  metric_name VARCHAR(100), -- 'total_leads', 'page_views', 'conversion_rate'
  metric_value DECIMAL(10,2),
  date DATE,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(org_id, metric_name, date)
);
```

**Backend API:**

```typescript
// GET /api/admin/analytics/overview
router.get('/analytics/overview', roleMiddleware([UserRole.Admin, UserRole.Root]), async (ctx) => {
  const { orgId } = ctx.state;
  const { dateFrom, dateTo } = ctx.query;

  const metrics = await AnalyticsService.getOverview(orgId, { dateFrom, dateTo });
  ctx.body = metrics;
});

// GET /api/admin/analytics/leads-by-source
// GET /api/admin/analytics/top-pages
// GET /api/admin/analytics/conversion-funnel
```

**Frontend Component:** `src/components/pages/admin/analytics/AnalyticsDashboard.tsx`

### 2.2 Lead Management (`/admin/leads`)

**Database Tables:**

```sql
CREATE TABLE leads (
  id BIGSERIAL PRIMARY KEY,
  org_id BIGINT REFERENCES organizations(id),
  first_name VARCHAR(255),
  last_name VARCHAR(255),
  email VARCHAR(255) NOT NULL,
  phone VARCHAR(50),
  source VARCHAR(100), -- 'ppc', 'organic', 'direct', 'referral'
  status VARCHAR(50) DEFAULT 'new', -- 'new', 'contacted', 'qualified', 'showing', 'offer', 'under_contract', 'closed', 'lost'
  assigned_to VARCHAR(255), -- agent email
  property_interest TEXT,
  tags JSONB DEFAULT '[]',
  custom_fields JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE lead_activities (
  id BIGSERIAL PRIMARY KEY,
  org_id BIGINT REFERENCES organizations(id),
  lead_id BIGINT REFERENCES leads(id) ON DELETE CASCADE,
  activity_type VARCHAR(100), -- 'call', 'email', 'meeting', 'status_change', 'note', 'property_view'
  description TEXT,
  performed_by VARCHAR(255),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_leads_org ON leads(org_id, status);
CREATE INDEX idx_lead_activities_lead ON lead_activities(lead_id, created_at DESC);
```

**Backend API:**

```typescript
// CRUD operations for leads
router.get('/leads', roleMiddleware([UserRole.Admin, UserRole.Agent]), async (ctx) => {
  const { orgId } = ctx.state;
  const { status, source, assignedTo, search, page = 1, limit = 20 } = ctx.query;

  const leads = await LeadsService.list(orgId, {
    status,
    source,
    assignedTo,
    search,
    page: parseInt(page),
    limit: parseInt(limit)
  });

  ctx.body = leads;
});

router.post('/leads', roleMiddleware([UserRole.Admin, UserRole.Agent]), async (ctx) => {
  const { orgId } = ctx.state;
  const leadData = ctx.request.body;

  const lead = await LeadsService.create(orgId, leadData);
  ctx.body = lead;
});

router.patch('/leads/:id', roleMiddleware([UserRole.Admin, UserRole.Agent]), async (ctx) => {
  const { orgId } = ctx.state;
  const { id } = ctx.params;

  const lead = await LeadsService.update(orgId, id, ctx.request.body);
  ctx.body = lead;
});

router.get('/leads/:id/activities', roleMiddleware([UserRole.Admin, UserRole.Agent]), async (ctx) => {
  const { orgId } = ctx.state;
  const { id } = ctx.params;

  const activities = await LeadsService.getActivities(orgId, id);
  ctx.body = activities;
});

router.post('/leads/:id/activities', roleMiddleware([UserRole.Admin, UserRole.Agent]), async (ctx) => {
  const { orgId } = ctx.state;
  const { id } = ctx.params;

  const activity = await LeadsService.addActivity(orgId, id, ctx.request.body);
  ctx.body = activity;
});
```

**Frontend Components:**
- `src/components/pages/admin/leads/LeadsPage.tsx` - Main page with filters
- `src/components/pages/admin/leads/LeadCard.tsx` - Individual lead card
- `src/components/pages/admin/leads/LeadActivityDialog.tsx` - Activity timeline
- `src/components/pages/admin/leads/LeadStatusPipeline.tsx` - Visual pipeline

### 2.3 Content Pages Management (`/admin/content-pages`)

**Database Tables:**

```sql
CREATE TABLE content_pages (
  id BIGSERIAL PRIMARY KEY,
  org_id BIGINT REFERENCES organizations(id),
  title VARCHAR(255) NOT NULL,
  slug VARCHAR(255) NOT NULL,
  content JSONB DEFAULT '{}', -- { modules: [], sidebar: [] }
  status VARCHAR(50) DEFAULT 'draft', -- 'draft', 'published'
  featured_image_url TEXT,
  featured_image_cloudinary_id VARCHAR(255),
  is_template BOOLEAN DEFAULT false,
  template_name VARCHAR(255),
  parent_page_id BIGINT REFERENCES content_pages(id),
  category VARCHAR(100),
  meta_title VARCHAR(255),
  meta_description TEXT,
  meta_keywords JSONB DEFAULT '[]',
  custom_css TEXT,
  custom_js TEXT,
  published_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(org_id, slug)
);

CREATE INDEX idx_content_pages_org ON content_pages(org_id, status);
CREATE INDEX idx_content_pages_slug ON content_pages(org_id, slug);
```

**Module System:**

Modules are stored as JSON in the `content` field:

```json
{
  "modules": [
    {
      "id": "module-1",
      "type": "rich_text",
      "config": {
        "content": "<p>Rich text content</p>"
      }
    },
    {
      "id": "module-2",
      "type": "saved_search_listings",
      "config": {
        "layout": "grid",
        "apiFilters": {
          "city": "Miami",
          "propertyType": "condo"
        },
        "limit": 12
      }
    },
    {
      "id": "module-3",
      "type": "testimonials",
      "config": {
        "count": 3,
        "featured": true
      }
    }
  ],
  "sidebar": [
    {
      "id": "sidebar-1",
      "type": "contact_form"
    },
    {
      "id": "sidebar-2",
      "type": "featured_properties",
      "config": {
        "count": 5
      }
    }
  ]
}
```

**Backend API:**

```typescript
router.get('/content-pages', roleMiddleware([UserRole.Admin]), async (ctx) => {
  const { orgId } = ctx.state;
  const pages = await ContentPagesService.list(orgId, ctx.query);
  ctx.body = pages;
});

router.post('/content-pages', roleMiddleware([UserRole.Admin]), async (ctx) => {
  const { orgId } = ctx.state;
  const page = await ContentPagesService.create(orgId, ctx.request.body);
  ctx.body = page;
});

router.patch('/content-pages/:id', roleMiddleware([UserRole.Admin]), async (ctx) => {
  const { orgId } = ctx.state;
  const page = await ContentPagesService.update(orgId, ctx.params.id, ctx.request.body);
  ctx.body = page;
});
```

**Frontend Components:**
- `src/components/admin/ModuleBuilder.tsx` - Drag-and-drop module builder
- `src/components/admin/ModuleEditor.tsx` - Module-specific config forms
- `src/components/admin/SidebarBuilder.tsx` - Sidebar builder
- `src/components/pages/admin/content-pages/ContentPageEditor.tsx` - Main editor

### 2.4 Featured Cities, Neighborhoods, ZIP Codes

**Database Tables:**

```sql
CREATE TABLE featured_cities (
  id BIGSERIAL PRIMARY KEY,
  org_id BIGINT REFERENCES organizations(id),
  name VARCHAR(255) NOT NULL,
  state VARCHAR(2) NOT NULL,
  slug VARCHAR(255) NOT NULL,
  description TEXT,
  hero_image_url TEXT,
  hero_image_cloudinary_id VARCHAR(255),
  featured BOOLEAN DEFAULT false,
  sort_order INTEGER DEFAULT 0,
  custom_content JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(org_id, slug)
);

CREATE TABLE featured_neighborhoods (
  id BIGSERIAL PRIMARY KEY,
  org_id BIGINT REFERENCES organizations(id),
  name VARCHAR(255) NOT NULL,
  city VARCHAR(255) NOT NULL,
  state VARCHAR(2) NOT NULL,
  slug VARCHAR(255) NOT NULL,
  description TEXT,
  hero_image_url TEXT,
  hero_image_cloudinary_id VARCHAR(255),
  avg_price DECIMAL(12,2),
  property_count INTEGER,
  featured BOOLEAN DEFAULT false,
  sort_order INTEGER DEFAULT 0,
  custom_content JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(org_id, slug)
);

CREATE TABLE featured_zipcodes (
  id BIGSERIAL PRIMARY KEY,
  org_id BIGINT REFERENCES organizations(id),
  zipcode VARCHAR(10) NOT NULL,
  city VARCHAR(255) NOT NULL,
  state VARCHAR(2) NOT NULL,
  county VARCHAR(255),
  slug VARCHAR(255) NOT NULL,
  description TEXT,
  avg_price DECIMAL(12,2),
  property_count INTEGER,
  featured BOOLEAN DEFAULT false,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(org_id, slug)
);

CREATE TABLE school_districts (
  id BIGSERIAL PRIMARY KEY,
  org_id BIGINT REFERENCES organizations(id),
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(255) NOT NULL,
  city VARCHAR(255),
  county VARCHAR(255),
  state VARCHAR(2) NOT NULL,
  rating DECIMAL(2,1),
  total_schools INTEGER,
  description TEXT,
  boundaries JSONB, -- GeoJSON polygon
  featured BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(org_id, slug)
);
```

**Standard CRUD APIs for each** (similar pattern to content pages)

### 2.5 Property Types Management

**Database Table:**

```sql
CREATE TABLE property_subtypes (
  id BIGSERIAL PRIMARY KEY,
  org_id BIGINT REFERENCES organizations(id),
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(255) NOT NULL,
  description TEXT,
  api_filters JSONB DEFAULT '{}', -- Filters to pass to Repliers API
  icon VARCHAR(100), -- Lucide icon name
  featured BOOLEAN DEFAULT false,
  sort_order INTEGER DEFAULT 0,
  meta_title VARCHAR(255),
  meta_description TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(org_id, slug)
);
```

Example API filters:

```json
{
  "propertyType": ["Condo", "Townhouse"],
  "minBeds": 2
}
```

### 2.6 Navigation Management

**Database Table:**

```sql
CREATE TABLE navigation_items (
  id BIGSERIAL PRIMARY KEY,
  org_id BIGINT REFERENCES organizations(id),
  label VARCHAR(255) NOT NULL,
  type VARCHAR(50) NOT NULL, -- 'internal', 'external', 'dropdown'
  url VARCHAR(500),
  icon VARCHAR(100), -- Lucide icon name
  position VARCHAR(50), -- 'left', 'right', 'mobile'
  dropdown_items JSONB DEFAULT '[]', -- For dropdown type
  target VARCHAR(20) DEFAULT '_self', -- '_self', '_blank'
  css_classes TEXT,
  visible BOOLEAN DEFAULT true,
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_nav_items_org ON navigation_items(org_id, position, order_index);
```

**Frontend:** Drag-and-drop reordering using `@hello-pangea/dnd` (already in package.json)

### 2.7 Testimonials Management

**Database Table:**

```sql
CREATE TABLE testimonials (
  id BIGSERIAL PRIMARY KEY,
  org_id BIGINT REFERENCES organizations(id),
  client_name VARCHAR(255) NOT NULL,
  client_role VARCHAR(255),
  content TEXT NOT NULL,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  agent_email VARCHAR(255),
  property_address TEXT,
  featured BOOLEAN DEFAULT false,
  published BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

---

## Phase 3: Advanced Features

### 3.1 AI Blog Content Generator

**Leverage existing Anthropic AI integration** (already in package.json: `@anthropic-ai/sdk`)

**Backend Service:** `backend/src/services/AIContentService.ts`

```typescript
import Anthropic from '@anthropic-ai/sdk';

export class AIContentService {

  static async generateBlogPost(keyword: string, city?: string): Promise<{
    title: string;
    excerpt: string;
    content: string;
    meta_title: string;
    meta_description: string;
  }> {
    const anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY
    });

    const prompt = `Generate a comprehensive SEO-optimized blog post about "${keyword}"${city ? ` in ${city}` : ''}.

Include:
1. Engaging title (under 60 characters)
2. Excerpt (under 160 characters)
3. Full article (1500+ words) in markdown format
4. Meta title for SEO
5. Meta description

Format as JSON with keys: title, excerpt, content, meta_title, meta_description`;

    const message = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 4000,
      messages: [{
        role: 'user',
        content: prompt
      }]
    });

    const response = message.content[0].text;
    return JSON.parse(response);
  }

  static async suggestKeywords(topic: string): Promise<{
    keyword: string;
    searchVolume: number;
    difficulty: number;
    opportunityScore: number;
  }[]> {
    // Integration with SEO API (SEMrush, Ahrefs, or DataForSEO)
    // Or use AI to suggest based on real estate trends
  }
}
```

**API Endpoints:**

```typescript
router.post('/ai/suggest-keywords', roleMiddleware([UserRole.Admin]), async (ctx) => {
  const { topic } = ctx.request.body;
  const keywords = await AIContentService.suggestKeywords(topic);
  ctx.body = keywords;
});

router.post('/ai/generate-blog', roleMiddleware([UserRole.Admin]), async (ctx) => {
  const { keyword, city } = ctx.request.body;
  const post = await AIContentService.generateBlogPost(keyword, city);
  ctx.body = post;
});
```

**Frontend:** `src/components/pages/admin/blog-generator/BlogGeneratorPage.tsx`

### 3.2 Bulk Page Generator

**Backend Service:** `backend/src/services/BulkPageService.ts`

```typescript
export class BulkPageService {

  static async generateCityPages(orgId: number, cityIds: number[], template: string) {
    const cities = await knex('featured_cities')
      .whereIn('id', cityIds)
      .where({ org_id: orgId });

    const pages = [];

    for (const city of cities) {
      // Generate AI content
      const content = await AIContentService.generatePageContent({
        template,
        variables: {
          cityName: city.name,
          state: city.state,
          description: city.description
        }
      });

      // Create page
      const page = await ContentPagesService.create(orgId, {
        title: `${city.name}, ${city.state} Real Estate`,
        slug: `homes-for-sale-${city.slug}`,
        content,
        status: 'published',
        category: 'city-pages',
        meta_title: `${city.name} Homes for Sale | Real Estate`,
        meta_description: `Browse ${city.name}, ${city.state} real estate listings.`
      });

      pages.push(page);
    }

    return pages;
  }

  // Similar methods for:
  // - generateZipCodePages()
  // - generateNeighborhoodPages()
  // - generatePropertyTypePages()
  // - generateSchoolDistrictPages()
}
```

### 3.3 Listing Enhancements

**Database Table:**

```sql
CREATE TABLE listing_enhancements (
  id BIGSERIAL PRIMARY KEY,
  org_id BIGINT REFERENCES organizations(id),
  mls_number VARCHAR(100) NOT NULL,
  additional_photos JSONB DEFAULT '[]', -- Array of Cloudinary IDs
  floor_plans JSONB DEFAULT '[]',
  documents JSONB DEFAULT '[]', -- HOA docs, disclosures
  video_tours JSONB DEFAULT '[]', -- YouTube, Vimeo, Matterport URLs
  office_id VARCHAR(100),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(org_id, mls_number)
);
```

---

## Phase 4: SEO & Configuration

### 4.1 SEO Settings & Sitemap Generation

**Database Table:**

```sql
CREATE TABLE seo_settings (
  id BIGSERIAL PRIMARY KEY,
  org_id BIGINT REFERENCES organizations(id) UNIQUE,
  default_meta_title VARCHAR(255),
  default_meta_description TEXT,
  index_property_pages BOOLEAN DEFAULT false,
  robots_txt TEXT,
  canonical_url VARCHAR(500),
  og_defaults JSONB DEFAULT '{}',
  sitemap_generated_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

**Sitemap Generation:**

```typescript
router.get('/seo/generate-sitemap', roleMiddleware([UserRole.Admin]), async (ctx) => {
  const { orgId } = ctx.state;

  // Get all content pages
  const pages = await ContentPagesService.list(orgId, { status: 'published' });

  // Get all blogs
  const blogs = await BlogService.list(orgId, { status: 'published' });

  // Optionally get property listings (if indexed)
  const seoSettings = await SEOSettingsService.get(orgId);
  let listings = [];
  if (seoSettings.index_property_pages) {
    // Fetch from Repliers API
    listings = await ListingsService.getAll();
  }

  // Generate XML
  const sitemap = generateSitemapXML([...pages, ...blogs, ...listings]);

  // Update last generated timestamp
  await SEOSettingsService.updateGeneratedAt(orgId);

  ctx.type = 'application/xml';
  ctx.body = sitemap;
});
```

### 4.2 Site Layout Settings

**Store in existing `admin_settings` table or create `site_settings` table:**

```sql
CREATE TABLE site_settings (
  id BIGSERIAL PRIMARY KEY,
  org_id BIGINT REFERENCES organizations(id) UNIQUE,
  logo_cloudinary_id VARCHAR(255),
  site_name VARCHAR(255),
  site_tagline TEXT,
  header_style VARCHAR(50) DEFAULT 'fixed', -- 'fixed', 'sticky', 'transparent'
  footer_content TEXT,
  primary_color VARCHAR(7),
  secondary_color VARCHAR(7),
  accent_color VARCHAR(7),
  font_family VARCHAR(255),
  contact_phone VARCHAR(50),
  contact_email VARCHAR(255),
  contact_address TEXT,
  social_links JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

---

## Phase 5: SAAS Features

### 5.1 Billing Integration (Stripe)

**Install:** `npm install stripe @stripe/stripe-js`

**Backend Service:** `backend/src/services/BillingService.ts`

```typescript
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16'
});

export class BillingService {

  static async createCustomer(orgId: number, email: string) {
    const customer = await stripe.customers.create({
      email,
      metadata: { org_id: orgId.toString() }
    });

    await knex('organizations')
      .where({ id: orgId })
      .update({ stripe_customer_id: customer.id });

    return customer;
  }

  static async createSubscription(orgId: number, priceId: string) {
    const org = await knex('organizations').where({ id: orgId }).first();

    const subscription = await stripe.subscriptions.create({
      customer: org.stripe_customer_id,
      items: [{ price: priceId }],
      metadata: { org_id: orgId.toString() }
    });

    await knex('organizations')
      .where({ id: orgId })
      .update({
        stripe_subscription_id: subscription.id,
        plan: 'professional', // Based on priceId
        status: 'active'
      });

    return subscription;
  }

  static async handleWebhook(event: Stripe.Event) {
    switch (event.type) {
      case 'customer.subscription.updated':
      case 'customer.subscription.deleted':
        // Update org status
        break;
      case 'invoice.payment_succeeded':
        // Track payment
        break;
      case 'invoice.payment_failed':
        // Suspend org
        break;
    }
  }
}
```

**Webhook Endpoint:**

```typescript
router.post('/webhooks/stripe', async (ctx) => {
  const sig = ctx.request.headers['stripe-signature'];
  const event = stripe.webhooks.constructEvent(
    ctx.request.rawBody,
    sig,
    process.env.STRIPE_WEBHOOK_SECRET!
  );

  await BillingService.handleWebhook(event);

  ctx.body = { received: true };
});
```

### 5.2 Usage Limits & Enforcement

**Middleware:** `backend/src/middleware/usageLimits.ts`

```typescript
export const checkUsageLimits = (metric: string) => {
  return async (ctx: Context, next: Next) => {
    const { org, orgId } = ctx.state;

    if (!org) {
      ctx.status = 403;
      ctx.body = { error: 'Organization not found' };
      return;
    }

    const limits = PLAN_LIMITS[org.plan];
    const usage = await OrganizationService.getUsage(orgId, metric);

    if (usage >= limits[metric]) {
      ctx.status = 429;
      ctx.body = {
        error: 'Usage limit exceeded',
        plan: org.plan,
        limit: limits[metric],
        current: usage
      };
      return;
    }

    await next();
  };
};

const PLAN_LIMITS = {
  trial: {
    api_calls: 1000,
    storage_mb: 100,
    users: 2,
    leads: 50
  },
  starter: {
    api_calls: 10000,
    storage_mb: 1000,
    users: 5,
    leads: 500
  },
  professional: {
    api_calls: 100000,
    storage_mb: 10000,
    users: 25,
    leads: 5000
  },
  enterprise: {
    api_calls: Infinity,
    storage_mb: Infinity,
    users: Infinity,
    leads: Infinity
  }
};
```

### 5.3 Subdomain & Custom Domain Routing

**Next.js Middleware:** `middleware.ts`

```typescript
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const hostname = request.headers.get('host') || '';
  const url = request.nextUrl.clone();

  // Extract subdomain
  const parts = hostname.split('.');

  // Check if subdomain exists (not www, not main domain)
  if (parts.length >= 3 && parts[0] !== 'www') {
    const subdomain = parts[0];

    // Rewrite to organization-specific path
    url.pathname = `/_org/${subdomain}${url.pathname}`;
    return NextResponse.rewrite(url);
  }

  // Custom domain check (fetch from DB/cache)
  // If custom domain, rewrite similarly

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};
```

**App Router Structure:**

```
/app/
  /_org/
    /[subdomain]/
      /page.tsx          - Org-specific homepage
      /admin/            - Org admin panel
      /listings/         - Org listings
      ...
```

---

## Phase 6: Migration & Rollout

### 6.1 Migration Strategy

1. **Create Default Organization:**
```sql
INSERT INTO organizations (name, slug, plan, subdomain, status)
VALUES ('Default Organization', 'default', 'enterprise', 'www', 'active')
RETURNING id;

-- Assign existing users to default org
INSERT INTO organization_members (org_id, email, role)
SELECT 1, email,
  CASE
    WHEN role = 1 THEN 'owner'
    WHEN role = 3 THEN 'admin'
    WHEN role = 4 THEN 'agent'
    ELSE 'member'
  END
FROM acl;

-- Update existing data with org_id = 1
UPDATE blogs SET org_id = 1;
UPDATE admin_settings SET org_id = 1;
```

2. **Add Tenant Context Middleware** to all existing routes

3. **Update All Services** to filter by `org_id`

4. **Test with Default Org** - Ensure everything works as before

5. **Deploy Org Signup Flow** - Allow new organizations to sign up

6. **Deploy Billing** - Integrate Stripe for subscriptions

### 6.2 Signup Flow

**Page:** `/signup`

```typescript
// 1. User enters org details
// 2. Create organization
// 3. Create user account
// 4. Send verification email
// 5. Redirect to onboarding
// 6. Start trial (14 days)
```

---

## Implementation Priority

### Priority 1 (Foundation - Week 1-2)
1. ✅ Multi-tenant database schema
2. ✅ Organization service & API
3. ✅ Tenant context middleware
4. ✅ Organization provider (frontend)
5. ✅ Migrate existing data to default org

### Priority 2 (Core Admin Features - Week 3-4)
6. ✅ Lead management system
7. ✅ Analytics dashboard
8. ✅ Content pages management
9. ✅ Featured cities/neighborhoods/zipcodes

### Priority 3 (Advanced Features - Week 5-6)
10. ✅ AI blog content generator
11. ✅ Bulk page generator
12. ✅ Navigation management
13. ✅ Testimonials management

### Priority 4 (SEO & Config - Week 7)
14. ✅ SEO settings & sitemap
15. ✅ Site layout settings
16. ✅ Property types management

### Priority 5 (SAAS Features - Week 8-10)
17. ✅ Billing integration (Stripe)
18. ✅ Usage limits & enforcement
19. ✅ Subdomain routing
20. ✅ Signup flow
21. ✅ Organization settings page

---

## Key Adaptations from Lovable Spec

### What Changed:
1. ❌ **Supabase** → ✅ **PostgreSQL + Knex + Koa**
2. ❌ **Supabase Auth** → ✅ **Custom JWT + OTP**
3. ❌ **Supabase Storage** → ✅ **Cloudinary**
4. ❌ **Supabase Edge Functions** → ✅ **Koa API Routes**
5. ❌ **React Query** → ✅ **Context Providers**
6. ❌ **Shadcn/UI** → ✅ **Material-UI**
7. ❌ **Zustand** → ✅ **React Context**

### What Stayed the Same:
- ✅ Feature list and functionality
- ✅ Database schema concepts (adapted to PostgreSQL)
- ✅ Admin panel UI/UX flow
- ✅ Role-based access control
- ✅ Module/sidebar builder patterns

---

## Estimated Timeline

- **Phase 1 (Foundation):** 2 weeks
- **Phase 2 (Core Admin):** 2 weeks
- **Phase 3 (Advanced):** 2 weeks
- **Phase 4 (SEO):** 1 week
- **Phase 5 (SAAS):** 3 weeks
- **Phase 6 (Migration):** 1 week

**Total:** ~11 weeks for full implementation

---

## Next Steps

1. **Review this plan** and confirm priorities
2. **Choose starting point** (recommend: Phase 1 - Foundation)
3. **Create database migrations** for new tables
4. **Implement org_id tenant isolation**
5. **Build organization management UI**
6. **Start implementing admin features** one by one

---

## Questions to Answer Before Starting

1. **Target Launch Date?** - When do you want this ready?
2. **Pricing Model?** - What plans will you offer (Trial/Starter/Pro/Enterprise)?
3. **Target Market?** - Who are you selling this SAAS to?
4. **Branding?** - Will you white-label or use your own brand?
5. **Priority Features?** - Which admin features are must-haves vs nice-to-haves?
6. **Integration Requirements?** - Besides Repliers API, what else?
7. **Support/Onboarding?** - Will you offer support? How?

Let me know which phase you want to start with!