<script setup lang="ts">
import type { ManualWindInput } from '@/composables/useManualWind'

const props = defineProps<{
  modelValue: ManualWindInput
}>()

const emit = defineEmits<{
  'update:modelValue': [value: ManualWindInput]
}>()

function updateField(field: 'direction' | 'speed' | 'gust' | 'declination', value: string) {
  emit('update:modelValue', { ...props.modelValue, [field]: value })
}

function toggleMagnetic(isMagnetic: boolean) {
  emit('update:modelValue', { ...props.modelValue, isMagnetic })
}
</script>

<template>
  <div class="manual-entry" :class="modelValue.isMagnetic ? 'mode-magnetic' : 'mode-true'">

    <!-- Mode toggle -->
    <div class="mode-toggle">
      <button
        class="mode-btn"
        :class="{ active: !modelValue.isMagnetic }"
        @click="toggleMagnetic(false)"
      >
        TRUE
      </button>
      <button
        class="mode-btn"
        :class="{ active: modelValue.isMagnetic }"
        @click="toggleMagnetic(true)"
      >
        MAGNETIC
      </button>
    </div>

    <!-- Source reminder -->
    <div class="source-reminder">
      <span v-if="!modelValue.isMagnetic">
        Use <strong>TRUE</strong> for: ATIS / AeroData
        — declination will be applied automatically
      </span>
      <span v-else>
        Use <strong>MAGNETIC</strong> for: METAR
        — winds entered directly as magnetic, no correction applied
      </span>
    </div>

    <!-- Wind inputs -->
    <div class="fields">
      <div class="field">
        <label>Wind FROM ({{ modelValue.isMagnetic ? '°M' : '°T' }} or VRB)</label>
        <input
          type="text"
          :value="modelValue.direction"
          @input="updateField('direction', ($event.target as HTMLInputElement).value)"
          :placeholder="modelValue.isMagnetic ? '270°M or VRB' : '270°T or VRB'"
          class="wind-input"
          autocomplete="off"
        />
      </div>

      <div class="field">
        <label>Max winds (kt)</label>
        <input
          type="number"
          :value="modelValue.speed"
          @input="updateField('speed', ($event.target as HTMLInputElement).value)"
          placeholder="0"
          min="0"
          max="999"
          class="wind-input narrow"
        />
        <span class="field-hint">Use gust speed if gusts reported</span>
      </div>

      <div class="field">
        <label>Sustained (kt, optional)</label>
        <input
          type="number"
          :value="modelValue.gust"
          @input="updateField('gust', ($event.target as HTMLInputElement).value)"
          placeholder="—"
          min="0"
          max="999"
          class="wind-input narrow"
        />
        <span class="field-hint">Leave blank if max = sustained</span>
      </div>

      <!-- Declination — only relevant in TRUE mode -->
      <div v-if="!modelValue.isMagnetic" class="field field-decl">
        <label>Declination (°)</label>
        <input
          type="number"
          :value="modelValue.declination"
          @input="updateField('declination', ($event.target as HTMLInputElement).value)"
          placeholder="e.g. 12 or −5"
          step="0.1"
          class="wind-input narrow-decl"
        />
        <span class="field-hint">+ east &nbsp;/&nbsp; − west &nbsp;·&nbsp; blank = auto</span>
      </div>
    </div>

  </div>
</template>

<style scoped>
.manual-entry {
  border-radius: 8px;
  padding: 1rem 1.25rem;
  margin: 1rem 0;
  border: 1px solid;
  transition: background 0.2s, border-color 0.2s;
}

.mode-true {
  background: #fefce8;
  border-color: #fde047;
}

.mode-magnetic {
  background: #f0fdf4;
  border-color: #86efac;
}

/* Mode toggle */
.mode-toggle {
  display: inline-flex;
  border-radius: 6px;
  overflow: hidden;
  border: 1.5px solid #d1d5db;
  margin-bottom: 0.75rem;
}

.mode-btn {
  padding: 0.35rem 1rem;
  font-size: 0.8rem;
  font-weight: 700;
  letter-spacing: 0.06em;
  border: none;
  cursor: pointer;
  background: #f1f5f9;
  color: #64748b;
  transition: background 0.15s, color 0.15s;
}

.mode-btn:first-child {
  border-right: 1.5px solid #d1d5db;
}

.mode-true .mode-btn.active {
  background: #eab308;
  color: #1c1917;
}

.mode-magnetic .mode-btn.active {
  background: #22c55e;
  color: #14532d;
}

/* Source reminder */
.source-reminder {
  font-size: 0.82rem;
  margin-bottom: 0.875rem;
  padding: 0.4rem 0.65rem;
  border-radius: 5px;
  line-height: 1.4;
}

.mode-true .source-reminder {
  background: #fef9c3;
  color: #713f12;
}

.mode-magnetic .source-reminder {
  background: #dcfce7;
  color: #14532d;
}

/* Fields */
.fields {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  align-items: flex-start;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
}

.field label {
  font-size: 0.8rem;
  font-weight: 600;
}

.mode-true .field label {
  color: #78350f;
}

.mode-magnetic .field label {
  color: #15803d;
}

.field-hint {
  font-size: 0.72rem;
  color: #94a3b8;
  font-style: italic;
}

.wind-input {
  padding: 0.4rem 0.6rem;
  border-radius: 5px;
  font-family: var(--font-mono);
  font-size: 1rem;
  width: 130px;
  outline: none;
  border: 1.5px solid;
  transition: border-color 0.15s;
}

.mode-true .wind-input {
  border-color: #fbbf24;
}

.mode-true .wind-input:focus {
  border-color: #d97706;
}

.mode-magnetic .wind-input {
  border-color: #86efac;
}

.mode-magnetic .wind-input:focus {
  border-color: #22c55e;
}

.wind-input.narrow {
  width: 85px;
}

.wind-input.narrow-decl {
  width: 100px;
}
</style>
