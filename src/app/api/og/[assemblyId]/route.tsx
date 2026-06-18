import { ImageResponse } from 'next/og'
import { getPayload } from 'payload'
import config from '@payload-config'
import { getStateByCode } from '@/config/states'
import { readFileSync } from 'fs'
import { join } from 'path'

export const runtime = 'nodejs'
export const revalidate = 86400 // Cache for 24 hours

// OG Image dimensions (Twitter large card)
const WIDTH = 1200
const HEIGHT = 630

// Module-level cache — loaded once per server process
const _logoBase64 = `data:image/png;base64,${readFileSync(join(process.cwd(), 'public/indiastats-logo-1024.png')).toString('base64')}`
const _fontRegular = readFileSync(join(process.cwd(), 'public/fonts/NotoSans-Regular.ttf'))
const _fontBold = readFileSync(join(process.cwd(), 'public/fonts/NotoSans-Bold.ttf'))

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
      depth: 0,
    })

    if (!assemblyResult.docs[0]) {
      return new Response('Assembly not found', { status: 404 })
    }

    const assembly = assemblyResult.docs[0] as any
    const rawName = assembly.name || 'Assembly'
    
    // Extract English name (remove Tamil part if present in bilingual format)
    const enName = rawName.includes(' / ')
      ? rawName.split(' / ').find((s: string) => !/[\u0B80-\u0BFF]/.test(s))?.trim() || rawName
      : rawName

    const stateCode = assembly.stateCode || ''
    const districtName = assembly.districtName || ''
    const cleanDistrictName = districtName.includes(' / ')
      ? districtName.split(' / ').find((s: string) => !/[\u0B80-\u0BFF]/.test(s))?.trim() || districtName
      : districtName

    // Get State configuration (priority: Database > Static Config)
    const stateResult = await payload.find({
      collection: 'states',
      where: { stateCode: { equals: stateCode } },
      limit: 1,
      depth: 0,
    })

    const stateDoc = stateResult.docs[0] as any
    const staticConfig = getStateByCode(stateCode)
    const historyStartYear = staticConfig?.historyStartYear ?? 1977

    // Get election history
    const historyResult = await payload.find({
      collection: 'election-history',
      where: { assemblyId: { equals: assemblyId } },
      sort: '-electionYear',
      limit: 500,
      depth: 0,
    })

    // Calculate party wins
    const partyWins: Record<string, number> = {}

    const historyByYear = new Map<number, any[]>()
    historyResult.docs.forEach((record: any) => {
      const year = record.electionYear
      if (year >= historyStartYear) {
        if (!historyByYear.has(year)) {
          historyByYear.set(year, [])
        }
        historyByYear.get(year)!.push({
          party: record.candidateParty || 'IND',
          votes: record.candidateVotes,
        })
      }
    })

    historyByYear.forEach((candidates) => {
      candidates.sort((a, b) => b.votes - a.votes)
      const winnerParty = candidates[0]?.party || 'IND'
      partyWins[winnerParty] = (partyWins[winnerParty] || 0) + 1
    })

    // Get top winning parties
    const sortedParties = Object.entries(partyWins)
      .sort((a, b) => b[1] - a[1])
      .map(([name, wins]) => ({ name, wins }))

    // Get voter data
    const totalVoters = assembly.voters?.total
      ? Number(assembly.voters.total).toLocaleString('en-IN')
      : 'N/A'
    const maleVoters = assembly.voters?.male
      ? Number(assembly.voters.male).toLocaleString('en-IN')
      : 'N/A'
    const femaleVoters = assembly.voters?.female
      ? Number(assembly.voters.female).toLocaleString('en-IN')
      : 'N/A'
    const booths = assembly.noOfBooths?.toLocaleString('en-IN') || 'N/A'

    const logoBase64 = _logoBase64
    const fontRegular = _fontRegular
    const fontBold = _fontBold

    // Generate the OG image
    return new ImageResponse(
      <div
        style={{
          width: WIDTH,
          height: HEIGHT,
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: '#0f172a',
          color: '#f8fafc',
          fontFamily: 'Noto Sans, sans-serif',
          backgroundImage: 'radial-gradient(circle at top right, #1e293b, #0f172a)',
        }}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '24px 60px',
            borderBottom: '1px solid #334155',
          }}
        >
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              flex: 1,
              marginRight: 20,
            }}
          >
            <span
              style={{
                fontSize: 54,
                fontWeight: 900,
                color: '#f8fafc',
                letterSpacing: '-0.025em',
                lineHeight: 1.1,
              }}
            >
              {enName}
            </span>
            <span
              style={{
                fontSize: 20,
                fontWeight: 500,
                color: '#64748b',
                marginTop: 8,
                letterSpacing: '0.1em',
              }}
            >
              <span style={{ textTransform: 'uppercase' }}>Assembly Constituency •</span> {cleanDistrictName}
            </span>
          </div>
          <img
            src={logoBase64}
            alt="IndiaStats Logo"
            width={180}
            height={48}
            style={{ objectFit: 'contain' }}
          />
        </div>

        {/* Main Content */}
        <div
          style={{
            display: 'flex',
            flex: 1,
            padding: '24px 60px',
            gap: 32,
          }}
        >
          {/* Political Section */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              flex: 1.4,
              backgroundColor: 'rgba(30, 41, 59, 0.5)',
              borderRadius: 24,
              padding: 24,
              border: '1px solid #334155',
            }}
          >
            <span
              style={{
                fontSize: 14,
                fontWeight: 700,
                color: '#ef4444',
                textTransform: 'uppercase',
                letterSpacing: '0.1em',
                marginBottom: 24,
              }}
            >
              {`Election History (Since ${historyStartYear})`}
            </span>

            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 8,
              }}
            >
              {sortedParties.slice(0, 5).map((party, index) => (
                <div
                  key={index}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '8px 12px',
                    backgroundColor: index === 0 ? 'rgba(239, 68, 68, 0.1)' : 'rgba(255, 255, 255, 0.03)',
                    borderRadius: 12,
                    border: index === 0 ? '1px solid rgba(239, 68, 68, 0.2)' : '1px solid transparent',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                    <span
                      style={{
                        fontSize: 20,
                        fontWeight: 700,
                        color: index === 0 ? '#ef4444' : '#f1f5f9',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        maxWidth: 300,
                      }}
                    >
                      {party.name}
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 28, fontWeight: 800, color: index === 0 ? '#ef4444' : '#f8fafc' }}>
                      {party.wins}
                    </span>
                    <span style={{ fontSize: 12, fontWeight: 600, color: '#94a3b8' }}>WINS</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Voter Stats Section */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              flex: 1,
              gap: 12,
            }}
          >
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                backgroundColor: 'rgba(30, 41, 59, 0.5)',
                borderRadius: 24,
                padding: '16px 20px',
                border: '1px solid #334155',
              }}
            >
              <span style={{ fontSize: 13, fontWeight: 700, color: '#38bdf8', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 6 }}>
                Total Voters
              </span>
              <span style={{ fontSize: 40, fontWeight: 800, color: '#f8fafc' }}>{totalVoters}</span>
            </div>

            <div
              style={{
                display: 'flex',
                gap: 16,
              }}
            >
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  flex: 1,
                  backgroundColor: 'rgba(30, 41, 59, 0.5)',
                  borderRadius: 24,
                  padding: 16,
                  border: '1px solid #334155',
                }}
              >
                <span style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', marginBottom: 6 }}>
                  Male
                </span>
                <span style={{ fontSize: 22, fontWeight: 700, color: '#f8fafc' }}>{maleVoters}</span>
              </div>
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  flex: 1,
                  backgroundColor: 'rgba(30, 41, 59, 0.5)',
                  borderRadius: 24,
                  padding: 16,
                  border: '1px solid #334155',
                }}
              >
                <span style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', marginBottom: 6 }}>
                  Female
                </span>
                <span style={{ fontSize: 22, fontWeight: 700, color: '#f8fafc' }}>{femaleVoters}</span>
              </div>
            </div>

            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                backgroundColor: 'rgba(30, 41, 59, 0.5)',
                borderRadius: 24,
                padding: '12px 16px',
                border: '1px solid #334155',
              }}
            >
              <span style={{ fontSize: 12, fontWeight: 700, color: '#10b981', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 4 }}>
                Polling Booths
              </span>
              <span style={{ fontSize: 24, fontWeight: 800, color: '#f8fafc' }}>{booths}</span>
            </div>

            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                backgroundColor: 'rgba(239, 68, 68, 0.15)',
                borderRadius: 24,
                padding: '12px 16px',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <span style={{ fontSize: 13, fontWeight: 700, color: '#ef4444', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Visit IndiaStats.org
              </span>
              <span style={{ fontSize: 10, color: '#94a3b8', marginTop: 2, textAlign: 'center' }}>
                For detailed maps and trends
              </span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            padding: '16px',
            backgroundColor: '#0f172a',
            borderTop: '1px solid #334155',
          }}
        >
          <span style={{ fontSize: 12, color: '#64748b', fontWeight: 500 }}>
            Source: Election Commission of India • Data visualized by IndiaStats.org
          </span>
        </div>
      </div>,
      {
        width: WIDTH,
        height: HEIGHT,
        fonts: [
          {
            name: 'Noto Sans',
            data: fontRegular,
            weight: 400,
            style: 'normal',
          },
          {
            name: 'Noto Sans',
            data: fontBold,
            weight: 700,
            style: 'normal',
          },
        ],
      },
    )
  } catch (error) {
    console.error('OG Image generation error:', error)
    return new Response('Error generating image', { status: 500 })
  }
}
