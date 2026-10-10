// Every page exists in every locale (docs-site.md exit criterion 2). English is
// the root (src/), the others are src/fa, src/ru, src/zh with the same paths.

import { readdirSync, statSync } from 'node:fs'
import { join, relative } from 'node:path'

const SRC = 'src'
const LOCALES = ['fa', 'ru', 'zh']
const SKIP = new Set(['public', ...LOCALES])

function pages(dir, root = dir, skip = new Set()) {
  const out = []
  for (const name of readdirSync(dir)) {
    if (skip.has(name)) continue
    const p = join(dir, name)
    if (statSync(p).isDirectory()) out.push(...pages(p, root))
    else if (name.endsWith('.md')) out.push(relative(root, p))
  }
  return out.sort()
}

const en = new Set(pages(SRC, SRC, SKIP))
const problems = []
for (const loc of LOCALES) {
  const have = new Set(pages(join(SRC, loc)))
  for (const p of en) if (!have.has(p)) problems.push(`src/${loc}/${p}: missing (exists in English)`)
  for (const p of have) if (!en.has(p)) problems.push(`src/${loc}/${p}: has no English page`)
}

if (problems.length) {
  console.error(problems.join('\n'))
  process.exit(1)
}
console.log(`locales: ok (${en.size} page(s) × ${LOCALES.length + 1})`)
