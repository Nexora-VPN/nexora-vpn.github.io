<script setup lang="ts">
// The tag page: every tag in use, then each tag's pages under its own heading
// (the anchor a tag chip links to).
import { computed } from 'vue'
import { useData, withBase } from 'vitepress'
import { words } from './i18n'

type Ref = { title: string; link: string; description?: string }
type Tag = { id: string; label: string; pages: Ref[] }
const { frontmatter, lang } = useData()
const tags = computed(() => (frontmatter.value.nx?.tagIndex ?? []) as Tag[])
const w = computed(() => words(lang.value))
</script>

<template>
  <div class="nx-tag-index">
    <nav class="nx-tags" :aria-label="w.allTags">
      <a v-for="t in tags" :key="t.id" :href="`#${t.id}`" class="nx-tag">
        <i class="pi pi-hashtag" aria-hidden="true"></i>{{ t.label }} <span class="nx-count">{{ t.pages.length }}</span>
      </a>
    </nav>
    <section v-for="t in tags" :key="t.id">
      <h2 :id="t.id" tabindex="-1">
        {{ t.label }}
        <a class="header-anchor" :href="`#${t.id}`" :aria-label="t.label"></a>
      </h2>
      <ul>
        <li v-for="p in t.pages" :key="p.link">
          <a :href="withBase(p.link)">{{ p.title }}</a>
          <span v-if="p.description" class="nx-desc"> — {{ p.description }}</span>
        </li>
      </ul>
    </section>
  </div>
</template>
