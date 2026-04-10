# India Stats CMS - Analytics Events Documentation

## Overview

This document provides a comprehensive list of all analytics events tracked across the India Stats CMS application. Events are tracked through four analytics platforms simultaneously:

1. **PostHog** - Product analytics and session recording
2. **Mixpanel** - Product analytics and user behavior tracking
3. **Microsoft Clarity** - Session recording and user behavior insights
4. **Google Analytics 4 (GA4)** - Web analytics and user acquisition tracking

---

## Analytics Platforms

### 1. PostHog
- **Purpose**: Product analytics and session recording
- **Initialization**: `src/instrumentation-client.ts`
- **Environment Variables**: `NEXT_PUBLIC_POSTHOG_KEY`, `NEXT_PUBLIC_POSTHOG_HOST`
- **Features**:
  - Automatic pageview capture
  - Session recording
  - Respects Do Not Track (DNT)
  - Disabled in development

### 2. Mixpanel
- **Purpose**: User behavior tracking and event analytics
- **Initialization**: `src/instrumentation-client.ts`
- **Environment Variables**: `NEXT_PUBLIC_MIXPANEL_TOKEN`
- **Features**:
  - Autocapture enabled
  - Session replay (100% recording)
  - Local storage persistence
  - Debug mode in development
  - Ignores Do Not Track

### 3. Microsoft Clarity
- **Purpose**: Session recording and user behavior analysis
- **Initialization**: `src/utilities/clarityTracking.ts`
- **Environment Variables**: `NEXT_PUBLIC_CLARITY_ID` (configured in HTML)
- **Features**:
  - Custom event tracking
  - Dimension/tag support
  - User identification
  - Session prioritization
  - GDPR consent support
  - Production only

### 4. Google Analytics 4 (GA4)
- **Purpose**: Web analytics and user acquisition tracking
- **Initialization**: `src/utilities/analytics.ts` (client-side via `window.gtag`)
- **Environment Variables**: `NEXT_PUBLIC_GA_ID` (Measurement ID)
- **Features**:
  - Event-based tracking
  - Automatic pageview capture (via Next.js)
  - Conversion tracking support
  - User properties and custom dimensions
  - Privacy-friendly analytics
  - Requires gtag script in HTML (configured in layout)

---

## Core Tracking Functions

### Standardized Analytics Module (`src/analytics/`)

All events are tracked through the **standardized analytics system** (status: ✅ Complete migration):

```typescript
import { assembly, search, ui, errors, pageViews, getPageContext, setPageContext } from '@/analytics'

// Set page context once per page
setPageContext({ page_name: 'Assembly Detail', page_url: location.href })

// Track events using namespaced functions
assembly.viewed({ assembly_id: 'ac001', assembly_name: 'Chennai South', ... })
search.performed({ search_query: 'Chennai', results_count: 5, ... })
ui.buttonClicked({ button_name: 'download', button_label: 'Download', ... })
```

**How it works**:
1. All events automatically route to all four platforms (PostHog, Mixpanel, Clarity, GA4)
2. Event names are automatically normalized to snake_case
3. Page context is auto-injected into all events via `getPageContext()`
4. Properties are unified and consistent across all platforms
5. Full TypeScript support with IDE autocomplete

---

## Tracked Events by Category

### 1. **Assembly Events**

#### Event: `assembly_viewed`
- **Namespace**: `assembly.viewed()`
- **Trigger**: User navigates to assembly detail page
- **Properties**:
  - `page_name`: Page name (auto-injected)
  - `assembly_id`: Assembly identifier (e.g., "ac001")
  - `assembly_name`: Name of the assembly
  - `district_id`: Parent district ID
  - `district_name`: Parent district name

```typescript
import { assembly, getPageContext } from '@/analytics'

const pageContext = getPageContext()
assembly.viewed({
  page_name: pageContext.page_name || 'Assembly Detail',
  assembly_id: 'ac001',
  assembly_name: 'Chennai South',
  district_id: 'dt1',
  district_name: 'Chennai'
})
```

---

### 2. **Search Events**

#### Event: `search_performed`
- **Namespace**: `search.performed()`
- **Trigger**: User performs a search
- **Properties**:
  - `page_name`: Page name (auto-injected)
  - `search_query`: The search term entered
  - `results_count`: Number of results
  - `search_type`: 'assembly' | 'district' | 'direct'

