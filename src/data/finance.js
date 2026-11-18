/**
 * Mock Finance data for admin wireframe.
 * Sources: docs/requirements/04 (payables + statements),
 * 05 (earnings / play delivery), 06 (Finance nav), Claude admin artifact
 * (By company / By location / By campaign grouping).
 *
 * Payment unit in this wireframe = screen × creative payable row.
 * Same screen may appear twice for non-overlapping creatives.
 * By company / By location / By campaign expand to those rows; parent can Mark all paid.
 * Delivery gate = actual online+playing hours / expected booked hours (%).
 */

export const FINANCE_CURRENCIES = ['KWD', 'USD', 'SAR', 'AED', 'QAR', 'BHD', 'OMR']

export const FINANCE_MONTHS = [
  { id: '2026-10', label: 'October 2026' },
  { id: '2026-09', label: 'September 2026' },
  { id: '2026-08', label: 'August 2026' },
]

export const FINANCE_GROUP_VIEWS = [
  { id: 'company', label: 'By company' },
  { id: 'location', label: 'By location' },
  { id: 'campaign', label: 'By campaign' },
]

/** Minimum play delivery % before Mark paid is allowed (wireframe). */
export const DELIVERY_READY_PCT = 98

/** FX illustrative only — wireframe display helper. */
const FX_TO_KWD = {
  KWD: 1,
  USD: 0.308,
  SAR: 0.082,
  AED: 0.084,
  QAR: 0.085,
  BHD: 0.817,
  OMR: 0.8,
}

export function convertFromKwd(amountKwd, currency) {
  const rate = FX_TO_KWD[currency] || 1
  return Math.round((amountKwd / rate) * 1000) / 1000
}

export function moneyFinance(amount, currency = 'KWD') {
  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
      maximumFractionDigits:
        currency === 'KWD' || currency === 'BHD' || currency === 'OMR' ? 3 : 2,
    }).format(amount)
  } catch {
    return `${currency} ${amount}`
  }
}

/**
 * Flat screen × creative payables.
 * Same screen can appear more than once when creatives have non-overlapping
 * schedules. Statuses: Low delivery | Ready to pay | On hold | Paid
 */
