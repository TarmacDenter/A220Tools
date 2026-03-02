<script setup lang="ts">
import { computed, ref } from 'vue'
import type { WindResult } from '@/types/wind'

const { result } = defineProps<{
  result: WindResult
  rawMetar: string | null
}>()

const isCollapsed = ref(true)
const panelId = 'assumptions-panel'

const decl = computed(() => {
  const d = result.magneticCorrection.declination
  const abs = Math.abs(d).toFixed(1)
  return d >= 0 ? `${abs}°E` : `${abs}°W`
})

const speedUsed = computed(() => {
  const w = result.parsedWind
  if (w.gust !== null) return `${w.gust} kt (gust, vs sustained ${w.speed} kt)`
  return `${w.speed} kt (sustained, no gusts reported)`
})

const isMagneticManual = computed(
  () => result.magneticCorrection.source === 'manual_magnetic'
)
const isMetarSource = computed(() => result.parsedWind.source === 'metar')
const isManualTrue = computed(
  () => result.parsedWind.source === 'manual' && !isMagneticManual.value
)
</script>

<template>
  <div class="assumptions">
    <div class="assumptions-header">
      <h3>Assumptions & Data Sources</h3>
      <button
        class="assumptions-toggle"
        type="button"
        :aria-expanded="!isCollapsed"
        :aria-controls="panelId"
        data-testid="assumptions-toggle"
        @click="isCollapsed = !isCollapsed"
      >
        <span class="chevron" :class="{ open: !isCollapsed }" aria-hidden="true">
          <svg viewBox="0 0 16 16" focusable="false">
            <path d="M4 6l4 4 4-4" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
          </svg>
        </span>
      </button>
    </div>

    <div :id="panelId" v-show="!isCollapsed" data-testid="assumptions-panel">
      <ul>
        <li>
          <strong>Speed used:</strong> {{ speedUsed }}
        </li>
        <li>
          <strong>Wind direction:</strong>
          <span v-if="result.parsedWind.isCalm">Calm (no correction needed)</span>
          <span v-else-if="result.parsedWind.isVariable">Variable</span>
          <span v-else-if="isMagneticManual">
            {{ result.parsedWind.directionTrue }}°M — entered as magnetic, no correction applied
          </span>
          <span v-else>
            {{ result.parsedWind.directionTrue }}°T → {{ result.windDirectionMagnetic.toFixed(0) }}°M
            ({{ decl }} declination)
          </span>
        </li>
        <li v-if="!isMagneticManual">
          <strong>Declination source:</strong>
          <span v-if="result.magneticCorrection.source === 'airport_api'">
            Airport API (<code>magdec: {{ result.magneticCorrection.rawMagdecString ?? '(none — 0° applied)' }}</code>)
          </span>
          <span v-else-if="result.magneticCorrection.source === 'manual_entered'">
            Manually entered ({{ decl }})
          </span>
          <span v-else-if="result.magneticCorrection.source === 'geomagnetism_package'">
            Geomagnetism package (WMM model)
          </span>
        </li>
        <li>
          <strong>Tailwind limit:</strong> {{ result.tailwindLimitKt }} kt (A220 engine start)
        </li>
        <li v-if="rawMetar">
          <strong>Raw METAR:</strong> <code class="metar-raw">{{ rawMetar }}</code>
        </li>
        <li>
          <strong>Source:</strong>
          <span v-if="isMetarSource">Live METAR (aviationweather.gov)</span>
          <span v-else-if="isMagneticManual">Manual entry — magnetic</span>
          <span v-else>Manual entry — true</span>
        </li>
      </ul>

      <!-- METAR: TRUE → magnetic correction note -->
      <div v-if="isMetarSource && !result.parsedWind.isCalm" class="advisory metar-advisory">
        <span class="advisory-icon">ℹ</span>
        <div>
          <strong>METAR winds are in TRUE degrees.</strong>
          Corrected to magnetic using {{ decl }} declination from the airport database.
          Cross-check against ATIS/AWOS if available.
        </div>
      </div>

      <!-- Manual TRUE: same note -->
      <div v-if="isManualTrue && !result.parsedWind.isCalm && !result.parsedWind.isVariable" class="advisory metar-advisory">
        <span class="advisory-icon">ℹ</span>
        <div>
          <strong>TRUE input mode.</strong>
          {{ decl }} declination applied
          <span v-if="result.magneticCorrection.source === 'manual_entered'">(manually entered)</span>
          <span v-else-if="result.magneticCorrection.source === 'geomagnetism_package'">(WMM model)</span>
          <span v-else>(airport API)</span>.
          Use this mode for METAR and AeroData sources.
        </div>
      </div>

      <!-- Manual MAGNETIC: confirmation note -->
      <div v-if="isMagneticManual && !result.parsedWind.isCalm && !result.parsedWind.isVariable" class="advisory magnetic-advisory">
        <span class="advisory-icon">✓</span>
        <div>
          <strong>MAGNETIC input mode.</strong>
          No declination correction applied — winds treated as already magnetic.
          Use this mode for ATIS winds.
        </div>
      </div>

    </div>
  </div>
</template>

<style scoped>
.assumptions {
  background: var(--color-assumption-bg);
  border: 1px solid var(--color-info-border);
  border-radius: 8px;
  padding: 1rem 1.25rem;
  margin: 1rem 0;
}

.assumptions-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
}

.assumptions h3 {
  margin: 0 0 0.75rem;
  font-size: 0.95rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--color-info-text);
}

.assumptions-toggle {
  border: 1px solid transparent;
  background: transparent;
  padding: 0.25rem;
  border-radius: 6px;
  color: var(--color-info-text);
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.assumptions-toggle:hover {
  background: var(--color-info-bg);
}

.assumptions-toggle:focus-visible {
  outline: 2px solid var(--color-primary);
  outline-offset: 2px;
}

.chevron {
  width: 1.1rem;
  height: 1.1rem;
  display: inline-flex;
  transition: transform 150ms ease;
}

.chevron svg {
  width: 100%;
  height: 100%;
}

.chevron.open {
  transform: rotate(180deg);
}

.assumptions ul {
  margin: 0 0 0.75rem;
  padding-left: 1.25rem;
  font-size: 0.9rem;
  line-height: 1.8;
}

.metar-raw {
  word-break: break-all;
  font-size: 0.85rem;
}

.advisory {
  display: flex;
  gap: 0.75rem;
  align-items: flex-start;
  padding: 0.65rem 0.875rem;
  border-radius: 6px;
  font-size: 0.875rem;
  line-height: 1.5;
  margin-top: 0.5rem;
}

.advisory-icon {
  flex-shrink: 0;
  font-size: 1rem;
  margin-top: 0.05rem;
}

.metar-advisory {
  background: var(--color-info-bg);
  border: 1px solid var(--color-info-border);
  color: var(--color-info-text);
}

.magnetic-advisory {
  background: var(--color-safe-bg);
  border: 1px solid var(--color-safe-border);
  color: var(--color-safe-text);
}

</style>
