import { z } from 'zod'

export const MetarUpstreamSchema = z.object({
  icaoId: z.string().min(1),
  rawOb: z.string().min(1),
  obsTime: z.number().optional(),
  wdir: z.union([z.number(), z.literal('VRB'), z.null()]),
  wspd: z.number(),
  // AviationWeather omits wgst when the observation has no reported gust.
  wgst: z.number().nullable().optional(),
  lat: z.number().optional(),
  lon: z.number().optional(),
  name: z.string().optional(),
})

export const RunwayUpstreamSchema = z.object({
  id: z.string().min(1),
  alignment: z.number(),
})

export const AirportUpstreamSchema = z.object({
  icaoId: z.string().min(1),
  name: z.string().optional(),
  lat: z.number(),
  lon: z.number(),
  magdec: z.string().nullable().optional(),
  runways: z.array(z.unknown()).optional(),
})

export const AirportResponseSchema = z.object({
  icaoId: z.string(),
  name: z.string(),
  lat: z.number(),
  lon: z.number(),
  magdec: z.string().nullable(),
})

export const MetarResponseSchema = z.object({
  icaoId: z.string(),
  rawOb: z.string(),
  obsTime: z.number().optional(),
  wdir: z.union([z.number(), z.literal('VRB'), z.null()]),
  wspd: z.number(),
  wgst: z.union([z.number(), z.null()]),
  lat: z.number().optional(),
  lon: z.number().optional(),
  name: z.string().optional(),
})

export const RunwaySelectionSchema = z.object({
  name: z.string(),
  heading: z.number().int().min(0).max(359),
})

export const AirportConditionsResponseSchema = z.object({
  metar: MetarResponseSchema,
  airport: AirportResponseSchema,
  runways: z.array(RunwaySelectionSchema),
})

export type MetarUpstream = z.infer<typeof MetarUpstreamSchema>
export type AirportUpstream = z.infer<typeof AirportUpstreamSchema>
export type AirportApiRecord = z.infer<typeof AirportResponseSchema>
export type MetarApiRecord = z.infer<typeof MetarResponseSchema>
export type RunwaySelection = z.infer<typeof RunwaySelectionSchema>
export type AirportConditionsResponse = z.infer<typeof AirportConditionsResponseSchema>