export const FINANCE_SCREENS = [
  // Inspire · Fitness First — Sharq · Ramadan
  // SCR-1042 listed twice: Hero (daily) + Gym cutdown (Fri–Sat evenings)
  {
    id: 'fs_1042_hero',
    screenId: 'SCR-1042',
    screenName: 'Lobby LED',
    companyId: 'co_inspire',
    company: 'Inspire Media',
    country: 'Kuwait',
    hostStatus: 'Verified',
    locationId: 'loc_01',
    location: 'Fitness First — Sharq',
    campaignId: 'cmp_ramadan',
    campaign: 'Ramadan Retail Push',
    advertiser: 'Nike GCC',
    creativeId: 'cr_hero',
    creative: 'Hero — malls',
    creativeSchedule: 'Daily · 10:00–16:00',
    sharePercent: 70,
    referring: false,
    allocatedKwd: 180,
    earningsKwd: 135,
    owedKwd: 135,
    paidKwd: 0,
    status: 'Ready to pay',
    bankHold: false,
    expectedH: 186,
    actualH: 184.2,
    deliveryPct: 99.0,
  },
  {
    id: 'fs_1042_gym',
    screenId: 'SCR-1042',
    screenName: 'Lobby LED',
    companyId: 'co_inspire',
    company: 'Inspire Media',
    country: 'Kuwait',
    hostStatus: 'Verified',
    locationId: 'loc_01',
    location: 'Fitness First — Sharq',
    campaignId: 'cmp_ramadan',
    campaign: 'Ramadan Retail Push',
    advertiser: 'Nike GCC',
    creativeId: 'cr_gym',
    creative: 'Gym cutdown',
    creativeSchedule: 'Fri–Sat · 16:00–21:00',
    sharePercent: 70,
    referring: false,
    allocatedKwd: 100,
    earningsKwd: 75,
    owedKwd: 75,
    paidKwd: 0,
    status: 'Ready to pay',
    bankHold: false,
    expectedH: 50,
    actualH: 49.1,
    deliveryPct: 98.2,
  },
  {
    id: 'fs_1043',
    screenId: 'SCR-1043',
    screenName: 'Cardio Wall',
    companyId: 'co_inspire',
    company: 'Inspire Media',
    country: 'Kuwait',
    hostStatus: 'Verified',
    locationId: 'loc_01',
    location: 'Fitness First — Sharq',
    campaignId: 'cmp_ramadan',
    campaign: 'Ramadan Retail Push',
    advertiser: 'Nike GCC',
    creativeId: 'cr_hero',
    creative: 'Hero — malls',
    creativeSchedule: 'Daily · 10:00–22:00',
    sharePercent: 70,
    referring: false,
    allocatedKwd: 260,
    earningsKwd: 195,
    owedKwd: 195,
    paidKwd: 0,
    status: 'Ready to pay',
    bankHold: false,
    expectedH: 310,
    actualH: 305.1,
    deliveryPct: 98.4,
  },
  {
    id: 'fs_1044',
    screenId: 'SCR-1044',
    screenName: 'Cafe Corner',
    companyId: 'co_inspire',
    company: 'Inspire Media',
    country: 'Kuwait',
    hostStatus: 'Verified',
    locationId: 'loc_01',
    location: 'Fitness First — Sharq',
    campaignId: 'cmp_ramadan',
    campaign: 'Ramadan Retail Push',
    advertiser: 'Nike GCC',
    creativeId: 'cr_hero',
    creative: 'Hero — malls',
    creativeSchedule: 'Daily · 10:00–22:00',
    sharePercent: 70,
    referring: false,
    allocatedKwd: 360,
    earningsKwd: 270,
    owedKwd: 270,
    paidKwd: 0,
    status: 'Ready to pay',
    bankHold: false,
    expectedH: 310,
    actualH: 308.2,
    deliveryPct: 99.4,
  },
  // Inspire · Cafe Mantou · Bank Launch (fully paid campaign with Oasis)
  {
    id: 'fs_2101a',
    screenId: 'SCR-M201',
    screenName: 'Counter Portrait',
    companyId: 'co_inspire',
    company: 'Inspire Media',
    country: 'Kuwait',
    hostStatus: 'Verified',
    locationId: 'loc_02',
    location: 'Cafe Mantou',
    campaignId: 'cmp_bank',
    campaign: 'Bank Launch — Kuwait',
    advertiser: 'NBK',
    creativeId: 'cr_bank_main',
    creative: 'Branch launch cut',
    creativeSchedule: 'Daily · 09:00–21:00',
    sharePercent: 70,
    referring: false,
    allocatedKwd: 550,
    earningsKwd: 402.5,
    owedKwd: 0,
    paidKwd: 402.5,
    status: 'Paid',
    bankHold: false,
    expectedH: 248,
    actualH: 245.1,
    deliveryPct: 98.8,
  },
  {
    id: 'fs_2101b',
    screenId: 'SCR-M202',
    screenName: 'Window Strip',
    companyId: 'co_inspire',
    company: 'Inspire Media',
    country: 'Kuwait',
    hostStatus: 'Verified',
    locationId: 'loc_02',
    location: 'Cafe Mantou',
    campaignId: 'cmp_bank',
    campaign: 'Bank Launch — Kuwait',
    advertiser: 'NBK',
    creativeId: 'cr_bank_main',
    creative: 'Branch launch cut',
    creativeSchedule: 'Daily · 09:00–21:00',
    sharePercent: 70,
    referring: false,
    allocatedKwd: 550,
    earningsKwd: 402.5,
    owedKwd: 0,
    paidKwd: 402.5,
    status: 'Paid',
    bankHold: false,
    expectedH: 248,
    actualH: 244.0,
    deliveryPct: 98.4,
  },
  // Avenues · Zone A · Ramadan (low delivery)
  {
    id: 'fs_2101',
    screenId: 'SCR-2101',
    screenName: 'Atrium Banner',
    companyId: 'co_avenues',
    company: 'Avenues Ops',
    country: 'Kuwait',
    hostStatus: 'Verified',
    locationId: 'loc_03',
    location: 'The Avenues — Zone A',
    campaignId: 'cmp_ramadan',
    campaign: 'Ramadan Retail Push',
    advertiser: 'Nike GCC',
    creativeId: 'cr_hero',
    creative: 'Hero — malls',
    creativeSchedule: 'Daily · 10:00–22:00',
    sharePercent: 65,
    referring: false,
    allocatedKwd: 700,
    earningsKwd: 455,
    owedKwd: 455,
    paidKwd: 0,
    status: 'Low delivery',
    bankHold: false,
    expectedH: 310,
    actualH: 272.8,
    deliveryPct: 88.0,
  },
  {
    id: 'fs_2102',
    screenId: 'SCR-2102',
    screenName: 'Food Court A',
    companyId: 'co_avenues',
    company: 'Avenues Ops',
    country: 'Kuwait',
    hostStatus: 'Verified',
    locationId: 'loc_03',
    location: 'The Avenues — Zone A',
    campaignId: 'cmp_ramadan',
    campaign: 'Ramadan Retail Push',
    advertiser: 'Nike GCC',
    creativeId: 'cr_hero',
    creative: 'Hero — malls',
    creativeSchedule: 'Daily · 10:00–22:00',
    sharePercent: 65,
    referring: false,
    allocatedKwd: 700,
    earningsKwd: 455,
    owedKwd: 455,
    paidKwd: 0,
    status: 'Low delivery',
    bankHold: false,
    expectedH: 310,
    actualH: 268.5,
    deliveryPct: 86.6,
  },
  // Gulf · Glow Clinic · Summer (bank hold)
  {
    id: 'fs_3301',
    screenId: 'SCR-3301',
    screenName: 'Studio Mirror',
    companyId: 'co_gulf',
    company: 'Gulf Screens Co.',
    country: 'UAE',
    hostStatus: 'Pending',
    locationId: 'loc_05',
    location: 'Glow Clinic',
    campaignId: 'cmp_summer',
    campaign: 'Summer Coolers',
    advertiser: 'PepsiCo',
    creativeId: 'cr_summer',
    creative: 'Coolers spot',
    creativeSchedule: 'Daily · 10:00–20:00',
    sharePercent: 60,
    referring: false,
    allocatedKwd: 450,
    earningsKwd: 270,
    owedKwd: 270,
    paidKwd: 0,
    status: 'On hold',
    bankHold: true,
    expectedH: 270,
    actualH: 268,
    deliveryPct: 99.3,
  },
  {
    id: 'fs_3302',
    screenId: 'SCR-3302',
    screenName: 'Reception LED',
    companyId: 'co_gulf',
    company: 'Gulf Screens Co.',
    country: 'UAE',
    hostStatus: 'Pending',
    locationId: 'loc_05',
    location: 'Glow Clinic',
    campaignId: 'cmp_summer',
    campaign: 'Summer Coolers',
    advertiser: 'PepsiCo',
    creativeId: 'cr_summer',
    creative: 'Coolers spot',
    creativeSchedule: 'Daily · 10:00–20:00',
    sharePercent: 60,
    referring: false,
    allocatedKwd: 450,
    earningsKwd: 270,
    owedKwd: 270,
    paidKwd: 0,
    status: 'On hold',
    bankHold: true,
    expectedH: 270,
    actualH: 268,
    deliveryPct: 99.3,
  },
  // Oasis · Riyadh · Bank (paid)
  {
    id: 'fs_5501',
    screenId: 'SCR-5501',
    screenName: 'Entrance Portrait',
    companyId: 'co_oasis',
    company: 'Oasis Digital',
    country: 'Saudi Arabia',
    hostStatus: 'Verified',
    locationId: 'loc_07',
    location: 'Oasis Cafe — Riyadh',
    campaignId: 'cmp_bank',
    campaign: 'Bank Launch — Kuwait',
    advertiser: 'NBK',
    creativeId: 'cr_bank_main',
    creative: 'Branch launch cut',
    creativeSchedule: 'Daily · 09:00–21:00',
    sharePercent: 100,
    referring: true,
    allocatedKwd: 670,
    earningsKwd: 670,
    owedKwd: 0,
    paidKwd: 670,
    status: 'Paid',
    bankHold: false,
    expectedH: 310,
    actualH: 308,
    deliveryPct: 99.4,
  },
  {
    id: 'fs_5502',
    screenId: 'SCR-5502',
    screenName: 'Counter Strip',
    companyId: 'co_oasis',
    company: 'Oasis Digital',
    country: 'Saudi Arabia',
    hostStatus: 'Verified',
    locationId: 'loc_07',
    location: 'Oasis Cafe — Riyadh',
    campaignId: 'cmp_bank',
    campaign: 'Bank Launch — Kuwait',
    advertiser: 'NBK',
    creativeId: 'cr_bank_main',
    creative: 'Branch launch cut',
    creativeSchedule: 'Daily · 09:00–21:00',
    sharePercent: 100,
    referring: true,
    allocatedKwd: 670,
    earningsKwd: 670,
    owedKwd: 0,
    paidKwd: 670,
    status: 'Paid',
    bankHold: false,
    expectedH: 310,
    actualH: 307,
    deliveryPct: 99.0,
  },
  // Avenues · Dubai Marina · Summer (ready)
  {
    id: 'fs_6601',
    screenId: 'SCR-6601',
    screenName: 'Marina Lobby',
    companyId: 'co_avenues',
    company: 'Avenues Ops',
    country: 'Kuwait',
    hostStatus: 'Verified',
    locationId: 'loc_08',
    location: 'Dubai Marina Gym',
    campaignId: 'cmp_summer',
    campaign: 'Summer Coolers',
    advertiser: 'PepsiCo',
    creativeId: 'cr_summer',
    creative: 'Coolers spot',
    creativeSchedule: 'Daily · 10:00–22:00',
    sharePercent: 65,
    referring: false,
    allocatedKwd: 260,
    earningsKwd: 169,
    owedKwd: 169,
    paidKwd: 0,
    status: 'Ready to pay',
    bankHold: false,
    expectedH: 248,
    actualH: 246,
    deliveryPct: 99.2,
  },
  {
    id: 'fs_6602',
    screenId: 'SCR-6602',
    screenName: 'Studio Wall',
    companyId: 'co_avenues',
    company: 'Avenues Ops',
    country: 'Kuwait',
    hostStatus: 'Verified',
    locationId: 'loc_08',
    location: 'Dubai Marina Gym',
    campaignId: 'cmp_summer',
    campaign: 'Summer Coolers',
    advertiser: 'PepsiCo',
    creativeId: 'cr_summer',
    creative: 'Coolers spot',
    creativeSchedule: 'Daily · 10:00–22:00',
    sharePercent: 65,
    referring: false,
    allocatedKwd: 260,
    earningsKwd: 169,
    owedKwd: 169,
    paidKwd: 0,
    status: 'Ready to pay',
    bankHold: false,
    expectedH: 248,
    actualH: 244,
    deliveryPct: 98.4,
  },
]

