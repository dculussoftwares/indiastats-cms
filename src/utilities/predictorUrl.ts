/** Converts a predictor name to a URL-safe slug. e.g. "Jaydeep Balsara" → "jaydeep-balsara" */
export function predictorNameSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

/**
 * Builds the canonical href for a predictor page including the name slug for SEO.
 * e.g. `/tamil-nadu/election-predictions/abc123/jaydeep-balsara`
 */
export function predictorHref(stateSlug: string, id: string, name: string): string {
  return `/${stateSlug}/election-predictions/${id}/${predictorNameSlug(name)}`
}
