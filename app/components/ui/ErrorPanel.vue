<script setup lang="ts">
defineProps<{
  variant?: 'error' | 'warn'
  title: string
}>()
</script>

<template>
  <div class="error-panel" :class="variant ?? 'error'">
    <p class="error-title">{{ title }}</p>
    <slot />
  </div>
</template>

<style scoped>
.error-panel {
  background: var(--color-unsafe-bg);
  border: 1px solid var(--color-unsafe-border);
  border-left: 4px solid var(--color-unsafe);
  border-radius: 8px;
  padding: 1rem 1.25rem;
  margin: 0.75rem 0;
}

.error-panel.warn {
  background: var(--color-warning-bg);
  border-color: var(--color-warning-border);
  border-left-color: var(--color-warning);
}

.error-title {
  font-weight: 700;
  font-size: 1rem;
  color: var(--color-unsafe-text);
  margin: 0 0 0.4rem;
}

.error-panel.warn .error-title {
  color: var(--color-warning-text);
}

/* ── Slot content styles ─────────────────────────────────────── */

:slotted(.error-detail) {
  font-size: 0.875rem;
  color: var(--color-unsafe-text);
  margin: 0.2rem 0;
  font-family: var(--font-mono);
}

.error-panel.warn :slotted(.error-detail) {
  color: var(--color-warning-text);
}

:slotted(.error-hint) {
  font-size: 0.875rem;
  color: var(--color-text-subtle);
  margin: 0.5rem 0 0.75rem;
}

:slotted(.error-actions) {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
  margin-top: 0.75rem;
}

:slotted(.action-btn) {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 6px;
  font-size: 0.9rem;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.15s;
}

:slotted(.action-btn.primary) {
  background: var(--color-primary);
  color: var(--color-primary-text);
}

:slotted(.action-btn.primary:hover) {
  background: var(--color-primary-hover);
}

:slotted(.action-btn.secondary) {
  background: var(--color-secondary-bg);
  color: var(--color-secondary-text);
}

:slotted(.action-btn.secondary:hover) {
  background: var(--color-secondary-hover);
}

:slotted(.action-note) {
  font-size: 0.75rem;
  font-weight: 400;
  opacity: 0.8;
  margin-top: 0.15rem;
}
</style>
