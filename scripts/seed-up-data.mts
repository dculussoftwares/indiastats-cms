/**
 * Seed script for Uttar Pradesh — zones, districts, assemblies, alliances.
 * Run: pnpm exec tsx scripts/seed-up-data.mts
 */
import 'dotenv/config'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { getPayload } from 'payload'
import config from '../src/payload.config'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// ── helpers ──────────────────────────────────────────────────────────────────

function toSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[()]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

// ── zone definitions ──────────────────────────────────────────────────────────

const ZONES = [
  {
    zoneId: 'up-z1',
    zoneName: 'Western UP',
    slug: 'up-western',
    description: 'Western Uttar Pradesh covering Jat belt, NCR region, and western plains.',
    districtCount: 21,
    assemblyCount: 90,
  },
  {
    zoneId: 'up-z2',
    zoneName: 'Central UP',
    slug: 'up-central',
    description: 'Central Uttar Pradesh including Kanpur, Lucknow, and the Awadh region.',
    districtCount: 12,
    assemblyCount: 60,
  },
  {
    zoneId: 'up-z3',
    zoneName: 'Bundelkhand',
    slug: 'up-bundelkhand',
    description: 'Bundelkhand region covering Jhansi, Banda, and adjacent districts.',
    districtCount: 7,
    assemblyCount: 19,
  },
  {
    zoneId: 'up-z4',
    zoneName: 'Eastern UP',
    slug: 'up-eastern',
    description: 'Eastern Uttar Pradesh including Varanasi, Gorakhpur, Azamgarh belt.',
    districtCount: 28,
    assemblyCount: 170,
  },
  {
    zoneId: 'up-z5',
    zoneName: 'Terai',
    slug: 'up-terai',
    description: 'Terai region along Nepal border — Bahraich, Shrawasti, Balrampur, Siddharth Nagar.',
    districtCount: 7,
    assemblyCount: 64,
  },
]

// ── district → zone mapping ───────────────────────────────────────────────────

const DISTRICT_ZONE: Record<string, string> = {
  // Western UP (21)
  Saharanpur: 'up-z1',
  Muzaffarnagar: 'up-z1',
  Shamli: 'up-z1',
  Meerut: 'up-z1',
  Hapur: 'up-z1',
  Baghpat: 'up-z1',
  Bulandshahr: 'up-z1',
  'Gautam Buddha Nagar': 'up-z1',
  Ghaziabad: 'up-z1',
  Bijnor: 'up-z1',
  Amroha: 'up-z1',
  Moradabad: 'up-z1',
  Rampur: 'up-z1',
  Sambhal: 'up-z1',
  Bareilly: 'up-z1',
  Pilibhit: 'up-z1',
  Shahjahanpur: 'up-z1',
  Agra: 'up-z1',
  Firozabad: 'up-z1',
  Mathura: 'up-z1',
  Hathras: 'up-z1',
  // Central UP (12)
  Aligarh: 'up-z2',
  Kasganj: 'up-z2',
  Etah: 'up-z2',
  Mainpuri: 'up-z2',
  Farrukhabad: 'up-z2',
  Kannauj: 'up-z2',
  Etawah: 'up-z2',
  Auraiya: 'up-z2',
  'Kanpur Dehat': 'up-z2',
  'Kanpur Nagar': 'up-z2',
  Unnao: 'up-z2',
  Lucknow: 'up-z2',
  // Bundelkhand (7)
  Jalaun: 'up-z3',
  Jhansi: 'up-z3',
  Lalitpur: 'up-z3',
  Hamirpur: 'up-z3',
  Mahoba: 'up-z3',
  Banda: 'up-z3',
  Chitrakoot: 'up-z3',
  // Terai (7)
  'Lakhimpur Kheri': 'up-z5',
  Bahraich: 'up-z5',
  Shrawasti: 'up-z5',
  Balrampur: 'up-z5',
  Siddharthnagar: 'up-z5',
  Maharajganj: 'up-z5',
  Kushinagar: 'up-z5',
  // Eastern UP — everything else
}

function getZoneId(districtName: string): string {
  return DISTRICT_ZONE[districtName] ?? 'up-z4'
}

function getZoneName(zoneId: string): string {
  return ZONES.find((z) => z.zoneId === zoneId)?.zoneName ?? 'Eastern UP'
}

// ── district name fixes (CSV uses old names) ──────────────────────────────────

