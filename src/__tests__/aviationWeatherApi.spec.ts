import { afterEach, describe, expect, it, vi } from 'vitest'
import { fetchJsonWithFallback } from '@/composables/aviationWeatherApi'

describe('fetchJsonWithFallback', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('falls back to corsproxy.io when direct call fails', async () => {
    const fetchMock = vi
      .spyOn(globalThis, 'fetch')
      .mockRejectedValueOnce(new TypeError('Failed to fetch'))
      .mockResolvedValueOnce({
        ok: true,
        json: async () => [{ icaoId: 'KJFK' }],
      } as Response)

    const result = await fetchJsonWithFallback<Array<{ icaoId: string }>>([
      'https://aviationweather.gov/api/data/metar?ids=KJFK&format=json',
      'https://corsproxy.io/?https%3A%2F%2Faviationweather.gov%2Fapi%2Fdata%2Fmetar%3Fids%3DKJFK%26format%3Djson',
    ])

    expect(result).toEqual([{ icaoId: 'KJFK' }])
    expect(fetchMock).toHaveBeenNthCalledWith(
      1,
      'https://aviationweather.gov/api/data/metar?ids=KJFK&format=json',
    )
    expect(fetchMock).toHaveBeenNthCalledWith(
      2,
      'https://corsproxy.io/?https%3A%2F%2Faviationweather.gov%2Fapi%2Fdata%2Fmetar%3Fids%3DKJFK%26format%3Djson',
    )
  })
})
