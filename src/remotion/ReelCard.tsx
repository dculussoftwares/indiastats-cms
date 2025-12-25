import React from 'react'
import {
  AbsoluteFill,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
  Img,
  staticFile,
} from 'remotion'

interface ReelCardProps {
  assemblyName: string
  districtName: string
  isReserved: boolean
  party1: { name: string; wins: number; leaderImage: string }
  party2: { name: string; wins: number; leaderImage: string }
  dmkBlocWins: number
  aiadmkBlocWins: number
  dmkBlocBreakdown: string
  aiadmkBlocBreakdown: string
  topCastes: { name: string; percentage: number }[]
  totalVoters: string
  maleVoters: string
  femaleVoters: string
  voterGrowth: number
}

// Google Fonts URL for Inter (similar to Geist Sans)
const fontFamily = 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'

export const ReelCard: React.FC<ReelCardProps> = ({
  assemblyName,
  districtName,
  isReserved,
  party1,
  party2,
  dmkBlocWins,
  aiadmkBlocWins,
  dmkBlocBreakdown,
  aiadmkBlocBreakdown,
  topCastes,
  totalVoters,
  maleVoters,
  femaleVoters,
  voterGrowth,
}) => {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()

  // Animation timings (in frames)
  const PARTIES_START = 30 // 1 second
  const BLOCS_START = 90 // 3 seconds
  const DEMOGRAPHICS_START = 150 // 5 seconds
  const VOTERS_START = 195 // 6.5 seconds

  // Spring animations
  const headerOpacity = spring({ frame, fps, from: 0, to: 1, durationInFrames: 20 })
  const headerSlide = spring({ frame, fps, from: -50, to: 0, durationInFrames: 25 })

  const partiesScale = spring({
    frame: frame - PARTIES_START,
    fps,
    from: 0.5,
    to: 1,
    durationInFrames: 25,
  })
  const partiesOpacity = interpolate(frame, [PARTIES_START, PARTIES_START + 15], [0, 1], {
    extrapolateRight: 'clamp',
    extrapolateLeft: 'clamp',
  })

  const blocsSlide = spring({
    frame: frame - BLOCS_START,
    fps,
    from: 100,
    to: 0,
    durationInFrames: 20,
  })
  const blocsOpacity = interpolate(frame, [BLOCS_START, BLOCS_START + 15], [0, 1], {
    extrapolateRight: 'clamp',
    extrapolateLeft: 'clamp',
  })

  const demographicsOpacity = interpolate(
    frame,
    [DEMOGRAPHICS_START, DEMOGRAPHICS_START + 20],
    [0, 1],
    { extrapolateRight: 'clamp', extrapolateLeft: 'clamp' },
  )

  const votersOpacity = interpolate(frame, [VOTERS_START, VOTERS_START + 20], [0, 1], {
    extrapolateRight: 'clamp',
    extrapolateLeft: 'clamp',
  })
  const votersSlide = spring({
    frame: frame - VOTERS_START,
    fps,
    from: 50,
    to: 0,
    durationInFrames: 20,
  })

  // Animated counter for party wins
  const animatedWins1 = Math.round(
    interpolate(frame, [PARTIES_START + 15, PARTIES_START + 45], [0, party1.wins], {
      extrapolateRight: 'clamp',
      extrapolateLeft: 'clamp',
    }),
  )
  const animatedWins2 = Math.round(
    interpolate(frame, [PARTIES_START + 15, PARTIES_START + 45], [0, party2.wins], {
      extrapolateRight: 'clamp',
      extrapolateLeft: 'clamp',
    }),
  )

  const winDiff = party1.wins - party2.wins

  // Get leader image path
  const getLeaderImagePath = (partyName: string): string | null => {
    if (partyName === 'ADMK' || partyName === 'AIADMK') return staticFile('images/EPS.jpg')
    if (partyName === 'DMK') return staticFile('images/Stalin.png')
    if (partyName === 'INC' || partyName === 'CONG') return staticFile('images/karkae.jpg')
    if (partyName === 'BJP') return staticFile('images/modi.png')
    if (partyName === 'PMK') return staticFile('images/PMK.jpg')
    return null
  }

  const leader1Image = getLeaderImagePath(party1.name)
  const leader2Image = getLeaderImagePath(party2.name)

  return (
    <AbsoluteFill
      style={{
        backgroundColor: '#ffffff',
        fontFamily,
      }}
    >
      {/* Google Font Import */}
      <style>
        {`@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap');`}
      </style>

      {/* Red stripe at top */}
      <div style={{ height: 12, backgroundColor: '#dc2626', width: '100%' }} />

      {/* Header with Logo */}
      <div
        style={{
          padding: '40px 48px',
          borderBottom: '2px solid #e5e7eb',
          opacity: headerOpacity,
          transform: `translateY(${headerSlide}px)`,
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          {/* Logo */}
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8 }}>
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: 4 }}>
              <div style={{ width: 10, height: 16, backgroundColor: '#dc2626', borderRadius: 2 }} />
              <div style={{ width: 10, height: 28, backgroundColor: '#dc2626', borderRadius: 2 }} />
              <div style={{ width: 10, height: 40, backgroundColor: '#dc2626', borderRadius: 2 }} />
            </div>
            <span style={{ fontSize: 42, fontWeight: 700, color: '#111827', marginLeft: 8 }}>
              IndiaStats
            </span>
            <span style={{ fontSize: 42, fontWeight: 400, color: '#6b7280' }}>.org</span>
          </div>
          {/* Badge */}
          <div
            style={{
              backgroundColor: isReserved ? '#dc2626' : '#f3f4f6',
              color: isReserved ? '#ffffff' : '#374151',
              padding: '12px 24px',
              borderRadius: 12,
              fontSize: 24,
              fontWeight: 600,
            }}
          >
            {isReserved ? 'RESERVED' : 'GENERAL'}
          </div>
        </div>
      </div>

      {/* Assembly Name with accent bar */}
      <div
        style={{
          padding: '48px',
          opacity: headerOpacity,
          transform: `translateY(${headerSlide}px)`,
        }}
      >
        <div style={{ borderLeft: '8px solid #dc2626', paddingLeft: 24 }}>
          <h1 style={{ fontSize: 64, fontWeight: 700, color: '#111827', margin: 0 }}>
            {assemblyName}
          </h1>
          <p style={{ fontSize: 32, color: '#6b7280', margin: '8px 0 0 0' }}>
            {districtName}, Tamil Nadu
          </p>
        </div>
      </div>

      {/* Most Winning Parties Section */}
      <div
        style={{
          margin: '0 48px',
          backgroundColor: '#1f2937',
          borderRadius: 24,
          padding: '40px',
          opacity: partiesOpacity,
          transform: `scale(${partiesScale})`,
        }}
      >
        <p
          style={{
            fontSize: 28,
            color: '#9ca3af',
            textTransform: 'uppercase',
            letterSpacing: 2,
            textAlign: 'center',
            margin: '0 0 32px 0',
          }}
        >
          🏆 MOST WINNING PARTIES (1977-2021)
        </p>

        {/* Party Face-Off */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 40,
          }}
        >
          {/* Party 1 */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1 }}>
            <div
              style={{
                width: 160,
                height: 160,
                borderRadius: 80,
                border: '6px solid #ef4444',
                backgroundColor: '#374151',
                overflow: 'hidden',
                marginBottom: 16,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {leader1Image ? (
                <Img src={leader1Image} style={{ width: 160, height: 160, objectFit: 'cover' }} />
              ) : (
                <span style={{ fontSize: 64, fontWeight: 700, color: '#ef4444' }}>
                  {party1.name.charAt(0)}
                </span>
              )}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <span style={{ fontSize: 36, fontWeight: 600, color: 'white' }}>{party1.name}</span>
            </div>
            <p
              style={{
                fontSize: 80,
                fontWeight: 700,
                color: '#ef4444',
                margin: 0,
                lineHeight: 1,
              }}
            >
              {animatedWins1}
            </p>
            <p style={{ fontSize: 28, color: '#9ca3af', margin: 0 }}>wins</p>
          </div>

          {/* VS Badge */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <div
              style={{
                width: 80,
                height: 80,
                borderRadius: 40,
                backgroundColor: '#374151',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <span style={{ fontSize: 28, fontWeight: 700, color: 'white' }}>VS</span>
            </div>
            {winDiff > 0 && (
              <span style={{ fontSize: 24, color: '#ef4444', marginTop: 8, fontWeight: 600 }}>
                +{winDiff}
              </span>
            )}
          </div>

          {/* Party 2 */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1 }}>
            <div
              style={{
                width: 160,
                height: 160,
                borderRadius: 80,
                border: '6px solid #9ca3af',
                backgroundColor: '#374151',
                overflow: 'hidden',
                marginBottom: 16,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {leader2Image ? (
                <Img src={leader2Image} style={{ width: 160, height: 160, objectFit: 'cover' }} />
              ) : (
                <span style={{ fontSize: 64, fontWeight: 700, color: '#9ca3af' }}>
                  {party2.name.charAt(0)}
                </span>
              )}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <span style={{ fontSize: 36, fontWeight: 600, color: '#9ca3af' }}>{party2.name}</span>
            </div>
            <p
              style={{
                fontSize: 80,
                fontWeight: 700,
                color: '#9ca3af',
                margin: 0,
                lineHeight: 1,
              }}
            >
              {animatedWins2}
            </p>
            <p style={{ fontSize: 28, color: '#9ca3af', margin: 0 }}>wins</p>
          </div>
        </div>

        {/* Alliance Blocs */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            gap: 24,
            marginTop: 40,
            paddingTop: 32,
            borderTop: '2px solid #374151',
            opacity: blocsOpacity,
            transform: `translateY(${blocsSlide}px)`,
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                backgroundColor: '#7f1d1d',
                padding: '16px 28px',
                borderRadius: 32,
                marginBottom: 8,
              }}
            >
              <span
                style={{
                  width: 16,
                  height: 16,
                  borderRadius: 8,
                  backgroundColor: '#ef4444',
                  display: 'inline-block',
                }}
              />
              <span style={{ fontSize: 28, color: '#fca5a5' }}>DMK Bloc</span>
              <span style={{ fontSize: 32, fontWeight: 700, color: 'white' }}>{dmkBlocWins}</span>
            </div>
            <span style={{ fontSize: 20, color: '#9ca3af', maxWidth: 240, textAlign: 'center' }}>
              {dmkBlocBreakdown}
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                backgroundColor: '#14532d',
                padding: '16px 28px',
                borderRadius: 32,
                marginBottom: 8,
              }}
            >
              <span
                style={{
                  width: 16,
                  height: 16,
                  borderRadius: 8,
                  backgroundColor: '#22c55e',
                  display: 'inline-block',
                }}
              />
              <span style={{ fontSize: 28, color: '#86efac' }}>AIADMK Bloc</span>
              <span style={{ fontSize: 32, fontWeight: 700, color: 'white' }}>
                {aiadmkBlocWins}
              </span>
            </div>
            <span style={{ fontSize: 20, color: '#9ca3af', maxWidth: 240, textAlign: 'center' }}>
              {aiadmkBlocBreakdown}
            </span>
          </div>
        </div>
      </div>

      {/* Key Demographics */}
      <div
        style={{
          margin: '40px 48px',
          backgroundColor: '#f9fafb',
          borderRadius: 24,
          padding: '40px',
          opacity: demographicsOpacity,
        }}
      >
        <p
          style={{
            fontSize: 28,
            color: '#6b7280',
            textTransform: 'uppercase',
            letterSpacing: 2,
            fontWeight: 600,
            textAlign: 'center',
            marginBottom: 32,
          }}
        >
          👥 Key Demographics (Est.)
        </p>
        <div style={{ display: 'flex', justifyContent: 'center', gap: 64 }}>
          {topCastes.map((caste, idx) => {
            const colors = ['#ef4444', '#f59e0b', '#3b82f6']
            const staggerDelay = idx * 10
            const casteOpacity = interpolate(
              frame,
              [DEMOGRAPHICS_START + staggerDelay, DEMOGRAPHICS_START + staggerDelay + 15],
              [0, 1],
              { extrapolateRight: 'clamp', extrapolateLeft: 'clamp' },
            )
            return (
              <div
                key={idx}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  opacity: casteOpacity,
                }}
              >
                <div
                  style={{
                    width: 80,
                    height: 8,
                    backgroundColor: colors[idx],
                    borderRadius: 4,
                    marginBottom: 12,
                  }}
                />
                <span style={{ fontSize: 52, fontWeight: 700, color: '#111827' }}>
                  {caste.percentage}%
                </span>
                <span style={{ fontSize: 26, color: '#6b7280' }}>{caste.name}</span>
              </div>
            )
          })}
        </div>
      </div>

      {/* Voter Stats Footer */}
      <div
        style={{
          margin: '0 48px',
          backgroundColor: '#f9fafb',
          borderRadius: 24,
          padding: '32px 40px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          opacity: votersOpacity,
          transform: `translateY(${votersSlide}px)`,
        }}
      >
        <div>
          <p style={{ fontSize: 24, color: '#6b7280', margin: 0, textTransform: 'uppercase' }}>
            TOTAL VOTERS
          </p>
          <p style={{ fontSize: 64, fontWeight: 700, color: '#111827', margin: '8px 0 0 0' }}>
            {totalVoters}
          </p>
        </div>
        <div style={{ backgroundColor: '#dcfce7', padding: '12px 20px', borderRadius: 12 }}>
          <span style={{ fontSize: 28, color: '#16a34a', fontWeight: 600 }}>↑ {voterGrowth}%</span>
        </div>
        <div
          style={{
            backgroundColor: '#fee2e2',
            padding: '20px 32px',
            borderRadius: 16,
            textAlign: 'center',
          }}
        >
          <p style={{ fontSize: 20, color: '#dc2626', margin: 0 }}>MALE</p>
          <p style={{ fontSize: 40, fontWeight: 700, color: '#dc2626', margin: '4px 0 0 0' }}>
            {maleVoters}
          </p>
        </div>
        <div
          style={{
            backgroundColor: '#fce7f3',
            padding: '20px 32px',
            borderRadius: 16,
            textAlign: 'center',
          }}
        >
          <p style={{ fontSize: 20, color: '#db2777', margin: 0 }}>FEMALE</p>
          <p style={{ fontSize: 40, fontWeight: 700, color: '#db2777', margin: '4px 0 0 0' }}>
            {femaleVoters}
          </p>
        </div>
      </div>

      {/* Call to Action Footer */}
      <div
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          padding: '40px 48px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          backgroundColor: '#1f2937',
          opacity: votersOpacity,
        }}
      >
        <span style={{ fontSize: 28, color: '#9ca3af' }}>Since 1977 • 11 elections</span>
        <span style={{ fontSize: 28, fontWeight: 600, color: 'white' }}>indiastats.org</span>
      </div>
    </AbsoluteFill>
  )
}
