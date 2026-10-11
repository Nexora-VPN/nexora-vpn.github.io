// The wiki layer: an index of every page, `[[…]]` links resolved against it,
// and the per-page facts the theme draws (tags, links here, related pages).
//
// Link syntax, inside any page:
//   [[users]]                 a page, by its path id or its unique last segment
//   [[use/users|text]]        the same with its own text
//   [[users#limits]]          a heading on that page
//   [[~inbound]]              a glossary term: links to it and shows its card
//   [[~inbound|inbounds]]     the same with its own text
// A link is resolved in the page's own language. One that resolves to nothing
// fails the build, in dev as in CI.

import fs from 'node:fs'
import path from 'node:path'
import matter from 'gray-matter'
import type MarkdownIt from 'markdown-it'
import type { PageData } from 'vitepress'
import { TAGS, type Lang } from './tags'

export const LANGS: Lang[] = ['en', 'fa', 'ru', 'zh']
const GLOSSARY = 'reference/glossary'

export interface Term {
  title: string
  def: string
}

export interface Page {
  lang: Lang
  id: string
  key: string
  link: string
  title: string
  description: string
  tags: string[]
  out: Set<string>
  anchors: Set<string>
  terms: Map<string, Term>
}

export type Index = Map<string, Page> // key = `${lang}:${id}`

// `fa/use/users.md` → ['fa', 'use/users']; `use/users.md` → ['en', 'use/users'].
export function locate(relativePath: string): [Lang, string] {
  const rel = relativePath.replace(/\\/g, '/').replace(/\.md$/, '')
  const first = rel.split('/')[0]
  if (first === 'fa' || first === 'ru' || first === 'zh') return [first, rel.slice(first.length + 1)]
  return ['en', rel]
}

function linkOf(lang: Lang, id: string): string {
  const prefix = lang === 'en' ? '' : `/${lang}`
  if (id === 'index') return `${prefix}/`
  if (id.endsWith('/index')) return `${prefix}/${id.slice(0, -'index'.length)}`
  return `${prefix}/${id}`
}

