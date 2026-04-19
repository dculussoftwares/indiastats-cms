import { ImageResponse } from 'next/og'
import { getPayload } from 'payload'
import config from '@payload-config'
import { readFileSync } from 'fs'
import { join } from 'path'
import { getStateBySlug } from '@/config/states'

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

    const stateDoc = stateResult.docs[0] as any
    const staticConfig = getStateBySlug(stateSlug)

    if (!stateDoc && !staticConfig) {
      return new Response('State not found', { status: 404 })
    }

    const rawName = stateDoc?.name || staticConfig?.name || 'State'
    
    // Extract English name (remove Tamil part if present in bilingual format)
    const enName = rawName.includes(' / ')
      ? rawName.split(' / ').find((s: string) => !/[\u0B80-\u0BFF]/.test(s))?.trim() || rawName
      : rawName

    const stateCode = stateDoc?.stateCode || staticConfig?.code || 'TN'

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
          select: { voters: true, noOfBooths: true },
        }),
      ])

    // Calculate aggregate stats
    let totalVoters = 0
    let totalMale = 0
    let totalFemale = 0
    let totalBooths = 0

    assembliesData.docs.forEach((a: any) => {
      if (a.voters?.total) {
        totalVoters += Number(a.voters.total)
      }
      if (a.voters?.male) {
        totalMale += Number(a.voters.male)
      }
      if (a.voters?.female) {
        totalFemale += Number(a.voters.female)
      }
      if (a.noOfBooths) {
        totalBooths += Number(a.noOfBooths)
      }
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
                textTransform: 'uppercase',
                letterSpacing: '0.1em',
              }}
            >
              State Dashboard • Comprehensive Electoral Data
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
          {/* Stats Grid */}
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              flex: 1.2,
              gap: 16,
            }}
          >
            {[
              { label: 'Districts', value: districtsCount.totalDocs, color: '#3b82f6' },
              { label: 'Constituencies', value: assembliesCount.totalDocs, color: '#ef4444' },
              { label: 'Polling Booths', value: totalBooths.toLocaleString('en-IN'), color: '#10b981' },
            ].map((stat, i) => (
              <div
                key={i}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  width: 'calc(50% - 8px)',
                  backgroundColor: 'rgba(30, 41, 59, 0.5)',
                  padding: '20px',
                  borderRadius: 24,
                  border: '1px solid #334155',
                }}
              >
                <span style={{ fontSize: 13, fontWeight: 700, color: stat.color, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                  {stat.label}
                </span>
                <span
                  style={{
                    fontSize: 40,
                    fontWeight: 800,
                    color: '#f8fafc',
                    marginTop: 6,
                  }}
                >
                  {stat.value}
                </span>
              </div>
            ))}

            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                width: 'calc(50% - 8px)',
                backgroundColor: 'rgba(239, 68, 68, 0.15)',
                padding: '16px',
                borderRadius: 24,
                border: '1px solid rgba(239, 68, 68, 0.3)',
                justifyContent: 'center',
                alignItems: 'center',
              }}
            >
              <span style={{ fontSize: 16, color: '#ef4444', fontWeight: 700, textAlign: 'center', textTransform: 'uppercase' }}>
                Visit IndiaStats.org
              </span>
              <span style={{ fontSize: 12, color: '#94a3b8', marginTop: 4, textAlign: 'center' }}>
                For live results & trends
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
                For live results & trends
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
