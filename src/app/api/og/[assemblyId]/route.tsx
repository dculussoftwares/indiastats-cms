import { ImageResponse } from 'next/og'
import { getPayload } from 'payload'
import config from '@payload-config'
import { getStateByCode } from '@/config/states'
import { identifyBloc } from '@/utilities/blocs'

export const runtime = 'nodejs'
export const revalidate = 86400 // Cache for 24 hours

// OG Image dimensions (Twitter large card)
const WIDTH = 1200
const HEIGHT = 630

export async function GET(
  request: Request,
  { params }: { params: Promise<{ assemblyId: string }> },
) {
  try {
    const { assemblyId } = await params
    const payload = await getPayload({ config })

    // Get assembly data
    const assemblyResult = await payload.find({
      collection: 'assemblies',
      where: { assemblyId: { equals: assemblyId } },
      limit: 1,
    })

    if (!assemblyResult.docs[0]) {
      return new Response('Assembly not found', { status: 404 })
    }

    const assembly = assemblyResult.docs[0] as any
    const assemblyName = assembly.name?.split(' / ')[1] || assembly.name || 'Assembly'
    const stateCode = assembly.stateCode || 'TN'

    // Get State configuration (priority: Database > Static Config)
    const stateResult = await payload.find({
      collection: 'states',
      where: { stateCode: { equals: stateCode } },
      limit: 1,
    })

    const stateDoc = stateResult.docs[0] as any
    const staticConfig = getStateByCode(stateCode)

    // Bloc definitions (e.g., DMK Bloc, AIADMK Bloc)
    const blocConfigs = stateDoc?.blocs || staticConfig?.blocs || []

    // Get all alliances for this state to map historical winners to blocs
    const alliancesResult = await payload.find({
      collection: 'alliances',
      where: { stateCode: { equals: stateCode } },
      limit: 1000,
    })

    // Group alliances by year for faster lookup
    const allianceMap: Record<number, any[]> = {}
    alliancesResult.docs.forEach((a: any) => {
      if (!allianceMap[a.electionYear]) allianceMap[a.electionYear] = []
      allianceMap[a.electionYear].push(a)
    })

    // Get election history
    const historyResult = await payload.find({
      collection: 'election-history',
      where: { assemblyId: { equals: assemblyId } },
      sort: '-electionYear',
      limit: 500,
    })

    // Calculate party wins and bloc wins
    const partyWins: Record<string, number> = {}
    let dmkBlocWins = 0
    let aiadmkBlocWins = 0

    const historyByYear = new Map<number, any[]>()
    historyResult.docs.forEach((record: any) => {
      const year = record.electionYear
      if (year >= 1977) {
        if (!historyByYear.has(year)) {
          historyByYear.set(year, [])
        }
        historyByYear.get(year)!.push({
          party: record.candidateParty || 'IND',
          votes: record.candidateVotes,
        })
      }
    })

    historyByYear.forEach((candidates, year) => {
      candidates.sort((a, b) => b.votes - a.votes)
      const winnerParty = candidates[0]?.party || 'IND'
      partyWins[winnerParty] = (partyWins[winnerParty] || 0) + 1

      const blocType = identifyBloc(winnerParty, year, stateCode, allianceMap, stateDoc)
      if (blocType === 'dmk') {
        dmkBlocWins++
      } else if (blocType === 'aiadmk') {
        aiadmkBlocWins++
      }
    })

    // Get top 2 parties
    const sortedParties = Object.entries(partyWins)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 2)

    const party1 = sortedParties[0]
      ? { name: sortedParties[0][0], wins: sortedParties[0][1] }
      : null
    const party2 = sortedParties[1]
      ? { name: sortedParties[1][0], wins: sortedParties[1][1] }
      : null

    // Get voter data
    const totalVoters = assembly.voters?.total
      ? Number(assembly.voters.total).toLocaleString('en-IN')
      : 'N/A'

    // Generate the OG image
    return new ImageResponse(
      <div
        style={{
          width: WIDTH,
          height: HEIGHT,
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: '#ffffff',
          fontFamily: 'system-ui, sans-serif',
        }}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            padding: '24px 32px',
            borderBottom: '4px solid #dc2626',
          }}
        >
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            <span style={{ fontSize: 48, fontWeight: 700, color: '#111827' }}>
              {assemblyName} Assembly
            </span>
            <span style={{ fontSize: 24, color: '#6b7280', marginTop: 4 }}>
              {assembly.districtName} District, Tamil Nadu
            </span>
          </div>
        </div>

        {/* Main Content */}
        <div
          style={{
            display: 'flex',
            flex: 1,
            padding: '24px 32px',
            gap: 24,
          }}
        >
          {/* Political Section */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              flex: 1,
              backgroundColor: '#1f2937',
              borderRadius: 16,
              padding: 24,
            }}
          >
            <span
              style={{
                fontSize: 18,
                color: '#9ca3af',
                textTransform: 'uppercase',
                letterSpacing: 2,
                textAlign: 'center',
                marginBottom: 20,
              }}
            >
              🏆 MOST WINNING PARTIES (1977-2021)
            </span>

            <div
              style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                gap: 40,
              }}
            >
              {party1 && (
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                  }}
                >
                  <span style={{ fontSize: 72, fontWeight: 700, color: '#ef4444' }}>
                    {party1.wins}
                  </span>
                  <span style={{ fontSize: 24, fontWeight: 600, color: 'white' }}>
                    {party1.name}
                  </span>
                </div>
              )}

              <span style={{ fontSize: 28, fontWeight: 700, color: '#6b7280' }}>VS</span>

              {party2 && (
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                  }}
                >
                  <span style={{ fontSize: 72, fontWeight: 700, color: '#9ca3af' }}>
                    {party2.wins}
                  </span>
                  <span style={{ fontSize: 24, fontWeight: 600, color: '#9ca3af' }}>
                    {party2.name}
                  </span>
                </div>
              )}
            </div>

            {/* Bloc Wins */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'center',
                gap: 32,
                marginTop: 24,
                paddingTop: 20,
                borderTop: '1px solid #374151',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  backgroundColor: '#7f1d1d',
                  padding: '8px 16px',
                  borderRadius: 20,
                }}
              >
                <span style={{ fontSize: 18, color: '#fca5a5' }}>DMK Bloc</span>
                <span style={{ fontSize: 24, fontWeight: 700, color: 'white' }}>{dmkBlocWins}</span>
              </div>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  backgroundColor: '#14532d',
                  padding: '8px 16px',
                  borderRadius: 20,
                }}
              >
                <span style={{ fontSize: 18, color: '#86efac' }}>AIADMK Bloc</span>
                <span style={{ fontSize: 24, fontWeight: 700, color: 'white' }}>
                  {aiadmkBlocWins}
                </span>
              </div>
            </div>
          </div>

          {/* Stats Section */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              width: 280,
              gap: 16,
            }}
          >
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                backgroundColor: '#f9fafb',
                borderRadius: 12,
                padding: 20,
              }}
            >
              <span style={{ fontSize: 16, color: '#6b7280', textTransform: 'uppercase' }}>
                Total Voters
              </span>
              <span style={{ fontSize: 36, fontWeight: 700, color: '#111827' }}>{totalVoters}</span>
            </div>

            <div
              style={{
                display: 'flex',
                flex: 1,
                alignItems: 'flex-end',
                justifyContent: 'center',
              }}
            >
              <span style={{ fontSize: 20, color: '#9ca3af' }}>IndiaStats.org</span>
            </div>
          </div>
        </div>
      </div>,
      {
        width: WIDTH,
        height: HEIGHT,
      },
    )
  } catch (error) {
    console.error('OG Image generation error:', error)
    return new Response('Error generating image', { status: 500 })
  }
}