export const FINANCE_ALERTS = [
  {
    id: 'alert_bank',
    tone: 'warn',
    text: '2 companies sent a new bank letter. Payouts on hold until confirmed by phone.',
    action: 'Review',
  },
]

export function canMarkPaidScreen(screen) {
  if (!screen) return false
  if (screen.bankHold || screen.status === 'On hold') return false
  if (screen.status === 'Paid') return false
  if (screen.deliveryPct == null || screen.deliveryPct < DELIVERY_READY_PCT) {
    return false
  }
  return screen.owedKwd > 0
}

export function markScreenPaid(screen) {
  return {
    ...screen,
    paidKwd: screen.paidKwd + screen.owedKwd,
    owedKwd: 0,
    status: 'Paid',
  }
}

export function financeSummaryFromScreens(screens) {
  const owed = screens.reduce((s, l) => s + l.owedKwd, 0)
  const paid = screens.reduce((s, l) => s + l.paidKwd, 0)
  const lowDelivery = screens.filter((l) => l.status === 'Low delivery').length
  const ready = screens.filter((l) => l.status === 'Ready to pay').length
  const onHold = screens.filter(
    (l) => l.status === 'On hold' || l.bankHold,
  ).length
  return { owed, paid, pending: owed, lowDelivery, ready, onHold }
}

