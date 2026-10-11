<script setup lang="ts">
// Animated tunnel scenes: who dials whom (modes), what a blocked protocol
// costs (pool), and how a user keeps the same exit (sticky). Each scene is a
// short loop of steps drawn from one clock; the words are in tunnelScenes.ts.
// A reader who asked for less motion gets the same steps as still pictures,
// moved by the step buttons. The loop runs only while the figure is on screen.
//
// The canvas is 820 units wide, so that in the text column a unit is about
// three quarters of a pixel and the labels stay readable.
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
const figure = ref<HTMLElement>()
let raf = 0
let last = 0
let onScreen = false
let observer: IntersectionObserver | undefined

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
    { threshold: 0.35 },
  )
  if (figure.value) observer.observe(figure.value)
})
onBeforeUnmount(() => {
  cancelAnimationFrame(raf)
  observer?.disconnect()
})

// ---- geometry ----
type Pt = [number, number]
function clamp(x: number, a = 0, b = 1) {
  return Math.max(a, Math.min(b, x))
}
// Progress through a sub-span [a, b] of the step.
const seg = (a: number, b: number) => clamp((p.value - a) / (b - a))
const ease = (x: number) => (x < 0.5 ? 2 * x * x : 1 - (-2 * x + 2) ** 2 / 2)
const lerp = (a: number, b: number, f: number) => a + (b - a) * f
function along(pts: Pt[], f: number): Pt {
  const lens = pts.slice(1).map((q, i) => Math.hypot(q[0] - pts[i][0], q[1] - pts[i][1]))
  let d = clamp(f) * lens.reduce((a, b) => a + b, 0)
  for (let i = 0; i < lens.length; i++) {
    if (d <= lens[i] || i === lens.length - 1) {
      const g = lens[i] ? Math.min(1, d / lens[i]) : 0
      return [lerp(pts[i][0], pts[i + 1][0], g), lerp(pts[i][1], pts[i + 1][1], g)]
    }
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

interface Box {
  id: string
  x: number
  y: number
  w: number
  h: number
  kind: string
  icon: string
  label: string
  sub?: string
  tall?: boolean
  cls?: string
}

// ---- scene: modes ----
const reverse = computed(() => mode.value !== 'direct')
const LINK_Y = [200, 217, 234, 251]
const halves = computed(() => step.value > 0 || p.value > 0.7)
const modeBoxes = computed<Box[]>(() => [
  { id: 'panel', x: 330, y: 6, w: 160, h: 48, kind: 'panel', icon: 'th-large', label: t(UI.panel) },
  { id: 'apps', x: 4, y: 194, w: 104, h: 64, kind: 'client', icon: 'mobile', label: t(UI.apps), cls: 'compact' },
  { id: 'relay', x: 140, y: 96, w: 240, h: 224, kind: 'node', icon: 'server', label: t(UI.relay), sub: halves.value ? t(UI.relayHalf) : '', tall: true },
  { id: 'origin', x: 520, y: 96, w: 180, h: 224, kind: 'node', icon: 'server', label: t(UI.origin), sub: halves.value ? t(UI.originHalf) : '', tall: true },
  { id: 'net', x: 714, y: 194, w: 102, h: 64, kind: 'internet', icon: 'globe', label: t(UI.internet), cls: 'compact' },
])
const control: Pt[][] = [
  [[410, 54], [410, 74], [260, 74], [260, 96]],
  [[410, 54], [410, 74], [610, 74], [610, 96]],
]
const links = computed(() =>
  LINK_Y.map((y, i) => {
    const f = step.value < 1 ? 0 : step.value > 1 || !motion.value ? 1 : seg(i * 0.17, i * 0.17 + 0.32)
    const [from, to] = reverse.value ? [520, 380] : [380, 520]
    return { y, f, x1: from, x2: lerp(from, to, f), tip: f > 0 && f < 1 }
  }),
)
const userPath: Pt[] = [[108, 226], [150, 226], [205, 226]]
const streamPath: Pt[] = [[205, 226], [250, 220], [380, 217], [520, 217], [600, 224], [700, 226], [714, 226]]
const backPath: Pt[] = [...streamPath].reverse()

// ---- scene: pool ----
const PROFILES = [
  { name: 'REALITY', port: ':8443', y: 110, links: [130, 156] },
  { name: 'WebSocket', port: ':2083', y: 226, links: [246, 272] },
]
// Spread loses WebSocket; Priority loses its first profile, REALITY.
const blockedProfile = computed(() => (mode.value === 'priority' ? 0 : 1))
const poolBoxes = computed<Box[]>(() => [
  { id: 'relay', x: 4, y: 40, w: 210, h: 270, kind: 'node', icon: 'server', label: t(UI.relay), tall: true },
  { id: 'origin', x: 606, y: 40, w: 210, h: 270, kind: 'node', icon: 'server', label: t(UI.origin), sub: `${t(UI.exit)} 203.0.113.20`, tall: true },
])
const poolLinks = computed(() => {
  const out: { y: number; f: number; state: string; i: number }[] = []
  let i = 0
  PROFILES.forEach((pr, pi) =>
    pr.links.forEach((y) => {
      const f = step.value > 0 || !motion.value ? 1 : seg(i * 0.18, i * 0.18 + 0.3)
      const blocked = pi === blockedProfile.value && step.value >= 2
      const inUse = mode.value === 'spread' ? true : step.value >= 3 ? pi !== blockedProfile.value : pi === 0
      const state = blocked ? 'blocked' : step.value >= 1 && inUse ? 'busy' : step.value >= 1 ? 'idle' : 'up'
      out.push({ y, f, state, i: i++ })
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
    return stream([[206, l.y], [606, l.y]], 2, 1.8, l.i * 0.45).map(([x, y]) => ({ x, y, opacity }))
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
  return PROFILES[blockedProfile.value].links.flatMap((y) =>
    launches
      .map((at) => (motion.value ? (lt.value - at) / 0.7 : 0.6))
      .filter((f) => f >= 0 && f <= 1)
      .map((f) => ({ x: lerp(606, 418, f), y, opacity: f > 0.85 ? (1 - f) / 0.15 : 1 })),
  )
})
const wallTop = computed(() => PROFILES[blockedProfile.value].links[0] - 16)

// ---- scene: sticky ----
const USERS = ['A', 'B', 'C', 'D', 'E', 'F']
const COLORS = ['#6d4aff', '#db2777', '#16a34a', '#d97706', '#0284c7', '#dc2626']
const ORIGINS = [
  { id: 'de', y: 20, addr: '198.51.100.10' },
  { id: 'nl', y: 155, addr: '198.51.100.20' },
  { id: 'fi', y: 290, addr: '198.51.100.30' },
]
const HOME = [0, 1, 2, 0, 1, 2] // A→de, B→nl, C→fi, D→de, E→nl, F→fi
const AWAY = [0, 0, 2, 0, 2, 2] // with nl lost: B→de, E→fi
const SLOT_HOME = [0, 0, 0, 1, 1, 1]
const SLOT_AWAY = [0, 2, 0, 1, 2, 1]
const nlLost = computed(() => step.value === 2 || step.value === 3 || (step.value === 4 && p.value < 0.2))
const userY = (u: number) => 50 + u * 60
const originMid = (o: number) => ORIGINS[o].y + 45
const userPathTo = (u: number, o: number): Pt[] => [[42, userY(u)], [150, 200], [300, 200], [560, originMid(o)]]
const stickyBoxes = computed<Box[]>(() => [
  { id: 'relay', x: 150, y: 160, w: 150, h: 80, kind: 'node', icon: 'server', label: t(UI.relay) },
  ...ORIGINS.map((o, i) => ({
    id: o.id,
    x: 560,
    y: o.y,
    w: 210,
    h: 90,
    kind: 'node',
    icon: 'server',
    label: `exit-${o.id}`,
    sub: i === 1 && nlLost.value ? t(UI.lost) : o.addr,
    tall: true,
    cls: i === 1 && nlLost.value ? 'lost' : '',
  })),
])
const slotPos = (o: number, s: number): Pt => [598 + s * 28, ORIGINS[o].y + 70]
// Where each user's badge is, and whether it shows yet.
const badges = computed(() =>
  USERS.map((name, u) => {
    const moves = HOME[u] !== AWAY[u]
    let pos = slotPos(HOME[u], SLOT_HOME[u])
    const move = (from: Pt, to: Pt, f: number): Pt => [lerp(from[0], to[0], ease(f)), lerp(from[1], to[1], ease(f))]
    if (moves && step.value === 3) {
      pos = move(slotPos(HOME[u], SLOT_HOME[u]), slotPos(AWAY[u], SLOT_AWAY[u]), motion.value ? seg(0.1, 0.6) : 1)
    } else if (moves && step.value === 4) {
      pos = move(slotPos(AWAY[u], SLOT_AWAY[u]), slotPos(HOME[u], SLOT_HOME[u]), motion.value ? seg(0.2, 0.7) : 1)
    }
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
const height = computed(() => ({ modes: 328, pool: 360, sticky: 396 })[props.scene])
</script>

<template>
  <figure ref="figure" class="nx-diagram nx-tunnel" :class="{ still: !motion }">
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
      <svg :viewBox="`0 0 820 ${height}`" role="img" :aria-label="t(sc.title)" xmlns="http://www.w3.org/2000/svg">
        <title>{{ t(sc.title) }}</title>

        <!-- what lies under the boxes -->
        <g v-if="scene === 'modes'">
          <g class="control">
            <path v-for="(c, i) in control" :key="i" :d="path(c)" class="line dashed" :class="{ faint: step > 0 }" />
            <template v-if="step === 0">
              <circle
                v-for="(c, i) in control"
                :key="'c' + i"
                r="5"
                class="packet"
                :cx="along(c, motion ? seg(0, 0.7) : 0.6)[0]"
                :cy="along(c, motion ? seg(0, 0.7) : 0.6)[1]"
              />
            </template>
          </g>
          <g class="traffic">
            <path :d="path([[108, 226], [150, 226]])" class="line" :class="{ faint: step !== 2 }" />
            <path :d="path([[700, 226], [714, 226]])" class="line" :class="{ faint: step < 3 }" />
          </g>
        </g>
        <g v-if="scene === 'pool'">
          <rect x="236" y="100" width="348" height="204" rx="14" class="pool" />
          <T :x="236" :y="74" :w="348" :h="24"><span class="cap">{{ t(UI.pool) }}</span></T>
        </g>
        <g v-if="scene === 'sticky'" class="traffic">
          <path v-for="u in 6" :key="'u' + u" :d="path([[42, userY(u - 1)], [150, 200]])" class="line faint" />
          <path
            v-for="(o, i) in ORIGINS"
            :key="o.id"
            :d="path([[300, 200], [560, originMid(i)]])"
            class="line"
            :class="i === 1 && nlLost ? 'cut' : 'faint'"
          />
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
            <rect x="150" y="186" width="110" height="80" rx="8" />
            <T :x="150" :y="186" :w="110" :h="80">{{ t(UI.inbound) }}<b class="mono">:443</b></T>
          </g>
          <g v-if="reverse" class="chip tunnel" :class="{ hot: step === 1 }">
            <rect x="266" y="186" width="106" height="80" rx="8" />
            <T :x="266" :y="186" :w="106" :h="80">{{ t(UI.tunnelPort) }}<b class="mono">:8443</b></T>
          </g>
          <g v-if="reverse" class="chip none">
            <rect x="530" y="186" width="116" height="80" rx="8" />
            <T :x="530" :y="186" :w="116" :h="80"><span class="muted">{{ t(UI.noPort) }}</span></T>
          </g>
          <g v-else class="chip tunnel" :class="{ hot: step === 1 }">
            <rect x="530" y="186" width="106" height="80" rx="8" />
            <T :x="530" :y="186" :w="106" :h="80">{{ t(UI.tunnelPort) }}<b class="mono">:8443</b></T>
          </g>

          <g class="links">
            <g v-for="(l, i) in links" :key="i">
              <line v-if="l.f > 0" :x1="l.x1" :x2="l.x2" :y1="l.y" :y2="l.y" class="link" :class="{ busy: step >= 3 && i === 1 }" />
              <circle v-if="l.tip" :cx="l.x2" :cy="l.y" r="6" class="key" />
            </g>
          </g>
          <T v-if="step === 1" :x="380" :y="138" :w="140" :h="56">
            <span class="cap">{{ t(UI.dial) }} ×4 <span dir="ltr">{{ reverse ? '←' : '→' }}</span></span>
          </T>
          <T v-if="step >= 3" :x="380" :y="258" :w="140" :h="56">
            <span class="cap">{{ t(UI.stream) }} <span dir="ltr">→</span></span>
          </T>

          <g class="traffic">
            <template v-if="step === 2">
              <circle v-for="(q, i) in stream(userPath, 3, 1.5)" :key="'u' + i" r="5.5" class="packet" :cx="q[0]" :cy="q[1]" />
            </template>
            <template v-if="step >= 3">
              <circle v-for="(q, i) in stream(streamPath, 3, 2.4)" :key="'s' + i" r="5.5" class="packet" :cx="q[0]" :cy="q[1]" />
              <circle v-for="(q, i) in stream(backPath, 2, 2.4, 0.6)" :key="'r' + i" r="4" class="packet back" :cx="q[0]" :cy="q[1]" />
            </template>
          </g>
          <g v-if="step === 4" class="exit">
            <rect x="708" y="264" width="108" height="60" rx="10" />
            <T :x="708" :y="264" :w="108" :h="60">{{ t(UI.sees) }}<b class="mono">203.0.113.20</b></T>
          </g>
        </g>

        <!-- pool: profiles, links, the block -->
        <g v-if="scene === 'pool'">
          <g v-for="(pr, pi) in PROFILES" :key="pr.name" class="chip tunnel" :class="{ cut: pi === blockedProfile && step >= 2 }">
            <rect x="100" :y="pr.y" width="106" height="66" rx="8" />
            <T :x="100" :y="pr.y" :w="106" :h="66">{{ pr.name }}<b class="mono">{{ pr.port }}</b></T>
          </g>
          <g class="links">
            <line
              v-for="l in poolLinks"
              :key="l.i"
              :x1="606"
              :x2="lerp(606, 214, l.f)"
              :y1="l.y"
              :y2="l.y"
              class="link"
              :class="l.state"
              :style="l.state === 'blocked' ? { opacity: step === 2 ? 1 - 0.7 * p : 0.3 } : undefined"
            />
          </g>
          <T v-if="mode === 'priority' && step === 1" :x="236" :y="280" :w="348" :h="24"><span class="cap">{{ t(UI.standby) }}</span></T>
          <g class="traffic">
            <circle v-for="(q, i) in poolPackets" :key="i" r="5.5" class="packet" :cx="q.x" :cy="q.y" :opacity="q.opacity" />
          </g>
          <g v-if="step >= 2" class="wall" :style="{ opacity: step === 2 ? clamp(p * 3) : 1 }">
            <rect x="404" :y="wallTop" width="14" height="58" rx="3" />
            <T :x="330" :y="blockedProfile === 0 ? wallTop + 60 : wallTop - 26" :w="160" :h="24"><span class="cap bad">{{ t(UI.blocked) }}</span></T>
          </g>
          <g class="control">
            <circle v-for="(q, i) in retries" :key="i" r="4.5" class="packet" :cx="q.x" :cy="q.y" :opacity="q.opacity" />
          </g>
          <T v-if="step === 4" :x="214" :y="306" :w="392" :h="24"><span class="cap">{{ t(UI.retry) }}</span></T>
          <g class="meter">
            <T :x="4" :y="330" :w="228" :h="26" align="end"><span class="cap">{{ t(UI.carrying) }}</span></T>
            <rect x="240" y="338" width="280" height="10" rx="5" class="track" />
            <rect x="240" y="338" :width="280 * (carrying / 4)" height="10" rx="5" class="fill" />
            <T :x="526" :y="330" :w="60" :h="26" align="start"><b class="mono">{{ carrying }}/4</b></T>
          </g>
          <g v-if="step >= 3" class="exit">
            <rect x="606" y="324" width="210" height="32" rx="10" />
            <T :x="606" :y="324" :w="210" :h="32">{{ t(UI.unchanged) }} ✓</T>
          </g>
        </g>

        <!-- sticky: users, badges, packets -->
        <g v-if="scene === 'sticky'">
          <g v-for="(u, i) in USERS" :key="u" class="user">
            <circle cx="28" :cy="userY(i)" r="15" :fill="COLORS[i]" />
            <text x="28" :y="userY(i) + 5" text-anchor="middle">{{ u }}</text>
          </g>
          <circle v-for="(q, i) in stickyPackets" :key="i" r="6" :cx="q.x" :cy="q.y" :fill="q.color" />
          <g v-for="b in badges" :key="b.name" class="user badge" :opacity="b.shown ? (b.dim ? 0.35 : 1) : 0">
            <circle :cx="b.x" :cy="b.y" r="11" :fill="b.color" />
            <text :x="b.x" :y="b.y + 4.5" text-anchor="middle">{{ b.name }}</text>
          </g>
          <template v-if="step === 1">
            <T :x="420" :y="ORIGINS[0].y + 6" :w="134" :h="24" align="end"><span class="cap good">{{ t(UI.sameExit) }} ✓</span></T>
            <T :x="420" :y="ORIGINS[1].y + 6" :w="134" :h="24" align="end"><span class="cap good">{{ t(UI.sameExit) }} ✓</span></T>
          </template>
          <text v-if="nlLost" x="740" y="232" text-anchor="middle" class="x">✕</text>
        </g>
      </svg>
    </div>

    <div class="note" aria-live="polite">
      <strong>{{ step + 1 }} · {{ t(variant(steps[step].title)) }}</strong>
      <p>{{ t(variant(steps[step].text)) }}</p>
    </div>
  </figure>
</template>
