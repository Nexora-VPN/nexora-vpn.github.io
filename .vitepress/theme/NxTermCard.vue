<script setup lang="ts">
// The glossary card: hovering or focusing a [[~term]] link shows the term's
// definition beside it. The text rides on the link itself (data-term,
// data-def), written when the page was built, so nothing is fetched.
import { onBeforeUnmount, onMounted, ref } from 'vue'

const open = ref(false)
const title = ref('')
const def = ref('')
const pos = ref({ top: 0, left: 0 })
let hideTimer: ReturnType<typeof setTimeout> | undefined

function place(a: HTMLElement) {
  const r = a.getBoundingClientRect()
  const width = Math.min(340, window.innerWidth - 24)
  let left = r.left + r.width / 2 - width / 2
  left = Math.max(12, Math.min(left, window.innerWidth - width - 12))
  pos.value = { top: r.bottom + window.scrollY + 8, left: left + window.scrollX }
}

function show(e: Event) {
  const a = (e.target as HTMLElement)?.closest?.('a.nx-term') as HTMLElement | null
  if (!a) return
  clearTimeout(hideTimer)
  title.value = a.dataset.term ?? ''
  def.value = a.dataset.def ?? ''
  place(a)
  open.value = true
}

function hide(e: Event) {
  const a = (e.target as HTMLElement)?.closest?.('a.nx-term')
  if (!a) return
  hideTimer = setTimeout(() => (open.value = false), 120)
}

function onKey(e: KeyboardEvent) {
  if (e.key === 'Escape') open.value = false
}

onMounted(() => {
  document.addEventListener('mouseover', show)
  document.addEventListener('focusin', show)
  document.addEventListener('mouseout', hide)
  document.addEventListener('focusout', hide)
  document.addEventListener('keydown', onKey)
})
onBeforeUnmount(() => {
  document.removeEventListener('mouseover', show)
  document.removeEventListener('focusin', show)
  document.removeEventListener('mouseout', hide)
  document.removeEventListener('focusout', hide)
  document.removeEventListener('keydown', onKey)
})
</script>

<template>
  <Teleport to="body">
    <div
      v-if="open"
      class="nx-term-card"
      role="tooltip"
      :style="{ top: `${pos.top}px`, left: `${pos.left}px` }"
    >
      <strong>{{ title }}</strong>
      <p>{{ def }}</p>
    </div>
  </Teleport>
</template>
