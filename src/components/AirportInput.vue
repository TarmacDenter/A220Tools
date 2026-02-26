<script setup lang="ts">
import { ref, watch } from 'vue'
import type { FetchStatus } from '@/types/wind'

const props = defineProps<{
  modelValue: string
  status: FetchStatus
}>()

const emit = defineEmits<{
  fetch: [icao: string]
  'update:modelValue': [value: string]
}>()
const icaoInput = ref(props.modelValue)

function onFetch() {
  const val = icaoInput.value.trim().toUpperCase()
  if (val.length < 3) return
  emit('fetch', val)
}

function onKeydown(e: KeyboardEvent) {
  if (e.key === 'Enter') onFetch()
}

function onInput(value: string) {
  icaoInput.value = value
  emit('update:modelValue', value)
}

watch(
  () => props.modelValue,
  (value) => {
    icaoInput.value = value
  },
)
</script>

<template>
  <div class="airport-input">
    <label for="icao-input" class="label">Airport ICAO</label>
    <div class="input-row">
      <input
        id="icao-input"
        :value="icaoInput"
        type="text"
        placeholder="e.g. KLAX"
        maxlength="4"
        class="icao-field"
        :disabled="props.status === 'loading'"
        @keydown="onKeydown"
        @input="onInput(($event.target as HTMLInputElement).value)"
        autocomplete="off"
        autocapitalize="characters"
        spellcheck="false"
      />
      <button
        class="fetch-btn"
        :disabled="props.status === 'loading' || icaoInput.trim().length < 3"
        @click="onFetch"
      >
        <span v-if="props.status === 'loading'">Loading…</span>
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
  color: #475569;
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
  border: 2px solid #cbd5e1;
  border-radius: 6px;
  outline: none;
  transition: border-color 0.15s;
}

.icao-field:focus {
  border-color: #3b82f6;
}

.fetch-btn {
  padding: 0.5rem 1rem;
  background: #1d4ed8;
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 0.9rem;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.15s;
}

.fetch-btn:hover:not(:disabled) {
  background: #1e40af;
}

.fetch-btn:disabled {
  background: #93c5fd;
  cursor: not-allowed;
}
</style>
