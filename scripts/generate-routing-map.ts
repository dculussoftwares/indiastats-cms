// Generate routing map by querying the database directly
// This ensures we map AC (assembly code) → districtId correctly

async function generateRoutingMap() {
  const baseUrl = 'http://localhost:3001/api'

  console.log('📊 Fetching all assemblies from API...\n')

  // Fetch all assemblies from API with pagination
  const assemblies: Array<{ assemblyId: string; slug: string; districtId: string }> = []
  let page = 1
  const pageSize = 100
  let hasMore = true

  while (hasMore) {
    const response = await fetch(`${baseUrl}/assemblies?limit=${pageSize}&page=${page}`)
    if (!response.ok) {
      throw new Error(`API error: ${response.status}`)
    }

    const data = await response.json()
    const docs = data.docs || []

    docs.forEach((doc: any) => {
      if (doc.assemblyId && doc.slug && doc.districtId) {
        assemblies.push({
          assemblyId: doc.assemblyId,
          slug: doc.slug
            .toLowerCase()
            .replace(/\s+/g, '-')
            .replace(/[^a-z0-9-]/g, ''),
          districtId: doc.districtId,
        })
      }
    })

    hasMore = (data.pagingCounter || 0) + docs.length < (data.totalDocs || 0)
    page++
  }

  console.log(`✅ Fetched ${assemblies.length} assemblies\n`)

  // Convert assemblyId (ac001, ac002, etc) to assembly code
  const routingEntries: Array<[number, string, string]> = []

  assemblies.forEach(({ assemblyId, slug, districtId }) => {
    const ac = parseInt(assemblyId.replace('ac', ''))
    routingEntries.push([ac, districtId, slug])
  })

  // Sort by assembly code
  routingEntries.sort((a, b) => a[0] - b[0])

  // Generate TypeScript file
  let output = `// Auto-generated routing map from database
// DO NOT EDIT MANUALLY - regenerate with: pnpm exec tsx scripts/generate-routing-map.ts

export interface AssemblyRouteInfo {
  district_id: string
  slug: string
}

export const ASSEMBLY_ROUTING_MAP: Record<number, AssemblyRouteInfo> = {
`

  routingEntries.forEach(([ac, districtId, slug]) => {
    output += `  ${ac}: { district_id: '${districtId}', slug: '${slug}' },\n`
  })

  output += `}

export function getAssemblyRoute(ac: number): AssemblyRouteInfo | null {
  return ASSEMBLY_ROUTING_MAP[ac] || null
}

export function buildAssemblyUrl(ac: number): string | null {
  const route = getAssemblyRoute(ac)
  if (!route) return null
  return \`/tamil-nadu/assembly/\${route.district_id}/\${route.slug}\`
}
`

  // Write file
  const fs = await import('fs')
  fs.writeFileSync('src/lib/assemblyRouting.ts', output, 'utf-8')

  console.log(`✅ Generated routing map with ${routingEntries.length} entries`)
  console.log(`Saved to: src/lib/assemblyRouting.ts\n`)
}

generateRoutingMap().catch((err) => {
  console.error('❌ Error:', err.message)
  process.exit(1)
})
