/** Mock campaigns for wireframe — fields driven by §4 list requirements. */

/**
 * Wireframe “today” for schedule / payout gating.
 * Payout status only applies to Paid campaigns whose main window has ended.
 */
export const WIREFRAME_TODAY = '2026-11-12'

export const CAMPAIGNS = [
  {
    id: 'cmp_01',
    name: 'Ramadan Retail Push',
    advertiser: 'Nike GCC',
    type: 'Paid',
    status: 'Ended',
    value: 12000,
    currency: 'USD',
    startDate: '2026-03-01',
    endDate: '2026-03-31',
    screens: 48,
    deliveryPct: 94.1,
    payoutStatus: 'Unpaid',
  },
  {
    id: 'cmp_02',
    name: 'Summer Coolers',
    advertiser: 'PepsiCo',
    type: 'Paid',
    status: 'Ended',
    value: 8500,
    currency: 'USD',
    startDate: '2026-06-01',
    endDate: '2026-06-30',
    screens: 32,
    deliveryPct: 97.4,
    payoutStatus: 'Unpaid',
  },
  {
    id: 'cmp_03',
    name: 'Host Welcome Pack',
    advertiser: 'Ad Space',
    type: 'Admin',
    status: 'Live',
    value: null,
    currency: null,
    startDate: '2026-01-01',
    endDate: '2026-12-31',
    screens: 120,
    deliveryPct: null,
    payoutStatus: null,
  },
  {
    id: 'cmp_04',
    name: 'Café Awareness Week',
    advertiser: 'Local Roast Co.',
    type: 'Free',
    status: 'Ended',
    value: null,
    currency: null,
    startDate: '2026-04-10',
    endDate: '2026-04-17',
    screens: 14,
    deliveryPct: null,
    payoutStatus: null,
  },
  {
    id: 'cmp_05',
    name: 'Bank Launch — Kuwait',
    advertiser: 'NBK',
    type: 'Paid',
    status: 'Ended',
    value: 22000,
    currency: 'USD',
    startDate: '2026-01-15',
    endDate: '2026-02-15',
    screens: 60,
    deliveryPct: 99.1,
    payoutStatus: 'Paid',
  },
  {
    id: 'cmp_06',
    name: 'Fitness Q2 Promo',
    advertiser: 'Nike GCC',
    type: 'Paid',
    status: 'Draft',
    value: 5000,
    currency: 'USD',
    startDate: '2026-05-01',
    endDate: '2026-05-31',
    screens: 0,
    deliveryPct: null,
    payoutStatus: null,
  },
  {
    id: 'cmp_07',
    name: 'Mall Wayfinding Ads',
    advertiser: 'The Avenues',
    type: 'Free',
    status: 'Scheduled',
    value: null,
    currency: null,
    startDate: '2026-12-01',
    endDate: '2026-12-14',
    screens: 22,
    deliveryPct: null,
    payoutStatus: null,
  },
  {
    id: 'cmp_08',
    name: 'Platform House Ads',
    advertiser: 'Ad Space',
    type: 'Admin',
    status: 'Draft',
    value: null,
    currency: null,
    startDate: null,
    endDate: null,
    screens: 0,
    deliveryPct: null,
    payoutStatus: null,
  },
  {
    id: 'cmp_09',
    name: 'Winter Fitness Push',
    advertiser: 'Nike GCC',
    type: 'Paid',
    status: 'Live',
    value: 9800,
    currency: 'USD',
    startDate: '2026-11-01',
    endDate: '2026-11-30',
    screens: 36,
    deliveryPct: 91.2,
    payoutStatus: null,
  },
  {
    id: 'cmp_10',
    name: 'NBK Branch Soft Launch',
    advertiser: 'NBK',
    type: 'Paid',
    status: 'Scheduled',
    value: 15000,
    currency: 'USD',
    startDate: '2026-12-05',
    endDate: '2026-12-20',
    screens: 28,
    deliveryPct: null,
    payoutStatus: null,
  },
]

export const CAMPAIGN_TYPES = ['Paid', 'Free', 'Admin']
export const CAMPAIGN_STATUSES = ['Draft', 'Scheduled', 'Live', 'Ended']

/** Screens with online % below this may have payout amount edited. */
export const ONLINE_EDIT_THRESHOLD_PCT = 95

/**
 * Payout column only for Paid campaigns whose main time window has ended.
 * Returns 'Paid' | 'Unpaid' | null (null = column shows —).
 */
export function campaignPayoutLabel(campaign, todayIso = WIREFRAME_TODAY) {
  if (!campaign || campaign.type !== 'Paid') return null
  if (campaign.status === 'Draft') return null
  if (!campaign.endDate) return null
  const windowEnded =
    campaign.status === 'Ended' || campaign.endDate < todayIso
  if (!windowEnded) return null
  return campaign.payoutStatus === 'Paid' ? 'Paid' : 'Unpaid'
}
