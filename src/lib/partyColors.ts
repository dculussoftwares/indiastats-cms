import { getStateByCode } from '@/config/states'

// Fallback color for unknown parties
const FALLBACK_COLOR = '#607d8b'

// Partial-name fallback rules (for ECI full names with typos or variants)
const PARTIAL_FALLBACKS: Array<[RegExp, string]> = [
  [/VETTRI|TVK/i, 'TVK'],
  [/ANNA.*DRAVIDA|AIADMK|ADMK/i, 'AIADMK'],
  [/DRAVIDA MUNNETRA|^DMK$/i, 'DMK'],
  [/CONGRESS|^INC$/i, 'INC'],
  [/BHARATIYA JANATA|^BJP$/i, 'BJP'],
  [/PATTALI|^PMK$/i, 'PMK'],
  [/VIDUTHALAI|^VCK$/i, 'VCK'],
  [/MUSLIM LEAGUE|^IUML$/i, 'IUML'],
  [/COMMUNIST.*MARXIST|CPIM|CPI\(M\)/i, 'CPI(M)'],
  [/COMMUNIST/i, 'CPI'],
  [/AMMA MAKKAL|AMMK/i, 'AMMK'],
  [/DESIYA MURPOKKU|DMDK/i, 'DMDK'],
]

export function normalizePartyName(party: string, stateCode = 'TN'): string {
  if (!party) return party
  const config = getStateByCode(stateCode)
  const map = config?.partyNameMap ?? {}
  return map[party.toUpperCase().trim()] ?? party
}

export function getPartyColor(party: string, stateCode = 'TN'): string {
  if (!party || party.trim() === '') return FALLBACK_COLOR

  const config = getStateByCode(stateCode)
  if (!config) return FALLBACK_COLOR

  const upper = party.toUpperCase().trim()
  const normalized = config.partyNameMap[upper] ?? upper

  // Direct lookup (abbreviation or mapped abbreviation)
  if (config.partyColors[normalized]) return config.partyColors[normalized]
  if (config.partyColors[upper]) return config.partyColors[upper]

  // Partial string fallback for messy ECI names
  for (const [pattern, abbrev] of PARTIAL_FALLBACKS) {
    if (pattern.test(upper) && config.partyColors[abbrev]) {
      return config.partyColors[abbrev]
    }
  }

  return FALLBACK_COLOR
}
