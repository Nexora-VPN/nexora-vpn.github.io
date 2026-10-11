// Search finds the right page in every language (docs-site.md exit
// criterion 3): ten fixed queries per locale (search-queries.json), run
// against the built index with the site's own tokenizer, must each have the
// expected page among the first five results.
import { readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import { pathToFileURL } from 'node:url'
import MiniSearch from 'minisearch'
import { processTerm, tokenize } from '../.vitepress/search.ts'

const DIST = process.argv[2] || '.vitepress/dist'
const chunks = join(DIST, 'assets', 'chunks')
const queries = JSON.parse(readFileSync(new URL('./search-queries.json', import.meta.url), 'utf8'))
const problems = []
let ran = 0
for (const [locale, list] of Object.entries(queries)) {
  const file = readdirSync(chunks).find((f) => f.startsWith(`@localSearchIndex${locale}.`) && f.endsWith('.js'))
  if (!file) {
    problems.push(`${locale}: no search index in the build`)
    continue
  }
  const json = (await import(pathToFileURL(join(chunks, file)).href)).default
  const index = MiniSearch.loadJSON(json, {
    fields: ['title', 'titles', 'text'],
    storeFields: ['title', 'titles'],
    tokenize,
    processTerm,
    searchOptions: { fuzzy: 0.2, prefix: true, boost: { title: 4, text: 2, titles: 1 }, tokenize, processTerm },
  })
  for (const [q, want] of list) {
    ran++
    const ids = index.search(q).slice(0, 5).map((r) => String(r.id))
    if (!ids.some((id) => new RegExp(want).test(id))) problems.push(`${locale} "${q}": wanted ${want}, got ${ids.join(' , ') || 'nothing'}`)
  }
}
if (problems.length) {
  console.error(problems.join('\n'))
  process.exit(1)
}
console.log(`search: ok (${ran} queries)`)
