import { ImageResponse } from 'next/og'
import { getPayload } from 'payload'
import config from '@payload-config'

export const runtime = 'nodejs'
export const revalidate = 86400 // Cache for 24 hours

// OG Image dimensions (Twitter large card)
const WIDTH = 1200
const HEIGHT = 630

export async function GET(
  request: Request,
  { params }: { params: Promise<{ stateSlug: string }> },
) {
  try {
    const { stateSlug } = await params
    const payload = await getPayload({ config })

    // Get state data
    const stateResult = await payload.find({
      collection: 'states',
      where: { slug: { equals: stateSlug } },
      limit: 1,
    })

    if (!stateResult.docs[0]) {
      return new Response('State not found', { status: 404 })
    }

    const state = stateResult.docs[0] as any
    const stateName = state.name || 'State'
    const stateCode = state.stateCode

    // Get aggregate stats filtered by state
    const [assembliesCount, districtsCount, boothsCount, assembliesData] =
      await Promise.all([
        payload.count({
          collection: 'assemblies',
          where: { stateCode: { equals: stateCode } },
        }),
        payload.count({
          collection: 'districts',
          where: { stateCode: { equals: stateCode } },
        }),
        payload.count({
          collection: 'booths',
          where: { stateCode: { equals: stateCode } },
        }),
        payload.find({
          collection: 'assemblies',
          where: { stateCode: { equals: stateCode } },
          limit: 1000,
          select: { voters: true },
        }),
      ])

    // Calculate total voters
    let totalVoters = 0
    assembliesData.docs.forEach((a: any) => {
      if (a.voters?.total) {
        totalVoters += Number(a.voters.total)
      }
    })

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
            borderBottom: '4px solid #10b981', // Green for state
          }}
        >
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            <span style={{ fontSize: 56, fontWeight: 700, color: '#111827' }}>
              {stateName} Dashboard
            </span>
            <span style={{ fontSize: 24, color: '#6b7280', marginTop: 4 }}>
              Comprehensive Electoral & Demographic Data
            </span>
          </div>
        </div>

        {/* Main Content */}
        <div
          style={{
            display: 'flex',
            flex: 1,
            padding: '32px',
            gap: 24,
          }}
        >
          {/* Stats Grid */}
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              flex: 1,
              gap: 24,
            }}
          >
            {[
              { label: 'Districts', value: districtsCount.totalDocs, color: '#3b82f6' },
              { label: 'Constituencies', value: assembliesCount.totalDocs, color: '#dc2626' },
              { label: 'Polling Booths', value: boothsCount.totalDocs, color: '#8b5cf6' },
              {
                label: 'Total Voters',
                value: totalVoters.toLocaleString('en-IN'),
                color: '#111827',
                fullWidth: true,
              },
            ].map((stat, i) => (
              <div
                key={i}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  width: stat.fullWidth ? '100%' : 'calc(33.33% - 16px)',
                  backgroundColor: '#f9fafb',
                  padding: 24,
                  borderRadius: 16,
                  border: '1px solid #e5e7eb',
                }}
              >
                <span style={{ fontSize: 18, color: '#6b7280', textTransform: 'uppercase' }}>
                  {stat.label}
                </span>
                <span
                  style={{
                    fontSize: stat.fullWidth ? 56 : 42,
                    fontWeight: 700,
                    color: stat.color,
                    marginTop: 8,
                  }}
                >
                  {stat.value}
                </span>
              </div>
            ))}
          </div>

          {/* Sidebar */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              width: 300,
              gap: 24,
            }}
          >
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                backgroundColor: '#1f2937',
                borderRadius: 16,
                padding: 24,
                color: 'white',
              }}
            >
              <span style={{ fontSize: 16, color: '#9ca3af', textTransform: 'uppercase' }}>
                Platform
              </span>
              <span style={{ fontSize: 24, fontWeight: 700, marginTop: 8 }}>IndiaStats.org</span>
              <span style={{ fontSize: 16, color: '#d1d5db', marginTop: 12 }}>
                Real-time election insights, MLA history, and caste demographics.
              </span>
            </div>

            <div
              style={{
                display: 'flex',
                flex: 1,
                alignItems: 'flex-end',
                justifyContent: 'center',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div
                  style={{
                    width: 40,
                    height: 40,
                    backgroundColor: '#dc2626',
                    borderRadius: 8,
                  }}
                />
                <span style={{ fontSize: 24, fontWeight: 700, color: '#111827' }}>IndiaStats</span>
              </div>
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
