import { buildRequestFingerprint, extractRequestOrigin, incrementRepeatedRequestCount } from '../utils/requestTelemetry'

const HEALTHCHECK_PATH = '/'

export default defineEventHandler((event) => {
  const requestUrl = getRequestURL(event)

  if (requestUrl.pathname === HEALTHCHECK_PATH) {
    return
  }

  try {
    const startTimeNs = process.hrtime.bigint()
    const fingerprint = buildRequestFingerprint({
      method: event.method,
      pathname: requestUrl.pathname,
      search: requestUrl.search,
    })
    const repeatedRequestCount = incrementRepeatedRequestCount(fingerprint)
    const origin = extractRequestOrigin(getHeaders(event), event.node.req.socket.remoteAddress)

    event.context.requestTelemetry = {
      fingerprint,
      origin,
      repeatedRequestCount,
      startTimeNs,
    }

    console.info(
      '[request:start]',
      JSON.stringify({
        method: event.method,
        path: requestUrl.pathname,
        query: requestUrl.search,
        origin,
        repeatedRequestCount,
      }),
    )

    event.node.res.once('finish', () => {
      const durationMs = Number(process.hrtime.bigint() - startTimeNs) / 1_000_000
      const statusCode = event.node.res.statusCode

      const logPayload = {
        method: event.method,
        path: requestUrl.pathname,
        statusCode,
        durationMs: Number(durationMs.toFixed(2)),
        origin,
        repeatedRequestCount,
      }

      if (statusCode >= 500) {
        console.error('[request:finish]', JSON.stringify(logPayload))
        return
      }

      console.info('[request:finish]', JSON.stringify(logPayload))
    })
  } catch (error) {
    console.error(
      '[request:telemetry:failed]',
      JSON.stringify({
        method: event.method,
        path: requestUrl.pathname,
        message: error instanceof Error ? error.message : 'Unknown telemetry error',
      }),
    )
  }
})
