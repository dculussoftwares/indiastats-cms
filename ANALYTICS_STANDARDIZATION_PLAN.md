# Analytics Standardization Plan - India Stats CMS

## Executive Summary

This document outlines a comprehensive plan to standardize analytics events across the India Stats CMS application following industry best practices and the architectural patterns from the DavidWells/analytics library.

**Current State**: 4 separate analytics platforms (PostHog, Mixpanel, Clarity, GA4) with inconsistent event tracking
**Goal State**: Single standardized event taxonomy with consistent naming, properties, and documentation

---

## Part 1: Event Taxonomy & Naming Standards

### 1.1 Event Naming Convention

**Standard**: All event names MUST use **snake_case**

**Format**: `category_action` or `category_action_context`

**Examples**:
```
✅ page_view
✅ button_click
✅ assembly_viewed
✅ search_performed
✅ theme_changed
✅ quick_view_opened
✅ share_initiated
```

**NOT Acceptable**:
```
❌ View Assembly (space-separated)
❌ ViewAssembly (camelCase)
❌ view assembly (mixed)
❌ Assembly.View (dot notation)
```

### 1.2 Event Taxonomy Hierarchy

**Three-level hierarchy**: `category / action / context`

```
ENGAGEMENT
├── button_click
│   ├── button_click_command_palette
│   ├── button_click_view_assembly
│   ├── button_click_search
│   └── button_click_theme
├── page_view
│   ├── page_view_homepage
│   ├── page_view_assembly
│   ├── page_view_district
│   ├── page_view_search
│   └── page_view_404
└── link_click
    ├── link_click_external
    ├── link_click_footer
    └── link_click_navigation

SEARCH
├── search_performed
├── search_result_viewed
├── search_result_clicked
└── search_filter_applied

ASSEMBLY_DATA
├── assembly_viewed
├── assembly_quick_view_opened
├── assembly_quick_view_download
├── assembly_demographics_viewed
└── assembly_elections_compared

SHARING
├── share_initiated
│   ├── share_initiated_twitter
│   ├── share_initiated_instagram
│   └── share_initiated_copy_link
└── share_completed

ELECTIONS
├── election_year_selected
├── election_map_interacted
│   ├── election_map_zoomed
│   ├── election_map_panned
│   └── election_map_constituency_clicked
└── election_results_viewed

USER_PREFERENCES
├── theme_changed
├── language_changed
└── accessibility_toggle

ERROR_TRACKING
├── error_occurred
│   ├── error_404_not_found
│   ├── error_network_failed
│   └── error_validation_failed
└── error_boundary_triggered

PERFORMANCE
├── page_load_complete
├── component_render_complete
└── data_fetch_complete
```

---

## Part 2: Standard Event Properties

### 2.1 Universal Properties (Required for ALL events)

```typescript
interface UniversalEventProperties {
  // Context
  page_name: string              // Required: 'Homepage', 'Assembly Detail', 'Search'
  page_url: string               // Required: Current page URL
  page_path: string              // Required: URL path only

  // User Context
  user_id?: string               // Anonymous user ID (no PII)
  session_id?: string            // Auto-tracked by platforms

  // Timestamp & Device
  timestamp?: number             // Auto-added by platforms
  user_agent?: string            // Auto-tracked
  locale?: string                // Browser locale

  // Navigation
  referrer_url?: string          // Previous page URL
  utm_source?: string            // Campaign source
  utm_medium?: string            // Campaign medium
  utm_campaign?: string          // Campaign name
}
```

### 2.2 Category-Specific Properties

#### Page View Events
```typescript
interface PageViewProperties extends UniversalEventProperties {
  page_name: string
  page_title?: string
  page_type: 'homepage' | 'assembly' | 'district' | 'search' | 'error'
}
```

#### Search Events
```typescript
interface SearchProperties extends UniversalEventProperties {
  search_query: string
  search_type: 'assembly' | 'district' | 'direct'
  results_count: number
  search_timestamp?: number      // When search was performed
  is_refined_search?: boolean    // Did user refine previous search
}

interface SearchResultClickProperties extends UniversalEventProperties {
  search_query: string
  result_id: string
  result_name: string
  result_type: 'assembly' | 'district'
  result_position: number        // Position in results (1st, 2nd, etc.)
  search_type: 'assembly' | 'district' | 'direct'
}
```

#### Assembly Events
```typescript
interface AssemblyViewProperties extends UniversalEventProperties {
  assembly_id: string
  assembly_name: string
  assembly_number?: number       // AC number
  district_id: string
  district_name: string
  is_reserved: boolean
}

interface QuickViewProperties extends UniversalEventProperties {
  assembly_id: string
  assembly_name: string
  district_name: string
  action: 'open' | 'download' | 'share'
}

interface ShareProperties extends UniversalEventProperties {
  share_platform: 'twitter' | 'instagram' | 'copy_link'
  content_type: 'quick_view' | 'assembly_page' | 'election_data'
  content_id: string
  is_successful?: boolean
}
```

