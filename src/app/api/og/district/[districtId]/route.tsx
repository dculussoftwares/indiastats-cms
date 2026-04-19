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
  { params }: { params: Promise<{ districtId: string }> },
) {
  try {
    const { districtId } = await params
    const payload = await getPayload({ config })

    // Get district data
    const districtResult = await payload.find({
      collection: 'districts',
      where: { districtId: { equals: districtId } },
      limit: 1,
    })

    if (!districtResult.docs[0]) {
      return new Response('District not found', { status: 404 })
    }

    const district = districtResult.docs[0] as any
    const districtName = district.districtName?.split(' / ')[1] || district.districtName || 'District'
    const stateCode = district.stateCode || 'TN'

    // Get state name
    const stateResult = await payload.find({
      collection: 'states',
      where: { stateCode: { equals: stateCode } },
      limit: 1,
    })
    const stateName = (stateResult.docs[0] as any)?.name || 'Tamil Nadu'

    // Get assemblies for this district to aggregate stats
    const assembliesResult = await payload.find({
      collection: 'assemblies',
      where: { districtName: { equals: district.districtName } },
      limit: 100,
    })

    const assemblies = assembliesResult.docs
    const noOfAssemblies = assemblies.length

    let totalMale = 0
    let totalFemale = 0
    let totalTrans = 0
    let totalVoters = 0

    assemblies.forEach((a: any) => {
      if (a.voters) {
        totalMale += Number(a.voters.male) || 0
        totalFemale += Number(a.voters.female) || 0
        totalTrans += Number(a.voters.trans) || 0
        totalVoters += Number(a.voters.total) || 0
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
            borderBottom: '4px solid #2563eb', // Blue for districts
          }}
        >
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            <span style={{ fontSize: 48, fontWeight: 700, color: '#111827' }}>
              {districtName} District
            </span>
            <span style={{ fontSize: 24, color: '#6b7280', marginTop: 4 }}>
              {stateName} Election Profile
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
          {/* Stats Section */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              flex: 1,
              backgroundColor: '#f9fafb',
              borderRadius: 16,
              padding: 24,
              gap: 20,
            }}
          >
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontSize: 18, color: '#6b7280', textTransform: 'uppercase' }}>
                Total Assembly Constituencies
              </span>
              <span style={{ fontSize: 48, fontWeight: 700, color: '#111827' }}>
                {noOfAssemblies}
              </span>
            </div>

            <div style={{ display: 'flex', gap: 24 }}>
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  flex: 1,
                  backgroundColor: '#ffffff',
                  padding: 16,
                  borderRadius: 12,
                  border: '1px solid #e5e7eb',
                }}
              >
                <span style={{ fontSize: 16, color: '#6b7280' }}>Total Voters</span>
                <span style={{ fontSize: 32, fontWeight: 700, color: '#111827' }}>
                  {totalVoters.toLocaleString('en-IN')}
                </span>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 16 }}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  backgroundColor: '#eff6ff',
                  padding: '8px 16px',
                  borderRadius: 20,
                }}
              >
                <span style={{ fontSize: 16, color: '#3b82f6' }}>Male:</span>
                <span style={{ fontSize: 18, fontWeight: 700, color: '#1e40af' }}>
                  {totalMale.toLocaleString('en-IN')}
                </span>
              </div>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  backgroundColor: '#fdf2f8',
                  padding: '8px 16px',
                  borderRadius: 20,
                }}
              >
                <span style={{ fontSize: 16, color: '#db2777' }}>Female:</span>
                <span style={{ fontSize: 18, fontWeight: 700, color: '#9d174d' }}>
                  {totalFemale.toLocaleString('en-IN')}
                </span>
              </div>
            </div>
          </div>

          {/* Sidebar / Branding Section */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              width: 320,
              gap: 16,
            }}
          >
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                backgroundColor: '#1f2937',
                borderRadius: 12,
                padding: 20,
                color: 'white',
              }}
            >
              <span style={{ fontSize: 14, color: '#9ca3af', textTransform: 'uppercase' }}>
                Election Data Insights
              </span>
              <span style={{ fontSize: 18, marginTop: 8 }}>
                Explore booth-level demographics and political history for all constituencies in {districtName}.
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
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <span style={{ fontSize: 24, fontWeight: 700, color: '#dc2626' }}>IndiaStats.org</span>
                <span style={{ fontSize: 14, color: '#6b7280' }}>Electoral Transparency Portal</span>
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
