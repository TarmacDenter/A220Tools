<script setup lang="ts">
import { ref, computed, watch, nextTick, onMounted, onUnmounted } from 'vue';
import { parseMetarWind } from '@/composables/useMetar';
import { useAirportConditions } from '@/composables/useAirportConditions';
import { computeWindResult, buildHeadingTable } from '@/composables/useWindCalculations';
import { useTowerWindMatrix } from '@/composables/useTowerWindMatrix';
import { useInterval } from '@/composables/useInterval';
import { TAILWIND_LIMIT_KT, DEFAULT_MAX_TAXI_SPEED_KT } from '@/constants/windLimits';
import type { RCAM_KEYS } from '@/constants/windLimits';
import { METAR_ISSUED_STALE_MIN, METAR_ISSUED_WARNING_MIN } from '@/constants/metarTiming';
import type { MagneticCorrection, ParsedWind } from '@/types/wind';
import type { RunwaySelection } from '#shared/types/api';

import AirportInput from './AirportInput.vue';
import ManualWindEntry from './ManualWindEntry.vue';
import { parseManualWind } from '@/composables/useManualWind';
import type { ManualWindInput } from '@/composables/useManualWind';
import AssumptionsDisplay from './AssumptionsDisplay.vue';
import SafetyReadout from './SafetyReadout.vue';
import CompassRose from './CompassRose.vue';
import HeadingTable from './HeadingTable.vue';
import TowerWindMatrix from './TowerWindMatrix.vue';
import StatusMessage from './ui/StatusMessage.vue';
import ErrorPanel from './ui/ErrorPanel.vue';
import BaseToggle from './ui/BaseToggle.vue';

withDefaults(defineProps<{
  theme?: 'light' | 'dark';
  themeToggleLabel?: string;
}>(), {
  theme: 'light',
  themeToggleLabel: 'Toggle theme',
});

const emit = defineEmits<{
  toggleTheme: [];
}>();

type Phase = 'start' | 'takeoff' | 'landing';

// --- State ---
const activePhase = ref<Phase>('start');
const manualMode = ref(false);
const manualInputs = ref<ManualWindInput>({
  direction: '',
  speed: '',
  gust: '',
  source: 'metar_true',
  declinationMagnitude: '',
  declinationDir: 'W',
});

// Taxi speed display
const showTaxiSpeed = ref(false);
const maxTaxiSpeedInput = ref(String(DEFAULT_MAX_TAXI_SPEED_KT));
const runwayHeadingInput = ref('');
const runwaySelectionValue = ref('manual');
const selectedRunway = ref<RunwaySelection | null>(null);
const rcamCodeInput = ref('6');
const maxTaxiSpeed = computed(() => {
  if (!showTaxiSpeed.value) return 0;
  const parsed = parseInt(maxTaxiSpeedInput.value, 10);
  if (isNaN(parsed) || parsed < 1) return 0;
  return parsed;
});

const selectedRcamCode = computed<RCAM_KEYS>(() => {
  const parsed = Number(rcamCodeInput.value);
  if (parsed >= 1 && parsed <= 6) return parsed as RCAM_KEYS;
  return 6;
});

const {
  status: conditionsStatus,
  metar,
  magneticCorrection,
  runways,
  error: conditionsError,
  lastFetchedAt,
  fetchAirportConditions,
  clearConditions,
} = useAirportConditions();
const icaoInput = ref('');
const activeIcao = ref('');
const isOnline = ref(typeof navigator === 'undefined' ? true : navigator.onLine);
const freshnessNowMs = ref(Date.now());
const readoutRef = ref<HTMLElement | null>(null);

// --- Intervals ---
useInterval(() => {
  freshnessNowMs.value = Date.now();
}, 60_000);

useInterval(() => {
  if (!isOnline.value) return;
  if (manualMode.value) return;
  if (conditionsStatus.value !== 'success') return;
  if (activeIcao.value.length < 3) return;
  void fetchAirportConditions(activeIcao.value);
}, 300_000);

// --- Fetch orchestration ---
async function onFetch(icao: string) {
  if (!isOnline.value) return;
  const normalizedIcao = icao.toUpperCase();
  const isNewAirport = activeIcao.value !== normalizedIcao;
  if (isNewAirport) {
    selectedRunway.value = null;
    runwaySelectionValue.value = 'manual';
    runwayHeadingInput.value = '';
    runways.value = [];
  }
  activeIcao.value = normalizedIcao;
  await fetchAirportConditions(icao);
  if (isNewAirport) {
    runwaySelectionValue.value = runways.value.length > 0 ? '' : 'manual';
  }
}

