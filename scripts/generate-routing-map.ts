import { getPayload } from 'payload'
import config from '../src/payload.config'
import fs from 'fs'

const stateCodeToSlug = (code: string) => {
  if (code === 'TN') return 'tamil-nadu'
  if (code === 'UP') return 'uttar-pradesh'
  return code.toLowerCase()
}

async function generateRoutingMap() {
  console.log('📊 Initializing local Payload context...\n')
  const payload = await getPayload({ config })

  console.log('📊 Fetching all assemblies from database...\n')

  const assembliesResult = await payload.find({
    collection: 'assemblies',
    limit: 1000,
    select: { assemblyId: true, slug: true, districtId: true, stateCode: true },
  })

  const assemblies = assembliesResult.docs

  console.log(`✅ Fetched ${assemblies.length} assemblies\n`)

  const routingEntries: Array<{ assemblyId: string; districtId: string; slug: string; stateSlug: string }> = []

  assemblies.forEach((doc: any) => {
    if (doc.assemblyId && doc.slug && doc.districtId && doc.stateCode) {
      routingEntries.push({
        assemblyId: doc.assemblyId,
        districtId: doc.districtId,
        slug: doc.slug
          .toLowerCase()
          .replace(/\s+/g, '-')
          .replace(/[^a-z0-9-]/g, ''),
        stateSlug: stateCodeToSlug(doc.stateCode),
      })
    }
  })

  // Sort by assemblyId
  routingEntries.sort((a, b) => a.assemblyId.localeCompare(b.assemblyId))

  // Generate TypeScript file
  let output = `// Auto-generated routing map from database
// DO NOT EDIT MANUALLY - regenerate with: pnpm exec tsx scripts/generate-routing-map.ts

export interface AssemblyRouteInfo {
  state_slug: string
  district_id: string
  slug: string
}

export const ASSEMBLY_ROUTING_MAP: Record<string, AssemblyRouteInfo> = {
`

  routingEntries.forEach(({ assemblyId, districtId, slug, stateSlug }) => {
    output += `  '${assemblyId}': { state_slug: '${stateSlug}', district_id: '${districtId}', slug: '${slug}' },\n`
  })

  output += `}

export function getAssemblyRoute(assemblyId: string): AssemblyRouteInfo | null {
  return ASSEMBLY_ROUTING_MAP[assemblyId] || null
}

export function buildAssemblyUrl(assemblyId: string): string | null {
  const route = getAssemblyRoute(assemblyId)
  if (!route) return null
  return \`/\${route.state_slug}/assembly/\${route.district_id}/\${route.slug}\`
}
`

  fs.writeFileSync('src/lib/assemblyRouting.ts', output, 'utf-8')

  console.log(`✅ Generated routing map with ${routingEntries.length} entries`)
  console.log(`Saved to: src/lib/assemblyRouting.ts\n`)
  process.exit(0)
}

generateRoutingMap().catch((err) => {
  console.error('❌ Error:', err.message)
  process.exit(1)
})
