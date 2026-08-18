import { StateConfig } from './types'

export const uttarPradeshConfig: StateConfig = {
  code: 'UP',
  slug: 'uttar-pradesh',
  name: 'Uttar Pradesh',
  assemblyCount: 403,
  districtCount: 75,

  majorParties: ['BJP', 'SP', 'BSP', 'INC', 'RLD', 'SBSP', 'NISHAD', 'ApnaDal(S)', 'AIMIM'],

  blocs: [
    {
      name: 'NDA',
      parties: ['BJP', 'ApnaDal(S)', 'NISHAD'],
      leaderImage: '/images/up/yogi.png',
      color: '#FF9933',
    },
    {
      name: 'SP Alliance',
      parties: ['SP', 'RLD'],
      leaderImage: '/images/up/akhilesh.png',
      color: '#E61C28',
    },
    {
      name: 'BSP',
      parties: ['BSP'],
      leaderImage: '/images/up/mayawati.png',
      color: '#1E3A8A',
    },
  ],

  partyColors: {
    BJP: '#FF9933',
    SP: '#E61C28',
    BSP: '#1E3A8A',
    INC: '#00BFFF',
    CONG: '#00BFFF',
    RLD: '#009900',
    SBSP: '#FF6600',
    NISHAD: '#800080',
    'ApnaDal(S)': '#FFA500',
    AIMIM: '#006400',
    IND: '#888888',
  },

  leaderImages: {
    BJP: '/images/up/yogi.png',
    SP: '/images/up/akhilesh.png',
    BSP: '/images/up/mayawati.png',
    RLD: '/images/up/jayant.png',
    INC: '/images/karkae.webp',
    CONG: '/images/karkae.webp',
  },

  mapGeoJson: '/geojson/uttar-pradesh-assemblies.json',
  mapCenter: [26.8467, 80.9462],
  mapZoom: 6,

  electionYears: [
    1951, 1957, 1962, 1967, 1969, 1974, 1977, 1980, 1985, 1989, 1991, 1993, 1996, 2002, 2007,
    2012, 2017, 2022,
  ],

  historyStartYear: 1951,

  partyNameMap: {
    'BHARATIYA JANATA PARTY': 'BJP',
    'SAMAJWADI PARTY': 'SP',
    'BAHUJAN SAMAJ PARTY': 'BSP',
    'INDIAN NATIONAL CONGRESS': 'INC',
    'RASHTRIYA LOK DAL': 'RLD',
    'SUHELDEV BHARATIYA SAMAJ PARTY': 'SBSP',
    'NISHAD PARTY': 'NISHAD',
    'APNA DAL (SONEYLAL)': 'ApnaDal(S)',
    'APNA DAL (SONELAL)': 'ApnaDal(S)',
    'ALL INDIA MAJLIS-E-ITTEHADUL MUSLIMEEN': 'AIMIM',
    'JANATA DAL (UNITED)': 'JD(U)',
    'JANATA DAL (SECULAR)': 'JD(S)',
    'JANATA DAL': 'JD',
    'JANATA PARTY': 'JNP',
    'PEACE PARTY': 'PP',
    'NATIONAL LOKTANTRIK PARTY': 'NLP',
    'INDEPENDENT': 'IND',
    'NOTA': 'NOTA',
  },

  defaultHashtags: [
    'UttarPradesh',
    'UPElections',
    'UPPolitics',
    'IndiaStats',
    'BJP',
    'SP',
    'BSP',
    'YogiAdityanath',
    'AkhileshYadav',
    'Mayawati',
    'UPPolls',
    'ElectionData',
  ],

  boothCountLabel: '1.7 lakh+',
  voterCountLabel: '15+ crore',
}
