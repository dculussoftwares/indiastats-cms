# Adding a New State to IndiaStats CMS

Complete technical reference for onboarding a new Indian state. Uses Tamil Nadu (TN) as the reference implementation.

---

## Overview

Adding a new state requires work across **5 layers**:

| Layer | What | Where |
|---|---|---|
| 1. App Config | State metadata, party colors, blocs | `src/config/states/` |
| 2. Static Assets | GeoJSON map, leader images | `public/` |
| 3. Database | 7 collections seeded with state data | PayloadCMS collections |
| 4. AI Content | Descriptions, meta descriptions | Python scripts + AWS Bedrock |
| 5. CMS Content | Blog posts, pages (optional) | Payload Admin panel |

---

## Layer 1 — State Config File

### Create `src/config/states/{state-slug}.ts`

```ts
import { StateConfig } from './types'

export const karnatakaConfig: StateConfig = {
    code: 'KA',                    // 2-letter ECI state code (unique)
    slug: 'karnataka',             // URL slug — must match [stateSlug] route
    name: 'Karnataka',             // Display name

    // All major parties that contested in this state (use ECI abbreviations)
    majorParties: ['INC', 'BJP', 'JD(S)', 'BSP', 'CPI', 'CPI(M)'],

    // Political blocs (alliances) — shown on dashboard/home page
    blocs: [
        {
            name: 'INDIA Bloc',
            parties: ['INC', 'JD(S)', 'CPI', 'CPI(M)'],
            leaderImage: '/images/siddaramaiah.jpg',
            color: '#00BFFF',
        },
        {
            name: 'NDA Bloc',
            parties: ['BJP'],
            leaderImage: '/images/modi.png',
            color: '#FF9933',
        },
    ],

    // Hex colors per party code — used in charts, maps, result bars
    partyColors: {
        INC: '#00BFFF',
        BJP: '#FF9933',
        'JD(S)': '#008000',
        BSP: '#0000FF',
        CPI: '#CC0000',
        'CPI(M)': '#CC0000',
        IND: '#808080',
        NOTA: '#808080',
    },

    // Leader images — shown in bloc cards (path under /public/)
    leaderImages: {
        INC: '/images/siddaramaiah.jpg',
        BJP: '/images/modi.png',
        'JD(S)': '/images/kumaraswamy.jpg',
    },

    // Path to GeoJSON file for assembly map (under /public/)
    mapGeoJson: '/geojson/karnataka-assemblies.json',

    // All years this state held assembly elections
    electionYears: [1952, 1957, 1962, 1967, 1972, 1978, 1983, 1985, 1989, 1994, 1999, 2004, 2008, 2013, 2018, 2023],
}
```

### Register in `src/config/states/index.ts`

```ts
import { karnatakaConfig } from './karnataka'

// Add both code and slug registrations
stateRegistry.set('KA', karnatakaConfig)
stateRegistry.set('karnataka', karnatakaConfig)
```

---

## Layer 2 — Static Assets

### 2a. GeoJSON Map (`public/geojson/{state-slug}-assemblies.json`)

Required for the `/[stateSlug]/assembly-map` interactive map (Leaflet).

**Schema — each Feature must have:**

```json
{
  "type": "FeatureCollection",
  "features": [
    {
      "type": "Feature",
      "properties": {
        "AC_NO": 1,
        "AC_NAME": "Kanakapura",
        "DIST_NAME": "Ramanagara",
        "ST_CODE": "KA",
        "AC_TYPE": "GEN"
      },
      "geometry": {
        "type": "Polygon",
        "coordinates": [[[77.4, 12.5], [77.5, 12.5], ...]]
      }
    }
  ]
}
```

| Property | Required | Description |
|---|---|---|
| `AC_NO` | Yes | Assembly constituency number (matches `assemblyNo` in DB) |
| `AC_NAME` | Yes | English name (used for tooltip/label) |
| `DIST_NAME` | Yes | District name |
| `ST_CODE` | Yes | State code (e.g., `KA`) |
| `AC_TYPE` | Yes | `GEN`, `SC`, or `ST` (reservation type) |