```typescript
search.performed({
  page_name: pageContext.page_name || 'Homepage',
  search_query: 'Chennai',
  results_count: 5,
  search_type: 'direct'
})
```

#### Event: `search_result_clicked`
- **Namespace**: `search.resultClicked()`
- **Trigger**: User clicks on a search result
- **Properties**:
  - `page_name`: Page name (auto-injected)
  - `search_query`: Original search query
  - `result_id`: ID of clicked result
  - `result_name`: Name of result
  - `result_type`: 'assembly' | 'district' | 'post'
  - `result_position`: Position in results
  - `search_type`: Type of search

```typescript
search.resultClicked({
  page_name: pageContext.page_name || 'Search Results',
  search_query: 'Chennai',
  result_id: 'ac001',
  result_name: 'Chennai South',
  result_type: 'assembly',
  result_position: 1,
  search_type: 'direct'
})
```

#### Event: `search_filter_applied`
- **Namespace**: `search.filterApplied()`
- **Trigger**: User applies a filter in search/table
- **Properties**:
  - `page_name`: Page name (auto-injected)
  - `filter_name`: Name of filter
  - `filter_value`: Value applied

```typescript
search.filterApplied({
  page_name: pageContext.page_name || 'Election Data',
  filter_name: 'year',
  filter_value: '2021'
})
```

---

### 3. **UI Events**

#### Event: `button_clicked`
- **Namespace**: `ui.buttonClicked()`
- **Trigger**: User clicks any button
- **Properties**:
  - `page_name`: Page name (auto-injected)
  - `button_name`: Identifier of button
  - `button_label`: Display text of button

```typescript
ui.buttonClicked({
  page_name: pageContext.page_name || 'Homepage',
  button_name: 'download_quick_view',
  button_label: 'Download PNG'
})
```

#### Event: `link_clicked`
- **Namespace**: `ui.linkClicked()`
- **Trigger**: User clicks a link
- **Properties**:
  - `page_name`: Page name (auto-injected)
  - `link_name`: Identifier of link
  - `link_location`: Where on page the link is

```typescript
ui.linkClicked({
  page_name: pageContext.page_name || 'Assembly Detail',
  link_name: 'view_assembly',
  link_location: 'search_results'
})
```

#### Event: `theme_changed`
- **Namespace**: `ui.themeChanged()`
- **Trigger**: User changes theme preference
- **Properties**:
  - `page_name`: Page name (auto-injected)
  - `theme`: 'light' | 'dark' | 'system'

```typescript
ui.themeChanged({
  page_name: pageContext.page_name || 'Homepage',
  theme: 'dark'
})
```

#### Event: `command_palette_opened`
- **Namespace**: `ui.commandPaletteOpened()`
- **Trigger**: User opens command palette
- **Properties**:
  - `page_name`: Page name (auto-injected)
  - `trigger`: 'keyboard' | 'button' | 'programmatic'

#### Event: `share_initiated`
- **Namespace**: `ui.shareInitiated()`
- **Trigger**: User initiates a share action
- **Properties**:
  - `page_name`: Page name
  - `platform`: 'twitter' | 'instagram' | 'copy_link'
  - `content_type`: Type of content being shared

---

### 4. **Page View Events**

#### Event: `page_viewed`
- **Namespace**: `pageViews.viewed()` or specific page functions
- **Trigger**: User views a page
- **Properties**: Auto-tracked by Next.js + explicitly set via `setPageContext()`

```typescript
import { setPageContext, PAGE_NAMES } from '@/analytics'

// Set once per page in layout
setPageContext({
  page_name: PAGE_NAMES.ASSEMBLY_DETAIL,
  page_url: location.href,
  page_path: location.pathname
})
```

---

### 5. **Error Events**

#### Event: `error_occurred`
- **Namespace**: `errors.occurred()`
- **Trigger**: Application error detected
- **Properties**:
  - `page_name`: Page name (auto-injected)
  - `error_type`: Type of error
  - `error_message`: Error message
  - `error_severity`: 'low' | 'medium' | 'high' | 'critical'

```typescript
errors.occurred({
  page_name: pageContext.page_name || 'Unknown',
  error_type: 'network',
  error_message: 'Failed to fetch data',
  error_severity: 'high'
})
```

---

## Available Constants