function enableManualMode() {
  manualMode.value = true;
}

// --- Error state helpers ---
const conditionsFailed = computed(() => conditionsStatus.value === 'error');

const runwayOptions = computed(() => {
  const options = [...runways.value];
  if (selectedRunway.value && !options.some((runway) => runway.name === selectedRunway.value?.name)) {
    options.push(selectedRunway.value);
  }
  return options.sort((a, b) => a.heading - b.heading || a.name.localeCompare(b.name));
});

function onRunwaySelectionChange() {
  if (runwaySelectionValue.value === 'manual' || runwaySelectionValue.value === '') {
    selectedRunway.value = null;
    return;
  }
  selectedRunway.value = runwayOptions.value.find((runway) => runway.name === runwaySelectionValue.value) ?? null;
}

watch(runwaySelectionValue, onRunwaySelectionChange);

watch(runways, (updatedRunways) => {
  if (!selectedRunway.value) return;
  const refreshed = updatedRunways.find((runway) => runway.name === selectedRunway.value?.name);
  if (refreshed) selectedRunway.value = refreshed;
}, { deep: true });

const runwayHeading = computed<number | null>(() => {
  if (selectedRunway.value) return selectedRunway.value.heading;
  if (runwaySelectionValue.value !== 'manual') return null;
  const raw = String(runwayHeadingInput.value ?? '').trim();
  if (!/^\d+$/.test(raw)) return null;
  const parsed = Number(raw);
  if (!Number.isInteger(parsed) || parsed < 0 || parsed > 360) return null;
  return parsed === 360 ? 0 : parsed;
});

// --- Computed wind result ---
const parsedWind = computed<ParsedWind | null>(() => {
  if (!manualMode.value && metar.value) {
    return parseMetarWind(metar.value);
  }
  if (manualMode.value) {
    return parseManualWind(manualInputs.value);
  }
  return null;
});

const effectiveMagCorr = computed<MagneticCorrection | null>(() => {
  if (manualMode.value && manualInputs.value.source === 'atis_mag') {
    return { declination: 0, source: 'manual_magnetic', rawMagdecString: null };
  }
  // TRUE mode: prefer manually entered declination if provided
  if (manualMode.value) {
    const raw = manualInputs.value.declinationMagnitude.trim();
    if (raw !== '') {
      const parsed = parseFloat(raw);
      if (!isNaN(parsed)) {
        const sign = manualInputs.value.declinationDir === 'W' ? -1 : 1;
        const signed = parsed * sign;
        console.log(`[WindCheckerApp] Using manually entered declination: ${signed}°`);
        return { declination: signed, source: 'manual_entered', rawMagdecString: null };
      }
    }
    // Fall back to fetched airport declination, then 0
    return magneticCorrection.value ?? { declination: 0, source: 'airport_api', rawMagdecString: null };
  }
  return magneticCorrection.value;
});

const windResult = computed(() => {
  const pw = parsedWind.value;
  const mc = effectiveMagCorr.value;
  if (!pw || !mc) return null;
  // Don't compute if we're blocked waiting for user to choose a fallback
  return computeWindResult(pw, mc, maxTaxiSpeed.value);
});

const headingRows = computed(() => {
  const result = windResult.value;
  if (!result) return [];
  const { parsedWind: pw, windDirectionMagnetic } = result;
  if (pw.isCalm || pw.isVariable) return [];
  return buildHeadingTable(windDirectionMagnetic, pw.effectiveSpeed, TAILWIND_LIMIT_KT);
});

const runwayPhase = computed(() => {
  if (activePhase.value === 'takeoff' || activePhase.value === 'landing') return activePhase.value;
  return null;
});

const towerReferenceWindDirection = computed(() => {
  if (runwayHeading.value === null) return null;
  const result = windResult.value;
  if (!result || result.parsedWind.isCalm || result.parsedWind.isVariable) return runwayHeading.value;
  return result.windDirectionMagnetic;
});

