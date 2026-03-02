<script setup lang="ts">
import type { WindResult } from '@/types/wind'

defineProps<{
  result: WindResult
}>()
</script>

<template>
  <div class="safety-readout">
    <!-- CALM -->
    <div v-if="result.parsedWind.isCalm" class="readout-safe">
      <span class="icon">✓</span>
      CALM WINDS — all headings safe
    </div>

    <!-- VARIABLE -->
    <div v-else-if="result.parsedWind.isVariable && result.allHeadingsSafe" class="readout-safe">
      <span class="icon">✓</span>
      VARIABLE WINDS — {{ result.parsedWind.effectiveSpeed }} kt wind is below
      {{ result.tailwindLimitKt }} kt limit
    </div>

    <!-- VARIABLE -->
    <div v-else-if="result.parsedWind.isVariable" class="readout-warning">
      <span class="icon">⚠</span>
      VARIABLE WINDS — any heading may receive full tailwind
    </div>

    <!-- ALL SAFE -->
    <div v-else-if="result.allHeadingsSafe" class="readout-safe">
      <span class="icon">✓</span>
      ALL HEADINGS SAFE — {{ result.parsedWind.effectiveSpeed }} kt wind is below
      {{ result.tailwindLimitKt }} kt limit
    </div>

    <!-- PARTIAL UNSAFE -->
    <template v-else>
      <div class="readout-safe">
        <span class="icon">✓</span>
        SAFE: from {{ result.h2?.toFixed(0) }}°M clockwise to {{ result.h1?.toFixed(0) }}°M
      </div>
      <div class="readout-unsafe">
        <span class="icon">✗</span>
        UNSAFE: from {{ result.h1?.toFixed(0) }}°M clockwise to {{ result.h2?.toFixed(0) }}°M
      </div>
    </template>
  </div>
</template>

<style scoped>
.safety-readout {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  margin: 1rem 0;
}

.readout-safe,
.readout-unsafe,
.readout-warning {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem 1rem;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 600;
  letter-spacing: 0.02em;
}

.readout-safe {
  background: var(--color-safe-bg);
  color: var(--color-safe-text);
  border: 1px solid var(--color-safe-border);
}

.readout-unsafe {
  background: var(--color-unsafe-bg);
  color: var(--color-unsafe-text);
  border: 1px solid var(--color-unsafe-border);
}

.readout-warning {
  background: var(--color-warning-bg);
  color: var(--color-warning-text);
  border: 1px solid var(--color-warning-border);
}

.icon {
  font-size: 1.25rem;
  line-height: 1;
}
</style>
