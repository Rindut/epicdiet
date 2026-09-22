// Produces .vercel/output/ (Vercel Build Output API v3) so the deployment is
// unambiguously static. Without this, Vercel's zero-config detection treats
// dist/app.js as a Node server entrypoint and the deployment 500s.
import { cp, mkdir, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const app = path.resolve(fileURLToPath(new URL('../', import.meta.url)));
const output = path.join(app, '.vercel', 'output');

const headers = {
  'Cache-Control': 'no-store',
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'no-referrer',
  'Content-Security-Policy': "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; connect-src 'self'; object-src 'none'; base-uri 'none'; frame-ancestors 'none'",
};

await rm(output, { recursive: true, force: true });
await mkdir(path.join(output, 'static'), { recursive: true });
await cp(path.join(app, 'dist'), path.join(output, 'static'), { recursive: true });
await writeFile(
  path.join(output, 'config.json'),
  JSON.stringify({ version: 3, routes: [{ src: '^/(?:.*)$', headers, continue: true }] }, null, 2) + '\n',
);
console.log('Static output ready at .vercel/output');
