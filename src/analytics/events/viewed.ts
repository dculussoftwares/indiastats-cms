import { track, setPageContext } from '../tracker'

export type ViewedEvent =
  | 'home_page'
  | 'assembly_page'
  | 'district_page'
  | 'search_page'
  | 'election_data_page'
  | 'caste_demographics_page'
  | 'dashboard_page'
  | 'booths_page'
  | 'booth_detail_page'
  | 'not_found_page'
  | 'custom_page'
  | 'assembly'
  | 'assembly_demographics'

export function trackViewed(
  properties: { name: ViewedEvent; page_name: string; page_url?: string; page_path?: string } & Record<string, unknown>,
) {
  setPageContext({
    page_name: properties.page_name,
    page_url: properties.page_url,
    page_path: properties.page_path,
  })
  track('viewed', properties)
}
