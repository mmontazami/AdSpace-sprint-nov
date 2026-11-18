/**
 * Mock company Earnings & Screen Uptime data.
 * Sources: docs/requirements/05 (earnings, PoP entry, host states, currency),
 * 03 (Earn with Ads country → default currency), 04 (company share after split).
 */

export const EARNINGS_CURRENCIES = [
  'KWD',
  'USD',
  'SAR',
  'AED',
  'QAR',
  'BHD',
  'OMR',
]

/** Country chosen in Earn with Ads → default display currency (not set by Super Admin). */
export const COUNTRY_DEFAULT_CURRENCY = {
  KW: 'KWD',
  SA: 'SAR',
  AE: 'AED',
  QA: 'QAR',
  BH: 'BHD',
  OM: 'OMR',
}

export const EARNINGS_MONTHS = [
  { id: '2026-10', label: 'October 2026' },
  { id: '2026-09', label: 'September 2026' },
  { id: '2026-08', label: 'August 2026' },
]

/** Wireframe demos for Host / application state. */
export const HOST_STATE_DEMOS = [
  {
    id: 'not-applied',
    label: 'Not applied',
    hostStatus: 'Not applied',
    country: 'KW',
    companyName: 'Desert Screens Co.',
  },
  {
    id: 'incomplete',
    label: 'Incomplete',
    hostStatus: 'Incomplete',
    country: 'KW',
    companyName: 'Desert Screens Co.',
    missing: ['Bank account document', 'WhatsApp phone OTP'],
  },
  {
    id: 'pending',
    label: 'Pending review',
    hostStatus: 'Pending',
    country: 'AE',
    companyName: 'Gulf Screens Media',
    progress: [
      { step: 'Company contact', done: true },
      { step: 'Business registration', done: true },
      { step: 'Bank document', done: true },
      { step: 'Admin review', done: false },
    ],
  },
  {
    id: 'verified-empty',
    label: 'Verified · no earnings',
    hostStatus: 'Verified',
    country: 'KW',
    companyName: 'Inspire Media',
    hasEarnings: false,
  },
  {
    id: 'verified',
    label: 'Verified · with earnings',
    hostStatus: 'Verified',
    country: 'KW',
    companyName: 'Inspire Media',
    hasEarnings: true,
  },
]

/** Illustrative FX vs KWD for display switching. */
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

export function moneyEarnings(amount, currency = 'KWD') {
  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
      maximumFractionDigits:
        currency === 'KWD' || currency === 'BHD' || currency === 'OMR' ? 3 : 2,
    }).format(amount)
  } catch {
    return `${amount} ${currency}`
  }
}

export function defaultCurrencyForCountry(country) {
  return COUNTRY_DEFAULT_CURRENCY[country] || 'KWD'
}

/** Inventory / eligibility snapshot for a verified Host. */
export const EARNINGS_INVENTORY = {
  marketplaceLocations: 2,
  locationsEligible: 1,
  locationsIncomplete: 1,
  adSupportedScreens: 4,
  screensEligible: 3,
  screensIneligible: 1,
  locations: [
    {
      id: 'loc-sharq',
      name: 'Fitness First — Sharq',
      eligible: true,
      reason: 'Advertising info complete',
      screens: 3,
      adSupported: 3,
      eligibleScreens: 3,
    },
    {
      id: 'loc-salmiya',
      name: 'Fitness First — Salmiya',
      eligible: false,
      reason: 'Missing opening hours & audience',
      screens: 1,
      adSupported: 1,
      eligibleScreens: 0,
    },
  ],
}

/**
 * Company earnings after revenue split / referral (amounts in KWD).
 * `sharePct` = company share applied to allocated revenue.
 */
