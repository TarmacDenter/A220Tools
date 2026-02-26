import { afterEach, describe, expect, it, vi } from 'vitest'
import { fetchJsonWithFallback } from '@/composables/aviationWeatherApi'

describe('fetchJsonWithFallback', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('tries multiple endpoints until one succeeds', async () => {
    const fetchMock = vi
      .spyOn(globalThis, 'fetch')
      .mockRejectedValueOnce(new TypeError('Failed to fetch'))
      .mockRejectedValueOnce(new TypeError('Proxy unavailable'))
      .mockResolvedValueOnce({
        ok: true,
        json: async () => [{ icaoId: 'KJFK' }],
      } as Response)

    const result = await fetchJsonWithFallback<Array<{ icaoId: string }>>([
      'https://cors.isomorphic-git.org/https://aviationweather.gov/api/data/metar?ids=KJFK&format=json',
      'https://corsproxy.io/?https%3A%2F%2Faviationweather.gov%2Fapi%2Fdata%2Fmetar%3Fids%3DKJFK%26format%3Djson',
      'https://aviationweather.gov/api/data/metar?ids=KJFK&format=json',
    ])

    expect(result).toEqual([{ icaoId: 'KJFK' }])
    expect(fetchMock).toHaveBeenNthCalledWith(
      1,
      'https://cors.isomorphic-git.org/https://aviationweather.gov/api/data/metar?ids=KJFK&format=json',
    )
    expect(fetchMock).toHaveBeenNthCalledWith(
      2,
      'https://corsproxy.io/?https%3A%2F%2Faviationweather.gov%2Fapi%2Fdata%2Fmetar%3Fids%3DKJFK%26format%3Djson',
    )
    expect(fetchMock).toHaveBeenNthCalledWith(
      3,
      'https://aviationweather.gov/api/data/metar?ids=KJFK&format=json',
    )
  })
})
