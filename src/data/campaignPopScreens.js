/**
 * Play delivery screen rows for campaign detail.
 * Expected = booked play hours ∩ opening hours; Actual = detected online+playing.
 * Wireframe uses hours % only — no photo PoP counts.
 */

import { INVENTORY } from './inventory'

/** Mock delivery profiles keyed by screen id. */
const DELIVERY = {
  'SCR-1042': { expectedH: 310, actualH: 306.4, lastSeen: '2 min ago', telemetry: 'ok' },
  'SCR-1043': { expectedH: 310, actualH: 290.1, lastSeen: '4 min ago', telemetry: 'ok' },
  'SCR-2101': { expectedH: 310, actualH: 308.8, lastSeen: '1 min ago', telemetry: 'ok' },
  'SCR-2102': { expectedH: 310, actualH: 301.2, lastSeen: '6 min ago', telemetry: 'ok' },
  'SCR-5501': { expectedH: 248, actualH: 247.5, lastSeen: '3 min ago', telemetry: 'ok' },
  'SCR-5502': { expectedH: 248, actualH: 220.0, lastSeen: '18 min ago', telemetry: 'ok' },
  'SCR-6601': { expectedH: 248, actualH: 248.0, lastSeen: '1 min ago', telemetry: 'ok' },
  'SCR-6602': { expectedH: 248, actualH: 180.4, lastSeen: '2h ago', telemetry: 'ok' },
  'SCR-3301': { expectedH: 90, actualH: 79.2, lastSeen: '12 min ago', telemetry: 'ok' },
  'SCR-3302': { expectedH: 90, actualH: 88.5, lastSeen: '5 min ago', telemetry: 'ok' },
  'SCR-3303': { expectedH: 90, actualH: null, lastSeen: '—', telemetry: 'missing' },
  'SCR-4401': { expectedH: 90, actualH: 64.0, lastSeen: '41 min ago', telemetry: 'ok' },
}

function openingLabel(loc) {
  const mon = loc.openingHours?.mon
  if (!mon) return '—'
  return `${String(mon.open).padStart(2, '0')}:00–${String(mon.close).padStart(2, '0')}:00`
}

function statusFor(expectedH, actualH, telemetry) {
  if (telemetry === 'missing') return 'No telemetry'
  if (actualH == null) return 'No telemetry'
  const pct = expectedH > 0 ? (actualH / expectedH) * 100 : 0
  if (pct >= 98) return 'Healthy'
  if (pct >= 90) return 'Watch'
  return 'Needs review'
}

/**
 * Build PoP rows from campaign creatives (screen → creatives on that screen).
 */
export function buildPopScreensFromDraft(draft) {
  const byScreen = new Map()

  for (const creative of draft?.creatives || []) {
    for (const screenId of creative.selectedScreenIds || []) {
      if (!byScreen.has(screenId)) byScreen.set(screenId, [])
      byScreen.get(screenId).push(creative.name || 'Untitled')
    }
  }

  const rows = []
  for (const loc of INVENTORY) {
    for (const screen of loc.screens) {
      if (!byScreen.has(screen.id)) continue
      const creatives = byScreen.get(screen.id)
      const delivery = DELIVERY[screen.id] || {
        expectedH: 200,
        actualH: 190,
        lastSeen: '15 min ago',
        telemetry: 'ok',
      }
      const expectedH = delivery.expectedH
      const actualH = delivery.actualH
      const gapH =
        actualH == null ? null : Math.max(0, Math.round((expectedH - actualH) * 10) / 10)
      const deliveryPct =
        actualH == null || expectedH <= 0
          ? null
          : Math.round((actualH / expectedH) * 1000) / 10
      const bookedWindow =
        creatives.length === 1 && creatives[0] === 'Gym cutdown'
          ? 'Fri–Sat · 16:00–21:00'
          : 'Daily · 10:00–22:00'

      rows.push({
        id: screen.id,
        screenId: screen.id,
        screenName: screen.name,
        companyId: loc.companyId,
        company: loc.company,
        locationId: loc.locationId,
        location: loc.locationName,
        country: loc.country,
        creatives,
        creativeLabel: creatives.join(', '),
        openingHours: openingLabel(loc),
        bookedWindow,
        expectedH,
        actualH,
        gapH,
        deliveryPct,
        lastSeen: delivery.lastSeen,
        telemetry: delivery.telemetry,
        player: (screen.tags || []).find((t) => t.startsWith('Player:') || t.startsWith('Browser:')) || '—',
        status: statusFor(expectedH, actualH, delivery.telemetry),
      })
    }
  }

  return rows.sort((a, b) => a.screenId.localeCompare(b.screenId))
}

export function formatHours(h) {
  if (h == null || Number.isNaN(h)) return '—'
  const whole = Math.floor(h)
  const mins = Math.round((h - whole) * 60)
  if (mins === 0) return `${whole}h`
  return `${whole}h ${mins}m`
}
