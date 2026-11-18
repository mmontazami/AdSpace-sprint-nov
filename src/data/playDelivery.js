/**
 * Guaranteed vs actual play delivery for campaign wireframes.
 *
 * Guaranteed = full mode capacity over booked hours (floor).
 * Missed = scheduled full-capacity plays lost to offline.
 * Extra = surplus from denser (under-filled) loops.
 * Actual = (guaranteed − missed) + extra
 */

import { INVENTORY } from './inventory'
import {
  computeGuarantee,
  formatDuration,
  formatPlays,
  getLoopMode,
} from './loopModes'

/** Mock live/ended delivery keyed by screen id. */
const TELEMETRY = {
  'SCR-1042': {
    bookedHours: 310,
    missedPlays: 40,
    extraPlays: 180,
    lastSeen: '2 min ago',
    telemetry: 'ok',
    fillNote: 'Content ~2m · ad ~60s (full)',
  },
  'SCR-1043': {
    bookedHours: 310,
    missedPlays: 620,
    extraPlays: 2400,
    lastSeen: '4 min ago',
    telemetry: 'ok',
    fillNote: 'Content ~1m · ad ~30s (dense loops)',
  },
  'SCR-2101': {
    bookedHours: 310,
    missedPlays: 20,
    extraPlays: 90,
    lastSeen: '1 min ago',
    telemetry: 'ok',
    fillNote: 'Near-full fill',
  },
  'SCR-2102': {
    bookedHours: 310,
    missedPlays: 180,
    extraPlays: 420,
    lastSeen: '6 min ago',
    telemetry: 'ok',
    fillNote: 'Content short · some offline',
  },
  'SCR-5501': {
    bookedHours: 248,
    missedPlays: 8,
    extraPlays: 40,
    lastSeen: '3 min ago',
    telemetry: 'ok',
    fillNote: 'Full capacity',
  },
  'SCR-5502': {
    bookedHours: 248,
    missedPlays: 560,
    extraPlays: 1200,
    lastSeen: '18 min ago',
    telemetry: 'ok',
    fillNote: 'Dense loops · offline day',
  },
  'SCR-6601': {
    bookedHours: 248,
    missedPlays: 0,
    extraPlays: 120,
    lastSeen: '1 min ago',
    telemetry: 'ok',
    fillNote: 'Slight under-fill',
  },
  'SCR-6602': {
    bookedHours: 248,
    missedPlays: 1400,
    extraPlays: 800,
    lastSeen: '2h ago',
    telemetry: 'ok',
    fillNote: 'Heavy offline · some dense extra',
  },
  'SCR-3301': {
    bookedHours: 90,
    missedPlays: 220,
    extraPlays: 900,
    lastSeen: '12 min ago',
    telemetry: 'ok',
    fillNote: 'Classic: offline day + dense surplus',
  },
  'SCR-3302': {
    bookedHours: 90,
    missedPlays: 30,
    extraPlays: 60,
    lastSeen: '5 min ago',
    telemetry: 'ok',
    fillNote: 'Near guarantee',
  },
  'SCR-3303': {
    bookedHours: 90,
    missedPlays: null,
    extraPlays: null,
    lastSeen: '—',
    telemetry: 'missing',
    fillNote: 'No player telemetry',
  },
  'SCR-4401': {
    bookedHours: 90,
    missedPlays: 500,
    extraPlays: 200,
    lastSeen: '41 min ago',
    telemetry: 'ok',
    fillNote: 'Offline shortfall dominates',
  },
}

function openingLabel(loc) {
  const mon = loc.openingHours?.mon
  if (!mon) return '—'
  return `${String(mon.open).padStart(2, '0')}:00–${String(mon.close).padStart(2, '0')}:00`
}

function estimateBookedHours(creative) {
  const hours = creative.hours?.length || 0
  if (!hours || !creative.startDate) return 0
  const start = new Date(`${creative.startDate}T00:00:00`)
  let end
  if (creative.endMode === 'runDays' && creative.runDays) {
    end = new Date(start)
    end.setDate(end.getDate() + Number(creative.runDays) - 1)
  } else if (
    creative.endMode === 'campaign' ||
    creative.endMode === 'never'
  ) {
    // Clipped by campaign window — estimateBookedHours has no campaign arg;
    // fall through to creative.endDate when synced, else a short default.
    if (creative.endDate) {
      end = new Date(`${creative.endDate}T00:00:00`)
    } else {
      return hours * 14
    }
  } else if (creative.endDate) {
    end = new Date(`${creative.endDate}T00:00:00`)
  } else {
    return hours * 14
  }
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || end < start) {
    return hours * 14
  }
  const daySet = new Set(
    creative.allDays
      ? ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat']
      : creative.days || [],
  )
  const dayKeys = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat']
  let days = 0
  const cursor = new Date(start)
  while (cursor <= end) {
    if (daySet.has(dayKeys[cursor.getDay()])) days += 1
    cursor.setDate(cursor.getDate() + 1)
  }
  return days * hours
}