#### Button Click Events
```typescript
interface ButtonClickProperties extends UniversalEventProperties {
  button_name: string
  button_label?: string          // Display text
  button_location?: string       // Header, footer, modal, etc.
  element_id?: string            // HTML element ID
  context?: Record<string, unknown>  // Event-specific context
}
```

#### Error Events
```typescript
interface ErrorProperties extends UniversalEventProperties {
  error_type: string
  error_message: string
  error_stack?: string           // First 100 chars only
  component_name?: string        // React component name
  error_severity: 'low' | 'medium' | 'high' | 'critical'
  is_user_action_error?: boolean // Did user cause it?
}
```

#### Election/Map Events
```typescript
interface MapInteractionProperties extends UniversalEventProperties {
  action: 'zoom' | 'pan' | 'click_constituency'
  zoom_level?: number
  selected_year?: number
  selected_constituency?: string
}
```

### 2.3 Property Naming Rules

1. **Use snake_case for all property names**
   - ✅ `assembly_id`, `district_name`, `user_id`
   - ❌ `assemblyId`, `districtName`, `userId`

2. **Be explicit and descriptive**
   - ✅ `assembly_id` (not just `id`)
   - ✅ `result_position` (not `position`)
   - ✅ `search_timestamp` (not `time`)

3. **Use consistent units**
   - ✅ `amount_cents`, `duration_milliseconds`, `distance_km`
   - ❌ `amount`, `duration`, `distance`

4. **Avoid abbreviations**
   - ✅ `authentication_failed`
   - ❌ `auth_failed`

5. **Group related properties**
   - ✅ `assembly_id`, `assembly_name`, `assembly_number`
   - ❌ `id`, `name`, `number`

---

## Part 3: Implementation Architecture

### 3.1 Current Architecture Issues

```
Current (Problematic):
┌──────────────────────────────────┐
│  Component/Page                  │
├──────────────────────────────────┤
│ import { trackViewAssembly } ... │
│ trackViewAssembly(...)           │
└──────────────────────────────────┘
            ↓
┌──────────────────────────────────┐
│  src/utilities/analytics.ts      │
├──────────────────────────────────┤
│ PostHog, Mixpanel, Clarity, GA4  │
└──────────────────────────────────┘

Problems:
1. No centralized event definitions
2. Inconsistent property passing
3. Hard to change event structure
4. No validation
5. Scattered tracking logic
```

### 3.2 Proposed Architecture

```
Proposed (Standard):
┌──────────────────────────────────┐
│  Component/Page                  │
├──────────────────────────────────┤
│ import { events } from '@/...'   │
│ events.assembly.viewed({...})    │
└──────────────────────────────────┘
            ↓
┌──────────────────────────────────┐
│  src/analytics/events/           │
├──────────────────────────────────┤
│ • assembly.ts                    │
│ • search.ts                      │
│ • ui.ts                          │
│ • error.ts                       │
└──────────────────────────────────┘
            ↓
┌──────────────────────────────────┐
│  src/analytics/tracker.ts        │
├──────────────────────────────────┤
│ Event validation & normalization │
│ Properties standardization       │
│ Page context injection           │
└──────────────────────────────────┘
            ↓
┌──────────────────────────────────┐
│  src/analytics/providers/        │
├──────────────────────────────────┤
│ • posthog-provider.ts            │
│ • mixpanel-provider.ts           │
│ • clarity-provider.ts            │
│ • ga4-provider.ts                │
└──────────────────────────────────┘
            ↓
┌──────────────────────────────────┐
│  Analytics Platforms             │
├──────────────────────────────────┤
│ PostHog | Mixpanel | Clarity | GA4
└──────────────────────────────────┘
```

### 3.3 File Structure

```
src/analytics/
├── index.ts                    # Main export
├── types.ts                    # TypeScript types
├── tracker.ts                  # Core tracking logic
├── providers/
│   ├── index.ts
│   ├── posthog-provider.ts
│   ├── mixpanel-provider.ts
│   ├── clarity-provider.ts
│   └── ga4-provider.ts
├── events/
│   ├── index.ts
│   ├── assembly.ts             # Assembly-related events
│   ├── search.ts               # Search events
│   ├── ui.ts                   # UI/UX events
│   ├── elections.ts            # Election/map events
│   ├── errors.ts               # Error tracking
│   └── pageViews.ts            # Page view events
└── utils/
    ├── constants.ts            # Event names, page names
    └── validation.ts           # Property validation
```

---

## Part 4: Core Standardized Events

### 4.1 Page View Events

**Event Name**: `page_view`

```typescript
events.pageViews.viewed({
  page_name: 'Assembly Detail Page',
  page_type: 'assembly',
  assembly_id?: 'ac001',
  district_name?: 'Chennai'
})
```

