import { describe, expect, it, beforeEach } from 'vitest'
import {
  buildRequestFingerprint,
  coarseRequestOrigin,
  extractRequestOrigin,
  incrementRepeatedRequestCount,
  resetRepeatedRequestCounts,
} from '../server/utils/requestTelemetry'
import { logLevelForStatus } from '../server/utils/logger'

describe('requestTelemetry helpers', () => {
  beforeEach(() => {
    resetRepeatedRequestCounts()
  })

  it('normalizes method and query ordering when generating request fingerprints', () => {
    const fingerprint = buildRequestFingerprint({
      method: 'get',
      pathname: '/api/metar/cyyz',
      search: '?b=2&a=1&b=1',
    })

    expect(fingerprint).toBe('GET /api/metar/cyyz?a=1&b=1&b=2')
  })

  it('tracks repeated requests for the same fingerprint', () => {
    const fingerprint = buildRequestFingerprint({ method: 'GET', pathname: '/api/metar/kjfk' })

    expect(incrementRepeatedRequestCount(fingerprint)).toBe(1)
    expect(incrementRepeatedRequestCount(fingerprint)).toBe(2)
  })

  it('extracts request origin from forwarded headers before socket address', () => {
    const headers = new Headers({ 'x-forwarded-for': '198.51.100.23' })

    expect(extractRequestOrigin(headers, '127.0.0.1')).toBe('198.51.100.23')
  })

  it('extracts request origin from plain object headers without throwing', () => {
    const headers = {
      'x-real-ip': '203.0.113.42',
    }

    expect(extractRequestOrigin(headers, '127.0.0.1')).toBe('203.0.113.42')
  })

  it('coarsens caller origins before they are persisted', () => {
    expect(coarseRequestOrigin('198.51.100.23')).toBe('198.51.100.0/24')
    expect(coarseRequestOrigin('2001:db8:1234:5678:abcd::1')).toBe('2001:db8:1234:5678::/64')
  })

  it('classifies expected input failures below error severity', () => {
    expect(logLevelForStatus(400)).toBe('info')
    expect(logLevelForStatus(404)).toBe('info')
    expect(logLevelForStatus(429)).toBe('warn')
    expect(logLevelForStatus(500)).toBe('error')
  })
})
