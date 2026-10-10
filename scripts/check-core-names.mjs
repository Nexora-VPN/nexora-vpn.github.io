// The core-name rule (docs-site.md P4, owner 2026-10-11): the site may name
// sing-box and Xray as *client* software — a sing-box subscription, sing-box
// apps, Xray-based clients, the `singbox` / `xray` format identifiers — and
// must never say or imply that Nexora is built on, inherits from or contains
// their code.
//
// A word ban cannot tell those apart, so this is an allow-list: every mention
// must sit next to a client word in one of the four languages, be a format
// identifier or a URL, or carry a `core-ok` marker on the same line (for a
// sentence a person has read and accepted). A few phrases are refused even
// then. Anything flagged is rephrased, not marked, unless it is about clients.
//
// usage: node scripts/check-core-names.mjs <dir|file>...  (also used on dist)

import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join, extname } from 'node:path'

const CORE = /sing[\s-]?box|xray/gi

// Refused wherever they appear, marker or not.
const REFUSED = [
  /sagernet/i,
  /\bGPL\b/i,
  /\bv2fly\b/i,
  /xtls\/xray-core/i,
  /(built|based)\s+on\s+(sing[\s-]?box|xray)/i,
  /(fork|forked)\s+(of|from)\s+(sing[\s-]?box|xray)/i,
  /(nexora|node|nodes|panel)\s+(runs?|uses?|embeds?|wraps?)\s+(sing[\s-]?box|xray)/i,
  /(sing[\s-]?box|xray)[\s-]+(core|engine|library|code|kernel|upstream)\b/i,
]

// Words that make a mention about clients. Checked within a few words on
// either side of the core name.
const CLIENT = new RegExp(
  '^(?:' +
  [
    // en
    'apps?', 'applications?', 'clients?', 'subscriptions?', 'formats?', 'profiles?',
    'json', 'links?', 'users?', 'based', 'sfa', 'sfi', 'sfm', 'karing', 'nekobox',
    'v2rayn', 'v2rayng', 'streisand', 'happ', 'hiddify', 'rule[\\s-]?sets?', 'srs',
    // fa
    'اپ', 'اپلیکیشن', 'برنامه', 'کلاینت', 'اشتراک', 'ساب', 'فرمت', 'پروفایل', 'لینک',
    // ru
    'приложени\\p{L}*', 'клиент\\p{L}*', 'подписк\\p{L}*', 'формат\\p{L}*', 'профил\\p{L}*', 'ссылк\\p{L}*',
    // zh
    '客户端', '应用', '订阅', '格式', '配置',
  ].join('|') +
    ')',
  'iu',
)

const TEXT = new Set(['.md', '.vue', '.ts', '.mts', '.js', '.mjs', '.svg', '.html', '.json', '.txt', '.css'])
const SKIP_DIRS = new Set(['node_modules', 'cache', '.git'])

function* files(path) {
  const st = statSync(path)
  if (st.isFile()) {
    if (TEXT.has(extname(path))) yield path
    return
  }
  for (const name of readdirSync(path)) {
    if (SKIP_DIRS.has(name)) continue
    yield* files(join(path, name))
  }
}

function isAllowed(line, index, match) {
  if (/core-ok/.test(line)) return true
  // A format identifier or a path: /sub/{token}/singbox, ?format=xray, `singbox`.
  const around = line.slice(Math.max(0, index - 40), index + match.length + 40)
  if (/\/sub\/|format=|\/singbox|\/xray\b/i.test(around)) return true
  // Part of a URL.
  const urlStart = line.lastIndexOf('http', index)
  if (urlStart !== -1 && !/\s/.test(line.slice(urlStart, index))) return true
  // A client word within four words before or after.
  const before = line.slice(0, index).split(/[\s(),;:،]+/).filter(Boolean).slice(-4)
  const after = line.slice(index + match.length).split(/[\s(),;:،]+/).filter(Boolean).slice(0, 4)
  return [...before, ...after].some((w) => CLIENT.test(w.replace(/^[-–]+/, '')))
}

// Minified bundles carry the theme's own source; only scan what a reader sees.
function textOf(path, raw) {
  if (extname(path) === '.html') return raw.replace(/<script[\s\S]*?<\/script>/gi, '').replace(/<style[\s\S]*?<\/style>/gi, '')
  return raw
}

const targets = process.argv.slice(2)
if (targets.length === 0) {
  console.error('usage: check-core-names.mjs <dir|file>...')
  process.exit(2)
}

const problems = []
for (const target of targets) {
  for (const file of files(target)) {
    if (file.endsWith('check-core-names.mjs')) continue
    if (/\/assets\/.*\.js$/.test(file)) continue
    // A paragraph is checked as one line: Markdown wraps sentences, and the
    // client word may sit on the line before the name.
    const blocks = []
    let at = 1
    for (const block of textOf(file, readFileSync(file, 'utf8')).split(/\n[ \t]*\n/)) {
      blocks.push([at, block.replace(/\s*\n\s*/g, ' ')])
      at += block.split('\n').length + 1
    }
    blocks.forEach(([lineNo, line]) => {
      const i = lineNo - 1
      for (const re of REFUSED) {
        if (re.test(line)) problems.push(`${file}:${i + 1}: refused phrase ${re}: ${line.trim().slice(0, 160)}`)
      }
      for (const m of line.matchAll(CORE)) {
        if (!isAllowed(line, m.index, m[0])) {
          problems.push(`${file}:${i + 1}: "${m[0]}" outside a client context: ${line.trim().slice(0, 160)}`)
        }
      }
    })
  }
}

if (problems.length) {
  console.error(problems.join('\n'))
  console.error(`\n${problems.length} mention(s) break the core-name rule (docs-site.md P4).`)
  process.exit(1)
}
console.log('core-name rule: ok')