function statusFor({ telemetry, guaranteedPlays, missedPlays, actualPlays }) {
  if (telemetry === 'missing') return 'No telemetry'
  if (guaranteedPlays <= 0) return 'Watch'
  const deliveredScheduled = guaranteedPlays - (missedPlays || 0)
  const vsGuarantee =
    guaranteedPlays > 0 ? (deliveredScheduled / guaranteedPlays) * 100 : 0
  if (vsGuarantee >= 98 && (missedPlays || 0) === 0) return 'Healthy'
  if (vsGuarantee >= 90 && (missedPlays || 0) / guaranteedPlays < 0.05) {
    return 'Watch'
  }
  if ((missedPlays || 0) > 0 && actualPlays >= guaranteedPlays) {
    return 'Needs review'
  }
  if (vsGuarantee < 90) return 'Needs review'
  return 'Watch'
}

function enrichScreenDelivery({
  screen,
  loc,
  creatives,
  slots,
  plannedOnly,
}) {
  const modeId = screen.loopMode || 'c2a1'
  const mode = getLoopMode(modeId)
  const primary = creatives[0]
  const bookedHours =
    TELEMETRY[screen.id]?.bookedHours ??
    (estimateBookedHours(primary) || 200)

  const guarantee = computeGuarantee({ modeId, slots, bookedHours })
  const tel = TELEMETRY[screen.id] || {
    missedPlays: Math.round(guarantee.plays * 0.03),
    extraPlays: Math.round(guarantee.plays * 0.08),
    lastSeen: '15 min ago',
    telemetry: 'ok',
    fillNote: 'Sample fill',
  }

  if (plannedOnly) {
    const hours = Math.round(bookedHours * 10) / 10
    return {
      screenId: screen.id,
      screenName: screen.name,
      companyId: loc.companyId,
      company: loc.company,
      locationId: loc.locationId,
      location: loc.locationName,
      country: loc.country,
      modeId,
      modeLabel: mode.label,
      modeShort: mode.short,
      bookedHours: hours,
      expectedH: hours,
      actualH: null,
      onlinePct: null,
      guaranteedDeliveryPct: null,
      totalPlayPct: null,
      guaranteedPlays: guarantee.plays,
      guaranteedSec: guarantee.airtimeSec,
      actualPlays: null,
      actualSec: null,
      missedPlays: null,
      missedSec: null,
      extraPlays: null,
      extraSec: null,
      creatives: creatives.map((c) => c.name || 'Untitled'),
      creativeRefs: creatives.map((c) => ({
        id: c.id,
        name: c.name || 'Untitled',
      })),
      status: 'Planned',
      fillNote: `Full ${mode.short} capacity`,
      lastSeen: '—',
      telemetry: 'planned',
      openingHours: openingLabel(loc),
    }
  }

  if (tel.telemetry === 'missing') {
    const hours = Math.round(bookedHours * 10) / 10
    return {
      screenId: screen.id,
      screenName: screen.name,
      companyId: loc.companyId,
      company: loc.company,
      locationId: loc.locationId,
      location: loc.locationName,
      country: loc.country,
      modeId,
      modeLabel: mode.label,
      modeShort: mode.short,
      bookedHours: hours,
      expectedH: hours,
      actualH: null,
      onlinePct: null,
      guaranteedDeliveryPct: null,
      totalPlayPct: null,
      guaranteedPlays: guarantee.plays,
      guaranteedSec: guarantee.airtimeSec,
      actualPlays: null,
      actualSec: null,
      missedPlays: null,
      missedSec: null,
      extraPlays: null,
      extraSec: null,
      creatives: creatives.map((c) => c.name || 'Untitled'),
      creativeRefs: creatives.map((c) => ({
        id: c.id,
        name: c.name || 'Untitled',
      })),
      status: 'No telemetry',
      fillNote: tel.fillNote,
      lastSeen: tel.lastSeen,
      telemetry: 'missing',
      openingHours: openingLabel(loc),
    }
  }

  const missedPlays = Math.min(tel.missedPlays ?? 0, guarantee.plays)
  const extraPlays = tel.extraPlays ?? 0
  const deliveredScheduled = guarantee.plays - missedPlays
  const actualPlays = deliveredScheduled + extraPlays
  const adSec = guarantee.adSecPerPlay || 60
  const pcts = playDeliveryPcts({
    guaranteedPlays: guarantee.plays,
    missedPlays,
    actualPlays,
  })
  // Online % = scheduled plays that ran (excludes dense-loop extras).
  const online = onlineHoursFromPlays({
    bookedHours,
    guaranteedPlays: guarantee.plays,
    missedPlays,
  })

  return {
    screenId: screen.id,
    screenName: screen.name,
    companyId: loc.companyId,
    company: loc.company,
    locationId: loc.locationId,
    location: loc.locationName,
    country: loc.country,
    modeId,
    modeLabel: mode.label,
    modeShort: mode.short,
    bookedHours: online.expectedH,
    expectedH: online.expectedH,
    actualH: online.actualH,
    onlinePct: online.onlinePct,
    guaranteedDeliveryPct: pcts.guaranteedDeliveryPct,
    totalPlayPct: pcts.totalPlayPct,
    guaranteedPlays: guarantee.plays,
    guaranteedSec: guarantee.airtimeSec,
    actualPlays,
    actualSec: actualPlays * adSec,
    missedPlays,
    missedSec: missedPlays * adSec,
    extraPlays,
    extraSec: extraPlays * adSec,
    creatives: creatives.map((c) => c.name || 'Untitled'),
    creativeRefs: creatives.map((c) => ({
      id: c.id,
      name: c.name || 'Untitled',
    })),
    status: statusFor({
      telemetry: tel.telemetry,
      guaranteedPlays: guarantee.plays,
      missedPlays,
      actualPlays,
    }),
    fillNote: tel.fillNote,
    lastSeen: tel.lastSeen,
    telemetry: tel.telemetry,
    openingHours: openingLabel(loc),
  }
}

