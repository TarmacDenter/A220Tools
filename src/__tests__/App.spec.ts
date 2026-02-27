import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import { nextTick } from 'vue'
import App from '../App.vue'

function dispatchInstallPromptEvent() {
  const installEvent = new Event('beforeinstallprompt', { cancelable: true }) as Event & {
    prompt: () => Promise<void>
    userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>
  }
  installEvent.prompt = async () => {}
  installEvent.userChoice = Promise.resolve({ outcome: 'dismissed', platform: 'web' })
  window.dispatchEvent(installEvent)
}

describe('App', () => {
  it('renders the wind checker heading', () => {
    const wrapper = mount(App)
    expect(wrapper.text()).toContain('A220 Engine Start Wind Checker')
    expect(wrapper.text()).toContain(
      'Pilot advisory: This is not an official Airbus or airline app. Always verify wind and performance data against approved sources (ATIS/AWOS, METAR, and company procedures).'
    )
  })

  it('shows install CTA when browser emits beforeinstallprompt', async () => {
    const wrapper = mount(App)

    dispatchInstallPromptEvent()
    await nextTick()

    expect(wrapper.text()).toContain('Install app:')
    expect(wrapper.text()).toContain('Install')
  })

  it('dismisses install CTA when dismiss button is clicked', async () => {
    const wrapper = mount(App)

    dispatchInstallPromptEvent()
    await nextTick()

    await wrapper.get('.install-btn.secondary').trigger('click')
    await nextTick()

    expect(wrapper.text()).not.toContain('Install app:')
  })
})
