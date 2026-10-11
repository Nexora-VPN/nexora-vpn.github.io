<script setup lang="ts">
// A terminal that types its commands and prints their output once it scrolls
// into view. Written in a page as a ```terminal fence (see wiki.ts): lines
// starting with "$ " are commands, the rest is output. The whole session is in
// the page's HTML from the start; only the reveal is animated, and not at all
// for a reader who asked for less motion. Copy takes the commands only.
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { useData } from 'vitepress'

const props = defineProps<{ data: string; title?: string }>()
type Line = { cmd: boolean; text: string }
const lines = computed<Line[]>(() => {
  const raw = decodeURIComponent(escape(atob(props.data)))
  return raw.split('\n').map((l) => (l.startsWith('$ ') ? { cmd: true, text: l.slice(2) } : { cmd: false, text: l }))
})

const { lang } = useData()
const WORDS = {
  en: { copy: 'Copy commands', copied: 'Copied', replay: 'Play again' },
  fa: { copy: 'کپی دستورها', copied: 'کپی شد', replay: 'پخش دوباره' },
  ru: { copy: 'Копировать команды', copied: 'Скопировано', replay: 'Повторить' },
  zh: { copy: '复制命令', copied: '已复制', replay: '重新播放' },
} as const
const w = computed(() => WORDS[lang.value.slice(0, 2) as keyof typeof WORDS] ?? WORDS.en)

// shown: lines fully visible; typing: characters of the line being typed.
const shown = ref(Infinity)
const typing = ref(0)
const done = ref(true)
const copied = ref(false)
const el = ref<HTMLElement>()
let timer: ReturnType<typeof setTimeout> | undefined
let observer: IntersectionObserver | undefined

function step() {
  const i = shown.value
  if (i >= lines.value.length) {
    done.value = true
    return
  }
  const line = lines.value[i]
  if (line.cmd && typing.value < line.text.length) {
    typing.value++
    timer = setTimeout(step, 22 + Math.random() * 30)
    return
  }
  shown.value++
  typing.value = 0
  const next = lines.value[shown.value]
  timer = setTimeout(step, line.cmd ? 420 : next?.cmd ? 500 : 110)
}

function play() {
  clearTimeout(timer)
  shown.value = 0
  typing.value = 0
  done.value = false
  timer = setTimeout(step, 300)
}

onMounted(() => {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
  shown.value = 0
  done.value = false
  observer = new IntersectionObserver(
    (entries) => {
      if (entries.some((e) => e.isIntersecting)) {
        observer?.disconnect()
        play()
      }
    },
    { threshold: 0.4 },
  )
  if (el.value) observer.observe(el.value)
})
onBeforeUnmount(() => {
  clearTimeout(timer)
  observer?.disconnect()
})

async function copy() {
  const text = lines.value.filter((l) => l.cmd).map((l) => l.text).join('\n')
  try {
    await navigator.clipboard.writeText(text)
    copied.value = true
    setTimeout(() => (copied.value = false), 1600)
  } catch {
    // Clipboard refused: the commands are on the page to select by hand.
  }
}
</script>

<template>
  <div ref="el" class="nx-terminal" dir="ltr">
    <div class="bar">
      <span class="dots" aria-hidden="true"><i></i><i></i><i></i></span>
      <span class="title">{{ title }}</span>
      <button v-if="done && shown !== Infinity" type="button" class="act" @click="play">
        <i class="pi pi-replay" aria-hidden="true"></i> {{ w.replay }}
      </button>
      <button type="button" class="act" @click="copy">
        <i :class="['pi', copied ? 'pi-check' : 'pi-copy']" aria-hidden="true"></i> {{ copied ? w.copied : w.copy }}
      </button>
    </div>
    <pre><template v-for="(l, i) in lines" :key="i"><span
      v-if="i < shown || (i === shown && l.cmd)" :class="l.cmd ? 'cmd' : 'out'"
      ><span v-if="l.cmd" class="prompt">$ </span>{{ i < shown ? l.text : l.text.slice(0, typing) }}<span
        v-if="i === shown && !done" class="caret"></span>
</span></template></pre>
  </div>
</template>
