<script setup lang="ts">
import type { ManualWindInput, ManualWindSource } from '@/composables/useManualWind'

withDefaults(defineProps<{ theme?: 'light' | 'dark' }>(), {
  theme: 'light',
})

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
  <div
    class="manual-entry"
    :class="manualInput.source === 'atis_mag' ? 'mode-magnetic' : 'mode-true'"
    :data-theme="theme"
  >
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
/* ─── Mode color tokens (light) ──────────────────────────────── */

.mode-true {
  --mode-bg: #fefce8;
  --mode-border: #fde047;
  --mode-label: #78350f;
  --mode-accent: #eab308;
  --mode-accent-text: #1c1917;
  --mode-input-bg: #fffbeb;
  --mode-input-text: #1c1917;
  --mode-input-border: #fbbf24;
  --mode-input-focus: #d97706;
  --mode-input-placeholder: #78716c;
  --mode-reminder-bg: #fef9c3;
  --mode-reminder-text: #713f12;
}

.mode-magnetic {
  --mode-bg: #f0fdf4;
  --mode-border: #86efac;
  --mode-label: #15803d;
  --mode-accent: #22c55e;
  --mode-accent-text: #14532d;
  --mode-input-bg: #f0fdf4;
  --mode-input-text: #14532d;
  --mode-input-border: #86efac;
  --mode-input-focus: #22c55e;
  --mode-input-placeholder: #4d7c0f;
  --mode-reminder-bg: #dcfce7;
  --mode-reminder-text: #14532d;
}

/* ─── Mode color tokens (dark) ───────────────────────────────── */

.manual-entry[data-theme='dark'].mode-true {
  --mode-bg: #2b1d08;
  --mode-border: #b45309;
  --mode-label: #fcd34d;
  --mode-input-bg: #2b1d08;
  --mode-input-text: #fef3c7;
  --mode-input-border: #d97706;
  --mode-input-focus: #b45309;
  --mode-input-placeholder: #fcd34d;
  --mode-reminder-bg: #3b2a10;
  --mode-reminder-text: #fde68a;
}

.manual-entry[data-theme='dark'].mode-magnetic {
  --mode-bg: #0f2619;
  --mode-border: #166534;
  --mode-label: #86efac;
  --mode-input-bg: #0f2619;
  --mode-input-text: #dcfce7;
  --mode-input-border: #16a34a;
  --mode-input-focus: #22c55e;
  --mode-input-placeholder: #86efac;
  --mode-reminder-bg: #123221;
  --mode-reminder-text: #bbf7d0;
}

/* ─── Layout ─────────────────────────────────────────────────── */

.manual-entry {
  border-radius: 8px;
  padding: 1rem 1.25rem;
  margin: 1rem 0;
  border: 1px solid var(--mode-border);
  background: var(--mode-bg);
  transition: background 0.2s, border-color 0.2s;
}

/* ─── Mode toggle ────────────────────────────────────────────── */

.mode-toggle {
  display: inline-flex;
  border-radius: 6px;
  overflow: hidden;
  border: 1.5px solid var(--color-border);
  margin-bottom: 0.75rem;
}

.mode-btn {
  padding: 0.35rem 1rem;
  font-size: 0.8rem;
  font-weight: 700;
  letter-spacing: 0.06em;
  border: none;
  cursor: pointer;
  background: var(--color-surface-muted);
  color: var(--color-text-muted);
  transition: background 0.15s, color 0.15s;
}

.mode-btn:first-child {
  border-right: 1.5px solid var(--color-border);
}

.mode-btn + .mode-btn {
  border-left: 1.5px solid var(--color-border);
}

.mode-btn.active {
  background: var(--mode-accent);
  color: var(--mode-accent-text);
}

/* ─── Source reminder ────────────────────────────────────────── */

.source-reminder {
  font-size: 0.82rem;
  margin-bottom: 0.875rem;
  padding: 0.4rem 0.65rem;
  border-radius: 5px;
  line-height: 1.4;
  background: var(--mode-reminder-bg);
  color: var(--mode-reminder-text);
}

/* ─── Fields ─────────────────────────────────────────────────── */

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
  color: var(--mode-label);
}

.field-hint {
  font-size: 0.72rem;
  color: var(--color-text-muted);
  font-style: italic;
}

/* ─── Wind inputs ────────────────────────────────────────────── */

.wind-input {
  padding: 0.4rem 0.6rem;
  border-radius: 5px;
  font-family: var(--font-mono);
  font-size: 1rem;
  width: 130px;
  outline: none;
  border: 1.5px solid var(--mode-input-border);
  background: var(--mode-input-bg);
  color: var(--mode-input-text);
  transition: border-color 0.15s;
}

.wind-input::placeholder {
  color: var(--mode-input-placeholder);
  opacity: 1;
}

.wind-input:focus {
  border-color: var(--mode-input-focus);
}

.wind-input.narrow {
  width: 85px;
}

.wind-input.narrow-decl {
  width: 100px;
}

/* ─── Declination toggle ─────────────────────────────────────── */

.declination-row {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.decl-toggle {
  display: inline-flex;
  border-radius: 6px;
  overflow: hidden;
  border: 1.5px solid var(--color-border);
}

.decl-btn {
  padding: 0.35rem 0.6rem;
  font-size: 0.8rem;
  font-weight: 700;
  border: none;
  cursor: pointer;
  background: var(--color-surface-muted);
  color: var(--color-text-muted);
  transition: background 0.15s, color 0.15s;
}

.decl-btn + .decl-btn {
  border-left: 1.5px solid var(--color-border);
}

.decl-btn.active {
  background: var(--mode-accent);
  color: var(--mode-accent-text);
}
</style>
