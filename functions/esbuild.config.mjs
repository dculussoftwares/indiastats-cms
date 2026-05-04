import { build } from 'esbuild';

await build({
  entryPoints: ['eci-scraper/index.ts'],
  bundle: true,
  platform: 'node',
  target: 'node20',
  format: 'cjs',
  outfile: 'dist/bundle.js',
  // @azure/functions-core is provided by the Azure Functions host worker runtime
  external: ['@azure/functions-core'],
  minify: false,
  sourcemap: false,
});

console.log('✅ Bundle written to dist/bundle.js');
