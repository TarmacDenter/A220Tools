import { errorFields, logEvent, logLevelForStatus } from '../utils/logger'

export default defineNitroPlugin((nitroApp) => {
  nitroApp.hooks.hook('error', (error: Error & { statusCode?: number }, { event }) => {
    const telemetry = event?.context.requestTelemetry;

    const statusCode = error?.statusCode ?? 500

    logEvent(logLevelForStatus(statusCode), 'request.error', {
      requestId: telemetry?.requestId ?? null,
      method: event?.method ?? 'unknown',
      path: event ? getRequestURL(event).pathname : 'unknown',
      repeatedRequestCount: telemetry?.repeatedRequestCount ?? null,
      statusCode,
      ...errorFields(error),
    })
  });
});
