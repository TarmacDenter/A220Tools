<script setup lang="ts">
import type { ManualWindInput, ManualWindSource } from '@/composables/useManualWind'

const manualInput = defineModel<ManualWindInput>({ required: true })

function updateField(
  field: 'direction' | 'speed' | 'gust' | 'declinationMagnitude',
  value: string,
) {
  manualInput.value = { ...manualInput.value, [field]: value }
}

function setSource(source: ManualWindSource) {
  manualInput.value = { ...manualInput.value, source }
}

function setDeclinationDir(dir: 'E' | 'W') {
  manualInput.value = { ...manualInput.value, declinationDir: dir }
}
</script>

<template>
  <div class="manual-entry" :class="manualInput.source === 'atis_mag' ? 'mode-magnetic' : 'mode-true'">

    <!-- Source selector -->
    <div class="mode-toggle">
      <button
        class="mode-btn"
        :class="{ active: manualInput.source === 'atis_mag' }"
        @click="setSource('atis_mag')"
      >
        ATIS (MAG)
      </button>
      <button
        class="mode-btn"
        :class="{ active: manualInput.source === 'metar_true' }"
        @click="setSource('metar_true')"
      >
        METAR (TRUE)
      </button>
      <button
        class="mode-btn"
        :class="{ active: manualInput.source === 'aerodata_true' }"
        @click="setSource('aerodata_true')"
      >
        AERODATA (TRUE)
      </button>
    </div>

    <!-- Source reminder -->
    <div class="source-reminder">
      <span v-if="manualInput.source !== 'atis_mag'">
        Use <strong>TRUE</strong> for: METAR / AeroData
        — find declination on the 10-9 page
      </span>
      <span v-else>
        Use <strong>MAGNETIC</strong> for: ATIS
        — winds entered directly as magnetic, no correction applied
      </span>
    </div>

    <!-- Wind inputs -->
    <div class="fields">
      <div class="field">
        <label>Wind FROM ({{ manualInput.source === 'atis_mag' ? '°M' : '°T' }} or VRB)</label>
        <input
          type="text"
          :value="manualInput.direction"
          @input="updateField('direction', ($event.target as HTMLInputElement).value)"
          :placeholder="manualInput.source === 'atis_mag' ? '270°M or VRB' : '270°T or VRB'"
          class="wind-input"
          autocomplete="off"
        />
      </div>

      <div class="field">
        <label>Max winds (kt)</label>
        <input
          type="number"
          :value="manualInput.speed"
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
          :value="manualInput.gust"
          @input="updateField('gust', ($event.target as HTMLInputElement).value)"
          placeholder="—"
          min="0"
          max="999"
          class="wind-input narrow"
        />
        <span class="field-hint">Leave blank if max = sustained</span>
      </div>

      <!-- Declination — only relevant in TRUE mode -->
      <div v-if="manualInput.source !== 'atis_mag'" class="field field-decl">
        <label>Declination (°)</label>
        <div class="declination-row">
          <input
            type="number"
            :value="manualInput.declinationMagnitude"
            @input="updateField('declinationMagnitude', ($event.target as HTMLInputElement).value)"
            placeholder="e.g. 12"
            step="0.1"
            class="wind-input narrow-decl"
          />
          <div class="decl-toggle">
            <button
              class="decl-btn"
              :class="{ active: manualInput.declinationDir === 'E' }"
              @click="setDeclinationDir('E')"
            >
              E
            </button>
            <button
              class="decl-btn"
              :class="{ active: manualInput.declinationDir === 'W' }"
              @click="setDeclinationDir('W')"
            >
              W
            </button>
          </div>
        </div>
        <span class="field-hint">blank = auto &nbsp;·&nbsp; toggle sets sign</span>
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

.mode-btn + .mode-btn {
  border-left: 1.5px solid #d1d5db;
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

.declination-row {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.decl-toggle {
  display: inline-flex;
  border-radius: 6px;
  overflow: hidden;
  border: 1.5px solid #d1d5db;
}

.decl-btn {
  padding: 0.35rem 0.6rem;
  font-size: 0.8rem;
  font-weight: 700;
  border: none;
  cursor: pointer;
  background: #f1f5f9;
  color: #64748b;
  transition: background 0.15s, color 0.15s;
}

.decl-btn + .decl-btn {
  border-left: 1.5px solid #d1d5db;
}

.mode-true .decl-btn.active {
  background: #eab308;
  color: #1c1917;
}
</style>
