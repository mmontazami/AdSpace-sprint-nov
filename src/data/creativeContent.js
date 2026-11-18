import {
  ANY_ASPECT_RATIO,
  isResolutionToken,
  parseResolution,
} from './aspectRatios'
import { INVENTORY, SCREEN_ORIENTATIONS } from './inventory'
import { MEDIA_LIBRARY, mediaToSlotItem } from './mediaLibrary'

/** Legacy single ANY key (covers every orientation if present). */
export const ANY_CONTENT_KEY = 'ANY'

export const ANY_ORIENTATIONS = [...SCREEN_ORIENTATIONS]

export function anyContentKey(orientation) {
  return `ANY:${orientation}`
}

export function isAnyContentKey(key) {
  if (!key || typeof key !== 'string') return false
  return key === ANY_CONTENT_KEY || key.startsWith('ANY:')
}

export function orientationFromAnyKey(key) {
  if (key === ANY_CONTENT_KEY) return null
  if (typeof key === 'string' && key.startsWith('ANY:')) return key.slice(4)
  return null
}

export function labelForContentKey(key) {
  if (key === ANY_CONTENT_KEY) return 'ANY'
  const orientation = orientationFromAnyKey(key)
  if (orientation) return `ANY · ${orientation}`
  return key
}

/** Doc “variations” — shown in UI as Loops (full slot row per play-through). */
export const MAX_CONTENT_LOOPS = 5

export function emptySlotRow(slotCount) {
  return Array.from({ length: Math.max(1, Number(slotCount) || 1) }, () => null)
}

export function createEmptyLoop(slotCount) {
  return {
    id: `loop_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    slots: emptySlotRow(slotCount),
  }
}

export function cloneLoop(loop) {
  return {
    id: `loop_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    slots: (loop?.slots || []).map((slot) =>
      slot ? { ...slot } : null,
    ),
  }
}

export function loopHasFilledSlot(loop) {
  return (loop?.slots || []).some(Boolean)
}

export function loopsHaveAnyFill(loops) {
  return (loops || []).some(loopHasFilledSlot)
}

export function countFilledSlots(loops) {
  let n = 0
  for (const loop of loops || []) {
    for (const slot of loop.slots || []) {
      if (slot) n += 1
    }
  }
  return n
}

export function normalizePackageLoops(pack, slotCount) {
  const count = Math.max(1, Number(slotCount) || 1)
  if (pack?.loops?.length) {
    return pack.loops.map((loop) => ({
      id: loop.id || `loop_${Math.random().toString(36).slice(2, 7)}`,
      slots: Array.from({ length: count }, (_, i) => {
        const item = loop.slots?.[i]
        return item ? { ...item } : null
      }),
    }))
  }
  return [createEmptyLoop(count)]
}

/** Screens selected on a creative, with location context. */
export function screensForCreative(selectedScreenIds) {
  const selected = new Set(selectedScreenIds || [])
  const rows = []
  for (const loc of INVENTORY) {
    for (const screen of loc.screens) {
      if (!selected.has(screen.id)) continue
      rows.push({
        id: screen.id,
        name: screen.name,
        resolution: screen.resolution || 'Unknown',
        orientation: screen.orientation,
        locationName: loc.locationName,
        company: loc.company,
      })
    }
  }
  return rows
}

/**
 * ANY cards for the content modal — one per orientation,
 * with screen counts from the creative’s selected inventory.
 */
export function anyOrientationGroupsForCreative(selectedScreenIds) {
  const screens = screensForCreative(selectedScreenIds)
  return ANY_ORIENTATIONS.map((orientation) => {
    const matched = screens.filter((s) => s.orientation === orientation)
    return {
      key: anyContentKey(orientation),
      orientation,
      label: `ANY · ${orientation}`,
      screens: matched,
    }
  })
}

/** Group selected screens by resolution (sorted); include orientation. */
export function resolutionGroupsForCreative(selectedScreenIds) {
  const map = new Map()
  for (const screen of screensForCreative(selectedScreenIds)) {
    const key = screen.resolution
    if (!map.has(key)) {
      map.set(key, {
        key,
        resolution: key,
        orientation: screen.orientation || null,
        screens: [],
      })
    }
    const group = map.get(key)
    group.screens.push(screen)
    if (!group.orientation && screen.orientation) {
      group.orientation = screen.orientation
    }
  }
  return [...map.values()].sort((a, b) =>
    a.resolution.localeCompare(b.resolution),
  )
}

