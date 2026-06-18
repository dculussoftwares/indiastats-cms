/**
 * Extracts the English portion from a bilingual "Tamil / English" name string.
 * Returns the string unchanged if it contains no '/'.
 *
 * Examples:
 *   "சென்னை / CHENNAI" → "CHENNAI"
 *   "CHENNAI" → "CHENNAI"
 *   "" → ""
 */
export function getEnglishName(name: string | null | undefined): string {
  if (!name) return ''
  if (!name.includes('/')) return name.trim()
  return name.split('/').pop()!.trim()
}
