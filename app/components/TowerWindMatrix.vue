<script setup lang="ts">
import type { CurrentWindComponentReadout, TowerWindMatrix, TowerWindPhase } from '@/composables/useTowerWindMatrix'

defineProps<{
  phase: TowerWindPhase
  matrix: TowerWindMatrix
  currentReadout: CurrentWindComponentReadout | null
}>()

function formatHeading(heading: number): string {
  return `${String(heading).padStart(3, '0')}°`
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

    <div class="matrix-table-wrapper">
      <table class="matrix-table">
        <caption>Tower Wind Matrix</caption>
        <thead>
          <tr>
            <th>Wind Dir</th>
            <th>Max Wind</th>
            <th>Limit</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="row in matrix.visibleRows"
            :key="row.windDirection"
            :class="{ 'reference-row': row.isReference }"
          >
            <td class="col-direction">{{ formatHeading(row.windDirection) }}</td>
            <td class="col-max">{{ row.displayMaxWind }}</td>
            <td>
              <span class="limit-badge">{{ row.limitingComponent }}</span>
            </td>
          </tr>
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

.matrix-table-wrapper {
  overflow-x: auto;
  border: 1px solid var(--color-border);
  border-radius: 8px;
}

.matrix-table {
  width: 100%;
  border-collapse: collapse;
  background: var(--color-surface);
  font-family: var(--font-mono);
  font-size: 0.9rem;
}

.matrix-table caption {
  padding: 0.65rem 0.75rem;
  text-align: left;
  font-family: sans-serif;
  font-size: 0.85rem;
  font-weight: 700;
  color: var(--color-text-subtle);
  background: var(--color-surface-muted);
  border-bottom: 1px solid var(--color-border);
}

.matrix-table th {
  padding: 0.55rem 0.75rem;
  text-align: left;
  font-family: sans-serif;
  font-size: 0.75rem;
  text-transform: uppercase;
  color: var(--color-text-muted);
  border-bottom: 1px solid var(--color-border);
}

.matrix-table td {
  padding: 0.5rem 0.75rem;
  border-bottom: 1px solid var(--color-border);
}

.matrix-table tbody tr:last-child td {
  border-bottom: 0;
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
