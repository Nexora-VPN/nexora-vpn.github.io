import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vitepress'
import { locales, searchLocales } from './locales'
import { processTerm, tokenize } from './search'
import { llmsText, locate, pageFacts, sidebarFor, tagWords, terminalFences, wikiLinks } from './wiki'
import type { Lang } from './tags'

const SRC = fileURLToPath(new URL('../src', import.meta.url))

// Each language's sidebar is built from its pages (wiki.ts sidebarFor).
for (const [key, locale] of Object.entries(locales)) {
  const lang = (key === 'root' ? 'en' : key) as Lang
  locale.themeConfig = { ...locale.themeConfig, sidebar: sidebarFor(SRC, lang) }
}

// The site answers on docs.nexora-panel.org only (src/public/CNAME, and the
// custom domain set on the repository's Pages settings), so it lives at the
// root. Nothing here may load from another host: fonts and icons are bundled.
export default defineConfig({
  srcDir: 'src',
  base: '/',
  title: 'Nexora Docs',
  // The offline bundle (NX_OFFLINE=1) keeps .html in its links, so any plain
  // static server — python3 -m http.server — can serve it from a folder.
  cleanUrls: !process.env.NX_OFFLINE,
  lastUpdated: true,
  sitemap: { hostname: 'https://docs.nexora-panel.org' },
  head: [
    ['link', { rel: 'icon', type: 'image/png', href: '/nexora-mark.png' }],
    ['meta', { name: 'theme-color', content: '#6d4aff' }],
  ],
  locales,
  markdown: {
    config: (md) => {
      wikiLinks(md, SRC)
      terminalFences(md)
    },
  },
  buildEnd(site) {
    llmsText(SRC, site.outDir)
  },
  transformPageData(pageData) {
    pageFacts(pageData, SRC)
  },
  themeConfig: {
    logo: { src: '/nexora-mark.png', alt: 'Nexora' },
    siteTitle: 'Nexora Docs',
    socialLinks: [{ icon: 'github', link: 'https://github.com/Nexora-VPN/panel' }],
    search: {
      provider: 'local',
      options: {
        locales: searchLocales,
        miniSearch: {
          options: { tokenize, processTerm },
          searchOptions: { tokenize, processTerm },
        },
        // The page's tags go into the index with its first section, so a
        // search for a tag's name finds every page carrying it.
        _render(src, env, md) {
          const html = md.render(src, env)
          if (env.frontmatter?.search === false) return ''
          const words = tagWords(env.frontmatter, locate(env.relativePath)[0])
          if (!words) return html
          return html.replace(/(<\/h1>)/, `$1<p>${words}</p>`)
        },
      },
    },
  },
})
