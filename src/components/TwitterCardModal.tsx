'use client'

import * as React from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Download, Loader2, Eye } from 'lucide-react'

interface TwitterCardData {
  assemblyId: string
  assemblyName: string
  districtName: string
  acNumber: string
  isReserved: boolean
  totalVoters: string
  maleVoters: string
  femaleVoters: string
  currentMla: string
  currentParty: string
  totalElections: number
  party1: { name: string; wins: number } | null
  party2: { name: string; wins: number } | null
  dmkBlocWins: number
  aiadmkBlocWins: number
  dmkBlocBreakdown?: Record<string, number>
  aiadmkBlocBreakdown?: Record<string, number>
  voterGrowth: number | null
  topCastes: { name: string; percentage: number }[]
}

interface CasteData {
  rank1Caste: string | null
  rank1Percentage: number | null
  rank2Caste: string | null
  rank2Percentage: number | null
  rank3Caste: string | null
  rank3Percentage: number | null
}

interface AllianceData {
  allianceName: string
  parties: { partyName: string }[]
  color: string
}

interface AssemblyData {
  assemblyId: string
  districtId: string
  name: string
  districtName: string
  voters: {
    male: number
    female: number
    total: number
    isReservedAc: boolean
  } | null
  electionHistory: {
    year: number
    winner: string
    winnerParty: string
    winnerVotes: number
  }[]
  allianceData: Record<number, AllianceData[]>
  lastElectionVoters: {
    total: number
  } | null
  casteData: CasteData | null
}

interface TwitterCardModalProps {
  assemblyId: string
  assemblyName: string
  data: AssemblyData
  trigger?: React.ReactNode
}

// Helper to determine bloc type
const getBlocType = (
  party: string,
  partyToAlliance: Record<string, string>,
): 'dmk' | 'aiadmk' | 'other' => {
  if (party === 'DMK') return 'dmk'
  if (party === 'AIADMK' || party === 'ADMK' || party === 'AIADMK(J)' || party === 'AIADMK(JA)') {
    return 'aiadmk'
  }

  if (partyToAlliance && partyToAlliance[party]) {
    const alliance = partyToAlliance[party]
    if (
      (alliance.includes('DMK') && !alliance.includes('AIADMK') && !alliance.includes('NDA')) ||
      alliance.includes('Secular Progressive') ||
      alliance.includes('DPA') ||
      alliance.includes('Democratic Progressive')
    ) {
      return 'dmk'
    }
    if (alliance.includes('AIADMK') || alliance.includes('NDA') || alliance.includes('SDPA')) {
      return 'aiadmk'
    }
  }
  return 'other'
}

// Get party leader image
const getLeaderImage = (partyName: string): string | null => {
  if (partyName === 'ADMK' || partyName === 'AIADMK') return '/images/EPS.jpg'
  if (partyName === 'DMK') return '/images/Stalin.png'
  if (partyName === 'INC' || partyName === 'CONG') return '/images/karkae.jpg'
  if (partyName === 'BJP') return '/images/modi.png'
  if (partyName === 'PMK') return '/images/PMK.jpg'
  return null
}

const formatBreakdown = (breakdown?: Record<string, number>) => {
  if (!breakdown) return ''
  return Object.entries(breakdown)
    .sort(([, a], [, b]) => b - a)
    .map(([party, wins]) => `${party}(${wins})`)
    .join(', ')
}

