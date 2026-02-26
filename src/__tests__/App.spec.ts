import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import App from '../App.vue'

describe('App', () => {
  it('renders the wind checker heading', () => {
    const wrapper = mount(App)
    expect(wrapper.text()).toContain('A220 Engine Start Wind Checker')
    expect(wrapper.text()).toContain(
      'Pilot advisory: This is not an official Airbus or airline app. Always verify wind and performance data against approved sources (ATIS/AWOS, METAR, and company procedures).'
    )
  })
})
