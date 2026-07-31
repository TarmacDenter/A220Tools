<script setup lang="ts">
defineProps<{
  variant: 'loading' | 'calm' | 'warning'
}>()
</script>

<template>
  <div class="status-msg" :class="variant">
    <slot />
  </div>
</template>

<style scoped>
.status-msg {
  padding: 0.75rem 1rem;
  border-radius: 6px;
  margin: 0.75rem 0;
  font-size: 0.9rem;
}

.loading {
  background: var(--color-info-bg);
  color: var(--color-info-text);
}

.calm {
  background: var(--color-safe-bg);
  color: var(--color-safe-text);
}

.warning {
  background: var(--color-warning-bg);
  color: var(--color-warning-text);
}
</style>
