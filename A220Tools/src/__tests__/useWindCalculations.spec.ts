import { describe, it, expect } from 'vitest'
import {
  normalizeDeg,
  trueToMagnetic,
  headwindComponent,
  criticalHeadings,
  buildHeadingTable,
  computeWindResult,
} from '@/composables/useWindCalculations'
import type { MagneticCorrection, ParsedWind } from '@/types/wind'
import { TAILWIND_LIMIT_KT } from '@/constants/windLimits'

describe('normalizeDeg', () => {
  it('keeps 0 as 0', () => expect(normalizeDeg(0)).toBe(0))
  it('keeps 359 as 359', () => expect(normalizeDeg(359)).toBe(359))
  it('wraps 360 to 0', () => expect(normalizeDeg(360)).toBe(0))
  it('wraps -1 to 359', () => expect(normalizeDeg(-1)).toBe(359))
  it('wraps -90 to 270', () => expect(normalizeDeg(-90)).toBe(270))
  it('wraps 450 to 90', () => expect(normalizeDeg(450)).toBe(90))
})

describe('trueToMagnetic', () => {
  it('subtracts east declination', () => {
    expect(trueToMagnetic(270, 12)).toBeCloseTo(258)
  })
  it('adds west declination (negative)', () => {
    expect(trueToMagnetic(270, -5)).toBeCloseTo(275)
  })
  it('wraps around 360', () => {
    expect(trueToMagnetic(5, 12)).toBeCloseTo(353)
  })
})

describe('headwindComponent', () => {
  it('wind directly on nose = full headwind', () => {
    // Wind from 360, heading 360 → headwind = speed
    expect(headwindComponent(360, 360, 20)).toBeCloseTo(20)
  })

  it('wind directly on tail = full tailwind (negative)', () => {
    // Wind from 180, heading 360 → tailwind = -speed
    expect(headwindComponent(180, 360, 20)).toBeCloseTo(-20)
  })

  it('wind from 90° off = zero component', () => {
    // Wind from 270, heading 360 → crosswind
    expect(headwindComponent(270, 360, 20)).toBeCloseTo(0, 5)
  })

  it('calm wind = zero component', () => {
    expect(headwindComponent(0, 90, 0)).toBe(0)
  })
})

describe('criticalHeadings', () => {
  it('returns null when speed <= limit', () => {
    expect(criticalHeadings(270, 18, 18)).toBeNull()
    expect(criticalHeadings(270, 10, 18)).toBeNull()
  })

  it('returns h1 and h2 when speed > limit', () => {
    // Wind from 360 (north), speed 36 kt, limit 18 kt
    // windOpposite = 180 (south), arccos(18/36) = 60°
    // h1 = 180 - 60 = 120, h2 = 180 + 60 = 240
    const result = criticalHeadings(360, 36, 18)
    expect(result).not.toBeNull()
    expect(result!.h1).toBeCloseTo(120, 0)
    expect(result!.h2).toBeCloseTo(240, 0)
  })

  it('h1→h2 clockwise arc contains wind-opposite direction', () => {
    // Wind from 90 (east), speed 36, limit 18
    // windOpposite = 270, half-arc = 60°
    // h1 = 210, h2 = 330
    // Arc h1→h2 clockwise: 210→330, contains 270 ✓
    const result = criticalHeadings(90, 36, 18)
    expect(result).not.toBeNull()
    expect(result?.h1).toBeCloseTo(210, 0)
    expect(result?.h2).toBeCloseTo(330, 0)
  })
})

describe('buildHeadingTable', () => {
  it('returns 72 rows', () => {
    const rows = buildHeadingTable(270, 20, 18)
    expect(rows).toHaveLength(72)
  })

  it('row headings are 0, 5, 10, ..., 355', () => {
    const rows = buildHeadingTable(270, 20, 18)
    expect(rows[0]?.heading).toBe(0)
    expect(rows[1]?.heading).toBe(5)
    expect(rows[71]?.heading).toBe(355)
  })

  it('marks headings with tailwind > limit as unsafe', () => {
    // Wind from 360/0 (north), speed 36 kt, limit 18 kt
    // Wind blows FROM north = blowing southward
    // Heading 0 (north): wind hits nose → full headwind → SAFE
    // Heading 180 (south): flying south, wind from north behind = full tailwind → UNSAFE
    const rows = buildHeadingTable(360, 36, TAILWIND_LIMIT_KT)
    const row0 = rows.find((r) => r.heading === 0)
    const row180 = rows.find((r) => r.heading === 180)
    expect(row0?.isSafe).toBe(true) // full headwind
    expect(row180?.isSafe).toBe(false) // full tailwind
  })

  it('all rows safe when speed <= limit', () => {
    const rows = buildHeadingTable(270, 10, 18)
    expect(rows.every((r) => r.isSafe)).toBe(true)
  })
})

describe('computeWindResult', () => {
  const magCorr: MagneticCorrection = {
    declination: 0,
    source: 'airport_api',
    rawMagdecString: '0E',
  }

  function makeWind(overrides: Partial<ParsedWind> = {}): ParsedWind {
    return {
      directionTrue: 270,
      speed: 20,
      gust: null,
      effectiveSpeed: 20,
      isVariable: false,
      isCalm: false,
      source: 'metar',
      ...overrides,
    }
  }

  it('calm wind → allHeadingsSafe true, no critical headings', () => {
    const result = computeWindResult(makeWind({ isCalm: true, directionTrue: 'CALM' }), magCorr)
    expect(result.allHeadingsSafe).toBe(true)
    expect(result.h1).toBeNull()
    expect(result.h2).toBeNull()
  })

  it('variable wind → allHeadingsSafe false, no critical headings', () => {
    const result = computeWindResult(makeWind({ isVariable: true, directionTrue: 'VRB' }), magCorr)
    expect(result.allHeadingsSafe).toBe(false)
    expect(result.h1).toBeNull()
    expect(result.h2).toBeNull()
  })

  it('low speed wind → allHeadingsSafe true', () => {
    const result = computeWindResult(makeWind({ speed: 10, effectiveSpeed: 10 }), magCorr)
    expect(result.allHeadingsSafe).toBe(true)
  })

  it('high speed wind → allHeadingsSafe false, h1 and h2 set', () => {
    const result = computeWindResult(makeWind({ speed: 36, effectiveSpeed: 36 }), magCorr)
    expect(result.allHeadingsSafe).toBe(false)
    expect(result.h1).not.toBeNull()
    expect(result.h2).not.toBeNull()
  })

  it('uses declination to convert true to magnetic', () => {
    const corrWithDecl: MagneticCorrection = { ...magCorr, declination: 10 }
    // Wind from 280°T, 10° east decl → 270°M
    const result = computeWindResult(makeWind({ directionTrue: 280, speed: 10, effectiveSpeed: 10 }), corrWithDecl)
    expect(result.windDirectionMagnetic).toBeCloseTo(270)
  })

  it('uses gust speed (effectiveSpeed) for calculations', () => {
    // Speed 10, gust 36 → effective is 36, should produce unsafe result
    const result = computeWindResult(makeWind({ speed: 10, gust: 36, effectiveSpeed: 36 }), magCorr)
    expect(result.allHeadingsSafe).toBe(false)
  })

  it('returns correct tailwind limit constant', () => {
    const result = computeWindResult(makeWind(), magCorr)
    expect(result.tailwindLimitKt).toBe(TAILWIND_LIMIT_KT)
  })
})
