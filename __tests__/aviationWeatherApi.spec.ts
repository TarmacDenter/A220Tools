import { afterEach, describe, expect, it, vi } from 'vitest'
import { fetchAirportFromServer, fetchMetarFromServer } from '@/composables/aviationWeatherApi'

describe('aviationWeatherApi', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('fetches METAR data from backend server route', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
      ok: true,
      json: async () => ({ icaoId: 'KJFK' }),
    } as Response)

    const result = await fetchMetarFromServer<{ icaoId: string }>('kjfk')

    expect(result).toEqual({ icaoId: 'KJFK' })
    expect(fetchMock).toHaveBeenCalledWith('http://localhost:3000/api/metar/KJFK')
  })

  it('fetches airport data from backend server route', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
      ok: true,
      json: async () => ({ icaoId: 'KSEA', magdec: '16E' }),
    } as Response)

    const result = await fetchAirportFromServer<{ icaoId: string; magdec: string }>('ksea')

    expect(result).toEqual({ icaoId: 'KSEA', magdec: '16E' })
    expect(fetchMock).toHaveBeenCalledWith('http://localhost:3000/api/airport/KSEA')
  })
})
