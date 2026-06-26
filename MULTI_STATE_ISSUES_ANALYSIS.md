# Multi-State Implementation Issues - Deep Dive Analysis

**Date**: 2026-06-26  
**Issue**: Uttar Pradesh pages showing Tamil Nadu data, incorrect election years, party blocs, and map misalignment

---

## Root Cause Summary

The state-scoped pages under `[stateSlug]` route have **state context available** via `StateProvider`, but most components are **NOT using it** when fetching data from APIs. All backend APIs support `stateCode` parameter but default to 'TN' when not provided.

---

## Issues Found

### 1. **AssemblyMap Component** ❌ CRITICAL
**Location**: `src/components/AssemblyMap/index.tsx`

**Problems**:
- ❌ Does NOT pass `stateCode` to API calls (lines 490, 514, 583, 618)
- ❌ Uses hardcoded Tamil Nadu election years in UI
- ❌ Party colors from state config not being used
- ❌ GeoJSON is state-specific (passed correctly), but data overlay is TN-only

**Affected API Calls**:
```typescript
// Line 490 - Missing stateCode
const response = await fetch('/api/map-stats')

// Line 514 - Missing stateCode  
const response = await fetch('/api/caste-data?all=true')

// Line 583 - Missing stateCode
const response = await fetch(`/api/election-results?year=${selectedElectionYear}`)

// Line 618 - Missing stateCode
const response = await fetch(`/api/election-results?year=${compareYear}`)
```

**Impact**:
- `/uttar-pradesh/assembly-map` shows TN data with UP boundaries
- Election year dropdown shows TN years (1972-2026) instead of UP years (1985-2027)
- Party colors/blocs show TN alliances (DMK, AIADMK, TVK) instead of UP alliances (NDA, SP Alliance, BSP)

---

### 2. **ElectionInsightsPanel Component** ❌ MODERATE
**Location**: `src/components/ElectionInsightsPanel/index.tsx`

**Problems**:
- ❌ Does NOT pass `stateCode` to API (line 55)
- Does NOT use `useStateConfig()` hook

**Affected API Call**:
```typescript
// Line 55 - Missing stateCode
const response = await fetch(`/api/election-insights?year1=${year1}&year2=${year2}`)
```

**Impact**:
- Year-over-year comparison panel shows TN election changes instead of UP

---

### 3. **CasteDemographicsClient** ❌ MODERATE
**Location**: `src/app/(frontend)/[stateSlug]/caste-demographics/CasteDemographicsClient.tsx`

**Problems**:
- ❌ Does NOT pass `stateCode` to API

**Affected API Call**:
```typescript
const response = await fetch('/api/caste-data?all=true')
```

**Impact**:
- `/uttar-pradesh/caste-demographics` shows TN caste data

---

### 4. **BoothsPageClient** ❌ MODERATE
**Location**: `src/app/(frontend)/[stateSlug]/assembly/[districtSlug]/[assemblySlug]/booths/BoothsPageClient.tsx`

**Problems**:
- ❌ Does NOT pass `stateCode` to API

**Affected API Call**:
```typescript
const response = await fetch(`/api/booths?assemblyId=${assemblyId}`)
```

**Impact**:
- Booth listings may return incorrect data when assembly IDs overlap between states

---

### 5. **BoothPageClient** ❌ LOW (Likely OK)
**Location**: `src/app/(frontend)/[stateSlug]/assembly/.../booths/[boothId]/BoothPageClient.tsx`

**Problems**:
- ❌ Does NOT pass `stateCode` to API

**Affected API Call**:
```typescript
const response = await fetch(`/api/booths/${boothId}`)
```

**Impact**:
- Individual booth details - LOW RISK if boothId is globally unique

---

## State Configuration System ✅ WORKING

**Location**: `src/config/states/`

The state configuration system is **properly set up**:

### Tamil Nadu Config
- **Code**: `TN`
- **Election Years**: `[1972, 1977, ..., 2021, 2026]`
- **Blocs**: TVK, DMK Bloc, AIADMK Bloc
- **Parties**: TVK, DMK, AIADMK, BJP, INC, PMK, VCK, etc.
- **Map**: `/geojson/tamil-nadu-assemblies.json`

### Uttar Pradesh Config
- **Code**: `UP`
- **Election Years**: `[1985, 1989, ..., 2022, 2027]`
- **Blocs**: NDA (BJP+ApnaDal+NISHAD), SP Alliance (SP+RLD), BSP
- **Parties**: BJP, SP, BSP, INC, RLD, SBSP, NISHAD, ApnaDal(S), AIMIM
- **Map**: `/geojson/uttar-pradesh-assemblies.json`

### State Provider ✅
**Location**: `src/components/providers/StateProvider.tsx`

```typescript
export function useStateConfig(): StateConfig {
  const context = useContext(StateContext)
  if (!context) {
    throw new Error('useStateConfig must be used within a StateProvider')
  }
  return context.state
}
```

The hook is **available** but **not being used** by most components.

---

## Backend APIs ✅ READY

