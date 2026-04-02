import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useLocation } from '@/composables/useLocation'

describe('useLocation', () => {
  let mockGetCurrentPosition: ReturnType<typeof vi.fn>
  let mockFetch: ReturnType<typeof vi.fn>

  beforeEach(() => {
    mockGetCurrentPosition = vi.fn()
    mockFetch = vi.fn()
    vi.stubGlobal('$fetch', mockFetch)
    Object.defineProperty(navigator, 'geolocation', {
      value: { getCurrentPosition: mockGetCurrentPosition },
      writable: true,
      configurable: true,
    })
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
  })

  it('starts in idle state', () => {
    const { locBtnState, locBtnText } = useLocation()
    expect(locBtnState.value).toBe('idle')
    expect(locBtnText.value).toBe('Use My Location')
  })

  it('transitions to loading state while geolocation is pending', async () => {
    // never resolves — leaves it in loading
    mockGetCurrentPosition.mockImplementation(() => {})
    const { locBtnState, locBtnText, onLocClick } = useLocation()

    const pending = onLocClick()
    expect(locBtnState.value).toBe('loading')
    expect(locBtnText.value).toBe('Locating\u2026')

    // resolve so the test doesn't hang
    mockGetCurrentPosition.mock.calls[0][1](new Error('abort'))
    await pending
  })

  it('sets fetchedIcao and moves to fetched state on success', async () => {
    mockGetCurrentPosition.mockImplementation((resolve: PositionCallback) =>
      resolve({ coords: { latitude: 51.4775, longitude: -0.4614 } } as GeolocationPosition),
    )
    mockFetch.mockResolvedValue({ icao: 'EGLL' })

    const { fetchedIcao, locBtnState, locBtnText, onLocClick } = useLocation()
    await onLocClick()

    expect(fetchedIcao.value).toBe('EGLL')
    expect(locBtnState.value).toBe('fetched')
    expect(locBtnText.value).toBe('Refresh Location (EGLL)')
  })

  it('calls /api/nearest-airport with the coordinates from geolocation', async () => {
    mockGetCurrentPosition.mockImplementation((resolve: PositionCallback) =>
      resolve({ coords: { latitude: 37.386, longitude: -122.084 } } as GeolocationPosition),
    )
    mockFetch.mockResolvedValue({ icao: 'KSJC' })

    const { onLocClick } = useLocation()
    await onLocClick()

    expect(mockFetch).toHaveBeenCalledWith('/api/nearest-airport', {
      query: { lat: 37.386, lon: -122.084 },
    })
  })

  it('sets lookup_failed error when the airport API call fails', async () => {
    mockGetCurrentPosition.mockImplementation((resolve: PositionCallback) =>
      resolve({ coords: { latitude: 0, longitude: 0 } } as GeolocationPosition),
    )
    mockFetch.mockRejectedValue(new Error('404'))

    const { locBtnState, locBtnText, onLocClick } = useLocation()
    await onLocClick()

    expect(locBtnState.value).toBe('error')
    expect(locBtnText.value).toBe('Location unavailable')
  })

  it('hides the button permanently when geolocation permission is denied', async () => {
    // code 1 = PERMISSION_DENIED per the Geolocation API spec
    const permError = { code: 1 }
    mockGetCurrentPosition.mockImplementation((_: unknown, reject: PositionErrorCallback) =>
      reject(permError as GeolocationPositionError),
    )

    const { locBtnState, locBtnText, onLocClick } = useLocation()
    await onLocClick()

    expect(locBtnState.value).toBe('unsupported')
    expect(locBtnText.value).toBe('')
  })

  it('resets fetchedIcao before a new lookup so stale data is not shown', async () => {
    mockGetCurrentPosition.mockImplementationOnce((resolve: PositionCallback) =>
      resolve({ coords: { latitude: 51.4775, longitude: -0.4614 } } as GeolocationPosition),
    )
    mockFetch.mockResolvedValueOnce({ icao: 'EGLL' })

    const { fetchedIcao, onLocClick } = useLocation()
    await onLocClick()
    expect(fetchedIcao.value).toBe('EGLL')

    // Second call: geolocation is pending — fetchedIcao should be null immediately
    mockGetCurrentPosition.mockImplementation(() => {})
    const pending = onLocClick()
    expect(fetchedIcao.value).toBeNull()
    mockGetCurrentPosition.mock.calls[1][1](new Error('abort'))
    await pending
  })

  it('ignores a second click while a lookup is already in flight', async () => {
    let capturedResolve: PositionCallback | undefined
    mockGetCurrentPosition.mockImplementation((resolve: PositionCallback) => {
      capturedResolve = resolve
    })
    mockFetch.mockResolvedValue({ icao: 'KSJC' })

    const { onLocClick } = useLocation()
    const first = onLocClick()
    const second = onLocClick() // should be a no-op

    capturedResolve!({ coords: { latitude: 37.386, longitude: -122.084 } } as GeolocationPosition)
    await Promise.all([first, second])

    expect(mockGetCurrentPosition).toHaveBeenCalledTimes(1)
  })

  it('recovers from a lookup_failed error on a subsequent click', async () => {
    mockGetCurrentPosition.mockImplementationOnce((_: unknown, reject: PositionErrorCallback) =>
      reject(new GeolocationPositionError()),
    )
    const { locBtnState, onLocClick } = useLocation()
    await onLocClick()
    expect(locBtnState.value).toBe('error')

    mockGetCurrentPosition.mockImplementationOnce((resolve: PositionCallback) =>
      resolve({ coords: { latitude: 51.4775, longitude: -0.4614 } } as GeolocationPosition),
    )
    mockFetch.mockResolvedValue({ icao: 'EGLL' })
    await onLocClick()

    expect(locBtnState.value).toBe('fetched')
  })
})
