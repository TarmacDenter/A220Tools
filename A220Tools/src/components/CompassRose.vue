<script setup lang="ts">
import { computed } from 'vue'
import type { WindResult } from '@/types/wind'

const props = defineProps<{
  result: WindResult
}>()

const CX = 200
const CY = 200
const R = 160
const ARC_R = 150
const ARC_WIDTH = 20

// Convert compass bearing to SVG angle
// Compass 0° = North = SVG up (−90°)
function compassToSvgRad(compass: number): number {
  return ((compass - 90) * Math.PI) / 180
}

function polarPoint(r: number, compassDeg: number) {
  const rad = compassToSvgRad(compassDeg)
  return {
    x: CX + r * Math.cos(rad),
    y: CY + r * Math.sin(rad),
  }
}

// SVG arc path: start bearing → end bearing, clockwise
function arcPath(r: number, startBearing: number, endBearing: number): string {
  const start = polarPoint(r, startBearing)
  const end = polarPoint(r, endBearing)

  // Span clockwise from startBearing to endBearing
  const span = ((endBearing - startBearing) + 360) % 360
  const largeArc = span > 180 ? 1 : 0

  return `M ${start.x.toFixed(2)} ${start.y.toFixed(2)} A ${r} ${r} 0 ${largeArc} 1 ${end.x.toFixed(2)} ${end.y.toFixed(2)}`
}

// Full circle arc path (use two semicircles)
function fullCirclePath(r: number): string {
  const top = polarPoint(r, 0)
  const bot = polarPoint(r, 180)
  return `M ${top.x.toFixed(2)} ${top.y.toFixed(2)} A ${r} ${r} 0 1 1 ${bot.x.toFixed(2)} ${bot.y.toFixed(2)} A ${r} ${r} 0 1 1 ${top.x.toFixed(2)} ${top.y.toFixed(2)}`
}

// Tick marks
const ticks = computed(() => {
  const result = []
  for (let deg = 0; deg < 360; deg += 10) {
    const isLong = deg % 30 === 0
    const inner = polarPoint(R - (isLong ? 16 : 8), deg)
    const outer = polarPoint(R, deg)
    result.push({ inner, outer, deg, isLong })
  }
  return result
})

// Labels every 30°, cardinals at 0/90/180/270
const labels = computed(() => {
  const result = []
  const cardinals: Record<number, string> = { 0: 'N', 90: 'E', 180: 'S', 270: 'W' }
  for (let deg = 0; deg < 360; deg += 30) {
    const pos = polarPoint(R - 30, deg)
    result.push({ pos, text: cardinals[deg] ?? String(deg), isCardinal: deg in cardinals })
  }
  return result
})

// Wind arrow (from direction)
const windArrow = computed(() => {
  if (props.result.parsedWind.isCalm || props.result.parsedWind.isVariable) return null
  const dir = props.result.windDirectionMagnetic
  const tip = polarPoint(R - 5, dir)
  // Arrow points FROM the wind direction toward center (wind is blowing FROM that direction)
  return { x1: CX, y1: CY, x2: tip.x, y2: tip.y }
})

// Arc display
const arcDisplay = computed(() => {
  const { parsedWind, h1, h2, allHeadingsSafe } = props.result

  if (parsedWind.isCalm) return { type: 'all-safe' }
  if (parsedWind.isVariable) return { type: 'variable' }
  if (allHeadingsSafe) return { type: 'all-safe' }
  if (h1 === null || h2 === null) return { type: 'all-safe' }

  // Safe arc: H2 clockwise to H1
  // Unsafe arc: H1 clockwise to H2
  return {
    type: 'arcs',
    safeStart: h2,
    safeEnd: h1,
    unsafeStart: h1,
    unsafeEnd: h2,
  }
})
</script>

