export const START_TAILWIND_LIMIT_KT = 18;
export const TAILWIND_LIMIT_KT = START_TAILWIND_LIMIT_KT;
export const TAKEOFF_TAILWIND_LIMIT_KT = 10;
export const LANDING_TAILWIND_LIMIT_KT = 10;
export const DEFAULT_MAX_TAXI_SPEED_KT = 5;

export const RCAM_TO = {
  1: 10,
  2: 10,
  3: 20,
  4: 27,
  5: 32,
  6: 32,
} as const;

export const RCAM_LDG = {
  1: 10,
  2: 10,
  3: 20,
  4: 27,
  5: 29,
  6: 29,
} as const;

export type RCAM_KEYS = keyof typeof RCAM_LDG;
