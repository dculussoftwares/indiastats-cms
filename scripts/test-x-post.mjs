#!/usr/bin/env node
/**
 * Local test script for the X (Twitter) bot posting.
 * Usage: node scripts/test-x-post.mjs [--dry-run] [--assembly ac011]
 *
 * Prerequisites:
 *   npm install twitter-api-v2 dotenv
 *
 * Make sure .env.local has TWITTER_ACCESS_TOKEN and TWITTER_ACCESS_SECRET filled in.
 */

import { readFileSync, existsSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..');

// ------- Load .env.local manually (no dotenv dependency needed) -------
function loadEnvFile(filePath) {
  if (!existsSync(filePath)) return;
  const lines = readFileSync(filePath, 'utf8').split('\n');
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx === -1) continue;
    const key = trimmed.slice(0, eqIdx).trim();
    const val = trimmed.slice(eqIdx + 1).trim().replace(/^["']|["']$/g, '');
    if (!process.env[key]) process.env[key] = val;
  }
}
loadEnvFile(resolve(root, '.env.local'));
loadEnvFile(resolve(root, '.env'));

// ------- Parse CLI args -------
const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');
const assemblyIdx = args.indexOf('--assembly');
const assemblyId = assemblyIdx !== -1 ? args[assemblyIdx + 1] : 'ac011';

// ------- Validate credentials -------
const {
  TWITTER_API_KEY,
  TWITTER_API_SECRET,
  TWITTER_ACCESS_TOKEN,
  TWITTER_ACCESS_SECRET,
} = process.env;

const missing = [];
if (!TWITTER_API_KEY)       missing.push('TWITTER_API_KEY');
if (!TWITTER_API_SECRET)    missing.push('TWITTER_API_SECRET');
if (!TWITTER_ACCESS_TOKEN || TWITTER_ACCESS_TOKEN === 'REPLACE_WITH_ACCESS_TOKEN')
  missing.push('TWITTER_ACCESS_TOKEN (generate from X Developer Portal)');
if (!TWITTER_ACCESS_SECRET || TWITTER_ACCESS_SECRET === 'REPLACE_WITH_ACCESS_TOKEN_SECRET')
  missing.push('TWITTER_ACCESS_SECRET (generate from X Developer Portal)');

if (missing.length) {
  console.error('\n❌  Missing or placeholder credentials in .env.local:\n');
  missing.forEach(m => console.error('   •', m));
  console.error('\n👉  Go to: https://developer.x.com/en/portal/projects');
  console.error('   → Your App → Keys and Tokens → Access Token and Secret → Generate\n');
  process.exit(1);
}

// ------- Import twitter-api-v2 -------
let TwitterApi;
try {
  ({ TwitterApi } = await import('twitter-api-v2'));
} catch {
  console.error('\n❌  twitter-api-v2 not installed. Run:\n\n   npm install twitter-api-v2\n');
  process.exit(1);
}

// ------- Build client -------
const client = new TwitterApi({
  appKey: TWITTER_API_KEY,
  appSecret: TWITTER_API_SECRET,
  accessToken: TWITTER_ACCESS_TOKEN,
  accessSecret: TWITTER_ACCESS_SECRET,
});

const SITE_URL = 'https://indiastats.org';

// District map (same as workflow)
const DISTRICT_MAP = {
  dt1: ['ac001','ac002','ac003','ac004','ac005','ac006','ac007'],
  dt2: ['ac008','ac009','ac010','ac011','ac012','ac013'],
  dt3: ['ac014','ac015','ac016','ac017','ac018','ac019'],
  dt4: ['ac020','ac021','ac022','ac023','ac024','ac025','ac026'],
  dt5: ['ac027','ac028','ac029','ac030','ac031','ac032','ac033'],
  dt6: ['ac034','ac035','ac036','ac037','ac038','ac039','ac040'],
  dt7: ['ac041','ac042','ac043','ac044','ac045','ac046','ac047','ac048','ac049','ac050'],
  dt8: ['ac099','ac100','ac101','ac102','ac103','ac104','ac105'],
  dt28: ['ac223','ac224','ac225','ac226','ac227','ac228'],
  dt29: ['ac229','ac230','ac231','ac232','ac233','ac234'],
};

function getDistrictForAssembly(id) {
  const lower = id.toLowerCase();
  for (const [district, assemblies] of Object.entries(DISTRICT_MAP)) {
    if (assemblies.includes(lower)) return district;
  }
  return 'dt7';
}

const districtId = getDistrictForAssembly(assemblyId);
const pageUrl = `${SITE_URL}/tamil-nadu/assembly/${districtId}/${assemblyId.toLowerCase()}`;

const tweetText =
  `📊 Assembly Spotlight: ${assemblyId.toUpperCase()}\n\n` +
  `🗳️ Tamil Nadu Elections Data\n` +
  `Explore detailed history, demographics & voting patterns\n\n` +
  `🔗 ${pageUrl}\n\n` +
  `#IndiaStats #TamilNadu #Elections #ADMK #DMK`;

console.log('\n============================================================');
console.log('🐦  X Bot — Local Test');
console.log('============================================================');
console.log(`Assembly : ${assemblyId}`);
console.log(`District : ${districtId}`);
console.log(`URL      : ${pageUrl}`);
console.log('------------------------------------------------------------');
console.log('Tweet text:');
console.log(tweetText);
console.log('------------------------------------------------------------');
console.log(`Dry run  : ${dryRun ? 'YES (no actual post)' : 'NO — will post'}`);
console.log('============================================================\n');

if (dryRun) {
  console.log('✅  Dry run complete — credentials look fine, skipping actual post.');
  process.exit(0);
}

try {
  // Verify credentials first (read-only call)
  console.log('🔐  Verifying credentials via GET /2/users/me ...');
  const me = await client.v2.me();
  console.log(`✅  Authenticated as @${me.data.username} (id: ${me.data.id})\n`);

  console.log('📤  Posting tweet...');
  const { data } = await client.v2.tweet({ text: tweetText });
  console.log(`✅  Tweet posted! ID: ${data.id}`);
  console.log(`🔗  https://x.com/i/web/status/${data.id}\n`);
} catch (err) {
  console.error('\n❌  API Error:', err.message);
  if (err.code === 403) {
    console.error('\n⚠️   403 Forbidden — common causes:');
    console.error('   1. App permissions not set to "Read and Write" in X Developer Portal');
    console.error('   2. Access Token was generated BEFORE changing app permissions');
    console.error('      → Regenerate the Access Token after setting Read+Write permissions');
    console.error('   3. Your X account needs to be connected to a project with write access');
    console.error('\n👉  Fix: Developer Portal → Your App → Settings → App Permissions → Read and Write');
    console.error('       Then: Keys and Tokens → Regenerate Access Token & Secret\n');
  } else if (err.code === 401) {
    console.error('\n⚠️   401 Unauthorized — credentials are wrong or revoked.');
    console.error('   → Double-check all 4 values in .env.local\n');
  }
  process.exit(1);
}
