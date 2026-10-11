<script setup lang="ts">
// Animated tunnel scenes: who dials whom (modes), what a blocked protocol
// costs (pool), and how a user keeps the same exit (sticky). Each scene is a
// short loop of steps drawn from one clock; the words are in tunnelScenes.ts.
// A reader who asked for less motion gets the same steps as still pictures,
// moved by the step buttons. The loop runs only while the figure is on screen.
//
// Every scene has two layouts. The wide one flows left to right on a canvas
// 820 units wide, so that in the text column a unit is about three quarters
// of a pixel. A phone has no room for that, and shrinking it makes the labels
// unreadable, so below 600 px the same scene flows top to bottom on a canvas
// 400 units wide instead.
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { useData } from 'vitepress'
import type { Words } from '../diagrams'
import { SCENES, UI } from '../tunnelScenes'
import T from './NxSvgText.vue'

const props = defineProps<{ scene: 'modes' | 'pool' | 'sticky' }>()
const { lang } = useData()
const key = computed(() => (lang.value.slice(0, 2) as keyof Words) || 'en')
const t = (x?: Words) => (x ? x[key.value] ?? x.en : '')
const sc = computed(() => SCENES[props.scene])
const steps = computed(() => sc.value.steps)
const mode = ref(sc.value.modes?.[0] ?? '')
const variant = (x: Words | Record<string, Words>) => ('en' in x ? (x as Words) : (x as Record<string, Words>)[mode.value])
const modeLabel = (m: string) => t((UI as Record<string, Words>)[m])

// ---- the clock ----
const time = ref(0)
const playing = ref(false)
const motion = ref(true)
const tall = ref(false) // the phone layout
const figure = ref<HTMLElement>()
let raf = 0
let last = 0
let onScreen = false
let observer: IntersectionObserver | undefined
let sizer: ResizeObserver | undefined

const total = computed(() => steps.value.reduce((n, s) => n + s.dur, 0))
const startOf = (i: number) => steps.value.slice(0, i).reduce((n, s) => n + s.dur, 0)
const step = computed(() => {
  let acc = 0
  for (let i = 0; i < steps.value.length; i++) {
    acc += steps.value[i].dur
    if (time.value < acc) return i
  }
  return steps.value.length - 1
})
const lt = computed(() => time.value - startOf(step.value)) // seconds into the step
const p = computed(() => clamp(lt.value / steps.value[step.value].dur))

function frame(ts: number) {
  const dt = last ? Math.min(0.1, (ts - last) / 1000) : 0
  last = ts
  time.value = (time.value + dt) % total.value
  raf = requestAnimationFrame(frame)
}
function run() {
  cancelAnimationFrame(raf)
  last = 0
  if (playing.value && onScreen && motion.value) raf = requestAnimationFrame(frame)
}
function toggle() {
  playing.value = !playing.value
  run()
}
function goto(i: number) {
  // A still picture shows a step as it ends; a playing one starts it.
  time.value = motion.value && playing.value ? startOf(i) : startOf(i) + steps.value[i].dur * 0.999
}
function restart() {
  time.value = 0
  playing.value = motion.value
  run()
}

onMounted(() => {
  if (figure.value) {
    sizer = new ResizeObserver(([e]) => (tall.value = e.contentRect.width < 600))
    sizer.observe(figure.value)
  }
  motion.value = !window.matchMedia('(prefers-reduced-motion: reduce)').matches
  if (!motion.value) {
    goto(0)
    return
  }
  observer = new IntersectionObserver(
    ([e]) => {
      onScreen = e.isIntersecting
      if (onScreen && !playing.value && time.value === 0) playing.value = true
      run()
    },
    { threshold: 0.2 },
  )
  if (figure.value) observer.observe(figure.value)
})
onBeforeUnmount(() => {
  cancelAnimationFrame(raf)
  observer?.disconnect()
  sizer?.disconnect()
})

