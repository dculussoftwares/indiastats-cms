# Uttar Pradesh — Data Requirements for IndiaStats CMS

**State Code:** UP  
**URL Slug:** `uttar-pradesh`  
**Electorate size:** Largest in India — ~15.3 crore registered voters  
**Assembly seats:** 403 (Vidhan Sabha)  
**Districts:** 75  
**Next election:** 2027

---

## Data Source Audit — `data-analytics.github.io` Repo

A local copy of the `data-analytics.github.io` repository was found at `up/data-analytics.github.io/`. Here is what it contains and what it maps to.

### Available in the Repo ✅

| File | Location | What it provides | Gap |
|---|---|---|---|
| `Uttar_Pradesh.csv` | `Election_Data_2022/` | 16,940 candidate rows — 2012 + 2017 + 2022 elections, all 403 ACs | No registered voter/electorate count; no pre-2012 data |
| `Uttarpradesh_2017.csv` | `Election_maps/` | 5,256 rows — 2017 only (duplicate of above for 2017) | — |
| `uttarpradesh_assembly.json` | `Election_Data_2022/` | Assembly-level **TopoJSON** map — 402 of 403 geometries | **TopoJSON format** (not GeoJSON); missing AC 82 (Mant) |
| `uttarpradesh_assembly.json` | `Election_maps/` | Same TopoJSON, 402 geometries | Same gap |
| `district.csv` | `District_Analysis/` | All 75 UP districts: name, HQ, population, area, density | No district IDs, slugs, or zone assignments |
| `districts.json` | `District_Analysis_Geo/` | All-India district TopoJSON — 71 of 75 UP districts | 4 newer districts missing (post-2011 carve-outs) |

### Not Available in the Repo ❌

| Data | Status |
|---|---|
| Pre-2012 election results (1985–2007) | Not present — need external source |
| Registered voter count per assembly | Not present — CSV only has polled votes |
| Caste demographics per assembly | Not present |
| Booth-level data (~1.7 lakh booths) | Not present |
| Leader images | Not present |
| Alliances / bloc composition | Not present |

### CSV Schema Details

**`Election_Data_2022/Uttar_Pradesh.csv`** — the primary usable file:

```
Columns: #, AC_NAME, AC_NO, NAME, PARTY, VOTES, YEAR, polled_votes, vote_percent

Row count by year:
  2012: 6,839 rows  (~17 candidates/AC average)
  2017: 5,256 rows  (~13 candidates/AC average)
  2022: 4,845 rows  (~12 candidates/AC average)
  Total: 16,940 rows
```

**Maps to `ElectionHistory` collection as:**

| CSV field | ElectionHistory field | Notes |
|---|---|---|
| `AC_NAME` | `assemblyName` | English only (no bilingual) |
| `AC_NO` | `assemblyNo` | ECI AC number 1–403 |
| — | `assemblyId` | Must be generated: `'ac' + AC_NO.padStart(3,'0')` |
| `NAME` | `candidateName` | — |
| `PARTY` | `candidateParty` | Already in shortcodes (BJP, SP, BSP, INC…) |
| `VOTES` | `candidateVotes` | — |
| `YEAR` | `electionYear` | 2012, 2017, or 2022 |
| `polled_votes` | `votesPolled` | Total votes polled — NOT registered electors |
| — | `totalVoters` | **Missing** — needs ECI data separately |
| `vote_percent` | _(derived)_ | Not a direct collection field |
| `UP` _(hardcode)_ | `stateCode` | — |

### Top Parties by 2022 Total Votes

| Rank | Party | Total Votes |
|---|---|---|
| 1 | BJP | 3,80,51,721 |
| 2 | SP | 2,95,43,934 |
| 3 | BSP | 1,18,75,565 |
| 4 | RLD | 26,30,168 |
| 5 | INC | 21,51,234 |
| 6 | ADS (Apna Dal Soneylal) | 14,93,181 |
| 7 | SBSP | 12,52,925 |
| 8 | NISHAD | 8,40,584 |
| 9 | AIMEM | 4,50,929 |
| 10 | AAP | 3,47,192 |

### TopoJSON Map — Conversion Required

The map file is **TopoJSON** (compact format used by D3.js), not GeoJSON. The app's `AssemblyMap` component (Leaflet) expects GeoJSON (`FeatureCollection`). Conversion is a one-time step:

```bash
# Install topojson-server if not present
npm install -g topojson-server topojson-client

# Convert TopoJSON → GeoJSON
npx topojson-client geo uttarpradesh_assembly.json -o uttar-pradesh-assemblies.json -n polygons
```

**Known issue — AC 82 (Mant) is missing** from both TopoJSON files. The `Mant` constituency (AC number 82) has no polygon. Must be sourced separately or left blank.

---

## Quick Summary of What's Needed

| Category | Items | Notes |
|---|---|---|
| State config file | 1 TypeScript file | `src/config/states/uttar-pradesh.ts` |
| GeoJSON map | 1 file | 403 assembly constituency polygons |
| Leader images | 4–6 PNG/JPG files | Party leaders for blocs |
| DB seeds — Districts | 75 rows | With slugs, zone IDs |
| DB seeds — Assemblies | 403 rows | With slugs, booth counts, voter counts |
| DB seeds — Zones | 5 rows | Regional zone groupings |
| DB seeds — ElectionHistory | ~40,000+ rows | All candidate records from 1985–2022 |
| DB seeds — Booths | ~1.7 lakh rows | Per-booth address data (optional for v1) |
| DB seeds — CasteCensus | 403 rows | Per-assembly caste demographic data |
| DB seeds — Alliances | ~5–10 rows | Blocs per election year |

---

## 1. State Configuration File

**File to create:** `src/config/states/uttar-pradesh.ts`  
**Register in:** `src/config/states/index.ts`

### 1.1 Basic Fields

```typescript
{
  code: 'UP',
  slug: 'uttar-pradesh',
  name: 'Uttar Pradesh',
  assemblyCount: 403,
  districtCount: 75,
  boothCountLabel: '1.7 lakh+',
  voterCountLabel: '15+ crore',
  historyStartYear: 1985,
  electionYears: [1985, 1989, 1991, 1993, 1996, 2002, 2007, 2012, 2017, 2022, 2027],
  mapGeoJson: '/geojson/uttar-pradesh-assemblies.json',
  defaultHashtags: [
    'UttarPradesh', 'UPElections', 'UPPolitics', 'IndiaStats',
    'BJP', 'SP', 'BSP', 'YogiAdityanath', 'AkhileshYadav', 'Mayawati',
    'UPPolls', 'ElectionData'
  ]
}
```

### 1.2 Major Parties List

```
BJP, SP, BSP, INC, RLD, SBSP, NISHAD, ApnaDal(S), AIMIM
```

Parties that appear in historical data (will vary by decade):
- Pre-2000: INC, BJP, JD, BSP, SP, HVP, JNP
- 2002–2012: SP, BSP, BJP, INC, RLD, SBSP
- 2017–2022: BJP, SP, BSP, INC, RLD, Apna Dal (S), NISHAD, SBSP, AIMIM

### 1.3 Party Colors

| Party | Code | Color | Notes |
|---|---|---|---|
| Bharatiya Janata Party | BJP | `#FF9933` | Saffron — same as TN |
| Samajwadi Party | SP | `#E61C28` | Red |
| Bahujan Samaj Party | BSP | `#1E3A8A` | Blue |
| Indian National Congress | INC | `#00BFFF` | Blue — same as TN |
| Rashtriya Lok Dal | RLD | `#009900` | Green |
| Suheldev Bharatiya Samaj Party | SBSP | `#FF6600` | Orange |
| NISHAD Party | NISHAD | `#800080` | Purple |
| Apna Dal (Sonelal) | `ApnaDal(S)` | `#FFA500` | Orange |
| AIMIM | AIMIM | `#006400` | Dark green |
| Independents | IND | `#888888` | Grey |

### 1.4 Political Blocs (as of 2022 election)

```typescript
blocs: [
  {
    name: 'NDA',
    parties: ['BJP', 'ApnaDal(S)', 'NISHAD'],
    leaderImage: '/images/up/yogi.jpg',
    color: '#FF9933'
  },
  {
    name: 'SP Alliance',
    parties: ['SP', 'RLD'],   // RLD joined SP for 2022
    leaderImage: '/images/up/akhilesh.jpg',
    color: '#E61C28'
  },
  {
    name: 'BSP',
    parties: ['BSP'],         // typically contests alone
    leaderImage: '/images/up/mayawati.jpg',
    color: '#1E3A8A'
  }
]
```

