<script setup lang="ts">
import { computed, ref, useId, type ComponentPublicInstance } from 'vue'
import { MATRIX_WINDOW_RADIUS_ROWS } from '#shared/domain/calculationPolicy'
import type {
  CurrentWindComponentReadout,
  TowerReferenceSource,
  TowerWindMatrix,
  TowerWindPhase,
} from '#shared/domain/runwayMatrix'
import { useCircularScroller } from '@/composables/useCircularScroller'
import { formatMagneticHeading } from '@/utils/formatting'

const props = defineProps<{
  phase: TowerWindPhase
  referenceSource: TowerReferenceSource
  matrix: TowerWindMatrix
  currentReadout: CurrentWindComponentReadout | null
}>()

/** Rows are rendered three times (A, B, C) so the list can wrap; only copy B is announced. */
const COPIES = [0, 1, 2] as const
const ACCESSIBLE_COPY = 1
const WINDOW_ROWS = MATRIX_WINDOW_RADIUS_ROWS * 2 + 1

const captionId = useId()
const scroller = ref<HTMLElement | null>(null)
const firstRow = ref<HTMLElement | null>(null)
const periodStartRow = ref<HTMLElement | null>(null)

function setRowRef(el: Element | ComponentPublicInstance | null, copy: number, index: number) {
  if (index !== 0) return
  const element = el instanceof HTMLElement ? el : null
  if (copy === 0) firstRow.value = element
  else if (copy === ACCESSIBLE_COPY) periodStartRow.value = element
}

const referenceDirection = computed(
  () => props.matrix.orderedRows[MATRIX_WINDOW_RADIUS_ROWS]?.windDirection ?? null,
)

const { isOffCenter, viewportHeightPx, recenter } = useCircularScroller({
  scroller,
  firstRow,
  periodStartRow,
  rowsPerPeriod: () => props.matrix.orderedRows.length,
  visibleRows: WINDOW_ROWS,
  centerKey: () => `${props.phase}:${props.referenceSource}:${referenceDirection.value}`,
})

const viewportStyle = computed(() =>
  viewportHeightPx.value === null
    ? undefined
    : { height: `${viewportHeightPx.value}px`, maxHeight: 'none' },
)

function onRecenterClick(): void {
  // Move focus before the button unmounts so keyboard users stay on the scroll region.
  scroller.value?.focus({ preventScroll: true })
  void recenter()
}

function formatPhase(phase: TowerWindPhase): string {
  return phase === 'takeoff' ? 'Takeoff' : 'Landing'
}
</script>

<template>
  <section class="tower-wind-matrix" :aria-label="`${formatPhase(phase)} Tower Wind Matrix`">
    <div class="limit-line">
      XW limit {{ matrix.crosswindLimitKt }} kt / TW limit {{ matrix.tailwindLimitKt }} kt
    </div>

    <div v-if="currentReadout" class="current-components" aria-label="Current wind components">
      <span class="component-pill" :class="`status-${currentReadout.crosswind.status}`">
        XW {{ currentReadout.crosswind.valueKt }}/{{ currentReadout.crosswind.limitKt }}
      </span>
      <span
        v-if="currentReadout.longitudinal.type === 'TW'"
        class="component-pill"
        :class="`status-${currentReadout.longitudinal.status}`"
      >
        TW {{ currentReadout.longitudinal.valueKt }}/{{ currentReadout.longitudinal.limitKt }}
      </span>
      <span v-else class="component-pill status-info">
        HW {{ currentReadout.longitudinal.valueKt }}
      </span>
    </div>
    <div v-else class="current-components-note">
      Current components unavailable for variable wind.
    </div>

    <div class="matrix-heading">
      <span :id="captionId" class="matrix-caption">Tower Wind Matrix (Magnetic)</span>
      <button v-if="isOffCenter" type="button" class="recenter-btn" @click="onRecenterClick">
        Re-center
      </button>
    </div>
    <div
      ref="scroller"
      class="matrix-table-wrapper"
      :style="viewportStyle"
      role="region"
      tabindex="0"
      :aria-labelledby="captionId"
    >
      <table class="matrix-table" :aria-labelledby="captionId">
        <thead>
          <tr>
            <th>Wind Dir (°M)</th>
            <th>Max Wind</th>
            <th>Limit</th>
          </tr>
        </thead>
        <tbody>
          <template v-for="copy in COPIES" :key="copy">
            <tr
              v-for="(row, index) in matrix.orderedRows"
              :key="`${copy}-${row.windDirection}`"
              :ref="(el) => setRowRef(el, copy, index)"
              :class="{ 'reference-row': row.isReference }"
              :aria-hidden="copy === ACCESSIBLE_COPY ? undefined : 'true'"
            >
              <td class="col-direction">{{ formatMagneticHeading(row.windDirection) }}</td>
              <td class="col-max">{{ row.displayMaxWind }}</td>
              <td>
                <span class="limit-badge">{{ row.limitingComponent }}</span>
              </td>
            </tr>
          </template>
        </tbody>
      </table>
    </div>
  </section>
