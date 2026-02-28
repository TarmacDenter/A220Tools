import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useMetar } from '@/composables/useMetar'
import { fetchAviationWeatherJson } from '@/composables/aviationWeatherApi'

vi.mock('@/composables/aviationWeatherApi', () => ({
  fetchAviationWeatherJson: vi.fn(),
}))

describe('useMetar', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('stores lastFetchedAt on successful METAR fetch', async () => {
    vi.setSystemTime(new Date('2026-01-15T10:00:00'))
    vi.mocked(fetchAviationWeatherJson).mockResolvedValue([
      {
        icaoId: 'KSEA',
        rawOb: 'KSEA 151000Z 24015KT 10SM CLR 03/M02 A3010',
        wdir: 240,
        wspd: 15,
        wgst: null,
        lat: 47.45,
        lon: -122.31,
        name: 'Seattle Tacoma Intl',
      },
    ])

    const metar = useMetar()
    await metar.fetchMetar('KSEA')

    expect(metar.status.value).toBe('success')
    expect(metar.lastFetchedAt.value).toBe(new Date('2026-01-15T10:00:00').getTime())
  })

  it('parses issued time from raw METAR observation', async () => {
    const now = new Date(Date.UTC(2026, 0, 15, 10, 0, 0))
    vi.setSystemTime(now)
    vi.mocked(fetchAviationWeatherJson).mockResolvedValue([
      {
        icaoId: 'KSEA',
        rawOb: 'KSEA 151000Z 24015KT 10SM CLR 03/M02 A3010',
        wdir: 240,
        wspd: 15,
        wgst: null,
        lat: 47.45,
        lon: -122.31,
        name: 'Seattle Tacoma Intl',
      },
    ])

    const metar = useMetar()
    await metar.fetchMetar('KSEA')

    expect(metar.metar.value?.issuedAt).toBe(Date.UTC(2026, 0, 15, 10, 0, 0))
  })

  it('retains lastFetchedAt after a later fetch error', async () => {
    const firstSuccessTime = new Date('2026-01-15T10:00:00')
    vi.setSystemTime(firstSuccessTime)
    vi.mocked(fetchAviationWeatherJson).mockResolvedValueOnce([
      {
        icaoId: 'KSEA',
        rawOb: 'KSEA 151000Z 24015KT 10SM CLR 03/M02 A3010',
        wdir: 240,
        wspd: 15,
        wgst: null,
        lat: 47.45,
        lon: -122.31,
        name: 'Seattle Tacoma Intl',
      },
    ])

    const metar = useMetar()
    await metar.fetchMetar('KSEA')

    vi.setSystemTime(new Date('2026-01-15T10:05:00'))
    vi.mocked(fetchAviationWeatherJson).mockRejectedValueOnce(new Error('Network down'))
    await metar.fetchMetar('KSEA')

    expect(metar.status.value).toBe('error')
    expect(metar.lastFetchedAt.value).toBe(firstSuccessTime.getTime())
  })
})
