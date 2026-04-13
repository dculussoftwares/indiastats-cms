import { track } from '../tracker'

export type ClickedEvent =
  | 'button'
  | 'link'
  | 'footer_link'
  | 'external_link'
  | 'share'
  | 'share_completed'
  | 'theme'
  | 'navigation'
  | 'command_palette'
  | 'command_palette_command'
  | 'form_submit'
  | 'form_field'
  | 'search'
  | 'search_refine'
  | 'search_result'
  | 'search_filter'
  | 'search_clear'
  | 'quick_view'
  | 'quick_view_download'
  | 'election_compare'
  | 'election_year'

export function trackClicked(
  properties: { name: ClickedEvent; page_name: string } & Record<string, unknown>,
) {
  track('clicked', properties)
}
