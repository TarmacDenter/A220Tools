import { mount } from '@vue/test-utils'
import { nextTick } from 'vue'
import { describe, expect, it } from 'vitest'
import WindCheckerApp from '@/components/WindCheckerApp.vue'

describe('WindCheckerApp', () => {
  it('defaults manual declination direction to west', async () => {
    const wrapper = mount(WindCheckerApp)

    const manualToggle = wrapper.find('input[type="checkbox"]')
    await manualToggle.setValue(true)
    await nextTick()

    const declButtons = wrapper.findAll('.decl-btn')
    const westButton = declButtons.find((btn) => btn.text() === 'W')

    expect(westButton?.classes()).toContain('active')
  })
})