// ---- geometry ----
type Pt = [number, number]
interface R {
  x: number
  y: number
  w: number
  h: number
}
function clamp(x: number, a = 0, b = 1) {
  return Math.max(a, Math.min(b, x))
}
// Progress through a sub-span [a, b] of the step.
const seg = (a: number, b: number) => clamp((p.value - a) / (b - a))
const ease = (x: number) => (x < 0.5 ? 2 * x * x : 1 - (-2 * x + 2) ** 2 / 2)
const lerp = (a: number, b: number, f: number) => a + (b - a) * f
const mix = (a: Pt, b: Pt, f: number): Pt => [lerp(a[0], b[0], f), lerp(a[1], b[1], f)]
function along(pts: Pt[], f: number): Pt {
  const lens = pts.slice(1).map((q, i) => Math.hypot(q[0] - pts[i][0], q[1] - pts[i][1]))
  let d = clamp(f) * lens.reduce((a, b) => a + b, 0)
  for (let i = 0; i < lens.length; i++) {
    if (d <= lens[i] || i === lens.length - 1) return mix(pts[i], pts[i + 1], lens[i] ? Math.min(1, d / lens[i]) : 0)
    d -= lens[i]
  }
  return pts[pts.length - 1]
}
const path = (pts: Pt[]) => pts.map(([x, y], i) => `${i ? 'L' : 'M'}${x},${y}`).join(' ')
// Where a repeating packet is, as a fraction of its path. A still picture
// spreads the packets along the path instead.
function cyc(period: number, offset = 0) {
  if (!motion.value) return (0.25 + offset / period) % 1
  return ((((lt.value + offset) % period) + period) % period) / period
}
// n packets on one path, evenly spaced in time.
function stream(pts: Pt[], n: number, period: number, shift = 0): Pt[] {
  return Array.from({ length: n }, (_, i) => along(pts, cyc(period, shift + (i * period) / n)))
}

interface Box extends R {
  id: string
  kind: string
  icon: string
  label: string
  sub?: string
  tall?: boolean
  cls?: string
}

// ---- scene: modes ----
const MODES_WIDE = {
  W: 820,
  H: 328,
  panel: { x: 330, y: 6, w: 160, h: 48 },
  apps: { x: 4, y: 194, w: 104, h: 64 },
  relay: { x: 140, y: 96, w: 240, h: 224 },
  origin: { x: 520, y: 96, w: 180, h: 224 },
  net: { x: 714, y: 194, w: 102, h: 64 },
  control: [
    [[410, 54], [410, 74], [260, 74], [260, 96]],
    [[410, 54], [410, 74], [610, 74], [610, 96]],
  ] as Pt[][],
  appsLine: [[108, 226], [150, 226]] as Pt[],
  netLine: [[700, 226], [714, 226]] as Pt[],
  inbound: { x: 150, y: 186, w: 110, h: 80 },
  relayPort: { x: 266, y: 186, w: 106, h: 80 },
  originPort: { x: 530, y: 186, w: 116, h: 80 },
  links: [0, 1, 2, 3].map((i) => ({ relay: [380, 200 + 17 * i] as Pt, origin: [520, 200 + 17 * i] as Pt })),
  caption: { x: 380, y: 138, w: 140, h: 56 },
  streamCaption: { x: 380, y: 258, w: 140, h: 56 },
  arrows: { reverse: '←', direct: '→', stream: '→' },
  userPath: [[108, 226], [150, 226], [205, 226]] as Pt[],
  streamPath: [[205, 226], [250, 220], [380, 217], [520, 217], [600, 224], [700, 226], [714, 226]] as Pt[],
  exit: { x: 708, y: 264, w: 108, h: 60 },
}
const MODES_TALL: typeof MODES_WIDE = {
  W: 400,
  H: 630,
  panel: { x: 4, y: 4, w: 128, h: 46 },
  apps: { x: 268, y: 4, w: 128, h: 46 },
  relay: { x: 40, y: 84, w: 356, h: 170 },
  origin: { x: 40, y: 364, w: 356, h: 170 },
  net: { x: 130, y: 566, w: 140, h: 50 },
  control: [
    [[68, 50], [68, 66], [20, 66], [20, 169], [40, 169]],
    [[68, 50], [68, 66], [20, 66], [20, 449], [40, 449]],
  ],
  appsLine: [[332, 50], [332, 70], [305, 70], [305, 150]],
  netLine: [[200, 534], [200, 566]],
  inbound: { x: 230, y: 150, w: 150, h: 84 },
  relayPort: { x: 56, y: 150, w: 150, h: 84 },
  originPort: { x: 56, y: 430, w: 150, h: 84 },
  links: [0, 1, 2, 3].map((i) => ({ relay: [104 + 18 * i, 254] as Pt, origin: [104 + 18 * i, 364] as Pt })),
  caption: { x: 186, y: 262, w: 210, h: 96 },
  streamCaption: { x: 186, y: 262, w: 210, h: 96 },
  arrows: { reverse: '↑', direct: '↓', stream: '↓' },
  userPath: [[332, 50], [332, 70], [305, 70], [305, 192]],
  streamPath: [[305, 192], [206, 192], [122, 230], [122, 254], [122, 364], [260, 380], [340, 440], [340, 520], [200, 534], [200, 566]],
  exit: { x: 280, y: 560, w: 116, h: 62 },
}
const M = computed(() => (tall.value ? MODES_TALL : MODES_WIDE))
const reverse = computed(() => mode.value !== 'direct')
const halves = computed(() => step.value > 0 || p.value > 0.7)
const modeBoxes = computed<Box[]>(() => [
  { id: 'panel', ...M.value.panel, kind: 'panel', icon: 'th-large', label: t(UI.panel) },
  { id: 'apps', ...M.value.apps, kind: 'client', icon: 'mobile', label: t(UI.apps), cls: 'compact' },
  { id: 'relay', ...M.value.relay, kind: 'node', icon: 'server', label: t(UI.relay), sub: halves.value ? t(UI.relayHalf) : '', tall: true },
  { id: 'origin', ...M.value.origin, kind: 'node', icon: 'server', label: t(UI.origin), sub: halves.value ? t(UI.originHalf) : '', tall: true },
  { id: 'net', ...M.value.net, kind: 'internet', icon: 'globe', label: t(UI.internet), cls: 'compact' },
])
const links = computed(() =>
  M.value.links.map((l, i) => {
    const f = step.value < 1 ? 0 : step.value > 1 || !motion.value ? 1 : seg(i * 0.17, i * 0.17 + 0.32)
    const [from, to] = reverse.value ? [l.origin, l.relay] : [l.relay, l.origin]
    const end = mix(from, to, f)
    return { a: from, b: end, f, tip: f > 0 && f < 1, busy: step.value >= 3 && i === 1 }
  }),
)
const backPath = computed(() => [...M.value.streamPath].reverse())

