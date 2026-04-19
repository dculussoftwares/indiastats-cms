import { ImageResponse } from 'next/og'
import { getPayload } from 'payload'
import config from '@payload-config'
import { readFileSync } from 'fs'
import { join } from 'path'

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
      depth: 0,
    })

    if (!districtResult.docs[0]) {
      return new Response('District not found', { status: 404 })
    }

    const district = districtResult.docs[0] as any
    const rawName = district.districtName || 'District'

    // Extract English name (remove Tamil part if present in bilingual format)
    const enName = rawName.includes(' / ')
      ? rawName.split(' / ').find((s: string) => !/[\u0B80-\u0BFF]/.test(s))?.trim() || rawName
      : rawName

    const stateCode = district.stateCode || 'TN'

    // Get state name
    const stateResult = await payload.find({
      collection: 'states',
      where: { stateCode: { equals: stateCode } },
      limit: 1,
      depth: 0,
    })
    const rawStateName = (stateResult.docs[0] as any)?.name || 'Tamil Nadu'
    const cleanStateName = rawStateName.includes(' / ')
      ? rawStateName.split(' / ').find((s: string) => !/[\u0B80-\u0BFF]/.test(s.trim()))?.trim() || rawStateName
      : rawStateName

    // Get assemblies for this district to aggregate stats
    const assembliesResult = await payload.find({
      collection: 'assemblies',
      where: { districtName: { equals: district.districtName } },
      limit: 100,
      depth: 0,
      select: { voters: true, noOfBooths: true },
    })

    const assemblies = assembliesResult.docs
    const noOfAssemblies = assemblies.length

    let totalMale = 0
    let totalFemale = 0
    let totalTrans = 0
    let totalVoters = 0
    let totalBooths = 0

    assemblies.forEach((a: any) => {
      if (a.voters) {
        totalMale += Number(a.voters.male) || 0
        totalFemale += Number(a.voters.female) || 0
        totalTrans += Number(a.voters.trans) || 0
        totalVoters += Number(a.voters.total) || 0
      }
      totalBooths += Number(a.noOfBooths) || 0
    })

    // Get Logo
    const logoPath = join(process.cwd(), 'public/indiastats-logo-1024.png')
    const logoBuffer = readFileSync(logoPath)
    const logoBase64 = `data:image/jpeg;base64,${logoBuffer.toString('base64')}`

    // Load fonts
    const fontRegular = readFileSync(join(process.cwd(), 'public/fonts/NotoSans-Regular.ttf'))
    const fontBold = readFileSync(join(process.cwd(), 'public/fonts/NotoSans-Bold.ttf'))

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
              <span style={{ textTransform: 'uppercase' }}>District Profile •</span> {cleanStateName}
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
          {/* Stats Section 1 */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              flex: 1.2,
              backgroundColor: 'rgba(30, 41, 59, 0.5)',
              borderRadius: 24,
              padding: 24,
              border: '1px solid #334155',
              gap: 20,
            }}
          >
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: '#ef4444', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 6 }}>
                Constituencies
              </span>
              <span style={{ fontSize: 44, fontWeight: 800, color: '#f8fafc' }}>
                {noOfAssemblies}
              </span>
              <span style={{ fontSize: 14, color: '#94a3b8', marginTop: 2 }}>
                Total Assembly Segments
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', marginTop: 8 }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: '#10b981', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 6 }}>
                Polling Booths
              </span>
              <span style={{ fontSize: 44, fontWeight: 800, color: '#f8fafc' }}>
                {totalBooths.toLocaleString('en-IN')}
              </span>
              <span style={{ fontSize: 14, color: '#94a3b8', marginTop: 2 }}>
                Total Voting Locations
              </span>
            </div>
          </div>

          {/* Voter Stats Section */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              flex: 1,
              gap: 20,
            }}
          >
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                backgroundColor: 'rgba(30, 41, 59, 0.5)',
                borderRadius: 24,
                padding: '20px 24px',
                border: '1px solid #334155',
              }}
            >
              <span style={{ fontSize: 13, fontWeight: 700, color: '#38bdf8', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8 }}>
                Total Voters
              </span>
              <span style={{ fontSize: 44, fontWeight: 800, color: '#f8fafc' }}>
                {totalVoters.toLocaleString('en-IN')}
              </span>
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
                <span style={{ fontSize: 22, fontWeight: 700, color: '#f8fafc' }}>
                  {totalMale.toLocaleString('en-IN')}
                </span>
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
                <span style={{ fontSize: 22, fontWeight: 700, color: '#f8fafc' }}>
                  {totalFemale.toLocaleString('en-IN')}
                </span>
              </div>
            </div>

            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                flex: 1,
                backgroundColor: 'rgba(239, 68, 68, 0.15)',
                borderRadius: 24,
                padding: '12px 16px',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                justifyContent: 'center',
                alignItems: 'center',
              }}
            >
              <span style={{ fontSize: 16, fontWeight: 700, color: '#ef4444', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                Visit IndiaStats.org
              </span>
              <span style={{ fontSize: 12, color: '#94a3b8', marginTop: 4, textAlign: 'center' }}>
                Explore live election results and historical trends across all constituencies
              </span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            padding: '20px',
            backgroundColor: '#0f172a',
            borderTop: '1px solid #334155',
          }}
        >
          <span style={{ fontSize: 14, color: '#64748b', fontWeight: 500 }}>
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
