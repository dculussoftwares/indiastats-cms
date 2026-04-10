# Analytics Implementation Guide

## Quick Start

### 1. Basic Setup

Import the analytics module in your component:

```typescript
'use client'

import { events, setPageContext } from '@/analytics'

export function MyComponent() {
  // Set page context once (usually in parent component or layout)
  React.useEffect(() => {
    setPageContext({
      page_name: 'Assembly Detail',
      page_url: typeof window !== 'undefined' ? window.location.href : '',
      page_path: '/tamil-nadu/assembly/...',
    })
  }, [])

  return // component
}
```

### 2. Track Events

Use the standardized event functions:

```typescript
// Assembly events
events.assembly.viewed({
  page_name: 'Assembly Detail',
  assembly_id: 'ac001',
  assembly_name: 'Chennai South',
  district_name: 'Chennai',
  is_reserved: false,
})

// Search events
events.search.performed({
  page_name: 'Homepage',
  search_query: 'Chennai',
  search_type: 'assembly',
  results_count: 5,
})

// UI events
events.ui.buttonClicked({
  page_name: 'Assembly Detail',
  button_name: 'download_quick_view',
  button_label: 'Download PNG',
  button_location: 'modal',
})

// Error events
events.errors.occurred({
  page_name: 'Assembly Detail',
  error_type: 'network_error',
  error_message: 'Failed to fetch assembly data',
  error_severity: 'high',
  component_name: 'AssemblyPageClient',
})
```

---

## File Structure

```
src/analytics/
├── index.ts                    # Main export
├── types.ts                    # TypeScript types for all events
├── tracker.ts                  # Core tracking logic
├── constants.ts                # Event names, page names, etc.
├── events/
│   ├── index.ts               # Event exports
│   ├── assembly.ts            # Assembly-related events
│   ├── search.ts              # Search events
│   ├── ui.ts                  # UI/UX events
│   ├── errors.ts              # Error tracking
│   └── pageViews.ts           # Page view events
└── README.md                   # This file
```

---

## Event Categories

### 1. Assembly Events (`events.assembly`)

```typescript
// View assembly detail page
events.assembly.viewed({
  page_name: 'Assembly Detail',
  assembly_id: 'ac001',
  assembly_name: 'Chennai South',
  assembly_number: 1,
  district_id: 'dt1',
  district_name: 'Chennai',
  is_reserved: false,
})

// View demographics section
events.assembly.demographicsViewed({
  page_name: 'Assembly Detail',
  assembly_id: 'ac001',
  assembly_name: 'Chennai South',
  district_name: 'Chennai',
})

// Open quick view modal
events.assembly.quickViewOpened({
  page_name: 'Assembly Detail',
  assembly_id: 'ac001',
  assembly_name: 'Chennai South',
})

// Download quick view card
events.assembly.quickViewDownloaded({
  page_name: 'Assembly Detail',
  assembly_id: 'ac001',
  assembly_name: 'Chennai South',
})

// Compare election years
events.assembly.electionCompared({
  page_name: 'Assembly Detail',
  assembly_id: 'ac001',
  assembly_name: 'Chennai South',
  years_compared: [2016, 2021],
  total_elections: 12,
})

// Select election year
events.assembly.electionYearSelected({
  page_name: 'Assembly Detail',
  assembly_id: 'ac001',
  assembly_name: 'Chennai South',
  year: 2021,
  mode: 'solo',
})
```

### 2. Search Events (`events.search`)

```typescript
// User performs search
events.search.performed({
  page_name: 'Homepage',
  search_query: 'Chennai South',
  search_type: 'assembly',
  results_count: 1,
})

// User refines search
events.search.refined({
  page_name: 'Homepage',
  search_query: 'Chennai',
  search_type: 'assembly',
  results_count: 5,
})

// User clicks search result
events.search.resultClicked({
  page_name: 'Homepage',
  search_query: 'Chennai',
  result_id: 'ac001',
  result_name: 'Chennai South',
  result_type: 'assembly',
  result_position: 1,
  search_type: 'assembly',
})

// User views results (no click)
events.search.resultsViewed({
  page_name: 'Homepage',
  search_query: 'Chennai',
  search_type: 'assembly',
  results_count: 5,
})

// User applies filter
events.search.filterApplied({
  page_name: 'Homepage',
  search_type: 'assembly',
  filter_name: 'is_reserved',
  filter_value: 'true',
  results_count: 2,
})

// User clears search
events.search.cleared({
  page_name: 'Homepage',
  search_type: 'assembly',
  had_results: true,
})
```

