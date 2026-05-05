import { getStateByCode } from '@/config/states'

export type BlocType = 'dmk' | 'aiadmk' | 'tvk' | 'other'

/**
 * Identifies the political bloc for a party in a specific year and state.
 * Uses a combination of database alliances, state configuration, and anchor parties.
 */
export function identifyBloc(
  party: string,
  year: number,
  stateCode: string,
  allianceMap: Record<number, any[]> = {},
  stateDoc?: any,
): BlocType {
  // 1. Direct anchor party match (Primary identification)
  if (party === 'DMK') return 'dmk'
  if (['AIADMK', 'ADMK', 'AIADMK(J)', 'AIADMK(JA)'].includes(party)) return 'aiadmk'
  if (party === 'TVK') return 'tvk'

  // 2. Check year-specific alliance data
  const yearAlliances = allianceMap[year] || []
  const partyAlliance = yearAlliances.find((a) =>
    a.parties?.some((p: any) => p.partyName === party || p.partyCode === party),
  )

  if (partyAlliance) {
    const name = partyAlliance.allianceName
    // Heuristic to categorize common alliance names
    if (
      (name.includes('DMK') && !name.includes('AIADMK') && !name.includes('NDA')) ||
      name.includes('Secular Progressive') ||
      name.includes('DPA') ||
      name.includes('Democratic Progressive')
    )
      return 'dmk'
    if (name.includes('AIADMK') || name.includes('NDA') || name.includes('SDPA')) return 'aiadmk'
  }

  // 3. Fallback to static/DB bloc definitions
  const staticConfig = getStateByCode(stateCode)
  const blocConfigs = stateDoc?.blocs || staticConfig?.blocs || []

  for (const bloc of blocConfigs) {
    const blocName = bloc.blocName || bloc.name
    const parties = (bloc.parties || []).map((p: any) => p.partyCode || p.partyName || p)

    if (parties.includes(party)) {
      if (blocName.toLowerCase().includes('dmk')) return 'dmk'
      if (blocName.toLowerCase().includes('aiadmk')) return 'aiadmk'
    }
  }

  return 'other'
}
