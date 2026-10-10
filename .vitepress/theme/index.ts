// The default theme without its bundled Inter: the panel's own stack is used
// instead (system faces, Vazirmatn for Persian), all served from this site.
// The wiki layer hangs off the layout's slots.
import { h } from 'vue'
import DefaultTheme from 'vitepress/theme-without-fonts'
import type { Theme } from 'vitepress'
import NxPageLinks from './NxPageLinks.vue'
import NxPageTags from './NxPageTags.vue'
import NxTagIndex from './NxTagIndex.vue'
import NxTermCard from './NxTermCard.vue'
import 'primeicons/primeicons.css'
import './fonts.css'
import './style.css'

export default {
  extends: DefaultTheme,
  Layout: () =>
    h(DefaultTheme.Layout, null, {
      'doc-before': () => h(NxPageTags),
      'doc-after': () => h(NxPageLinks),
      'layout-bottom': () => h(NxTermCard),
    }),
  enhanceApp({ app }) {
    app.component('NxTagIndex', NxTagIndex)
  },
} satisfies Theme