const {
  matrix: towerWindMatrix,
  currentReadout: currentTowerWindReadout,
} = useTowerWindMatrix({
  phase: runwayPhase,
  rcamCode: selectedRcamCode,
  runwayHeading,
  referenceWindDirection: towerReferenceWindDirection,
  windSpeed: () => windResult.value?.parsedWind.effectiveSpeed ?? null,
  isVariableWind: () => windResult.value?.parsedWind.isVariable ?? false,
});

const rawMetar = computed(() => metar.value?.rawOb ?? null);
const isLoading = computed(() => conditionsStatus.value === 'loading');

watch(windResult, (result) => {
  if (result) nextTick(() => readoutRef.value?.scrollIntoView?.({ behavior: 'smooth', block: 'start' }));
});

const metarFreshnessText = computed(() => {
  if (!isOnline.value || lastFetchedAt.value === null) return null;
  const elapsedMs = Math.max(0, freshnessNowMs.value - lastFetchedAt.value);
  const elapsedMin = Math.floor(elapsedMs / 60_000);
  const relative = elapsedMin === 0 ? 'Updated just now' : `Updated ${elapsedMin} min ago`;
  const absolute = new Date(lastFetchedAt.value).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });
  return `${relative} (${absolute} local)`;
});

const isMetarActive = computed(() => !manualMode.value && conditionsStatus.value === 'success' && metar.value !== null);

const metarFreshnessRaw = computed(() => {
  if (!isMetarActive.value || !rawMetar.value) return null;
  const trimmed = rawMetar.value.trim();
  if (!trimmed) return null;
  return `METAR: ${trimmed}`;
});

function formatUtcTime(ms: number): string {
  const date = new Date(ms);
  const hours = String(date.getUTCHours()).padStart(2, '0');
  const minutes = String(date.getUTCMinutes()).padStart(2, '0');
  return `${hours}:${minutes}Z`;
}

function formatElapsedMinutes(minutes: number): string {
  if (minutes <= 0) return 'just now';
  return `${minutes} min ago`;
}

const metarIssuedAgeMin = computed(() => {
  if (!isMetarActive.value) return null;
  const metarValue = metar.value;
  if (!metarValue || metarValue.issuedAt === null) return null;
  const elapsedMs = Math.max(0, freshnessNowMs.value - metarValue.issuedAt);
  return Math.floor(elapsedMs / 60_000);
});

const metarIssuedStatus = computed(() => {
  const age = metarIssuedAgeMin.value;
  if (age === null) return 'unknown';
  if (age >= METAR_ISSUED_STALE_MIN) return 'stale';
  if (age >= METAR_ISSUED_WARNING_MIN) return 'warn';
  return 'ok';
});

const metarIssuedAtUtc = computed(() => {
  if (!isMetarActive.value) return null;
  const metarValue = metar.value;
  if (!metarValue || metarValue.issuedAt === null) return null;
  return formatUtcTime(metarValue.issuedAt);
});

const nowUtc = computed(() => formatUtcTime(freshnessNowMs.value));

const metarFetchedAgeMin = computed(() => {
  if (!isMetarActive.value || lastFetchedAt.value === null) return null;
  const elapsedMs = Math.max(0, freshnessNowMs.value - lastFetchedAt.value);
  return Math.floor(elapsedMs / 60_000);
});

const metarFetchedAtUtc = computed(() => {
  if (!isMetarActive.value || lastFetchedAt.value === null) return null;
  return formatUtcTime(lastFetchedAt.value);
});

const metarConversionSummary = computed(() => {
  if (!isMetarActive.value || !windResult.value) return null;
  const result = windResult.value;
  if (result.parsedWind.isCalm) {
    return 'Calm wind — no directional conversion is needed.';
  }
  if (result.parsedWind.isVariable) {
    return 'Variable direction — no fixed magnetic direction is available.';
  }
  const declination = result.magneticCorrection.declination;
  const absDeclination = Math.abs(declination).toFixed(1);
  const direction = result.parsedWind.directionTrue;
  return `${direction}°T → ${result.windDirectionMagnetic.toFixed(0).padStart(3, '0')}°M (${absDeclination}°${declination >= 0 ? 'E' : 'W'} declination)`;
});

function handleOffline() {
  isOnline.value = false;
  manualMode.value = true;
}

function handleOnline() {
  isOnline.value = true;
}

