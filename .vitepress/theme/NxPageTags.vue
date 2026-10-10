<script setup lang="ts">
// Tag chips above a page's text. Each opens that tag's list on the tag page.
import { computed } from 'vue'
import { useData } from 'vitepress'
import { words } from './i18n'

const { frontmatter, lang } = useData()
const tags = computed(() => (frontmatter.value.nx?.tags ?? []) as { id: string; label: string; link: string }[])
const w = computed(() => words(lang.value))
</script>

<template>
  <div v-if="tags.length" class="nx-tags" :aria-label="w.tags">
    <a v-for="t in tags" :key="t.id" :href="t.link" class="nx-tag"><i class="pi pi-hashtag" aria-hidden="true"></i>{{ t.label }}</a>
  </div>
</template>