const DISTRICT_RENAME: Record<string, string> = {
  // Official renames
  Allahabad: 'Prayagraj',
  Faizabad: 'Ayodhya',
  Budaun: 'Badaun',
  'Jyotiba Phule Nagar': 'Amroha',
  'Mahamaya Nagar': 'Hathras',
  'Kansiram Nagar': 'Kasganj',
  'Kanshi Ram Nagar': 'Kasganj',
  'Bara Banki': 'Barabanki',
  Kheri: 'Lakhimpur Kheri',
  // CSV parenthetical variants → clean name
  'Amethi (Chhatrapati Shahuji Maharaj Nagar)': 'Amethi',
  'Hathras (Mahamaya Nagar)': 'Hathras',
  'Jaunpur district': 'Jaunpur',
  'Gautam Buddh Nagar': 'Gautam Buddha Nagar',
  'Kanpur Dehat (Ramabai Nagar)': 'Kanpur Dehat',
  'Panchsheel Nagar district (Hapur)': 'Hapur',
  'Sambhal(Bheem Nagar)': 'Sambhal',
  Raebareli: 'Rae Bareli',
  Shravasti: 'Shrawasti',
  // Spelling alignment with GeoJSON
  Bagpat: 'Baghpat',
}

function normalizeDistrictName(name: string): string {
  return DISTRICT_RENAME[name] ?? name
}

// ── alliances data ────────────────────────────────────────────────────────────

const ALLIANCES = [
  // 2022
  { electionYear: 2022, allianceName: 'NDA', parties: ['BJP', 'ApnaDal(S)', 'NISHAD'], color: '#FF9933' },
  { electionYear: 2022, allianceName: 'SP Alliance', parties: ['SP', 'RLD'], color: '#E61C28' },
  { electionYear: 2022, allianceName: 'BSP', parties: ['BSP'], color: '#1E3A8A' },
  { electionYear: 2022, allianceName: 'INC', parties: ['INC'], color: '#00BFFF' },
  // 2017
  { electionYear: 2017, allianceName: 'BJP', parties: ['BJP'], color: '#FF9933' },
  { electionYear: 2017, allianceName: 'SP Alliance', parties: ['SP', 'INC'], color: '#E61C28' },
  { electionYear: 2017, allianceName: 'BSP', parties: ['BSP'], color: '#1E3A8A' },
  // 2012
  { electionYear: 2012, allianceName: 'SP', parties: ['SP'], color: '#E61C28' },
  { electionYear: 2012, allianceName: 'BSP', parties: ['BSP'], color: '#1E3A8A' },
  { electionYear: 2012, allianceName: 'BJP', parties: ['BJP'], color: '#FF9933' },
  { electionYear: 2012, allianceName: 'INC', parties: ['INC'], color: '#00BFFF' },
]

// ── main ──────────────────────────────────────────────────────────────────────