// ---- scene: pool ----
const POOL_WIDE = {
  W: 820,
  H: 360,
  relay: { x: 4, y: 40, w: 210, h: 270 },
  origin: { x: 606, y: 40, w: 210, h: 270 },
  chips: [
    { x: 100, y: 110, w: 106, h: 66 },
    { x: 100, y: 226, w: 106, h: 66 },
  ],
  links: [
    [130, 156].map((y) => ({ relay: [206, y] as Pt, origin: [606, y] as Pt })),
    [246, 272].map((y) => ({ relay: [206, y] as Pt, origin: [606, y] as Pt })),
  ],
  pool: { x: 236, y: 100, w: 348, h: 204 },
  poolCaption: { x: 236, y: 74, w: 348, h: 24 },
  walls: [
    { x: 404, y: 114, w: 14, h: 58 },
    { x: 404, y: 230, w: 14, h: 58 },
  ],
  wallCaptions: [
    { x: 330, y: 174, w: 160, h: 24, align: 'center' as const },
    { x: 330, y: 204, w: 160, h: 24, align: 'center' as const },
  ],
  // Where a retry dies: the side of the wall facing the dialer.
  wallHit: (l: { relay: Pt; origin: Pt }): Pt => [418, l.origin[1]],
  standby: { x: 236, y: 280, w: 348, h: 24 },
  retry: { x: 214, y: 306, w: 392, h: 24 },
  meterCaption: { x: 4, y: 330, w: 228, h: 26 },
  bar: { x: 240, y: 338, w: 280, h: 10 },
  count: { x: 526, y: 330, w: 60, h: 26 },
  exit: { x: 606, y: 324, w: 210, h: 32 },
}
const POOL_TALL: typeof POOL_WIDE = {
  W: 400,
  H: 690,
  relay: { x: 4, y: 20, w: 392, h: 150 },
  origin: { x: 4, y: 470, w: 392, h: 120 },
  chips: [
    { x: 40, y: 84, w: 150, h: 70 },
    { x: 210, y: 84, w: 150, h: 70 },
  ],
  links: [
    [100, 130].map((x) => ({ relay: [x, 154] as Pt, origin: [x, 470] as Pt })),
    [270, 300].map((x) => ({ relay: [x, 154] as Pt, origin: [x, 470] as Pt })),
  ],
  pool: { x: 50, y: 196, w: 300, h: 250 },
  poolCaption: { x: 50, y: 172, w: 300, h: 24 },
  walls: [
    { x: 84, y: 318, w: 62, h: 14 },
    { x: 254, y: 318, w: 62, h: 14 },
  ],
  wallCaptions: [
    { x: 60, y: 336, w: 110, h: 24, align: 'center' as const },
    { x: 230, y: 336, w: 110, h: 24, align: 'center' as const },
  ],
  wallHit: (l) => [l.origin[0], 332],
  standby: { x: 180, y: 410, w: 200, h: 24 },
  retry: { x: 50, y: 414, w: 300, h: 26 },
  meterCaption: { x: 4, y: 604, w: 190, h: 26 },
  bar: { x: 200, y: 612, w: 140, h: 10 },
  count: { x: 346, y: 604, w: 50, h: 26 },
  exit: { x: 100, y: 644, w: 200, h: 32 },
}
const PL = computed(() => (tall.value ? POOL_TALL : POOL_WIDE))
const PROFILES = [
  { name: 'REALITY', port: ':8443' },
  { name: 'WebSocket', port: ':2083' },
]
// Spread loses WebSocket; Priority loses its first profile, REALITY.
const blockedProfile = computed(() => (mode.value === 'priority' ? 0 : 1))
const poolBoxes = computed<Box[]>(() => [
  { id: 'relay', ...PL.value.relay, kind: 'node', icon: 'server', label: t(UI.relay), tall: true },
  { id: 'origin', ...PL.value.origin, kind: 'node', icon: 'server', label: t(UI.origin), sub: `${t(UI.exit)} 203.0.113.20`, tall: true },
])
const poolLinks = computed(() => {
  const out: { a: Pt; b: Pt; relay: Pt; origin: Pt; state: string; i: number }[] = []
  let i = 0
  PL.value.links.forEach((pair, pi) =>
    pair.forEach((l) => {
      const f = step.value > 0 || !motion.value ? 1 : seg(i * 0.18, i * 0.18 + 0.3)
      const blocked = pi === blockedProfile.value && step.value >= 2
      const inUse = mode.value === 'spread' ? true : step.value >= 3 ? pi !== blockedProfile.value : pi === 0
      const state = blocked ? 'blocked' : step.value >= 1 && inUse ? 'busy' : step.value >= 1 ? 'idle' : 'up'
      out.push({ a: l.origin, b: mix(l.origin, l.relay, f), relay: l.relay, origin: l.origin, state, i: i++ })
    }),
  )
  return out
})
const poolPackets = computed(() =>
  poolLinks.value.flatMap((l) => {
    if (step.value < 1) return []
    const fading = l.state === 'blocked' && step.value === 2
    if (l.state !== 'busy' && !fading) return []
    const opacity = fading ? clamp(1 - p.value * 2.2) : 1
    return stream([l.relay, l.origin], 2, 1.8, l.i * 0.45).map(([x, y]) => ({ x, y, opacity }))
  }),
)
const carrying = computed(() => {
  if (step.value < 1) return 0
  const busy = poolLinks.value.filter((l) => l.state === 'busy').length
  // The blocked profile's two links still carry for a moment before they drop.
  if (step.value === 2 && p.value < 0.45) return busy + 2
  return busy
})
// Backoff: tries at growing intervals, each a pulse that dies at the block.
const retries = computed(() => {
  if (step.value !== 4) return []
  const launches = motion.value ? [0.2, 0.9, 2.3] : [0]
  return PL.value.links[blockedProfile.value].flatMap((l) =>
    launches
      .map((at) => (motion.value ? (lt.value - at) / 0.7 : 0.6))
      .filter((f) => f >= 0 && f <= 1)
      .map((f) => {
        const [x, y] = mix(l.origin, PL.value.wallHit(l), f)
        return { x, y, opacity: f > 0.85 ? (1 - f) / 0.15 : 1 }
      }),
  )
})