export const EARNINGS_LINES = [
  {
    id: 'el-1',
    monthId: '2026-10',
    campaign: 'Nike GCC — Autumn Push',
    advertiser: 'Nike GCC',
    location: 'Fitness First — Sharq',
    screenId: 'SCR-1042',
    screenName: 'Lobby LED',
    allocatedKwd: 120,
    sharePct: 70,
    earnedKwd: 84,
    referral: false,
    status: 'Paid',
    paidAt: '2026-11-02',
  },
  {
    id: 'el-2',
    monthId: '2026-10',
    campaign: 'Nike GCC — Autumn Push',
    advertiser: 'Nike GCC',
    location: 'Fitness First — Sharq',
    screenId: 'SCR-1043',
    screenName: 'Cardio Wall',
    allocatedKwd: 95,
    sharePct: 70,
    earnedKwd: 66.5,
    referral: false,
    status: 'Awaiting PoP',
    paidAt: null,
  },
  {
    id: 'el-3',
    monthId: '2026-10',
    campaign: 'Local F&B Week',
    advertiser: 'Ad Space',
    location: 'Fitness First — Sharq',
    screenId: 'SCR-1042',
    screenName: 'Lobby LED',
    allocatedKwd: 40,
    sharePct: 70,
    earnedKwd: 28,
    referral: false,
    status: 'Awaiting PoP',
    paidAt: null,
  },
  {
    id: 'el-4',
    monthId: '2026-10',
    campaign: 'Referral — Marina Hub',
    advertiser: 'Marina Hub',
    location: 'Fitness First — Sharq',
    screenId: 'SCR-1044',
    screenName: 'Studio Mirror',
    allocatedKwd: 55,
    sharePct: 100,
    earnedKwd: 55,
    referral: true,
    status: 'Ready',
    paidAt: null,
  },
  {
    id: 'el-5',
    monthId: '2026-09',
    campaign: 'Back to Gym',
    advertiser: 'Adidas',
    location: 'Fitness First — Sharq',
    screenId: 'SCR-1042',
    screenName: 'Lobby LED',
    allocatedKwd: 80,
    sharePct: 70,
    earnedKwd: 56,
    referral: false,
    status: 'Paid',
    paidAt: '2026-10-05',
  },
]

/** PoP items the company still needs to upload (entry from Earnings). */
export const POP_AWAITING = [
  {
    id: 'pop-1',
    campaign: 'Nike GCC — Autumn Push',
    screenId: 'SCR-1043',
    screenName: 'Cardio Wall',
    location: 'Fitness First — Sharq',
    adLabel: 'Nike — Autumn Reel',
    owedKwd: 66.5,
  },
  {
    id: 'pop-2',
    campaign: 'Local F&B Week',
    screenId: 'SCR-1042',
    screenName: 'Lobby LED',
    location: 'Fitness First — Sharq',
    adLabel: 'F&B — Week Hero',
    owedKwd: 28,
  },
]

/** Last-6-months chart (artifact-style). Current month may be pending. */
export const EARNINGS_CHART = [
  { id: '2026-05', label: 'May', earnedKwd: 180, pending: false },
  { id: '2026-06', label: 'Jun', earnedKwd: 210, pending: false },
  { id: '2026-07', label: 'Jul', earnedKwd: 165, pending: false },
  { id: '2026-08', label: 'Aug', earnedKwd: 190, pending: false },
  { id: '2026-09', label: 'Sep', earnedKwd: 56, pending: false },
  { id: '2026-10', label: 'Oct', earnedKwd: 233.5, pending: true },
]

export const EARNINGS_HISTORY = [
  { monthId: '2026-10', label: 'Oct 2026', earnedKwd: 233.5, paidKwd: 84 },
  { monthId: '2026-09', label: 'Sep 2026', earnedKwd: 56, paidKwd: 56 },
  { monthId: '2026-08', label: 'Aug 2026', earnedKwd: 0, paidKwd: 0 },
]

/** Lifetime / referred rollups for Overview KPIs (KWD). */
export const EARNINGS_KPI_META = {
  paidToDateKwd: 3150,
  paidToDateSince: 'Since March 2026',
}