export function contentPackage(contentByKey, key) {
  return contentByKey?.[key] || null
}

export function hasContentPackage(contentByKey, key) {
  return Boolean(contentPackage(contentByKey, key))
}

/** Resolution group is covered by its own package or matching ANY orientation. */
export function isResolutionGroupCovered(contentByKey, group) {
  if (hasContentPackage(contentByKey, group.key)) return true
  // Legacy single ANY covers every orientation
  if (hasContentPackage(contentByKey, ANY_CONTENT_KEY)) return true
  if (
    group.orientation &&
    hasContentPackage(contentByKey, anyContentKey(group.orientation))
  ) {
    return true
  }
  return false
}

/**
 * Creative is content-ready when every resolution group is covered
 * (own package, matching ANY orientation, or legacy ANY).
 */
export function isCreativeContentReady(creative) {
  const contentByKey = creative?.contentByKey || {}
  const groups = resolutionGroupsForCreative(creative?.selectedScreenIds)
  if (groups.length === 0) return false
  return groups.every((g) => isResolutionGroupCovered(contentByKey, g))
}

export function creativeContentStatus(creative) {
  const contentByKey = creative?.contentByKey || {}
  const groups = resolutionGroupsForCreative(creative?.selectedScreenIds)
  const filledResolutions = groups.filter((g) =>
    hasContentPackage(contentByKey, g.key),
  ).length
  const coveredByAny = groups.filter(
    (g) =>
      !hasContentPackage(contentByKey, g.key) &&
      isResolutionGroupCovered(contentByKey, g),
  ).length
  const anyOrientationFilled = ANY_ORIENTATIONS.some((orientation) =>
    hasContentPackage(contentByKey, anyContentKey(orientation)),
  )
  const hasLegacyAny = hasContentPackage(contentByKey, ANY_CONTENT_KEY)
  const hasAny = hasLegacyAny || anyOrientationFilled
  const ready = isCreativeContentReady(creative)

  if (ready) {
    const detail =
      hasLegacyAny
        ? 'ANY package covers all screens'
        : coveredByAny > 0 && filledResolutions < groups.length
          ? `ANY orientations + ${filledResolutions}/${groups.length} resolutions`
          : coveredByAny === groups.length
            ? 'ANY orientation packages cover all screens'
            : `${filledResolutions}/${groups.length} resolutions`
    return {
      ready: true,
      active: true,
      label: 'Content set',
      detail,
    }
  }

  const anyFilled = hasAny || filledResolutions > 0
  if (anyFilled) {
    return {
      ready: false,
      active: false,
      label: 'Content incomplete',
      detail: `${filledResolutions}/${groups.length || 0} resolutions`,
    }
  }

  return {
    ready: false,
    active: false,
    label: 'No content',
    detail: 'Not active until content is set',
  }
}

/** Build a demo loop with real media in the first N slots. */
function exampleFilledLoop(loopId, slotCount, mediaIds) {
  const byId = new Map(MEDIA_LIBRARY.map((m) => [m.id, m]))
  const slots = emptySlotRow(slotCount)
  mediaIds.forEach((mediaId, index) => {
    if (index >= slots.length) return
    const media = byId.get(mediaId) || MEDIA_LIBRARY[index % MEDIA_LIBRARY.length]
    slots[index] = mediaToSlotItem(media)
  })
  return { id: loopId, slots }
}

function examplePackage({
  id,
  key,
  title,
  note = 'Example package for wireframe copy flow',
  updatedAt,
  slotCount = 6,
  mediaIds,
}) {
  const loops = [exampleFilledLoop(`${id}_loop`, slotCount, mediaIds)]
  return {
    id,
    key,
    title,
    note,
    assetCount: countFilledSlots(loops),
    loops,
    updatedAt,
  }
}

