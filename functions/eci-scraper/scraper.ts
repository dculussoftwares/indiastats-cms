/**
 * scraper.ts
 *
 * Fetches and parses a single ECI candidateswise page.
 * URL format: https://results.eci.gov.in/ResultAcGenMay2026/candidateswise-S22{N}.htm
 * where N = 1–234 (maps to ac001–ac234).
 */
import * as cheerio from 'cheerio'

export interface CandidateResult {
  candidateName: string
  party: string
  votes: number
  status: 'leading' | 'trailing'
}

export interface ConstituencyResult {
  assemblyId: string       // e.g. ac054
  assemblyNumber: number   // e.g. 54
  currentRound: number
  totalRounds: number
  status: 'pending' | 'counting' | 'declared'
  candidates: CandidateResult[]
  margin: number
  notaVotes: number
  eciLastUpdatedAt: string
  lastScrapedAt: string
}

/** Convert assembly number (1–234) to assemblyId (ac001–ac234) */
export function numberToAssemblyId(n: number): string {
  return `ac${String(n).padStart(3, '0')}`
}

export async function scrapeConstituency(assemblyNumber: number): Promise<ConstituencyResult | null> {
  // Route through Cloudflare Worker proxy to bypass Akamai IP-blocking of Azure datacenter IPs.
  // Direct ECI URL: https://results.eci.gov.in/ResultAcGenMay2026/candidateswise-S22{N}.htm
  const proxyUrl = process.env['ECI_PROXY_URL']
  if (!proxyUrl) {
    console.error('[scraper] ECI_PROXY_URL not set — cannot scrape')
    return null
  }
  const proxySecret = process.env['ECI_PROXY_SECRET'] ?? ''
  const url = `${proxyUrl}?n=${assemblyNumber}`
  let html: string

  try {
    const res = await fetch(url, {
      headers: { 'X-Proxy-Secret': proxySecret },
      signal: AbortSignal.timeout(15_000),
    })
    if (!res.ok) return null
    html = await res.text()
  } catch {
    return null
  }

  try {
    const $ = cheerio.load(html)

    // ── Round info ───────────────────────────────────────────────────────
    // "Status as on Round, X/Y"
    let currentRound = 0
    let totalRounds = 0
    $('*').each((_, el) => {
      const text = $(el).text().trim()
      const match = text.match(/Status (?:as on|of EVM) Round[:\s,]+(\d+)\s*\/\s*(\d+)/i)
      if (match) {
        currentRound = parseInt(match[1]!, 10)
        totalRounds = parseInt(match[2]!, 10)
        return false // break
      }
    })

    // ── Status derivation ────────────────────────────────────────────────
    let status: ConstituencyResult['status'] = 'pending'
    if (currentRound > 0 && currentRound < totalRounds) status = 'counting'
    else if (currentRound > 0 && currentRound >= totalRounds) status = 'declared'

    // ── Candidate cards ──────────────────────────────────────────────────
    // Each card has: status text (leading/trailing), votes, candidate name (h5), party (h6)
    const candidates: CandidateResult[] = []
    let notaVotes = 0

    // Cards are generic divs containing an h5 (name) and h6 (party)
    // We detect them by the presence of both headings
    $('h5').each((_, nameEl) => {
      const candidateName = $(nameEl).text().trim()
      const h6 = $(nameEl).next('h6')
      if (!h6.length) return

      const party = h6.text().trim()

      // Votes and status are in sibling generics above h5 in the same parent
      const cardParent = $(nameEl).parent()
      const grandParent = cardParent.parent()

      // Status text is in a sibling of cardParent
      const statusEl = grandParent.find('[class*="leading"], [class*="trailing"]').first()
      const rawStatus = grandParent.text()
      const cardStatus: CandidateResult['status'] = rawStatus.toLowerCase().includes('leading') ? 'leading' : 'trailing'

      // Votes: first number in grandParent text (excluding margin text in parens)
      const votesMatch = grandParent.text().match(/(\d[\d,]*)\s*[\(\+\-]/)
      const votes = votesMatch ? parseInt(votesMatch[1]!.replace(/,/g, ''), 10) : 0

      if (party === 'None of the Above' || candidateName === 'NOTA') {
        notaVotes = votes
        return
      }

      candidates.push({ candidateName, party, votes, status: cardStatus })
    })

    // Sort by votes descending (leader first)
    candidates.sort((a, b) => b.votes - a.votes)

    // Margin = leader votes - runner-up votes
    const margin =
      candidates.length >= 2 ? (candidates[0]!.votes - candidates[1]!.votes) : 0

    // ── Last updated ─────────────────────────────────────────────────────
    let eciLastUpdatedAt = ''
    $('*').each((_, el) => {
      const text = $(el).text().trim()
      if (text.startsWith('Last Updated at')) {
        eciLastUpdatedAt = text
        return false
      }
    })

    return {
      assemblyId: numberToAssemblyId(assemblyNumber),
      assemblyNumber,
      currentRound,
      totalRounds,
      status,
      candidates,
      margin,
      notaVotes,
      eciLastUpdatedAt,
      lastScrapedAt: new Date().toISOString(),
    }
  } catch {
    return null
  }
}