**Platforms receive**:
- ✅ PostHog: Full event + properties
- ✅ Mixpanel: Full event + properties
- ✅ Clarity: `page_view` event + dimensions
- ✅ GA4: `page_view` event + parameters

### 4.2 Assembly Events

**Events**:
1. `assembly_viewed` - User views assembly detail page
2. `quick_view_opened` - User opens quick view modal
3. `quick_view_download` - User downloads quick view card
4. `assembly_compared` - User compares election years

```typescript
events.assembly.viewed({
  page_name: 'Assembly Detail',
  assembly_id: 'ac001',
  assembly_name: 'Chennai South',
  district_name: 'Chennai',
  is_reserved: false
})

events.assembly.quickViewOpened({
  page_name: 'Assembly Detail',
  assembly_id: 'ac001',
  assembly_name: 'Chennai South'
})

events.assembly.quickViewDownloaded({
  page_name: 'Assembly Detail',
  assembly_id: 'ac001',
  assembly_name: 'Chennai South'
})
```

### 4.3 Search Events

**Events**:
1. `search_performed` - User performs search
2. `search_result_clicked` - User clicks search result
3. `search_refined` - User refines search query

```typescript
events.search.performed({
  page_name: 'Homepage',
  search_query: 'Chennai South',
  search_type: 'assembly',
  results_count: 1
})

events.search.resultClicked({
  page_name: 'Homepage',
  search_query: 'Chennai South',
  result_id: 'ac001',
  result_name: 'Chennai South',
  result_position: 1
})
```

### 4.4 Share Events

**Event**: `share_initiated`

```typescript
events.ui.shareInitiated({
  page_name: 'Assembly Detail',
  share_platform: 'twitter',
  content_type: 'quick_view',
  content_id: 'ac001'
})
```

### 4.5 UI Events

**Events**:
1. `button_clicked` - Any button click
2. `theme_changed` - Theme preference changed
3. `navigation_occurred` - User navigated

```typescript
events.ui.buttonClicked({
  page_name: 'Assembly Detail',
  button_name: 'view_assembly',
  button_label: 'View Full Assembly',
  button_location: 'search_results'
})

events.ui.themeChanged({
  page_name: 'Assembly Detail',
  theme: 'dark'
})
```

### 4.6 Error Events

**Event**: `error_occurred`

```typescript
events.errors.occurred({
  page_name: 'Assembly Detail',
  error_type: 'network_error',
  error_message: 'Failed to fetch assembly data',
  component_name: 'AssemblyPageClient',
  error_severity: 'high'
})
```

---

## Part 5: Implementation Steps

### Phase 1: Foundation (Week 1)
1. ✅ Create analytics folder structure
2. ✅ Define TypeScript types and interfaces
3. ✅ Create tracker core logic
4. ✅ Create provider adapters
5. ✅ Document all events

### Phase 2: Event Creation (Week 2)
1. ✅ Create assembly events
2. ✅ Create search events
3. ✅ Create UI events
4. ✅ Create error events
5. ✅ Create page view events

### Phase 3: Migration (Week 3-4)
1. ✅ Update components to use new events
2. ✅ Add page_name context
3. ✅ Remove old tracking code
4. ✅ Test across all platforms
5. ✅ Verify GA4, PostHog, Mixpanel, Clarity

### Phase 4: Documentation & Optimization (Week 5)
1. ✅ Create event catalog
2. ✅ Document all properties
3. ✅ Set up analytics dashboards
4. ✅ Create monitoring/alerts

---

## Part 6: Key Benefits

| Aspect | Before | After |
|--------|--------|-------|
| **Consistency** | Inconsistent naming | snake_case everywhere |
| **Maintenance** | Scattered logic | Centralized, versioned |
| **Page Context** | Missing | Always included |
| **Validation** | None | Full validation |
| **Documentation** | Manual updates | Auto-generated |
| **Multi-platform** | Hard to manage | Unified abstraction |
| **Type Safety** | Partial | Full TypeScript |
| **Error Handling** | Basic | Comprehensive |

---

## Part 7: Notes on DavidWells/Analytics Library

**Why not use it directly?**
- ✅ PostHog: Not officially supported (but can be added)
- ✅ Clarity: Not supported (custom plugin needed)
- ✅ Architecture: We need page context injection
- ✅ Our custom solution: More tailored to India Stats

**What we're adopting from it**:
- ✅ Plugin-based architecture
- ✅ Unified tracking interface
- ✅ Event queuing pattern
- ✅ Provider abstraction layer

---

## Part 8: Next Steps

1. Review and approve this plan
2. Create analytics folder structure
3. Define TypeScript interfaces
4. Implement tracker core
5. Create first batch of events
6. Migrate existing tracking calls
7. Test and validate
8. Deploy to production

