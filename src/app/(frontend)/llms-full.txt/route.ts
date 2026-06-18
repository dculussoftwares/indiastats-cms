import { NextResponse } from 'next/server'

const CONTENT = `# IndiaStats.org — Full Content Index

> India's most comprehensive assembly election data platform. Covers all 234 Tamil Nadu assembly constituencies with election results from 1977–2026, booth-level voter data, caste demographics, and live counting-day results. Data sourced from the Election Commission of India.

## Platform Overview

IndiaStats.org provides free, non-partisan, open-source Indian election data. The platform is built on PayloadCMS and Next.js, with data ingested directly from the Election Commission of India (eci.gov.in). All data is publicly available and free to use.

## 2026 Tamil Nadu Election Results (Final)

- **Total seats:** 234
- **TVK (Tamilaga Vettri Kazhagam):** 108 seats
- **DMK (Dravida Munnetra Kazhagam):** 59 seats
- **AIADMK (All India Anna Dravida Munnetra Kazhagam):** 47 seats
- **INC (Indian National Congress):** 5 seats
- **Others / Independents:** 15 seats
- **Result:** Hung assembly — TVK is the largest single party but short of the 118-seat majority

## Data Coverage

- **234 assembly constituencies** across 38 districts in Tamil Nadu
- **50,000+ polling booths** with booth-level voter data (male/female/trans breakdown)
- **Election history:** 1977, 1980, 1984, 1989, 1991, 1996, 2001, 2006, 2011, 2016, 2021, 2026
- **6+ crore registered voters** as of 2026 roll
- **Caste demographics:** Constituency-level estimated caste composition (top 5 castes per constituency)
- **Live results:** Counting-day real-time results ingested from ECI website

## Core Data Pages

- [Tamil Nadu Home](/tamil-nadu): State overview with 2026 results and historical trends
- [Assembly Constituencies Map](/tamil-nadu/assembly-map): Interactive choropleth map of all 234 constituencies
- [Election Data Table](/election-data): Full cross-constituency dataset, filterable by year and party
- [Election Results](/tamil-nadu/election-results): Live and final result maps with party colours
- [Caste Demographics](/tamil-nadu/caste-demographics): Constituency-level caste composition data
- [Election Analysis 2026](/tamil-nadu/election-analysis/2026): Deep analysis of the 2026 Tamil Nadu assembly elections
- [Election Analysis 2021](/tamil-nadu/election-analysis/2021): Analysis of the 2021 Tamil Nadu assembly elections

## 38 Districts of Tamil Nadu

Ariyalur, Chengalpattu, Chennai, Coimbatore, Cuddalore, Dharmapuri, Dindigul, Erode, Kallakurichi, Kanchipuram, Kanyakumari, Karur, Krishnagiri, Madurai, Mayiladuthurai, Nagapattinam, Namakkal, Nilgiris, Perambalur, Pudukkottai, Ramanathapuram, Ranipet, Salem, Sivaganga, Tenkasi, Thanjavur, Theni, Thoothukudi, Tiruchirappalli, Tirunelveli, Tirupathur, Tiruppur, Tiruvallur, Tiruvannamalai, Tiruvarur, Vellore, Villupuram, Virudhunagar

## Blog & Analysis

- [Posts](/posts): In-depth articles on Tamil Nadu election history and party analysis
- [Tamil Nadu 2026 Election Preview](/posts/tamil-nadu-2026-assembly-election-preview)
- [DMK vs AIADMK: 50-Year Rivalry](/posts/dmk-vs-aiadmk-50-year-rivalry-tamil-nadu)
- [How to Read Tamil Nadu Election Data](/posts/how-to-read-tamil-nadu-election-data-guide)
- [Chennai Constituencies Guide](/posts/chennai-assembly-constituencies-guide)
- [SC/ST Reserved Constituencies](/posts/sc-st-reserved-constituencies-tamil-nadu)

## About the Platform

- **Mission:** Free, non-partisan, accurate Indian election data for citizens, researchers, and journalists
- **Data source:** Election Commission of India (eci.gov.in) — official results only
- **Open source:** https://github.com/dculussoftwares/indiastats-cms

## API Access

The platform exposes a public REST API via PayloadCMS:
- \`GET /api/assemblies?where[districtName][contains]=Chennai\`
- \`GET /api/election-history?where[assemblyId][equals]=ac001&where[electionYear][equals]=2021\`
- \`GET /api/booths?where[assemblyId][equals]=ac001\`

## Contact

- Site: https://indiastats.org
- Email: contact@indiastats.org
- X/Twitter: @india_stats_org (https://x.com/india_stats_org)
- GitHub: https://github.com/dculussoftwares/indiastats-cms
`

export async function GET() {
  return new NextResponse(CONTENT, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, max-age=3600, stale-while-revalidate=86400',
    },
  })
}
