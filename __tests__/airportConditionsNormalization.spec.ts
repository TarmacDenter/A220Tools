import { beforeEach, describe, expect, it, vi } from 'vitest'

const { mockFetch, mockCreateError, cacheOptions } = vi.hoisted(() => {
  const mockFetch = vi.fn()
  const mockCreateError = vi.fn((options: { statusCode: number; statusMessage: string }) =>
    Object.assign(new Error(options.statusMessage), options),
  )
  const cacheOptions: Array<Record<string, unknown>> = []
  const globals = globalThis as typeof globalThis & Record<string, unknown>
  globals.defineCachedFunction = (fn: unknown, options: Record<string, unknown>) => {
    cacheOptions.push(options)
    return fn
  }
  globals.$fetch = mockFetch
  globals.createError = mockCreateError
  return { mockFetch, mockCreateError, cacheOptions }
})

import { getAirportConditions } from '../server/utils/aviationWeather'

describe('getAirportConditions', () => {
  beforeEach(() => {
    mockFetch.mockReset()
    mockCreateError.mockClear()
  })

  it('waits for a fresh METAR after the one-minute cache expires', () => {
    expect(cacheOptions).toContainEqual(
      expect.objectContaining({
        name: 'aviation-weather-metar',
        maxAge: 60,
        swr: false,
      }),
    )
  })

  it('returns a curated response with magnetic runway selections', async () => {
    mockFetch
      .mockResolvedValueOnce([
        {
          icaoId: 'KJFK',
          receiptTime: '2026-08-03T19:58:26.991Z',
          obsTime: 1785786660,
          rawOb: 'METAR KJFK 031951Z 20009KT 10SM SCT016',
          lat: 40.6392,
          lon: -73.7639,
          name: 'New York/JF Kennedy Intl, NY, US',
          wdir: 200,
          wspd: 9,
          wgst: null,
        },
      ])
      .mockResolvedValueOnce([
        {
          icaoId: 'KJFK',
          name: 'NEW YORK/JOHN F KENNEDY INTL',
          lat: 40.6399,
          lon: -73.7787,
          magdec: '13W',
          runways: [
            { id: '04L/22R', alignment: 31 },
            { id: '04R/22L', alignment: 31 },
            { id: '13L/31R', alignment: 121 },
            { id: 'malformed', alignment: 'unknown' },
          ],
        },
      ])

    const result = await getAirportConditions('kjfk')

    expect(result).toEqual({
      metar: {
        icaoId: 'KJFK',
        rawOb: 'METAR KJFK 031951Z 20009KT 10SM SCT016',
        obsTime: 1785786660,
        wdir: 200,
        wspd: 9,
        wgst: null,
        lat: 40.6392,
        lon: -73.7639,
        name: 'New York/JF Kennedy Intl, NY, US',
      },
      airport: {
        icaoId: 'KJFK',
        name: 'NEW YORK/JOHN F KENNEDY INTL',
        lat: 40.6399,
        lon: -73.7787,
        magdec: '13W',
      },
      runways: [
        { name: '04L', heading: 44 },
        { name: '04R', heading: 44 },
        { name: '13L', heading: 134 },
        { name: '22L', heading: 224 },
        { name: '22R', heading: 224 },
        { name: '31R', heading: 314 },
      ],
    })
  })

  it('rejects an invalid METAR boundary response', async () => {
    mockFetch.mockResolvedValueOnce([
      {
        icaoId: 'KJFK',
        rawOb: 'invalid',
        wdir: 'bad',
        wspd: '9',
        wgst: null,
      },
    ])

    await expect(getAirportConditions('KJFK')).rejects.toMatchObject({ statusCode: 502 })
  })

  it('normalizes an omitted gust value from AviationWeather', async () => {
    mockFetch
      .mockResolvedValueOnce([
        {
          icaoId: 'KJFK',
          rawOb: 'METAR KJFK 032151Z 18008KT 10SM CLR',
          wdir: 180,
          wspd: 8,
        },
      ])
      .mockResolvedValueOnce([
        {
          icaoId: 'KJFK',
          name: 'NEW YORK/JOHN F KENNEDY INTL',
          lat: 40.6399,
          lon: -73.7787,
          magdec: '13W',
        },
      ])

    const result = await getAirportConditions('KJFK')

    expect(result.metar.wgst).toBeNull()
  })
})
