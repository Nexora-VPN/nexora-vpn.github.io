<script setup lang="ts">
// A screenshot of the panel, in the reader's theme and, where one was taken,
// in the reader's language: /shots/<lang>/<page>-<light|dark>.webp, taken by
// nx-panel/tools/docsdemo/shots.sh. Russian and Chinese pages show the
// English panel (docs-site.md P7) unless `own` says the shot exists in theirs.
import { computed } from 'vue'
import { useData, withBase } from 'vitepress'

const props = defineProps<{ page: string; alt: string; caption?: string; own?: boolean }>()
const { lang } = useData()
const dir = computed(() => {
  const l = lang.value.slice(0, 2)
  return l === 'fa' || props.own ? l : 'en'
})
const src = (theme: string) => withBase(`/shots/${dir.value}/${props.page}-${theme}.webp`)
</script>

<template>
  <figure class="nx-shot nx-shot-page">
    <img class="nx-light" :src="src('light')" :alt="alt" width="1440" height="940" loading="lazy" />
    <img class="nx-dark" :src="src('dark')" :alt="alt" width="1440" height="940" loading="lazy" />
    <figcaption v-if="caption">{{ caption }}</figcaption>
  </figure>
</template>