</template>

<style scoped>
.tower-wind-matrix {
  margin: 1rem 0;
  padding: 1rem;
  border: 1px solid var(--color-border);
  border-radius: 8px;
  background: var(--color-surface);
}

.limit-line {
  color: var(--color-text);
  font-size: 0.95rem;
  font-weight: 700;
  margin-bottom: 0.75rem;
}

.current-components {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-bottom: 0.9rem;
}

.current-components-note {
  margin-bottom: 0.9rem;
  color: var(--color-text-muted);
  font-size: 0.85rem;
  font-weight: 600;
}

.component-pill,
.limit-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 1.6rem;
  border-radius: 9999px;
  font-family: var(--font-mono);
  font-size: 0.82rem;
  font-weight: 700;
  padding: 0.2rem 0.55rem;
}

.component-pill.status-safe {
  background: var(--color-safe-bg);
  border: 1px solid var(--color-safe-border);
  color: var(--color-safe-text);
}

.component-pill.status-warning {
  background: var(--color-warning-bg);
  border: 1px solid var(--color-warning-border);
  color: var(--color-warning-text);
}

.component-pill.status-unsafe {
  background: var(--color-unsafe-bg);
  border: 1px solid var(--color-unsafe-border);
  color: var(--color-unsafe-text);
}

.component-pill.status-info {
  background: var(--color-info-bg);
  border: 1px solid var(--color-info-border);
  color: var(--color-info-text);
}

.matrix-heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
  min-height: 2.4rem;
  padding: 0.4rem 0.75rem;
  border: 1px solid var(--color-border);
  border-bottom: 0;
  border-radius: 8px 8px 0 0;
  background: var(--color-surface-muted);
}

.matrix-caption {
  font-size: 0.85rem;
  font-weight: 700;
  color: var(--color-text-subtle);
}

.recenter-btn {
  border: 1px solid var(--color-border);
  border-radius: 9999px;
  background: var(--color-secondary-bg);
  color: var(--color-secondary-text);
  font-size: 0.78rem;
  font-weight: 700;
  padding: 0.2rem 0.65rem;
  cursor: pointer;
}

.recenter-btn:hover {
  background: var(--color-secondary-hover);
}

.matrix-table-wrapper {
  /* Fallback before JS measures the exact seven-row viewport height. */
  max-height: 22rem;
  overflow: auto;
  overscroll-behavior: contain;
  overflow-anchor: none;
  border: 1px solid var(--color-border);
  border-radius: 0 0 8px 8px;
}

.matrix-table {
  width: 100%;
  border-collapse: collapse;
  background: var(--color-surface);
  font-family: var(--font-mono);
  font-size: 0.9rem;
}

.matrix-table th {
  position: sticky;
  top: 0;
  z-index: 1;
  background: var(--color-surface);
  padding: 0.55rem 0.75rem;
  text-align: left;
  font-family: var(--font-sans);
  font-size: 0.75rem;
  text-transform: uppercase;
  color: var(--color-text-muted);
  border-bottom: 1px solid var(--color-border);
}

.matrix-table td {
  padding: 0.5rem 0.75rem;
  border-bottom: 1px solid var(--color-border);
}

.reference-row {
  background: var(--color-info-bg);
}

.col-direction,
.col-max {
  font-weight: 700;
}

.limit-badge {
  background: var(--color-surface-muted);
  border: 1px solid var(--color-border);
  color: var(--color-text-subtle);
}
</style>
