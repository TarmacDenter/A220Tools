import { mount } from '@vue/test-utils'
import { nextTick } from 'vue'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import WindCheckerApp from '@/components/WindCheckerApp.vue'

const baseTime = new Date('2026-01-15T10:00:00')

function setOnline(value: boolean) {
  Object.defineProperty(window.navigator, 'onLine', {
    configurable: true,
    value,
  })
}

function buildMetarResponse() {
  return [
    {
      icaoId: 'KJFK',
      rawOb: 'KJFK 151000Z 27012KT 10SM CLR 05/M01 A2992',
      wdir: 270,
      wspd: 12,
      wgst: null,
      lat: 40.64,
      lon: -73.78,
      name: 'John F Kennedy Intl',
    },
  ]
}

function buildAirportResponse() {
  return [
    {
      icaoId: 'KJFK',
      name: 'John F Kennedy Intl',
      magdec: '13W',
      lat: 40.64,
      lon: -73.78,
    },
  ]
}

function mockSuccessfulFetches() {
  return vi.fn(async (url: string) => {
    if (url.includes('/metar?')) {
      return {
        ok: true,
        json: async () => buildMetarResponse(),
      }
    }
    if (url.includes('/airport?')) {
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

    const manualToggle = wrapper.find('input[type="checkbox"]')
    await manualToggle.setValue(true)
    await nextTick()

    const declButtons = wrapper.findAll('.decl-btn')
    const westButton = declButtons.find((btn) => btn.text() === 'W')

    expect(westButton?.classes()).toContain('active')
  })

  it('forces manual mode and disables METAR input when going offline', async () => {
    const wrapper = mount(WindCheckerApp)

    window.dispatchEvent(new Event('offline'))
    await nextTick()

    const manualToggle = wrapper.find('input[type="checkbox"]')
    const icaoInput = wrapper.find('#icao-input')
    const fetchButton = wrapper.find('.fetch-btn')

    expect(wrapper.text()).toContain('Offline: METAR retrieval is unavailable. Manual wind entry is required.')
    expect(manualToggle.element).toHaveProperty('checked', true)
    expect(manualToggle.element).toHaveProperty('disabled', true)
    expect(icaoInput.element).toHaveProperty('disabled', true)
    expect(fetchButton.element).toHaveProperty('disabled', true)
  })

  it('stays in manual mode after reconnect until user changes it', async () => {
    const wrapper = mount(WindCheckerApp)

    window.dispatchEvent(new Event('offline'))
    await nextTick()
    window.dispatchEvent(new Event('online'))
    await nextTick()

    const manualToggle = wrapper.find('input[type="checkbox"]')
    expect(manualToggle.element).toHaveProperty('checked', true)
    expect(manualToggle.element).toHaveProperty('disabled', false)
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

    await vi.advanceTimersByTimeAsync(60_000)
    await nextTick()

    expect(wrapper.text()).toContain('Updated 1 min ago')
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

    const metarCallCount = () => fetchMock.mock.calls.filter(([url]) => String(url).includes('/metar?')).length
    expect(metarCallCount()).toBe(1)

    await vi.advanceTimersByTimeAsync(300_000)
    await flushAsyncUpdates()

    expect(metarCallCount()).toBe(2)
  })
})