### Page Names
```typescript
import { PAGE_NAMES } from '@/analytics'

PAGE_NAMES.HOMEPAGE = 'Homepage'
PAGE_NAMES.ASSEMBLY_DETAIL = 'Assembly Detail'
PAGE_NAMES.DISTRICT_DETAIL = 'District Detail'
PAGE_NAMES.SEARCH_RESULTS = 'Search Results'
PAGE_NAMES.ASSEMBLY_MAP = 'Assembly Map'
PAGE_NAMES.NOT_FOUND = '404 Not Found'
```

### Button Names
```typescript
import { BUTTON_NAMES } from '@/analytics'

BUTTON_NAMES.VIEW_ASSEMBLY = 'view_assembly'
BUTTON_NAMES.DOWNLOAD_QUICK_VIEW = 'download_quick_view'
BUTTON_NAMES.SEARCH = 'search'
```

### Share Platforms
```typescript
import { SHARE_PLATFORMS } from '@/analytics'

SHARE_PLATFORMS.TWITTER = 'twitter'
SHARE_PLATFORMS.INSTAGRAM = 'instagram'
SHARE_PLATFORMS.COPY_LINK = 'copy_link'
```

### Search Types
```typescript
import { SEARCH_TYPES } from '@/analytics'

SEARCH_TYPES.ASSEMBLY = 'assembly'
SEARCH_TYPES.DISTRICT = 'district'
SEARCH_TYPES.DIRECT = 'direct'
```

---

## Migration from Old API

### Old API (Deprecated but Still Works)
```typescript
import { trackViewAssembly, trackShare, track } from '@/utilities/analytics'

trackViewAssembly(assemblyId, assemblyName, districtName)
trackShare('twitter', 'quick_view', assemblyId)
track('Custom Event', { custom_prop: 'value' })
```

### New API (Recommended)
```typescript
import { assembly, ui, search, getPageContext } from '@/analytics'

// Set context once per page
setPageContext({ page_name: 'Assembly Detail', page_url: location.href })

// Use namespaced events
const pageContext = getPageContext()
assembly.viewed({
  page_name: pageContext.page_name || 'Assembly Detail',
  assembly_id: assemblyId,
  assembly_name: assemblyName,
  district_name: districtName
})

ui.shareInitiated({
  page_name: pageContext.page_name || 'Assembly Detail',
  platform: 'twitter',
  content_type: 'quick_view'
})

// Old API still works for backward compatibility
track('Custom Event', { custom_prop: 'value' })
```

---

## Implementation Examples

### Example 1: Setting Page Context in Layout

```typescript
// In page layout or top component
import { setPageContext, PAGE_NAMES } from '@/analytics'

useEffect(() => {
  setPageContext({
    page_name: PAGE_NAMES.ASSEMBLY_DETAIL,
    page_url: location.href,
    page_path: location.pathname
  })
}, [])
```

### Example 2: Tracking Assembly View

```typescript
import { assembly, getPageContext } from '@/analytics'

const handleViewAssembly = (assembly: Assembly, district: District) => {
  const pageContext = getPageContext()
  assembly.viewed({
    page_name: pageContext.page_name || 'Search Results',
    assembly_id: assembly.assemblyId,
    assembly_name: assembly.name,
    district_id: district.districtId,
    district_name: district.districtName
  })
  router.push(`/assembly/${district.slug}/${assembly.slug}`)
}
```

### Example 3: Tracking Search Events

```typescript
import { search, getPageContext } from '@/analytics'

const handleSearch = (query: string, results: SearchResult[]) => {
  const pageContext = getPageContext()
  search.performed({
    page_name: pageContext.page_name || 'Homepage',
    search_query: query,
    results_count: results.length,
    search_type: 'direct'
  })
}

const handleResultClick = (result: SearchResult, query: string) => {
  const pageContext = getPageContext()
  search.resultClicked({
    page_name: pageContext.page_name || 'Homepage',
    search_query: query,
    result_id: result.id,
    result_name: result.name,
    result_type: 'assembly',
    result_position: 1,
    search_type: 'direct'
  })
}
```

### Example 4: Tracking UI Interactions

