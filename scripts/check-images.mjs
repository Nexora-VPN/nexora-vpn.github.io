// Images stay small and every Markdown image says what it shows.
// Budgets: one file ≤ 500 KB, all images ≤ 150 MB (GitHub Pages allows 1 GB a
// site; four locales × two themes of screenshots add up quickly).

import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join, extname } from 'node:path'

const SRC = 'src'
const IMAGE = new Set(['.png', '.jpg', '.jpeg', '.webp', '.gif', '.svg', '.avif'])
const MAX_FILE = 500 * 1024
const MAX_TOTAL = 150 * 1024 * 1024

const problems = []
let total = 0

function walk(dir) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name)
    const st = statSync(p)
    if (st.isDirectory()) {
      walk(p)
      continue
    }
    const ext = extname(name).toLowerCase()
    if (IMAGE.has(ext)) {
      total += st.size
      if (st.size > MAX_FILE) problems.push(`${p}: ${Math.round(st.size / 1024)} KB, over ${MAX_FILE / 1024} KB`)
    }
    if (ext === '.md') {
      readFileSync(p, 'utf8')
        .split('\n')
        .forEach((line, i) => {
          if (/!\[\s*\]\(/.test(line)) problems.push(`${p}:${i + 1}: image without alt text`)
          if (/<img(?![^>]*\balt="[^"]+")[^>]*>/i.test(line)) problems.push(`${p}:${i + 1}: <img> without alt text`)
        })
    }
  }
}

walk(SRC)

// Every <NxShot page="x"> needs its pictures: English always, Persian for
// Persian pages; Russian and Chinese pages show the English ones unless `own`.
import { existsSync } from 'node:fs'
function shotsIn(dir) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name)
    if (statSync(p).isDirectory()) {
      if (name !== 'public') shotsIn(p)
      continue
    }
    if (extname(name) !== '.md') continue
    const lang = p.split('/')[1]
    const text = readFileSync(p, 'utf8')
    for (const m of text.matchAll(/<NxShot[^>]*\spage="([^"]+)"[^>]*>/g)) {
      const own = /\sown\b/.test(m[0])
      const dirLang = lang === 'fa' || (own && ['ru', 'zh'].includes(lang)) ? lang : 'en'
      for (const theme of ['light', 'dark']) {
        const f = join(SRC, 'public', 'shots', dirLang, `${m[1]}-${theme}.webp`)
        if (!existsSync(f)) problems.push(`${p}: <NxShot page="${m[1]}"> has no ${f}`)
      }
    }
  }
}
shotsIn(SRC)
if (total > MAX_TOTAL) problems.push(`images total ${Math.round(total / 1048576)} MB, over ${MAX_TOTAL / 1048576} MB`)

if (problems.length) {
  console.error(problems.join('\n'))
  process.exit(1)
}
console.log(`images: ok (${(total / 1048576).toFixed(1)} MB)`)
