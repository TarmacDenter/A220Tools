export const RCAM_TO = { 1: 10, 2: 10, 3: 20, 4: 27, 5: 32, 6: 32 } as const
export const RCAM_LDG = { 1: 10, 2: 10, 3: 20, 4: 27, 5: 29, 6: 29 } as const
export type RCAM_KEYS = keyof typeof RCAM_LDG
