import { OpenPanelComponent } from '@openpanel/nextjs'

import {
  OPENPANEL_CLIENT_ID,
  OPENPANEL_DNT_FILTER,
  OPENPANEL_OPTIONS,
  OPENPANEL_SCRIPT_URL,
  isOpenPanelEnabled,
} from '@/analytics/providers/openpanel'

/**
 * Loads the self-hosted OpenPanel SDK from the first-party `/_e` path
 * (Cloudflare Worker → OpenPanel API). Automatic page views and outgoing links;
 * custom events arrive via the analytics layer.
 * Renders nothing unless NEXT_PUBLIC_OPENPANEL_CLIENT_ID is set in production.
 */
export function OpenPanelProvider() {
  if (!isOpenPanelEnabled() || !OPENPANEL_CLIENT_ID) return null

  return (
    <OpenPanelComponent
      clientId={OPENPANEL_CLIENT_ID}
      scriptUrl={OPENPANEL_SCRIPT_URL}
      filter={OPENPANEL_DNT_FILTER}
      {...OPENPANEL_OPTIONS}
    />
  )
}