> **Note:** Alliances shift every election — 2027 blocs may differ significantly.  
> The `Alliances` CMS collection stores per-year bloc data separately for historical accuracy.

### 1.5 Leader Images Required

| File path | Person | Party |
|---|---|---|
| `/images/up/yogi.jpg` | Yogi Adityanath | BJP (UP CM) |
| `/images/up/akhilesh.jpg` | Akhilesh Yadav | SP (President) |
| `/images/up/mayawati.jpg` | Mayawati | BSP (President) |
| `/images/up/jayant.jpg` | Jayant Chaudhary | RLD |
| `/images/up/modi.png` | Narendra Modi | BJP (national) |
| `/images/up/rahul.jpg` | Rahul Gandhi | INC |

Reuse `/images/modi.png` if already in `public/` from TN config.

### 1.6 Party Name Map (ECI full names → codes)

This powers the ECI scraper and election history imports. Partial list:

```typescript
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
  'PEACE PARTY': 'PP',
  'NATIONAL LOKTANTRIK PARTY': 'NLP',
  'INDEPENDENT': 'IND',
  'NOTA': 'NOTA'
}
```

---

## 2. GeoJSON Map File

**Path:** `public/geojson/uttar-pradesh-assemblies.json`

### Required Format

Must follow the same schema as `tamil-nadu-assemblies.json`:

```json
{
  "type": "FeatureCollection",
  "features": [
    {
      "type": "Feature",
      "properties": {
        "state": "Uttar Pradesh",
        "pc": "1",
        "pc_name": "Saharanpur",
        "ac": "1",
        "ac_name": "Behat"
      },
      "geometry": {
        "type": "Polygon",
        "coordinates": [...]
      }
    }
    // ... 403 features total
  ]
}
```

### Where to Get It

- **Election Commission of India** publishes official shapefiles (`.shp`) after each election
- **Datameet / IndiaMLData**: Open-source India constituency GeoJSON repos
- **SHRUG (SECC)**: Harvard/Ashoka spatial data on Indian constituencies
- Once obtained in shapefile format, convert with: `ogr2ogr -f GeoJSON output.json input.shp`

### Key Data Points

