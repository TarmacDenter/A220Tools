import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import AssumptionsDisplay from '../components/AssumptionsDisplay.vue'
import type { WindResult } from '@/types/wind'

const baseResult: WindResult = {
  parsedWind: {
    directionTrue: 120,
    speed: 12,
    gust: null,
    effectiveSpeed: 12,
    isVariable: false,
    isCalm: false,
    source: 'metar',
  },
  magneticCorrection: {
    declination: -7.2,
    source: 'airport_api',
    rawMagdecString: '07W',
  },
  windDirectionMagnetic: 113,
  tailwindLimitKt: 18,
  h1: null,
  h2: null,
  allHeadingsSafe: true,
}

describe('AssumptionsDisplay', () => {
  it('starts collapsed and toggles open', async () => {
    const wrapper = mount(AssumptionsDisplay, {
      props: {
        result: baseResult,
        rawMetar: 'KSEA 121653Z 12012KT 10SM FEW020 12/07 A2992',
      },
    })

    const panel = wrapper.get('[data-testid="assumptions-panel"]')
    expect(panel.isVisible()).toBe(false)

    await wrapper.get('[data-testid="assumptions-toggle"]').trigger('click')

    // FIXME: Fails intermittently in vitest; investigate panel visibility after toggle.
    expect(panel.isVisible()).toBe(true)
  })

  it('does not render ATIS advisory copy for METAR results', () => {
    const wrapper = mount(AssumptionsDisplay, {
      props: {
        result: baseResult,
        rawMetar: 'KSEA 121653Z 12012KT 10SM FEW020 12/07 A2992',
      },
    })

    expect(wrapper.find('.atis-advisory').exists()).toBe(false)
  })
})