// ---- scene: sticky ----
const USERS = ['A', 'B', 'C', 'D', 'E', 'F']
const COLORS = ['#6d4aff', '#db2777', '#16a34a', '#d97706', '#0284c7', '#dc2626']
const ORIGINS = [
  { id: 'de', addr: '198.51.100.10' },
  { id: 'nl', addr: '198.51.100.20' },
  { id: 'fi', addr: '198.51.100.30' },
]
const STICKY_WIDE = {
  W: 820,
  H: 396,
  user: (u: number): Pt => [28, 50 + u * 60],
  relay: { x: 150, y: 160, w: 150, h: 80 },
  origin: (o: number): R => ({ x: 560, y: 20 + o * 135, w: 210, h: 90 }),
  slot: (o: number, s: number): Pt => [598 + s * 28, 20 + o * 135 + 70],
  inLine: (u: number): Pt[] => [[42, 50 + u * 60], [150, 200]],
  outLine: (o: number): Pt[] => [[300, 200], [560, 65 + o * 135]],
  same: (o: number): R => ({ x: 420, y: 26 + o * 135, w: 134, h: 24 }),
  sameAlign: 'end' as 'start' | 'center' | 'end',
  cross: [740, 232] as Pt,
  compact: false,
}
const STICKY_TALL: typeof STICKY_WIDE = {
  W: 400,
  H: 420,
  user: (u) => [40 + u * 64, 28],
  relay: { x: 110, y: 100, w: 180, h: 70 },
  origin: (o) => ({ x: 6 + o * 134, y: 300, w: 120, h: 110 }),
  slot: (o, s) => [6 + o * 134 + 24 + s * 28, 388],
  inLine: (u) => [[40 + u * 64, 43], [200, 100]],
  outLine: (o) => [[200, 170], [66 + o * 134, 300]],
  same: (o) => ({ x: 6 + o * 134, y: 262, w: 120, h: 36 }),
  sameAlign: 'center',
  cross: [246, 330],
  compact: true,
}
const ST = computed(() => (tall.value ? STICKY_TALL : STICKY_WIDE))
const HOME = [0, 1, 2, 0, 1, 2] // A→de, B→nl, C→fi, D→de, E→nl, F→fi
const AWAY = [0, 0, 2, 0, 2, 2] // with nl lost: B→de, E→fi
const SLOT_HOME = [0, 0, 0, 1, 1, 1]
const SLOT_AWAY = [0, 2, 0, 1, 2, 1]
const nlLost = computed(() => step.value === 2 || step.value === 3 || (step.value === 4 && p.value < 0.2))
const userPathTo = (u: number, o: number): Pt[] => [...ST.value.inLine(u), ...ST.value.outLine(o)]
const stickyBoxes = computed<Box[]>(() => [
  { id: 'relay', ...ST.value.relay, kind: 'node', icon: 'server', label: t(UI.relay), cls: ST.value.compact ? 'compact' : '' },
  ...ORIGINS.map((o, i) => ({
    id: o.id,
    ...ST.value.origin(i),
    kind: 'node',
    icon: 'server',
    label: `exit-${o.id}`,
    sub: i === 1 && nlLost.value ? t(UI.lost) : o.addr,
    tall: true,
    cls: [i === 1 && nlLost.value ? 'lost' : '', ST.value.compact ? 'compact' : ''].join(' '),
  })),
])
// Where each user's badge is, and whether it shows yet.
const badges = computed(() =>
  USERS.map((name, u) => {
    const moves = HOME[u] !== AWAY[u]
    const home = ST.value.slot(HOME[u], SLOT_HOME[u])
    const away = ST.value.slot(AWAY[u], SLOT_AWAY[u])
    let pos = home
    if (moves && step.value === 3) pos = mix(home, away, ease(motion.value ? seg(0.1, 0.6) : 1))
    else if (moves && step.value === 4) pos = mix(away, home, ease(motion.value ? seg(0.2, 0.7) : 1))
    const shown = step.value > 0 || !motion.value || p.value >= u * 0.13 + 0.32
    return { name, color: COLORS[u], x: pos[0], y: pos[1], shown, dim: moves && step.value === 2 }
  }),
)
const stickyPackets = computed(() => {
  const out: { x: number; y: number; color: string }[] = []
  const add = (u: number, pts: Pt[]) => pts.forEach(([x, y]) => out.push({ x, y, color: COLORS[u] }))
  if (step.value === 0) {
    USERS.forEach((_, u) => {
      const f = motion.value ? seg(u * 0.13, u * 0.13 + 0.32) : 0.6
      if (f > 0 && f < 1) add(u, [along(userPathTo(u, HOME[u]), f)])
    })
  } else if (step.value === 1) {
    ;[0, 1].forEach((u) => add(u, stream(userPathTo(u, HOME[u]), 2, 1.6, u * 0.4)))
  } else if (step.value === 3) {
    ;[1, 4].forEach((u) => add(u, stream(userPathTo(u, AWAY[u]), 2, 1.6, u * 0.3)))
  } else if (step.value === 4 && p.value > 0.55) {
    ;[1, 4].forEach((u) => add(u, stream(userPathTo(u, HOME[u]), 2, 1.6, u * 0.3)))
  }
  return out
})