**Source:** Datameet India GIS repository or Bhuvan ECI portal. Simplify geometry to <5MB for web performance (`mapshaper` tool recommended).

### 2b. Leader / Party Images (`public/images/`)

Referenced in `leaderImages` in the state config. PNG or JPG, ideally square, ~200×200px minimum.

---

## Layer 3 — Database Collections

All 7 collections use a `stateCode` field as the partition key. **Data from all states coexists in the same tables** — filtered by `stateCode` at query time.

### 3a. Districts Collection

**Record count:** 1 per district (e.g., Karnataka has 31 districts)

| Field | Type | Example | Notes |
|---|---|---|---|
| `stateCode` | text | `KA` | Required, indexed |
| `districtId` | text | `dt-ka-001` | Unique. Prefix with state to avoid TN collision |
| `districtName` | text | `ಬೆಂಗಳೂರು / BENGALURU` | Bilingual: `"Local / ENGLISH"` |
| `zoneId` | text | `z-ka-1` | Optional — if state uses zones |
| `zoneName` | text | `South Karnataka` | Optional |
| `slug` | text | `bengaluru` | URL slug — lowercase, hyphenated |
| `description` | textarea | — | AI-generated (Layer 4) |
| `metaDescription` | textarea | — | AI-generated, 150–160 chars (Layer 4) |
| `knownBusinesses` | json | `{...}` | AI-extracted (Layer 4) |

**Bilingual format:** Always `"NativeScript / ENGLISH_CAPS"` — the app splits on ` / ` to display appropriate script.

---

### 3b. Zones Collection

Optional grouping layer above districts (TN uses zones like "Kongu Nadu", "Delta"). Skip if state doesn't use geographic zones.

| Field | Type | Example |
|---|---|---|
| `stateCode` | text | `KA` |
| `zoneId` | text | `z-ka-1` |
| `zoneName` | text | `South Karnataka` |
| `slug` | text | `south-karnataka` |
| `districtCount` | number | `8` |
| `assemblyCount` | number | `56` |

---

### 3c. Assemblies Collection

**Record count:** 1 per assembly constituency (Karnataka = 224)

| Field | Type | Example | Notes |
|---|---|---|---|
| `stateCode` | text | `KA` | Required |
| `assemblyId` | text | `ka-ac001` | **Unique globally** — prefix with state code |
| `name` | text | `ಕನಕಪುರ / KANAKAPURA` | Bilingual |
| `districtName` | text | `ರಾಮನಗರ / RAMANAGARA` | Bilingual |
| `districtId` | text | `dt-ka-015` | FK to districts |
| `zoneId` | text | `z-ka-1` | Optional |
| `zoneName` | text | `South Karnataka` | Optional |
| `slug` | text | `kanakapura` | URL slug — unique globally |
| `noOfBooths` | number | `247` | Total polling booths |
| `electedMla` | json | See below | Current MLA data |
| `voters` | json | See below | Current voter roll stats |
| `lastElectionVoters` | json | See below | Previous election voter stats |
| `description` | textarea | — | AI-generated |
| `metaDescription` | textarea | — | AI-generated |

**`electedMla` JSON shape:**
```json
{
  "name": "D.K. Shivakumar",
  "party": "INC",
  "electionYear": 2023,
  "votes": 98432,
  "margin": 25371
}
```

**`voters` JSON shape:**
```json
{
  "male": 112543,
  "female": 108921,
  "trans": 12,
  "total": 221476,
  "isReservedAc": false
}
```
`isReservedAc: true` for SC/ST reserved constituencies.

**`lastElectionVoters` JSON shape:** Same structure as `voters`, for the previous election year.

**assemblyId convention:** Use `{stateCode-lowercase}-ac{zero-padded-number}` (e.g., `ka-ac001` through `ka-ac224`). Never reuse TN's `ac001`–`ac234`.

---

