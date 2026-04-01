# Developer Setup Guide — FloridaHomeFinder

## Prerequisites
- Node.js 20+ (22 recommended)
- PostgreSQL (via Homebrew or Docker)
- Repliers API key ([login.repliers.com](https://login.repliers.com))
- Mapbox token ([mapbox.com](https://account.mapbox.com))

## Quick Start

### 1. Clone and checkout the working branch
```bash
git clone https://github.com/aamandel91/New-Website.git
cd New-Website
git checkout claude/setup-real-estate-frontend-018WhJZHrepD5oiSB8dz5W7m
```

### 2. Set up the frontend
```bash
npm install
cp .env.local.example .env.local
# Edit .env.local with your Mapbox key (see file for instructions)
```

### 3. Set up the database (Mac)
```bash
brew install postgresql@17
brew services start postgresql@17
createdb repliers
```

### 4. Set up the backend
```bash
cd backend
npm install
cp env.example .env
# Edit backend/.env — set these required values:
#   REPLIERS_API_KEY=your_key_here
#   MAPBOX_ACCESS_TOKEN=your_token_here
#   DB_USER=your_mac_username  (run `whoami` to check)
#   DB_PASSWORD=               (leave empty for local Mac Postgres)
```

### 5. Run database migrations and generate JWT keys
```bash
# Still in /backend directory:
npm run knex migrate:latest
mkdir -p keys
openssl genrsa -out keys/private.pem 2048
openssl rsa -in keys/private.pem -pubout -out keys/public.pem
```

### 6. Update the board ID
Edit `src/configs/defaults/search.ts`:
```typescript
defaultBoardId: 110,  // Florida MLS (was 2)
vowBoardId: 110,      // Same
```

### 7. Start both servers
Terminal 1 (backend):
```bash
cd backend
npm run dev
# Runs on http://localhost:8080
```

Terminal 2 (frontend):
```bash
cd New-Website  # root directory
npm run dev
# Runs on http://localhost:3000
```

### 8. Open in browser
- Homepage: http://localhost:3000
- Search/Listings: http://localhost:3000/search/gallery
- Admin Panel: http://localhost:3000/admin/page-generator
- Blog Admin: http://localhost:3000/admin/blog
- Open House Tool: http://localhost:3000/open-house
- Robots.txt Editor: http://localhost:3000/admin/robots

---

## Known Issues for Next Developer

### API Call Format Mismatch (PRIORITY FIX)
Several components make search API calls using POST with `body.filters` and `pageSize`, but the Repliers backend proxy expects GET parameters with `resultsPerPage`. Files that need updating:

- `src/app/listing/[slug]/similarProperties.ts` — `fetchSimilarProperties()` and `fetchMarketStats()`
- `src/services/marketing/fetchFeedProperties.ts` — Feed data fetcher
- `src/services/pageGeneration.ts` — Page generation data service
- `src/services/marketTimeline.ts` — Market timeline graph data

**What to change:** Replace POST body filters with GET query parameters. Replace `pageSize` with `resultsPerPage`. Test each endpoint against the backend to confirm the parameter format.

### Three Backend Routes Disabled
In `backend/src/routes/index.ts`, three routes are commented out because they use direct imports instead of the tsyringe dependency injection pattern used by the rest of the backend:
- contentPages
- navigation  
- aiContent

These need to be refactored to use `@inject('db')` pattern (see `backend/src/repository/acl.ts` for the correct pattern).

---

## Architecture Overview

### Frontend (Next.js 15 + MUI + TypeScript)
- `/src/app/` — Next.js App Router pages
- `/src/components/property-detail/` — Property detail page components (14 features)
- `/src/components/shared/` — Reusable components (MarketTimelineGraph, YouTubeFacade, FAQSection, etc.)
- `/src/components/admin/` — Admin UI components (ImageUploader, etc.)
- `/src/services/` — API clients and data services
- `/src/utils/` — Utilities (templateEngine, keywordSearch, formFilter, analytics, etc.)
- `/src/configs/defaults/` — Configuration (page-generation, geo-blocking, form-filtering, search, etc.)

### Backend (Koa + TypeScript + PostgreSQL)
- `/backend/src/routes/` — API routes
- `/backend/src/services/` — Business logic
- `/backend/src/repository/` — Database access (Knex + tsyringe DI)
- `/backend/src/providers/` — Middleware and infrastructure

### Key Features Built
See the full feature list in the project roadmap or ask Andy for the Perplexity Computer conversation history.

### Feed Endpoints
- `/api/feed/facebook-catalog?format=csv` — Facebook product catalog
- `/api/feed/google-real-estate?format=csv` — Google Ads display remarketing
- `/api/feed/google-page-feed?format=csv` — Dynamic Search Ads
- `/api/feed/ad-customizers?format=csv` — Ad customizer data

### Page Generation
- Admin tool at `/admin/page-generator`
- Config: `src/configs/defaults/page-generation.ts` (22 sub-types, target counties)
- Template engine: `src/utils/templateEngine.ts`
- URL routing: `src/app/florida/[...slugs]/page.tsx`
