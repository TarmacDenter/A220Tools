export type LogLevel = 'info' | 'warn' | 'error'

type LogFields = Record<string, unknown>

const MAX_CAUSE_DEPTH = 4
const MAX_UPSTREAM_BODY_LENGTH = 300

export function logLevelForStatus(statusCode: number): LogLevel {
  if (statusCode >= 500) return 'error'
  if (statusCode === 429) return 'warn'
  return 'info'
}

/**
 * Emits one JSON log line. `message` is the human-readable summary that log viewers
 * (e.g. Railway) display; without it the line renders blank. Defaults to the event name.
 */
export function logEvent(
  level: LogLevel,
  event: string,
  fields: LogFields = {},
  message: string = event,
): void {
  const output = JSON.stringify({
    timestamp: new Date().toISOString(),
    level,
    event,
    message,
    ...fields,
  })

  if (level === 'error') console.error(output)
  else if (level === 'warn') console.warn(output)
  else console.info(output)
}

/** Strips query strings from URLs so coordinates and other inputs are not logged. */
export function redactUrls(text: string): string {
  return text.replace(/(https?:\/\/[^\s"'?]+)\?[^\s"']*/g, '$1?[redacted]')
}

function truncate(text: string, maxLength: number): string {
  return text.length > maxLength ? `${text.slice(0, maxLength)}…` : text
}

type ErrorLike = Error & {
  code?: unknown
  status?: unknown
  data?: unknown
  request?: unknown
}

function isFetchError(error: Error): error is ErrorLike {
  return error.name === 'FetchError'
}

function upstreamPath(request: unknown): string | undefined {
  const raw = typeof request === 'string' ? request : (request as { url?: unknown })?.url
  if (typeof raw !== 'string') return undefined
  try {
    const url = new URL(raw)
    return `${url.host}${url.pathname}`
  } catch {
    return undefined
  }
}

function summarizeUpstreamBody(data: unknown): string | undefined {
  if (data === undefined || data === null || data === '') return undefined
  if (typeof data === 'object' && typeof (data as { error?: unknown }).error === 'string') {
    return truncate((data as { error: string }).error, MAX_UPSTREAM_BODY_LENGTH)
  }
  const text = typeof data === 'string' ? data : JSON.stringify(data)
  return text ? truncate(redactUrls(text), MAX_UPSTREAM_BODY_LENGTH) : undefined
}

function causeChain(error: Error): Error[] {
  const chain: Error[] = [error]
  let current: unknown = error.cause
  while (current instanceof Error && chain.length < MAX_CAUSE_DEPTH) {
    chain.push(current)
    current = current.cause
  }
  return chain
}

/**
 * Structured fields describing an error and its cause chain. Surfaces upstream HTTP
 * details from ofetch FetchErrors and system error codes (ECONNRESET, timeouts) so a
 * wrapped 502 still says why the upstream call failed.
 */
export function errorFields(error: unknown): Record<string, unknown> {
  if (!(error instanceof Error)) return { errorMessage: 'Unknown error' }

  const chain = causeChain(error)
  const fields: Record<string, unknown> = {
    errorName: error.name,
    errorMessage: redactUrls(error.message),
  }

  if (chain.length > 1) {
    fields.errorCause = chain
      .slice(1)
      .map((cause) => `${cause.name}: ${redactUrls(cause.message)}`)
      .join(' <- ')
  }

  const fetchError = chain.find(isFetchError)
  if (fetchError) {
    const status = fetchError.status
    if (typeof status === 'number') fields.upstreamStatus = status
    const path = upstreamPath(fetchError.request)
    if (path) fields.upstreamPath = path
    const body = summarizeUpstreamBody(fetchError.data)
    if (body) fields.upstreamError = body
  }

  const code = chain.map((entry) => (entry as ErrorLike).code).find((c) => typeof c === 'string')
  if (code) fields.errorCode = code

  return fields
}

/** One-line human summary of an error, used as the log `message`. */
export function describeError(error: unknown): string {
  const fields = errorFields(error)
  const parts = [String(fields.errorMessage)]
  if (fields.upstreamStatus !== undefined) {
    const detail = fields.upstreamError ? `: ${String(fields.upstreamError)}` : ''
    parts.push(`(upstream ${String(fields.upstreamStatus)}${detail})`)
  } else if (fields.errorCode) {
    parts.push(`(${String(fields.errorCode)})`)
  }
  return parts.join(' ')
}
