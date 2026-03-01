export default defineNitroPlugin((nitroApp) => {
  nitroApp.hooks.hook('error', (error, { event }) => {
    const telemetry = event?.context.requestTelemetry

    console.error(
      '[request:error]',
      JSON.stringify({
        method: event?.method,
        path: event ? getRequestURL(event).pathname : 'unknown',
        origin: telemetry?.origin ?? 'unknown',
        repeatedRequestCount: telemetry?.repeatedRequestCount ?? null,
        fingerprint: telemetry?.fingerprint ?? null,
        statusCode: error?.statusCode ?? 500,
        message: error?.message ?? 'Unknown server error',
      }),
    )
  })
})
