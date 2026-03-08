import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import BaseToggle from '../components/ui/BaseToggle.vue'

describe('BaseToggle', () => {
  it('renders with default inactive state', () => {
    const wrapper = mount(BaseToggle)
    expect(wrapper.text()).toBe('Off')
    expect(wrapper.classes()).toContain('base-toggle')
    expect(wrapper.classes()).not.toContain('is-active')
    expect(wrapper.attributes('aria-pressed')).toBe('false')
  })

  it('renders active state when modelValue is true', () => {
    const wrapper = mount(BaseToggle, { props: { modelValue: true } })
    expect(wrapper.text()).toBe('On')
    expect(wrapper.classes()).toContain('is-active')
    expect(wrapper.attributes('aria-pressed')).toBe('true')
  })

  it('toggles on click', async () => {
    const wrapper = mount(BaseToggle)
    await wrapper.trigger('click')
    expect(wrapper.emitted('update:modelValue')?.[0]).toEqual([true])
  })

  it('does not toggle when disabled', async () => {
    const wrapper = mount(BaseToggle, { props: { disabled: true } })
    await wrapper.trigger('click')
    expect(wrapper.emitted('update:modelValue')).toBeUndefined()
  })

  it('uses custom labels', () => {
    const wrapper = mount(BaseToggle, {
      props: { activeLabel: 'Yes', inactiveLabel: 'No' },
    })
    expect(wrapper.text()).toBe('No')
  })

  it('applies variant class', () => {
    const wrapper = mount(BaseToggle, { props: { variant: 'safe' } })
    expect(wrapper.classes()).toContain('variant-safe')
  })

  it('defaults to primary variant', () => {
    const wrapper = mount(BaseToggle)
    expect(wrapper.classes()).toContain('variant-primary')
  })

  it('renders slot content', () => {
    const wrapper = mount(BaseToggle, {
      slots: { default: 'Custom Label' },
    })
    expect(wrapper.text()).toBe('Custom Label')
  })

  it('applies disabled attribute', () => {
    const wrapper = mount(BaseToggle, { props: { disabled: true } })
    expect(wrapper.attributes('disabled')).toBeDefined()
  })
})
