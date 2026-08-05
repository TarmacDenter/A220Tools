import { describe, expect, it } from 'vitest'
import { normalizeAirportConditions, parseMagdecString, parseMetarIssuedAt } from '@/domain/airportNormalization'

describe('airport normalization', () => {
  it('parses east and west declination and rejects malformed values', () => {
    expect(parseMagdecString(' 12.5e ')).toBe(12.5)
    expect(parseMagdecString('7W')).toBe(-7)
    expect(parseMagdecString('west')).toBeNull()
  })
  it('resolves issued timestamps across UTC month boundaries', () => {
    const now = Date.UTC(2026, 0, 1, 0, 5)
    expect(parseMetarIssuedAt('KAAA 312355Z', now)).toBe(Date.UTC(2025, 11, 31, 23, 55))
  })
  it('rejects malformed and invalid issued timestamps', () => {
    expect(parseMetarIssuedAt('no timestamp', Date.now())).toBeNull()
    expect(parseMetarIssuedAt('KAAA 012460Z', Date.now())).toBeNull()
  })
  it('normalizes gusts from the raw observation when the API omits them', () => {
    const result = normalizeAirportConditions({ metar: { icaoId: 'KAAA', rawOb: 'KAAA 010000Z 18010G20KT', wdir: 180, wspd: 10, wgst: null }, airport: { icaoId: 'KAAA', name: 'A', lat: 1, lon: 2, magdec: null }, runways: [] }, Date.UTC(2026, 0, 1))
    expect(result.metar.wgst).toBe(20)
  })
})