const boxes = computed(() =>
  props.scene === 'modes' ? modeBoxes.value : props.scene === 'pool' ? poolBoxes.value : stickyBoxes.value,
)
const view = computed(() => {
  const l = props.scene === 'modes' ? M.value : props.scene === 'pool' ? PL.value : ST.value
  return `0 0 ${l.W} ${l.H}`
})
</script>

<template>
  <figure ref="figure" class="nx-diagram nx-tunnel" :class="{ still: !motion, tall }">
    <div class="bar">
      <div v-if="sc.modes" class="modes" role="group">
        <button
          v-for="m in sc.modes"
          :key="m"
          type="button"
          :class="{ on: mode === m }"
          :aria-pressed="mode === m"
          @click="mode = m"
        >
          {{ modeLabel(m) }}
        </button>
      </div>
      <div class="steps" role="group" :aria-label="t(UI.step)">
        <button
          v-for="(s, i) in steps"
          :key="i"
          type="button"
          :class="{ on: step === i }"
          :aria-current="step === i ? 'step' : undefined"
          :title="t(variant(s.title))"
          @click="goto(i)"
        >
          {{ i + 1 }}
        </button>
      </div>
      <div v-if="motion" class="play">
        <button type="button" :aria-label="playing ? t(UI.pause) : t(UI.play)" :title="playing ? t(UI.pause) : t(UI.play)" @click="toggle">
          <i :class="['pi', playing ? 'pi-pause' : 'pi-play']" aria-hidden="true"></i>
        </button>
        <button type="button" :aria-label="t(UI.restart)" :title="t(UI.restart)" @click="restart">
          <i class="pi pi-replay" aria-hidden="true"></i>
        </button>
      </div>
    </div>

    <div class="canvas" dir="ltr">
      <svg :viewBox="view" role="img" :aria-label="t(sc.title)" xmlns="http://www.w3.org/2000/svg">
        <title>{{ t(sc.title) }}</title>

        <!-- what lies under the boxes -->
        <g v-if="scene === 'modes'">
          <g class="control">
            <path v-for="(c, i) in M.control" :key="i" :d="path(c)" class="line dashed" :class="{ faint: step > 0 }" />
            <template v-if="step === 0">
              <circle
                v-for="(c, i) in M.control"
                :key="'c' + i"
                r="5"
                class="packet"
                :cx="along(c, motion ? seg(0, 0.7) : 0.6)[0]"
                :cy="along(c, motion ? seg(0, 0.7) : 0.6)[1]"
              />
            </template>
          </g>
          <g class="traffic">
            <path :d="path(M.appsLine)" class="line" :class="{ faint: step !== 2 }" />
            <path :d="path(M.netLine)" class="line" :class="{ faint: step < 3 }" />
          </g>
        </g>
        <g v-if="scene === 'pool'">
          <rect :x="PL.pool.x" :y="PL.pool.y" :width="PL.pool.w" :height="PL.pool.h" rx="14" class="pool" />
          <T v-bind="PL.poolCaption"><span class="cap">{{ t(UI.pool) }}</span></T>
        </g>
        <g v-if="scene === 'sticky'" class="traffic">
          <path v-for="u in 6" :key="'u' + u" :d="path(ST.inLine(u - 1))" class="line faint" />
          <path v-for="(o, i) in ORIGINS" :key="o.id" :d="path(ST.outLine(i))" class="line" :class="i === 1 && nlLost ? 'cut' : 'faint'" />
        </g>

        <g v-for="b in boxes" :key="b.id" :class="['box', b.kind, b.cls, { tall: b.tall }]">
          <rect :x="b.x" :y="b.y" :width="b.w" :height="b.h" rx="12" />
          <foreignObject :x="b.x" :y="b.y" :width="b.w" :height="b.tall ? 56 : b.h">
            <div class="inner">
              <i :class="['pi', `pi-${b.icon}`]" aria-hidden="true"></i>
              <div>
                <div class="label">{{ b.label }}</div>
                <div v-if="b.sub" class="sub">{{ b.sub }}</div>
              </div>
            </div>
          </foreignObject>
        </g>

        <!-- modes: ports, links, packets -->
        <g v-if="scene === 'modes'">
          <g class="chip" :class="{ hot: step === 2 }">
            <rect v-bind="{ x: M.inbound.x, y: M.inbound.y, width: M.inbound.w, height: M.inbound.h }" rx="8" />
            <T v-bind="M.inbound">{{ t(UI.inbound) }}<b class="mono">:443</b></T>
          </g>
          <g v-if="reverse" class="chip tunnel" :class="{ hot: step === 1 }">
            <rect v-bind="{ x: M.relayPort.x, y: M.relayPort.y, width: M.relayPort.w, height: M.relayPort.h }" rx="8" />
            <T v-bind="M.relayPort">{{ t(UI.tunnelPort) }}<b class="mono">:8443</b></T>
          </g>
          <g v-if="reverse" class="chip none">
            <rect v-bind="{ x: M.originPort.x, y: M.originPort.y, width: M.originPort.w, height: M.originPort.h }" rx="8" />
            <T v-bind="M.originPort"><span class="muted">{{ t(UI.noPort) }}</span></T>
          </g>
          <g v-else class="chip tunnel" :class="{ hot: step === 1 }">
            <rect v-bind="{ x: M.originPort.x, y: M.originPort.y, width: M.originPort.w, height: M.originPort.h }" rx="8" />
            <T v-bind="M.originPort">{{ t(UI.tunnelPort) }}<b class="mono">:8443</b></T>
          </g>

          <g class="links">
            <g v-for="(l, i) in links" :key="i">
              <line v-if="l.f > 0" :x1="l.a[0]" :y1="l.a[1]" :x2="l.b[0]" :y2="l.b[1]" class="link" :class="{ busy: l.busy }" />
              <circle v-if="l.tip" :cx="l.b[0]" :cy="l.b[1]" r="6" class="key" />
            </g>
          </g>
          <T v-if="step === 1" v-bind="M.caption">
            <span class="cap">{{ t(UI.dial) }} ×4 <span dir="ltr">{{ reverse ? M.arrows.reverse : M.arrows.direct }}</span></span>
          </T>
          <T v-if="step >= 3" v-bind="M.streamCaption">
            <span class="cap">{{ t(UI.stream) }} <span dir="ltr">{{ M.arrows.stream }}</span></span>
          </T>

          <g class="traffic">
            <template v-if="step === 2">
              <circle v-for="(q, i) in stream(M.userPath, 3, 1.5)" :key="'u' + i" r="5.5" class="packet" :cx="q[0]" :cy="q[1]" />
            </template>
            <template v-if="step >= 3">
              <circle v-for="(q, i) in stream(M.streamPath, 3, 2.4)" :key="'s' + i" r="5.5" class="packet" :cx="q[0]" :cy="q[1]" />
              <circle v-for="(q, i) in stream(backPath, 2, 2.4, 0.6)" :key="'r' + i" r="4" class="packet back" :cx="q[0]" :cy="q[1]" />
            </template>
          </g>
          <g v-if="step === 4" class="exit">
            <rect v-bind="{ x: M.exit.x, y: M.exit.y, width: M.exit.w, height: M.exit.h }" rx="10" />
            <T v-bind="M.exit">{{ t(UI.sees) }}<b class="mono">203.0.113.20</b></T>
          </g>
        </g>

        <!-- pool: profiles, links, the block -->
        <g v-if="scene === 'pool'">
          <g v-for="(pr, pi) in PROFILES" :key="pr.name" class="chip tunnel" :class="{ cut: pi === blockedProfile && step >= 2 }">
            <rect v-bind="{ x: PL.chips[pi].x, y: PL.chips[pi].y, width: PL.chips[pi].w, height: PL.chips[pi].h }" rx="8" />
            <T v-bind="PL.chips[pi]">{{ pr.name }}<b class="mono">{{ pr.port }}</b></T>
          </g>
          <g class="links">
            <line
              v-for="l in poolLinks"
              :key="l.i"
              :x1="l.a[0]"
              :y1="l.a[1]"
              :x2="l.b[0]"
              :y2="l.b[1]"
              class="link"
              :class="l.state"
              :style="l.state === 'blocked' ? { opacity: step === 2 ? 1 - 0.7 * p : 0.3 } : undefined"
            />
          </g>
          <T v-if="mode === 'priority' && step === 1" v-bind="PL.standby"><span class="cap">{{ t(UI.standby) }}</span></T>
          <g class="traffic">
            <circle v-for="(q, i) in poolPackets" :key="i" r="5.5" class="packet" :cx="q.x" :cy="q.y" :opacity="q.opacity" />
          </g>
          <g v-if="step >= 2" class="wall" :style="{ opacity: step === 2 ? clamp(p * 3) : 1 }">
            <rect
              v-bind="{ x: PL.walls[blockedProfile].x, y: PL.walls[blockedProfile].y, width: PL.walls[blockedProfile].w, height: PL.walls[blockedProfile].h }"
              rx="3"
            />
            <T v-bind="PL.wallCaptions[blockedProfile]"><span class="cap bad">{{ t(UI.blocked) }}</span></T>
          </g>
          <g class="control">
            <circle v-for="(q, i) in retries" :key="i" r="4.5" class="packet" :cx="q.x" :cy="q.y" :opacity="q.opacity" />
          </g>
          <T v-if="step === 4" v-bind="PL.retry"><span class="cap">{{ t(UI.retry) }}</span></T>
          <g class="meter">
            <T v-bind="PL.meterCaption" align="end"><span class="cap">{{ t(UI.carrying) }}</span></T>
            <rect :x="PL.bar.x" :y="PL.bar.y" :width="PL.bar.w" :height="PL.bar.h" rx="5" class="track" />
            <rect :x="PL.bar.x" :y="PL.bar.y" :width="PL.bar.w * (carrying / 4)" :height="PL.bar.h" rx="5" class="fill" />
            <T v-bind="PL.count" align="start"><b class="mono">{{ carrying }}/4</b></T>
          </g>
          <g v-if="step >= 3" class="exit">
            <rect v-bind="{ x: PL.exit.x, y: PL.exit.y, width: PL.exit.w, height: PL.exit.h }" rx="10" />
            <T v-bind="PL.exit">{{ t(UI.unchanged) }} ✓</T>
          </g>
        </g>

        <!-- sticky: users, badges, packets -->
        <g v-if="scene === 'sticky'">
          <g v-for="(u, i) in USERS" :key="u" class="user">
            <circle :cx="ST.user(i)[0]" :cy="ST.user(i)[1]" r="15" :fill="COLORS[i]" />
            <text :x="ST.user(i)[0]" :y="ST.user(i)[1] + 5" text-anchor="middle">{{ u }}</text>
          </g>
          <circle v-for="(q, i) in stickyPackets" :key="i" r="6" :cx="q.x" :cy="q.y" :fill="q.color" />
          <g v-for="b in badges" :key="b.name" class="user badge" :opacity="b.shown ? (b.dim ? 0.35 : 1) : 0">
            <circle :cx="b.x" :cy="b.y" r="11" :fill="b.color" />
            <text :x="b.x" :y="b.y + 4.5" text-anchor="middle">{{ b.name }}</text>
          </g>
          <template v-if="step === 1">
            <T v-for="o in [0, 1]" :key="o" v-bind="ST.same(o)" :align="ST.sameAlign">
              <span class="cap good">{{ t(UI.sameExit) }} ✓</span>
            </T>
          </template>
          <text v-if="nlLost" :x="ST.cross[0]" :y="ST.cross[1]" text-anchor="middle" class="x">✕</text>
        </g>
      </svg>
    </div>

    <div class="note" aria-live="polite">
      <strong>{{ step + 1 }} · {{ t(variant(steps[step].title)) }}</strong>
      <p>{{ t(variant(steps[step].text)) }}</p>
    </div>
  </figure>
</template>