/**
 * Combined Statements & Payouts (artifact had two tabs; requirements merge them).
 */
export const STATEMENTS_PAYOUTS = [
  {
    id: 'sp-1',
    month: 'October 2026',
    status: 'In progress',
    campaigns: 'Nike GCC, Local F&B, Marina Hub',
    earnedKwd: 233.5,
    paidKwd: 84,
    paidAt: null,
    account: '•••• 1234',
  },
  {
    id: 'sp-2',
    month: 'September 2026',
    status: 'Paid',
    campaigns: 'Back to Gym',
    earnedKwd: 56,
    paidKwd: 56,
    paidAt: '5 Oct 2026',
    account: '•••• 1234',
  },
  {
    id: 'sp-3',
    month: 'August 2026',
    status: 'Paid',
    campaigns: 'NBK, IKEA, KFH',
    earnedKwd: 380,
    paidKwd: 380,
    paidAt: '6 Sep 2026',
    account: '•••• 1234',
  },
  {
    id: 'sp-4',
    month: 'July 2026',
    status: 'Paid',
    campaigns: 'NBK, Hardee’s',
    earnedKwd: 290,
    paidKwd: 290,
    paidAt: '4 Aug 2026',
    account: '•••• 1234',
  },
]

export function summarizeEarnings(lines) {
  const total = lines.reduce((s, l) => s + l.earnedKwd, 0)
  const paid = lines
    .filter((l) => l.status === 'Paid')
    .reduce((s, l) => s + l.earnedKwd, 0)
  const awaitingPop = lines
    .filter((l) => l.status === 'Awaiting PoP')
    .reduce((s, l) => s + l.earnedKwd, 0)
  const ready = lines
    .filter((l) => l.status === 'Ready')
    .reduce((s, l) => s + l.earnedKwd, 0)
  const pending = awaitingPop + ready
  const referred = lines
    .filter((l) => l.referral)
    .reduce((s, l) => s + l.earnedKwd, 0)
  return { total, paid, awaitingPop, ready, pending, referred }
}

export function allocationBars(lines, view) {
  const groups = groupEarnings(lines, view)
  const total = groups.reduce((s, g) => s + g.earnedKwd, 0) || 1
  return groups.map((g) => ({
    id: g.id,
    name: g.title,
    earnedKwd: g.earnedKwd,
    pct: Math.round((g.earnedKwd / total) * 100),
    subtitle: g.subtitle,
  }))
}

export function groupEarnings(lines, view) {
  const map = new Map()
  for (const line of lines) {
    let key
    let title
    if (view === 'location') {
      key = line.location
      title = line.location
    } else if (view === 'campaign') {
      key = line.campaign
      title = line.campaign
    } else {
      key = `${line.screenId}`
      title = `${line.screenName} · ${line.screenId}`
    }
    if (!map.has(key)) {
      map.set(key, {
        id: key,
        title,
        subtitle:
          view === 'screen'
            ? line.location
            : view === 'campaign'
              ? line.advertiser
              : null,
        earnedKwd: 0,
        lines: [],
      })
    }
    const g = map.get(key)
    g.earnedKwd += line.earnedKwd
    g.lines.push(line)
  }
  const groups = [...map.values()]
  if (view === 'location') {
    for (const g of groups) {
      const screens = new Set(g.lines.map((l) => l.screenId)).size
      g.subtitle = `${screens} screen${screens === 1 ? '' : 's'}`
    }
  }
  return groups.sort((a, b) => b.earnedKwd - a.earnedKwd)
}

/**
 * Company screen uptime vs location opening hours (not full-day).
 * `offlineMinutes` = confirmed offline; `unknownMinutes` = no telemetry.
 */
