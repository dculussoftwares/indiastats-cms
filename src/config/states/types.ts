/**
 * State Configuration Types
 * Defines the structure for state-specific political configuration
 */

export interface PartyConfig {
    code: string
    name: string
    color: string
    leaderImage?: string
}

export interface BlocConfig {
    name: string
    parties: string[]  // Party codes
    leaderImage: string
    color: string
}

export interface StateConfig {
    code: string           // "TN", "KA", etc.
    slug: string           // "tamil-nadu", "karnataka"
    name: string           // "Tamil Nadu", "Karnataka"
    assemblyCount: number  // total assembly seats (e.g. 234 for TN)
    districtCount: number  // total districts (e.g. 38 for TN)

    // Political configuration
    majorParties: string[]
    blocs: BlocConfig[]

    // Visual configuration
    partyColors: Record<string, string>
    leaderImages: Record<string, string>

    // Map configuration
    mapGeoJson: string
    mapCenter: [number, number]
    mapZoom: number

    // Election configuration
    electionYears: number[]

    // History configuration - replaces >= 1977 hardcoded filter
    historyStartYear: number

    // Party name mapping - replaces PARTY_NAME_MAP in src/lib/partyColors.ts
    partyNameMap: Record<string, string>

    // Default hashtags - replaces hardcoded hashtag string in TwitterCardModal
    defaultHashtags: string[]

    // Booth and voter labels - replaces hardcoded UI text
    boothCountLabel: string
    voterCountLabel: string
}