onMounted(() => {
  window.addEventListener('offline', handleOffline);
  window.addEventListener('online', handleOnline);

  if (!isOnline.value) {
    manualMode.value = true;
  }
});

onUnmounted(() => {
  window.removeEventListener('offline', handleOffline);
  window.removeEventListener('online', handleOnline);
});

watch(manualMode, async (enabled) => {
  if (enabled) {
    clearConditions();
    icaoInput.value = '';
  } else {
    if (activeIcao.value.length >= 3) {
      icaoInput.value = activeIcao.value;
      await onFetch(activeIcao.value);
    }
  }
});
</script>

<template>
  <main class="app-main">
    <header class="app-header">
      <div class="title-row">
        <h1 class="app-title">A220 Wind Limits</h1>
        <div class="header-actions">
          <a
            class="site-link"
            href="https://www.220stuff.app"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Open www.220stuff.app in a new tab"
          >
            <svg class="share-icon" viewBox="0 0 24 24" aria-hidden="true">
              <path d="M12 3v12m0-12L8 7m4-4 4 4" />
              <path d="M7 10H5v10h14V10h-2" />
            </svg>
            <span>www.220stuff.app</span>
          </a>
          <button class="theme-toggle" type="button" :aria-label="themeToggleLabel" @click="emit('toggleTheme')">
            <svg v-if="theme === 'dark'" class="theme-icon" viewBox="0 0 24 24" aria-hidden="true">
              <circle cx="12" cy="12" r="4" />
              <line x1="12" y1="1.5" x2="12" y2="5.2" />
              <line x1="12" y1="18.8" x2="12" y2="22.5" />
              <line x1="1.5" y1="12" x2="5.2" y2="12" />
              <line x1="18.8" y1="12" x2="22.5" y2="12" />
              <line x1="4.3" y1="4.3" x2="6.9" y2="6.9" />
              <line x1="17.1" y1="17.1" x2="19.7" y2="19.7" />
              <line x1="4.3" y1="19.7" x2="6.9" y2="17.1" />
              <line x1="17.1" y1="6.9" x2="19.7" y2="4.3" />
            </svg>
            <svg v-else class="theme-icon" viewBox="0 0 24 24" aria-hidden="true">
              <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 1 0 9.8 9.8z" />
            </svg>
            <span>{{ theme === 'dark' ? 'Light mode' : 'Dark mode' }}</span>
          </button>
        </div>
      </div>
      <p class="app-subtitle">Quick-reference wind limits for start, takeoff, and landing</p>
    </header>

    <div class="pilot-disclaimer" role="note">
      <strong>Pilot advisory:</strong> This is not an official Airbus or airline app.
      Always verify wind and performance data against approved sources (ATIS/AWOS, METAR, and company procedures)...
      seriously... I made this at the hotel.
    </div>

    <div class="phase-selector" role="group" aria-label="Phase of flight">
      <button
        id="phase-start"
        class="phase-btn"
        :class="{ active: activePhase === 'start' }"
        type="button"
        :aria-pressed="activePhase === 'start'"
        @click="activePhase = 'start'"
      >
        Start
      </button>
      <button
        id="phase-takeoff"
        class="phase-btn"
        :class="{ active: activePhase === 'takeoff' }"
        type="button"
        :aria-pressed="activePhase === 'takeoff'"
        @click="activePhase = 'takeoff'"
      >
        Takeoff
      </button>
      <button
        id="phase-landing"
        class="phase-btn"
        :class="{ active: activePhase === 'landing' }"
        type="button"
        :aria-pressed="activePhase === 'landing'"
        @click="activePhase = 'landing'"
      >
        Landing
      </button>
    </div>

    <!-- Controls row -->
    <div class="grid controls-row">
      <BaseToggle id="manual-mode-toggle" v-model="manualMode" class="col-4" :disabled="!isOnline"
        active-label="Switch to Live Data" inactive-label="Switch to Manual Input" variant="info" />
      <BaseToggle v-if="activePhase === 'start'" id="taxi-speed-toggle" v-model="showTaxiSpeed" class="col-4" active-label="Hide taxi speed"
        inactive-label="Show minimum taxi speed" variant="primary" />
      <div v-if="activePhase === 'start' && showTaxiSpeed" class="col-4 taxi-speed-input">
        <label class="taxi-input-label">
          Max taxi speed warning (kt):
          <input type="number" v-model="maxTaxiSpeedInput" min="1" max="20" class="taxi-input" />
        </label>
      </div>
    </div>

    <!-- Manual entry panel -->
    <ManualWindEntry v-if="manualMode" v-model="manualInputs" :theme="theme" />

    <div v-if="!manualMode">
      <AirportInput v-model="icaoInput" :status="conditionsStatus" :disabled="!isOnline || manualMode" @fetch="onFetch" />
    </div>

    <p v-if="metarFreshnessText" class="metar-freshness">
      <span>{{ metarFreshnessText }}</span>
      <span v-if="metarFreshnessRaw" class="metar-freshness-raw">{{ metarFreshnessRaw }}</span>
    </p>

    <StatusMessage v-if="!isOnline" variant="warning">
      Offline: METAR retrieval is unavailable. Manual wind entry is required.
    </StatusMessage>

    <section v-if="runwayPhase" class="runway-card">
      <div class="runway-setup">
        <label v-if="runwayOptions.length > 0" class="runway-field">
          Runway
          <select
            id="runway-selector"
            v-model="runwaySelectionValue"
            :disabled="isLoading"
          >
            <option value="" disabled>Select runway…</option>
            <option v-for="runway in runwayOptions" :key="runway.name" :value="runway.name">
              {{ runway.name }} — {{ String(runway.heading).padStart(3, '0') }}°M
            </option>
            <option value="manual">Manual heading</option>
          </select>
        </label>
        <label v-if="runwayOptions.length === 0 || runwaySelectionValue === 'manual'" class="runway-field">
          {{ runwayOptions.length === 0 ? 'Runway heading (°M)' : 'Manual heading (°M)' }}
          <input
            id="runway-heading-input"
            v-model="runwayHeadingInput"
            type="number"
            min="0"
            max="360"
            step="1"
            :disabled="isLoading"
          />
        </label>
        <p v-if="!isLoading && runwayOptions.length === 0" class="runway-hint">
          Runway data unavailable—enter a magnetic heading manually.
        </p>
        <label class="runway-field">
          RCAM
          <select id="rcam-code-select" v-model="rcamCodeInput">
            <option value="6">6</option>
            <option value="5">5</option>
            <option value="4">4</option>
            <option value="3">3</option>
            <option value="2">2</option>
            <option value="1">1</option>
          </select>
        </label>
      </div>
    </section>

    <!-- Loading indicator -->
    <StatusMessage v-if="isLoading" variant="loading">
      Fetching data…
    </StatusMessage>

    <!-- Conditions fetch failed -->
    <ErrorPanel v-else-if="conditionsFailed && !manualMode" title="Could not retrieve airport conditions">
      <p class="error-detail">{{ conditionsError }}</p>
      <div class="error-actions">
        <button class="action-btn primary" @click="enableManualMode">
          Enter winds manually
        </button>
      </div>
    </ErrorPanel>

    <!-- Results -->
    <div ref="readoutRef" />
    <template v-if="windResult">
      <div v-if="isMetarActive" class="metar-issued-panel" :class="`metar-issued-${metarIssuedStatus}`">
        <div class="metar-issued-row">
          <strong v-if="metarIssuedAtUtc">
            Issued at {{ metarIssuedAtUtc }}
            <span v-if="metarIssuedAgeMin !== null">({{ formatElapsedMinutes(metarIssuedAgeMin) }})</span>
          </strong>
          <span v-else>Issued time unavailable from METAR.</span>
        </div>
        <div class="metar-issued-row">Time now is {{ nowUtc }}.</div>
        <div class="metar-issued-row" v-if="metarFetchedAgeMin !== null && metarFetchedAtUtc">
          Fetched {{ formatElapsedMinutes(metarFetchedAgeMin) }} at {{ metarFetchedAtUtc }}.
        </div>
        <div class="metar-conversion-notice" data-testid="metar-conversion-notice">
          <strong>METAR winds: TRUE → MAGNETIC</strong>
          <span>{{ metarConversionSummary }}</span>
        </div>
      </div>

      <AssumptionsDisplay :result="windResult" :raw-metar="rawMetar" />

      <template v-if="activePhase === 'start'">
        <SafetyReadout :result="windResult" />
        <CompassRose :result="windResult" :show-taxi="showTaxiSpeed" />
        <HeadingTable v-if="headingRows.length > 0" :rows="headingRows" :show-taxi="showTaxiSpeed"
          :max-taxi-speed="maxTaxiSpeed" />
        <StatusMessage v-else-if="windResult.parsedWind.isCalm" variant="calm">
          No table shown for calm winds.
        </StatusMessage>
        <StatusMessage v-else-if="windResult.parsedWind.isVariable && windResult.allHeadingsSafe" variant="calm">
          Table not available for variable winds — speed is within the tailwind limit.
        </StatusMessage>
        <StatusMessage v-else-if="windResult.parsedWind.isVariable" variant="warning">
          Table not available for variable winds — any heading may be unsafe.
        </StatusMessage>
      </template>

      <section v-else>
        <TowerWindMatrix
          v-if="runwayPhase && towerWindMatrix"
          :phase="runwayPhase"
          :matrix="towerWindMatrix"
          :current-readout="currentTowerWindReadout"
        />
      </section>
    </template>

    <!-- Idle state -->
    <div v-else-if="!isLoading && conditionsStatus === 'idle' && !manualMode" class="idle-prompt">
      Enter an ICAO identifier above and click <strong>Check METAR</strong>, or enable manual entry.
    </div>

    <footer class="app-footer">
      <NuxtLink to="/activity" class="activity-link">See Recent Activity</NuxtLink>
      <a href="https://www.buymeacoffee.com/tarmacdenter" target="_blank" rel="noopener noreferrer">
        <img src="https://cdn.buymeacoffee.com/buttons/v2/default-yellow.png" alt="Buy Me A Coffee" class="bmc-button">
      </a>
      <a href="https://github.com/TarmacDenter/A220Tools" target="_blank" rel="noopener noreferrer" class="github-link"
        aria-label="View source on GitHub">
        <svg class="github-icon" viewBox="0 0 16 16" aria-hidden="true">
          <path fill-rule="evenodd"
            d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z" />
        </svg>
        Contribute on GitHub
      </a>
    </footer>
  </main>
