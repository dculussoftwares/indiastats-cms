# Analytics Events Reference

Three top-level tracking functions. Every event fires with `name` identifying the specific action.

```ts
import { trackViewed, trackClicked, trackImpression } from '@/analytics'
```

---

## `trackViewed`

Fires event: **`viewed`**
Also calls `setPageContext` automatically so subsequent events on the page inherit the page context.

### Page Views

| `name` | Description | Extra Properties |
|---|---|---|
| `home_page` | Home page loaded | — |
| `assembly_page` | Assembly detail page loaded | `assembly_id`, `assembly_name`, `district_id`, `district_name` |
| `district_page` | District detail page loaded | `district_id`, `district_name`, `assembly_count` |
| `search_page` | Search results page loaded | — |
| `election_data_page` | Election data table page loaded | — |
| `caste_demographics_page` | Caste demographics page loaded | — |
| `dashboard_page` | Dashboard page loaded | — |
| `booths_page` | Booths listing page loaded | `assembly_id` |
| `booth_detail_page` | Booth detail page loaded | `booth_id` |
| `not_found_page` | 404 page shown | — |
| `custom_page` | CMS page or blog post loaded | `page_slug`, `post_slug` |

### Content Views

| `name` | Description | Extra Properties |
|---|---|---|
| `assembly` | User navigates to an assembly (from search) | `assembly_id`, `assembly_name`, `district_id`, `district_name` |
| `assembly_demographics` | User views assembly demographics section | `assembly_id`, `assembly_name`, `district_name` |

### Common Properties (all `trackViewed` calls)

| Property | Type | Required | Notes |
|---|---|---|---|
| `name` | `ViewedEvent` | ✅ | Event identifier (see tables above) |
| `page_name` | `string` | ✅ | Human-readable page name e.g. `"Assembly Detail"` |
| `page_url` | `string` | — | Full URL e.g. `window.location.href` |
| `page_path` | `string` | — | URL path e.g. `window.location.pathname` |

---

## `trackClicked`

Fires event: **`clicked`**

### UI Interactions

| `name` | Description | Extra Properties |
|---|---|---|
| `button` | Generic button click | `button_name`, `button_label` |
| `link` | Internal link click | `link_name`, `link_location` |
| `external_link` | External link click | `link_url`, `domain` |
| `footer_link` | Footer link click | `link_name`, `link_url` |
| `share` | Share action initiated | `share_platform`, `content_type`, `content_id` |
| `share_completed` | Share completed successfully | `share_platform`, `content_type`, `content_id` |
| `theme` | Theme toggled | `theme` (`"light"` \| `"dark"` \| `"system"`) |
| `command_palette` | Command palette opened | `trigger` (`"keyboard"` \| `"button"` \| `"programmatic"`) |
| `command_palette_command` | Command executed from palette | `command_name` |
| `navigation` | Page navigation occurred | `from_page`, `to_page`, `navigation_type` |
| `form_submit` | Form submitted | `form_name`, `form_fields` |
| `form_field` | Form field changed | `form_name`, `field_name`, `field_type` |

### Search Interactions

| `name` | Description | Extra Properties |
|---|---|---|
| `search` | User performed a search | `search_query`, `search_type`, `results_count` |
| `search_result` | User clicked a search result | `search_query`, `result_id`, `result_name`, `result_type`, `result_position`, `search_type` |
| `search_filter` | User applied/changed a filter | `filter_name`, `filter_value` |
| `search_refine` | User modified their search query | `search_query`, `search_type`, `results_count` |
| `search_clear` | User cleared the search | `search_type`, `had_results` |

### Assembly Interactions

| `name` | Description | Extra Properties |
|---|---|---|
| `quick_view` | Quick view card opened | `assembly_id`, `assembly_name`, `district_name` |
| `quick_view_download` | Quick view card downloaded as image | `assembly_id`, `assembly_name`, `district_name` |
| `election_year` | Election year selected | `assembly_id`, `assembly_name`, `selected_year`, `mode` |
| `election_compare` | Election years compared | `assembly_id`, `assembly_name`, `years_compared`, `total_elections` |

### Common Properties (all `trackClicked` calls)

| Property | Type | Required | Notes |
|---|---|---|---|
| `name` | `ClickedEvent` | ✅ | Event identifier (see tables above) |
| `page_name` | `string` | ✅ | Current page name |

---

## `trackImpression`

Fires event: **`impression`**

| `name` | Description | Extra Properties |
|---|---|---|
| `search_results` | Search results displayed to user (no click) | `search_query`, `search_type`, `results_count` |

### Common Properties (all `trackImpression` calls)

| Property | Type | Required | Notes |
|---|---|---|---|
| `name` | `ImpressionEvent` | ✅ | Event identifier |
| `page_name` | `string` | ✅ | Current page name |

---

## TypeScript Event Types

```ts
type ViewedEvent =
  | 'home_page' | 'assembly_page' | 'district_page' | 'search_page'
  | 'election_data_page' | 'caste_demographics_page' | 'dashboard_page'
  | 'booths_page' | 'booth_detail_page' | 'not_found_page' | 'custom_page'
  | 'assembly' | 'assembly_demographics'

type ClickedEvent =
  | 'button' | 'link' | 'footer_link' | 'external_link'
  | 'share' | 'share_completed' | 'theme' | 'navigation'
  | 'command_palette' | 'command_palette_command'
  | 'form_submit' | 'form_field'
  | 'search' | 'search_refine' | 'search_result' | 'search_filter' | 'search_clear'
  | 'quick_view' | 'quick_view_download' | 'election_year' | 'election_compare'

type ImpressionEvent = 'search_results'
```

---

## Examples

```ts
// Page load
trackViewed({
  name: 'assembly_page',
  page_name: 'Assembly Detail',
  page_url: window.location.href,
  page_path: window.location.pathname,
  assembly_id: 'ac001',
  assembly_name: 'Chennai South',
  district_name: 'Chennai',
})

// Button click
trackClicked({
  name: 'button',
  page_name: 'Assembly Detail',
  button_name: 'view_all_history',
  button_label: 'View all',
})

// Search result selected
trackClicked({
  name: 'search_result',
  page_name: 'Homepage',
  search_query: 'Chennai',
  result_id: 'ac001',
  result_name: 'Chennai South',
  result_type: 'assembly',
  result_position: 1,
  search_type: 'assembly',
})

// Filter applied
trackClicked({
  name: 'search_filter',
  page_name: 'Election Data',
  filter_name: 'year',
  filter_value: '2021',
})

// Results shown passively
trackImpression({
  name: 'search_results',
  page_name: 'Search Results',
  search_query: 'Chennai',
  results_count: 12,
})
```
