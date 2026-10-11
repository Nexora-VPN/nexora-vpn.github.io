// The API reference, built from the panel's OpenAPI document
// (src/public/openapi.yaml, copied from each panel release). Descriptions are
// Markdown and are rendered here, at build time; the page ships HTML.

import fs from 'node:fs'
import { fileURLToPath } from 'node:url'
import yaml from 'js-yaml'
import { createMarkdownRenderer, defineLoader } from 'vitepress'

const FILE = fileURLToPath(new URL('../src/public/openapi.yaml', import.meta.url))
const METHODS = ['get', 'post', 'put', 'patch', 'delete'] as const

export interface Field { name: string; type: string; required: boolean; desc: string }
export interface Op {
  id: string
  method: string
  path: string
  summary: string
  desc: string
  params: (Field & { in: string })[]
  body?: { ref?: string; fields: Field[] }
  responses: { code: string; desc: string; ref?: string }[]
}
export interface Data {
  intro: string
  version: string
  tags: { name: string; desc: string; ops: Op[] }[]
  schemas: { name: string; desc: string; fields: Field[] }[]
}

declare const data: Data
export { data }

export default defineLoader({
  watch: [FILE],
  async load(): Promise<Data> {
    const md = await createMarkdownRenderer(fileURLToPath(new URL('../src', import.meta.url)))
    const html = (s?: string) => (s ? md.render(String(s)) : '')
    const doc = yaml.load(fs.readFileSync(FILE, 'utf8')) as any
    const comp = doc.components ?? {}
    const deref = (o: any): any => {
      if (o && o.$ref) {
        const parts = o.$ref.replace('#/', '').split('/')
        return parts.reduce((a: any, k: string) => a?.[k], doc)
      }
      return o
    }
    const refName = (o: any) => (o?.$ref ? o.$ref.split('/').pop() : undefined)
    const typeOf = (s: any): string => {
      if (!s) return ''
      if (s.$ref) return refName(s)!
      if (s.type === 'array') return `${typeOf(s.items)}[]`
      if (s.enum) return s.enum.map((e: any) => JSON.stringify(e)).join(' | ')
      return s.type ?? (s.oneOf ? 'one of' : 'object')
    }
    const fieldsOf = (schema: any): Field[] => {
      const s = deref(schema)
      if (!s?.properties) return []
      const req = new Set(s.required ?? [])
      return Object.entries(s.properties).map(([name, p]: [string, any]) => ({
        name,
        type: typeOf(p),
        required: req.has(name),
        desc: html(p.description ?? deref(p)?.description),
      }))
    }

    const byTag = new Map<string, Op[]>()
    for (const [path, item] of Object.entries<any>(doc.paths ?? {})) {
      for (const m of METHODS) {
        const op = item[m]
        if (!op) continue
        const params = [...(item.parameters ?? []), ...(op.parameters ?? [])].map(deref).map((p: any) => ({
          name: p.name,
          in: p.in,
          type: typeOf(p.schema),
          required: !!p.required,
          desc: html(p.description),
        }))
        const bodySchema = op.requestBody ? deref(op.requestBody)?.content?.['application/json']?.schema : undefined
        const entry: Op = {
          id: `${m}-${path}`.replace(/[^a-zA-Z0-9]+/g, '-').replace(/-+$/, ''),
          method: m.toUpperCase(),
          path,
          summary: op.summary ?? '',
          desc: html(op.description),
          params,
          body: bodySchema ? { ref: refName(bodySchema), fields: fieldsOf(bodySchema) } : undefined,
          responses: Object.entries<any>(op.responses ?? {}).map(([code, r]) => {
            const rr = deref(r)
            return { code, desc: html(rr?.description), ref: refName(rr?.content?.['application/json']?.schema) }
          }),
        }
        const tag = op.tags?.[0] ?? 'other'
        byTag.set(tag, [...(byTag.get(tag) ?? []), entry])
      }
    }
    const tags = (doc.tags ?? []).map((t: any) => ({ name: t.name, desc: html(t.description), ops: byTag.get(t.name) ?? [] }))
    for (const [name, ops] of byTag) if (!tags.some((t: any) => t.name === name)) tags.push({ name, desc: '', ops })
    return {
      intro: html(doc.info?.description),
      version: String(doc.info?.version ?? ''),
      tags: tags.filter((t: any) => t.ops.length),
      schemas: Object.entries<any>(comp.schemas ?? {})
        .map(([name, s]) => ({ name, desc: html(s.description), fields: fieldsOf(s) }))
        .sort((a, b) => a.name.localeCompare(b.name)),
    }
  },
})