</template>

<style scoped>
.app-main {
  max-width: 900px;
  margin: 0 auto;
  padding: 1.5rem 1rem;
}

.app-header {
  margin-bottom: 1.5rem;
}

.title-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  flex-wrap: wrap;
}

.app-title {
  font-size: 1.75rem;
  font-weight: 700;
  color: var(--color-text);
  margin: 0;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.site-link {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  color: var(--color-primary);
  font-size: 0.8rem;
  font-weight: 600;
  line-height: 1;
  padding: 0.3rem 0;
  text-decoration: none;
}

.site-link:hover {
  color: var(--color-primary-hover);
  text-decoration: underline;
}

.share-icon {
  width: 1rem;
  height: 1rem;
  fill: none;
  stroke: currentColor;
  stroke-linecap: round;
  stroke-linejoin: round;
  stroke-width: 1.8;
}

.theme-toggle {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  border: 1px solid var(--color-border);
  border-radius: 9999px;
  background: var(--color-surface);
  color: var(--color-text-subtle);
  cursor: pointer;
  font-size: 0.8rem;
  font-weight: 600;
  padding: 0.3rem 0.65rem;
  line-height: 1;
}

.theme-toggle:hover {
  background: var(--color-surface-muted);
}

.theme-icon {
  width: 0.95rem;
  height: 0.95rem;
  fill: currentColor;
  stroke: currentColor;
  stroke-width: 1.7;
  stroke-linecap: round;
}

.app-subtitle {
  font-size: 0.95rem;
  color: var(--color-text-muted);
  margin: 0.25rem 0 0;
}

.pilot-disclaimer {
  background: var(--color-warning-bg);
  border: 1px solid var(--color-warning-border);
  border-radius: 8px;
  color: var(--color-warning-text);
  font-size: 0.9rem;
  line-height: 1.5;
  margin: 0 0 1rem;
  padding: 0.75rem 1rem;
}

.phase-selector {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 0.35rem;
  margin: 0 0 1rem;
  padding: 0.25rem;
  border: 1px solid var(--color-border);
  border-radius: 8px;
  background: var(--color-surface-muted);
}

.phase-btn {
  min-height: 2.4rem;
  border: 1px solid transparent;
  border-radius: 6px;
  background: transparent;
  color: var(--color-text-subtle);
  cursor: pointer;
  font-size: 0.9rem;
  font-weight: 700;
}

.phase-btn:hover {
  background: var(--color-surface);
  border-color: var(--color-border);
}

.phase-btn.active {
  background: var(--color-primary);
  border-color: var(--color-primary-hover);
  color: var(--color-primary-text);
}

.manual-toggle {
  margin: 0.5rem 0;
}

.metar-freshness {
  margin: 0.25rem 0 0.75rem;
  font-size: 0.85rem;
  color: var(--color-text-subtle);
}

.metar-freshness-raw {
  display: block;
  margin-top: 0.15rem;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace;
  font-size: 0.8rem;
  color: var(--color-text-muted);
}

.metar-issued-panel {
  margin: 0.5rem 0 1rem;
  padding: 0.75rem 1rem;
  border-radius: 8px;
  font-size: 0.9rem;
  border: 1px solid var(--color-info-border);
  background: var(--color-info-bg);
  color: var(--color-info-text);
}

.metar-issued-panel.metar-issued-warn {
  border-color: var(--color-warning-border);
  background: var(--color-warning-bg);
  color: var(--color-warning-text);
}

.metar-issued-panel.metar-issued-stale {
  border-color: var(--color-unsafe-border);
  background: var(--color-unsafe-bg);
  color: var(--color-unsafe-text);
}

.metar-issued-row+.metar-issued-row {
  margin-top: 0.25rem;
}

.metar-conversion-notice {
  display: flex;
  flex-wrap: wrap;
  gap: 0.35rem 0.75rem;
  align-items: baseline;
  margin-top: 0.65rem;
  padding: 0.55rem 0.7rem;
  border: 2px solid currentColor;
  border-radius: 6px;
}

.metar-conversion-notice strong {
  font-size: 0.85rem;
  letter-spacing: 0.03em;
}

.toggle-label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
  font-size: 0.9rem;
  color: var(--color-text-subtle);
}

