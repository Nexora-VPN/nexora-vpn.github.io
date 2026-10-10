<script setup lang="ts">
// Under a page: the pages that link to it, and the pages sharing its tags.
import { computed } from 'vue'
import { useData, withBase } from 'vitepress'
import { words } from './i18n'

type Ref = { title: string; link: string; description?: string }
const { frontmatter, lang } = useData()
const backlinks = computed(() => (frontmatter.value.nx?.backlinks ?? []) as Ref[])
const related = computed(() => {
  const seen = new Set(backlinks.value.map((r) => r.link))
  return ((frontmatter.value.nx?.related ?? []) as Ref[]).filter((r) => !seen.has(r.link))
})
const w = computed(() => words(lang.value))
</script>

<template>
  <div v-if="backlinks.length || related.length" class="nx-links">
    <section v-if="backlinks.length">
      <h2>{{ w.backlinks }}</h2>
      <ul>
        <li v-for="r in backlinks" :key="r.link"><a :href="withBase(r.link)">{{ r.title }}</a></li>
      </ul>
    </section>
    <section v-if="related.length">
      <h2>{{ w.related }}</h2>
      <ul>
        <li v-for="r in related" :key="r.link"><a :href="withBase(r.link)">{{ r.title }}</a></li>
      </ul>
    </section>
  </div>
</template>
