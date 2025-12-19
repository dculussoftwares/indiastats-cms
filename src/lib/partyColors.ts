// Party color mapping - shared across components
export const PARTY_COLORS: Record<string, string> = {
    DMK: '#b71c1c', // Deep Red
    ADMK: '#388e3c', // Green
    AIADMK: '#388e3c', // Green
    INC: '#00bcd4', // Light Blue
    BJP: '#ff9800', // Saffron
    PMK: '#fbc02d', // Yellow
    DMDK: '#7b1fa2', // Purple
    VCK: '#c2185b', // Pink
    CPI: '#f44336', // Red
    CPM: '#e91e63', // Pink
    CPIM: '#e91e63', // Pink
    NTK: '#4caf50', // Light Green
    MNM: '#009688', // Teal
    IND: '#9e9e9e', // Gray
    IUML: '#2e7d32', // Dark Green
    MDMK: '#5d4037', // Brown
    TMC: '#00897b', // Teal
    JD: '#795548', // Brown
    AISMK: '#388e3c', // Green (AIADMK alliance)
}

export function getPartyColor(party: string): string {
    if (!party || party.trim() === '') return '#607d8b' // Gray for unknown

    // Normalize party name
    const normalizedParty = party.toUpperCase().trim()

    // Direct match
    if (PARTY_COLORS[normalizedParty]) {
        return PARTY_COLORS[normalizedParty]
    }

    // Check for partial matches (e.g., "All India Anna DMK" -> AIADMK)
    if (normalizedParty.includes('DMK') && !normalizedParty.includes('ADMK') && !normalizedParty.includes('AIADMK')) {
        return PARTY_COLORS.DMK
    }
    if (normalizedParty.includes('ADMK') || normalizedParty.includes('AIADMK') || normalizedParty.includes('ANNA')) {
        return PARTY_COLORS.ADMK
    }
    if (normalizedParty.includes('INC') || normalizedParty.includes('CONGRESS')) {
        return PARTY_COLORS.INC
    }
    if (normalizedParty.includes('BJP')) {
        return PARTY_COLORS.BJP
    }

    // Default gray for unknown parties
    return '#607d8b'
}
