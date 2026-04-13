import { track } from '../tracker'

export type ImpressionEvent = 'search_results'

export function trackImpression(
  properties: { name: ImpressionEvent; page_name: string } & Record<string, unknown>,
) {
  track('impression', properties)
}
