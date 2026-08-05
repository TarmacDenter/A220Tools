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

function buildVariableMetarResponse() {
  return {
    ...buildMetarResponse(),
    rawOb: 'KJFK 151000Z VRB05KT 10SM CLR 05/M01 A2992',
    wdir: 'VRB' as const,
    wspd: 5,
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
    if (url.includes('/api/airport-conditions/')) {
      return {
        metar: buildMetarResponse(),
        airport: buildAirportResponse(),
        runways: [
          { name: '04L', heading: 44 },
          { name: '22R', heading: 224 },
        ],
      }
    }
    throw Object.assign(new Error('Not Found'), { status: 404 })
  })
}

async function flushAsyncUpdates() {
  await Promise.resolve()
  await Promise.resolve()
  await nextTick()
}

describe('WindCheckerApp', () => {
  let wrapper: ReturnType<typeof mount>

  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(baseTime)
    setOnline(true)
  })

  afterEach(() => {
    wrapper?.unmount()
    vi.unstubAllGlobals()
    vi.useRealTimers()
  })

  it('defaults manual declination direction to west', async () => {
    wrapper = mount(WindCheckerApp)

    await selectManualInputBtn(wrapper, true)
    await nextTick()

    const declButtons = wrapper.findAll('.decl-btn')
    const westButton = declButtons.find((btn) => btn.text() === 'W')

    expect(westButton?.classes()).toContain('active')
  })

  it('forces manual mode and disables METAR input when going offline', async () => {
    wrapper = mount(WindCheckerApp)

    window.dispatchEvent(new Event('offline'))
    await nextTick()

    const manualToggle = wrapper.find('#manual-mode-toggle')
    const icaoInput = wrapper.find('#icao-input')
    const fetchButton = wrapper.find('.fetch-btn')

    expect(wrapper.text()).toContain(
      'Offline: METAR retrieval is unavailable. Manual wind entry is required.',
    )
    expect(manualToggle.attributes('aria-pressed')).toBe('true')
    expect(manualToggle.attributes('disabled')).toBeDefined()
    expect(icaoInput.exists()).toBe(false)
    expect(fetchButton.exists()).toBe(false)
  })

  it('stays in manual mode after reconnect until user changes it', async () => {
    wrapper = mount(WindCheckerApp)

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
    vi.stubGlobal('$fetch', fetchMock)

    wrapper = mount(WindCheckerApp)
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

  it('clearly shows the METAR true-to-magnetic conversion', async () => {
    const fetchMock = mockSuccessfulFetches()
    vi.stubGlobal('$fetch', fetchMock)

    wrapper = mount(WindCheckerApp)
    await wrapper.find('#icao-input').setValue('KJFK')
    await wrapper.find('.fetch-btn').trigger('click')
    await flushAsyncUpdates()

    const notice = wrapper.get('[data-testid="metar-conversion-notice"]')
    expect(notice.text()).toContain('METAR winds: TRUE → MAGNETIC')
    expect(notice.text()).toContain('270°T → 283°M')
    expect(notice.text()).toContain('13.0°W')
  })

  it('shows METAR issued time in UTC and warns when older than 30 minutes', async () => {
    const fetchMock = mockSuccessfulFetches()
    vi.stubGlobal('$fetch', fetchMock)

    wrapper = mount(WindCheckerApp)
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
    vi.stubGlobal('$fetch', fetchMock)

    wrapper = mount(WindCheckerApp)
    const icaoInput = wrapper.find('#icao-input')
    const fetchButton = wrapper.find('.fetch-btn')

    await icaoInput.setValue('KJFK')
    await fetchButton.trigger('click')
    await flushAsyncUpdates()

    const conditionsCallCount = () =>
      fetchMock.mock.calls.filter(([url]) => String(url).includes('/api/airport-conditions/'))
        .length
    expect(conditionsCallCount()).toBe(1)

    await vi.advanceTimersByTimeAsync(300_000)
    await flushAsyncUpdates()

    expect(conditionsCallCount()).toBe(2)
  })

  it('offers magnetic runway selections shared by takeoff and landing', async () => {
    const fetchMock = mockSuccessfulFetches()
    vi.stubGlobal('$fetch', fetchMock)

    wrapper = mount(WindCheckerApp)
    await wrapper.find('#phase-takeoff').trigger('click')
    await wrapper.find('#icao-input').setValue('KJFK')
    await wrapper.find('.fetch-btn').trigger('click')
    await flushAsyncUpdates()

    const runwaySelector = wrapper.find('#runway-selector')
    expect(runwaySelector.findAll('option').map((option) => option.text())).toContain('04L — 044°M')
    expect(runwaySelector.findAll('option').map((option) => option.text())).toContain('22R — 224°M')

    await runwaySelector.setValue('04L')
    await wrapper.find('#phase-landing').trigger('click')

    expect(wrapper.find('#runway-selector').element).toHaveProperty('value', '04L')
    expect(wrapper.find('#runway-heading-input').exists()).toBe(false)
  })

  it('shows assumptions and data sources for takeoff and landing', async () => {
    const fetchMock = mockSuccessfulFetches()
    vi.stubGlobal('$fetch', fetchMock)

    wrapper = mount(WindCheckerApp)
    await wrapper.find('#icao-input').setValue('KJFK')
    await wrapper.find('.fetch-btn').trigger('click')
    await flushAsyncUpdates()

    expect(wrapper.find('[data-testid="assumptions-toggle"]').exists()).toBe(true)

    await wrapper.find('#phase-takeoff').trigger('click')
    expect(wrapper.find('[data-testid="assumptions-toggle"]').exists()).toBe(true)
    expect(wrapper.text()).toContain('Assumptions & Data Sources')

    await wrapper.find('#phase-landing').trigger('click')
    expect(wrapper.find('[data-testid="assumptions-toggle"]').exists()).toBe(true)
  })

  it('requires an explicit manual heading when no runway data is available', async () => {
    const fetchMock = vi.fn(async (url: string) => {
      if (url.includes('/api/airport-conditions/')) {
        return { metar: buildMetarResponse(), airport: buildAirportResponse(), runways: [] }
      }
      throw Object.assign(new Error('Not Found'), { status: 404 })
    })
    vi.stubGlobal('$fetch', fetchMock)

    wrapper = mount(WindCheckerApp)
    await wrapper.find('#phase-takeoff').trigger('click')
    await wrapper.find('#icao-input').setValue('KJFK')
    await wrapper.find('.fetch-btn').trigger('click')
    await flushAsyncUpdates()

    expect(wrapper.find('#runway-heading-input').exists()).toBe(true)
    expect(wrapper.find('.tower-wind-matrix').exists()).toBe(false)

    await wrapper.find('#runway-heading-input').setValue('90')
    expect(wrapper.find('.tower-wind-matrix').exists()).toBe(true)
  })

  it('preserves the selected runway during background refresh', async () => {
    const fetchMock = mockSuccessfulFetches()
    vi.stubGlobal('$fetch', fetchMock)

    wrapper = mount(WindCheckerApp)
    await wrapper.find('#phase-takeoff').trigger('click')
    await wrapper.find('#icao-input').setValue('KJFK')
    await wrapper.find('.fetch-btn').trigger('click')
    await flushAsyncUpdates()
    await wrapper.find('#runway-selector').setValue('04L')

    await vi.advanceTimersByTimeAsync(300_000)
    await flushAsyncUpdates()

    expect(wrapper.find('#runway-selector').element).toHaveProperty('value', '04L')
  })

  it('clears the selected runway when the airport changes', async () => {
    const fetchMock = mockSuccessfulFetches()
    vi.stubGlobal('$fetch', fetchMock)

    wrapper = mount(WindCheckerApp)
    await wrapper.find('#phase-takeoff').trigger('click')
    await wrapper.find('#icao-input').setValue('KJFK')
    await wrapper.find('.fetch-btn').trigger('click')
    await flushAsyncUpdates()
    await wrapper.find('#runway-selector').setValue('04L')

    await wrapper.find('#icao-input').setValue('KLAX')
    await wrapper.find('.fetch-btn').trigger('click')
    await flushAsyncUpdates()

    expect(wrapper.find('#runway-selector').element).toHaveProperty('value', '')
  })

  it('propagates theme to manual entry panel for dark/light styling', async () => {
    wrapper = mount(WindCheckerApp, {
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

  it('shows the takeoff tower wind matrix from the shared manual wind source', async () => {
    wrapper = mount(WindCheckerApp)

    expect(wrapper.find('#phase-start').attributes('aria-pressed')).toBe('true')

    await selectManualInputBtn(wrapper, true)
    await nextTick()

    const atisButton = wrapper.findAll('.mode-btn').find((button) => button.text() === 'ATIS (MAG)')
    await atisButton?.trigger('click')
    const windInputs = wrapper.findAll('.manual-entry .wind-input')
    await windInputs[0]?.setValue('070')
    await windInputs[1]?.setValue('30')

    await wrapper.find('#phase-takeoff').trigger('click')
    await nextTick()
    await wrapper.find('#runway-heading-input').setValue('360')
    await wrapper.find('#rcam-code-select').setValue('6')
    await nextTick()

    expect(wrapper.find('#phase-takeoff').attributes('aria-pressed')).toBe('true')
    expect(wrapper.text()).toContain('XW limit 32 kt / TW limit 10 kt')
    expect(wrapper.text()).toContain('XW 28/32')
    expect(wrapper.text()).toContain('HW 10')

    const matrix = wrapper.find('.tower-wind-matrix')
    expect(matrix.exists()).toBe(true)
    expect(matrix.text()).toContain('Tower Wind Matrix (Magnetic)')
    expect(matrix.text()).toContain('Wind Dir (°M)')
    expect(matrix.text()).toContain('070°')
    expect(matrix.text()).toContain('090°')
    expect(matrix.text()).toContain('32 kt')
    expect(matrix.text()).toContain('XW')
  })

  it('shows runway setup immediately for runway phases before wind exists', async () => {
    wrapper = mount(WindCheckerApp)

    await wrapper.find('#phase-landing').trigger('click')
    await nextTick()

    expect(wrapper.find('#runway-heading-input').exists()).toBe(true)
    expect(wrapper.find('#rcam-code-select').exists()).toBe(true)
    expect(wrapper.find('.tower-wind-matrix').exists()).toBe(false)
  })

  it('builds the tower wind matrix for variable wind without fake current components', async () => {
    const fetchMock = vi.fn(async (url: string) => {
      if (url.includes('/api/airport-conditions/')) {
        return {
          metar: buildVariableMetarResponse(),
          airport: buildAirportResponse(),
          runways: [
            { name: '04L', heading: 44 },
            { name: '22R', heading: 224 },
          ],
        }
      }
      throw Object.assign(new Error('Not Found'), { status: 404 })
    })
    vi.stubGlobal('$fetch', fetchMock)

    wrapper = mount(WindCheckerApp)
    await wrapper.find('#phase-landing').trigger('click')
    await wrapper.find('#runway-heading-input').setValue('360')
    const icaoInput = wrapper.find('#icao-input')
    const fetchButton = wrapper.find('.fetch-btn')

    await icaoInput.setValue('KJFK')
    await fetchButton.trigger('click')
    await flushAsyncUpdates()

    await wrapper.find('#runway-selector').setValue('04L')
    await flushAsyncUpdates()

    expect(wrapper.find('.tower-wind-matrix').exists()).toBe(true)
    expect(wrapper.text()).toContain('Current components unavailable for variable wind.')
    expect(wrapper.text()).toContain('040°')
  })
})
