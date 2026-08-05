export const START_TAILWIND_LIMIT_KT = 18
export const TAILWIND_LIMIT_KT = START_TAILWIND_LIMIT_KT
export const TAKEOFF_TAILWIND_LIMIT_KT = 10
export const LANDING_TAILWIND_LIMIT_KT = 10
export const DEFAULT_MAX_TAXI_SPEED_KT = 5
export const MAX_TAXI_SPEED_INPUT_KT = 20
export const WIND_SPEED_INPUT_MAX_KT = 999

export const RCAM_TO = { 1: 10, 2: 10, 3: 20, 4: 27, 5: 32, 6: 32 } as const
export const RCAM_LDG = { 1: 10, 2: 10, 3: 20, 4: 27, 5: 29, 6: 29 } as const
export type RCAM_KEYS = keyof typeof RCAM_LDG

export const METAR_ISSUED_WARNING_MIN = 30
export const METAR_ISSUED_STALE_MIN = 60
export const FRESHNESS_REFRESH_INTERVAL_MS = 60_000
export const CONDITIONS_REFRESH_INTERVAL_MS = 300_000
export const WIND_DIRECTION_STEP_DEG = 10
export const HEADING_TABLE_STEP_DEG = 5
export const MATRIX_WINDOW_RADIUS_ROWS = 3
export const DISPLAY_WIND_CAP_KT = 99
export const PROXIMITY_THRESHOLD = 0.8
