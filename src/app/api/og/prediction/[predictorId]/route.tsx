import { ImageResponse } from 'next/og'
import { getPayload } from 'payload'
import config from '@payload-config'
import { readFileSync } from 'fs'
import { join } from 'path'
import { getStateByCode } from '@/config/states'

export const runtime = 'nodejs'
export const revalidate = 3600

const WIDTH = 1200
const HEIGHT = 630

// Module-level cache — loaded once per server process
const _logoBase64 = `data:image/png;base64,${readFileSync(join(process.cwd(), 'public/indiastats-logo-1024.png')).toString('base64')}`
const _fontRegular = readFileSync(join(process.cwd(), 'public/fonts/NotoSans-Regular.ttf'))
const _fontBold = readFileSync(join(process.cwd(), 'public/fonts/NotoSans-Bold.ttf'))

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ predictorId: string }> },
) {
  try {
    const { predictorId } = await params
    const stateCode = new URL(_request.url).searchParams.get('stateCode') ?? 'TN'
    const stateName = getStateByCode(stateCode)?.name ?? 'India'
    const payload = await getPayload({ config })

    // Fetch predictor (depth:1 to populate image media)
    const predictorResult = await payload.find({
      collection: 'predictors',
      where: { id: { equals: predictorId } },
      limit: 1,
      depth: 1,
    })

    const predictor = predictorResult.docs[0] as any
    if (!predictor) return new Response('Predictor not found', { status: 404 })

    // Fetch predictions for this predictor (latest year)
    const predictionsResult = await payload.find({
      collection: 'election-predictions',
      where: {
        and: [{ predictor: { equals: predictor.id } }, { stateCode: { equals: stateCode } }],
      },
      limit: 5000,
      pagination: false,
      depth: 0,
    })

    const predictions = predictionsResult.docs as Array<{
      electionYear: number
      predictedWinningParty?: string | null
      isCloseContest?: boolean
    }>

    // Get latest year
    const years = Array.from(new Set(predictions.map((p) => p.electionYear))).sort((a, b) => b - a)
    const latestYear = years[0] ?? null
    const latestPredictions = latestYear
      ? predictions.filter((p) => p.electionYear === latestYear)
      : []

    // Tally stats
    let calledSeats = 0
    let tooCloseToCall = 0
    const partyCounts = new Map<string, number>()

    for (const p of latestPredictions) {
      const party =
        typeof p.predictedWinningParty === 'string' ? p.predictedWinningParty.trim() : null
      if (party) {
        calledSeats++
        partyCounts.set(party, (partyCounts.get(party) ?? 0) + 1)
      } else {
        tooCloseToCall++
      }
    }

    const topParties = Array.from(partyCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)

    // Party colour map from state config
    const stateConfig = getStateByCode(stateCode)
    const getColor = (p: string) => stateConfig?.partyColors[p] ?? '#64748b'

    const logoBase64 = _logoBase64
    const fontRegular = _fontRegular
    const fontBold = _fontBold

    // Load predictor image if available
    let predictorImgBase64: string | null = null

    // Prefer uploaded media image over legacy imagePath
    const mediaUrl: string | null =
      predictor.image &&
      typeof predictor.image === 'object' &&
      typeof predictor.image.url === 'string'
        ? predictor.image.url.trim()
        : null

    if (mediaUrl) {
      try {
        if (mediaUrl.startsWith('http://') || mediaUrl.startsWith('https://')) {
          // Azure Blob or remote URL — fetch it
          const res = await fetch(mediaUrl)
          if (res.ok) {
            const buf = Buffer.from(await res.arrayBuffer())
            const ext = mediaUrl.split('.').pop()?.toLowerCase() ?? 'png'
            const mime = ext === 'jpg' || ext === 'jpeg' ? 'image/jpeg' : 'image/png'
            predictorImgBase64 = `data:${mime};base64,${buf.toString('base64')}`
          }
        } else {
          // Local media path (e.g. /media/JVC.png)
          const filePath = join(process.cwd(), 'public', mediaUrl.replace(/^\//, ''))
          const buf = readFileSync(filePath)
          const ext = mediaUrl.split('.').pop()?.toLowerCase() ?? 'png'
          const mime = ext === 'jpg' || ext === 'jpeg' ? 'image/jpeg' : 'image/png'
          predictorImgBase64 = `data:${mime};base64,${buf.toString('base64')}`
        }
      } catch {
        // Image unavailable — skip
      }
    } else {
      const imagePath = typeof predictor.imagePath === 'string' ? predictor.imagePath.trim() : null
      if (imagePath) {
        try {
          const filePath = join(process.cwd(), 'public', imagePath.replace(/^\//, ''))
          const buf = readFileSync(filePath)
          const ext = imagePath.split('.').pop()?.toLowerCase() ?? 'png'
          const mime = ext === 'jpg' || ext === 'jpeg' ? 'image/jpeg' : 'image/png'
          predictorImgBase64 = `data:${mime};base64,${buf.toString('base64')}`
        } catch {
          // Image not on disk — skip
        }
      }
    }

    const predictorName: string = predictor.name ?? 'Predictor'
    const total = latestPredictions.length

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
          backgroundImage: 'radial-gradient(circle at top right, #1e1a2e, #0f172a)',
        }}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '24px 56px',
            borderBottom: '1px solid #334155',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
            {predictorImgBase64 ? (
              <img
                src={predictorImgBase64}
                width={72}
                height={72}
                style={{ borderRadius: '50%', objectFit: 'cover', border: '3px solid #ef4444' }}
              />
            ) : (
              <div
                style={{
                  width: 72,
                  height: 72,
                  borderRadius: '50%',
                  backgroundColor: '#1e293b',
                  border: '3px solid #ef4444',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <span style={{ fontSize: 28, color: '#ef4444', fontWeight: 700 }}>
                  {predictorName.charAt(0)}
                </span>
              </div>
            )}
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontSize: 36, fontWeight: 900, color: '#f8fafc', lineHeight: 1.1 }}>
                {predictorName}
              </span>
              <span
                style={{
                  fontSize: 16,
                  color: '#64748b',
                  marginTop: 4,
                  textTransform: 'uppercase',
                  letterSpacing: '0.1em',
                }}
              >
                {stateName} {latestYear ?? ''} Election Forecast
              </span>
            </div>
          </div>
          <img src={logoBase64} width={160} height={42} style={{ objectFit: 'contain' }} />
        </div>

        {/* Body */}
        <div style={{ display: 'flex', flex: 1, padding: '24px 56px', gap: 28 }}>
          {/* Left — stat cards */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16, width: 280 }}>
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                backgroundColor: 'rgba(239,68,68,0.12)',
                borderRadius: 20,
                padding: '18px 22px',
                border: '1px solid rgba(239,68,68,0.25)',
              }}
            >
              <span
                style={{
                  fontSize: 12,
                  fontWeight: 700,
                  color: '#ef4444',
                  textTransform: 'uppercase',
                  letterSpacing: '0.12em',
                }}
              >
                Seats Called
              </span>
              <span
                style={{
                  fontSize: 52,
                  fontWeight: 900,
                  color: '#f8fafc',
                  lineHeight: 1.1,
                  marginTop: 4,
                }}
              >
                {calledSeats}
              </span>
              <span style={{ fontSize: 13, color: '#64748b', marginTop: 2 }}>out of {total}</span>
            </div>

            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                backgroundColor: 'rgba(30,41,59,0.6)',
                borderRadius: 20,
                padding: '18px 22px',
                border: '1px solid #334155',
              }}
            >
              <span
                style={{
                  fontSize: 12,
                  fontWeight: 700,
                  color: '#94a3b8',
                  textTransform: 'uppercase',
                  letterSpacing: '0.12em',
                }}
              >
                Too Close to Call
              </span>
              <span
                style={{
                  fontSize: 40,
                  fontWeight: 900,
                  color: '#f8fafc',
                  lineHeight: 1.1,
                  marginTop: 4,
                }}
              >
                {tooCloseToCall}
              </span>
            </div>
          </div>

          {/* Right — party tally */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              flex: 1,
              backgroundColor: 'rgba(30,41,59,0.5)',
              borderRadius: 20,
              padding: '20px 24px',
              border: '1px solid #334155',
            }}
          >
            <span
              style={{
                fontSize: 13,
                fontWeight: 700,
                color: '#ef4444',
                textTransform: 'uppercase',
                letterSpacing: '0.12em',
                marginBottom: 18,
              }}
            >
              Party-wise Seat Calls
            </span>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, flex: 1 }}>
              {topParties.map(([party, seats], i) => {
                const barPct = calledSeats > 0 ? (seats / calledSeats) * 100 : 0
                const color = getColor(party)
                return (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <span
                      style={{
                        fontSize: 13,
                        fontWeight: 700,
                        color: '#f8fafc',
                        width: 80,
                        flexShrink: 0,
                      }}
                    >
                      {party}
                    </span>
                    <div
                      style={{
                        flex: 1,
                        height: 28,
                        backgroundColor: 'rgba(255,255,255,0.06)',
                        borderRadius: 8,
                        overflow: 'hidden',
                        display: 'flex',
                      }}
                    >
                      <div
                        style={{
                          width: `${barPct}%`,
                          backgroundColor: color,
                          borderRadius: 8,
                          display: 'flex',
                          alignItems: 'center',
                          paddingLeft: 8,
                        }}
                      />
                    </div>
                    <span
                      style={{
                        fontSize: 20,
                        fontWeight: 800,
                        color: '#f8fafc',
                        width: 44,
                        textAlign: 'right',
                      }}
                    >
                      {seats}
                    </span>
                  </div>
                )
              })}

              {topParties.length === 0 && (
                <span style={{ fontSize: 14, color: '#64748b' }}>No predictions yet</span>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            padding: '16px',
            borderTop: '1px solid #334155',
          }}
        >
          <span style={{ fontSize: 13, color: '#64748b', fontWeight: 500 }}>
            indiastats.org • Election Predictions
          </span>
        </div>
      </div>,
      {
        width: WIDTH,
        height: HEIGHT,
        fonts: [
          { name: 'Noto Sans', data: fontRegular, weight: 400, style: 'normal' },
          { name: 'Noto Sans', data: fontBold, weight: 700, style: 'normal' },
        ],
      },
    )
  } catch (error) {
    console.error('Prediction OG image error:', error)
    return new Response('Error generating image', { status: 500 })
  }
}