function rollupStatus(screens) {
  if (screens.every((l) => l.status === 'Paid')) return 'Paid'
  if (screens.some((l) => l.status === 'On hold' || l.bankHold)) return 'On hold'
  if (screens.some((l) => l.status === 'Low delivery')) return 'Low delivery'
  if (screens.some((l) => l.status === 'Ready to pay')) return 'Ready to pay'
  return screens[0]?.status || '—'
}

function weightedDelivery(screens) {
  let expected = 0
  let actual = 0
  for (const l of screens) {
    if (l.deliveryPct == null || l.expectedH == null || l.actualH == null) {
      continue
    }
    expected += l.expectedH
    actual += l.actualH
  }
  if (expected <= 0) return null
  return Math.round((actual / expected) * 1000) / 10
}

/**
 * Build expandable groups. Children are always screens.
 */
export function groupFinanceScreens(screens, view) {
  const map = new Map()

  for (const screen of screens) {
    let key
    let title
    let meta
    if (view === 'location') {
      key = screen.locationId
      title = screen.location
      meta = `${screen.company} · ${screen.country}`
    } else if (view === 'campaign') {
      key = screen.campaignId
      title = screen.campaign
      meta = `${screen.advertiser}`
    } else {
      key = screen.companyId
      title = screen.company
      meta = `${screen.country}${
        screen.referring
          ? ' · referring 100%'
          : ` · share ${screen.sharePercent}%`
      }${screen.hostStatus !== 'Verified' ? ` · Host ${screen.hostStatus}` : ''}`
    }

    if (!map.has(key)) {
      map.set(key, {
        id: key,
        title,
        meta,
        campaignId: view === 'campaign' ? screen.campaignId : null,
        screens: [],
      })
    }
    map.get(key).screens.push(screen)
  }

  return [...map.values()].map((g) => {
    const owedKwd = g.screens.reduce((s, l) => s + l.owedKwd, 0)
    const paidKwd = g.screens.reduce((s, l) => s + l.paidKwd, 0)
    const expectedH = g.screens.reduce((s, l) => s + (l.expectedH || 0), 0)
    const actualH = g.screens.reduce((s, l) => s + (l.actualH || 0), 0)
    const deliveryPct = weightedDelivery(g.screens)
    const paidCount = g.screens.filter((l) => l.status === 'Paid').length
    const markableScreens = g.screens.filter((s) => canMarkPaidScreen(s))
    return {
      ...g,
      owedKwd,
      paidKwd,
      expectedH,
      actualH,
      deliveryPct,
      paidCount,
      screenCount: g.screens.length,
      markableCount: markableScreens.length,
      canMarkAll: markableScreens.length > 0,
      status: rollupStatus(g.screens),
    }
  })
}

/** @deprecated alias kept if anything still imports FINANCE_LINES */
export const FINANCE_LINES = FINANCE_SCREENS
export const canMarkPaidLine = canMarkPaidScreen
export const markLinePaid = markScreenPaid
export const financeSummaryFromLines = financeSummaryFromScreens
export const groupFinanceLines = groupFinanceScreens