.toggle-label input[type='checkbox'] {
  width: 1rem;
  height: 1rem;
  cursor: pointer;
}

.idle-prompt {
  margin: 2rem 0;
  padding: 1.5rem;
  background: var(--color-surface-muted);
  border: 1px dashed var(--color-border);
  border-radius: 8px;
  text-align: center;
  color: var(--color-text-muted);
  font-size: 0.95rem;
}

.controls-row {
  margin: 0.75rem 0;
  align-items: center;
}

.taxi-speed-input {
  display: flex;
  align-items: center;
}

.taxi-input-label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.85rem;
  color: var(--color-text-subtle);
}

.taxi-input {
  width: 4rem;
  padding: 0.25rem 0.4rem;
  border: 1px solid var(--color-border);
  border-radius: 4px;
  font-size: 0.85rem;
  background: var(--color-surface);
  color: var(--color-text);
}

.runway-card {
  margin: 1rem 0;
}

.runway-setup {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.75rem;
}

.runway-field {
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
  color: var(--color-text-subtle);
  font-size: 0.82rem;
  font-weight: 700;
}

.runway-field input,
.runway-field select {
  min-height: 2.35rem;
  border: 1px solid var(--color-border);
  border-radius: 6px;
  background: var(--color-surface);
  color: var(--color-text);
  font-family: var(--font-mono);
  font-size: 1rem;
  padding: 0.35rem 0.55rem;
}

.runway-hint {
  margin: 0;
  align-self: end;
  color: var(--color-text-muted);
  font-size: 0.82rem;
}

.app-footer {
  margin-top: 2.5rem;
  padding: 1.25rem 0 0.5rem;
  border-top: 1px solid var(--color-border);
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.75rem;
}

.bmc-button {
  height: 60px;
  width: 217px;
}

.github-link {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  color: var(--color-text-muted);
  text-decoration: none;
  font-size: 0.85rem;
  transition: color 0.15s ease;
}

.github-link:hover {
  color: var(--color-text);
}

.github-icon {
  width: 1.1rem;
  height: 1.1rem;
  fill: currentColor;
}

.activity-link {
  color: var(--color-text-muted);
  text-decoration: none;
  font-size: 0.8rem;
  transition: color 0.15s ease;
}

.activity-link:hover {
  color: var(--color-text);
}

@media (max-width: 600px) {
  .runway-setup {
    grid-template-columns: 1fr;
  }
}
</style>
