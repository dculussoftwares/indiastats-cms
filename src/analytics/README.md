# Analytics Module - API Reference

Complete standardized analytics system for India Stats CMS.

## Quick Import

```typescript
import {
  events,                    // Event namespaces
  setPageContext,            // Set page info once
  getPageContext,            // Get current page context
  PAGE_NAMES,                // Page name constants
  BUTTON_NAMES,              // Button name constants
  SHARE_PLATFORMS,           // Share platform constants
} from '@/analytics'
```

## Core Concepts

### 1. Page Context
Set once per page to auto-inject into all events:

```typescript
setPageContext({
  page_name: 'Assembly Detail',
  page_url: location.href,
  page_path: pathname,
})
```

### 2. Event Namespaces
Organized by feature area:

- `events.assembly` - Assembly page events
- `events.search` - Search functionality
- `events.ui` - UI interactions (buttons, links, forms)
- `events.errors` - Error tracking
- `events.pageViews` - Page load events

### 3. Type Safety
All events are fully typed:

```typescript
events.assembly.viewed({
  // Type checking ensures correct properties
  page_name: 'Assembly Detail',
  assembly_id: 'ac001',
  // ...
})
```

## Event API Reference

### Assembly Events

```typescript
events.assembly.viewed(properties)
events.assembly.demographicsViewed(properties)
events.assembly.quickViewOpened(properties)
events.assembly.quickViewDownloaded(properties)
events.assembly.electionCompared(properties)
events.assembly.electionYearSelected(properties)
```

### Search Events

```typescript
events.search.performed(properties)
events.search.refined(properties)
events.search.resultClicked(properties)
events.search.resultsViewed(properties)
events.search.filterApplied(properties)
events.search.cleared(properties)
```

### UI Events

```typescript
events.ui.buttonClicked(properties)
events.ui.commandPaletteOpened(properties)
events.ui.commandPaletteCommandExecuted(properties)
events.ui.themeChanged(properties)
events.ui.navigationOccurred(properties)
events.ui.linkClicked(properties)
events.ui.footerLinkClicked(properties)
events.ui.externalLinkClicked(properties)
events.ui.shareInitiated(properties)
events.ui.shareCompleted(properties)
events.ui.formSubmitted(properties)
events.ui.formFieldChanged(properties)
```

### Error Events

```typescript
events.errors.occurred(properties)
events.errors.networkError(properties)
events.errors.validationError(properties)
events.errors.parsingError(properties)
events.errors.notFound(properties)
events.errors.boundaryTriggered(properties)
events.errors.unhandledRejection(properties)
```

### Page View Events

```typescript
events.pageViews.viewed(properties)
events.pageViews.homePageViewed(properties)
events.pageViews.assemblyPageViewed(properties)
events.pageViews.districtPageViewed(properties)
events.pageViews.searchPageViewed(properties)
events.pageViews.electionDataPageViewed(properties)
events.pageViews.casteDemographicsPageViewed(properties)
events.pageViews.dashboardPageViewed(properties)
events.pageViews.boothsPageViewed(properties)
events.pageViews.boothDetailPageViewed(properties)
events.pageViews.notFoundPageViewed(properties)
events.pageViews.customPageViewed(properties)
```

## Core Functions

### `setPageContext(context)`
Set page information once (usually in layout/parent component).

```typescript
setPageContext({
  page_name: 'Assembly Detail',
  page_url: 'https://...',
  page_path: '/tamil-nadu/assembly/...',
})
```

### `getPageContext()`
Get current page context.

```typescript
const context = getPageContext()
// { page_name: 'Assembly Detail', page_url: '...', ... }
```

### `clearPageContext()`
Clear page context.

```typescript
clearPageContext()
```

### `track(eventName, properties)`
Low-level event tracking (uses normalized event names).

```typescript
track('assembly_viewed', {
  assembly_id: 'ac001',
  assembly_name: 'Chennai South',
})
```

### `identify(userId, properties)`
Identify user across platforms.

```typescript
identify('user123', {
  user_tier: 'premium',
  signup_date: '2024-01-01',
})
```

### `setUserProperties(properties)`
Set user properties across platforms.

```typescript
setUserProperties({
  user_tier: 'premium',
  has_premium_access: true,
})
```

## Constants Reference

### PAGE_NAMES
```typescript
PAGE_NAMES.HOMEPAGE
PAGE_NAMES.ASSEMBLY_DETAIL
PAGE_NAMES.ASSEMBLY_MAP
PAGE_NAMES.DISTRICT_DETAIL
PAGE_NAMES.SEARCH_RESULTS
PAGE_NAMES.ELECTION_DATA
PAGE_NAMES.CASTE_DEMOGRAPHICS
PAGE_NAMES.DASHBOARD
PAGE_NAMES.BOOTHS
PAGE_NAMES.BOOTH_DETAIL
PAGE_NAMES.POSTS
PAGE_NAMES.POST_DETAIL
PAGE_NAMES.PAGES
PAGE_NAMES.PRIVACY_POLICY
PAGE_NAMES.NOT_FOUND
```

### BUTTON_NAMES
```typescript
BUTTON_NAMES.VIEW_ASSEMBLY
BUTTON_NAMES.QUICK_VIEW
BUTTON_NAMES.DOWNLOAD_QUICK_VIEW
BUTTON_NAMES.SHARE
BUTTON_NAMES.SEARCH
BUTTON_NAMES.SEARCH_DIRECT
BUTTON_NAMES.FILTER
BUTTON_NAMES.CLEAR_FILTER
BUTTON_NAMES.COMMAND_PALETTE
BUTTON_NAMES.THEME_TOGGLE
```

