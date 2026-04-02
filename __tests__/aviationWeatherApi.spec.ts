import { afterEach, describe, expect, it, vi } from 'vitest'
import { fetchAirportFromServer, fetchMetarFromServer } from '@/composables/aviationWeatherApi'

describe('aviationWeatherApi', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
  })

  it('fetches METAR data from backend server route', async () => {
    const fetchMock = vi.fn().mockResolvedValueOnce({ icaoId: 'KJFK' })
    vi.stubGlobal('$fetch', fetchMock)

    const result = await fetchMetarFromServer<{ icaoId: string }>('kjfk')

    expect(result).toEqual({ icaoId: 'KJFK' })
    expect(fetchMock).toHaveBeenCalledWith('/api/metar/KJFK')
  })

  it('fetches airport data from backend server route', async () => {
    const fetchMock = vi.fn().mockResolvedValueOnce({ icaoId: 'KSEA', magdec: '16E' })
    vi.stubGlobal('$fetch', fetchMock)

    const result = await fetchAirportFromServer<{ icaoId: string; magdec: string }>('ksea')

    expect(result).toEqual({ icaoId: 'KSEA', magdec: '16E' })
    expect(fetchMock).toHaveBeenCalledWith('/api/airport/KSEA')
  })
})
