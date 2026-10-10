import { defineConfig } from 'vitepress'
import { locales, searchLocales } from './locales'

// The site answers on docs.nexora-panel.org only (src/public/CNAME, and the
// custom domain set on the repository's Pages settings), so it lives at the
// root. Nothing here may load from another host: fonts and icons are bundled.
export default defineConfig({
  srcDir: 'src',
  base: '/',
  title: 'Nexora Docs',
  cleanUrls: true,
  lastUpdated: true,
  sitemap: { hostname: 'https://docs.nexora-panel.org' },
  head: [
    ['link', { rel: 'icon', type: 'image/png', href: '/nexora-mark.png' }],
    ['meta', { name: 'theme-color', content: '#6d4aff' }],
  ],
  locales,
  themeConfig: {
    logo: { src: '/nexora-mark.png', alt: 'Nexora' },
    siteTitle: 'Nexora Docs',
    socialLinks: [{ icon: 'github', link: 'https://github.com/Nexora-VPN/panel' }],
    search: {
      provider: 'local',
      options: { locales: searchLocales },
    },
  },
})
