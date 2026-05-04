/**
 * Cloudflare Worker: ECI proxy
 * Fetches ECI candidateswise pages on behalf of Azure Functions.
 * ECI's Akamai CDN blocks Azure datacenter IPs but allows Cloudflare edge IPs.
 *
 * Usage: GET /?n=54  (returns raw HTML of candidateswise-S2254.htm)
 *
 * Secured with a shared secret in the X-Proxy-Secret header.
 */

const ECI_BASE = 'https://results.eci.gov.in/ResultAcGenMay2026/candidateswise-S22'

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    // Auth check
    const secret = request.headers.get('X-Proxy-Secret')
    if (!env.PROXY_SECRET || secret !== env.PROXY_SECRET) {
      return new Response('Unauthorized', { status: 401 })
    }

    const url = new URL(request.url)
    const n = parseInt(url.searchParams.get('n') ?? '0', 10)
    if (!n || n < 1 || n > 234) {
      return new Response('Bad Request: n must be 1–234', { status: 400 })
    }

    const eciUrl = `${ECI_BASE}${n}.htm`

    try {
      const res = await fetch(eciUrl, {
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
          Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'en-IN,en;q=0.9',
          Referer: 'https://results.eci.gov.in/',
        },
        cf: { cacheEverything: false },
      } as RequestInit)

      if (!res.ok) {
        return new Response(`ECI returned ${res.status}`, { status: res.status })
      }

      const html = await res.text()
      return new Response(html, {
        status: 200,
        headers: { 'Content-Type': 'text/html; charset=utf-8' },
      })
    } catch (e) {
      return new Response(`Fetch error: ${String(e)}`, { status: 502 })
    }
  },
} satisfies ExportedHandler<Env>

interface Env {
  PROXY_SECRET: string
}
