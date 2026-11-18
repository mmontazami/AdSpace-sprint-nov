import { INVENTORY } from './inventory'

export const CREATIVE_ORIENTATIONS = [
  {
    id: 'Landscape',
    label: 'Landscape',
    blurb: 'Wider than tall — pick Any or a resolution from your campaign screens.',
  },
  {
    id: 'Portrait',
    label: 'Portrait',
    blurb: 'Taller than wide — pick Any or a resolution from your campaign screens.',
  },
  {
    id: 'Square',
    label: 'Square',
    blurb: '1:1 only — skips resolution; later screen pick lists square inventory.',
  },
]

export const ANY_ASPECT_RATIO = 'any'

function gcd(a, b) {
  let x = Math.abs(a)
  let y = Math.abs(b)
  while (y) {
    const t = y
    y = x % y
    x = t
  }
  return x || 1
}

/** Parse "1920×1080" / "1920x1080" → { w, h } */
export function parseResolution(resolution) {
  const m = String(resolution || '').match(/(\d+)\s*[×xX]\s*(\d+)/)
  if (!m) return null
  return { w: Number(m[1]), h: Number(m[2]) }
}

/** Simplify resolution to aspect ratio string, e.g. 1920×1080 → "16:9". */
export function aspectRatioFromResolution(resolution) {
  const parsed = parseResolution(resolution)
  if (!parsed || !parsed.w || !parsed.h) return null
  const g = gcd(parsed.w, parsed.h)
  return `${parsed.w / g}:${parsed.h / g}`
}

export function screensFromIds(screenIds) {
  const selected = new Set(screenIds || [])
  const rows = []
  for (const loc of INVENTORY) {
    for (const screen of loc.screens) {
      if (!selected.has(screen.id)) continue
      const aspectRatio = aspectRatioFromResolution(screen.resolution)
      rows.push({
        id: screen.id,
        name: screen.name,
        orientation: screen.orientation,
        resolution: screen.resolution,
        aspectRatio,
      })
    }
  }
  return rows
}

/**
 * Group campaign-pool screens by aspect ratio for one orientation.
 * @returns {{ ratio: string, count: number, resolutions: string[] }[]}
 */
export function aspectRatiosFromScreens(screenIds, orientation) {
  const counts = new Map()
  for (const screen of screensFromIds(screenIds)) {
    if (screen.orientation !== orientation) continue
    if (!screen.aspectRatio) continue
    const entry = counts.get(screen.aspectRatio) || {
      ratio: screen.aspectRatio,
      count: 0,
      resolutions: new Set(),
    }
    entry.count += 1
    if (screen.resolution) entry.resolutions.add(screen.resolution)
    counts.set(screen.aspectRatio, entry)
  }
  return [...counts.values()]
    .map((e) => ({
      ratio: e.ratio,
      count: e.count,
      resolutions: [...e.resolutions].sort(),
    }))
    .sort((a, b) => b.count - a.count || a.ratio.localeCompare(b.ratio))
}

/**
 * Distinct resolutions on campaign-pool screens for one orientation.
 * Used by Format step after campaign Choose screens.
 * @returns {{ resolution: string, count: number, ratio: string|null }[]}
 */
export function resolutionsFromScreens(screenIds, orientation) {
  const counts = new Map()
  for (const screen of screensFromIds(screenIds)) {
    if (screen.orientation !== orientation) continue
    if (!screen.resolution) continue
    const entry = counts.get(screen.resolution) || {
      resolution: screen.resolution,
      count: 0,
      ratio: screen.aspectRatio || null,
    }
    entry.count += 1
    counts.set(screen.resolution, entry)
  }
  return [...counts.values()].sort(
    (a, b) =>
      b.count - a.count || a.resolution.localeCompare(b.resolution),
  )
}

function normalizeResolutionToken(value) {
  const parsed = parseResolution(value)
  if (!parsed) return String(value || '').trim().toLowerCase()
  return `${parsed.w}x${parsed.h}`
}

/** True when value looks like WxH resolution rather than aspect ratio. */
export function isResolutionToken(value) {
  return Boolean(parseResolution(value))
}

/** Whether a screen matches the creative Format step (orientation + resolution). */
export function screenMatchesFormat(
  screen,
  { orientation, targetAspectRatio },
) {
  if (!orientation || !screen) return false
  if (screen.orientation !== orientation) return false
  if (
    orientation === 'Square' ||
    !targetAspectRatio ||
    targetAspectRatio === ANY_ASPECT_RATIO
  ) {
    return true
  }
  // Format stores either a concrete resolution (preferred) or a legacy ratio.
  if (isResolutionToken(targetAspectRatio)) {
    return (
      normalizeResolutionToken(screen.resolution) ===
      normalizeResolutionToken(targetAspectRatio)
    )
  }
  const ratio =
    screen.aspectRatio || aspectRatioFromResolution(screen.resolution)
  return ratio === targetAspectRatio
}

export function filterScreenIdsByFormat(
  screenIds,
  { orientation, targetAspectRatio },
) {
  if (!orientation) return []
  return screensFromIds(screenIds)
    .filter((s) =>
      screenMatchesFormat(s, { orientation, targetAspectRatio }),
    )
    .map((s) => s.id)
}

export function isCreativeFormatValid(creative) {
  if (!creative?.orientation) return false
  if (creative.orientation === 'Square') return true
  return Boolean(creative.targetAspectRatio)
}
