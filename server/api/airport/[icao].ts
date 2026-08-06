import type { AirportUpstream } from '#shared/schemas/airportConditions'
import { getCachedAirportRecord } from '../../utils/aviationWeather'

export default defineCachedEventHandler(
  async (event): Promise<AirportUpstream> => {
    const icao = getRouterParam(event, 'icao')?.toUpperCase()
    if (!icao) {
      throw createError({ statusCode: 400, statusMessage: 'Missing ICAO code' })
    }

    try {
      return await getCachedAirportRecord(icao)
    } catch (error) {
      if (error && typeof error === 'object' && 'statusCode' in error) throw error

      console.warn('[airport] upstream failed', { icao, error })
      throw createError({
        statusCode: 502,
        statusMessage: 'AviationWeather airport upstream request failed',
        data: error,
      })
    }
  },
  {
    maxAge: 60 * 60 * 24 * 7,
    getKey: (event) => getRouterParam(event, 'icao')?.toUpperCase() || '',
  },
)
