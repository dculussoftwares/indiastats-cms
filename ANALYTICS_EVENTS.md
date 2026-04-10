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

### Unified Analytics Utility (`src/utilities/analytics.ts`)

All events are sent through the unified `track()` function which automatically routes to all four platforms:

```typescript
track(eventName: string, properties?: Record<string, unknown>)
```

**Properties**: Optional key-value pairs that provide context for the event.

**How it works**:
1. **PostHog**: Receives event name and full properties object
2. **Mixpanel**: Receives event name and full properties object
3. **Clarity**: Receives snake_case event name (properties not supported)
4. **GA4**: Receives snake_case event name and properties object

---

## Tracked Events by Category

### 1. **Assembly Page Navigation**

#### Event: `View Assembly`
- **Location**: `src/components/AssemblySearch/index.tsx`, `src/components/TwitterCardModal.tsx`
- **Trigger**: User clicks "View Assembly" button or selects an assembly
- **Page Name Parameter**: Should include `page_name` in properties (refactor needed)
- **Properties**:
  - `assembly_id`: Assembly identifier (e.g., "ac001")
  - `assembly_name`: Name of the assembly
  - `district_name`: Parent district name

```typescript
trackViewAssembly(assemblyId, assemblyName, districtName)
```

---

### 2. **Quick View Modal**

#### Event: `Quick View Open`
- **Location**: `src/components/TwitterCardModal.tsx` (line 146)
- **Trigger**: User opens Quick View modal for an assembly
- **Page Name Parameter**: Should include `page_name` in properties (refactor needed)
- **Properties**:
  - `assembly_id`: Assembly identifier
  - `assembly_name`: Assembly name

```typescript
trackQuickViewOpen(assemblyId, assemblyName)
```

#### Event: `Quick View Download`
- **Location**: `src/components/TwitterCardModal.tsx` (line 262)
- **Trigger**: User downloads Quick View card as PNG
- **Page Name Parameter**: Should include `page_name` in properties (refactor needed)
- **Properties**:
  - `assembly_id`: Assembly identifier
  - `assembly_name`: Assembly name

```typescript
trackQuickViewDownload(assemblyId, assemblyName)
```

---

### 3. **Share Events**

#### Event: `Share`
- **Location**: `src/components/TwitterCardModal.tsx` (lines 286)
- **Trigger**: User shares content on social media or copies link
- **Page Name Parameter**: Should include `page_name` in properties (refactor needed)
- **Properties**:
  - `platform`: 'twitter' | 'instagram' | 'copy_link'
  - `content_type`: Type of content being shared (e.g., 'quick_view')
  - `content_id`: Optional content identifier

```typescript
trackShare(platform: 'twitter' | 'instagram' | 'copy_link', contentType: string, contentId?: string)
```

---

### 4. **Search Events**

#### Event: `Search`
- **Location**: `src/components/AssemblySearch/index.tsx` (line 233)
- **Trigger**: User performs a search (district, assembly, or direct)
- **Page Name Parameter**: Should include `page_name` in properties (refactor needed)
- **Properties**:
  - `search_query`: The search term entered
  - `results_count`: Number of results returned
  - `search_type`: 'assembly' | 'district' | 'direct'

```typescript
trackSearch(searchQuery: string, resultsCount: number, searchType: 'assembly' | 'district' | 'direct')
```

#### Event: `Search Result Click`
- **Location**: `src/components/AssemblySearch/index.tsx` (lines 216, 234)
- **Trigger**: User clicks on a search result
- **Page Name Parameter**: Should include `page_name` in properties (refactor needed)
- **Properties**:
  - `result_id`: Identifier of the clicked result (assembly/district ID)
  - `result_name`: Name of the result
  - `search_type`: Type of search result (assembly, district, etc.)

```typescript
trackSearchResultClick(resultId: string, resultName: string, searchType: string)
```

---

### 5. **Theme Changes**

