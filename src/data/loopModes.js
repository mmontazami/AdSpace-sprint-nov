/**
 * Screen content / ad loop modes (playlist & Ad Pack capacity).
 * Guarantee uses full capacity; actual loops may be shorter when under-filled.
 */

export const LOOP_MODES = {
  c1a2: {
    id: 'c1a2',
    label: '1 min content · 2 min ad',
    short: '1c / 2a',
    contentSec: 60,
    adSec: 120,
  },
  c2a1: {
    id: 'c2a1',
    label: '2 min content · 1 min ad',
    short: '2c / 1a',
    contentSec: 120,
    adSec: 60,
  },
  a3: {
    id: 'a3',
    label: '3 min ad',
    short: '3a',
    contentSec: 0,
    adSec: 180,
  },
}

export const LOOP_MODE_IDS = Object.keys(LOOP_MODES)

/**
 * Q04.3 — mode-locked by campaign slot count.
 * 1–6 → c2a1 · 7–12 → c1a2 · 13–18 → a3
 */
export const SLOT_MODE_BANDS = [
  {
    id: 'c2a1',
    minSlots: 1,
    maxSlots: 6,
    rangeLabel: '1–6 slots',
  },
  {
    id: 'c1a2',
    minSlots: 7,
    maxSlots: 12,
    rangeLabel: '7–12 slots',
  },
  {
    id: 'a3',
    minSlots: 13,
    maxSlots: 18,
    rangeLabel: '13–18 slots',
  },
]

export function getLoopMode(modeId) {
  return LOOP_MODES[modeId] || LOOP_MODES.c2a1
}

/** Required playlist / Ad Pack mode for a campaign slot count. */
export function loopModeForSlots(slots) {
  const n = Number(slots) || 0
  const band =
    SLOT_MODE_BANDS.find((b) => n >= b.minSlots && n <= b.maxSlots) ||
    SLOT_MODE_BANDS[0]
  return {
    ...band,
    mode: getLoopMode(band.id),
  }
}

export function fullLoopSec(modeId) {
  const m = getLoopMode(modeId)
  return m.contentSec + m.adSec
}

/** Loops per hour when content + ad windows are filled to capacity. */
export function guaranteedLoopsPerHour(modeId) {
  const loop = fullLoopSec(modeId)
  return loop > 0 ? 3600 / loop : 0
}

/** ~10 s per campaign slot (doc). */
export const SLOT_SEC = 10

export function creativeAdSec(slots) {
  return Math.max(0, (Number(slots) || 0) * SLOT_SEC)
}

/**
 * How many times this creative's ad package fits in one full ad window.
 * Floor at 1 when it fits at least once; otherwise still 1 play if any ad booked.
 */
export function playsPerFullLoop(modeId, slots) {
  const adWindow = getLoopMode(modeId).adSec
  const adLen = creativeAdSec(slots)
  if (adWindow <= 0 || adLen <= 0) return 0
  return Math.max(1, Math.floor(adWindow / adLen))
}

/**
 * Minimum plays + ad airtime for bookedHours at full mode capacity.
 */
export function computeGuarantee({ modeId, slots, bookedHours }) {
  const hours = Math.max(0, Number(bookedHours) || 0)
  const loops = Math.round(guaranteedLoopsPerHour(modeId) * hours)
  const perLoop = playsPerFullLoop(modeId, slots)
  const plays = loops * perLoop
  const airtimeSec = plays * creativeAdSec(slots)
  return {
    modeId,
    mode: getLoopMode(modeId),
    loops,
    plays,
    airtimeSec,
    adSecPerPlay: creativeAdSec(slots),
  }
}

export function formatDuration(sec) {
  if (sec == null || Number.isNaN(sec)) return '—'
  const s = Math.max(0, Math.round(sec))
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  const r = s % 60
  if (h > 0) {
    return m > 0 ? `${h}h ${m}m` : `${h}h`
  }
  if (m > 0) {
    return r > 0 ? `${m}m ${r}s` : `${m}m`
  }
  return `${r}s`
}

export function formatPlays(n) {
  if (n == null || Number.isNaN(n)) return '—'
  return new Intl.NumberFormat('en-US').format(Math.round(n))
}