/**
 * Two delivery percentages:
 * - guaranteedDeliveryPct: share of the guaranteed floor that ran (max 100)
 * - totalPlayPct: actual plays / guaranteed (can exceed 100 via dense loops)
 */
export function playDeliveryPcts({
  guaranteedPlays,
  missedPlays,
  actualPlays,
}) {
  const guaranteed = Number(guaranteedPlays) || 0
  if (guaranteed <= 0) {
    return { guaranteedDeliveryPct: null, totalPlayPct: null }
  }
  const missed = Math.min(Number(missedPlays) || 0, guaranteed)
  const deliveredScheduled = guaranteed - missed
  const guaranteedDeliveryPct = Math.min(
    100,
    Math.round((deliveredScheduled / guaranteed) * 1000) / 10,
  )
  const actual = Number(actualPlays)
  const totalPlayPct = Number.isFinite(actual)
    ? Math.round((actual / guaranteed) * 1000) / 10
    : null
  return { guaranteedDeliveryPct, totalPlayPct }
}

/**
 * Online hours from play shortfall (not from dense-loop extras).
 * onlinePct mirrors guaranteedDeliveryPct (max 100).
 */
export function onlineHoursFromPlays({
  bookedHours,
  guaranteedPlays,
  missedPlays,
}) {
  const expectedH = Math.round((Number(bookedHours) || 0) * 10) / 10
  const { guaranteedDeliveryPct } = playDeliveryPcts({
    guaranteedPlays,
    missedPlays,
    actualPlays: null,
  })
  const onlinePct = guaranteedDeliveryPct ?? 100
  const actualH = Math.round(expectedH * (onlinePct / 100) * 10) / 10
  return { expectedH, actualH, onlinePct }
}

export function formatPct(pct) {
  if (pct == null || Number.isNaN(pct)) return '—'
  return `${pct}%`
}

/** Patch Finance screen rows so Online % matches play-delivery missed ratio. */
export function syncFinanceScreensWithPlayDelivery(financeScreens, draft) {
  const plays = buildPlayDeliveryRows(draft, { plannedOnly: false })
  const byId = new Map(plays.map((p) => [p.screenId, p]))
  return (financeScreens || []).map((row) => {
    const play = byId.get(row.screenId)
    if (!play || play.onlinePct == null) return row
    return {
      ...row,
      expectedH: play.expectedH,
      actualH: play.actualH,
      onlinePct: play.onlinePct,
    }
  })
}

