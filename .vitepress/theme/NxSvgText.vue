<script setup lang="ts">
// Text inside an SVG picture, as HTML: it wraps, and Persian and Latin mixed
// in one label keep their order, which an SVG <text> does not promise.
defineProps<{ x: number; y: number; w: number; h: number; align?: 'start' | 'center' | 'end' }>()
</script>

<template>
  <foreignObject :x="x" :y="y" :width="w" :height="h">
    <div class="nx-svg-text" :class="align ?? 'center'"><slot /></div>
  </foreignObject>
</template>
