import { describe, expect, it } from 'vitest'
import { normalizePathForBase } from '@/utils/basePath'

describe('normalizePathForBase', () => {
  it('returns null when path already matches canonical base', () => {
    expect(normalizePathForBase('/A220Tools/', '/A220Tools/')).toBeNull()
  })

  it('normalizes base path case mismatches', () => {
    expect(normalizePathForBase('/a220tools/', '/A220Tools/')).toBe('/A220Tools/')
  })

  it('collapses duplicated base segments', () => {
    expect(normalizePathForBase('/A220tools/A220Tools', '/A220Tools/')).toBe('/A220Tools/')
  })

  it('collapses duplicated base segments and keeps route suffix', () => {
    expect(normalizePathForBase('/a220tools/A220Tools/check', '/A220Tools/')).toBe('/A220Tools/check')
  })

  it('returns null for unrelated paths', () => {
    expect(normalizePathForBase('/other/path', '/A220Tools/')).toBeNull()
  })
})
