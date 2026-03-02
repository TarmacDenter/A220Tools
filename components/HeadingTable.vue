<script setup lang="ts">
import type { HeadingRow } from '@/types/wind'

defineProps<{
  rows: HeadingRow[]
}>()

function formatComponent(hw: number): string {
  if (hw >= 0) return `+${hw.toFixed(1)} HW`
  return `${hw.toFixed(1)} TW`
}
</script>

<template>
  <div class="table-wrapper">
    <table class="heading-table">
      <thead>
        <tr>
          <th>Heading (°M)</th>
          <th>Component</th>
          <th>Status</th>
        </tr>
      </thead>
      <tbody>
        <tr
          v-for="row in rows"
          :key="row.heading"
          :class="{ 'row-unsafe': !row.isSafe }"
        >
          <td class="col-heading">{{ String(row.heading).padStart(3, '0') }}°</td>
          <td class="col-component" :class="row.headwindComponent < 0 ? 'tailwind' : 'headwind'">
            {{ formatComponent(row.headwindComponent) }}
          </td>
          <td class="col-status">
            <span v-if="row.isSafe" class="badge safe">Safe</span>
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
</style>
