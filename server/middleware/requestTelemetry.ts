import {
  buildRequestFingerprint,
  createRequestId,
  extractRequestOrigin,
  incrementRepeatedRequestCount,
} from '../utils/requestTelemetry'
import { errorFields, logEvent, logLevelForStatus } from '../utils/logger'

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

    const requestId = createRequestId()
    event.context.requestTelemetry = {
      requestId,
      fingerprint,
      origin,
      repeatedRequestCount,
      startTimeNs,
    }

    event.node.res.setHeader('X-Request-ID', requestId)
    logEvent('info', 'request.started', {
      requestId,
      method: event.method,
      path: requestUrl.pathname,
      repeatedRequestCount,
    })

    event.node.res.once('finish', () => {
      const durationMs = Number(process.hrtime.bigint() - startTimeNs) / 1_000_000
      const statusCode = event.node.res.statusCode

      const logPayload = {
        requestId,
        method: event.method,
        path: requestUrl.pathname,
        statusCode,
        durationMs: Number(durationMs.toFixed(2)),
        repeatedRequestCount,
      }

      logEvent(logLevelForStatus(statusCode), 'request.finished', logPayload)
    })
  } catch (error) {
    logEvent('error', 'telemetry.failed', {
      method: event.method,
      path: requestUrl.pathname,
      ...errorFields(error),
    })
  }
})
