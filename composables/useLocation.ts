import { ref, computed } from 'vue'

type LocBtnState = 'idle' | 'loading' | 'fetched' | 'error' | 'unsupported';
type LocError = 'permission_denied' | 'lookup_failed' | null;

export function useLocation() {
  const isSupported = typeof navigator !== 'undefined' && 'geolocation' in navigator;
  const isFetchingLocation = ref(false);
  const fetchedIcao = ref<string | null>(null);
  const locError = ref<LocError>(null);

  const locBtnState = computed<LocBtnState>(() => {
    if (!isSupported || locError.value === 'permission_denied') return 'unsupported';
    if (isFetchingLocation.value) return 'loading';
    if (locError.value) return 'error';
    if (fetchedIcao.value) return 'fetched';
    return 'idle';
  });

  const locBtnText = computed(() => {
    switch (locBtnState.value) {
      case 'idle': return 'Use My Location';
      case 'loading': return 'Locating\u2026';
      case 'fetched': return `Refresh Location (${fetchedIcao.value})`;
      case 'error': return 'Location unavailable';
      case 'unsupported': return '';
    }
  });

  async function onLocClick() {
    if (isFetchingLocation.value) return;
    isFetchingLocation.value = true;
    locError.value = null;
    fetchedIcao.value = null;

    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject);
      });

      const data = await $fetch<{ icao: string }>('/api/nearest-airport', {
        query: { lat: position.coords.latitude, lon: position.coords.longitude },
      });

      fetchedIcao.value = data.icao;
    } catch (err) {
      const code = err != null && typeof err === 'object' && 'code' in err
        ? (err as { code: number }).code
        : null;
      locError.value = code === 1 ? 'permission_denied' : 'lookup_failed';
    } finally {
      isFetchingLocation.value = false;
    }
  }

  return { locBtnState, locBtnText, fetchedIcao, onLocClick };
}