/** Wireframe demo packages so the copy library is never empty — with filled slots. */
export const EXAMPLE_CONTENT_LIBRARY = [
  {
    id: 'example::ANY:Landscape',
    creativeId: 'example_primary',
    creativeName: 'Primary cut (example)',
    key: anyContentKey('Landscape'),
    isAny: true,
    label: 'ANY · Landscape',
    isExample: true,
    package: examplePackage({
      id: 'pkg_example_any_landscape',
      key: anyContentKey('Landscape'),
      title: 'Launch reel · ANY Landscape',
      updatedAt: '2026-03-01T10:00:00.000Z',
      mediaIds: ['med_city', 'med_food', 'med_city'],
    }),
  },
  {
    id: 'example::ANY:Portrait',
    creativeId: 'example_primary',
    creativeName: 'Primary cut (example)',
    key: anyContentKey('Portrait'),
    isAny: true,
    label: 'ANY · Portrait',
    isExample: true,
    package: examplePackage({
      id: 'pkg_example_any_portrait',
      key: anyContentKey('Portrait'),
      title: 'Launch reel · ANY Portrait',
      updatedAt: '2026-03-01T10:30:00.000Z',
      mediaIds: ['med_wallet', 'med_ikea'],
    }),
  },
  {
    id: 'example::ANY:Square',
    creativeId: 'example_weekend',
    creativeName: 'Weekend cut (example)',
    key: anyContentKey('Square'),
    isAny: true,
    label: 'ANY · Square',
    isExample: true,
    package: examplePackage({
      id: 'pkg_example_any_square',
      key: anyContentKey('Square'),
      title: 'Launch reel · ANY Square',
      updatedAt: '2026-03-01T11:00:00.000Z',
      mediaIds: ['med_square'],
    }),
  },
  {
    id: 'example::1920×1080',
    creativeId: 'example_primary',
    creativeName: 'Primary cut (example)',
    key: '1920×1080',
    isAny: false,
    label: '1920×1080',
    isExample: true,
    package: examplePackage({
      id: 'pkg_example_fhd',
      key: '1920×1080',
      title: 'Landscape hero · 1920×1080',
      updatedAt: '2026-03-01T10:00:00.000Z',
      mediaIds: ['med_city', 'med_food'],
    }),
  },
  {
    id: 'example::1080×1920',
    creativeId: 'example_weekend',
    creativeName: 'Weekend cut (example)',
    key: '1080×1920',
    isAny: false,
    label: '1080×1920',
    isExample: true,
    package: examplePackage({
      id: 'pkg_example_portrait',
      key: '1080×1920',
      title: 'Portrait promo · 1080×1920',
      updatedAt: '2026-03-02T10:00:00.000Z',
      mediaIds: ['med_fit', 'med_galalogo'],
    }),
  },
  {
    id: 'example::1080×1080',
    creativeId: 'example_weekend',
    creativeName: 'Weekend cut (example)',
    key: '1080×1080',
    isAny: false,
    label: '1080×1080',
    isExample: true,
    package: examplePackage({
      id: 'pkg_example_square',
      key: '1080×1080',
      title: 'Square loop · 1080×1080',
      updatedAt: '2026-03-02T11:00:00.000Z',
      mediaIds: ['med_square'],
    }),
  },
]

function normalizeFormatResolution(value) {
  if (!value || value === ANY_ASPECT_RATIO) return ANY_ASPECT_RATIO
  const parsed = parseResolution(value)
  if (parsed) return `${parsed.w}x${parsed.h}`
  return String(value).trim().toLowerCase()
}

function orientationForResolution(resolution) {
  const parsed = parseResolution(resolution)
  if (!parsed) return null
  if (parsed.w === parsed.h) return 'Square'
  if (parsed.w > parsed.h) return 'Landscape'
  return 'Portrait'
}

/** Same Format step orientation + resolution (Any / concrete). */
export function creativeFormatsMatch(a, b) {
  if (!a?.orientation || !b?.orientation) return false
  if (a.orientation !== b.orientation) return false
  return (
    normalizeFormatResolution(a.targetAspectRatio) ===
    normalizeFormatResolution(b.targetAspectRatio)
  )
}

function exampleMatchesCreativeFormat(item, creative) {
  const orientation = creative?.orientation
  const resolution = normalizeFormatResolution(creative?.targetAspectRatio)
  if (!orientation) return false

  if (item.isAny) {
    const itemOrientation = orientationFromAnyKey(item.key)
    return (
      itemOrientation === orientation && resolution === ANY_ASPECT_RATIO
    )
  }

  if (!isResolutionToken(item.key)) return false
  if (normalizeFormatResolution(item.key) !== resolution) return false
  return orientationForResolution(item.key) === orientation
}

