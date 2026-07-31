<template>
  <button
    type="button"
    :class="['base-toggle', `variant-${variant}`, { 'is-active': isActive }]"
    :aria-pressed="isActive"
    :disabled="disabled"
    @click="toggle"
  >
    <slot>
      {{ isActive ? activeLabel : inactiveLabel }}
    </slot>
  </button>
</template>

<script setup lang="ts">
import { computed } from 'vue';

type Variant = 'primary' | 'safe' | 'unsafe' | 'warning' | 'info';

interface Props {
  activeLabel?: string;
  inactiveLabel?: string;
  variant?: Variant;
  disabled?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  activeLabel: 'On',
  inactiveLabel: 'Off',
  variant: 'primary',
  disabled: false,
});

const modelValue = defineModel<boolean>({ default: false });

const isActive = computed(() => modelValue.value);

const toggle = () => {
  if (!props.disabled) {
    modelValue.value = !modelValue.value;
  }
};
</script>

<style scoped>
.base-toggle {
  padding: 0.5rem 1rem;
  border: 2px solid var(--color-border);
  border-radius: 4px;
  background-color: var(--color-surface);
  color: var(--color-text);
  cursor: pointer;
  font-weight: 500;
  transition: all 0.2s ease;
}

.base-toggle:hover:not(:disabled) {
  border-color: var(--color-border-strong);
  background-color: var(--color-surface-soft);
}

.base-toggle:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* Variant: primary */
.base-toggle.variant-primary.is-active {
  background-color: var(--color-primary);
  color: var(--color-primary-text);
  border-color: var(--color-primary-hover);
}

.base-toggle.variant-primary.is-active:hover:not(:disabled) {
  background-color: var(--color-primary-hover);
}

/* Variant: safe */
.base-toggle.variant-safe.is-active {
  background-color: var(--color-safe-bg);
  color: var(--color-safe-text);
  border-color: var(--color-safe-border);
}

/* Variant: unsafe */
.base-toggle.variant-unsafe.is-active {
  background-color: var(--color-unsafe-bg);
  color: var(--color-unsafe-text);
  border-color: var(--color-unsafe-border);
}

/* Variant: warning */
.base-toggle.variant-warning.is-active {
  background-color: var(--color-warning-bg);
  color: var(--color-warning-text);
  border-color: var(--color-warning-border);
}

/* Variant: info */
.base-toggle.variant-info.is-active {
  background-color: var(--color-info-bg);
  color: var(--color-info-text);
  border-color: var(--color-info-border);
}
</style>
