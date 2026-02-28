<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from 'vue';
import { useMetar, parseMetarWind } from '@/composables/useMetar';
import { useAirportInfo } from '@/composables/useAirportInfo';
import { computeWindResult, buildHeadingTable } from '@/composables/useWindCalculations';
import { useInterval } from '@/composables/useInterval';
import { TAILWIND_LIMIT_KT } from '@/constants/windLimits';
import { METAR_ISSUED_STALE_MIN, METAR_ISSUED_WARNING_MIN } from '@/constants/metarTiming';
import type { MagneticCorrection, ParsedWind } from '@/types/wind';

import AirportInput from './AirportInput.vue';
import ManualWindEntry from './ManualWindEntry.vue';
import { parseManualWind } from '@/composables/useManualWind';
import type { ManualWindInput } from '@/composables/useManualWind';
import AssumptionsDisplay from './AssumptionsDisplay.vue';
import SafetyReadout from './SafetyReadout.vue';
import CompassRose from './CompassRose.vue';
import HeadingTable from './HeadingTable.vue';
import StatusMessage from './ui/StatusMessage.vue';
import ErrorPanel from './ui/ErrorPanel.vue';

withDefaults(defineProps<{
  theme?: 'light' | 'dark'
  themeToggleLabel?: string
}>(), {
  theme: 'light',
  themeToggleLabel: 'Toggle theme',
})

const emit = defineEmits<{
  toggleTheme: []
}>()

// --- State ---
const manualMode = ref(false);
const manualInputs = ref<ManualWindInput>({
  direction: '',
  speed: '',
  gust: '',
  source: 'metar_true',
  declinationMagnitude: '',
  declinationDir: 'W',
});
// User chose to continue with 0° declination despite airport fetch failure
const useZeroDecl = ref(false);

const { status: metarStatus, metar, error: metarError, lastFetchedAt, fetchMetar, clearMetar } = useMetar();
const { status: airportStatus, magneticCorrection, error: airportError, fetchAirportInfo } = useAirportInfo();
const icaoInput = ref('');
const activeIcao = ref('');
const isOnline = ref(typeof navigator === 'undefined' ? true : navigator.onLine);
const freshnessNowMs = ref(Date.now());

// --- Intervals ---
useInterval(() => {
  freshnessNowMs.value = Date.now();
}, 60_000);

useInterval(() => {
  if (!isOnline.value) return;
  if (manualMode.value) return;
  if (metarStatus.value !== 'success') return;
  if (activeIcao.value.length < 3) return;
  void fetchMetar(activeIcao.value);
}, 300_000);

// --- Fetch orchestration ---
async function onFetch(icao: string) {
  if (!isOnline.value) return;
  useZeroDecl.value = false;
  activeIcao.value = icao.toUpperCase();
  // Requests are sequenced (not concurrent) to avoid triggering rate limiting
  // on the Aviation Weather API and CORS proxies, which enforce a 1 req/min/thread limit.
  await fetchMetar(icao);
  await fetchAirportInfo(icao);
}

function enableManualMode() {
  manualMode.value = true;
}

function continueWithZeroDecl() {
  useZeroDecl.value = true;
  console.warn('[WindCheckerApp] User chose to continue with 0° declination — METAR winds are TRUE, no magnetic correction applied');
}

// --- Error state helpers ---
const bothFailed = computed(() =>
  metarStatus.value === 'error' && airportStatus.value === 'error'
);
const onlyMetarFailed = computed(() =>
  metarStatus.value === 'error' && airportStatus.value !== 'error'
);
const onlyAirportFailed = computed(() =>
  metarStatus.value === 'success' && airportStatus.value === 'error' && !useZeroDecl.value
);

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
  if (useZeroDecl.value) {
    return { declination: 0, source: 'airport_api', rawMagdecString: null };
  }
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
  if (onlyAirportFailed.value) return null;
  return computeWindResult(pw, mc);
});

const headingRows = computed(() => {
  const result = windResult.value;
  if (!result) return [];
  const { parsedWind: pw, windDirectionMagnetic } = result;
  if (pw.isCalm || pw.isVariable) return [];
  return buildHeadingTable(windDirectionMagnetic, pw.effectiveSpeed, TAILWIND_LIMIT_KT);
});