### SHARE_PLATFORMS
```typescript
SHARE_PLATFORMS.TWITTER
SHARE_PLATFORMS.INSTAGRAM
SHARE_PLATFORMS.COPY_LINK
```

### SEARCH_TYPES
```typescript
SEARCH_TYPES.ASSEMBLY
SEARCH_TYPES.DISTRICT
SEARCH_TYPES.DIRECT
```

### ERROR_SEVERITY
```typescript
ERROR_SEVERITY.LOW
ERROR_SEVERITY.MEDIUM
ERROR_SEVERITY.HIGH
ERROR_SEVERITY.CRITICAL
```

### THEMES
```typescript
THEMES.LIGHT
THEMES.DARK
THEMES.SYSTEM
```

## Common Patterns

### Pattern: Page Load

```typescript
'use client'
import { events, setPageContext, PAGE_NAMES } from '@/analytics'

export function Page({ assemblyId }) {
  useEffect(() => {
    // Set context once
    setPageContext({
      page_name: PAGE_NAMES.ASSEMBLY_DETAIL,
      page_url: location.href,
      page_path: pathname,
    })

    // Track page view
    events.pageViews.assemblyPageViewed({
      page_name: PAGE_NAMES.ASSEMBLY_DETAIL,
      page_url: location.href,
      page_path: pathname,
      assembly_id: assemblyId,
      assembly_name: data.name,
      district_name: data.district,
    })
  }, [assemblyId])

  return <div>...</div>
}
```

### Pattern: Modal Interaction

```typescript
function Modal({ assemblyId, assemblyName }) {
  const handleOpen = () => {
    events.assembly.quickViewOpened({
      page_name: 'Assembly Detail',  // From context
      assembly_id: assemblyId,
      assembly_name: assemblyName,
    })
  }

  const handleDownload = () => {
    events.assembly.quickViewDownloaded({
      page_name: 'Assembly Detail',
      assembly_id: assemblyId,
      assembly_name: assemblyName,
    })
  }

  return <Dialog onOpenChange={handleOpen} onDownload={handleDownload} />
}
```

### Pattern: Error Handling

```typescript
function ErrorBoundary({ children }) {
  const handleError = (error) => {
    events.errors.boundaryTriggered({
      page_name: 'Assembly Detail',
      error_type: 'render_error',
      error_message: error.message,
      component_name: 'AssemblyChart',
      error_severity: 'high',
    })
  }

  return <ErrorBoundary onError={handleError}>{children}</ErrorBoundary>
}
```

### Pattern: Form Submission

```typescript
async function handleSubmit(formData) {
  try {
    events.ui.formSubmitted({
      page_name: 'Contact Page',
      form_name: 'contact_form',
      form_fields: {
        name: !!formData.name,
        email: !!formData.email,
        message: !!formData.message,
      },
    })

    // Submit...
  } catch (error) {
    events.errors.validationError({
      page_name: 'Contact Page',
      error_message: error.message,
      form_name: 'contact_form',
      error_severity: 'medium',
    })
  }
}
```

## Type Definitions

```typescript
// Universal properties included in all events
interface UniversalEventProperties {
  page_name: string        // Required
  page_url?: string
  page_path?: string
  user_id?: string
  referrer_url?: string
  utm_source?: string
  utm_medium?: string
  utm_campaign?: string
}

// Specific event types
interface AssemblyViewedProperties extends UniversalEventProperties {
  assembly_id: string
  assembly_name: string
  assembly_number?: number
  district_id?: string
  district_name: string
  is_reserved?: boolean
}

// ... and many more specific types
```

## Platform Support

Events are automatically sent to:
- ✅ PostHog
- ✅ Mixpanel
- ✅ Google Analytics 4
- ✅ Microsoft Clarity

## Development Mode

In development, events are logged to console:

```
[Analytics] Tracking event: {
  eventName: 'assembly_viewed',
  properties: {
    page_name: 'Assembly Detail',
    assembly_id: 'ac001',
    ...
  }
}
```

## Migration from Old API

Old functions still work but are deprecated:

```typescript
// OLD (deprecated)
import { trackViewAssembly } from '@/utilities/analytics'
trackViewAssembly('ac001', 'Chennai South', 'Chennai')

// NEW (recommended)
import { events } from '@/analytics'
events.assembly.viewed({
  page_name: 'Assembly Detail',
  assembly_id: 'ac001',
  assembly_name: 'Chennai South',
  district_name: 'Chennai',
})
```

## File Locations

- **Events**: `src/analytics/events/`
- **Types**: `src/analytics/types.ts`
- **Constants**: `src/analytics/constants.ts`
- **Tracker**: `src/analytics/tracker.ts`

## Documentation

- **Quick Start**: `ANALYTICS_IMPLEMENTATION_GUIDE.md`
- **Deep Dive**: `ANALYTICS_STANDARDIZATION_PLAN.md`
- **Status**: `ANALYTICS_IMPLEMENTATION_SUMMARY.md`
- **Full Reference**: `ANALYTICS_EVENTS.md`

---

**For more information, see the full documentation files.**