### 3. UI Events (`events.ui`)

```typescript
// Button click
events.ui.buttonClicked({
  page_name: 'Assembly Detail',
  button_name: 'download',
  button_label: 'Download PNG',
  button_location: 'modal',
  element_id: 'download-btn-123',
})

// Command palette
events.ui.commandPaletteOpened({
  page_name: 'Assembly Detail',
  trigger_method: 'keyboard', // or 'button'
  button_name: 'command_palette',
})

events.ui.commandPaletteCommandExecuted({
  page_name: 'Assembly Detail',
  command_name: 'go_to_assembly',
  button_name: 'cmd_execute',
})

// Theme change
events.ui.themeChanged({
  page_name: 'Assembly Detail',
  theme: 'dark',
  previous_theme: 'light',
})

// Navigation
events.ui.navigationOccurred({
  page_name: 'Homepage',
  from_page: 'Homepage',
  to_page: 'Assembly Detail',
  navigation_type: 'link_click',
})

// Link clicks
events.ui.linkClicked({
  page_name: 'Assembly Detail',
  link_url: '/tamil-nadu/district/chennai',
  link_text: 'View District',
  link_location: 'card',
  is_external: false,
})

events.ui.footerLinkClicked({
  page_name: 'Assembly Detail',
  link_name: 'privacy_policy',
  link_url: '/privacy-policy',
})

events.ui.externalLinkClicked({
  page_name: 'Assembly Detail',
  link_url: 'https://example.com',
  domain: 'example.com',
})

// Share
events.ui.shareInitiated({
  page_name: 'Assembly Detail',
  share_platform: 'twitter',
  content_type: 'quick_view',
  content_id: 'ac001',
})

events.ui.shareCompleted({
  page_name: 'Assembly Detail',
  share_platform: 'twitter',
  content_type: 'quick_view',
  content_id: 'ac001',
})

// Form interactions
events.ui.formSubmitted({
  page_name: 'Custom Page',
  form_name: 'contact_form',
  form_fields: {
    name: true,
    email: true,
    message: true,
  },
  button_name: 'submit',
})

events.ui.formFieldChanged({
  page_name: 'Custom Page',
  form_name: 'search_form',
  field_name: 'search_query',
  field_type: 'text',
  button_name: 'search',
})
```

### 4. Error Events (`events.errors`)

```typescript
// Generic error
events.errors.occurred({
  page_name: 'Assembly Detail',
  error_type: 'unknown_error',
  error_message: 'Something went wrong',
  error_severity: 'high',
  component_name: 'AssemblyPageClient',
})

// Network error
events.errors.networkError({
  page_name: 'Assembly Detail',
  error_message: 'Failed to fetch data',
  endpoint: '/api/assemblies',
  http_status: 500,
  retry_count: 3,
  error_severity: 'high',
})

// Validation error
events.errors.validationError({
  page_name: 'Custom Page',
  error_message: 'Invalid email address',
  form_name: 'contact_form',
  field_name: 'email',
  validation_type: 'email_format',
  error_severity: 'low',
})

// Parsing error
events.errors.parsingError({
  page_name: 'Assembly Detail',
  error_message: 'Invalid JSON response',
  data_source: '/api/assemblies',
  expected_format: 'JSON',
  error_severity: 'critical',
})

// 404 Not found
events.errors.notFound({
  page_name: '404 Not Found',
  attempted_url: '/tamil-nadu/assembly/invalid-id',
  referrer: 'https://google.com',
})

// Error boundary
events.errors.boundaryTriggered({
  page_name: 'Assembly Detail',
  error_type: 'render_error',
  error_message: 'Component failed to render',
  boundary_name: 'AssemblyPageBoundary',
  component_name: 'ElectionChart',
  error_severity: 'high',
  fallback_rendered: true,
})

// Unhandled rejection
events.errors.unhandledRejection({
  page_name: 'Assembly Detail',
  error_message: 'Promise rejected',
  promise_reason: 'Network timeout',
  error_severity: 'critical',
})
```

