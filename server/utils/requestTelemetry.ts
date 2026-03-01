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

export function extractRequestOrigin(headers: Headers, remoteAddress?: string | null): string {
  return headers.get('x-forwarded-for')
    ?? headers.get('x-real-ip')
    ?? headers.get('cf-connecting-ip')
    ?? headers.get('fly-client-ip')
    ?? remoteAddress
    ?? 'unknown'
}

export function resetRepeatedRequestCounts(): void {
  repeatedRequestCounts.clear()
}
