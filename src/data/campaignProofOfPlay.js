/**
 * Admin Proof of Play (PoP) for Paid campaigns.
 * Unit: 1 media item inside 1 creative × 1 screen (slots do not multiply PoP).
 * Wireframe: admin toggle only — no photo upload.
 */

import { isAnyContentKey } from './creativeContent'
import { SLOT_SEC } from './loopModes'

export function slotsForMediaDuration(durationSec) {
  const sec = Number(durationSec) || 0
  if (sec <= 0) return 1
  return Math.ceil(sec / SLOT_SEC)
}

/** Distinct media placed in a creative’s content packages (ANY preferred). */
export function distinctMediaInCreative(creative) {
  const packages = Object.values(creative?.contentByKey || {})
  const anyPacks = packages.filter((p) => isAnyContentKey(p?.key))
  const packs = anyPacks.length > 0 ? anyPacks : packages
  const byId = new Map()

  for (const pack of packs) {
    for (const loop of pack?.loops || []) {
      for (const slot of loop?.slots || []) {
        if (!slot?.mediaId || byId.has(slot.mediaId)) continue
        byId.set(slot.mediaId, {
          mediaId: slot.mediaId,
          name: slot.name || slot.mediaId,
          type: slot.type || 'media',
          duration: slot.duration ?? null,
          durationLabel: slot.durationLabel || null,
          thumb: slot.thumb || null,
          orientation: slot.orientation || null,
          slots: slotsForMediaDuration(slot.duration),
        })
      }
    }
  }

  return [...byId.values()]
}

export function popUnitId(screenId, creativeId, mediaId) {
  return `${screenId}::${creativeId}::${mediaId}`
}

/** Flat list of required PoP units for a campaign draft. */
export function buildPopUnits(draft) {
  const units = []
  for (const creative of draft?.creatives || []) {
    const mediaList = distinctMediaInCreative(creative)
    if (mediaList.length === 0) continue
    for (const screenId of creative.selectedScreenIds || []) {
      for (const media of mediaList) {
        units.push({
          id: popUnitId(screenId, creative.id, media.mediaId),
          screenId,
          creativeId: creative.id,
          creativeName: creative.name || 'Untitled',
          ...media,
        })
      }
    }
  }
  return units
}

export function summarizePopUnits(units, verifiedMap = {}) {
  const total = units.length
  const done = units.reduce(
    (n, u) => n + (verifiedMap[u.id] ? 1 : 0),
    0,
  )
  return {
    total,
    done,
    remaining: Math.max(0, total - done),
    complete: total > 0 && done === total,
  }
}

export function popUnitsForScreen(units, screenId) {
  return (units || []).filter((u) => u.screenId === screenId)
}

export function popUnitsForScreenCreative(units, screenId, creativeId) {
  return (units || []).filter(
    (u) => u.screenId === screenId && u.creativeId === creativeId,
  )
}

export function creativesOnScreen(units, screenId) {
  const order = []
  const seen = new Set()
  for (const u of popUnitsForScreen(units, screenId)) {
    if (seen.has(u.creativeId)) continue
    seen.add(u.creativeId)
    order.push({ id: u.creativeId, name: u.creativeName })
  }
  return order
}

export function summarizePopByScreen(units, verifiedMap = {}) {
  const byScreen = new Map()
  for (const u of units || []) {
    if (!byScreen.has(u.screenId)) byScreen.set(u.screenId, [])
    byScreen.get(u.screenId).push(u)
  }
  const out = new Map()
  for (const [screenId, list] of byScreen) {
    out.set(screenId, summarizePopUnits(list, verifiedMap))
  }
  return out
}

export function summarizePopByCompany(units, screenCompanyMap, verifiedMap = {}) {
  const byCompany = new Map()
  for (const u of units || []) {
    const company = screenCompanyMap.get(u.screenId) || 'Unknown'
    if (!byCompany.has(company)) byCompany.set(company, [])
    byCompany.get(company).push(u)
  }
  const out = new Map()
  for (const [company, list] of byCompany) {
    out.set(company, summarizePopUnits(list, verifiedMap))
  }
  return out
}

/**
 * Demo seed: Oasis (paid) fully verified; others partial so Mark as Paid stays gated.
 */
export function seedPopVerifiedMap(draft) {
  const units = buildPopUnits(draft)
  const map = {}
  for (const u of units) {
    // Oasis screens in sample finance: SCR-5501, SCR-5502
    if (u.screenId === 'SCR-5501' || u.screenId === 'SCR-5502') {
      map[u.id] = true
      continue
    }
    // Partial progress on a few lobby / atrium screens
    if (
      (u.screenId === 'SCR-1042' && u.mediaId === 'med_city') ||
      (u.screenId === 'SCR-2101' && u.mediaId === 'med_city') ||
      (u.screenId === 'SCR-2102' && u.creativeId === 'cr_sample_gym')
    ) {
      map[u.id] = true
    }
  }
  return map
}

export function formatPopProgress(summary) {
  if (!summary || summary.total === 0) return 'No PoP'
  if (summary.complete) return 'PoP done'
  return `PoP ${summary.done}/${summary.total}`
}
