# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

- **Development server**: `pnpm dev` (runs on http://localhost:3001)
- **Build**: `pnpm build`
- **Generate types**: `pnpm generate:types`
- **Lint**: `pnpm lint`

## Technology Stack

- **Framework**: PayloadCMS 3.x with Next.js 15
- **Database**: PostgreSQL (via `@payloadcms/db-postgres`)
- **UI**: React 19, TailwindCSS, shadcn/ui components
- **Original Data Source**: Supabase (for migration reference)

## Project Structure

```
src/
├── app/
│   ├── (frontend)/     # Public-facing pages
│   └── (payload)/      # Admin panel routes
├── collections/        # PayloadCMS collection definitions
│   ├── Assemblies.ts   # Tamil Nadu assembly constituencies
│   ├── Districts.ts    # District data (38 districts)
│   ├── Booths.ts       # Polling booth data (~45k records)
│   ├── ElectionHistory.ts # Election results by candidate/year (~15k records)
│   ├── Pages.ts        # CMS pages
│   ├── Posts.ts        # Blog posts
│   └── ...
├── scripts/            # Migration and utility scripts
└── payload.config.ts   # Main Payload configuration
```

## Database Schema - Election Data Collections

### Assemblies Collection

Stores Tamil Nadu Legislative Assembly constituencies.

| Field                | Type          | Description                                                    |
| -------------------- | ------------- | -------------------------------------------------------------- |
| `assemblyId`         | text (unique) | Unique ID like "ac001", "ac234"                                |
| `name`               | text          | Bilingual name (Tamil / English)                               |
| `districtName`       | text          | Parent district name                                           |
| `noOfBooths`         | number        | Number of polling booths                                       |
| `electedMla`         | json          | Array of elected MLAs by year                                  |
| `voters`             | json          | Current voter stats (male, female, trans, total, isReservedAc) |
| `lastElectionVoters` | json          | 2019 voter data                                                |

### Districts Collection

Stores the 38 districts of Tamil Nadu.

| Field          | Type          | Description                      |
| -------------- | ------------- | -------------------------------- |
| `districtId`   | text (unique) | Unique ID like "dt1", "dt38"     |
| `districtName` | text          | Bilingual name (Tamil / English) |

### Booths Collection

Stores polling booth information (~45,616 unique records).

| Field         | Type           | Description                      |
| ------------- | -------------- | -------------------------------- |
| `boothId`     | text           | Booth identifier within assembly |
| `assemblyId`  | text (indexed) | Reference to assembly            |
| `districtId`  | text (indexed) | Reference to district            |
| `wardAddress` | text           | Ward/location address            |
| `pdfLink`     | text           | Link to voter list PDF           |
| `streetName`  | text           | Street name                      |

### ElectionHistory Collection

Stores election results from AssemblyHistoricDataTable_V4 (~15,725 records).
Each record represents one candidate in one election year.

| Field            | Type             | Description                  |
| ---------------- | ---------------- | ---------------------------- |
| `assemblyId`     | text (indexed)   | Reference to assembly        |
| `assemblyName`   | text             | Assembly name (denormalized) |
| `assemblyNo`     | number           | Assembly number              |
| `electionYear`   | number (indexed) | Year like 1972, 2021         |
| `totalVoters`    | number           | Total registered voters      |
| `votesPolled`    | number           | Total votes cast             |
| `candidateName`  | text             | Candidate name               |
| `candidateParty` | text (indexed)   | Party abbreviation           |
| `candidateVotes` | number           | Votes received               |

## Data Migration

Data was migrated from Supabase (indiastats-main project) to PayloadCMS.

### Source Tables (Supabase)

- `AssemblyDataTable` → `assemblies` collection
- `AssemblyHistoricDataTable_V4` → `election-history` collection (use V4 only, skip V1-V3)
- `BoothDataTable` → `booths` collection
- Districts are derived from unique `districtName` values in assemblies

### Migration Scripts

```bash
# Full migration (assemblies, districts, election history)
pnpm exec tsx scripts/migrate-supabase.ts

# Include booths (takes ~2 hours for 68k records)
pnpm exec tsx scripts/migrate-supabase.ts --include-booths

# Migrate remaining records (missing history + booths)
pnpm exec tsx scripts/migrate-remaining.ts

# Verify migration counts
pnpm exec tsx scripts/verify-migration.ts
```

### Required Environment Variables for Migration

```
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key
```

## Data Relationships

```
Districts (38)
  └── Assemblies (234)
        ├── Booths (~45k)
        └── ElectionHistory (~15.7k candidate records)
```

## API Endpoints

All collections are accessible via PayloadCMS REST API:

- `GET /api/assemblies` - List assemblies
- `GET /api/assemblies?where[districtName][contains]=Chennai` - Filter by district
- `GET /api/election-history?where[assemblyId][equals]=ac001&where[electionYear][equals]=2021` - Get 2021 results for assembly
- `GET /api/booths?where[assemblyId][equals]=ac001` - Get booths for assembly

## Notes for Future Development

1. **Election History Structure**: Each candidate is a separate record. To get election results, query by `assemblyId` + `electionYear` and sort by `candidateVotes` DESC.

2. **Bilingual Names**: Assembly and district names are stored as "Tamil / English" format (e.g., "சென்னை / CHENNAI").

3. **Reserved Constituencies**: The `isReservedAc` flag in voters JSON indicates SC/ST reserved constituencies.

4. **Elected MLAs**: The `electedMla` JSON array in assemblies contains historical MLA data with party information.
