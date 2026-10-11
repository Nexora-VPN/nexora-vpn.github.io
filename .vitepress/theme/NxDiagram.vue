<script setup lang="ts">
// Draws a diagram from .vitepress/diagrams.ts: boxes, arrows, and packets that
// travel along the arrows — unless the reader asked for less motion, in which
// case the picture is the same without the packets.
import { computed, onMounted, ref } from 'vue'
import { useData } from 'vitepress'
import { DIAGRAMS, LEGEND, type Arrow, type Box, type Words } from '../diagrams'

const props = defineProps<{ id: string }>()
const { lang } = useData()
const d = computed(() => DIAGRAMS[props.id])
const key = computed(() => (lang.value.slice(0, 2) as keyof Words) || 'en')
const t = (w?: Words) => (w ? w[key.value] ?? w.en : '')
const moving = ref(false)

onMounted(() => {
  moving.value = !window.matchMedia('(prefers-reduced-motion: reduce)').matches
})

function box(id: string): Box {
  return d.value.boxes.find((b) => b.id === id)!
}

// Where the line from a box's centre towards (tx, ty) leaves the box.
function edge(b: Box, tx: number, ty: number): [number, number] {
  const cx = b.x + b.w / 2
  const cy = b.y + b.h / 2
  const dx = tx - cx
  const dy = ty - cy
  if (dx === 0 && dy === 0) return [cx, cy]
  const sx = dx === 0 ? Infinity : b.w / 2 / Math.abs(dx)
  const sy = dy === 0 ? Infinity : b.h / 2 / Math.abs(dy)
  const s = Math.min(sx, sy)
  return [cx + dx * s, cy + dy * s]
}

function route(a: Arrow): [number, number][] {
  if (a.points) return a.points
  const f = box(a.from)
  const to = box(a.to)
  return [edge(f, to.x + to.w / 2, to.y + to.h / 2), edge(to, f.x + f.w / 2, f.y + f.h / 2)]
}

const pathOf = (pts: [number, number][]) => pts.map(([x, y], i) => `${i ? 'L' : 'M'}${x},${y}`).join(' ')
const reversed = (pts: [number, number][]) => pathOf([...pts].reverse())

function length(pts: [number, number][]) {
  let n = 0
  for (let i = 1; i < pts.length; i++) n += Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1])
  return n
}

const arrows = computed(() =>
  d.value.arrows.map((a, i) => {
    const pts = route(a)
    const [x1, y1] = pts[pts.length - 2]
    const [x2, y2] = pts[pts.length - 1]
    return {
      a,
      i,
      d: pathOf(pts),
      back: reversed(pts),
      head: Math.atan2(y2 - y1, x2 - x1) * (180 / Math.PI),
      end: pts[pts.length - 1],
      dur: `${Math.max(1.6, length(pts) / 140).toFixed(2)}s`,
      delay: `${((i * 0.37) % 1.5).toFixed(2)}s`,
    }
  }),
)
const flows = computed(() => [...new Set(d.value.arrows.map((a) => a.flow))])
</script>

<template>
  <figure v-if="d" class="nx-diagram" dir="ltr">
    <svg
      :viewBox="`0 0 ${d.width} ${d.height}`"
      role="img"
      :aria-label="t(d.title)"
      xmlns="http://www.w3.org/2000/svg"
    >
      <title>{{ t(d.title) }}</title>
      <g class="arrows">
        <g v-for="x in arrows" :key="x.i" :class="['arrow', x.a.flow]">
          <path :d="x.d" class="line" fill="none" />
          <polygon
            class="head"
            points="0,0 -9,-5 -9,5"
            :transform="`translate(${x.end[0]},${x.end[1]}) rotate(${x.head})`"
          />
          <template v-if="moving">
            <circle r="3.5" class="packet">
              <animateMotion :dur="x.dur" :begin="x.delay" repeatCount="indefinite" :path="x.d" />
            </circle>
            <circle v-if="x.a.both" r="3.5" class="packet back">
              <animateMotion :dur="x.dur" :begin="`${parseFloat(x.delay) + 0.8}s`" repeatCount="indefinite" :path="x.back" />
            </circle>
          </template>
        </g>
      </g>
      <g v-for="b in d.boxes" :key="b.id" :class="['box', b.kind]">
        <rect :x="b.x" :y="b.y" :width="b.w" :height="b.h" rx="12" />
        <foreignObject :x="b.x" :y="b.y" :width="b.w" :height="b.h">
          <div class="inner">
            <i :class="['pi', `pi-${b.icon}`]" aria-hidden="true"></i>
            <div>
              <div class="label">{{ t(b.label) }}</div>
              <div v-if="b.sub" class="sub">{{ t(b.sub) }}</div>
            </div>
          </div>
        </foreignObject>
      </g>
    </svg>
    <figcaption>
      <span v-for="f in flows" :key="f" :class="['key', f]"><i></i>{{ t(LEGEND[f]) }}</span>
    </figcaption>
  </figure>
</template>
