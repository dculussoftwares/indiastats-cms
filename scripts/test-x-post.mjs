#!/usr/bin/env node
/**
 * Local test script for the X (Twitter) bot posting — OAuth 2.0 version.
 *
 * Usage:
 *   node scripts/test-x-post.mjs [--dry-run] [--assembly ac011]
 *
 * Requires in .env.local:
 *   TWITTER_CLIENT_ID
 *   TWITTER_CLIENT_SECRET
 *   X_OAUTH2_REFRESH_TOKEN   ← from running scripts/oauth2-setup.mjs
 */

import { readFileSync, existsSync, writeFileSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = resolve(__dirname, '..')

// ------- Load .env.local -------
function loadEnvFile(filePath) {
  if (!existsSync(filePath)) return
  for (const line of readFileSync(filePath, 'utf8').split('\n')) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const eqIdx = trimmed.indexOf('=')
    if (eqIdx === -1) continue
    const key = trimmed.slice(0, eqIdx).trim()
    const val = trimmed
      .slice(eqIdx + 1)
      .trim()
      .replace(/^["']|["']$/g, '')
    if (!process.env[key]) process.env[key] = val
  }
}
loadEnvFile(resolve(root, '.env.local'))

// Also try reading refresh token from the dedicated file (written by oauth2-setup.mjs)
const tokenFile = resolve(root, '.oauth2-refresh-token.txt')
if (!process.env.X_OAUTH2_REFRESH_TOKEN && existsSync(tokenFile)) {
  process.env.X_OAUTH2_REFRESH_TOKEN = readFileSync(tokenFile, 'utf8').trim()
}

// ------- Parse CLI args -------
const args = process.argv.slice(2)
const dryRun = args.includes('--dry-run')
const assemblyIdx = args.indexOf('--assembly')
const assemblyId = (assemblyIdx !== -1 ? args[assemblyIdx + 1] : 'ac011').toLowerCase()

// ------- Validate credentials -------
const { TWITTER_CLIENT_ID, TWITTER_CLIENT_SECRET, X_OAUTH2_REFRESH_TOKEN } = process.env

const missing = []
if (!TWITTER_CLIENT_ID) missing.push('TWITTER_CLIENT_ID')
if (!TWITTER_CLIENT_SECRET) missing.push('TWITTER_CLIENT_SECRET')
if (!X_OAUTH2_REFRESH_TOKEN)
  missing.push('X_OAUTH2_REFRESH_TOKEN  ← run: node scripts/oauth2-setup.mjs')

if (missing.length) {
  console.error('\n❌  Missing credentials in .env.local:\n')
  missing.forEach((m) => console.error('   •', m))
  console.error('\n👉  Run the one-time setup: node scripts/oauth2-setup.mjs\n')
  process.exit(1)
}

// ------- Import twitter-api-v2 -------
let TwitterApi
try {
  ;({ TwitterApi } = await import('twitter-api-v2'))
} catch {
  console.error('\n❌  twitter-api-v2 not installed. Run: npm install twitter-api-v2\n')
  process.exit(1)
}

// ------- Build client and refresh access token -------
const appClient = new TwitterApi({
  clientId: TWITTER_CLIENT_ID,
  clientSecret: TWITTER_CLIENT_SECRET,
})

let tweetClient
let newRefreshToken

try {
  console.log('\n🔐  Refreshing OAuth 2.0 access token...')
  const {
    client,
    accessToken: _accessToken,
    refreshToken,
  } = await appClient.refreshOAuth2Token(X_OAUTH2_REFRESH_TOKEN)
  tweetClient = client
  newRefreshToken = refreshToken
  console.log(`✅  Access token obtained (expires in ~2h)`)

  // If a new refresh token was issued, update .oauth2-refresh-token.txt
  if (newRefreshToken && newRefreshToken !== X_OAUTH2_REFRESH_TOKEN) {
    writeFileSync(tokenFile, newRefreshToken, 'utf8')
    console.log('🔄  Refresh token rotated — updated .oauth2-refresh-token.txt')
    console.log('    Remember to update X_OAUTH2_REFRESH_TOKEN in GitHub Secrets!\n')
  }
} catch (err) {
  console.error('\n❌  Token refresh failed:', err.message)
  console.error('\n⚠️   Your refresh token may have expired. Re-run:\n')
  console.error('    node scripts/oauth2-setup.mjs\n')
  process.exit(1)
}

// ------- District map -------
const DISTRICT_MAP = {
  dt1: ['ac001', 'ac002', 'ac003', 'ac004', 'ac005', 'ac006', 'ac007'],
  dt2: ['ac008', 'ac009', 'ac010', 'ac011', 'ac012', 'ac013'],
  dt3: ['ac014', 'ac015', 'ac016', 'ac017', 'ac018', 'ac019'],
  dt4: ['ac020', 'ac021', 'ac022', 'ac023', 'ac024', 'ac025', 'ac026'],
  dt5: ['ac027', 'ac028', 'ac029', 'ac030', 'ac031', 'ac032', 'ac033'],
  dt6: ['ac034', 'ac035', 'ac036', 'ac037', 'ac038', 'ac039', 'ac040'],
  dt7: [
    'ac041',
    'ac042',
    'ac043',
    'ac044',
    'ac045',
    'ac046',
    'ac047',
    'ac048',
    'ac049',
    'ac050',
    'ac051',
    'ac052',
    'ac053',
    'ac054',
    'ac055',
    'ac056',
    'ac057',
    'ac058',
    'ac059',
    'ac060',
    'ac061',
    'ac062',
    'ac063',
    'ac064',
    'ac065',
    'ac066',
    'ac067',
    'ac068',
    'ac069',
    'ac070',
    'ac071',
    'ac072',
    'ac073',
    'ac074',
    'ac075',
    'ac076',
    'ac077',
    'ac078',
    'ac079',
    'ac080',
    'ac081',
    'ac082',
    'ac083',
    'ac084',
    'ac085',
    'ac086',
    'ac087',
    'ac088',
    'ac089',
    'ac090',
    'ac091',
    'ac092',
    'ac093',
    'ac094',
    'ac095',
    'ac096',
    'ac097',
    'ac098',
  ],
  dt8: ['ac099', 'ac100', 'ac101', 'ac102', 'ac103', 'ac104', 'ac105'],
  dt9: ['ac106', 'ac107', 'ac108', 'ac109', 'ac110', 'ac111', 'ac112'],
  dt10: ['ac113', 'ac114', 'ac115', 'ac116', 'ac117', 'ac118', 'ac119'],
  dt11: ['ac120', 'ac121', 'ac122', 'ac123', 'ac124', 'ac125'],
  dt12: ['ac126', 'ac127', 'ac128', 'ac129', 'ac130', 'ac131', 'ac132'],
  dt13: ['ac133', 'ac134', 'ac135', 'ac136', 'ac137', 'ac138'],
  dt14: ['ac139', 'ac140', 'ac141', 'ac142', 'ac143', 'ac144'],
  dt15: ['ac145', 'ac146', 'ac147', 'ac148', 'ac149', 'ac150'],
  dt16: ['ac151', 'ac152', 'ac153', 'ac154', 'ac155', 'ac156'],
  dt17: ['ac157', 'ac158', 'ac159', 'ac160', 'ac161', 'ac162'],
  dt18: ['ac163', 'ac164', 'ac165', 'ac166', 'ac167', 'ac168'],
  dt19: ['ac169', 'ac170', 'ac171', 'ac172', 'ac173', 'ac174'],
  dt20: ['ac175', 'ac176', 'ac177', 'ac178', 'ac179', 'ac180'],
  dt21: ['ac181', 'ac182', 'ac183', 'ac184', 'ac185', 'ac186'],
  dt22: ['ac187', 'ac188', 'ac189', 'ac190', 'ac191', 'ac192'],
  dt23: ['ac193', 'ac194', 'ac195', 'ac196', 'ac197', 'ac198'],
  dt24: ['ac199', 'ac200', 'ac201', 'ac202', 'ac203', 'ac204'],
  dt25: ['ac205', 'ac206', 'ac207', 'ac208', 'ac209', 'ac210'],
  dt26: ['ac211', 'ac212', 'ac213', 'ac214', 'ac215', 'ac216'],
  dt27: ['ac217', 'ac218', 'ac219', 'ac220', 'ac221', 'ac222'],
  dt28: ['ac223', 'ac224', 'ac225', 'ac226', 'ac227', 'ac228'],
  dt29: ['ac229', 'ac230', 'ac231', 'ac232', 'ac233', 'ac234'],
}

function getDistrict(id) {
  for (const [district, list] of Object.entries(DISTRICT_MAP)) {
    if (list.includes(id)) return district
  }
  return 'dt7'
}

const SITE_URL = 'https://indiastats.org'
const districtId = getDistrict(assemblyId)
const _basePageUrl = `${SITE_URL}/tamil-nadu/assembly/${districtId}/${assemblyId}`
const pageUrlObj = new URL(_basePageUrl)
pageUrlObj.searchParams.set('utm_source', 'twitter')
pageUrlObj.searchParams.set('utm_medium', 'social')
pageUrlObj.searchParams.set('utm_campaign', 'daily-post')
const pageUrl = pageUrlObj.toString()

const tweetText =
  `📊 Assembly Spotlight: ${assemblyId.toUpperCase()}\n\n` +
  `🗳️ Tamil Nadu Elections Data\n` +
  `Explore detailed history, demographics & voting patterns\n\n` +
  `🔗 ${pageUrl}\n\n` +
  `#IndiaStats #TamilNadu #Elections #ADMK #DMK #BJP #Congress`

console.log('\n============================================================')
console.log('🐦  X Bot — Local Test (OAuth 2.0)')
console.log('============================================================')
console.log(`Assembly : ${assemblyId}`)
console.log(`District : ${districtId}`)
console.log(`URL      : ${pageUrl}`)
console.log('------------------------------------------------------------')
console.log('Tweet text:')
console.log(tweetText)
console.log('------------------------------------------------------------')
console.log(`Dry run  : ${dryRun ? 'YES (no actual post)' : 'NO — will post'}`)
console.log('============================================================\n')

if (dryRun) {
  console.log('✅  Dry run complete — credentials look fine!\n')
  process.exit(0)
}

try {
  const me = await tweetClient.v2.me()
  console.log(`Posting as @${me.data.username}...\n`)

  const { data } = await tweetClient.v2.tweet({ text: tweetText })
  console.log(`✅  Tweet posted! ID: ${data.id}`)
  console.log(`🔗  https://x.com/i/web/status/${data.id}\n`)
} catch (err) {
  console.error('\n❌  API Error:', err.message)
  if (err.code === 403) {
    console.error('\n⚠️   403 Forbidden — the app may not have tweet.write scope.')
    console.error('    Re-run the setup: node scripts/oauth2-setup.mjs\n')
  }
  process.exit(1)
}
