import { StateConfig } from './types'

export const tamilNaduConfig: StateConfig = {
  code: 'TN',
  slug: 'tamil-nadu',
  name: 'Tamil Nadu',
  assemblyCount: 234,
  districtCount: 38,

  majorParties: ['TVK', 'DMK', 'AIADMK', 'PMK', 'BJP', 'INC', 'VCK', 'MDMK', 'CPI', 'CPI(M)'],

  blocs: [
    {
      name: 'TVK',
      parties: ['TVK'],
      leaderImage: '/images/VIJAY.png',
      color: '#F5C518',
    },
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
      color: '#2fdf89',
    },
  ],

  partyColors: {
    TVK: '#F5C518', // Yellow/Gold
    DMK: '#E7191E', // Red
    AIADMK: '#2fdf89', // Green
    ADMK: '#2fdf89', // Alias
    BJP: '#FF9933', // Saffron
    INC: '#00BFFF', // Blue
    CONG: '#00BFFF', // Alias
    PMK: '#FFCC00', // Yellow
    VCK: '#FFA500', // Orange
    CPI: '#CC0000', // Communist red
    'CPI(M)': '#CC0000', // Communist red
    MDMK: '#FF6600', // Orange
    DMDK: '#0066CC', // Blue
    IUML: '#008000', // Green
  },

  leaderImages: {
    TVK: '/images/VIJAY.png',
    DMK: '/images/Stalin.png',
    AIADMK: '/images/EPS.jpg',
    ADMK: '/images/EPS.jpg',
    BJP: '/images/modi.png',
    INC: '/images/karkae.jpg',
    CONG: '/images/karkae.jpg',
  },

  mapGeoJson: '/geojson/tamil-nadu-assemblies.json',

  electionYears: [1972, 1977, 1980, 1984, 1989, 1991, 1996, 2001, 2006, 2011, 2016, 2021, 2026],

  historyStartYear: 1977,

  partyNameMap: {
    'TAMILAGA VETTRI KAZHAGAM': 'TVK',
    'DRAVIDA MUNNETRA KAZHAGAM': 'DMK',
    'ALL INDIA ANNA DRAVIDA MUNNETRA KAZHAGAM': 'AIADMK',
    'ANNA DRAVIDA MUNNETRA KAZHAGAM': 'AIADMK',
    'INDIAN NATIONAL CONGRESS': 'INC',
    'BHARATIYA JANATA PARTY': 'BJP',
    'PATTALI MAKKAL KATCHI': 'PMK',
    'VIDUTHALAI CHIRUTHAIGAL KATCHI': 'VCK',
    'INDIAN UNION MUSLIM LEAGUE': 'IUML',
    'COMMUNIST PARTY OF INDIA (MARXIST)': 'CPI(M)',
    'COMMUNIST PARTY OF INDIA': 'CPI',
    'AMMA MAKKAL MUNNETTRA KAZAGAM': 'AMMK',
    'DESIYA MURPOKKU DRAVIDA KAZHAGAM': 'DMDK',
    'NAAM TAMILAR KATCHI': 'NTK',
    'MAKKAL NEEDHI MAIAM': 'MNM',
    'MARUMALARCHI DRAVIDA MUNNETRA KAZHAGAM': 'MDMK',
    'KERALA CONGRESS (M)': 'KC(M)',
  },

  defaultHashtags: [
    'TamilNadu',
    'TNElections',
    'TamilNaduPolitics',
    'IndiaStats',
    'DMK',
    'AIADMK',
    'TNPolls',
    'ElectionData',
    'TVK',
    'Vijay',
    'Stalin',
    'EPS',
    'BJP',
    'Modi',
    'INC',
    'RahulGandhi',
  ],

  boothCountLabel: '50,000+',
  voterCountLabel: '6+ crore',
}
