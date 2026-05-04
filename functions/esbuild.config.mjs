import { build } from 'esbuild';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
// Resolve pg from root project pnpm store (bundled into the output)
const pgPath = path.resolve(__dirname, '../node_modules/.pnpm/pg@8.16.3/node_modules/pg');

await build({
  entryPoints: ['eci-scraper/index.ts'],
  bundle: true,
  platform: 'node',
  target: 'node20',
  format: 'cjs',
  outfile: 'dist/bundle.js',
  // @azure/functions-core is provided by the Azure Functions host worker runtime
  external: ['@azure/functions-core'],
  alias: { pg: pgPath },
  minify: false,
  sourcemap: false,
});

console.log('✅ Bundle written to dist/bundle.js');
