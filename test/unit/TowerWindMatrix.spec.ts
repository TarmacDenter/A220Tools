import { afterEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount, type VueWrapper } from '@vue/test-utils'
import TowerWindMatrix from '../../app/components/TowerWindMatrix.vue'
import type { RCAM_KEYS } from '#shared/domain/runwayLimits'
import { buildTowerWindMatrix, type TowerReferenceSource } from '#shared/domain/runwayMatrix'

function buildMatrix(referenceWindDirection: number, rcamCode: RCAM_KEYS = 6) {
  return buildTowerWindMatrix({
    phase: 'landing',
    rcamCode,
    runwayHeading: 360,
    referenceWindDirection,
  })
}

function mountMatrix(
  referenceWindDirection: number,
  referenceSource: TowerReferenceSource = 'manual',
  attachTo?: HTMLElement,
) {
  return mount(TowerWindMatrix, {
    attachTo,
    props: {
      phase: 'landing',
      referenceSource,
      matrix: buildMatrix(referenceWindDirection),
      currentReadout: null,
    },
  })
}

describe('TowerWindMatrix', () => {
  it('renders every wind direction three times for wrap-around scrolling', () => {
    const rows = mountMatrix(70).findAll('tbody tr')
    expect(rows).toHaveLength(108)
    expect(rows.filter((row) => row.attributes('aria-hidden') === 'true')).toHaveLength(72)
  })

  it('announces exactly one copy, starting from the centered matrix window', () => {
    const accessibleRows = mountMatrix(70)
      .findAll('tbody tr')
      .filter((row) => row.attributes('aria-hidden') === undefined)

    expect(accessibleRows).toHaveLength(36)
    expect(accessibleRows.slice(0, 7).map((row) => row.find('.col-direction').text())).toEqual([
      '040°',
      '050°',
      '060°',
      '070°',
      '080°',
      '090°',
      '100°',
    ])
    expect(accessibleRows[3]?.classes()).toContain('reference-row')
  })

  it('shows the first rendered rows as the centered window before scrolling', () => {
    const firstRows = mountMatrix(350).findAll('tbody tr').slice(0, 7)
    expect(firstRows.map((row) => row.find('.col-direction').text())).toEqual([
      '320°',
      '330°',
      '340°',
      '350°',
      '000°',
      '010°',
      '020°',
    ])
  })

  it('keeps the matrix label and hides re-center until the pilot scrolls away', () => {
    const wrapper = mountMatrix(70)
    expect(wrapper.text()).toContain('Tower Wind Matrix (Magnetic)')
    expect(wrapper.find('.recenter-btn').exists()).toBe(false)
  })
})

describe('TowerWindMatrix scrolling', () => {
  // jsdom has no layout: give each body row a fixed height below a fixed header.
  const ROW_PX = 40
  const HEADER_PX = 30
  const PERIOD_PX = ROW_PX * 36
  const OFF_CENTER_PX = PERIOD_PX + ROW_PX * 5

  let wrapper: VueWrapper | null = null

  function stubLayout() {
    vi.spyOn(Element.prototype, 'getBoundingClientRect').mockImplementation(function (
      this: Element,
    ) {
      const scroller = this.closest('.matrix-table-wrapper')
      let top = 0
      if (this.tagName === 'TR' && this.parentElement?.tagName === 'TBODY' && scroller) {
        const index = Array.from(this.parentElement.children).indexOf(this)
        top = HEADER_PX + index * ROW_PX - scroller.scrollTop
      }
      return {
        top,
        bottom: top + ROW_PX,
        left: 0,
        right: 0,
        width: 0,
        height: ROW_PX,
        x: 0,
        y: top,
        toJSON: () => ({}),
      } as DOMRect
    })
  }

  async function mountScrolled(referenceSource: TowerReferenceSource = 'manual') {
    stubLayout()
    wrapper = mountMatrix(0, referenceSource, document.body)
    await flushPromises()
    const scroller = wrapper.find<HTMLElement>('.matrix-table-wrapper')
    expect(scroller.element.scrollTop).toBe(PERIOD_PX)
    scroller.element.scrollTop = OFF_CENTER_PX
    await scroller.trigger('scroll')
    return scroller
  }

  afterEach(() => {
    wrapper?.unmount()
    wrapper = null
    vi.restoreAllMocks()
  })

  it('moves focus to the scroll region when Re-center is activated', async () => {
    const scroller = await mountScrolled()
    const button = wrapper!.find('.recenter-btn')
    expect(button.exists()).toBe(true)

    ;(button.element as HTMLElement).focus()
    await button.trigger('click')
    await flushPromises()

    expect(document.activeElement).toBe(scroller.element)
    expect(wrapper!.find('.recenter-btn').exists()).toBe(false)
    expect(scroller.element.scrollTop).toBe(PERIOD_PX)
  })

  it('re-centers when the reference source changes even if the direction is unchanged', async () => {
    const scroller = await mountScrolled('runway')

    await wrapper!.setProps({ referenceSource: 'metar' })
    await flushPromises()

    expect(scroller.element.scrollTop).toBe(PERIOD_PX)
  })

  it('keeps the scroll position when only the RCAM limits change', async () => {
    const scroller = await mountScrolled()

    await wrapper!.setProps({ matrix: buildMatrix(0, 3) })
    await flushPromises()

    expect(scroller.element.scrollTop).toBe(OFF_CENTER_PX)
    expect(wrapper!.find('.recenter-btn').exists()).toBe(true)
  })
})
