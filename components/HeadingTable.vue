<script setup lang="ts">
import type { HeadingRow } from '@/types/wind'

const props = defineProps<{
  rows: HeadingRow[]
  showTaxi: boolean
  maxTaxiSpeed: number
}>()

function formatComponent(hw: number): string {
  if (hw >= 0) return `+${hw.toFixed(1)} HW`
  return `${hw.toFixed(1)} TW`
}

function formatTaxiSpeed(speed: number): string {
  if (speed === 0) return '—'
  return `${speed} kt`
}
</script>

<template>
  <div class="table-wrapper">
    <table class="heading-table">
      <thead>
        <tr>
          <th>Heading (°M)</th>
          <th>Component</th>
          <th v-if="showTaxi">Min Taxi</th>
          <th>Status</th>
        </tr>
      </thead>
      <tbody>
        <tr
          v-for="row in rows"
          :key="row.heading"
          :class="{ 'row-unsafe': !row.isSafe && (!showTaxi || row.minTaxiSpeed > maxTaxiSpeed) }"
        >
          <td class="col-heading">{{ String(row.heading).padStart(3, '0') }}°</td>
          <td class="col-component" :class="row.headwindComponent < 0 ? 'tailwind' : 'headwind'">
            {{ formatComponent(row.headwindComponent) }}
          </td>
          <td v-if="showTaxi" class="col-taxi" :class="{ 'taxi-needed': row.minTaxiSpeed > 0, 'taxi-exceeded': row.minTaxiSpeed > maxTaxiSpeed }">
            {{ formatTaxiSpeed(row.minTaxiSpeed) }}
          </td>
          <td class="col-status">
            <span v-if="row.isSafe" class="badge safe">Safe</span>
            <span v-else-if="showTaxi && row.minTaxiSpeed <= maxTaxiSpeed" class="badge taxi">Taxi {{ row.minTaxiSpeed }} kt</span>
            <span v-else class="badge unsafe">Unsafe</span>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<style scoped>
.table-wrapper {
  max-height: 400px;
  overflow-y: auto;
  border: 1px solid var(--color-border);
  border-radius: 8px;
  margin: 1rem 0;
}

.heading-table {
  width: 100%;
  border-collapse: collapse;
  font-family: var(--font-mono);
  font-size: 0.875rem;
  background: var(--color-surface);
}

.heading-table thead {
  position: sticky;
  top: 0;
  background: var(--color-surface-muted);
  z-index: 1;
}

.heading-table th {
  padding: 0.6rem 0.75rem;
  text-align: left;
  border-bottom: 2px solid var(--color-border);
  font-family: sans-serif;
  font-size: 0.8rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--color-text-muted);
}

.heading-table td {
  padding: 0.4rem 0.75rem;
  border-bottom: 1px solid var(--color-border);
}

.row-unsafe {
  background: var(--color-unsafe-bg);
}

.col-heading {
  font-weight: 600;
}

.tailwind {
  color: var(--color-unsafe);
}

.headwind {
  color: var(--color-safe-text);
}

.badge {
  display: inline-block;
  padding: 0.15rem 0.5rem;
  border-radius: 9999px;
  font-size: 0.75rem;
  font-weight: 600;
  font-family: sans-serif;
}

.badge.safe {
  background: var(--color-safe-bg);
  color: var(--color-safe-text);
}

.badge.unsafe {
  background: var(--color-unsafe-bg);
  color: var(--color-unsafe-text);
}

.badge.taxi {
  background: var(--color-warning-bg);
  color: var(--color-warning-text);
  border: 1px solid var(--color-warning-border);
}

.col-taxi {
  text-align: center;
  color: var(--color-text-muted);
}

.taxi-needed {
  color: var(--color-warning-text);
  font-weight: 600;
}

.taxi-exceeded {
  color: var(--color-unsafe-text);
  font-weight: 600;
}
</style>
