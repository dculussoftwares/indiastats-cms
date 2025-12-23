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
import html2canvas from 'html2canvas'
import Image from 'next/image'

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
    if (!cardRef.current) return
    try {
      const canvas = await html2canvas(cardRef.current, {
        scale: 2,
        backgroundColor: '#ffffff',
        useCORS: true,
      })
      const link = document.createElement('a')
      link.download = `${assemblyId}-twitter-card.png`
      link.href = canvas.toDataURL('image/png')
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
              {/* Card Preview */}
              <div
                ref={cardRef}
                className="bg-white rounded-lg overflow-hidden shadow-lg"
                style={{ width: '600px', margin: '0 auto' }}
              >
                {/* Red stripe */}
                <div className="h-2 bg-red-600" />

                {/* Header */}
                <div className="flex justify-between items-center px-5 py-3 border-b">
                  <div className="flex items-end gap-[2px]">
                    <svg
                      width="20"
                      height="18"
                      viewBox="0 0 20 18"
                      fill="none"
                      className="flex-shrink-0"
                    >
                      <rect x="0" y="11" width="5" height="7" rx="0.5" fill="#be1f1f" />
                      <rect x="7" y="5" width="5" height="13" rx="0.5" fill="#be1f1f" />
                      <rect x="14" y="0" width="5" height="18" rx="0.5" fill="#be1f1f" />
                    </svg>
                    <span className="font-bold text-lg text-gray-900 whitespace-nowrap ml-1">
                      IndiaStats<span className="font-normal text-gray-500">.org</span>
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`px-2 py-1 rounded text-xs font-semibold ${
                        cardData.isReserved ? 'bg-red-600 text-white' : 'bg-gray-100 text-gray-700'
                      }`}
                    >
                      {cardData.isReserved ? 'RESERVED' : 'GENERAL'}
                    </span>
                    <span className="px-2 py-1 rounded text-xs font-semibold bg-gray-100 text-gray-700">
                      AC #{cardData.acNumber}
                    </span>
                  </div>
                </div>

                {/* Main content */}
                <div className="p-5">
                  {/* Assembly name */}
                  <div className="border-l-4 border-red-600 pl-4 mb-5">
                    <h2 className="text-2xl font-bold text-gray-900">{cardData.assemblyName}</h2>
                    <p className="text-gray-500 text-sm">
                      {cardData.districtName} District, Tamil Nadu
                    </p>
                  </div>

                  {/* Voter Stats */}
                  <div className="flex gap-2 mb-5">
                    <div className="bg-gray-50 rounded-lg p-3 flex-1">
                      <p className="text-xs text-gray-500 uppercase">Total Voters</p>
                      <p className="text-xl font-bold text-gray-900">{cardData.totalVoters}</p>
                    </div>
                    <div className="bg-blue-50 rounded-lg p-3">
                      <p className="text-xs text-blue-500 uppercase">Male</p>
                      <p className="text-lg font-bold text-blue-700">{cardData.maleVoters}</p>
                    </div>
                    <div className="bg-pink-50 rounded-lg p-3">
                      <p className="text-xs text-pink-500 uppercase">Female</p>
                      <p className="text-lg font-bold text-pink-700">{cardData.femaleVoters}</p>
                    </div>
                  </div>

                  {/* Most Winning Section - Highlighted */}
                  <div className="bg-gray-900 rounded-xl p-4">
                    <p className="text-gray-400 text-xs uppercase mb-4 tracking-wide text-center">
                      🏆 Most Winning Parties (1977-2021)
                    </p>

                    {cardData.party1 && cardData.party2 && (
                      <div className="flex items-center justify-center gap-4">
                        {/* Party 1 - Winner */}
                        <div className="flex flex-col items-center flex-1">
                          <div className="w-16 h-16 rounded-full border-4 border-red-500 overflow-hidden mb-2 bg-gray-800">
                            {leader1 ? (
                              <Image
                                src={leader1}
                                alt={cardData.party1.name}
                                width={64}
                                height={64}
                                className="object-cover w-full h-full"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-2xl font-bold text-red-500">
                                {cardData.party1.name.charAt(0)}
                              </div>
                            )}
                          </div>
                          <div className="flex items-center gap-1 mb-1">
                            <Image
                              src={`/images/${cardData.party1.name}.png`}
                              alt={cardData.party1.name}
                              width={20}
                              height={16}
                              className="object-contain"
                              onError={(e) => {
                                e.currentTarget.style.display = 'none'
                              }}
                            />
                            <span className="text-white text-sm font-semibold">
                              {cardData.party1.name}
                            </span>
                          </div>
                          <p className="text-3xl font-bold text-red-500">{cardData.party1.wins}</p>
                          <p className="text-gray-500 text-xs">wins</p>
                        </div>

                        {/* VS Badge */}
                        <div className="flex flex-col items-center">
                          <div className="w-11 h-11 rounded-full bg-gray-700 flex items-center justify-center">
                            <span className="text-white text-sm font-bold">VS</span>
                          </div>
                          {winDiff > 0 && (
                            <span className="text-red-400 text-xs font-semibold mt-1">
                              +{winDiff}
                            </span>
                          )}
                        </div>

                        {/* Party 2 - Runner up */}
                        <div className="flex flex-col items-center flex-1">
                          <div className="w-16 h-16 rounded-full border-4 border-gray-500 overflow-hidden mb-2 bg-gray-800">
                            {leader2 ? (
                              <Image
                                src={leader2}
                                alt={cardData.party2.name}
                                width={64}
                                height={64}
                                className="object-cover w-full h-full"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-2xl font-bold text-gray-400">
                                {cardData.party2.name.charAt(0)}
                              </div>
                            )}
                          </div>
                          <div className="flex items-center gap-1 mb-1">
                            <Image
                              src={`/images/${cardData.party2.name}.png`}
                              alt={cardData.party2.name}
                              width={20}
                              height={16}
                              className="object-contain"
                              onError={(e) => {
                                e.currentTarget.style.display = 'none'
                              }}
                            />
                            <span className="text-gray-400 text-sm font-semibold">
                              {cardData.party2.name}
                            </span>
                          </div>
                          <p className="text-3xl font-bold text-gray-400">{cardData.party2.wins}</p>
                          <p className="text-gray-500 text-xs">wins</p>
                        </div>
                      </div>
                    )}

                    {/* Alliance Bloc Row */}
                    <div className="flex justify-center gap-3 mt-4 pt-3 border-t border-gray-700">
                      <div className="flex items-center gap-2 bg-red-500/20 px-3 py-1.5 rounded-full">
                        <span className="w-2 h-2 rounded-full bg-red-500" />
                        <span className="text-red-400 text-xs">DMK Bloc</span>
                        <span className="text-white text-sm font-bold">{cardData.dmkBlocWins}</span>
                      </div>
                      <div className="flex items-center gap-2 bg-green-500/20 px-3 py-1.5 rounded-full">
                        <span className="w-2 h-2 rounded-full bg-green-500" />
                        <span className="text-green-400 text-xs">AIADMK Bloc</span>
                        <span className="text-white text-sm font-bold">
                          {cardData.aiadmkBlocWins}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Footer */}
                <div className="flex justify-between items-center px-5 py-2 border-t bg-gray-50 text-xs">
                  <span className="text-gray-500">
                    Since 1977 • {cardData.totalElections} elections
                  </span>
                  <span className="text-red-600 font-semibold">indiastats.org</span>
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
