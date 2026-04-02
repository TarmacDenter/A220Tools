import { beforeEach, describe, expect, it, vi } from 'vitest'

// vi.hoisted runs before static imports, so Nitro globals are defined
// before nearest-airport.ts is evaluated.
const { mockGetQuery, mockFetch } = vi.hoisted(() => {
  const mockGetQuery = vi.fn()
  const mockFetch = vi.fn()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const g = globalThis as any
  g.defineEventHandler = (fn: (event: unknown) => unknown) => fn
  g.getQuery = mockGetQuery
  g.$fetch = mockFetch
  g.createError = (opts: { statusCode: number; statusMessage: string; data?: unknown }) => {
    return Object.assign(new Error(opts.statusMessage), opts)
  }

  return { mockGetQuery, mockFetch }
})

import handler from '../server/api/nearest-airport'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const MOCK_EVENT = {} as any

describe('GET /api/nearest-airport', () => {
  beforeEach(() => {
    mockGetQuery.mockReset()
    mockFetch.mockReset()
  })

  // --- Input validation ---

  it('throws 400 when lat is missing', async () => {
    mockGetQuery.mockReturnValue({ lon: '-0.46' })
    await expect(handler(MOCK_EVENT)).rejects.toMatchObject({ statusCode: 400 })
  })

  it('throws 400 when lon is missing', async () => {
    mockGetQuery.mockReturnValue({ lat: '51.47' })
    await expect(handler(MOCK_EVENT)).rejects.toMatchObject({ statusCode: 400 })
  })

  it('throws 400 when lat is not a number', async () => {
    mockGetQuery.mockReturnValue({ lat: 'abc', lon: '-0.46' })
    await expect(handler(MOCK_EVENT)).rejects.toMatchObject({ statusCode: 400 })
  })

  // --- Upstream errors ---

  it('throws 502 when the aviationweather.gov request fails', async () => {
    mockGetQuery.mockReturnValue({ lat: '51.47', lon: '-0.46' })
    mockFetch.mockRejectedValue(new Error('network error'))
    await expect(handler(MOCK_EVENT)).rejects.toMatchObject({ statusCode: 502 })
  })

  it('throws 404 when no airports are in the bounding box', async () => {
    mockGetQuery.mockReturnValue({ lat: '0', lon: '0' })
    mockFetch.mockResolvedValue([])
    await expect(handler(MOCK_EVENT)).rejects.toMatchObject({ statusCode: 404 })
  })

  // --- Bounding box ---

  it('builds bbox as minLat,minLon,maxLat,maxLon with ±0.3° delta', async () => {
    mockGetQuery.mockReturnValue({ lat: '51.0', lon: '-0.5' })
    mockFetch.mockResolvedValue([{ icaoId: 'EGLL', lat: 51.0, lon: -0.5 }])

    await handler(MOCK_EVENT)

    const calledUrl: string = mockFetch.mock.calls[0][0]
    expect(calledUrl).toContain('bbox=50.7,-0.8,51.3,-0.2')
  })

  // --- Nearest airport selection ---

  it('returns the closest airport when multiple are in the bounding box', async () => {
    mockGetQuery.mockReturnValue({ lat: '51.477', lon: '-0.461' })
    mockFetch.mockResolvedValue([
      { icaoId: 'EGLL', lat: 51.4775, lon: -0.4614 }, // ~0.1 km away
      { icaoId: 'EGKB', lat: 51.3318, lon: 0.0324 },  // ~42 km away
    ])

    const result = await handler(MOCK_EVENT)
    expect(result).toEqual({ icao: 'EGLL' })
  })

  it('skips entries missing icaoId, lat, or lon', async () => {
    mockGetQuery.mockReturnValue({ lat: '51.477', lon: '-0.461' })
    mockFetch.mockResolvedValue([
      { icaoId: 'EGKB', lat: 51.3318, lon: 0.0324 },  // valid
      { icaoId: null, lat: 51.47, lon: -0.46 },         // invalid: no icaoId
      { icaoId: 'XXXX' },                               // invalid: no lat/lon
    ])

    const result = await handler(MOCK_EVENT)
    expect(result).toEqual({ icao: 'EGKB' })
  })

  it('throws 404 when all entries are malformed', async () => {
    mockGetQuery.mockReturnValue({ lat: '51.477', lon: '-0.461' })
    mockFetch.mockResolvedValue([
      { lat: 51.47, lon: -0.46 },  // missing icaoId
    ])
    await expect(handler(MOCK_EVENT)).rejects.toMatchObject({ statusCode: 404 })
  })
})