### 3d. Election History Collection

**Record count:** 1 per **candidate** per election year per constituency.
For Karnataka with 224 ACs × ~10 candidates × 12 elections ≈ ~27,000 records.

| Field | Type | Example | Notes |
|---|---|---|---|
| `stateCode` | text | `KA` | Required, indexed |
| `assemblyId` | text | `ka-ac001` | FK to assemblies |
| `assemblyName` | text | `KANAKAPURA` | Denormalised for query perf |
| `assemblyNo` | number | `1` | ECI constituency number |
| `electionYear` | number | `2023` | Required, indexed |
| `totalVoters` | number | `221476` | Registered voters that year |
| `votesPolled` | number | `178432` | Actual votes cast |
| `candidateName` | text | `D.K. Shivakumar` | Required |
| `candidateParty` | text | `INC` | ECI party abbreviation |
| `candidateVotes` | number | `98432` | Required |

**To get winner:** Query `assemblyId + electionYear`, sort `candidateVotes DESC`, take first record.

**Data source:** ECI Vidhan Sabha results (https://results.eci.gov.in/). Also available via Datameet's `indian-elections` GitHub repository.

---

### 3e. Booths Collection

**Record count:** ~250–350 per assembly. Karnataka total ≈ 58,000 booths. This is optional — only import if you need booth-level voter list data.

| Field | Type | Example | Notes |
|---|---|---|---|
| `stateCode` | text | `KA` | Required |
| `boothId` | text | `ka-ac001-b001` | Unique globally |
| `assemblyId` | text | `ka-ac001` | FK to assemblies |
| `districtId` | text | `dt-ka-015` | FK to districts |
| `wardAddress` | text | `Ward No. 5, Kanakapura` | Booth location |
| `streetName` | text | `MG Road` | Street/landmark |
| `pdfLink` | text | `https://...` | Voter list PDF URL (ECI) |

**Data source:** ECI voter list portal (https://www.nvsp.in/) or state-specific CEOs.

---

### 3f. Caste Census Collection

Optional. Powers the `/caste-demographics` page.

**Record count:** 1 per assembly constituency (224 for Karnataka).

| Field | Type | Example | Notes |
|---|---|---|---|
| `stateCode` | text | `KA` | Required |
| `assemblyId` | text | `ka-ac001` | Required |
| `assemblyName` | text | `KANAKAPURA` | Denormalised |
| `rank1Caste` | text | `Vokkaliga` | Dominant caste/community |
| `rank1Percentage` | number | `34.5` | |
| `rank2Caste` | text | `SC/Dalit` | |
| `rank2Percentage` | number | `22.1` | |
| `rank3Caste` | text | `Lingayat` | |
| `rank3Percentage` | number | `15.8` | |
| `rank4Caste` | text | — | |
| `rank4Percentage` | number | — | |
| `rank5Caste` | text | — | |
| `rank5Percentage` | number | — | |

**Data source:** CSDS Lokniti surveys, state OBC commission reports, academic research. This is estimated data — no official government caste census at constituency level exists.

---

### 3g. Alliances Collection

1 record per alliance per election year.

| Field | Type | Example |
|---|---|---|
| `stateCode` | text | `KA` |
| `electionYear` | number | `2023` |
| `allianceName` | text | `INDIA Bloc` |
| `parties` | array | `[{partyName: "INC"}, {partyName: "JD(S)"}]` |
| `color` | text | `#00BFFF` |

---

## Layer 4 — AI-Generated Content

Run after DB data is seeded. Uses the existing Python scripts with a `--state-code` flag (you'll need to add this parameter to the scripts).

### Step-by-step

```bash
# 1. Generate assembly descriptions (AWS Bedrock — ~30 min for 224 ACs)
python scripts/generate_assembly_descriptions.py \
  --server-url=http://localhost:3001 \
  --state-code=KA \
  --aws-key=AKIA... --aws-secret=... --aws-region=us-east-1

# 2. Import generated descriptions into DB
DOTENV_CONFIG_PATH=.env.local pnpm exec tsx scripts/import-assembly-descriptions.ts

# 3. Generate district descriptions
python scripts/generate_district_descriptions.py \
  --state-code=KA \
  --aws-key=AKIA... --aws-secret=... --aws-region=us-east-1

# 4. Import district descriptions
DOTENV_CONFIG_PATH=.env.local pnpm exec tsx scripts/import-district-descriptions.ts

# 5. Generate assembly business/landmark data
python scripts/generate_assembly_businesses.py --state-code=KA ...

# 6. Import
DOTENV_CONFIG_PATH=.env.local pnpm exec tsx scripts/import-assembly-businesses.ts

# 7. District businesses
python scripts/generate_district_businesses.py --state-code=KA ...
DOTENV_CONFIG_PATH=.env.local pnpm exec tsx scripts/import-district-businesses.ts
```

**Cost estimate (AWS Bedrock, Llama 3.1 70B):**
- 224 assemblies × ~2000 tokens output = ~$8–12
- 31 districts × ~2000 tokens = ~$1–2
- Total: ~$10–15 per state

---

## Layer 5 — CMS Content (Optional)

Via the Payload Admin panel at `/admin`:

- **Blog posts** about the state's political history, key constituencies
- **Pages** — state-specific static content
- **SEO** — Open Graph images per state page

---

## Full Checklist

### Code changes

- [ ] Create `src/config/states/{state-slug}.ts`
- [ ] Register in `src/config/states/index.ts` (both code + slug)
- [ ] Run `pnpm generate:types` if any new fields were added to collections

### Static assets

- [ ] `public/geojson/{state-slug}-assemblies.json` — GeoJSON map
- [ ] `public/images/{leader-name}.jpg` — leader photos referenced in config

### Database — core (required)

- [ ] Seed **Districts** (N records)
- [ ] Seed **Assemblies** (N records)
- [ ] Seed **Election History** (~N×candidates×years records)
- [ ] Seed **Alliances** per election year

### Database — supplementary (optional but recommended)

- [ ] Seed **Zones** (if applicable)
- [ ] Seed **Booths** (~N×250 records, slow — ~2h for TN's 45k)
- [ ] Seed **Caste Census** (N records, estimated data)

### AI content

- [ ] Run assembly description generation + import
- [ ] Run district description generation + import
- [ ] Run assembly businesses generation + import
- [ ] Run district businesses generation + import

### Verification

```bash
# Sanity check via API
pnpm exec tsx scripts/sanity-check-via-api.ts

# Spot check a page
open http://localhost:3001/{state-slug}
open http://localhost:3001/{state-slug}/assembly-map
open http://localhost:3001/{state-slug}/caste-demographics
```

---

## ID Conventions Reference

| Collection | TN format | New state format |
|---|---|---|
| Assembly ID | `ac001`–`ac234` | `{state-lowercase}-ac001` (e.g., `ka-ac001`) |
| District ID | `dt1`–`dt38` | `dt-{state-lowercase}-1` (e.g., `dt-ka-1`) |
| Zone ID | `z1`–`z8` | `z-{state-lowercase}-1` (e.g., `z-ka-1`) |
| Booth ID | `{assemblyId}-b{n}` | `ka-ac001-b001` |

> The prefix approach ensures globally unique IDs when multiple states share the same PostgreSQL tables.

---

## Data Sources Reference

| Data | Source | URL |
|---|---|---|
| Election results | ECI Vidhan Sabha | https://results.eci.gov.in/ |
| Voter rolls (booths) | NVSP / state CEO | https://www.nvsp.in/ |
| GeoJSON boundaries | Datameet India | https://github.com/datameet/maps |
| Simplified GeoJSON | Bhuvan | https://bhuvan.nrsc.gov.in/ |
| Caste data (estimated) | CSDS Lokniti | https://www.lokniti.org/ |
| Party abbreviations | ECI | https://eci.gov.in/candidate-political-parties/ |
