# PPC vs Organic Traffic Registration Implementation

## Overview

This implementation adds differentiated registration requirements based on traffic source (PPC vs organic). PPC traffic users are required to register on their **first** property details view, while organic traffic users see an optional registration prompt on their **fourth** property view that can be dismissed.

## Features Implemented

### 1. Traffic Source Tracking

**Frontend:**
- `src/utils/trafficSource.ts` - Utility functions for capturing and storing UTM parameters
- `src/hooks/useTrafficSource.ts` - React hooks for accessing traffic source data
- Automatically captures UTM parameters on page load and stores in sessionStorage
- Determines traffic type (ppc, organic, direct, referral, social, email, other)

**Backend:**
- `backend/src/services/trafficSource.ts` - Service for storing and retrieving traffic source data
- `backend/src/migrations/20251125000001_traffic_source.ts` - Database table for storing client traffic sources
- Stores: utm_source, utm_medium, utm_campaign, utm_term, utm_content, traffic_type, referer, landing_page

### 2. Admin Settings Management

**Frontend:**
- `src/app/admin/settings/page.tsx` - Admin panel for configuring PPC/organic registration settings
- Configure which utm_medium values are considered "PPC traffic"
- Toggle registration requirements on/off for each traffic type
- **Configure view thresholds**: Set which property view number triggers the registration modal

**Backend:**
- `backend/src/services/adminSettings.ts` - Service for managing admin settings
- `backend/src/routes/admin.ts` - API endpoints for settings CRUD
- `backend/src/migrations/20251125000000_admin_settings.ts` - Database table for admin settings
- **Default settings**:
  - PPC sources = ['ppc', 'cpc', 'paid']
  - PPC view threshold = 1 (first view)
  - Organic view threshold = 4 (fourth view)

**API Endpoints:**
- `GET /admin/settings` - Get all settings
- `GET /admin/settings/:key` - Get specific setting
- `PATCH /admin/settings/:key` - Update setting
- `GET /admin/settings/ppc/registration` - Get PPC registration settings
- `PATCH /admin/settings/ppc/registration` - Update PPC registration settings
- `GET /admin/settings/organic/registration` - Get organic registration settings
- `PATCH /admin/settings/organic/registration` - Update organic registration settings

### 3. Property Registration Modal

**Component:** `src/components/shared/Dialogs/PropertyRegistrationDialog/PropertyRegistrationDialog.tsx`

**Features:**
- Shows at configurable property view thresholds for unauthenticated users
- **PPC Traffic:** Modal appears on **1st property view** and cannot be dismissed (required registration)
- **Organic Traffic:** Modal appears on **4th property view** and can be dismissed with "Maybe Later" button
- Includes Google OAuth option
- Includes standard email/password registration form
- All required fields: First name, Last name, Email, Phone number

**Integration:** `src/components/templates/PropertyPageTemplate.tsx`
- Automatically displays modal based on traffic source and view count
- Tracks property view count in sessionStorage
- Only shows for non-authenticated users
- Fetches view thresholds from backend admin settings

### 4. Enhanced Registration

**Updated Files:**
- `src/components/shared/Dialogs/AuthDialog/schemas.ts` - Made phone number required
- `src/components/shared/Dialogs/AuthDialog/components/SignupFormStep.tsx` - Phone marked as required
- `src/services/API/types.ts` - Updated SignUpRequest interface
- `backend/src/validate/auth.ts` - Updated UserSignupDto with traffic source fields

**Required Fields:**
- First name
- Last name
- Email
- Phone number (now required for all registrations)

**Additional Fields Captured:**
- referer (HTTP referrer)
- utmSource
- utmMedium
- utmCampaign
- utmTerm
- utmContent
- landingPage

### 5. Google OAuth Integration

**Features:**
- Google OAuth button in registration modal
- Preserves traffic source through OAuth flow via sessionStorage
- User profile includes name and email from Google
- Phone number collection handled separately (see Known Limitations)

**Files Modified:**
- `backend/src/services/oauth.ts` - Retrieve and store traffic source after OAuth
- `src/components/shared/Dialogs/PropertyRegistrationDialog/PropertyRegistrationDialog.tsx` - Store traffic source before OAuth redirect

### 6. Registration Event Tracking

