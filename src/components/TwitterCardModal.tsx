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
import { Download, Twitter, Loader2 } from 'lucide-react'

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
}

interface TwitterCardModalProps {
  assemblyId: string
  assemblyName: string
  trigger?: React.ReactNode
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

export function TwitterCardModal({ assemblyId, assemblyName, trigger }: TwitterCardModalProps) {
  const [isOpen, setIsOpen] = React.useState(false)
  const [isLoading, setIsLoading] = React.useState(true)
  const [cardData, setCardData] = React.useState<TwitterCardData | null>(null)
  const [error, setError] = React.useState<string | null>(null)
  const cardRef = React.useRef<HTMLDivElement>(null)

  React.useEffect(() => {
    if (isOpen) {
      setIsLoading(true)
      setError(null)
      fetch(`/api/twitter-card/${assemblyId}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.error) {
            setError(data.error)
          } else {
            setCardData(data)
          }
          setIsLoading(false)
        })
        .catch((err) => {
          setError(err.message)
          setIsLoading(false)
        })
    }
  }, [isOpen, assemblyId])

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

  const handleShareTwitter = () => {
    const dmkWinner = (cardData?.dmkBlocWins || 0) > (cardData?.aiadmkBlocWins || 0)
    const tweetText = encodeURIComponent(
      `🗳️ ${cardData?.assemblyName || assemblyName} Assembly\n\n` +
        `📊 Since ADMK formed:\n` +
        `🔴 DMK Bloc: ${cardData?.dmkBlocWins} wins\n` +
        `🟢 AIADMK Bloc: ${cardData?.aiadmkBlocWins} wins\n` +
        `🏆 ${dmkWinner ? 'DMK' : 'AIADMK'} Bloc leads!\n\n` +
        `Explore more at IndiaStats.org\n#TamilNadu #Elections`,
    )
    window.open(`https://twitter.com/intent/tweet?text=${tweetText}`, '_blank')
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
            <Twitter className="h-4 w-4" />
            Generate Twitter Card
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Twitter Card for {assemblyName}</DialogTitle>
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
              {/* Card Preview - All inline styles for html2canvas compatibility */}
              <div
                ref={cardRef}
                data-card
                style={{
                  width: 600,
                  margin: '0 auto',
                  backgroundColor: '#ffffff',
                  borderRadius: 8,
                  overflow: 'hidden',
                  boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                  fontFamily: 'system-ui, -apple-system, sans-serif',
                }}
              >
                {/* Red stripe */}
                <div style={{ height: 8, backgroundColor: '#dc2626', width: '100%' }} />

                {/* Header */}
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '12px 20px',
                    borderBottom: '1px solid #e5e7eb',
                  }}
                >
                  {/* Logo */}
                  <div style={{ display: 'flex', alignItems: 'flex-end', gap: 4 }}>
                    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 2 }}>
                      <div
                        style={{
                          width: 6,
                          height: 10,
                          backgroundColor: '#dc2626',
                          borderRadius: 1,
                        }}
                      />
                      <div
                        style={{
                          width: 6,
                          height: 18,
                          backgroundColor: '#dc2626',
                          borderRadius: 1,
                        }}
                      />
                      <div
                        style={{
                          width: 6,
                          height: 24,
                          backgroundColor: '#dc2626',
                          borderRadius: 1,
                        }}
                      />
                    </div>
                    <span
                      style={{
                        fontSize: 20,
                        fontWeight: 700,
                        color: '#111827',
                        marginLeft: 4,
                        lineHeight: 1,
                      }}
                    >
                      IndiaStats
                    </span>
                    <span
                      style={{ fontSize: 20, fontWeight: 400, color: '#6b7280', lineHeight: 1 }}
                    >
                      .org
                    </span>
                  </div>
                  {/* Badge */}
                  <div
                    style={{
                      backgroundColor: cardData.isReserved ? '#dc2626' : '#f3f4f6',
                      color: cardData.isReserved ? '#ffffff' : '#374151',
                      padding: '6px 12px',
                      borderRadius: 6,
                      fontSize: 12,
                      fontWeight: 600,
                    }}
                  >
                    {cardData.isReserved ? 'RESERVED' : 'GENERAL'}
                  </div>
                </div>

                {/* Main content */}
                <div style={{ padding: 20 }}>
                  {/* Assembly name */}
                  <div
                    style={{
                      borderLeft: '4px solid #dc2626',
                      paddingLeft: 16,
                      marginBottom: 20,
                    }}
                  >
                    <h2 style={{ fontSize: 28, fontWeight: 700, color: '#111827', margin: 0 }}>
                      {cardData.assemblyName}
                    </h2>
                    <p style={{ fontSize: 14, color: '#6b7280', margin: '4px 0 0 0' }}>
                      {cardData.districtName} District, Tamil Nadu
                    </p>
                  </div>

