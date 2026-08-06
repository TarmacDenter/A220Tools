import { beforeEach, describe, expect, it, vi } from 'vitest'

const { mockGetRouterParam, mockGetAirportConditions, mockRecordAirportLookup, mockCreateError } =
  vi.hoisted(() => {
    const mockGetRouterParam = vi.fn()
    const mockGetAirportConditions = vi.fn()
    const mockRecordAirportLookup = vi.fn()
    const mockCreateError = vi.fn((options: { statusCode: number; statusMessage: string }) =>
      Object.assign(new Error(options.statusMessage), options),
    )
    const globals = globalThis as typeof globalThis & Record<string, unknown>
    globals.defineEventHandler = (handler: unknown) => handler
    globals.getRouterParam = mockGetRouterParam
    globals.createError = mockCreateError
    return {
      mockGetRouterParam,
      mockGetAirportConditions,
      mockRecordAirportLookup,
      mockCreateError,
    }
  })

vi.mock('../../server/utils/aviationWeather', () => ({
  getAirportConditions: mockGetAirportConditions,
}))

vi.mock('../../server/utils/airportLookup', () => ({
  recordAirportLookup: mockRecordAirportLookup,
}))

import handler from '../../server/api/airport-conditions/[icao]'

describe('GET /api/airport-conditions/:icao', () => {
  beforeEach(() => {
    mockGetRouterParam.mockReset()
    mockGetAirportConditions.mockReset()
    mockRecordAirportLookup.mockReset()
    mockCreateError.mockClear()
  })

  it('returns the combined METAR and airport response and records the lookup', async () => {
    const conditions = {
      metar: { icaoId: 'KJFK' },
      airport: { icaoId: 'KJFK', magdec: '13W' },
    }
    mockGetRouterParam.mockReturnValue('kjfk')
    mockGetAirportConditions.mockResolvedValue(conditions)

    const result = await handler({} as never)

    expect(result).toEqual(conditions)
    expect(mockGetAirportConditions).toHaveBeenCalledWith('KJFK')
    expect(mockRecordAirportLookup).toHaveBeenCalledWith({}, 'KJFK')
  })

  it('rejects requests without an ICAO parameter', async () => {
    mockGetRouterParam.mockReturnValue(undefined)

    await expect(handler({} as never)).rejects.toMatchObject({ statusCode: 400 })
  })
})
