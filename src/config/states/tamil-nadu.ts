import { StateConfig } from './types'

export const tamilNaduConfig: StateConfig = {
    code: 'TN',
    slug: 'tamil-nadu',
    name: 'Tamil Nadu',

    majorParties: ['DMK', 'AIADMK', 'PMK', 'BJP', 'INC', 'VCK', 'MDMK', 'CPI', 'CPI(M)'],

    blocs: [
        {
            name: 'DMK Bloc',
            parties: ['DMK', 'INC', 'VCK', 'CPI', 'CPI(M)', 'MDMK', 'IUML', 'KMDK', 'MMK'],
            leaderImage: '/images/Stalin.png',
            color: '#E7191E',
        },
        {
            name: 'AIADMK Bloc',
            parties: ['AIADMK', 'BJP', 'PMK', 'DMDK', 'TMC(M)'],
            leaderImage: '/images/EPS.jpg',
            color: '#10663D',
        },
    ],

    partyColors: {
        DMK: '#E7191E',      // Red
        AIADMK: '#10663D',   // Green
        ADMK: '#10663D',     // Alias
        BJP: '#FF9933',      // Saffron
        INC: '#00BFFF',      // Blue
        CONG: '#00BFFF',     // Alias
        PMK: '#FFCC00',      // Yellow
        VCK: '#FFA500',      // Orange
        CPI: '#CC0000',      // Communist red
        'CPI(M)': '#CC0000', // Communist red
        MDMK: '#FF6600',     // Orange
        DMDK: '#0066CC',     // Blue
        IUML: '#008000',     // Green
    },

    leaderImages: {
        DMK: '/images/Stalin.png',
        AIADMK: '/images/EPS.jpg',
        ADMK: '/images/EPS.jpg',
        BJP: '/images/modi.png',
        INC: '/images/karkae.jpg',
        CONG: '/images/karkae.jpg',
    },

    mapGeoJson: '/geojson/tamil-nadu-assemblies.json',

    electionYears: [1972, 1977, 1980, 1984, 1989, 1991, 1996, 2001, 2006, 2011, 2016, 2021],
}