export const COMPANY_UPTIME_SCREENS = [
  {
    id: 'up-lobby',
    screenId: 'SCR-1042',
    screenName: 'Lobby LED',
    location: 'Fitness First — Sharq',
    timezone: 'Asia/Kuwait',
    workingHours: '08:00–22:00',
    periodLabel: 'October 2026',
    expectedMinutes: 26040,
    onlineMinutes: 25840,
    offlineMinutes: 180,
    unknownMinutes: 20,
    onlinePct: 99.2,
    telemetry: 'ok',
    statusNow: 'online',
    adsScheduled: true,
    offlineDuringAds: false,
    daily: [
      { day: 'Mon 3', onlinePct: 100, offline: false },
      { day: 'Tue 4', onlinePct: 98.2, offline: true },
      { day: 'Wed 5', onlinePct: 100, offline: false },
      { day: 'Thu 6', onlinePct: 99.1, offline: false },
      { day: 'Fri 7', onlinePct: 97.4, offline: true },
      { day: 'Sat 8', onlinePct: 100, offline: false },
      { day: 'Sun 9', onlinePct: 100, offline: false },
    ],
  },
  {
    id: 'up-cardio',
    screenId: 'SCR-1043',
    screenName: 'Cardio Wall',
    location: 'Fitness First — Sharq',
    timezone: 'Asia/Kuwait',
    workingHours: '08:00–22:00',
    periodLabel: 'October 2026',
    expectedMinutes: 26040,
    onlineMinutes: 24370,
    offlineMinutes: 1520,
    unknownMinutes: 150,
    onlinePct: 93.6,
    telemetry: 'ok',
    statusNow: 'wifi',
    adsScheduled: true,
    offlineDuringAds: false,
    daily: [
      { day: 'Mon 3', onlinePct: 94, offline: true },
      { day: 'Tue 4', onlinePct: 91, offline: true },
      { day: 'Wed 5', onlinePct: 96, offline: false },
      { day: 'Thu 6', onlinePct: 88, offline: true },
      { day: 'Fri 7', onlinePct: 95, offline: false },
      { day: 'Sat 8', onlinePct: 97, offline: false },
      { day: 'Sun 9', onlinePct: 93, offline: true },
    ],
  },
  {
    id: 'up-studio',
    screenId: 'SCR-1044',
    screenName: 'Studio Mirror',
    location: 'Fitness First — Sharq',
    timezone: 'Asia/Kuwait',
    workingHours: '08:00–22:00',
    periodLabel: 'October 2026',
    expectedMinutes: 26040,
    onlineMinutes: 21400,
    offlineMinutes: 4200,
    unknownMinutes: 440,
    onlinePct: 82.2,
    telemetry: 'ok',
    statusNow: 'offline',
    adsScheduled: true,
    offlineDuringAds: true,
    daily: [
      { day: 'Mon 3', onlinePct: 80, offline: true },
      { day: 'Tue 4', onlinePct: 72, offline: true },
      { day: 'Wed 5', onlinePct: 85, offline: true },
      { day: 'Thu 6', onlinePct: 78, offline: true },
      { day: 'Fri 7', onlinePct: 90, offline: true },
      { day: 'Sat 8', onlinePct: 88, offline: true },
      { day: 'Sun 9', onlinePct: 70, offline: true },
    ],
  },
  {
    id: 'up-salmiya',
    screenId: 'SCR-1101',
    screenName: 'Reception',
    location: 'Fitness First — Salmiya',
    timezone: 'Asia/Kuwait',
    workingHours: 'Not set',
    periodLabel: 'October 2026',
    expectedMinutes: null,
    onlineMinutes: null,
    offlineMinutes: null,
    unknownMinutes: null,
    onlinePct: null,
    telemetry: 'missing',
    statusNow: 'online',
    adsScheduled: false,
    offlineDuringAds: false,
    daily: [],
  },
]

export function formatDurationMinutes(minutes) {
  if (minutes == null) return '—'
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  if (h === 0) return `${m}m`
  if (m === 0) return `${h}h`
  return `${h}h ${m}m`
}