**Enhanced Event Reporting:**
- `backend/src/services/eventsCollection/selectors/selectClientRegistrationParams.ts`
- Registration events now include:
  - Traffic source information (utm parameters)
  - Traffic type classification
  - Landing page URL
  - Custom fields: customUtmSource, customUtmMedium, customUtmCampaign, customTrafficType

**Sent to Follow Up Boss:**
- Person source: Set based on UTM source/medium
- Person sourceUrl: Landing page or referrer
- Custom fields with traffic source data
- Registration tag automatically added

## Database Schema

### admin_settings Table
```sql
CREATE TABLE admin_settings (
  id BIGINT PRIMARY KEY GENERATED BY DEFAULT AS IDENTITY,
  key VARCHAR NOT NULL UNIQUE,
  value JSONB NOT NULL,
  description TEXT,
  updated_by VARCHAR,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
)
```

### client_traffic_sources Table
```sql
CREATE TABLE client_traffic_sources (
  id BIGINT PRIMARY KEY GENERATED BY DEFAULT AS IDENTITY,
  client_id BIGINT NOT NULL,
  utm_source VARCHAR,
  utm_medium VARCHAR,
  utm_campaign VARCHAR,
  utm_term VARCHAR,
  utm_content VARCHAR,
  traffic_type VARCHAR, -- 'ppc', 'organic', 'direct', 'referral', etc.
  referer TEXT,
  landing_page TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
)
```

## Usage

### For End Users

1. **Arriving via PPC (e.g., Google Ads):**
   - User clicks ad with UTM parameters: `?utm_source=google&utm_medium=cpc&utm_campaign=spring_sale`
   - Lands on site, traffic source captured in sessionStorage
   - Navigates to property details page
   - Registration modal appears (cannot be dismissed)
   - Must complete registration to view property details

2. **Arriving via Organic Search:**
   - User clicks organic search result
   - Lands on site, traffic type detected as "organic"
   - Browses 1st, 2nd, and 3rd properties freely
   - On **4th property view**, registration modal appears with "Maybe Later" option
   - Can dismiss and continue browsing

3. **Registration Options:**
   - Sign up with Google (quick OAuth flow)
   - Sign up with email/password form (requires name, email, phone)

### For Admins

1. **Access Admin Settings:**
   - Navigate to `/admin/settings`
   - Must be authenticated as admin user

2. **Configure PPC Settings:**
   - Toggle "Require registration for PPC traffic" on/off
   - Set property view threshold (default: 1 = first view)
   - Add/remove traffic sources that are considered PPC (e.g., "paidsearch", "cpm")
   - Click "Save Settings"

3. **Configure Organic Settings:**
   - Toggle "Show registration suggestion for organic traffic" on/off
   - Set property view threshold (default: 4 = fourth view)
   - Click "Save Settings"

## Traffic Type Detection

Traffic is classified based on utm_medium and utm_source:

- **PPC:** utm_medium in ['cpc', 'ppc', 'paid', 'paidsearch', 'cpm', 'banner']
- **Organic:** utm_medium = 'organic' OR utm_source in ['google', 'bing']
- **Referral:** utm_medium = 'referral'
- **Social:** utm_source in ['facebook', 'twitter', 'linkedin', 'instagram']
- **Email:** utm_medium = 'email'
- **Direct:** No UTM parameters
- **Other:** Any other combination

## Testing

### Test PPC Flow
```
1. Visit: http://localhost:3000?utm_source=google&utm_medium=cpc&utm_campaign=test
2. Click on any property listing
3. Verify modal appears and cannot be dismissed
4. Complete registration
5. Verify user is created with traffic source data
```

### Test Organic Flow
```
1. Visit: http://localhost:3000?utm_source=google&utm_medium=organic
2. Click on 1st property listing - no modal (view count = 1)
3. Click on 2nd property listing - no modal (view count = 2)
4. Click on 3rd property listing - no modal (view count = 3)
5. Click on 4th property listing - modal appears with "Maybe Later" button (view count = 4)
6. Click "Maybe Later" to dismiss OR complete registration
```

### Test Direct Traffic
```
1. Visit: http://localhost:3000 (no UTM parameters)
2. Click on any property listing
3. Verify modal does NOT appear (direct traffic)
```