async function main() {
  const payload = await getPayload({ config })

  // ── 1. Zones ────────────────────────────────────────────────────────────────
  console.log('\n── Seeding zones ──')
  for (const zone of ZONES) {
    const existing = await payload.find({
      collection: 'zones',
      where: { zoneId: { equals: zone.zoneId } },
      limit: 1,
    })
    if (existing.docs.length > 0) {
      await payload.update({
        collection: 'zones',
        id: existing.docs[0].id,
        data: { ...zone, stateCode: 'UP' },
      })
      console.log(`  updated zone: ${zone.zoneName}`)
    } else {
      await payload.create({ collection: 'zones', data: { ...zone, stateCode: 'UP' } })
      console.log(`  created zone: ${zone.zoneName}`)
    }
  }

  // ── 2. Districts ────────────────────────────────────────────────────────────
  console.log('\n── Seeding districts ──')
  const { createReadStream } = await import('node:fs')
  const { createInterface } = await import('node:readline')

  type CsvRow = { District: string; Population: string; Area: string; Density: string }
  const csvRows: CsvRow[] = []
  const csvPath = path.resolve(__dirname, '../up/data-analytics.github.io/District_Analysis/district.csv')

  await new Promise<void>((resolve, reject) => {
    const headers: string[] = []
    let firstRow = true
    const rl = createInterface({ input: createReadStream(csvPath, { encoding: 'latin1' }) })
    rl.on('line', (line) => {
      const cols = line.split(',')
      if (firstRow) {
        headers.push(...cols)
        firstRow = false
        return
      }
      if (!cols[0]?.includes('Uttar Pradesh')) return
      const row: Record<string, string> = {}
      headers.forEach((h, i) => (row[h.trim()] = (cols[i] ?? '').trim()))
      csvRows.push(row as CsvRow)
    })
    rl.on('close', resolve)
    rl.on('error', reject)
  })

  // Deduplicate (CSV may have dupes after renames)
  const seen = new Set<string>()
  let districtSeq = 1
  for (const row of csvRows) {
    const rawName = row.District?.trim()
    if (!rawName) continue
    const districtName = normalizeDistrictName(rawName)
    if (seen.has(districtName)) continue
    seen.add(districtName)

    const districtId = `up-dt${String(districtSeq).padStart(2, '0')}`
    districtSeq++
    const slug = `up-${toSlug(districtName)}`
    const zoneId = getZoneId(districtName)
    const zoneName = getZoneName(zoneId)

    const data = {
      stateCode: 'UP',
      districtId,
      districtName,
      zoneId,
      zoneName,
      slug,
    }

    const existing = await payload.find({
      collection: 'districts',
      where: { districtId: { equals: districtId } },
      limit: 1,
    })
    if (existing.docs.length > 0) {
      await payload.update({ collection: 'districts', id: existing.docs[0].id, data })
      console.log(`  updated: ${districtName} (${districtId})`)
    } else {
      await payload.create({ collection: 'districts', data })
      console.log(`  created: ${districtName} (${districtId})`)
    }
  }

  // ── 3. Assemblies ───────────────────────────────────────────────────────────
  console.log('\n── Seeding assemblies ──')

  // Load district lookup (districtName → {districtId, zoneId, zoneName})
  const districtLookupResult = await payload.find({
    collection: 'districts',
    where: { stateCode: { equals: 'UP' } },
    limit: 100,
    pagination: false,
  })
  const districtLookup = new Map(
    districtLookupResult.docs.map((d) => [
      d.districtName as string,
      { districtId: d.districtId as string, zoneId: d.zoneId as string, zoneName: d.zoneName as string },
    ]),
  )

  const geoPath = path.resolve(__dirname, '../public/geojson/uttar-pradesh-assemblies.json')
  const geoJson = JSON.parse(fs.readFileSync(geoPath, 'utf-8'))

  // Sort features by AC number
  const features = [...geoJson.features].sort(
    (a, b) => a.properties.ac - b.properties.ac,
  )

  // SC/ST reserved seats (ECI 2022)
  const SC_RESERVED = new Set([
    7, 10, 15, 19, 24, 27, 29, 35, 37, 43, 46, 50, 56, 61, 65, 68, 72, 75, 80, 86,
    90, 96, 99, 103, 108, 113, 120, 122, 125, 130, 134, 139, 142, 148, 152, 155, 162,
    167, 171, 176, 181, 184, 188, 196, 200, 204, 210, 215, 220, 226, 231, 237, 244,
    250, 255, 260, 264, 270, 275, 282, 287, 293, 299, 306, 311, 318, 324, 329, 335,
    340, 345, 350, 357, 362, 368, 374, 379, 385, 390, 396, 400, 402, 403, 5,
  ])
  const ST_RESERVED = new Set([76, 403])

  for (const feat of features) {
    const { ac, ac_name, district } = feat.properties
    const assemblyId = `up-ac${String(ac).padStart(3, '0')}`
    const slug = `up-${toSlug(ac_name)}`

    const districtInfo = districtLookup.get(district) ?? {
      districtId: '',
      zoneId: getZoneId(district),
      zoneName: getZoneName(getZoneId(district)),
    }

    const isReservedSC = SC_RESERVED.has(ac)
    const isReservedST = ST_RESERVED.has(ac)

    const data = {
      stateCode: 'UP',
      assemblyId,
      name: ac_name,
      districtName: district,
      districtId: districtInfo.districtId,
      zoneId: districtInfo.zoneId,
      zoneName: districtInfo.zoneName,
      slug,
      noOfBooths: 0,
      voters: {
        male: 0,
        female: 0,
        trans: 0,
        total: 0,
        isReservedAc: isReservedSC || isReservedST,
      },
    }

    const existing = await payload.find({
      collection: 'assemblies',
      where: { assemblyId: { equals: assemblyId } },
      limit: 1,
    })
    if (existing.docs.length > 0) {
      await payload.update({ collection: 'assemblies', id: existing.docs[0].id, data })
    } else {
      await payload.create({ collection: 'assemblies', data })
    }

    if (ac % 50 === 0 || ac === 403) console.log(`  ${ac}/403 assemblies done`)
  }

  // ── 4. Alliances ────────────────────────────────────────────────────────────
  console.log('\n── Seeding alliances ──')
  for (const alliance of ALLIANCES) {
    const existing = await payload.find({
      collection: 'alliances',
      where: {
        stateCode: { equals: 'UP' },
        electionYear: { equals: alliance.electionYear },
        allianceName: { equals: alliance.allianceName },
      },
      limit: 1,
    })
    const data = {
      stateCode: 'UP',
      electionYear: alliance.electionYear,
      allianceName: alliance.allianceName,
      parties: alliance.parties.map((p) => ({ partyName: p })),
      color: alliance.color,
    }
    if (existing.docs.length > 0) {
      await payload.update({ collection: 'alliances', id: existing.docs[0].id, data })
      console.log(`  updated: ${alliance.electionYear} ${alliance.allianceName}`)
    } else {
      await payload.create({ collection: 'alliances', data })
      console.log(`  created: ${alliance.electionYear} ${alliance.allianceName}`)
    }
  }

  console.log('\n✓ UP base data seeded successfully')
  process.exit(0)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
