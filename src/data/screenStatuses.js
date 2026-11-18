/**
 * Wireframe status catalog for Campaign Builder inventory.
 * Use this as the reference list when implementing the real picker.
 */

/** Full catalog — campaign Choose screens (marketplace pool). */
export const SCREEN_STATUSES = [
  {
    id: 'available',
    label: 'Available',
    tone: 'ok',
    summary: 'Selectable for this campaign window.',
    detail:
      'Passes marketplace eligibility, fits opening hours, has enough free slots, and is not already blocked for another reason.',
  },
  {
    id: 'not_eligible',
    label: 'Not eligible',
    tone: 'eligible',
    summary: 'Blocked by marketplace / Host eligibility gates.',
    detail:
      'Shown when the location Advertising Info is incomplete, the location is not marketplace-eligible, or the screen itself is flagged ineligible for new campaigns. Unverified companies are omitted from Choose screens entirely (Q03.1).',
  },
  {
    id: 'outside_hours',
    label: 'Outside hours',
    tone: 'hours',
    summary: 'Campaign hours do not fit the location opening hours.',
    detail:
      'The campaign’s selected hours must fall within the location’s opening hours on the relevant days. If they do not overlap, the screen cannot be selected.',
  },
  {
    id: 'booked_elsewhere',
    label: 'In another creative',
    tone: 'booked',
    summary: 'Already used by another creative in an overlapping window.',
    detail:
      'Two creatives cannot run on the same screen at the same date and time. They may still share a screen if their dates, days, or hours do not overlap.',
  },
  {
    id: 'insufficient_slots',
    label: 'Not enough slots',
    tone: 'slots',
    summary: 'Free slots are below the campaign slot count.',
    detail:
      'A screen must have at least as many free slots as the campaign requests for the full selected dates and hours.',
  },
]

/**
 * Creative assign-from-pool: campaign already chose inventory.
 */
export const CREATIVE_SCREEN_STATUSES = [
  {
    id: 'available',
    label: 'Available',
    tone: 'ok',
    summary: 'Selectable for this creative.',
    detail:
      'Matches the Format step (orientation / resolution) and is not used by another creative with an overlapping schedule.',
  },
  {
    id: 'format_mismatch',
    label: 'Wrong format',
    tone: 'format',
    summary: 'Orientation or resolution does not match Format.',
    detail:
      'The creative’s Format step locked orientation and (for Landscape / Portrait) Any or a concrete resolution from the campaign screens. Screens that differ are shown but cannot be selected.',
  },
  {
    id: 'booked_elsewhere',
    label: 'In another creative',
    tone: 'booked',
    summary: 'Already used by another creative in an overlapping window.',
    detail:
      'Two creatives cannot run on the same screen at the same date and time. They may still share a screen if their dates, days, or hours do not overlap.',
  },
]

const DAY_IDS = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat']

function effectiveDays(creative) {
  if (creative?.allDays) return [...DAY_IDS]
  return creative?.days?.length ? [...creative.days] : []
}

function creativeEndDate(creative, campaign) {
  if (creative?.endMode === 'runDays') {
    const start = creative.startDate || campaign?.startDate
    const days = Number(creative.runDays) || 0
    if (!start || days < 1) return campaign?.endDate || start || null
    const d = new Date(`${start}T12:00:00`)
    d.setDate(d.getDate() + days - 1)
    return d.toISOString().slice(0, 10)
  }
  if (creative?.endMode === 'campaign' || creative?.endMode === 'never') {
    return campaign?.endDate || creative?.endDate || null
  }
  return creative?.endDate || campaign?.endDate || null
}

function hourSet(creative) {
  if (creative?.hours?.length) return new Set(creative.hours)
  const start = Number(creative?.hourStart)
  const end = Number(creative?.hourEnd)
  if (!Number.isFinite(start) || !Number.isFinite(end) || start >= end) {
    return new Set()
  }
  const set = new Set()
  for (let h = start; h < end; h += 1) set.add(h)
  return set
}

function dateRangesOverlap(aStart, aEnd, bStart, bEnd) {
  if (!aStart || !aEnd || !bStart || !bEnd) return false
  return aStart <= bEnd && bStart <= aEnd
}

function setsOverlap(a, b) {
  for (const item of a) {
    if (b.has(item)) return true
  }
  return false
}

export function creativeScheduleSnapshot(creative, campaign = {}) {
  return {
    startDate: creative?.startDate || campaign.startDate || null,
    endDate: creativeEndDate(creative, campaign),
    days: new Set(effectiveDays(creative)),
    hours: hourSet(creative),
  }
}

/** True when two creatives would collide on date + weekday + hour. */
export function schedulesOverlap(a, b, campaign = {}) {
  const left = creativeScheduleSnapshot(a, campaign)
  const right = creativeScheduleSnapshot(b, campaign)
  if (
    !dateRangesOverlap(
      left.startDate,
      left.endDate,
      right.startDate,
      right.endDate,
    )
  ) {
    return false
  }
  if (!setsOverlap(left.days, right.days)) return false
  if (!setsOverlap(left.hours, right.hours)) return false
  return true
}

/**
 * Map screenId → other creative name when that creative overlaps
 * the current creative’s schedule.
 */
export function buildBookedScreenMap(
  creatives,
  currentCreative,
  campaign = {},
) {
  const map = new Map()
  if (!currentCreative) return map

  for (const other of creatives || []) {
    if (!other || other.id === currentCreative.id) continue
    if (!schedulesOverlap(currentCreative, other, campaign)) continue
    for (const screenId of other.selectedScreenIds || []) {
      if (!map.has(screenId)) {
        map.set(screenId, other.name || 'Another creative')
      }
    }
  }
  return map
}
