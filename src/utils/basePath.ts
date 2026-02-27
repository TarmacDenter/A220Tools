function trimSlashes(value: string): string {
  return value.replace(/^\/+|\/+$/g, '')
}

function buildCanonicalBase(baseUrl: string): string | null {
  const trimmed = trimSlashes(baseUrl)
  if (trimmed.length === 0) return null
  return `/${trimmed}`
}

export function normalizePathForBase(pathname: string, baseUrl: string): string | null {
  const canonicalBase = buildCanonicalBase(baseUrl)
  if (!canonicalBase) return null

  const baseSegment = canonicalBase.slice(1).toLowerCase()
  const segments = pathname.split('/').filter(Boolean)
  if (segments.length === 0) return null

  let consumedBaseSegments = 0
  while (consumedBaseSegments < segments.length) {
    if (segments[consumedBaseSegments].toLowerCase() !== baseSegment) break
    consumedBaseSegments += 1
  }

  if (consumedBaseSegments === 0) return null

  const remaining = segments.slice(consumedBaseSegments)
  const normalizedPath = remaining.length === 0
    ? `${canonicalBase}/`
    : `${canonicalBase}/${remaining.join('/')}`

  return normalizedPath === pathname ? null : normalizedPath
}
