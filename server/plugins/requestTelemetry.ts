import { describeError, errorFields, logEvent, logLevelForStatus } from '../utils/logger'

export default defineNitroPlugin((nitroApp) => {
  nitroApp.hooks.hook('error', (error: Error & { statusCode?: number }, { event }) => {
    const telemetry = event?.context.requestTelemetry

    const statusCode = error?.statusCode ?? 500

    const method = event?.method ?? 'unknown'
    const path = event ? getRequestURL(event).pathname : 'unknown'

    logEvent(
      logLevelForStatus(statusCode),
      'request.error',
      {
        requestId: telemetry?.requestId ?? null,
        method,
        path,
        repeatedRequestCount: telemetry?.repeatedRequestCount ?? null,
        statusCode,
        ...errorFields(error),
      },
      `${method} ${path} ${statusCode}: ${describeError(error)}`,
    )
  })
})