export function TwitterCardModal({
  assemblyId,
  assemblyName,
  data,
  trigger,
}: TwitterCardModalProps) {
  const [isOpen, setIsOpen] = React.useState(false)
  const cardRef = React.useRef<HTMLDivElement>(null)

  const cardData = React.useMemo(() => {
    if (!data) return null

    // Process data to match TwitterCardData interface
    const voters = data.voters
    const electionsFrom1977 = data.electionHistory
      .filter((e) => e.year >= 1977)
      .sort((a, b) => b.year - a.year)

    const partyWins: Record<string, number> = {}
    let dmkBlocWins = 0
    let aiadmkBlocWins = 0
    const dmkBlocBreakdown: Record<string, number> = {}
    const aiadmkBlocBreakdown: Record<string, number> = {}

    electionsFrom1977.forEach((election) => {
      const winnerParty = election.winnerParty
      partyWins[winnerParty] = (partyWins[winnerParty] || 0) + 1

      // Build partyToAlliance map for this year
      const yearAllianceList = data.allianceData[election.year] || []
      const partyToAlliance: Record<string, string> = {}
      yearAllianceList.forEach((alliance) => {
        alliance.parties.forEach((p) => {
          partyToAlliance[p.partyName] = alliance.allianceName
        })
      })

      const blocType = getBlocType(winnerParty, partyToAlliance)
      if (blocType === 'dmk') {
        dmkBlocWins++
        dmkBlocBreakdown[winnerParty] = (dmkBlocBreakdown[winnerParty] || 0) + 1
      }
      if (blocType === 'aiadmk') {
        aiadmkBlocWins++
        aiadmkBlocBreakdown[winnerParty] = (aiadmkBlocBreakdown[winnerParty] || 0) + 1
      }
    })

    // Voter Growth (Compare current total vs last election total)
    let voterGrowth: number | null = null
    if (voters?.total && data.lastElectionVoters?.total) {
      voterGrowth =
        ((voters.total - data.lastElectionVoters.total) / data.lastElectionVoters.total) * 100
    }

    // Top Castes
    const topCastes: { name: string; percentage: number }[] = []
    if (data.casteData) {
      if (data.casteData.rank1Caste && data.casteData.rank1Percentage) {
        topCastes.push({
          name: data.casteData.rank1Caste,
          percentage: data.casteData.rank1Percentage,
        })
      }
      if (data.casteData.rank2Caste && data.casteData.rank2Percentage) {
        topCastes.push({
          name: data.casteData.rank2Caste,
          percentage: data.casteData.rank2Percentage,
        })
      }
      if (data.casteData.rank3Caste && data.casteData.rank3Percentage) {
        topCastes.push({
          name: data.casteData.rank3Caste,
          percentage: data.casteData.rank3Percentage,
        })
      }
    }

    const sortedParties = Object.entries(partyWins).sort((a, b) => b[1] - a[1])
    const party1 = sortedParties[0]
      ? { name: sortedParties[0][0], wins: sortedParties[0][1] }
      : null
    const party2 = sortedParties[1]
      ? { name: sortedParties[1][0], wins: sortedParties[1][1] }
      : null

    const formatNumber = (num: number) => {
      if (num >= 100000) return (num / 100000).toFixed(1) + 'L'
      if (num >= 1000) return (num / 1000).toFixed(1) + 'K'
      return num.toLocaleString()
    }

    return {
      assemblyId: data.assemblyId,
      assemblyName: data.name,
      districtName: data.districtName,
      acNumber: assemblyId.replace('ac', '').replace(/^0+/, ''),
      isReserved: voters?.isReservedAc || false,
      totalVoters: voters ? formatNumber(voters.total) : 'N/A',
      maleVoters: voters ? formatNumber(voters.male) : 'N/A',
      femaleVoters: voters ? formatNumber(voters.female) : 'N/A',
      currentMla: electionsFrom1977[0]?.winner || '',
      currentParty: electionsFrom1977[0]?.winnerParty || '',
      totalElections: electionsFrom1977.length,
      party1,
      party2,
      dmkBlocWins,
      aiadmkBlocWins,
      dmkBlocBreakdown,
      aiadmkBlocBreakdown,
      voterGrowth,
      topCastes,
    }
  }, [data, assemblyId])

  const isLoading = false
  const error = null

  const handleDownload = async () => {
    if (!cardRef.current || !cardData) return
    try {
      const { toPng } = await import('html-to-image')

      const dataUrl = await toPng(cardRef.current, {
        cacheBust: true,
        pixelRatio: 3,
        backgroundColor: '#ffffff',
        style: {
          margin: '0',
        },
      })

      const link = document.createElement('a')
      link.download = `${cardData.assemblyName.replace(/\s+/g, '-')}-twitter-card.png`
      link.href = dataUrl
      link.click()
    } catch (err) {
      console.error('Download failed:', err)
    }
  }

  const handleShareTwitter = async () => {
    const pageUrl = typeof window !== 'undefined' ? window.location.href : ''
    const dmkWinner = (cardData?.dmkBlocWins || 0) > (cardData?.aiadmkBlocWins || 0)
    const tweetText =
      `🗳️ ${cardData?.assemblyName || assemblyName} Assembly\n\n` +
      `📊 Since ADMK formed:\n` +
      `🔴 DMK Bloc: ${cardData?.dmkBlocWins} wins\n` +
      `🟢 AIADMK Bloc: ${cardData?.aiadmkBlocWins} wins\n` +
      `🏆 ${dmkWinner ? 'DMK' : 'AIADMK'} Bloc leads!\n\n` +
      `Explore more at IndiaStats.org\n#TamilNadu #Elections`

    // Try Web Share API with image file
    if (navigator.share && cardRef.current) {
      try {
        const { toPng } = await import('html-to-image')
        const dataUrl = await toPng(cardRef.current, {
          cacheBust: true,
          pixelRatio: 3,
          backgroundColor: '#ffffff',
        })

        // Convert data URL to Blob
        const response = await fetch(dataUrl)
        const blob = await response.blob()
        const file = new File([blob], `${cardData?.assemblyName || 'assembly'}-quick-view.png`, {
          type: 'image/png',
        })

        await navigator.share({
          title: `${cardData?.assemblyName || assemblyName} Assembly - Quick View`,
          text: tweetText,
          url: pageUrl,
          files: [file],
        })
        return
      } catch (err) {
        console.log('Web Share API failed, falling back to Twitter intent:', err)
      }
    }

    // Fallback: Open Twitter/X intent with URL
    const encodedText = encodeURIComponent(tweetText)
    const encodedUrl = encodeURIComponent(pageUrl)
    window.open(`https://twitter.com/intent/tweet?text=${encodedText}&url=${encodedUrl}`, '_blank')
  }

  const leader1 = cardData?.party1 ? getLeaderImage(cardData.party1.name) : null
  const leader2 = cardData?.party2 ? getLeaderImage(cardData.party2.name) : null
  const winDiff =
    cardData?.party1 && cardData?.party2 ? cardData.party1.wins - cardData.party2.wins : 0

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm" className="gap-2">
            <Eye className="h-4 w-4" />
            Quick View
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Quick View: {assemblyName}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {isLoading && (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          )}

          {error && <div className="bg-red-50 text-red-600 p-4 rounded-lg">Error: {error}</div>}

          {cardData && !isLoading && (
            <>
              {/* Card Preview - Horizontally scrollable on mobile */}
              <div className="overflow-x-auto pb-4">
                <div
                  ref={cardRef}
                  data-card
                  style={{
                    width: 600,
                    minWidth: 600,
                    margin: '0 auto',
                    backgroundColor: '#ffffff',
                    borderRadius: 8,
                    overflow: 'hidden',
                    boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                    fontFamily:
                      'var(--font-geist-sans), "Geist Sans", "Geist", ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                  }}
                >
                  {/* Red stripe */}
                  <div style={{ height: 6, backgroundColor: '#dc2626', width: '100%' }} />

                  {/* Header */}
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '12px 16px',
                      borderBottom: '1px solid #e5e7eb',
                    }}
                  >
                    {/* Logo */}
                    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 4 }}>
                      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 2 }}>
                        <div
                          style={{
                            width: 5,
                            height: 8,
                            backgroundColor: '#dc2626',
                            borderRadius: 1,
                          }}
                        />
                        <div
                          style={{
                            width: 5,
                            height: 14,
                            backgroundColor: '#dc2626',
                            borderRadius: 1,
                          }}
                        />
                        <div
                          style={{
                            width: 5,
                            height: 20,
                            backgroundColor: '#dc2626',
                            borderRadius: 1,
                          }}
                        />
                      </div>
                      <span
                        style={{
                          fontSize: 18,
                          fontWeight: 700,
                          color: '#111827',
                          marginLeft: 4,
                          lineHeight: 1,
                        }}
                      >
                        IndiaStats
                      </span>
                      <span
                        style={{ fontSize: 18, fontWeight: 400, color: '#6b7280', lineHeight: 1 }}
                      >
                        .org
                      </span>
                    </div>
                    {/* Badge */}
                    <div
                      style={{
                        backgroundColor: cardData.isReserved ? '#dc2626' : '#f3f4f6',
                        color: cardData.isReserved ? '#ffffff' : '#374151',
                        padding: '4px 10px',
                        borderRadius: 6,
                        fontSize: 11,
                        fontWeight: 600,
                      }}
                    >
                      {cardData.isReserved ? 'RESERVED' : 'GENERAL'}
                    </div>
                  </div>

                  {/* Main content */}
                  <div style={{ padding: 16 }}>
                    {/* Assembly name */}
                    <div
                      style={{
                        borderLeft: '4px solid #dc2626',
                        paddingLeft: 12,
                        marginBottom: 16,
                      }}
                    >
                      <h2 style={{ fontSize: 30, fontWeight: 700, color: '#111827', margin: 0 }}>
                        {cardData.assemblyName}
                      </h2>
                      <p style={{ fontSize: 16, color: '#6b7280', margin: '2px 0 0 0' }}>
                        {cardData.districtName} District, Tamil Nadu
                      </p>
                    </div>

                    {/* Most Winning Section */}
                    <div
                      style={{
                        backgroundColor: '#1f2937',
                        borderRadius: 12,
                        padding: 12,
                        marginBottom: 16,
                      }}
                    >
                      <p
                        style={{
                          fontSize: 12,
                          color: '#9ca3af',
                          textTransform: 'uppercase',
                          letterSpacing: 1,
                          textAlign: 'center',
                          margin: '0 0 12px 0',
                        }}
                      >
                        🏆 MOST WINNING PARTIES (1977-2021)
                      </p>

                      {cardData.party1 && cardData.party2 && (
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          {/* Party 1 */}
                          <div
                            style={{
                              display: 'flex',
                              flexDirection: 'column',
                              alignItems: 'center',
                              flex: 1,
                            }}
                          >
                            <div
                              style={{
                                width: 72,
                                height: 72,
                                borderRadius: 36,
                                border: '3px solid #ef4444',
                                backgroundColor: '#374151',
                                overflow: 'hidden',
                                marginBottom: 8,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                              }}
                            >
                              {leader1 ? (
                                <img
                                  src={leader1}
                                  alt=""
                                  style={{ width: 72, height: 72, objectFit: 'cover' }}
                                />
                              ) : (
                                <span style={{ fontSize: 28, fontWeight: 700, color: '#ef4444' }}>
                                  {cardData.party1.name.charAt(0)}
                                </span>
                              )}
                            </div>
                            <div
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 4,
                                marginBottom: 2,
                              }}
                            >
                              <img
                                src={`/images/${cardData.party1.name}.png`}
                                alt=""
                                style={{ width: 24, height: 18, objectFit: 'contain' }}
                                onError={(e) => {
                                  e.currentTarget.style.display = 'none'
                                }}
                              />
                              <span style={{ fontSize: 16, fontWeight: 600, color: 'white' }}>
                                {cardData.party1.name}
                              </span>
                            </div>
                            <p
                              style={{
                                fontSize: 36,
                                fontWeight: 700,
                                color: '#ef4444',
                                margin: 0,
                                lineHeight: 1,
                              }}
                            >
                              {cardData.party1.wins}
                            </p>
                            <p style={{ fontSize: 13, color: '#9ca3af', margin: 0 }}>wins</p>
                          </div>

                          {/* VS Badge */}
                          <div
                            style={{
                              display: 'flex',
                              flexDirection: 'column',
                              alignItems: 'center',
                              margin: '0 12px',
                            }}
                          >
                            <div
                              style={{
                                width: 36,
                                height: 36,
                                borderRadius: 18,
                                backgroundColor: '#374151',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                              }}
                            >
                              <span style={{ fontSize: 12, fontWeight: 700, color: 'white' }}>
                                VS
                              </span>
                            </div>
                            {winDiff > 0 && (
                              <span
                                style={{
                                  fontSize: 10,
                                  color: '#ef4444',
                                  marginTop: 4,
                                  fontWeight: 600,
                                }}
                              >
                                +{winDiff}
                              </span>
                            )}
                          </div>

                          {/* Party 2 */}
                          <div
                            style={{
                              display: 'flex',
                              flexDirection: 'column',
                              alignItems: 'center',
                              flex: 1,
                            }}
                          >
                            <div
                              style={{
                                width: 72,
                                height: 72,
                                borderRadius: 36,
                                border: '3px solid #9ca3af',
                                backgroundColor: '#374151',
                                overflow: 'hidden',
                                marginBottom: 8,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                              }}
                            >
                              {leader2 ? (
                                <img
                                  src={leader2}
                                  alt=""
                                  style={{ width: 72, height: 72, objectFit: 'cover' }}
                                />
                              ) : (
                                <span style={{ fontSize: 28, fontWeight: 700, color: '#9ca3af' }}>
                                  {cardData.party2.name.charAt(0)}
                                </span>
                              )}
                            </div>
                            <div
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 4,
                                marginBottom: 2,
                              }}
                            >
                              <img
                                src={`/images/${cardData.party2.name}.png`}
                                alt=""
                                style={{ width: 24, height: 18, objectFit: 'contain' }}
                                onError={(e) => {
                                  e.currentTarget.style.display = 'none'
                                }}
                              />
                              <span style={{ fontSize: 16, fontWeight: 600, color: '#9ca3af' }}>
                                {cardData.party2.name}
                              </span>
                            </div>
                            <p
                              style={{
                                fontSize: 36,
                                fontWeight: 700,
                                color: '#9ca3af',
                                margin: 0,
                                lineHeight: 1,
                              }}
                            >
                              {cardData.party2.wins}
                            </p>
                            <p style={{ fontSize: 13, color: '#9ca3af', margin: 0 }}>wins</p>
                          </div>
                        </div>
                      )}

                      {/* Alliance Bloc Row */}
                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'center',
                          gap: 12,
                          marginTop: 16,
                          paddingTop: 12,
                          borderTop: '1px solid #374151',
                        }}
                      >
                        <div
                          style={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                          }}
                        >
                          <div
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: 6,
                              backgroundColor: '#7f1d1d',
                              padding: '6px 12px',
                              borderRadius: 16,
                              marginBottom: 4,
                            }}
                          >
                            <span
                              style={{
                                width: 8,
                                height: 8,
                                borderRadius: 4,
                                backgroundColor: '#ef4444',
                                display: 'inline-block',
                              }}
                            />
                            <span style={{ fontSize: 13, color: '#fca5a5' }}>DMK Bloc</span>
                            <span style={{ fontSize: 15, fontWeight: 700, color: 'white' }}>
                              {cardData.dmkBlocWins}
                            </span>
                          </div>
                          {cardData.dmkBlocBreakdown && (
                            <span
                              style={{
                                fontSize: 9,
                                color: '#9ca3af',
                                maxWidth: 120,
                                textAlign: 'center',
                                lineHeight: 1.2,
                              }}
                            >
                              {formatBreakdown(cardData.dmkBlocBreakdown)}
                            </span>
                          )}
                        </div>

                        <div
                          style={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                          }}
                        >
                          <div
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: 6,
                              backgroundColor: '#14532d',
                              padding: '6px 12px',
                              borderRadius: 16,
                              marginBottom: 4,
                            }}
                          >
                            <span
                              style={{
                                width: 8,
                                height: 8,
                                borderRadius: 4,
                                backgroundColor: '#22c55e',
                                display: 'inline-block',
                              }}
                            />
                            <span style={{ fontSize: 13, color: '#86efac' }}>AIADMK Bloc</span>
                            <span style={{ fontSize: 15, fontWeight: 700, color: 'white' }}>
                              {cardData.aiadmkBlocWins}
                            </span>
                          </div>
                          {cardData.aiadmkBlocBreakdown && (
                            <span
                              style={{
                                fontSize: 9,
                                color: '#9ca3af',
                                maxWidth: 120,
                                textAlign: 'center',
                                lineHeight: 1.2,
                              }}
                            >
                              {formatBreakdown(cardData.aiadmkBlocBreakdown)}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Divider and Key Demographics */}
                      {cardData.topCastes.length > 0 && (
                        <>
                          <div
                            style={{
                              height: 1,
                              backgroundColor: '#374151',
                              margin: '16px 0 12px 0',
                            }}
                          />
                          <p
                            style={{
                              fontSize: 15,
                              color: '#9ca3af',
                              textTransform: 'uppercase',
                              letterSpacing: 1,
                              fontWeight: 600,
                              textAlign: 'center',
                              marginBottom: 12,
                            }}
                          >
                            👥 Key Demographics (Est.)
                          </p>
                          <div
                            style={{
                              display: 'flex',
                              justifyContent: 'center',
                              gap: 16,
                              alignItems: 'flex-start',
                            }}
                          >
                            {cardData.topCastes.map((caste, idx) => (
                              <div
                                key={idx}
                                style={{
                                  display: 'flex',
                                  flexDirection: 'column',
                                  alignItems: 'center',
                                  flex: 1,
                                }}
                              >
                                <div
                                  style={{
                                    width: 24,
                                    height: 4,
                                    borderRadius: 2,
                                    backgroundColor:
                                      idx === 0 ? '#ef4444' : idx === 1 ? '#f59e0b' : '#3b82f6',
                                    marginBottom: 6,
                                  }}
                                />
                                <span
                                  style={{
                                    fontSize: 24,
                                    fontWeight: 700,
                                    color: 'white',
                                    lineHeight: 1,
                                  }}
                                >
                                  {caste.percentage}%
                                </span>
                                <span
                                  style={{
                                    fontSize: 14,
                                    color: '#d1d5db',
                                    marginTop: 4,
                                    textAlign: 'center',
                                    lineHeight: 1.2,
                                  }}
                                >
                                  {caste.name}
                                </span>
                              </div>
                            ))}
                          </div>
                        </>
                      )}
                    </div>

                    <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
                      <div
                        style={{
                          backgroundColor: '#f9fafb',
                          borderRadius: 8,
                          padding: '8px 12px',
                          flex: 1,
                        }}
                      >
                        <div
                          style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                          }}
                        >
                          <p
                            style={{
                              fontSize: 12,
                              color: '#6b7280',
                              margin: 0,
                              textTransform: 'uppercase',
                              letterSpacing: 0.5,
                            }}
                          >
                            Total Voters
                          </p>
                          {cardData.voterGrowth !== null && (
                            <div
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                backgroundColor: cardData.voterGrowth > 0 ? '#d1fae5' : '#fee2e2',
                                padding: '2px 6px',
                                borderRadius: 4,
                              }}
                            >
                              <span
                                style={{
                                  fontSize: 11,
                                  fontWeight: 700,
                                  color: cardData.voterGrowth > 0 ? '#059669' : '#dc2626',
                                }}
                              >
                                {cardData.voterGrowth > 0 ? '↑' : '↓'}{' '}
                                {Math.abs(cardData.voterGrowth).toFixed(1)}%
                              </span>
                            </div>
                          )}
                        </div>
                        <p
                          style={{
                            fontSize: 26,
                            fontWeight: 700,
                            color: '#111827',
                            margin: '2px 0 0 0',
                          }}
                        >
                          {cardData.totalVoters}
                        </p>
                      </div>
                      <div
                        style={{
                          backgroundColor: '#fee2e2',
                          borderRadius: 8,
                          padding: '8px 12px',
                        }}
                      >
                        <p
                          style={{
                            fontSize: 12,
                            color: '#dc2626',
                            margin: 0,
                            textTransform: 'uppercase',
                            letterSpacing: 0.5,
                          }}
                        >
                          Male
                        </p>
                        <p
                          style={{
                            fontSize: 20,
                            fontWeight: 700,
                            color: '#dc2626',
                            margin: '2px 0 0 0',
                          }}
                        >
                          {cardData.maleVoters}
                        </p>
                      </div>
                      <div
                        style={{
                          backgroundColor: '#fce7f3',
                          borderRadius: 8,
                          padding: '8px 12px',
                        }}
                      >
                        <p
                          style={{
                            fontSize: 12,
                            color: '#db2777',
                            margin: 0,
                            textTransform: 'uppercase',
                            letterSpacing: 0.5,
                          }}
                        >
                          Female
                        </p>
                        <p
                          style={{
                            fontSize: 20,
                            fontWeight: 700,
                            color: '#db2777',
                            margin: '2px 0 0 0',
                          }}
                        >
                          {cardData.femaleVoters}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap gap-3 justify-center pt-4">
                <Button onClick={handleDownload} className="gap-2">
                  <Download className="h-4 w-4" />
                  Download PNG
                </Button>
                <Button
                  onClick={handleShareTwitter}
                  variant="outline"
                  className="gap-2 bg-black text-white hover:bg-gray-800 hover:text-white"
                >
                  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                  </svg>
                  Share on X
                </Button>
              </div>

              <p className="text-xs text-muted-foreground text-center">
                Tip: Download the image and attach it to your tweet for best visual impact.
              </p>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
