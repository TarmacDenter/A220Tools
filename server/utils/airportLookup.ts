import type { H3Event } from 'h3'
import { coarseRequestOrigin } from './requestTelemetry'
import { describeError, errorFields, logEvent } from './logger'

export async function recordAirportLookup(event: H3Event, icao: string): Promise<void> {
  try {
    const origin = coarseRequestOrigin(event.context.requestTelemetry?.origin ?? 'unknown')
    const { isNew } = await useAirportStorage().addAirportHit(icao, origin)
    logEvent(
      'info',
      'airport.lookup',
      {
        requestId: event.context.requestTelemetry?.requestId ?? null,
        icao,
        outcome: 'success',
        uniqueCaller: isNew,
      },
      `Airport lookup ${icao}${isNew ? ' (new caller)' : ''}`,
    )
  } catch (error) {
    logEvent(
      'error',
      'airport.hit_storage_failed',
      {
        requestId: event.context.requestTelemetry?.requestId ?? null,
        icao,
        ...errorFields(error),
      },
      `Airport hit storage failed for ${icao}: ${describeError(error)}`,
    )
  }
}
