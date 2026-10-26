import { type Plugin } from 'vite';
import { defineConfig } from 'vitest/config';
import { createHash } from 'node:crypto';
import { readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import pkg from './package.json' with { type: 'json' };

const walk = (dir: string): string[] =>
  readdirSync(dir).flatMap((name) => {
    const p = join(dir, name);
    return statSync(p).isDirectory() ? walk(p) : [p];
  });

/**
 * Writes dist/sw.js after every build. The cache name is a hash of the built
 * files, so each deploy invalidates the old cache automatically and the app
 * keeps working offline with zero manual versioning.
 */
function offlineServiceWorker(): Plugin {
  let outDir = 'dist';
  return {
    name: 'letting-go-sw',
    apply: 'build',
    configResolved(config) {
      outDir = join(config.root, config.build.outDir);
    },
    closeBundle() {
      const files = walk(outDir)
        .map((f) => relative(outDir, f).split('\\').join('/'))
        .filter((f) => f !== 'sw.js')
        .sort();
      const hash = createHash('sha256');
      for (const f of files) hash.update(f).update(readFileSync(join(outDir, f)));
      const version = hash.digest('hex').slice(0, 12);
      const precache = ['./', ...files.map((f) => `./${f}`)];
      writeFileSync(
        join(outDir, 'sw.js'),
        `const CACHE='letting-go-${version}';
const PRECACHE=${JSON.stringify(precache)};
self.addEventListener('install',e=>{e.waitUntil(caches.open(CACHE).then(c=>c.addAll(PRECACHE)).then(()=>self.skipWaiting()))});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()))});
self.addEventListener('fetch',e=>{
  if(e.request.method!=='GET')return;
  const url=new URL(e.request.url);
  if(url.origin!==location.origin)return;
  e.respondWith(caches.match(e.request,{ignoreSearch:true}).then(hit=>hit||fetch(e.request).catch(()=>caches.match('./'))));
});
`
      );
    },
  };
}

export default defineConfig({
  // Relative base so the same build works on https://<user>.github.io/<repo>/ and on a custom domain.
  base: './',
  define: { __APP_VERSION__: JSON.stringify(pkg.version) },
  plugins: [offlineServiceWorker()],
  build: { target: 'es2022', sourcemap: false },
  test: { environment: 'node', include: ['src/**/*.test.ts'] },
});
