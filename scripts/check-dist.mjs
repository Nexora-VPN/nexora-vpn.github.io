// Checks on the built site (docs-site.md exit criteria 4 and 6):
// - nothing is loaded from another host: scripts, styles, fonts, images,
//   frames and preloads all come from this site (links out are fine);
// - the core-name rule holds on the text a reader sees, not only on sources;
// - the CNAME that pins the domain is in the output.

import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs'
import { join, extname } from 'node:path'
import { execFileSync } from 'node:child_process'

const DIST = process.argv[2] || '.vitepress/dist'
const problems = []

function* walk(dir) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name)
    if (statSync(p).isDirectory()) yield* walk(p)
    else yield p
  }
}

const external = /^(https?:)?\/\//i
const LOADS = [
  /<script[^>]*\ssrc="([^"]+)"/gi,
  /<link[^>]*\srel="(?:stylesheet|preload|modulepreload|icon|apple-touch-icon|manifest|prefetch|preconnect|dns-prefetch)"[^>]*\shref="([^"]+)"/gi,
  /<link[^>]*\shref="([^"]+)"[^>]*\srel="(?:stylesheet|preload|modulepreload|icon|apple-touch-icon|manifest|prefetch|preconnect|dns-prefetch)"/gi,
  /<(?:img|source|iframe|video|audio|embed)[^>]*\ssrc="([^"]+)"/gi,
  /<img[^>]*\ssrcset="([^"]+)"/gi,
]
const CSS_LOADS = [/url\(\s*['"]?([^'")]+)/gi, /@import\s+['"]([^'"]+)/gi]

for (const file of walk(DIST)) {
  const ext = extname(file)
  if (ext !== '.html' && ext !== '.css') continue
  const text = readFileSync(file, 'utf8')
  for (const re of ext === '.html' ? LOADS : CSS_LOADS) {
    for (const m of text.matchAll(re)) {
      if (external.test(m[1].trim())) problems.push(`${file}: loads ${m[1]}`)
    }
  }
}

if (!existsSync(join(DIST, 'CNAME')) || readFileSync(join(DIST, 'CNAME'), 'utf8').trim() !== 'docs.nexora-panel.org') {
  problems.push(`${DIST}/CNAME: missing or not docs.nexora-panel.org`)
}

try {
  execFileSync('node', ['scripts/check-core-names.mjs', DIST], { stdio: 'inherit' })
} catch {
  problems.push('core-name rule fails on the built site (above)')
}

if (problems.length) {
  console.error(problems.join('\n'))
  process.exit(1)
}
console.log('dist: ok (no third-party loads, CNAME present)')