/**
 * Per-screen delivery rows for selected creative screens.
 * plannedOnly=true → Builder / Revenue (guarantee only).
 */
export function buildPlayDeliveryRows(draft, { plannedOnly = false } = {}) {
  const slots = draft?.slots || 6
  const byScreen = new Map()

  for (const creative of draft?.creatives || []) {
    for (const screenId of creative.selectedScreenIds || []) {
      if (!byScreen.has(screenId)) byScreen.set(screenId, [])
      byScreen.get(screenId).push(creative)
    }
  }

  const rows = []
  for (const loc of INVENTORY) {
    for (const screen of loc.screens) {
      if (!byScreen.has(screen.id)) continue
      rows.push(
        enrichScreenDelivery({
          screen,
          loc,
          creatives: byScreen.get(screen.id),
          slots,
          plannedOnly,
        }),
      )
    }
  }

  return rows.sort((a, b) => a.screenId.localeCompare(b.screenId))
}

/** Planned guarantee for one screen id (Builder picker / Revenue). */
export function plannedGuaranteeForScreen(screenId, draft, creative) {
  let screen = null
  let loc = null
  for (const l of INVENTORY) {
    const s = l.screens.find((x) => x.id === screenId)
    if (s) {
      screen = s
      loc = l
      break
    }
  }
  if (!screen || !loc) return null
  return enrichScreenDelivery({
    screen,
    loc,
    creatives: [creative || { name: 'Creative', hours: draft?.creatives?.[0]?.hours, startDate: draft?.startDate, endDate: draft?.endDate, allDays: true, days: [] }],
    slots: draft?.slots || 6,
    plannedOnly: true,
  })
}

export function sumPlayMetrics(rows) {
  const init = {
    guaranteedPlays: 0,
    guaranteedSec: 0,
    actualPlays: 0,
    actualSec: 0,
    missedPlays: 0,
    missedSec: 0,
    extraPlays: 0,
    extraSec: 0,
    hasActual: false,
    count: rows.length,
    guaranteedDeliveryPct: null,
    totalPlayPct: null,
  }
  const summed = rows.reduce((acc, r) => {
    acc.guaranteedPlays += r.guaranteedPlays || 0
    acc.guaranteedSec += r.guaranteedSec || 0
    if (r.actualPlays != null) {
      acc.hasActual = true
      acc.actualPlays += r.actualPlays
      acc.actualSec += r.actualSec || 0
      acc.missedPlays += r.missedPlays || 0
      acc.missedSec += r.missedSec || 0
      acc.extraPlays += r.extraPlays || 0
      acc.extraSec += r.extraSec || 0
    }
    return acc
  }, init)

  if (summed.hasActual && summed.guaranteedPlays > 0) {
    const pcts = playDeliveryPcts({
      guaranteedPlays: summed.guaranteedPlays,
      missedPlays: summed.missedPlays,
      actualPlays: summed.actualPlays,
    })
    summed.guaranteedDeliveryPct = pcts.guaranteedDeliveryPct
    summed.totalPlayPct = pcts.totalPlayPct
  }
  return summed
}

export function buildPlayDeliveryTree(rows) {
  const byCompany = new Map()
  for (const row of rows) {
    if (!byCompany.has(row.company)) {
      byCompany.set(row.company, {
        company: row.company,
        companyId: row.companyId,
        locations: new Map(),
      })
    }
    const co = byCompany.get(row.company)
    if (!co.locations.has(row.location)) {
      co.locations.set(row.location, {
        location: row.location,
        locationId: row.locationId,
        country: row.country,
        screens: [],
      })
    }
    co.locations.get(row.location).screens.push(row)
  }

  return [...byCompany.values()]
    .map((co) => {
      const locations = [...co.locations.values()]
        .map((loc) => ({
          ...loc,
          screens: [...loc.screens].sort((a, b) =>
            a.screenId.localeCompare(b.screenId),
          ),
          metrics: sumPlayMetrics(loc.screens),
        }))
        .sort((a, b) => a.location.localeCompare(b.location))
      const screens = locations.flatMap((l) => l.screens)
      return {
        company: co.company,
        companyId: co.companyId,
        locations,
        screens,
        metrics: sumPlayMetrics(screens),
      }
    })
    .sort((a, b) => a.company.localeCompare(b.company))
}

export { formatDuration, formatPlays }
