import { afterEach, describe, expect, it, vi } from 'vitest'
import { useAirportConditions } from '@/composables/useAirportConditions'
import { fetchAirportConditionsFromServer } from '@/services/aviationWeatherApi'

vi.mock('@/services/aviationWeatherApi', () => ({
  fetchAirportConditionsFromServer: vi.fn(),
}))

const conditions = {
  metar: {
    icaoId: 'KSEA',
    rawOb: 'KSEA 151000Z 24015KT 10SM CLR 03/M02 A3010',
    wdir: 240,
    wspd: 15,
    wgst: null,
    lat: 47.45,
    lon: -122.31,
    name: 'Seattle Tacoma Intl',
  },
  airport: {
    icaoId: 'KSEA',
    name: 'Seattle Tacoma Intl',
    magdec: '16E',
    lat: 47.45,
    lon: -122.31,
  },
  runways: [],
}

describe('useAirportConditions', () => {
  afterEach(() => {
    vi.useRealTimers()
    vi.clearAllMocks()
  })

  it('stores lastFetchedAt on successful conditions fetch', async () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-01-15T10:00:00'))
    vi.mocked(fetchAirportConditionsFromServer).mockResolvedValue(conditions)

    const result = useAirportConditions()
    await result.fetchAirportConditions('KSEA')

    expect(result.status.value).toBe('success')
    expect(result.lastFetchedAt.value).toBe(new Date('2026-01-15T10:00:00').getTime())
  })

  it('parses issued time from the returned METAR', async () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date(Date.UTC(2026, 0, 15, 10, 0, 0)))
    vi.mocked(fetchAirportConditionsFromServer).mockResolvedValue(conditions)

    const result = useAirportConditions()
    await result.fetchAirportConditions('KSEA')

    expect(result.metar.value?.issuedAt).toBe(Date.UTC(2026, 0, 15, 10, 0, 0))
  })

  it('retains lastFetchedAt after a later fetch error', async () => {
    vi.useFakeTimers()
    const firstSuccessTime = new Date('2026-01-15T10:00:00')
    vi.setSystemTime(firstSuccessTime)
    vi.mocked(fetchAirportConditionsFromServer).mockResolvedValueOnce(conditions)

    const result = useAirportConditions()
    await result.fetchAirportConditions('KSEA')

    vi.setSystemTime(new Date('2026-01-15T10:05:00'))
    vi.mocked(fetchAirportConditionsFromServer).mockRejectedValueOnce(new Error('Network down'))
    await result.fetchAirportConditions('KSEA')

    expect(result.status.value).toBe('error')
    expect(result.lastFetchedAt.value).toBe(firstSuccessTime.getTime())
  })

  it('keeps previous conditions while a keepPrevious refresh is in flight', async () => {
    vi.mocked(fetchAirportConditionsFromServer).mockResolvedValueOnce(conditions)
    const result = useAirportConditions()
    await result.fetchAirportConditions('KSEA')

    let resolveRefresh!: (value: typeof conditions) => void
    vi.mocked(fetchAirportConditionsFromServer).mockReturnValueOnce(
      new Promise((resolve) => {
        resolveRefresh = resolve
      }),
    )
    const refresh = result.fetchAirportConditions('KSEA', { keepPrevious: true })

    expect(result.status.value).toBe('success')
    expect(result.isRefreshing.value).toBe(true)
    expect(result.metar.value).not.toBeNull()

    resolveRefresh(conditions)
    await refresh
    expect(result.isRefreshing.value).toBe(false)
  })

  it('keeps previous conditions and flags refreshFailed when a keepPrevious refresh fails', async () => {
    vi.mocked(fetchAirportConditionsFromServer).mockResolvedValueOnce(conditions)
    const result = useAirportConditions()
    await result.fetchAirportConditions('KSEA')

    vi.mocked(fetchAirportConditionsFromServer).mockRejectedValueOnce(new Error('Network down'))
    await result.fetchAirportConditions('KSEA', { keepPrevious: true })

    expect(result.status.value).toBe('success')
    expect(result.refreshFailed.value).toBe(true)
    expect(result.error.value).toBe('Network down')
    expect(result.metar.value).not.toBeNull()
  })

  it('ignores a response from a superseded request', async () => {
    let resolveFirst!: (value: typeof conditions) => void
    vi.mocked(fetchAirportConditionsFromServer)
      .mockReturnValueOnce(
        new Promise((resolve) => {
          resolveFirst = resolve
        }),
      )
      .mockResolvedValueOnce({ ...conditions, runways: [{ name: '16L', heading: 163 }] })

    const result = useAirportConditions()
    const first = result.fetchAirportConditions('KSEA')
    const secondIsCurrent = await result.fetchAirportConditions('KSEA')
    resolveFirst(conditions)
    const firstIsCurrent = await first

    expect(result.runways.value).toEqual([{ name: '16L', heading: 163 }])
    expect(secondIsCurrent).toBe(true)
    expect(firstIsCurrent).toBe(false)
  })

  it('reports a failed request as current when nothing superseded it', async () => {
    vi.mocked(fetchAirportConditionsFromServer).mockRejectedValueOnce(new Error('Network down'))
    const result = useAirportConditions()

    await expect(result.fetchAirportConditions('KSEA')).resolves.toBe(true)
    expect(result.status.value).toBe('error')
  })
})