const rawMetar = computed(() => metar.value?.rawOb ?? null);
const isLoading = computed(() => metarStatus.value === 'loading' || airportStatus.value === 'loading');
const manualModeToggle = computed({
  get: () => manualMode.value,
  set: (value: boolean) => {
    if (!isOnline.value && !value) return;
    manualMode.value = value;
  },
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

const isMetarActive = computed(() => !manualMode.value && metarStatus.value === 'success' && metar.value !== null);

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

watch(manualMode, (enabled) => {
  if (!enabled) return;
  clearMetar();
  icaoInput.value = '';
  useZeroDecl.value = false;
});
</script>

<template>
  <main class="app-main">
    <header class="app-header">
      <div class="title-row">
        <h1 class="app-title">A220 Engine Start Wind Checker</h1>
        <button
          class="theme-toggle"
          type="button"
          :aria-label="themeToggleLabel"
          @click="emit('toggleTheme')"
        >
          <svg
            v-if="theme === 'dark'"
            class="theme-icon"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
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
          <svg
            v-else
            class="theme-icon"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 1 0 9.8 9.8z" />
          </svg>
          <span>{{ theme === 'dark' ? 'Light mode' : 'Dark mode' }}</span>
        </button>
      </div>
      <p class="app-subtitle">Verify tailwind ≤ 18 kt limit for first engine start, or any stationary start</p>
    </header>

    <div class="pilot-disclaimer" role="note">
      <strong>Pilot advisory:</strong> This is not an official Airbus or airline app.
      Always verify wind and performance data against approved sources (ATIS/AWOS, METAR, and company procedures)...
      seriously... I made this at the hotel.
    </div>

    <AirportInput v-model="icaoInput" :status="metarStatus" :disabled="!isOnline" @fetch="onFetch" />

    <p v-if="metarFreshnessText" class="metar-freshness">{{ metarFreshnessText }}</p>

    <StatusMessage v-if="!isOnline" variant="warning">
      Offline: METAR retrieval is unavailable. Manual wind entry is required.
    </StatusMessage>

    <!-- Manual mode toggle -->
    <div class="manual-toggle">
      <label class="toggle-label">
        <input type="checkbox" v-model="manualModeToggle" :disabled="!isOnline" />
        <span>Enter winds manually</span>
      </label>
    </div>

    <!-- Manual entry panel -->
    <ManualWindEntry v-if="manualMode" v-model="manualInputs" />

    <!-- Loading indicator -->
    <StatusMessage v-if="isLoading" variant="loading">
      Fetching data…
    </StatusMessage>

    <!-- Both fetches failed -->
    <ErrorPanel
      v-else-if="bothFailed && !manualMode"
      title="Could not retrieve data"
    >
      <p class="error-detail"><strong>METAR:</strong> {{ metarError }}</p>
      <p class="error-detail"><strong>Airport info:</strong> {{ airportError }}</p>
      <div class="error-actions">
        <button class="action-btn primary" @click="enableManualMode">
          Enter winds manually
        </button>
      </div>
    </ErrorPanel>

    <!-- Only METAR failed -->
    <ErrorPanel
      v-else-if="onlyMetarFailed && !manualMode"
      title="METAR fetch failed"
    >
      <p class="error-detail">{{ metarError }}</p>
      <p class="error-hint">You can enter winds manually below. Airport magnetic declination was retrieved successfully.</p>
      <div class="error-actions">
        <button class="action-btn primary" @click="enableManualMode">
          Enter winds manually
        </button>
      </div>
    </ErrorPanel>

    <!-- METAR succeeded but airport info failed — user must choose -->
    <ErrorPanel
      v-else-if="onlyAirportFailed"
      variant="warn"
      title="Airport declination unavailable"
    >
      <p class="error-detail">{{ airportError }}</p>
      <p class="error-hint">
        METAR winds are reported in <strong>TRUE</strong> degrees. Without a declination value they
        cannot be converted to magnetic. Choose an option:
      </p>
      <div class="error-actions">
        <button class="action-btn secondary" @click="continueWithZeroDecl">
          Continue with 0° declination
          <span class="action-note">(treat METAR winds as magnetic — adjust mentally)</span>
        </button>
        <button class="action-btn primary" @click="enableManualMode">
          Enter winds manually
          <span class="action-note">(enter magnetic direction directly)</span>
        </button>
      </div>
    </ErrorPanel>

    <!-- Results -->
    <template v-if="windResult">
      <!-- Zero-decl warning banner -->
      <StatusMessage v-if="useZeroDecl" variant="warning">
        <strong>Warning:</strong> No declination applied — METAR winds are TRUE degrees.
        Magnetic variation at this airport is unknown. Verify against ATIS/AWOS.
      </StatusMessage>

      <div
        v-if="isMetarActive"
        class="metar-issued-panel"
        :class="`metar-issued-${metarIssuedStatus}`"
      >
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
      </div>

      <AssumptionsDisplay :result="windResult" :raw-metar="rawMetar" />
      <SafetyReadout :result="windResult" />
      <CompassRose :result="windResult" />
      <HeadingTable v-if="headingRows.length > 0" :rows="headingRows" />
      <StatusMessage v-else-if="windResult.parsedWind.isCalm" variant="calm">
        No table shown for calm winds.
      </StatusMessage>
      <StatusMessage v-else-if="windResult.parsedWind.isVariable" variant="warning">
        Table not available for variable winds — any heading may be unsafe.
      </StatusMessage>
    </template>

    <!-- Idle state -->
    <div v-else-if="!isLoading && metarStatus === 'idle' && !manualMode" class="idle-prompt">
      Enter an ICAO identifier above and click <strong>Check METAR</strong>, or enable manual entry.
    </div>
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

.manual-toggle {
  margin: 0.5rem 0;
}

.metar-freshness {
  margin: 0.25rem 0 0.75rem;
  font-size: 0.85rem;
  color: var(--color-text-subtle);
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

.metar-issued-row + .metar-issued-row {
  margin-top: 0.25rem;
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
</style>