/** Flatten content packages from other creatives for the copy library. */
export function otherCreativeContentItems(creatives, currentCreativeId) {
  const items = []
  for (const creative of creatives || []) {
    if (!creative || creative.id === currentCreativeId) continue
    const byKey = creative.contentByKey || {}
    for (const [key, pack] of Object.entries(byKey)) {
      if (!pack) continue
      items.push({
        id: `${creative.id}::${key}`,
        creativeId: creative.id,
        creativeName: creative.name || 'Untitled',
        key,
        isAny: isAnyContentKey(key),
        label: labelForContentKey(key),
        isExample: false,
        orientation: creative.orientation || null,
        resolution: creative.targetAspectRatio || ANY_ASPECT_RATIO,
        package: pack,
      })
    }
  }
  return items
}

/**
 * Copy library for Content step: other creatives in this campaign whose
 * Format (orientation + resolution) matches the current creative, plus
 * wireframe examples that match the same format.
 */
export function contentLibraryForCreative(creatives, currentCreative) {
  const currentId =
    typeof currentCreative === 'string'
      ? currentCreative
      : currentCreative?.id
  const formatCreative =
    typeof currentCreative === 'string'
      ? (creatives || []).find((c) => c.id === currentId) || {
          id: currentId,
        }
      : currentCreative

  const real = otherCreativeContentItems(creatives, currentId).filter((item) =>
    creativeFormatsMatch(
      {
        orientation: item.orientation,
        targetAspectRatio: item.resolution,
      },
      formatCreative,
    ),
  )

  const examples = EXAMPLE_CONTENT_LIBRARY.filter((item) =>
    exampleMatchesCreativeFormat(item, formatCreative),
  )

  return [...real, ...examples]
}

export function createContentStub({
  key,
  creativeName,
  sourceCreativeId = null,
  sourceKey = null,
  slotCount = 6,
  loops = null,
}) {
  const isAny = isAnyContentKey(key)
  const resolvedLoops = loops?.length
    ? loops
    : [createEmptyLoop(slotCount)]
  return {
    id: `pkg_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    key,
    title: isAny
      ? `${labelForContentKey(key)} pack · ${creativeName || 'Creative'}`
      : `${key} pack · ${creativeName || 'Creative'}`,
    note: 'Slot media package',
    assetCount: countFilledSlots(resolvedLoops),
    loops: resolvedLoops,
    sourceCreativeId,
    sourceKey,
    updatedAt: new Date().toISOString(),
  }
}

/**
 * Wireframe helper: pre-fill the first N resolution packages
 * (not ANY) so legacy samples / demos can show per-resolution cards.
 */
export function seedContentForResolutions(
  selectedScreenIds,
  creativeName,
  count = 2,
  slotCount = 6,
) {
  const groups = [...resolutionGroupsForCreative(selectedScreenIds)].sort(
    (a, b) => b.screens.length - a.screens.length,
  )
  const contentByKey = {}
  for (const [index, group] of groups.slice(0, count).entries()) {
    const loop = createEmptyLoop(slotCount)
    const demoMedia = MEDIA_LIBRARY[index % MEDIA_LIBRARY.length]
    loop.slots[0] = mediaToSlotItem(demoMedia)
    contentByKey[group.key] = createContentStub({
      key: group.key,
      creativeName,
      slotCount,
      loops: [loop],
    })
  }
  return contentByKey
}

/**
 * Wireframe helper: seed the format-derived ANY orientation package
 * used by create/edit creative Content step.
 */
export function seedContentForFormat(
  orientation,
  creativeName,
  slotCount = 6,
) {
  if (!orientation) return {}
  const key = anyContentKey(orientation)
  const loop = createEmptyLoop(slotCount)
  loop.slots[0] = mediaToSlotItem(MEDIA_LIBRARY[0])
  return {
    [key]: createContentStub({
      key,
      creativeName,
      slotCount,
      loops: [loop],
    }),
  }
}

export function cloneContentPackage(pack, { key, creativeName, slotCount = 6 }) {
  const loops = normalizePackageLoops(pack, slotCount).map(cloneLoop)
  return {
    ...pack,
    id: `pkg_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    key,
    title: isAnyContentKey(key)
      ? `${labelForContentKey(key)} pack · ${creativeName || 'Creative'}`
      : `${key} pack · ${creativeName || 'Creative'}`,
    loops,
    assetCount: countFilledSlots(loops),
    sourceCreativeId: pack.sourceCreativeId || null,
    sourceKey: pack.sourceKey || pack.key || null,
    updatedAt: new Date().toISOString(),
  }
}
