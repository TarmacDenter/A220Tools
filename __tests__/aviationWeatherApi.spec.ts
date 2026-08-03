import { afterEach, describe, expect, it, vi } from 'vitest'
import { fetchAirportConditionsFromServer } from '@/composables/aviationWeatherApi'

describe('aviationWeatherApi', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
  })

  it('fetches airport conditions from the unified backend route', async () => {
    const response = {
      metar: { icaoId: 'KJFK' },
      airport: { icaoId: 'KJFK', magdec: '13W' },
    }
    const fetchMock = vi.fn().mockResolvedValueOnce(response)
    vi.stubGlobal('$fetch', fetchMock)

    const result = await fetchAirportConditionsFromServer('kjfk')

    expect(result).toEqual(response)
    expect(fetchMock).toHaveBeenCalledWith('/api/airport-conditions/KJFK')
  })
})