All APIs **correctly support** `stateCode` parameter with 'TN' default:

| API Endpoint | stateCode Support | Default |
|--------------|-------------------|---------|
| `/api/map-stats` | ✅ Line 8 | `'TN'` |
| `/api/caste-data` | ✅ Line 10 | `'TN'` |
| `/api/election-results` | ✅ Line 17 | `'TN'` |
| `/api/election-insights` | ✅ Line 18 | `'TN'` |
| `/api/booths` | ✅ Line 10 | `'TN'` |

---

## Pages That Work Correctly ✅

### 1. **Assembly Detail Page** ✅
**Location**: `src/app/(frontend)/[stateSlug]/assembly/[districtSlug]/[assemblySlug]/page.tsx`

**Why it works**:
- Data fetched server-side via `getPayload()` with `stateCode` query
- No client-side API calls without stateCode

### 2. **Dashboard Page** ✅
**Location**: `src/app/(frontend)/[stateSlug]/dashboard/`

**Why it works**:
- Server-side data fetching in `page.tsx`
- Props passed down to `DashboardClient.tsx`
- No direct API calls in client component

### 3. **District Page** ✅
**Location**: `src/app/(frontend)/[stateSlug]/district/[districtSlug]/`

**Why it works**:
- Server-side data fetching
- Uses state config for rendering

---

## Fix Priority

### 🔴 CRITICAL (Blocking UP launch)
1. **AssemblyMap** - Core feature, highly visible, completely broken for UP

### 🟡 HIGH (Important but not blocking)
2. **ElectionInsightsPanel** - Used in AssemblyMap compare mode
3. **CasteDemographicsClient** - Dedicated page, wrong data

### 🟢 MEDIUM (Edge cases)
4. **BoothsPageClient** - Works if assemblyId unique, but should be fixed
5. **BoothPageClient** - LOW risk, but complete for consistency

---

## Recommended Fix Pattern

### For Client Components:
```typescript
'use client'
import { useStateConfig } from '@/components/providers/StateProvider'

export function MyComponent() {
  const state = useStateConfig()
  
  // In API calls:
  const response = await fetch(`/api/endpoint?stateCode=${state.code}&other=params`)
  
  // For election years:
  const electionYears = state.electionYears
  
  // For party colors:
  const color = state.partyColors[partyCode]
  
  // For blocs:
  const blocs = state.blocs
}
```

### For Server Components:
Already working correctly - they query Payload with `stateCode: { equals: stateConfig.code }`

---

## Testing Checklist for UP

After fixes, verify these URLs work correctly for UP:

- [ ] `/uttar-pradesh` - Home page
- [ ] `/uttar-pradesh/dashboard` - Shows UP stats
- [ ] `/uttar-pradesh/assembly-map` - UP map with UP data
  - [ ] Election year dropdown: 1985-2027 ✅
  - [ ] Party colors: BJP (saffron), SP (red), BSP (blue) ✅
  - [ ] Blocs: NDA, SP Alliance, BSP ✅
  - [ ] Map aligns with UP boundaries ✅
- [ ] `/uttar-pradesh/caste-demographics` - UP caste data
- [ ] `/uttar-pradesh/assembly/...` - Individual assemblies work
- [ ] `/uttar-pradesh/district/...` - Districts show UP data

---

## Database Verification

Before testing, confirm UP data exists:

```sql
-- Check assemblies
SELECT COUNT(*) FROM assemblies WHERE "stateCode" = 'UP'; -- Should be 403

-- Check districts  
SELECT COUNT(DISTINCT "districtName") FROM assemblies WHERE "stateCode" = 'UP'; -- Should be 75

-- Check election history
SELECT COUNT(*) FROM "election-history" WHERE "stateCode" = 'UP'; -- Should be >0

-- Check caste census
SELECT COUNT(*) FROM "caste-census" WHERE "stateCode" = 'UP'; -- Should be >0

-- Check booths
SELECT COUNT(*) FROM booths WHERE "stateCode" = 'UP'; -- Should be >0
```

---

## Files to Modify

1. `src/components/AssemblyMap/index.tsx` - Add stateCode to 4 API calls
2. `src/components/ElectionInsightsPanel/index.tsx` - Add stateCode param
3. `src/app/(frontend)/[stateSlug]/caste-demographics/CasteDemographicsClient.tsx` - Add stateCode
4. `src/app/(frontend)/[stateSlug]/assembly/.../booths/BoothsPageClient.tsx` - Add stateCode
5. `src/app/(frontend)/[stateSlug]/assembly/.../booths/[boothId]/BoothPageClient.tsx` - Add stateCode

---

## Additional Notes

### Election Year Selector
AssemblyMap should use `state.electionYears` for the dropdown instead of hardcoded years.

### Party Color Legend
Should render using `state.partyColors` instead of hardcoded TN parties.

### Alliance/Bloc Cards
Dashboard and other pages use `state.blocs` which is correctly configured for both states.

### Map Center/Bounds
Each GeoJSON has its own coordinates - this is handled correctly by Leaflet's `bounds` calculation.
