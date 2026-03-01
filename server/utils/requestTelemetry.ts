export interface RequestFingerprintInput {
  method: string
  pathname: string
  search?: string
  body?: unknown
}

const repeatedRequestCounts = new Map<string, number>()

function normalizeSearch(search = ''): string {
  const searchParams = new URLSearchParams(search)
  const normalized = new URLSearchParams()

  Array.from(new Set(searchParams.keys()))
    .sort((a, b) => a.localeCompare(b))
    .forEach((key) => {
      const values = searchParams.getAll(key).sort((a, b) => a.localeCompare(b))
      values.forEach((value) => normalized.append(key, value))
    })

  const normalizedSearch = normalized.toString()
  return normalizedSearch ? `?${normalizedSearch}` : ''
}

function safeBodyForFingerprint(body: unknown): string {
  if (body === undefined) return ''

  try {
    return JSON.stringify(body)
  } catch {
    return '[unserializable-body]'
  }
}

export function buildRequestFingerprint(input: RequestFingerprintInput): string {
  const normalizedMethod = input.method.toUpperCase()
  const normalizedSearch = normalizeSearch(input.search)
  const serializedBody = safeBodyForFingerprint(input.body)

  return `${normalizedMethod} ${input.pathname}${normalizedSearch} ${serializedBody}`.trim()
}

export function incrementRepeatedRequestCount(fingerprint: string): number {
  const currentCount = repeatedRequestCounts.get(fingerprint) ?? 0
  const nextCount = currentCount + 1
  repeatedRequestCounts.set(fingerprint, nextCount)
  return nextCount
}

function readHeaderValue(headers: Headers | Record<string, string | string[] | undefined>, name: string): string | undefined {
  if (typeof (headers as Headers).get === 'function') {
    return (headers as Headers).get(name) ?? undefined
  }

  const recordHeaders = headers as Record<string, string | string[] | undefined>
  const value = recordHeaders[name] ?? recordHeaders[name.toLowerCase()] ?? recordHeaders[name.toUpperCase()]

  if (Array.isArray(value)) {
    return value[0]
  }

  return value
}

export function extractRequestOrigin(
  headers: Headers | Record<string, string | string[] | undefined>,
  remoteAddress?: string | null,
): string {
  return readHeaderValue(headers, 'x-forwarded-for')
    ?? readHeaderValue(headers, 'x-real-ip')
    ?? readHeaderValue(headers, 'cf-connecting-ip')
    ?? readHeaderValue(headers, 'fly-client-ip')
    ?? remoteAddress
    ?? 'unknown'
}

export function resetRepeatedRequestCounts(): void {
  repeatedRequestCounts.clear()
}
