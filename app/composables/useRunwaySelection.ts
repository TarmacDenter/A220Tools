import { computed, ref, watch, type Ref } from 'vue'
import type { RunwaySelection } from '#shared/types/api'
import { normalizeRunwayHeading } from '@/utils/formatting'

export function useRunwaySelection(runways: Ref<RunwaySelection[]>) {
  const runwayHeadingInput = ref('')
  const runwaySelectionValue = ref('manual')
  const selectedRunway = ref<RunwaySelection | null>(null)

  const runwayOptions = computed(() => {
    const options = [...runways.value]
    if (
      selectedRunway.value &&
      !options.some((runway) => runway.name === selectedRunway.value?.name)
    ) {
      options.push(selectedRunway.value)
    }
    return options.sort((a, b) => a.heading - b.heading || a.name.localeCompare(b.name))
  })

  const runwayHeading = computed<number | null>(() => {
    if (selectedRunway.value) return selectedRunway.value.heading
    if (runwaySelectionValue.value !== 'manual') return null
    return normalizeRunwayHeading(String(runwayHeadingInput.value ?? ''))
  })

  function onRunwaySelectionChange() {
    if (runwaySelectionValue.value === 'manual' || runwaySelectionValue.value === '') {
      selectedRunway.value = null
      return
    }
    selectedRunway.value =
      runwayOptions.value.find((runway) => runway.name === runwaySelectionValue.value) ?? null
  }

  function resetForAirport() {
    selectedRunway.value = null
    runwaySelectionValue.value = 'manual'
    runwayHeadingInput.value = ''
    runways.value = []
  }

  function completeAirportLoad() {
    runwaySelectionValue.value = runways.value.length > 0 ? '' : 'manual'
  }

  watch(runwaySelectionValue, onRunwaySelectionChange)

  watch(
    runways,
    (updatedRunways) => {
      if (!selectedRunway.value) return
      const refreshed = updatedRunways.find((runway) => runway.name === selectedRunway.value?.name)
      if (refreshed) selectedRunway.value = refreshed
    },
    { deep: true },
  )

  return {
    runwayHeadingInput,
    runwaySelectionValue,
    selectedRunway,
    runwayOptions,
    runwayHeading,
    resetForAirport,
    completeAirportLoad,
  }
}
