import { describe, expect, it } from 'vitest'
import { distanceFromCenter, wrapScrollTop } from '@/utils/circularScroll'

describe('wrapScrollTop', () => {
  const period = 1000

  it('leaves positions inside the middle band unchanged', () => {
    expect(wrapScrollTop(500, period)).toBe(500)
    expect(wrapScrollTop(1000, period)).toBe(1000)
    expect(wrapScrollTop(1500, period)).toBe(1500)
  })

  it('jumps forward one period when scrolled into the first copy', () => {
    expect(wrapScrollTop(499, period)).toBe(1499)
    expect(wrapScrollTop(0, period)).toBe(1000)
  })

  it('jumps back one period when scrolled into the last copy', () => {
    expect(wrapScrollTop(1501, period)).toBe(501)
    expect(wrapScrollTop(2400, period)).toBe(1400)
  })

  it('does nothing before the period is measured', () => {
    expect(wrapScrollTop(42, 0)).toBe(42)
  })
})

describe('distanceFromCenter', () => {
  const period = 1000

  it('is zero at the centered position in any copy', () => {
    expect(distanceFromCenter(0, period)).toBe(0)
    expect(distanceFromCenter(1000, period)).toBe(0)
    expect(distanceFromCenter(2000, period)).toBe(0)
  })

  it('measures the shortest distance to a centered position', () => {
    expect(distanceFromCenter(1020, period)).toBe(20)
    expect(distanceFromCenter(980, period)).toBe(20)
    expect(distanceFromCenter(1500, period)).toBe(500)
  })
})