// A heading's anchor as VitePress makes it (`{#id}` wins).
function slug(text: string): string {
  return text
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[\u0000-\u001f]/g, '')
    .replace(/[\s~`!@#$%^&*()\-_+=[\]{}|\\;:"'“”‘’<>,.?/]+/g, '-')
    .replace(/-{2,}/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/^(\d)/, '_$1')
    .toLowerCase()
}

// Markdown → plain text, for a glossary card.
export function plain(md: string): string {
  return md
    .replace(/\[\[~?([^\]|#]+)(?:#[^\]|]*)?\|([^\]]+)\]\]/g, '$2')
    .replace(/\[\[~?([^\]|#]+)(?:#[^\]]*)?\]\]/g, (_, t) => t.split('/').pop())
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
    .replace(/[*_`]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

function stripCode(body: string): string {
  return body.replace(/^(```|~~~)[\s\S]*?^\1/gm, '').replace(/`[^`\n]*`/g, '')
}

function parsePage(srcDir: string, file: string): Page {
  const rel = path.relative(srcDir, file).replace(/\\/g, '/')
  const [lang, id] = locate(rel)
  const { data, content } = matter(fs.readFileSync(file, 'utf8'))
  const body = stripCode(content)
  const h1 = body.match(/^#\s+(.+?)(?:\s+\{#[^}]+\})?\s*$/m)
  const title = String(data.title ?? h1?.[1] ?? data.hero?.name ?? id)
  const anchors = new Set<string>()
  const terms = new Map<string, Term>()
  const lines = body.split('\n')
  lines.forEach((line, i) => {
    const h = line.match(/^#{2,6}\s+(.+?)(?:\s+\{#([^}]+)\})?\s*$/)
    if (!h) return
    const anchor = h[2] ?? slug(h[1])
    anchors.add(anchor)
    if (id === GLOSSARY && line.startsWith('## ')) {
      const para: string[] = []
      for (let j = i + 1; j < lines.length; j++) {
        const l = lines[j].trim()
        if (!l) {
          if (para.length) break
          continue
        }
        if (l.startsWith('#')) break
        para.push(l)
      }
      terms.set(anchor, { title: h[1].trim(), def: plain(para.join(' ')) })
    }
  })
  return {
    lang,
    id,
    key: `${lang}:${id}`,
    link: linkOf(lang, id),
    title,
    description: String(data.description ?? ''),
    tags: Array.isArray(data.tags) ? data.tags.map(String) : [],
    out: new Set(),
    anchors,
    terms,
  }
}

function* markdownFiles(dir: string): Generator<string> {
  for (const name of fs.readdirSync(dir)) {
    if (name === 'public' || name.startsWith('.')) continue
    const p = path.join(dir, name)
    if (fs.statSync(p).isDirectory()) yield* markdownFiles(p)
    else if (name.endsWith('.md')) yield p
  }
}

let cached: { at: number; srcDir: string; index: Index } | undefined

// Rebuilt at most once a second, so dev picks up new pages and links.
export function getIndex(srcDir: string): Index {
  const now = Date.now()
  if (cached && cached.srcDir === srcDir && now - cached.at < 1000) return cached.index
  const index: Index = new Map()
  const bodies = new Map<string, string>()
  for (const file of markdownFiles(srcDir)) {
    const page = parsePage(srcDir, file)
    index.set(page.key, page)
    bodies.set(page.key, stripCode(matter(fs.readFileSync(file, 'utf8')).content))
  }
  for (const [key, body] of bodies) {
    const page = index.get(key)!
    for (const m of body.matchAll(/\[\[([^\]\n]+)\]\]/g)) {
      try {
        const r = resolve(index, page.lang, m[1])
        if (r.page.key !== key) page.out.add(r.page.key)
      } catch {
        // reported by the renderer, with the page and the link
      }
    }
  }
  cached = { at: now, srcDir, index }
  return index
}

export interface Resolved {
  page: Page
  href: string
  text: string
  term?: Term
}

export function resolve(index: Index, lang: Lang, inner: string): Resolved {
  const [target, label] = inner.split('|').map((s) => s.trim())
  if (target.startsWith('~')) {
    const termId = target.slice(1)
    const glossary = index.get(`${lang}:${GLOSSARY}`)
    if (!glossary) throw new Error(`no glossary in "${lang}" for [[${inner}]]`)
    const term = glossary.terms.get(termId)
    if (!term) throw new Error(`no glossary term "${termId}" in "${lang}"`)
    return { page: glossary, href: `${glossary.link}#${termId}`, text: label || term.title, term }
  }
  const [ref, anchor] = target.split('#')
  let page = index.get(`${lang}:${ref}`) ?? index.get(`${lang}:${ref}/index`)
  if (!page) {
    const matches = [...index.values()].filter((p) => p.lang === lang && p.id.split('/').pop() === ref)
    if (matches.length > 1) throw new Error(`[[${inner}]] is ambiguous: ${matches.map((p) => p.id).join(', ')}`)
    page = matches[0]
  }
  if (!page) throw new Error(`[[${inner}]] names no page in "${lang}"`)
  if (anchor && !page.anchors.has(anchor)) throw new Error(`[[${inner}]]: "${page.id}" has no heading #${anchor}`)
  return { page, href: anchor ? `${page.link}#${anchor}` : page.link, text: label || page.title }
}

export function wikiLinks(md: MarkdownIt, srcDir: string) {
  md.inline.ruler.before('link', 'nx_wikilink', (state, silent) => {
    const { src, pos } = state
    if (src.charCodeAt(pos) !== 0x5b || src.charCodeAt(pos + 1) !== 0x5b) return false
    const end = src.indexOf(']]', pos + 2)
    if (end < 0) return false
    const inner = src.slice(pos + 2, end)
    if (!inner.trim() || inner.includes('[')) return false
    if (!silent) {
      const rel: string = state.env?.relativePath ?? ''
      const [lang] = locate(rel)
      let r: Resolved
      try {
        r = resolve(getIndex(srcDir), lang, inner)
      } catch (e) {
        throw new Error(`${rel}: ${(e as Error).message}`)
      }
      const open = state.push('link_open', 'a', 1)
      open.attrSet('href', r.href)
      if (r.term) {
        open.attrSet('class', 'nx-term')
        open.attrSet('data-term', r.term.title)
        open.attrSet('data-def', r.term.def)
      } else {
        open.attrSet('class', 'nx-wl')
      }
      const text = state.push('text', '', 0)
      text.content = r.text
      state.push('link_close', 'a', -1)
    }
    state.pos = end + 2
    return true
  })
}

export interface Ref {
  title: string
  link: string
  description?: string
}

function ref(p: Page): Ref {
  return { title: p.title, link: p.link, description: p.description || undefined }
}

const byTitle = (a: Ref, b: Ref) => a.title.localeCompare(b.title)

// Puts what the theme draws around a page into its front-matter: `nx.tags`,
// `nx.backlinks`, `nx.related`, and on the tag page `nx.tagIndex`.
export function pageFacts(pageData: PageData, srcDir: string) {
  const index = getIndex(srcDir)
  const [lang, id] = locate(pageData.relativePath)
  const page = index.get(`${lang}:${id}`)
  if (!page) return
  for (const t of page.tags) {
    if (!TAGS[t]) throw new Error(`${pageData.relativePath}: unknown tag "${t}" (add it to .vitepress/tags.ts)`)
  }
  const tagsLink = linkOf(lang, 'tags')
  const same = [...index.values()].filter((p) => p.lang === lang && p.key !== page.key && p.id !== 'index')
  const backlinks = same.filter((p) => p.out.has(page.key)).map(ref).sort(byTitle)
  const related = same
    .map((p) => ({ p, n: p.tags.filter((t) => page.tags.includes(t)).length }))
    .filter((x) => x.n > 0)
    .sort((a, b) => b.n - a.n || a.p.title.localeCompare(b.p.title))
    .slice(0, 8)
    .map((x) => ref(x.p))
  const nx: Record<string, unknown> = {
    tags: page.tags.map((t) => ({ id: t, label: TAGS[t][lang], link: `${tagsLink}#${t}` })),
    backlinks,
    related,
  }
  if (id === 'tags') {
    nx.tagIndex = Object.keys(TAGS)
      .map((t) => ({
        id: t,
        label: TAGS[t][lang],
        pages: [...index.values()].filter((p) => p.lang === lang && p.tags.includes(t)).map(ref).sort(byTitle),
      }))
      .filter((t) => t.pages.length > 0)
  }
  pageData.frontmatter.nx = nx
}

// Tag labels added to the text the search index sees, so a search for a tag
// finds the pages that carry it.
export function tagWords(frontmatter: Record<string, unknown> | undefined, lang: Lang): string {
  const tags = Array.isArray(frontmatter?.tags) ? (frontmatter!.tags as string[]) : []
  return tags.map((t) => TAGS[t]?.[lang] ?? '').filter(Boolean).join(' · ')
}

// ```terminal title="…" fences become an animated <NxTerminal>. The session
// travels base64-encoded so no character in it can break the attribute.
export function terminalFences(md: MarkdownIt) {
  const fence = md.renderer.rules.fence!
  md.renderer.rules.fence = (tokens, idx, options, env, self) => {
    const token = tokens[idx]
    const info = token.info.trim()
    if (!info.startsWith('terminal')) return fence(tokens, idx, options, env, self)
    const title = info.match(/title="([^"]*)"/)?.[1] ?? ''
    const data = Buffer.from(token.content.replace(/\n$/, ''), 'utf8').toString('base64')
    return `<NxTerminal data="${data}" title="${md.utils.escapeHtml(title)}" />\n`
  }
}
