#!/usr/bin/env node
/**
 * One-time OAuth 2.0 setup for the X (Twitter) bot.
 *
 * Run this ONCE locally to authorize the app and get a refresh token.
 * The refresh token is then stored as a GitHub Secret and used by the workflow.
 *
 * Usage:
 *   node scripts/oauth2-setup.mjs
 *
 * Prerequisites:
 *   npm install twitter-api-v2
 *
 * In the X Developer Portal:
 *   1. App → Settings → User authentication settings → Enable OAuth 2.0
 *   2. Set Callback URI / Redirect URL to: http://localhost:3001/callback
 *   3. Request scopes: tweet.write, tweet.read, users.read, offline.access, media.write
 */

import { readFileSync, existsSync, writeFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import http from 'http';
import { URL } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..');
const PORT = 3001;
const CALLBACK_URL = `http://localhost:${PORT}/callback`;

// ------- Load .env.local -------
function loadEnvFile(filePath) {
  if (!existsSync(filePath)) return;
  for (const line of readFileSync(filePath, 'utf8').split('\n')) {
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

const CLIENT_ID = process.env.TWITTER_CLIENT_ID;
const CLIENT_SECRET = process.env.TWITTER_CLIENT_SECRET;

if (!CLIENT_ID || !CLIENT_SECRET) {
  console.error('\n❌  TWITTER_CLIENT_ID or TWITTER_CLIENT_SECRET missing in .env.local\n');
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

const client = new TwitterApi({
  clientId: CLIENT_ID,
  clientSecret: CLIENT_SECRET,
});

// ------- Generate authorization URL -------
const { url, codeVerifier, state } = client.generateOAuth2AuthLink(CALLBACK_URL, {
  scope: ['tweet.write', 'tweet.read', 'users.read', 'offline.access', 'media.write'],
});

console.log('\n============================================================');
console.log('🐦  X Bot — OAuth 2.0 One-Time Setup');
console.log('============================================================');
console.log('\n📋  Before proceeding, ensure in the X Developer Portal:');
console.log('    App → Settings → User authentication settings');
console.log(`    Callback URL is set to: ${CALLBACK_URL}`);
console.log('\n🌐  Opening authorization URL in browser...');
console.log('\n   If browser does not open, visit this URL manually:');
console.log(`\n   ${url}\n`);

// Open browser
const opener =
  process.platform === 'darwin' ? 'open' :
  process.platform === 'win32' ? 'start' : 'xdg-open';

const { exec } = await import('child_process');
exec(`${opener} "${url}"`);

// ------- Start local callback server -------
console.log(`⏳  Waiting for authorization callback on http://localhost:${PORT}/callback ...\n`);

const server = http.createServer(async (req, res) => {
  const reqUrl = new URL(req.url, `http://localhost:${PORT}`);
  if (reqUrl.pathname !== '/callback') {
    res.end('Not found');
    return;
  }

  const code = reqUrl.searchParams.get('code');
  const returnedState = reqUrl.searchParams.get('state');
  const error = reqUrl.searchParams.get('error');

  if (error) {
    res.writeHead(400, { 'Content-Type': 'text/html' });
    res.end(`<h2>❌ Authorization error: ${error}</h2><p>Close this tab.</p>`);
    server.close();
    console.error(`\n❌  Authorization denied: ${error}\n`);
    process.exit(1);
    return;
  }

  if (returnedState !== state) {
    res.writeHead(400, { 'Content-Type': 'text/html' });
    res.end('<h2>❌ Invalid state</h2><p>Close this tab.</p>');
    server.close();
    console.error('\n❌  State mismatch — possible CSRF. Try again.\n');
    process.exit(1);
    return;
  }

  try {
    const { accessToken, refreshToken, expiresIn } =
      await client.loginWithOAuth2({
        code,
        codeVerifier,
        redirectUri: CALLBACK_URL,
      });

    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end(`
      <h2>✅ Authorization successful!</h2>
      <p>Close this tab and check your terminal.</p>
    `);
    server.close();

    console.log('\n✅  Authorization successful!\n');
    console.log('=== TOKENS (save these securely) ===');
    console.log(`Access Token  : ${accessToken}`);
    console.log(`Expires in    : ${expiresIn}s (~${Math.round(expiresIn / 3600)}h)`);
    console.log(`Refresh Token : ${refreshToken ?? '(not provided — make sure offline.access scope is set)'}`);
    console.log('=====================================\n');

    if (refreshToken) {
      // Write refresh token to a temp file for easy copy-paste
      const outFile = resolve(root, '.oauth2-refresh-token.txt');
      writeFileSync(outFile, refreshToken, 'utf8');
      console.log(`💾  Refresh token saved to: .oauth2-refresh-token.txt`);
      console.log('    (This file is git-ignored — do not commit it!)\n');

      console.log('🔐  Now set these GitHub Secrets:\n');
      console.log(`   gh secret set TWITTER_CLIENT_ID     --body "${CLIENT_ID}"     --repo dculussoftwares/indiastats-cms`);
      console.log(`   gh secret set TWITTER_CLIENT_SECRET --body "${CLIENT_SECRET}" --repo dculussoftwares/indiastats-cms`);
      console.log(`   gh secret set X_OAUTH2_REFRESH_TOKEN --body "$(cat .oauth2-refresh-token.txt)" --repo dculussoftwares/indiastats-cms`);
      console.log('\n   Or run the commands above and I\'ll handle it for you!\n');
    } else {
      console.log('⚠️   No refresh token received. Ensure offline.access scope is enabled.\n');
    }
  } catch (err) {
    res.writeHead(500, { 'Content-Type': 'text/html' });
    res.end(`<h2>❌ Token exchange failed</h2><p>${err.message}</p>`);
    server.close();
    console.error('\n❌  Token exchange failed:', err.message, '\n');
    process.exit(1);
  }
});

server.listen(PORT);