### 5. Page View Events (`events.pageViews`)

```typescript
// Generic page view (auto-sets page context)
events.pageViews.viewed({
  page_name: 'Custom Page',
  page_type: 'other',
  page_url: 'https://example.com/custom',
  page_path: '/custom',
})

// Homepage
events.pageViews.homePageViewed({
  page_url: 'https://indiastats.org',
  page_path: '/',
})

// Assembly detail
events.pageViews.assemblyPageViewed({
  page_name: 'Assembly Detail',
  page_url: 'https://indiastats.org/tamil-nadu/assembly/...',
  page_path: '/tamil-nadu/assembly/...',
  assembly_id: 'ac001',
  assembly_name: 'Chennai South',
  district_name: 'Chennai',
})

// District detail
events.pageViews.districtPageViewed({
  page_name: 'District Detail',
  page_url: 'https://indiastats.org/tamil-nadu/district/...',
  page_path: '/tamil-nadu/district/...',
  district_id: 'dt1',
  district_name: 'Chennai',
  assembly_count: 13,
})

// Search results
events.pageViews.searchPageViewed({
  page_name: 'Search Results',
  page_url: 'https://indiastats.org/search?q=Chennai',
  page_path: '/search',
  search_query: 'Chennai',
  results_count: 5,
})

// And more...
```

---

## Page Context Management

Page context is automatically merged into all events. Set it once per page:

```typescript
import { setPageContext } from '@/analytics'

export function Page() {
  useEffect(() => {
    setPageContext({
      page_name: 'Assembly Detail',
      page_url: typeof window !== 'undefined' ? window.location.href : '',
      page_path: pathname,
    })
  }, [pathname])

  return // content
}
```

All subsequent events will automatically include these properties.

---

## Migration from Old API

### Before (Old API)

```typescript
import { trackViewAssembly, trackButtonClick } from '@/utilities/analytics'

trackViewAssembly('ac001', 'Chennai South', 'Chennai')
trackButtonClick('download', { assembly_id: 'ac001' })
```

### After (New API)

```typescript
import { events, setPageContext } from '@/analytics'

setPageContext({ page_name: 'Assembly Detail', page_url: location.href })

events.assembly.viewed({
  page_name: 'Assembly Detail',
  assembly_id: 'ac001',
  assembly_name: 'Chennai South',
  district_name: 'Chennai',
})

events.ui.buttonClicked({
  page_name: 'Assembly Detail',
  button_name: 'download',
  button_label: 'Download PNG',
  context: { assembly_id: 'ac001' },
})
```

---

## Constants

Use provided constants for consistency:

```typescript
import { PAGE_NAMES, EVENT_NAMES, BUTTON_NAMES, SHARE_PLATFORMS } from '@/analytics/constants'

// Page names
PAGE_NAMES.ASSEMBLY_DETAIL  // 'Assembly Detail'
PAGE_NAMES.HOMEPAGE         // 'Homepage'
PAGE_NAMES.SEARCH_RESULTS   // 'Search Results'

// Button names
BUTTON_NAMES.VIEW_ASSEMBLY  // 'view_assembly'
BUTTON_NAMES.DOWNLOAD_QUICK_VIEW  // 'download_quick_view'

// Share platforms
SHARE_PLATFORMS.TWITTER     // 'twitter'
SHARE_PLATFORMS.COPY_LINK   // 'copy_link'
```

---

## Type Safety

All events are fully typed with TypeScript:

```typescript
import type { AssemblyViewedProperties } from '@/analytics'

const props: AssemblyViewedProperties = {
  page_name: 'Assembly Detail',
  assembly_id: 'ac001',
  assembly_name: 'Chennai South',
  district_name: 'Chennai',
  // ... other properties
}

events.assembly.viewed(props)
```

---

