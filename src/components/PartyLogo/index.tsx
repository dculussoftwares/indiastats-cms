'use client'

interface PartyLogoProps {
  party: string
  /** Width in px — height is auto (75% of width to match natural logo ratio) */
  size?: number
  className?: string
}

/**
 * Renders a party logo from /images/{party}.png.
 * Silently hides itself if the image is missing.
 */
export function PartyLogo({ party, size = 20, className }: PartyLogoProps) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={`/images/${party}.png`}
      alt=""
      style={{ width: size, height: Math.round(size * 0.75), objectFit: 'contain', flexShrink: 0 }}
      className={className}
      onError={(e) => {
        ;(e.target as HTMLImageElement).style.display = 'none'
      }}
    />
  )
}
