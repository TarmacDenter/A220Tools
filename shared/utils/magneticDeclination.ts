/** Parse an east- or west-suffixed magnetic declination into signed degrees. */
export function parseMagneticDeclination(value: string | null | undefined): number | null {
  if (!value) return null

  const match = /^(\d+(?:\.\d+)?)(E|W)$/.exec(value.trim().toUpperCase())
  if (!match) return null

  const degrees = Number(match[1])
  return match[2] === 'W' ? -degrees : degrees
}