## Best Practices

### 1. Always Include page_name

```typescript
// ✅ Good
events.ui.buttonClicked({
  page_name: 'Assembly Detail',  // Always include
  button_name: 'download',
})

// ❌ Bad
events.ui.buttonClicked({
  button_name: 'download',  // Missing page_name
})
```

### 2. Use Constants for Values

```typescript
// ✅ Good
import { BUTTON_NAMES, PAGE_NAMES } from '@/analytics/constants'

events.ui.buttonClicked({
  page_name: PAGE_NAMES.ASSEMBLY_DETAIL,
  button_name: BUTTON_NAMES.DOWNLOAD_QUICK_VIEW,
})

// ❌ Bad - typo-prone
events.ui.buttonClicked({
  page_name: 'Assmebly Detail',  // Typo!
  button_name: 'download_quick_vew',  // Typo!
})
```

### 3. Set Page Context in Parent

```typescript
// ✅ Good - set once in layout or parent
function AssemblyPageLayout() {
  useEffect(() => {
    setPageContext({
      page_name: PAGE_NAMES.ASSEMBLY_DETAIL,
      page_url: location.href,
    })
  }, [])

  return <AssemblyContent /> // Child events inherit context
}

// ❌ Bad - setting repeatedly in child
function AssemblyContent() {
  useEffect(() => {
    setPageContext(...)  // Redundant
  }, [])
}
```

### 4. Be Specific with Event Data

```typescript
// ✅ Good
events.search.resultClicked({
  page_name: 'Homepage',
  search_query: 'Chennai South',
  result_position: 1,  // Specific position
  result_type: 'assembly',
})

// ❌ Bad
events.search.resultClicked({
  page_name: 'Homepage',
  search_query: 'Chennai South',
  // Missing context about which result was clicked
})
```

---

## Testing Analytics Events

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

---

## Common Patterns

### Pattern 1: Modal Open/Close

```typescript
function QuickViewModal({ assemblyId, assemblyName }) {
  const handleOpen = () => {
    events.assembly.quickViewOpened({
      page_name: currentPageContext.page_name,
      assembly_id: assemblyId,
      assembly_name: assemblyName,
    })
  }

  const handleDownload = () => {
    events.assembly.quickViewDownloaded({
      page_name: currentPageContext.page_name,
      assembly_id: assemblyId,
      assembly_name: assemblyName,
    })
  }

  return // modal
}
```

### Pattern 2: Form Submission

```typescript
async function handleSubmit(formData) {
  try {
    events.ui.formSubmitted({
      page_name: currentPageContext.page_name,
      form_name: 'contact_form',
      form_fields: {
        name: !!formData.name,
        email: !!formData.email,
      },
    })
    // Submit form
  } catch (error) {
    events.errors.validationError({
      page_name: currentPageContext.page_name,
      error_message: error.message,
      form_name: 'contact_form',
      error_severity: 'medium',
    })
  }
}
```

### Pattern 3: List Item Click

```typescript
function SearchResultsList({ results, searchQuery }) {
  return results.map((result, index) => (
    <div
      key={result.id}
      onClick={() => {
        events.search.resultClicked({
          page_name: currentPageContext.page_name,
          search_query: searchQuery,
          result_id: result.id,
          result_name: result.name,
          result_position: index + 1,
          search_type: 'assembly',
        })
        navigate(result.url)
      }}
    >
      {result.name}
    </div>
  ))
}
```

---

## Troubleshooting

### Events not appearing in dashboard

1. Check that `NEXT_PUBLIC_GA_ID`, `NEXT_PUBLIC_POSTHOG_KEY`, etc. are set
2. Verify event names are in snake_case
3. Check browser console for `[Analytics]` logs
4. Ensure `page_name` is included

### Missing properties

1. All events should have `page_name` (via page context)
2. Check that context was set: `setPageContext(...)`
3. Review event type definition for required properties

---

## Next Steps

- See `ANALYTICS_EVENTS.md` for comprehensive event reference
- See `ANALYTICS_STANDARDIZATION_PLAN.md` for design decisions
- Review provider implementations in `src/analytics/providers/`
