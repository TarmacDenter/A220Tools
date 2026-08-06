import { ref, nextTick } from 'vue'
import { describe, expect, it } from 'vitest'
import { elapsedMinutesSince, getFreshnessStatus } from '#shared/domain/freshness'
import { useRunwaySelection } from '@/composables/useRunwaySelection'
import { formatMagneticHeading } from '@/utils/formatting'

describe('shared refactoring helpers', () => {
  it('calculates elapsed minutes without allowing future timestamps to go negative', () => {
    expect(elapsedMinutesSince(10 * 60_000, 9 * 60_000)).toBe(1)
    expect(elapsedMinutesSince(10 * 60_000, 11 * 60_000)).toBe(0)
  })

  it('classifies freshness consistently', () => {
    expect(getFreshnessStatus(null, 30, 60)).toBe('unknown')
    expect(getFreshnessStatus(29, 30, 60)).toBe('ok')
    expect(getFreshnessStatus(30, 30, 60)).toBe('warn')
    expect(getFreshnessStatus(60, 30, 60)).toBe('stale')
  })

  it('formats magnetic headings using the shared display convention', () => {
    expect(formatMagneticHeading(4)).toBe('004°')
    expect(formatMagneticHeading(360)).toBe('360°')
  })

  it('preserves a selected runway across refreshed runway data', async () => {
    const runways = ref([
      { name: '04L', heading: 44 },
      { name: '22R', heading: 224 },
    ])
    const selection = useRunwaySelection(runways)

    selection.runwaySelectionValue.value = '04L'
    await nextTick()
    expect(selection.runwayHeading.value).toBe(44)

    runways.value = [{ name: '04L', heading: 45 }]
    await nextTick()
    expect(selection.runwayHeading.value).toBe(45)
  })
})
