import { afterEach, describe, expect, it, vi } from 'vitest'
import { createError } from 'h3'
import { createFetch } from 'ofetch'
import { describeError, errorFields, logEvent, redactUrls } from '../../server/utils/logger'

const UPSTREAM_URL =
  'https://aviationweather.gov/api/data/metar?bbox=51.1712345,-0.7612345,51.7712345,-0.1612345&format=json'

function fetchReturning(response: () => Response | Promise<Response>) {
  return createFetch({
    fetch: (async () => response()) as typeof fetch,
    Headers,
    AbortController,
  })
}

async function captureError(promise: Promise<unknown>): Promise<unknown> {
  try {
    await promise
  } catch (error) {
    return error
  }
  throw new Error('expected promise to reject')
}

async function upstream400() {
  const $fetch = fetchReturning(
    () =>
      new Response(
        JSON.stringify({
          status: 'error',
          error: 'Must specify station IDs or bounding box, zoom, and density',
        }),
        { status: 400, statusText: 'Bad Request', headers: { 'content-type': 'application/json' } },
      ),
  )
  return captureError($fetch(UPSTREAM_URL, { retry: 0 }))
}

describe('logger', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('emits a human-readable message alongside structured fields', () => {
    const info = vi.spyOn(console, 'info').mockImplementation(() => {})

    logEvent('info', 'request.started', { path: '/api/x' }, '--> GET /api/x')

    const line = JSON.parse(info.mock.calls[0]![0] as string)
    expect(line).toMatchObject({
      level: 'info',
      event: 'request.started',
      message: '--> GET /api/x',
      path: '/api/x',
    })
  })

  it('defaults the message to the event name so lines never render blank', () => {
    const info = vi.spyOn(console, 'info').mockImplementation(() => {})

    logEvent('info', 'airport.lookup')

    expect(JSON.parse(info.mock.calls[0]![0] as string).message).toBe('airport.lookup')
  })

  it('redacts query strings from URLs', () => {
    expect(redactUrls(`[GET] "${UPSTREAM_URL}": 400 Bad Request`)).toBe(
      '[GET] "https://aviationweather.gov/api/data/metar?[redacted]": 400 Bad Request',
    )
  })

  it('surfaces upstream status and error body through a wrapping H3 error', async () => {
    const fetchError = await upstream400()
    const wrapped = createError({
      statusCode: 502,
      statusMessage: 'AviationWeather upstream request failed',
      cause: fetchError,
    })

    const fields = errorFields(wrapped)

    expect(fields).toMatchObject({
      errorMessage: 'AviationWeather upstream request failed',
      upstreamStatus: 400,
      upstreamPath: 'aviationweather.gov/api/data/metar',
      upstreamError: 'Must specify station IDs or bounding box, zoom, and density',
    })
    expect(String(fields.errorCause)).toContain('FetchError')
    expect(JSON.stringify(fields)).not.toContain('51.17')
    expect(describeError(wrapped)).toBe(
      'AviationWeather upstream request failed (upstream 400: Must specify station IDs or bounding box, zoom, and density)',
    )
  })

  it('surfaces network error codes when there is no upstream response', async () => {
    const networkError = Object.assign(new TypeError('fetch failed'), {
      cause: Object.assign(new Error('read ECONNRESET'), { code: 'ECONNRESET' }),
    })
    const $fetch = fetchReturning(() => {
      throw networkError
    })
    const fetchError = await captureError($fetch(UPSTREAM_URL, { retry: 0 }))

    const fields = errorFields(createError({ statusCode: 502, cause: fetchError }))

    expect(fields.errorCode).toBe('ECONNRESET')
    expect(fields.upstreamStatus).toBeUndefined()
    expect(JSON.stringify(fields)).not.toContain('51.17')
  })

  it('handles non-Error values', () => {
    expect(errorFields('boom')).toEqual({ errorMessage: 'Unknown error' })
  })
})