#### Event: `Theme Change`
- **Location**: `src/providers/Theme/ThemeSelector/index.tsx` (lines 26, 30)
- **Trigger**: User changes theme preference (light/dark/auto)
- **Page Name Parameter**: Should include `page_name` in properties (refactor needed)
- **Properties**:
  - `theme`: 'light' | 'dark' | 'system'

```typescript
trackThemeChange(theme: 'light' | 'dark' | 'system')
```

---

### 6. **Button Clicks**

#### Event: `Button Click`
- **Location**: Multiple locations throughout the app
- **Trigger**: Generic button click tracking
- **Page Name Parameter**: Should include `page_name` in properties (refactor needed)
- **Properties**:
  - `button_name`: Name/identifier of the button
  - Additional context properties as needed

```typescript
trackButtonClick(buttonName: string, properties?: Record<string, unknown>)
```

**Usage Examples**:
- `trackButtonClick('command_palette_open', { method: 'keyboard' })` - Command palette opened via keyboard
- `trackButtonClick('Quick View Open', { assembly_id: assemblyId })` - Quick View button clicked
- `trackButtonClick('Download Quick View', { assembly_id: assemblyId })` - Download button clicked
- `trackButtonClick('Share Twitter', { assembly_id: assemblyId })` - Share to Twitter clicked
- `trackButtonClick('View Assembly', { assembly_id: selectedAssembly.assemblyId })` - View Assembly button clicked

---

### 7. **Map Interactions** (Potential/Planned)

#### Event: `Map Interaction`
- **Location**: Planned for map components
- **Trigger**: User interacts with map (zoom, pan, click constituency)
- **Page Name Parameter**: Should include `page_name` in properties (refactor needed)
- **Properties**:
  - `action`: 'zoom' | 'pan' | 'click_constituency' | 'select_year'
  - Additional detail properties

```typescript
trackMapInteraction(action: 'zoom' | 'pan' | 'click_constituency' | 'select_year', details?: Record<string, unknown>)
```

---

### 8. **Election Year Selection** (Potential/Planned)

#### Event: `Election Year Select`
- **Location**: Planned for election comparison pages
- **Trigger**: User selects election year(s) for comparison
- **Page Name Parameter**: Should include `page_name` in properties (refactor needed)
- **Properties**:
  - `year`: Selected election year
  - `mode`: 'solo' | 'compare'

```typescript
trackElectionYearSelect(year: string, mode: 'solo' | 'compare')
```

---

### 9. **Navigation Events**

#### Event: `Navigation`
- **Location**: Planned for page transitions
- **Trigger**: User navigates between pages
- **Page Name Parameter**: Should include `page_name` in properties (refactor needed)
- **Properties**:
  - `from_page`: Source page name
  - `to_page`: Destination page name

```typescript
trackNavigation(from: string, to: string)
```

---

### 10. **Error Tracking**

#### Event: `Error`
- **Location**: Planned for error handling
- **Trigger**: Application error occurs
- **Page Name Parameter**: Should include `page_name` in properties (refactor needed)
- **Properties**:
  - `error_type`: Type of error that occurred
  - `error_message`: Error message (optional)
  - `page_url`: URL where error occurred (optional)

```typescript
trackError(errorType: string, errorMessage?: string, pageUrl?: string)
```

---

### 11. **Page View Tracking** (Manual)

#### Event: `Page View`
- **Location**: Can be used for manual page tracking
- **Trigger**: When specific page views need to be tracked
- **Page Name Parameter**: Explicitly passed
- **Properties**:
  - `page_name`: Name of the page
  - `page_url`: URL of the page
  - Additional custom properties

```typescript
trackPageView(pageName: string, pageUrl: string, properties?: Record<string, unknown>)
```

---

## Clarity-Specific Tracking (`src/utilities/clarityTracking.ts`)

In addition to unified tracking, Clarity has its own tracking functions with page name parameters:

### Assembly View
```typescript
trackAssemblyView(assemblyId: string, assemblyName: string, districtName: string)
```
- Dimensions: `assembly_id`, `assembly_name`, `district_name`
- Event: `view_assembly`

### District View
```typescript
trackDistrictView(districtId: string, districtName: string)
```
- Dimensions: `district_id`, `district_name`
- Event: `view_district`

### Page View
```typescript
trackPageView(pageType: string, pageId?: string)
```
- Dimensions: `page_type`, `page_id` (optional)
- Event: `view_{pageType}`

### 404 Error
```typescript
track404(attemptedUrl: string)
```
- Dimensions: `attempted_url`
- Event: `page_not_found`
- Session upgrade: 'error'

### Footer Link Click
```typescript
trackFooterClick(linkName: string)
```
- Dimensions: `footer_link`
- Event: `click_footer_link`

### External Link Click
```typescript
trackExternalLink(url: string)
```
- Dimensions: `external_url`
- Event: `click_external_link`

---

## Current Event Locations

| Event | Component/Page | Line(s) | Uses |
|-------|---|---|---|
| Theme Change | `Theme/ThemeSelector/index.tsx` | 26, 30 | trackThemeChange() |
| Button Click (Command Palette) | `providers/CommandPalette/index.tsx` | Multiple | trackButtonClick() |
| Quick View Open | `components/TwitterCardModal.tsx` | 146 | trackQuickViewOpen() |
| Quick View Download | `components/TwitterCardModal.tsx` | 262 | trackQuickViewDownload() |
| Share Twitter | `components/TwitterCardModal.tsx` | 286 | trackShare() |
| Button Click (Quick View) | `components/TwitterCardModal.tsx` | 147, 263, 287 | trackButtonClick() |
| Search | `components/AssemblySearch/index.tsx` | 233 | trackSearch() |
| Search Result Click | `components/AssemblySearch/index.tsx` | 216, 234 | trackSearchResultClick() |
| View Assembly | `components/AssemblySearch/index.tsx` | 239-244 | trackViewAssembly(), trackButtonClick() |

---

## Refactoring Recommendations

### 1. **Add Page Name Parameter to All Events**

**Current Issue**: Events are not consistently tracking which page they occurred on.

**Solution**: Modify all tracking functions to accept and include a `page_name` parameter:

```typescript
// Before
trackViewAssembly(assemblyId, assemblyName, districtName)

// After
trackViewAssembly(
  assemblyId: string,
  assemblyName: string,
  districtName: string,
  pageName: string  // NEW
)
```

**Implementation**:
1. Update `src/utilities/analytics.ts` to add `page_name` parameter to all tracking functions
2. Update `src/utilities/clarityTracking.ts` similarly
3. Update all call sites to pass the page name

---

### 2. **Standardize Event Parameter Format**

Create consistent naming conventions across platforms:

```typescript
interface EventProperties {
  page_name?: string          // NEW
  page_url?: string           // NEW
  timestamp?: number          // Optional, auto-added by platforms
  user_id?: string            // For authenticated users
  session_id?: string         // Auto-tracked by platforms
  [key: string]: unknown      // Additional custom properties
}
```

---

### 3. **Create Page-Specific Event Functions**

```typescript
// Create namespace for each page type
export const assemblyPageEvents = {
  trackViewAssembly: (assemblyId, name, district, pageName) => { ... },
  trackQuickViewOpen: (assemblyId, pageName) => { ... },
  trackShare: (platform, contentType, pageName) => { ... }
}

export const searchPageEvents = {
  trackSearch: (query, resultCount, searchType, pageName) => { ... },
  trackSearchResultClick: (resultId, name, type, pageName) => { ... }
}
```

---

### 4. **Consistency Across Platforms**

Currently:
- PostHog: Receives full properties object
- Mixpanel: Receives full properties object
- Clarity: Receives event name + limited dimension support

**Recommendation**: Map properties to Clarity dimensions consistently:

```typescript
const clarityDimensionMapping: Record<string, (props: Record<string, unknown>) => void> = {
  'View Assembly': (props) => {
    setDimension('page_name', props.page_name as string)
    setDimension('assembly_id', props.assembly_id as string)
    setDimension('assembly_name', props.assembly_name as string)
  }
}
```

---

## Usage Examples

### Example 1: Tracking Assembly View with Page Name

**Current**:
```typescript
trackViewAssembly(assemblyId, assemblyName, districtName)
trackButtonClick('View Assembly', { assembly_id: assemblyId })
```

**Refactored**:
```typescript
trackViewAssembly(
  assemblyId,
  assemblyName,
  districtName,
  'Assembly Detail Page'  // Page name
)
trackButtonClick('View Assembly', {
  assembly_id: assemblyId,
  page_name: 'Assembly Detail Page'
})
```

### Example 2: Tracking Search with Page Name

**Current**:
```typescript
trackSearch(assembly.name, 1, 'direct')
trackSearchResultClick(assembly.assemblyId, assembly.name, 'assembly')
```

**Refactored**:
```typescript
trackSearch(assembly.name, 1, 'direct', 'Homepage Search')
trackSearchResultClick(
  assembly.assemblyId,
  assembly.name,
  'assembly',
  'Homepage Search'
)
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

## GA4 Implementation Details

### How GA4 Integration Works

1. **gtag Script**: GA4 requires the `gtag` global function (provided by Google Analytics script tag in HTML)
2. **Event Format**: Events are converted to snake_case before sending to GA4
3. **Properties Passed**: All event properties are forwarded to GA4 as custom parameters
4. **Conditional**: Only sends events if:
   - `NEXT_PUBLIC_GA_ID` environment variable is set
   - `window.gtag` is available (script loaded)
5. **Error Handling**: Gracefully fails if gtag unavailable (doesn't break other platforms)

### GA4 Event Name Conversion

Events are automatically converted to snake_case for GA4 compatibility:

```typescript
'View Assembly' → 'view_assembly'
'Search' → 'search'
'Button Click' → 'button_click'
'Theme Change' → 'theme_change'
```

### GA4 Properties

All event properties are sent to GA4. Common properties include:
- `page_name`: Name of the page where event occurred
- `assembly_id`: Assembly identifier
- `district_name`: District name
- `search_query`: Search query string
- `results_count`: Number of results
- Platform-specific dimensions and metrics

### Example GA4 Event

```typescript
// Tracking code
trackViewAssembly('ac001', 'Chennai South', 'Chennai')

// What GA4 receives
window.gtag('event', 'view_assembly', {
  assembly_id: 'ac001',
  assembly_name: 'Chennai South',
  district_name: 'Chennai'
})
```

---

## Testing Analytics Events

### In Development
- Mixpanel: Debug logs printed to console
- PostHog: Opted out automatically (development mode)
- Clarity: Not initialized (production only)

### Debugging Events
```typescript
// Add to any tracking call:
if (process.env.NODE_ENV === 'development') {
  console.log('[Analytics]', eventName, properties)
}
```

---

## Notes

1. **Clarity Production Only**: Clarity events only fire in production environment
2. **Do Not Track**: PostHog respects DNT, Mixpanel ignores it
3. **Session Recording**: Both PostHog and Mixpanel support session recording
4. **Data Privacy**: No sensitive data (passwords, tokens) should be included in event properties

---

## Related Files

- `src/utilities/analytics.ts` - Unified analytics functions
- `src/utilities/clarityTracking.ts` - Clarity-specific functions
- `src/instrumentation-client.ts` - Platform initialization
- `src/components/TwitterCardModal.tsx` - Quick View and Share events
- `src/components/AssemblySearch/index.tsx` - Search events
- `src/providers/Theme/ThemeSelector/index.tsx` - Theme events
- `src/providers/CommandPalette/index.tsx` - Command palette events

