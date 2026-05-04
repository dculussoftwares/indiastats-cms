// Party color mapping - shared across components
export const PARTY_COLORS: Record<string, string> = {
    DMK: '#b71c1c', // Deep Red
    ADMK: '#388e3c', // Green
    AIADMK: '#388e3c', // Green
    TVK: '#fbc02d', // Yellow (Tamilaga Vettri Kazhagam)
    INC: '#00bcd4', // Light Blue
    BJP: '#ff9800', // Saffron
    PMK: '#1565c0', // Blue
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
    AMMK: '#e65100', // Orange (Amma Makkal Munnettra Kazagam)
    TMC: '#00897b', // Teal
    JD: '#795548', // Brown
    AISMK: '#388e3c', // Green (AIADMK alliance)
}

// Map ECI full party names to abbreviations
export const PARTY_NAME_MAP: Record<string, string> = {
    'TAMILAGA VETTRI KAZHAGAM': 'TVK',
    'DRAVIDA MUNNETRA KAZHAGAM': 'DMK',
    'ALL INDIA ANNA DRAVIDA MUNNETRA KAZHAGAM': 'AIADMK',
    'INDIAN NATIONAL CONGRESS': 'INC',
    'BHARATIYA JANATA PARTY': 'BJP',
    'PATTALI MAKKAL KATCHI': 'PMK',
    'VIDUTHALAI CHIRUTHAIGAL KATCHI': 'VCK',
    'INDIAN UNION MUSLIM LEAGUE': 'IUML',
    'COMMUNIST PARTY OF INDIA (MARXIST)': 'CPIM',
    'COMMUNIST PARTY OF INDIA': 'CPI',
    'AMMA MAKKAL MUNNETTRA KAZAGAM': 'AMMK',
    'DESIYA MURPOKKU DRAVIDA KAZHAGAM': 'DMDK',
    'NAAM TAMILAR KATCHI': 'NTK',
    'MAKKAL NEEDHI MAIAM': 'MNM',
}

export function normalizePartyName(party: string): string {
    if (!party) return party
    return PARTY_NAME_MAP[party.toUpperCase().trim()] ?? party
}

export function getPartyColor(party: string): string {
    if (!party || party.trim() === '') return '#607d8b' // Gray for unknown

    // Normalize party name (handles both abbreviations and full names)
    const normalizedParty = party.toUpperCase().trim()
    const mapped = PARTY_NAME_MAP[normalizedParty]

    // Direct match on abbreviation
    if (PARTY_COLORS[normalizedParty]) {
        return PARTY_COLORS[normalizedParty]
    }

    // Match via full-name mapping
    if (mapped && PARTY_COLORS[mapped]) {
        return PARTY_COLORS[mapped]
    }

    // Fallback partial matches
    if (normalizedParty.includes('VETTRI') || normalizedParty.includes('TVK')) {
        return PARTY_COLORS.TVK
    }
    if (normalizedParty.includes('ANNA') || normalizedParty.includes('ADMK') || normalizedParty.includes('AIADMK')) {
        return PARTY_COLORS.AIADMK
    }
    if (normalizedParty.includes('DRAVIDA MUNNETRA') || normalizedParty === 'DMK') {
        return PARTY_COLORS.DMK
    }
    if (normalizedParty.includes('INC') || normalizedParty.includes('CONGRESS')) {
        return PARTY_COLORS.INC
    }
    if (normalizedParty.includes('BJP') || normalizedParty.includes('BHARATIYA JANATA')) {
        return PARTY_COLORS.BJP
    }
    if (normalizedParty.includes('PATTALI') || normalizedParty.includes('PMK')) {
        return PARTY_COLORS.PMK
    }
    if (normalizedParty.includes('VIDUTHALAI') || normalizedParty.includes('VCK')) {
        return PARTY_COLORS.VCK
    }
    if (normalizedParty.includes('MUSLIM LEAGUE') || normalizedParty.includes('IUML')) {
        return PARTY_COLORS.IUML
    }
    if (normalizedParty.includes('COMMUNIST') || normalizedParty.includes('MARXIST')) {
        return normalizedParty.includes('MARXIST') ? PARTY_COLORS.CPIM : PARTY_COLORS.CPI
    }
    if (normalizedParty.includes('AMMA MAKKAL') || normalizedParty.includes('AMMK')) {
        return PARTY_COLORS.AMMK
    }
    if (normalizedParty.includes('DESIYA MURPOKKU') || normalizedParty.includes('DMDK')) {
        return PARTY_COLORS.DMDK
    }

    // Default gray for unknown parties
    return '#607d8b'
}