- UP has **403 Vidhan Sabha constituencies** across **80 Lok Sabha constituencies**
- `ac` field: assembly number (1–403)
- `pc` field: Lok Sabha constituency number (1–80)
- File size will be ~8–15 MB (similar scale to TN's 234 seats)

---

## 3. Database Seed Data

### 3.1 Districts (75 rows)

Each district row requires:

| Field | Type | Example |
|---|---|---|
| `stateCode` | string | `'UP'` |
| `districtId` | string | `'dt01'` |
| `districtName` | string | `'Saharanpur / सहारनपुर'` |
| `zoneId` | string | `'zone-western-up'` |
| `zoneName` | string | `'Western UP'` |
| `slug` | string | `'saharanpur'` |
| `description` | text | AI-generated (optional for v1) |
| `metaDescription` | text | AI-generated (optional for v1) |
| `knownBusinesses` | JSON | Local industry/business data (optional) |

**Bilingual name format:** `"Hindi Name / ENGLISH NAME"` — follow TN convention.

### Full list of UP's 75 Districts

**Western UP (21 districts)**
Saharanpur, Muzaffarnagar, Shamli, Meerut, Hapur, Bagpat, Bulandshahr, Gautam Buddha Nagar, Ghaziabad, Bijnor, Amroha, Moradabad, Rampur, Sambhal, Bareilly, Pilibhit, Shahjahanpur, Agra, Firozabad, Mathura, Hathras

**Central UP (12 districts)**
Aligarh, Kasganj, Etah, Mainpuri, Farrukhabad, Kannauj, Etawah, Auraiya, Kanpur Dehat, Kanpur Nagar, Unnao, Lucknow

**Bundelkhand (7 districts)**
Jalaun, Jhansi, Lalitpur, Hamirpur, Mahoba, Banda, Chitrakoot

**Eastern UP (35 districts)**
Hardoi, Lakhimpur Kheri, Sitapur, Bahraich, Shravasti, Balrampur, Gonda, Basti, Sant Kabir Nagar, Siddharth Nagar, Maharajganj, Gorakhpur, Kushinagar, Deoria, Azamgarh, Mau, Ballia, Jaunpur, Ghazipur, Chandauli, Varanasi, Sant Ravidas Nagar, Mirzapur, Sonbhadra, Allahabad (Prayagraj), Kaushambi, Pratapgarh, Fatehpur, Rae Bareli, Amethi, Sultanpur, Ambedkar Nagar, Faizabad (Ayodhya), Barabanki, Raebareli

> **Note:** District boundaries in UP have changed over time. Confirm current list against ECI 2022 data. Some new districts were carved out post-2017 (e.g., Sambhal from Moradabad, Hapur from Ghaziabad).

### 3.2 Zones (5 rows)

UP is traditionally grouped into 5 electoral zones:

| Zone ID | Zone Name | Districts | Approx. Seats |
|---|---|---|---|
| `zone-western-up` | Western UP | ~21 | ~90 |
| `zone-central-up` | Central UP | ~12 | ~60 |
| `zone-bundelkhand` | Bundelkhand | ~7 | ~19 |
| `zone-eastern-up` | Eastern UP | ~28 | ~170 |
| `zone-terai` | Terai | ~7 | ~64 |

> These are approximate — exact zone groupings should be aligned with ECI/media conventions for UP.

### 3.3 Assemblies (403 rows)

Each assembly row requires:

| Field | Type | Notes |
|---|---|---|
| `stateCode` | string | `'UP'` |
| `assemblyId` | string | `'ac001'`–`'ac403'` |
| `name` | string | Bilingual: `'बेहट / BEHAT'` |
| `districtName` | string | Bilingual district name |
| `districtId` | string | Parent district ID |
| `zoneId` | string | Regional zone |
| `zoneName` | string | Zone name |
| `slug` | string | URL-safe: `'behat'` |
| `noOfBooths` | number | Polling station count |
| `electedMla` | JSON | Historical MLA list per year |
| `voters` | JSON | `{male, female, trans, total, isReservedAc}` |
| `lastElectionVoters` | number | 2022 voter count |

**Reserved seat categories:**
- SC (Scheduled Caste) reserved: 85 seats
- ST (Scheduled Tribe) reserved: 2 seats
- General: 316 seats

**Complete list of 403 assembly constituencies** (by district grouping — ordered by ECI AC numbers):

UP constituencies are numbered 1–403. Key ones for reference:
- 1 Behat (Saharanpur)
- 14 Muzaffarnagar
- 58 Meerut Cantonment
- 67 Noida (GBN)
- 161 Lucknow East
- 174 Kanpur
- 310 Varanasi
- 403 Duddhi (Sonbhadra, ST reserved)

> Full ECI-official list with AC numbers: obtain from `https://eci.gov.in` or `https://affidavit.eci.gov.in` candidate affidavit portal.

### 3.4 Election History (~40,000+ rows)

**Format — same as TN's `ElectionHistory` collection:**

| Field | Notes |
|---|---|
| `stateCode` | `'UP'` |
| `assemblyId` | `'ac001'`–`'ac403'` |
| `assemblyName` | Constituency name |
| `assemblyNo` | ECI AC number |
| `electionYear` | One of: 1985, 1989, 1991, 1993, 1996, 2002, 2007, 2012, 2017, 2022 |
| `totalVoters` | Registered voter count for that year |
| `votesPolled` | Total votes cast |
| `candidateName` | Full name from ECI |
| `candidateParty` | Standardized party code |
| `candidateVotes` | Votes received |

**Estimated row count:** 403 seats × ~50 candidates/year × 10 years ≈ **200,000+ rows**  
(UP has large fields with many candidates per seat)

**Where to get this data:**
- **ECI Affidavit Portal** (`affidavit.eci.gov.in`) — candidate-level data for 2012–2022
- **Lok Dhaba** (Trivedi Centre for Political Data, Ashoka) — best structured source for pre-2012 data
- **Datameet / GitHub repos** — community-curated CSV data for UP
- **MyNeta.info** — candidate-level data with party affiliations

### 3.5 Booths (~1.7 lakh rows) — Phase 2

**Lower priority for v1.** Data per row:

| Field | Notes |
|---|---|
| `stateCode` | `'UP'` |
| `boothId` | ECI booth identifier |
| `assemblyId` | Parent assembly ID |
| `districtId` | Parent district ID |
| `wardAddress` | Full address of polling station |
| `pdfLink` | ECI PDF voter list link (if available) |
| `streetName` | Street/location name |

**Source:** ECI voter roll PDFs / booth locator data (election-year specific, updated frequently)

### 3.6 Caste Census (403 rows) — Phase 2

| Field | Notes |
|---|---|
| `stateCode` | `'UP'` |
| `assemblyId` | Assembly ID |
| `assemblyName` | Assembly name |
| `rank1Caste` | Dominant caste in constituency |
| `rank1Percentage` | % of voters |
| `rank2Caste` | Second dominant caste |
| ... | Up to rank5 |

**Critical for UP** — caste arithmetic is central to UP politics. Key caste groups:
- **OBC**: Yadav, Kurmi, Jat, Nishad, Maurya, Lodh, Pasi, Shakya, Saini, Kushwaha
- **SC**: Chamar/Jatav (~13%), Pasi (~5%), Valmiki/Kori
- **Upper caste**: Brahmin (~10%), Thakur/Rajput (~8%), Vaishya (~6%), Kayastha
- **Muslim**: ~19% of population (varies highly by district — highest in western UP)

**Source:** SECC 2011, academic studies (Trivedi Centre, CSDS data), local surveys

### 3.7 Alliances (per election year)

Seed the `Alliances` collection for each election year to track historical bloc composition:

| Year | Major Alliances |
|---|---|
| 2022 | NDA (BJP + Apna Dal + NISHAD), SP + RLD, BSP alone, INC alone |
| 2017 | BJP alone (landslide), SP + INC, BSP alone |
| 2012 | SP alone, BSP alone, BJP alone, INC alone |
| 2007 | BSP alone (majority), SP alone, BJP alone |
| 2002 | SP alone, BSP + BJP, INC alone |

---

## 4. Images Required

### Leader Images

Save to `public/images/up/` directory:

| File | Person | Usage |
|---|---|---|
| `yogi.jpg` | Yogi Adityanath | BJP bloc leader image |
| `akhilesh.jpg` | Akhilesh Yadav | SP bloc leader image |
| `mayawati.jpg` | Mayawati | BSP bloc leader image |
| `jayant.jpg` | Jayant Chaudhary | RLD leader image |

**Specs:** 200×200px minimum, square crop preferred, high contrast background

---

## 5. Code Changes Required

### 5.1 New File

**`src/config/states/uttar-pradesh.ts`** — StateConfig object following the same structure as `src/config/states/tamil-nadu.ts`

### 5.2 Modified Files

**`src/config/states/index.ts`** — Register UP:
```typescript
import { uttarPradeshConfig } from './uttar-pradesh'

stateRegistry.set('UP', uttarPradeshConfig)
stateRegistry.set('uttar-pradesh', uttarPradeshConfig)
```

**`src/middleware.ts`** — Currently hardcodes `DEFAULT_STATE_SLUG = 'tamil-nadu'`. No change needed if UP gets its own clean slug routing. Verify legacy redirect patterns don't assume TN-only.

**`scripts/eci-push.mts`** — Currently hardcoded for 234 TN constituencies. For UP's counting day, a `--state=UP` flag and UP-specific seat list would be needed.

---

## 6. UP vs Tamil Nadu — Key Differences

| Aspect | Tamil Nadu | Uttar Pradesh |
|---|---|---|
| Assembly seats | 234 | 403 |
| Districts | 38 | 75 |
| Voters | ~6.3 crore | ~15.3 crore |
| Booths | ~88,000 | ~1,74,000 |
| SC reserved | 42 seats | 85 seats |
| ST reserved | 2 seats | 2 seats |
| Major parties | DMK, AIADMK, TVK, BJP | BJP, SP, BSP, INC |
| Caste centrality | Moderate | Very high |
| Language | Tamil | Hindi |
| Election cycle | Every 5 years | Every 5 years |
| Next election | 2026 | 2027 |
| Data complexity | High | Very high (larger + more parties) |
| Historical data | 1972–2026 | 1985–2022 |

---

## 7. Data Source Recommendations

### Official Sources

| Source | What it provides | URL |
|---|---|---|
| ECI official site | Candidate affidavits, AC numbers | `eci.gov.in` |
| ECI Voter Portal | Booth data, voter rolls | `voterportal.eci.gov.in` |
| ECI Affidavit Portal | Candidate-level results 2012+ | `affidavit.eci.gov.in` |

### Research Databases (Best for Historical Data)

| Source | What it provides |
|---|---|
| **Lok Dhaba** (Trivedi Centre, Ashoka Univ.) | Structured AC-level results 1977–2022, downloadable CSV |
| **TCPD Data Portal** | All-India state assembly data |
| **Datameet GitHub** | Community GeoJSON and CSV data |
| **SHRUG** (Harvard/Ashoka) | Village/constituency spatial data |
| **MyNeta.info** | Candidate affidavits, winner data |

### For GeoJSON Specifically

| Source | Notes |
|---|---|
| `github.com/datameet/maps` | India assembly constituency shapefiles |
| `github.com/ramSeraph/opendata` | Comprehensive India election spatial data |
| ECI 2022 delimitation maps | Official but in PDF, needs conversion |

---

## 8. Implementation Phasing

### Phase 1 — State goes live (minimal viable)
**All data sourced from `up/data-analytics.github.io/` repo except images**

- [ ] Convert TopoJSON → GeoJSON: `npx topojson-client geo Election_Data_2022/uttarpradesh_assembly.json -n polygons > uttar-pradesh-assemblies.json`
- [ ] Place GeoJSON at `public/geojson/uttar-pradesh-assemblies.json` _(402/403 ACs — Mant missing)_
- [ ] Create `src/config/states/uttar-pradesh.ts` using party data derived from CSV
- [ ] Register UP in `src/config/states/index.ts`
- [ ] Upload leader images to `public/images/up/` _(must source externally)_
- [ ] Write seed script to import 75 districts from `District_Analysis/district.csv`
- [ ] Write seed script to build 403 assemblies from CSV AC names + ECI AC numbers
- [ ] Seed 5 zones (Western UP, Central UP, Bundelkhand, Eastern UP, Terai)
- [ ] Write seed script to import 2012 + 2017 + 2022 election history from `Election_Data_2022/Uttar_Pradesh.csv`
- [ ] Seed 2022 alliances (BJP/SP/BSP blocs)

**Result:** UP pages live with 2012–2022 election data, assembly map (402 ACs), district and assembly detail pages.

### Phase 2 — Fill gaps

- [ ] Source and add missing AC 82 (Mant) polygon to GeoJSON
- [ ] Add total registered voters per assembly (from ECI directly — not in CSV)
- [ ] Seed election history 1985–2007 (from Lok Dhaba / TCPD external source)
- [ ] Seed caste census data 403 rows (from SECC/academic sources)
- [ ] Seed booth data ~1.7 lakh rows (from ECI voter portal)
- [ ] Add UP-specific blog posts / election analysis pages
- [ ] Configure ECI push script for UP counting day (2027)

### Phase 3 — 2027 election cycle

- [ ] Update `electionYears` to include 2027
- [ ] Seed `LiveElectionResults` stubs for 2027 (one per assembly)
- [ ] Update party blocs for 2027 alliances
- [ ] Run ECI push during counting day

---

## 9. Checklist Before Going Live

- [ ] GeoJSON loads correctly on `/uttar-pradesh/assembly-map`
- [ ] All 403 assembly slug URLs resolve (`/uttar-pradesh/assembly/<district>/<assembly>`)
- [ ] All 75 district slug URLs resolve (`/uttar-pradesh/district/<district>`)
- [ ] Election analysis page works for 2022 (`/uttar-pradesh/election-analysis/2022`)
- [ ] Party colors render correctly on map
- [ ] Bloc display shows correct leaders + colors
- [ ] Caste demographics page shows data (if Phase 2 complete)
- [ ] Middleware doesn't break UP routes (slug mapping endpoint returns UP data)
- [ ] State provider renders correctly for `/uttar-pradesh` slug
- [ ] Meta descriptions / SEO tags are set for UP pages

---

*Generated: 2026-06-20 | IndiaStats CMS — Uttar Pradesh expansion analysis*
