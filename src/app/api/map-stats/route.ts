import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'

export async function GET(request: NextRequest) {
    try {
        const searchParams = request.nextUrl.searchParams
        const stateCode = searchParams.get('stateCode') || 'TN' // Default to TN

        const payload = await getPayload({ config })

        // Get all assemblies for this state
        const assembliesResult = await payload.find({
            collection: 'assemblies',
            where: { stateCode: { equals: stateCode } },
            limit: 300,
        })

        const assemblies = assembliesResult.docs

        // Calculate stats
        let totalMale = 0
        let totalFemale = 0
        let totalTrans = 0
        let totalVoters = 0
        let reservedSeats = 0
        let generalSeats = 0
        const districts = new Set<string>()

        assemblies.forEach((assembly: any) => {
            // Get district name for unique count
            if (assembly.districtName) {
                districts.add(assembly.districtName)
            }

            // Aggregate voter data
            if (assembly.voters) {
                totalMale += Number(assembly.voters.male) || 0
                totalFemale += Number(assembly.voters.female) || 0
                totalTrans += Number(assembly.voters.trans) || 0
                totalVoters += Number(assembly.voters.total) || 0

                // Count reserved vs general seats
                if (assembly.voters.isReservedAc) {
                    reservedSeats++
                } else {
                    generalSeats++
                }
            }
        })

        // Calculate quick stats
        let largestConstituency = { name: '', voters: 0, assemblyId: '' }
        let smallestConstituency = { name: '', voters: Infinity, assemblyId: '' }
        let highestFemaleRatio = { name: '', ratio: 0, assemblyId: '' }
        let mostBooths = { name: '', booths: 0, assemblyId: '' }

        assemblies.forEach((assembly: any) => {
            const total = Number(assembly.voters?.total) || 0
            const female = Number(assembly.voters?.female) || 0
            const booths = Number(assembly.noOfBooths) || 0
            const name = assembly.name || ''
            const assemblyId = assembly.assemblyId || ''

            if (total > largestConstituency.voters) {
                largestConstituency = { name, voters: total, assemblyId }
            }
            if (total > 0 && total < smallestConstituency.voters) {
                smallestConstituency = { name, voters: total, assemblyId }
            }
            if (total > 0 && (female / total) > highestFemaleRatio.ratio) {
                highestFemaleRatio = { name, ratio: female / total, assemblyId }
            }
            if (booths > mostBooths.booths) {
                mostBooths = { name, booths, assemblyId }
            }
        })

        return NextResponse.json({
            totalAssemblies: assemblies.length,
            totalDistricts: districts.size,
            reservedSeats,
            generalSeats,
            voters: {
                male: totalMale,
                female: totalFemale,
                trans: totalTrans,
                total: totalVoters,
            },
            quickStats: {
                largestConstituency,
                smallestConstituency: smallestConstituency.voters === Infinity ? null : smallestConstituency,
                highestFemaleRatio: {
                    ...highestFemaleRatio,
                    ratio: Math.round(highestFemaleRatio.ratio * 100),
                },
                mostBooths,
            },
        }, {
            headers: {
                'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
            },
        })
    } catch (error) {
        console.error('Error fetching map stats:', error)
        return NextResponse.json(
            { error: 'Failed to fetch map stats' },
            { status: 500 }
        )
    }
}