### Test Admin Settings
```
1. Login as admin user
2. Navigate to /admin/settings
3. Change organic view threshold from 4 to 2
4. Add new PPC source: "paidsocial"
5. Save settings
6. Test organic with changed threshold:
   - Visit with: ?utm_medium=organic
   - View 1st property - no modal
   - View 2nd property - modal appears (new threshold = 2)
7. Test new PPC source with: ?utm_medium=paidsocial
8. Verify forced registration modal appears on first view
```

## Known Limitations & Future Enhancements

### Phone Number for OAuth Users
Currently, Google OAuth doesn't provide phone number. Options for future enhancement:
1. Show phone collection modal after OAuth completes
2. Request phone number scope from Google (requires additional OAuth permissions)
3. Make phone optional for OAuth users (current implementation)

### Traffic Source for OAuth Flow
Traffic source is stored in sessionStorage before OAuth redirect but not automatically associated with the created user. Enhancement needed:
1. Pass traffic source through OAuth state parameter
2. OR create API endpoint to update user's traffic source after OAuth completion

### Session vs Persistent Storage
Traffic source is stored in sessionStorage (cleared when browser tab closes). For cross-session tracking:
1. Consider localStorage for persistent tracking
2. Add first-touch attribution tracking
3. Store multiple touchpoints in user journey

### Mobile App Tracking
Current implementation is web-only. For mobile apps:
1. Implement deep link parameter parsing
2. Add device fingerprinting
3. Cross-platform user identification

## Configuration

### Environment Variables

No new environment variables required. Uses existing database configuration.

### Admin Settings Defaults

PPC sources: `["ppc", "cpc", "paid"]`
PPC registration required: `true`
PPC view threshold: `1` (first property view)
Organic registration optional: `true`
Organic view threshold: `4` (fourth property view)

## Migration Instructions

1. **Run Database Migrations:**
   ```bash
   npm run migrate:latest
   ```
   This will create the `admin_settings` and `client_traffic_sources` tables.

2. **Verify Default Settings:**
   ```sql
   SELECT * FROM admin_settings;
   ```
   Should show:
   - ppc_registration_required: {"enabled": true, "sources": ["ppc", "cpc", "paid"]}
   - organic_registration_optional: {"enabled": true}

3. **Test Frontend:**
   - Verify traffic tracking works (check sessionStorage)
   - Test property registration modal
   - Test admin settings page

4. **Test Backend:**
   - Verify signup with traffic source data
   - Check traffic source records in database
   - Verify Follow Up Boss events include traffic source

## API Response Examples

### GET /admin/settings/ppc/registration
```json
{
  "enabled": true,
  "sources": ["ppc", "cpc", "paid", "paidsearch"],
  "viewThreshold": 1
}
```

### GET /admin/settings/organic/registration
```json
{
  "enabled": true,
  "viewThreshold": 4
}
```

### POST /auth/signup (with traffic source)
```json
{
  "fname": "John",
  "lname": "Doe",
  "email": "john@example.com",
  "phone": "555-123-4567",
  "utmSource": "google",
  "utmMedium": "cpc",
  "utmCampaign": "spring_sale",
  "landingPage": "https://example.com/properties"
}
```

## Monitoring & Analytics

**Recommended Metrics to Track:**
1. Registration conversion rate by traffic source
2. PPC vs organic registration completion rates
3. Modal dismissal rate for organic traffic
4. Time to register after first property view
5. Most effective PPC campaigns (by registration count)

**Database Queries for Analytics:**

Registrations by traffic type:
```sql
SELECT
  traffic_type,
  COUNT(*) as registrations
FROM client_traffic_sources
GROUP BY traffic_type
ORDER BY registrations DESC;
```

PPC campaign performance:
```sql
SELECT
  utm_campaign,
  COUNT(*) as registrations,
  utm_source,
  utm_medium
FROM client_traffic_sources
WHERE traffic_type = 'ppc'
GROUP BY utm_campaign, utm_source, utm_medium
ORDER BY registrations DESC;
```

## Support

For issues or questions:
1. Check this implementation guide
2. Review the TODO list in the codebase
3. Check the migration files for database schema
4. Review API documentation in `/api-docs`

## Version

Implementation Date: November 25, 2025
Branch: `claude/ppc-registration-requirement-01HUEgXCrs5PfsHxLNeFkYth`
