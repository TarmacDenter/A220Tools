import { describe, expect, it } from 'vitest'
import { parseManualWind, parseMetarWind } from '#shared/domain/windParsing'

const input = (overrides: Record<string, string> = {}) => ({
  direction: '270',
  speed: '10',
  gust: '',
  source: 'metar_true' as const,
  declinationMagnitude: '',
  declinationDir: 'W' as const,
  ...overrides,
})
describe('wind parsing', () => {
  it('accepts whitespace, case-insensitive variable and gust fallback', () => {
    expect(parseManualWind(input({ direction: ' vrb ', speed: '12', gust: 'bad' }))).toMatchObject({
      directionTrue: 'VRB',
      effectiveSpeed: 12,
      source: 'manual',
    })
  })
  it('classifies zero-degree zero-speed wind as calm', () =>
    expect(parseManualWind(input({ direction: '0', speed: '0' }))).toMatchObject({
      directionTrue: 'CALM',
      isCalm: true,
    }))
  it('rejects invalid speed and direction', () => {
    expect(parseManualWind(input({ speed: '-1' }))).toBeNull()
    expect(parseManualWind(input({ direction: '361' }))).toBeNull()
  })
  it('preserves METAR source, gust, variable, and calm classifications', () => {
    expect(parseMetarWind({ wdir: 'VRB', wspd: 10, wgst: 20 } as never)).toMatchObject({
      directionTrue: 'VRB',
      effectiveSpeed: 20,
      source: 'metar',
    })
    expect(parseMetarWind({ wdir: 0, wspd: 0, wgst: null } as never)).toMatchObject({
      directionTrue: 'CALM',
      isCalm: true,
    })
  })
})
