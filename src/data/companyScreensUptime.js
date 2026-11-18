/**
 * Company Screens → Uptime tab: Campaign → Creative → Screens,
 * plus a flat screen list with campaign membership (date-filterable).
 */

import { createSampleBuilderDraft } from './campaignDetailSample'
import {
  buildPlayDeliveryRows,
  formatDuration,
  formatPct,
  formatPlays,
  sumPlayMetrics,
} from './playDelivery'

export const COMPANY_NAME = 'Inspire Media'

const DAYS_SHORT = {
  sun: 'Sun',
  mon: 'Mon',
  tue: 'Tue',
  wed: 'Wed',
  thu: 'Thu',
  fri: 'Fri',
  sat: 'Sat',
}

function padHour(h) {
  return `${String(h).padStart(2, '0')}:00`
}

export function formatHourRange(hourStart, hourEnd) {
  if (hourStart == null || hourEnd == null) return '—'
  return `${padHour(hourStart)}–${padHour(hourEnd)}`
}

export function formatDateRange(startDate, endDate) {
  const fmt = (iso) => {
    if (!iso) return '—'
    return new Intl.DateTimeFormat('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    }).format(new Date(`${iso}T12:00:00`))
  }
  if (!startDate && !endDate) return '—'
  return `${fmt(startDate)} → ${fmt(endDate)}`
}

export function formatCreativeDays(creative) {
  if (creative.allDays) return 'Every day'
  const days = creative.days || []
  if (!days.length) return '—'
  return days.map((d) => DAYS_SHORT[d] || d).join(', ')
}

function hoursFromRange(hourStart, hourEnd) {
  const start = Number(hourStart) || 0
  const end = Number(hourEnd) || 24
  const hours = []
  for (let h = start; h < end; h += 1) hours.push(h)
  return hours
}

function rangesOverlap(aStart, aEnd, bStart, bEnd) {
  if (!aStart || !aEnd) return true
  if (!bStart && !bEnd) return true
  const from = bStart || '0000-01-01'
  const to = bEnd || '9999-12-31'
  return aStart <= to && aEnd >= from
}

/** Second sample campaign so the company Uptime tree has more than one root. */
function createSummerCoolersDraft() {
  const slots = 6
  const DAYS = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat']
  return {
    name: 'Summer Coolers',
    advertiser: 'PepsiCo',
    type: 'Paid',
    value: '8500',
    currency: 'USD',
    slots,
    startDate: '2026-06-01',
    endDate: '2026-06-30',
    hourStart: 12,
    hourEnd: 20,
    creatives: [
      {
        id: 'cr_summer_lobby',
        name: 'Lobby takeover',
        patternType: 'weekly',
        startDate: '2026-06-01',
        endDate: '2026-06-30',
        repeatEveryWeeks: 1,
        allDays: true,
        days: [...DAYS],
        endMode: 'date',
        runDays: 30,
        hours: hoursFromRange(12, 20),
        hourStart: 12,
        hourEnd: 20,
        selectedScreenIds: ['SCR-1042', 'SCR-1043', 'SCR-1044'],
      },
      {
        id: 'cr_summer_cafe',
        name: 'Café weekends',
        patternType: 'weekly',
        startDate: '2026-06-07',
        endDate: '2026-06-29',
        repeatEveryWeeks: 1,
        allDays: false,
        days: ['fri', 'sat', 'sun'],
        endMode: 'date',
        runDays: 23,
        hours: hoursFromRange(14, 22),
        hourStart: 14,
        hourEnd: 22,
        selectedScreenIds: ['SCR-2101', 'SCR-2102'],
      },
    ],
  }
}

function companySamples() {
  return [
    {
      id: 'cmp_01',
      status: 'Ended',
      draft: createSampleBuilderDraft(),
    },
    {
      id: 'cmp_02',
      status: 'Ended',
      draft: createSummerCoolersDraft(),
    },
  ]
}

function companyRowsForCreative(draft, creative, companyName) {
  const mini = { ...draft, creatives: [creative] }
  return buildPlayDeliveryRows(mini, { plannedOnly: false }).filter(
    (row) => row.company === companyName,
  )
}

/**
 * Flattened placements: one row per campaign × creative × screen (company).
 */
export function buildCompanyPlacements(companyName = COMPANY_NAME) {
  const placements = []
  for (const sample of companySamples()) {
    const { draft } = sample
    for (const creative of draft.creatives || []) {
      const screens = companyRowsForCreative(draft, creative, companyName)
      for (const screen of screens) {
        placements.push({
          campaignId: sample.id,
          campaignName: draft.name,
          advertiser: draft.advertiser,
          campaignStatus: sample.status,
          campaignStart: draft.startDate,
          campaignEnd: draft.endDate,
          creativeId: creative.id,
          creativeName: creative.name,
          creativeStart: creative.startDate,
          creativeEnd: creative.endDate,
          hourStart: creative.hourStart,
          hourEnd: creative.hourEnd,
          hoursLabel: formatHourRange(creative.hourStart, creative.hourEnd),
          datesLabel: formatDateRange(creative.startDate, creative.endDate),
          daysLabel: formatCreativeDays(creative),
          screen,
        })
      }
    }
  }
  return placements
}

export function buildCompanyUptimeTree(companyName = COMPANY_NAME) {
  const placements = buildCompanyPlacements(companyName)
  const byCampaign = new Map()

  for (const p of placements) {
    if (!byCampaign.has(p.campaignId)) {
      byCampaign.set(p.campaignId, {
        id: p.campaignId,
        name: p.campaignName,
        advertiser: p.advertiser,
        status: p.campaignStatus,
        startDate: p.campaignStart,
        endDate: p.campaignEnd,
        datesLabel: formatDateRange(p.campaignStart, p.campaignEnd),
        creatives: new Map(),
      })
    }
    const camp = byCampaign.get(p.campaignId)
    if (!camp.creatives.has(p.creativeId)) {
      camp.creatives.set(p.creativeId, {
        id: p.creativeId,
        name: p.creativeName,
        startDate: p.creativeStart,
        endDate: p.creativeEnd,
        hourStart: p.hourStart,
        hourEnd: p.hourEnd,
        hoursLabel: p.hoursLabel,
        datesLabel: p.datesLabel,
        daysLabel: p.daysLabel,
        screens: [],
      })
    }
    camp.creatives.get(p.creativeId).screens.push(p.screen)
  }

  const campaigns = [...byCampaign.values()].map((camp) => {
    const creatives = [...camp.creatives.values()].map((cr) => ({
      ...cr,
      metrics: sumPlayMetrics(cr.screens),
      screenCount: cr.screens.length,
    }))
    const allScreens = creatives.flatMap((c) => c.screens)
    return {
      id: camp.id,
      name: camp.name,
      advertiser: camp.advertiser,
      status: camp.status,
      startDate: camp.startDate,
      endDate: camp.endDate,
      datesLabel: camp.datesLabel,
      creatives,
      metrics: sumPlayMetrics(allScreens),
      screenCount: allScreens.length,
    }
  })

  return { campaigns }
}

/**
 * One row per screen: campaigns (and creatives) that ran on it,
 * optionally filtered by date overlap with creative windows.
 */
/**
 * Campaign × creative placements for one screen (optional date overlap filter).
 */
export function getScreenCampaignCreatives(
  screenId,
  { from = '', to = '' } = {},
) {
  if (!screenId) return []
  return buildCompanyPlacements()
    .filter((p) => p.screen.screenId === screenId)
    .filter((p) =>
      rangesOverlap(p.creativeStart, p.creativeEnd, from || null, to || null),
    )
    .map((p) => ({
      key: `${p.campaignId}::${p.creativeId}`,
      campaignId: p.campaignId,
      campaignName: p.campaignName,
      advertiser: p.advertiser,
      campaignStatus: p.campaignStatus,
      campaignDatesLabel: formatDateRange(p.campaignStart, p.campaignEnd),
      creativeId: p.creativeId,
      creativeName: p.creativeName,
      hoursLabel: p.hoursLabel,
      datesLabel: p.datesLabel,
      daysLabel: p.daysLabel,
      guaranteedPlays: p.screen.guaranteedPlays,
      guaranteedSec: p.screen.guaranteedSec,
      actualPlays: p.screen.actualPlays,
      actualSec: p.screen.actualSec,
      missedPlays: p.screen.missedPlays,
      missedSec: p.screen.missedSec,
      extraPlays: p.screen.extraPlays,
      extraSec: p.screen.extraSec,
      guaranteedDeliveryPct: p.screen.guaranteedDeliveryPct,
      totalPlayPct: p.screen.totalPlayPct,
      status: p.screen.status,
      fillNote: p.screen.fillNote,
      modeShort: p.screen.modeShort,
    }))
    .sort((a, b) => {
      const byCamp = a.campaignName.localeCompare(b.campaignName)
      if (byCamp !== 0) return byCamp
      return a.creativeName.localeCompare(b.creativeName)
    })
}

export function buildCompanyScreenUptimeRows({
  companyName = COMPANY_NAME,
  from = '',
  to = '',
} = {}) {
  const placements = buildCompanyPlacements(companyName).filter((p) =>
    rangesOverlap(p.creativeStart, p.creativeEnd, from || null, to || null),
  )

  const byScreen = new Map()
  for (const p of placements) {
    const id = p.screen.screenId
    if (!byScreen.has(id)) {
      byScreen.set(id, {
        screenId: id,
        screenName: p.screen.screenName,
        location: p.screen.location,
        openingHours: p.screen.openingHours,
        modeShort: p.screen.modeShort,
        modeLabel: p.screen.modeLabel,
        status: p.screen.status,
        fillNote: p.screen.fillNote,
        screenRows: [],
        campaigns: new Map(),
      })
    }
    const entry = byScreen.get(id)
    entry.screenRows.push(p.screen)

    if (!entry.campaigns.has(p.campaignId)) {
      entry.campaigns.set(p.campaignId, {
        id: p.campaignId,
        name: p.campaignName,
        advertiser: p.advertiser,
        status: p.campaignStatus,
        startDate: p.campaignStart,
        endDate: p.campaignEnd,
        datesLabel: formatDateRange(p.campaignStart, p.campaignEnd),
        creatives: [],
      })
    }
    const camp = entry.campaigns.get(p.campaignId)
    if (!camp.creatives.some((c) => c.id === p.creativeId)) {
      camp.creatives.push({
        id: p.creativeId,
        name: p.creativeName,
        hoursLabel: p.hoursLabel,
        datesLabel: p.datesLabel,
      })
    }
  }

  return [...byScreen.values()]
    .map((entry) => {
      const metrics = sumPlayMetrics(entry.screenRows)
      // Prefer worst / most recent status from placements
      const status =
        entry.screenRows.find((r) => r.status === 'Needs review')?.status ||
        entry.screenRows.find((r) => r.status === 'Watch')?.status ||
        entry.screenRows[0]?.status ||
        '—'
      return {
        screenId: entry.screenId,
        screenName: entry.screenName,
        location: entry.location,
        openingHours: entry.openingHours,
        modeShort: entry.modeShort,
        modeLabel: entry.modeLabel,
        fillNote: entry.fillNote,
        status,
        metrics,
        campaigns: [...entry.campaigns.values()].sort((a, b) =>
          a.name.localeCompare(b.name),
        ),
        // Keep a representative delivery row for "Open screen"
        sampleRow: entry.screenRows[0],
      }
    })
    .sort((a, b) => a.screenId.localeCompare(b.screenId))
}

export { formatDuration, formatPct, formatPlays, sumPlayMetrics }
