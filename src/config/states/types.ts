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

    // Election configuration
    electionYears: number[]
}

// Default colors for common parties (can be overridden per state)
export const DEFAULT_PARTY_COLORS: Record<string, string> = {
    BJP: '#FF9933',    // Saffron
    INC: '#00BFFF',    // Congress blue
    'CPI': '#CC0000',  // Communist red
    'CPI(M)': '#CC0000',
    NOTA: '#808080',   // Gray
    IND: '#808080',    // Gray for Independents
}
