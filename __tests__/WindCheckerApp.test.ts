import { mount } from '@vue/test-utils'
import { nextTick } from 'vue'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import WindCheckerApp from '@/components/WindCheckerApp.vue'

const baseTime = new Date('2026-01-15T10:00:00Z')

function setOnline(value: boolean) {
  Object.defineProperty(window.navigator, 'onLine', {
    configurable: true,
    value,
  })
}

async function selectManualInputBtn(wrapper: ReturnType<typeof mount>, manualMode = true) {
  const manualToggleBtn = wrapper.find('#manual-mode-toggle')
  if (manualMode) await manualToggleBtn.trigger('click')
  return manualToggleBtn
}

function buildMetarResponse() {
  return {
      icaoId: 'KJFK',
      rawOb: 'KJFK 151000Z 27012KT 10SM CLR 05/M01 A2992',
      wdir: 270,
      wspd: 12,
      wgst: null,
      lat: 40.64,
      lon: -73.78,
      name: 'John F Kennedy Intl',
    }
}

function buildAirportResponse() {
  return {
      icaoId: 'KJFK',
      name: 'John F Kennedy Intl',
      magdec: '13W',
      lat: 40.64,
      lon: -73.78,
    }
}

function mockSuccessfulFetches() {
  return vi.fn(async (url: string) => {
    if (url.includes('/api/metar/')) {
      return {
        ok: true,
        json: async () => buildMetarResponse(),
      }
    }
    if (url.includes('/api/airport/')) {
      return {
        ok: true,
        json: async () => buildAirportResponse(),
      }
    }

    return {
      ok: false,
      status: 404,
      statusText: 'Not Found',
      json: async () => ({}),
    }
  })
}

async function flushAsyncUpdates() {
  await Promise.resolve()
  await Promise.resolve()
  await nextTick()
}

describe('WindCheckerApp', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(baseTime)
    setOnline(true)
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    vi.useRealTimers()
  })

  it('defaults manual declination direction to west', async () => {
    const wrapper = mount(WindCheckerApp)

    await selectManualInputBtn(wrapper, true)
    await nextTick()

    const declButtons = wrapper.findAll('.decl-btn')
    const westButton = declButtons.find((btn) => btn.text() === 'W')

    expect(westButton?.classes()).toContain('active')
  })

  it('forces manual mode and disables METAR input when going offline', async () => {
    const wrapper = mount(WindCheckerApp)

    window.dispatchEvent(new Event('offline'))
    await nextTick()

    const manualToggle = wrapper.find('#manual-mode-toggle')
    const icaoInput = wrapper.find('#icao-input')
    const fetchButton = wrapper.find('.fetch-btn')

    expect(wrapper.text()).toContain('Offline: METAR retrieval is unavailable. Manual wind entry is required.')
    expect(manualToggle.attributes('aria-pressed')).toBe('true')
    expect(manualToggle.attributes('disabled')).toBeDefined()
    expect(icaoInput.exists()).toBe(false)
    expect(fetchButton.exists()).toBe(false)
  })

  it('stays in manual mode after reconnect until user changes it', async () => {
    const wrapper = mount(WindCheckerApp)

    window.dispatchEvent(new Event('offline'))
    await nextTick()
    window.dispatchEvent(new Event('online'))
    await nextTick()

    const manualToggle = wrapper.find('#manual-mode-toggle')
    expect(manualToggle.attributes('aria-pressed')).toBe('true')
    expect(manualToggle.attributes('disabled')).toBeUndefined()
  })

  it('updates METAR freshness text every minute', async () => {
    const fetchMock = mockSuccessfulFetches()
    vi.stubGlobal('fetch', fetchMock)

    const wrapper = mount(WindCheckerApp)
    const icaoInput = wrapper.find('#icao-input')
    const fetchButton = wrapper.find('.fetch-btn')

    await icaoInput.setValue('KJFK')
    await fetchButton.trigger('click')
    await flushAsyncUpdates()

    expect(wrapper.text()).toContain('Updated just now')
    expect(wrapper.text()).toContain('METAR: KJFK 151000Z 27012KT 10SM CLR 05/M01 A2992')

    await vi.advanceTimersByTimeAsync(60_000)
    await nextTick()

    expect(wrapper.text()).toContain('Updated 1 min ago')
  })

  it('shows METAR issued time in UTC and warns when older than 30 minutes', async () => {
    const fetchMock = mockSuccessfulFetches()
    vi.stubGlobal('fetch', fetchMock)

    const wrapper = mount(WindCheckerApp)
    const icaoInput = wrapper.find('#icao-input')
    const fetchButton = wrapper.find('.fetch-btn')

    await icaoInput.setValue('KJFK')
    await fetchButton.trigger('click')
    await flushAsyncUpdates()

    await vi.waitFor(() => {
      expect(wrapper.text()).toContain('Issued at 10:00Z')
      expect(wrapper.text()).toContain('Time now is 10:00Z')
    })

    await vi.advanceTimersByTimeAsync(31 * 60_000)
    await flushAsyncUpdates()

    expect(wrapper.find('.metar-issued-panel').classes()).toContain('metar-issued-warn')
  })

  it('auto-refreshes METAR every 5 minutes while online after success', async () => {
    const fetchMock = mockSuccessfulFetches()
    vi.stubGlobal('fetch', fetchMock)

    const wrapper = mount(WindCheckerApp)
    const icaoInput = wrapper.find('#icao-input')
    const fetchButton = wrapper.find('.fetch-btn')

    await icaoInput.setValue('KJFK')
    await fetchButton.trigger('click')
    await flushAsyncUpdates()

    const metarCallCount = () => fetchMock.mock.calls.filter(([url]) => String(url).includes('/api/metar/')).length
    expect(metarCallCount()).toBe(1)

    await vi.advanceTimersByTimeAsync(300_000)
    await flushAsyncUpdates()

    expect(metarCallCount()).toBe(2)
  })

  it('propagates theme to manual entry panel for dark/light styling', async () => {
    const wrapper = mount(WindCheckerApp, {
      props: {
        theme: 'dark',
      },
    })

     await selectManualInputBtn(wrapper, true)
    await nextTick()

    const manualEntry = wrapper.find('.manual-entry')
    expect(manualEntry.attributes('data-theme')).toBe('dark')

    await wrapper.setProps({ theme: 'light' })
    await nextTick()

    expect(manualEntry.attributes('data-theme')).toBe('light')
  })
})
