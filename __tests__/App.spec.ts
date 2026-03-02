import { afterEach, beforeEach, describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { defineComponent, nextTick } from 'vue'
import App from '../pages/index.vue'
import DefaultLayout from '../layouts/default.vue'

const originalNavigator = {
  userAgent: window.navigator.userAgent,
  platform: window.navigator.platform,
  maxTouchPoints: window.navigator.maxTouchPoints,
}

function mockNavigator({
  userAgent = originalNavigator.userAgent,
  platform = originalNavigator.platform,
  maxTouchPoints = originalNavigator.maxTouchPoints,
}: {
  userAgent?: string
  platform?: string
  maxTouchPoints?: number
}) {
  Object.defineProperty(window.navigator, 'userAgent', { configurable: true, value: userAgent })
  Object.defineProperty(window.navigator, 'platform', { configurable: true, value: platform })
  Object.defineProperty(window.navigator, 'maxTouchPoints', { configurable: true, value: maxTouchPoints })
}

function mockStandalone({
  standaloneMatch = false,
  navigatorStandalone = false,
}: {
  standaloneMatch?: boolean
  navigatorStandalone?: boolean
}) {
  const addEventListener = vi.fn()
  const removeEventListener = vi.fn()
  const addListener = vi.fn()
  const removeListener = vi.fn()

  Object.defineProperty(window, 'matchMedia', {
    configurable: true,
    value: vi.fn().mockImplementation((query: string) => ({
      matches: query === '(display-mode: standalone)' ? standaloneMatch : false,
      media: query,
      onchange: null,
      addEventListener,
      removeEventListener,
      addListener,
      removeListener,
      dispatchEvent: vi.fn(),
    })),
  })

  Object.defineProperty(window.navigator, 'standalone', {
    configurable: true,
    value: navigatorStandalone,
  })
}

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
  beforeEach(() => {
    window.localStorage.clear()
    document.documentElement.removeAttribute('data-theme')
    mockNavigator({})
    mockStandalone({})
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  const NuxtLayoutStub = defineComponent({
    components: { DefaultLayout },
    template: '<DefaultLayout v-slot="slotProps"><slot v-bind="slotProps" /></DefaultLayout>',
  })

  function mountApp() {
    return mount(App, {
      global: {
        stubs: {
          NuxtLayout: NuxtLayoutStub,
        },
      },
    })
  }

  it('renders the wind checker heading', () => {
    const wrapper = mountApp()
    expect(wrapper.text()).toContain('A220 Engine Start Wind Checker')
    expect(wrapper.text()).toContain(
      'Pilot advisory: This is not an official Airbus or airline app. Always verify wind and performance data against approved sources (ATIS/AWOS, METAR, and company procedures).'
    )
  })

  it('shows install CTA when browser emits beforeinstallprompt', async () => {
    const wrapper = mountApp()

    dispatchInstallPromptEvent()
    await nextTick()

    expect(wrapper.text()).toContain('Install app:')
    expect(wrapper.text()).toContain('Install')
  })

  it('dismisses install CTA when dismiss button is clicked', async () => {
    const wrapper = mountApp()

    dispatchInstallPromptEvent()
    await nextTick()

    await wrapper.get('.install-btn.secondary').trigger('click')
    await nextTick()

    expect(wrapper.text()).not.toContain('Install app:')
  })

  it('shows iOS install instructions when native install prompt is unavailable', async () => {
    mockNavigator({
      userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/130.0.0.0 Mobile/15E148 Safari/604.1',
      platform: 'iPhone',
      maxTouchPoints: 5,
    })
    mockStandalone({ standaloneMatch: false, navigatorStandalone: false })

    const wrapper = mountApp()
    await nextTick()

    expect(wrapper.text()).toContain('Install on iPhone:')
    expect(wrapper.text()).toContain('Add to Home Screen')
    expect(wrapper.text()).not.toContain('Install app:')
  })

  it('hides install guidance when running in standalone mode on iOS', async () => {
    mockNavigator({
      userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/130.0.0.0 Mobile/15E148 Safari/604.1',
      platform: 'iPhone',
      maxTouchPoints: 5,
    })
    mockStandalone({ standaloneMatch: true, navigatorStandalone: true })

    const wrapper = mountApp()
    await nextTick()

    expect(wrapper.text()).not.toContain('Install on iPhone:')
    expect(wrapper.text()).not.toContain('Install app:')
  })

  it('toggles dark mode and persists the selected theme', async () => {
    const wrapper = mountApp()
    await nextTick()

    expect(document.documentElement.getAttribute('data-theme')).toBe('dark')

    await wrapper.get('.theme-toggle').trigger('click')
    await nextTick()

    expect(document.documentElement.getAttribute('data-theme')).toBe('light')
    expect(window.localStorage.getItem('a220-theme')).toBe('light')
  })
})