<template>
  <div class="compass-container">
    <svg viewBox="0 0 400 400" class="compass-rose" aria-label="Compass rose showing safe and unsafe headings">
      <!-- Background circle -->
      <circle :cx="CX" :cy="CY" :r="R" fill="#f8fafc" stroke="#cbd5e1" stroke-width="1.5" />

      <!-- Safe arcs -->
      <template v-if="arcDisplay.type === 'all-safe'">
        <path
          :d="fullCirclePath(ARC_R)"
          fill="none"
          :stroke="'var(--color-safe)'"
          :stroke-width="ARC_WIDTH"
          stroke-linecap="butt"
          opacity="0.8"
        />
      </template>

      <template v-else-if="arcDisplay.type === 'variable'">
        <path
          :d="fullCirclePath(ARC_R)"
          fill="none"
          :stroke="'var(--color-warning)'"
          :stroke-width="ARC_WIDTH"
          stroke-linecap="butt"
          opacity="0.8"
        />
        <text :x="CX" :y="CY + 5" text-anchor="middle" fill="var(--color-warning)" font-weight="700" font-size="14">
          VARIABLE
        </text>
      </template>

      <template v-else-if="arcDisplay.type === 'arcs' && arcDisplay.safeStart !== undefined">
        <!-- Safe arc: h2 → h1 clockwise (green) -->
        <path
          :d="arcPath(ARC_R, arcDisplay.safeStart, arcDisplay.safeEnd!)"
          fill="none"
          :stroke="'var(--color-safe)'"
          :stroke-width="ARC_WIDTH"
          stroke-linecap="butt"
          opacity="0.8"
        />
        <!-- Unsafe arc: h1 → h2 clockwise (red) -->
        <path
          :d="arcPath(ARC_R, arcDisplay.unsafeStart!, arcDisplay.unsafeEnd!)"
          fill="none"
          :stroke="'var(--color-unsafe)'"
          :stroke-width="ARC_WIDTH"
          stroke-linecap="butt"
          opacity="0.8"
        />
      </template>

      <!-- Tick marks -->
      <g v-for="tick in ticks" :key="tick.deg">
        <line
          :x1="tick.inner.x" :y1="tick.inner.y"
          :x2="tick.outer.x" :y2="tick.outer.y"
          stroke="#94a3b8"
          :stroke-width="tick.isLong ? 2 : 1"
        />
      </g>

      <!-- Labels -->
      <text
        v-for="lbl in labels"
        :key="lbl.text"
        :x="lbl.pos.x"
        :y="lbl.pos.y"
        text-anchor="middle"
        dominant-baseline="central"
        :font-size="lbl.isCardinal ? 14 : 11"
        :font-weight="lbl.isCardinal ? '700' : '400'"
        fill="#334155"
      >{{ lbl.text }}</text>

      <!-- Wind arrow -->
      <g v-if="windArrow">
        <!-- Line from center to outer rim in wind FROM direction -->
        <line
          :x1="windArrow.x1" :y1="windArrow.y1"
          :x2="windArrow.x2" :y2="windArrow.y2"
          stroke="#0ea5e9"
          stroke-width="3"
          stroke-linecap="round"
        />
        <!-- Arrowhead at tip -->
        <circle :cx="windArrow.x2" :cy="windArrow.y2" r="5" fill="#0ea5e9" />
        <!-- Center dot -->
        <circle :cx="CX" :cy="CY" r="4" fill="#0ea5e9" />
        <!-- Wind direction label -->
        <text :x="CX" :y="CY + 18" text-anchor="middle" font-size="11" fill="#0369a1" font-weight="600">
          FROM {{ result.windDirectionMagnetic.toFixed(0) }}°M
        </text>
      </g>

      <!-- Calm label -->
      <text v-if="result.parsedWind.isCalm" :x="CX" :y="CY + 5" text-anchor="middle" fill="var(--color-safe)" font-weight="700" font-size="14">
        CALM
      </text>
    </svg>
  </div>
</template>

<style scoped>
.compass-container {
  display: flex;
  justify-content: center;
  margin: 1rem 0;
}

.compass-rose {
  width: 100%;
  max-width: 400px;
  height: auto;
}
</style>
