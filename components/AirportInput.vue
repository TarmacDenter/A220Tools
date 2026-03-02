<script setup lang="ts">
import type { FetchStatus } from '@/types/wind'

const { status, disabled = false } = defineProps<{
  status: FetchStatus
  disabled?: boolean
}>()

const icaoInput = defineModel<string>({ required: true })

const emit = defineEmits<{
  fetch: [icao: string]
}>()

function onFetch() {
  const val = icaoInput.value.trim().toUpperCase()
  if (val.length < 3) return
  emit('fetch', val)
}

function onKeydown(e: KeyboardEvent) {
  if (e.key === 'Enter') onFetch()
}
</script>

<template>
  <div class="airport-input">
    <label for="icao-input" class="label">Airport ICAO</label>
    <div class="input-row">
      <input
        id="icao-input"
        v-model="icaoInput"
        type="text"
        placeholder="e.g. KLAX"
        maxlength="4"
        class="icao-field"
        :disabled="status === 'loading' || disabled"
        @keydown="onKeydown"
        autocomplete="off"
        autocapitalize="characters"
        spellcheck="false"
      />
      <button
        class="fetch-btn"
        :disabled="status === 'loading' || disabled || icaoInput.trim().length < 3"
        @click="onFetch"
      >
        <span v-if="status === 'loading'">Loading…</span>
        <span v-else>Check METAR</span>
      </button>
    </div>
  </div>
</template>

<style scoped>
.airport-input {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  margin: 1rem 0;
}

.label {
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--color-text-subtle);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.input-row {
  display: flex;
  gap: 0.5rem;
}

.icao-field {
  flex: 0 0 auto;
  width: 120px;
  padding: 0.5rem 0.75rem;
  font-size: 1.1rem;
  font-family: var(--font-mono);
  font-weight: 600;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  border: 2px solid var(--color-border);
  background: var(--color-surface);
  color: var(--color-text);
  border-radius: 6px;
  outline: none;
  transition: border-color 0.15s;
}

.icao-field:focus {
  border-color: var(--color-primary);
}

.fetch-btn {
  padding: 0.5rem 1rem;
  background: var(--color-primary);
  color: var(--color-primary-text);
  border: none;
  border-radius: 6px;
  font-size: 0.9rem;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.15s;
}

.fetch-btn:hover:not(:disabled) {
  background: var(--color-primary-hover);
}

.fetch-btn:disabled {
  background: var(--color-primary-disabled);
  cursor: not-allowed;
}
</style>
