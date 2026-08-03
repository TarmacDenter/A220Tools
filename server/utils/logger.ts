export type LogLevel = 'info' | 'warn' | 'error'

type LogFields = Record<string, unknown>

export function logLevelForStatus(statusCode: number): LogLevel {
  if (statusCode >= 500) return 'error'
  if (statusCode === 429) return 'warn'
  return 'info'
}

function serializeError(error: unknown): Record<string, string> | undefined {
  if (!(error instanceof Error)) return undefined

  return { name: error.name, message: error.message }
}

export function logEvent(level: LogLevel, event: string, fields: LogFields = {}): void {
  const output = JSON.stringify({
    timestamp: new Date().toISOString(),
    level,
    event,
    ...fields,
  })

  if (level === 'error') console.error(output)
  else if (level === 'warn') console.warn(output)
  else console.info(output)
}

export function errorFields(error: unknown): Record<string, unknown> {
  return serializeError(error) ?? { message: 'Unknown error' }
}