                  {/* Voter Stats */}
                  <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
                    <div
                      style={{
                        backgroundColor: '#f9fafb',
                        borderRadius: 8,
                        padding: '12px 16px',
                        flex: 1,
                      }}
                    >
                      <p
                        style={{
                          fontSize: 10,
                          color: '#6b7280',
                          margin: 0,
                          textTransform: 'uppercase',
                          letterSpacing: 0.5,
                        }}
                      >
                        Total Voters
                      </p>
                      <p
                        style={{
                          fontSize: 22,
                          fontWeight: 700,
                          color: '#111827',
                          margin: '4px 0 0 0',
                        }}
                      >
                        {cardData.totalVoters}
                      </p>
                    </div>
                    <div
                      style={{
                        backgroundColor: '#fee2e2',
                        borderRadius: 8,
                        padding: '12px 16px',
                      }}
                    >
                      <p
                        style={{
                          fontSize: 10,
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
                          fontSize: 18,
                          fontWeight: 700,
                          color: '#dc2626',
                          margin: '4px 0 0 0',
                        }}
                      >
                        {cardData.maleVoters}
                      </p>
                    </div>
                    <div
                      style={{
                        backgroundColor: '#fce7f3',
                        borderRadius: 8,
                        padding: '12px 16px',
                      }}
                    >
                      <p
                        style={{
                          fontSize: 10,
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
                          fontSize: 18,
                          fontWeight: 700,
                          color: '#db2777',
                          margin: '4px 0 0 0',
                        }}
                      >
                        {cardData.femaleVoters}
                      </p>
                    </div>
                  </div>

                  {/* Most Winning Section */}
                  <div
                    style={{
                      backgroundColor: '#1f2937',
                      borderRadius: 16,
                      padding: 16,
                    }}
                  >
                    <p
                      style={{
                        fontSize: 11,
                        color: '#9ca3af',
                        textTransform: 'uppercase',
                        letterSpacing: 1,
                        textAlign: 'center',
                        margin: '0 0 16px 0',
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
                              border: '4px solid #ef4444',
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
                              marginBottom: 4,
                            }}
                          >
                            <img
                              src={`/images/${cardData.party1.name}.png`}
                              alt=""
                              style={{ width: 18, height: 14, objectFit: 'contain' }}
                              onError={(e) => {
                                e.currentTarget.style.display = 'none'
                              }}
                            />
                            <span style={{ fontSize: 14, fontWeight: 600, color: 'white' }}>
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
                          <p style={{ fontSize: 12, color: '#9ca3af', margin: 0 }}>wins</p>
                        </div>

                        {/* VS Badge */}
                        <div
                          style={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            margin: '0 16px',
                          }}
                        >
                          <div
                            style={{
                              width: 44,
                              height: 44,
                              borderRadius: 22,
                              backgroundColor: '#374151',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                            }}
                          >
                            <span style={{ fontSize: 14, fontWeight: 700, color: 'white' }}>
                              VS
                            </span>
                          </div>
                          {winDiff > 0 && (
                            <span
                              style={{
                                fontSize: 12,
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
                              border: '4px solid #9ca3af',
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
                              marginBottom: 4,
                            }}
                          >
                            <img
                              src={`/images/${cardData.party2.name}.png`}
                              alt=""
                              style={{ width: 18, height: 14, objectFit: 'contain' }}
                              onError={(e) => {
                                e.currentTarget.style.display = 'none'
                              }}
                            />
                            <span style={{ fontSize: 14, fontWeight: 600, color: '#9ca3af' }}>
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
                          <p style={{ fontSize: 12, color: '#9ca3af', margin: 0 }}>wins</p>
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
                          <span style={{ fontSize: 11, color: '#fca5a5' }}>DMK Bloc</span>
                          <span style={{ fontSize: 13, fontWeight: 700, color: 'white' }}>
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
                          <span style={{ fontSize: 11, color: '#86efac' }}>AIADMK Bloc</span>
                          <span style={{ fontSize: 13, fontWeight: 700, color: 'white' }}>
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
                  </div>
                </div>

                {/* Footer */}
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '10px 20px',
                    borderTop: '1px solid #e5e7eb',
                    backgroundColor: '#f9fafb',
                  }}
                >
                  <span style={{ fontSize: 12, color: '#6b7280' }}>
                    Since 1977 • {cardData.totalElections} elections
                  </span>
                  <span style={{ fontSize: 12, color: '#dc2626', fontWeight: 600 }}>
                    indiastats.org
                  </span>
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
                  className="gap-2 bg-[#1DA1F2] text-white hover:bg-[#1a8cd8] hover:text-white"
                >
                  <Twitter className="h-4 w-4" />
                  Share on Twitter
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