```typescript
import { ui, getPageContext } from '@/analytics'

const handleButtonClick = () => {
  const pageContext = getPageContext()
  ui.buttonClicked({
    page_name: pageContext.page_name || 'Homepage',
    button_name: 'download_quick_view',
    button_label: 'Download PNG'
  })
}

const handleLinkClick = () => {
  const pageContext = getPageContext()
  ui.linkClicked({
    page_name: pageContext.page_name || 'Assembly Detail',
    link_name: 'view_assembly_on_map',
    link_location: 'assembly_card'
  })
}
```

---

## Naming Conventions

All events and properties follow **snake_case** naming:

- Events: `view_assembly`, `search_performed`, `button_clicked`
- Properties: `assembly_id`, `search_query`, `button_name`
- Page names: Use constants from `PAGE_NAMES` for consistency

Example:
```typescript
// ✅ Correct
search.performed({
  search_query: 'Chennai',
  results_count: 5
})

// ❌ Avoid
search.performed({
  searchQuery: 'Chennai',
  resultsCount: 5
})
```

---

## Environment Variables Required

```bash
# PostHog
NEXT_PUBLIC_POSTHOG_KEY=your_posthog_key
NEXT_PUBLIC_POSTHOG_HOST=https://eu.i.posthog.com

# Mixpanel
NEXT_PUBLIC_MIXPANEL_TOKEN=your_mixpanel_token

# Clarity (typically configured via HTML script tag)
NEXT_PUBLIC_CLARITY_ID=your_clarity_id

# Google Analytics 4
NEXT_PUBLIC_GA_ID=G-XXXXXXXXXX  # Your GA4 Measurement ID (e.g., G-NVB7E06128)
```

**Note**: GA4 Measurement ID is **public** (safe to commit to repository) as it only identifies your analytics property, not sensitive data.

---

## Testing Analytics Events

### In Development
- **Mixpanel**: Debug logs printed to console
- **PostHog**: Opted out automatically (development mode)
- **Clarity**: Not initialized (production only)
- **GA4**: Sends to test property if `NEXT_PUBLIC_GA_ID` set

### Debugging Events
```typescript
// Events are automatically logged in development
// Check browser console for event tracking information
```

---

## Notes

1. **Clarity Production Only**: Clarity events only fire in production environment
2. **Do Not Track**: PostHog respects DNT, Mixpanel ignores it
3. **Session Recording**: Both PostHog and Mixpanel support session recording
4. **Data Privacy**: No sensitive data (passwords, tokens) should be included in event properties
5. **Page Context Auto-Injection**: Page context set via `setPageContext()` is automatically included in all events

---

## Related Files

**Core Analytics Module:**
- `src/analytics/` - Main standardized analytics module (✅ Implementation Complete)
- `src/analytics/index.ts` - Main export
- `src/analytics/tracker.ts` - Core tracking engine
- `src/analytics/types.ts` - TypeScript interfaces
- `src/analytics/constants.ts` - Event constants
- `src/analytics/events/` - Event namespaces

**Platform Integration:**
- `src/utilities/analytics.ts` - Old API (deprecated, for backward compatibility)
- `src/instrumentation-client.ts` - Platform initialization

**Migrated Components:**
- `src/components/TwitterCardModal.tsx` - Share and quick view events
- `src/components/AssemblySearch/index.tsx` - Search events
- `src/components/DistrictSearch/index.tsx` - District search events
- `src/components/AssemblyMap/index.tsx` - Map interaction events
- `src/components/ElectionDataTable/index.tsx` - Data table events
- `src/components/MostWinningPartiesCard/index.tsx` - UI toggles
- `src/components/PastWinningHistories/index.tsx` - Accordion events
- `src/providers/Theme/ThemeSelector/index.tsx` - Theme change events
- `src/providers/CommandPalette/index.tsx` - Command palette events
- `src/app/(frontend)/(home)/HomePageClient.tsx` - Homepage events
- `src/app/(frontend)/[stateSlug]/assembly/...` - Assembly page events
- `src/app/(frontend)/[stateSlug]/district/...` - District page events
- `src/app/(frontend)/[stateSlug]/caste-demographics/...` - Caste demographics events
- `src/app/(frontend)/[stateSlug]/assembly/.../booths/...` - Booths page events

---

## Migration Status

✅ **All 16 components migrated to standardized analytics API**
✅ **Full TypeScript support with IDE autocomplete**
✅ **Page context auto-injection working**
✅ **Multi-platform event routing functional**
✅ **Backward compatibility maintained**

