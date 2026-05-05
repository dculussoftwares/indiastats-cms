/**
 * scraper-direct.ts
 *
 * Same parsing logic as scraper.ts, but fetches ECI directly without any proxy.
 * Use this for local execution (Mac IP is not blocked by Akamai).
 * Do NOT use this from Azure/Cloudflare — their datacenter IPs are blocked.
 */
import * as cheerio from 'cheerio'
import { type ConstituencyResult, type CandidateResult, numberToAssemblyId } from './scraper'

const ECI_BASE = 'https://results.eci.gov.in/ResultAcGenMay2026/candidateswise-S22'

export async function scrapeConstituencyDirect(assemblyNumber: number): Promise<ConstituencyResult | null> {
  const url = `${ECI_BASE}${assemblyNumber}.htm`
  let html: string

  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-IN,en;q=0.9',
        Referer: 'https://results.eci.gov.in/',
      },
      signal: AbortSignal.timeout(15_000),
    })
    if (!res.ok) {
      if (assemblyNumber <= 3) console.error(`[scraper-direct] ac${assemblyNumber} HTTP ${res.status}`)
      return null
    }
    html = await res.text()
  } catch (e) {
    if (assemblyNumber <= 3) console.error(`[scraper-direct] ac${assemblyNumber} fetch error:`, e)
    return null
  }

  try {
    const $ = cheerio.load(html)

    // ── Round info ────────────────────────────────────────────────────────
    let currentRound = 0
    let totalRounds = 0
    $('*').each((_, el) => {
      const text = $(el).text().trim()
      const match = text.match(/Status (?:as on|of EVM) Round[:\s,]+(\d+)\s*\/\s*(\d+)/i)
      if (match) {
        currentRound = parseInt(match[1]!, 10)
        totalRounds = parseInt(match[2]!, 10)
        return false
      }
    })

    // ── Status derivation ─────────────────────────────────────────────────
    let status: ConstituencyResult['status'] = 'pending'
    if (currentRound > 0 && currentRound < totalRounds) status = 'counting'
    else if (currentRound > 0 && currentRound >= totalRounds) status = 'declared'

    // ── Candidate cards ───────────────────────────────────────────────────
    const candidates: CandidateResult[] = []
    let notaVotes = 0

    $('h5').each((_, nameEl) => {
      const candidateName = $(nameEl).text().trim()
      const h6 = $(nameEl).next('h6')
      if (!h6.length) return

      const party = h6.text().trim()
      const grandParent = $(nameEl).parent().parent()
      const rawStatus = grandParent.text()
      const cardStatus: CandidateResult['status'] = rawStatus.toLowerCase().includes('leading') ? 'leading' : 'trailing'
      const votesMatch = grandParent.text().match(/(\d[\d,]*)\s*[\(\+\-]/)
      const votes = votesMatch ? parseInt(votesMatch[1]!.replace(/,/g, ''), 10) : 0

      if (party === 'None of the Above' || candidateName === 'NOTA') {
        notaVotes = votes
        return
      }

      candidates.push({ candidateName, party, votes, status: cardStatus })
    })

    candidates.sort((a, b) => b.votes - a.votes)
    const margin = candidates.length >= 2 ? (candidates[0]!.votes - candidates[1]!.votes) : 0

    // ── Last updated ──────────────────────────────────────────────────────
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
