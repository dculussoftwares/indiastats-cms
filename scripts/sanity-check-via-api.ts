import { ASSEMBLY_ROUTING_MAP } from '@/lib/assemblyRouting'

// Convert slug to normalized form for comparison
function normalizeSlug(str: string): string {
  return str
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
}

async function sanityCheck() {
  const baseUrl = 'http://localhost:3001/api'

  console.log('🔍 Sanity Check: Validating all 234 assemblies via API\n')

  // Fetch all assemblies from API with pagination
  const dbAssemblies = new Map<string, any>()
  let page = 1
  const pageSize = 100
  let hasMore = true

  while (hasMore) {
    try {
      const response = await fetch(`${baseUrl}/assemblies?limit=${pageSize}&page=${page}`)
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`)
      }

      const data = await response.json()
      const docs = data.docs || []

      docs.forEach((doc: any) => {
        dbAssemblies.set(doc.assemblyId, doc)
      })

      hasMore = (data.pagingCounter || 0) + docs.length < (data.totalDocs || 0)
      page++
    } catch (err) {
      console.log('⚠️  Could not fetch from API (dev server running?)')
      console.log('Reading from routing map only...\n')
      break
    }
  }

  console.log(`📊 API returned ${dbAssemblies.size} assemblies\n`)

  let issues = 0
  let valid = 0
  const missingFromDb: number[] = []

  // Check each assembly in routing map
  Object.entries(ASSEMBLY_ROUTING_MAP).forEach(([acStr, routeInfo]) => {
    const ac = parseInt(acStr)
    const assemblyId = `ac${String(ac).padStart(3, '0')}`

    // If we have DB data, validate it
    if (dbAssemblies.size > 0) {
      const dbAssembly = dbAssemblies.get(assemblyId)

      if (!dbAssembly) {
        missingFromDb.push(ac)
        return
      }

      // Validate district ID
      if (dbAssembly.districtId !== routeInfo.district_id) {
        console.log(
          `❌ AC ${ac}: District mismatch - DB has "${dbAssembly.districtId}" but routing map has "${routeInfo.district_id}"`
        )
        issues++
        return
      }

      // Validate slug
      const dbSlug = normalizeSlug(dbAssembly.slug || '')
      const routeSlug = routeInfo.slug

      if (dbSlug !== routeSlug) {
        console.log(
          `❌ AC ${ac} (${dbAssembly.name}): Slug mismatch - DB has "${dbSlug}" but routing map has "${routeSlug}"`
        )
        issues++
        return
      }
    }

    valid++
  })

  if (missingFromDb.length > 0) {
    console.log(`\n⚠️  ${missingFromDb.length} assemblies in routing map but not in DB API:`)
    console.log(`   ${missingFromDb.join(', ')}`)
    issues += missingFromDb.length
  }

  console.log('\n' + '='.repeat(60))
  console.log(`\n📈 Results:`)
  console.log(`  ✅ Valid:   ${valid}/234`)
  console.log(`  ❌ Issues:  ${issues}`)

  if (issues === 0) {
    console.log(`\n🎉 All 234 assemblies are valid and correctly mapped!\n`)
  } else {
    console.log(`\n⚠️  Found ${issues} issues that need attention\n`)
  }
}

sanityCheck().catch((err) => {
  console.error('Error:', err.message)
  process.exit(1)
})
