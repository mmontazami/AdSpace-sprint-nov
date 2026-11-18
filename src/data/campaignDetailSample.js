/**
 * Shared campaign detail sample for the wireframe.
 * Every list row opens this same filled example — including a full builder draft
 * so Info / Screens / Creatives / Revenue can be edited like at creation time.
 * Play delivery: guaranteed min plays vs actual / missed / extra (dense loops).
 * PoP: admin toggle per distinct media × screen (combined into Delivery tab).
 */

import {
  anyContentKey,
  createContentStub,
  createEmptyLoop,
} from './creativeContent'
import { SLOT_SEC } from './loopModes'
import { MEDIA_LIBRARY, mediaToSlotItem } from './mediaLibrary'

const DAYS = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat']

const HERO_SCREENS = [
  'SCR-1042',
  'SCR-1043',
  'SCR-1045',
  'SCR-5502',
  'SCR-5503',
  'SCR-A101',
  'SCR-A104',
  'SCR-B201',
  'SCR-E701',
  'SCR-E702',
  'SCR-D501',
  'SCR-D503',
  'SCR-C402',
  'SCR-8803',
]

/** Includes SCR-5502 so one screen hosts both creatives (PoP per creative media). */
const GYM_SCREENS = [
  'SCR-3301',
  'SCR-3304',
  'SCR-3305',
  'SCR-5501',
  'SCR-5502',
  'SCR-5504',
  'SCR-2102',
  'SCR-A102',
  'SCR-B202',
  'SCR-B302',
  'SCR-C303',
  'SCR-C401',
  'SCR-D502',
  'SCR-D505',
  'SCR-8802',
  'SCR-8804',
]

function hoursFromRange(hourStart, hourEnd) {
  const start = Number(hourStart) || 0
  const end = Number(hourEnd) || 24
  const hours = []
  for (let h = start; h < end; h += 1) hours.push(h)
  return hours
}

/** Place distinct media into slots; multi-slot media advances by ceil(duration/10). */
function seedContentWithMediaIds(orientation, creativeName, slotCount, mediaIds) {
  if (!orientation) return {}
  const key = anyContentKey(orientation)
  const loop = createEmptyLoop(slotCount)
  let index = 0
  for (const mediaId of mediaIds || []) {
    if (index >= slotCount) break
    const media = MEDIA_LIBRARY.find((m) => m.id === mediaId)
    if (!media) continue
    loop.slots[index] = mediaToSlotItem(media)
    const span = Math.max(
      1,
      Math.ceil((Number(media.duration) || SLOT_SEC) / SLOT_SEC),
    )
    index += span
  }
  return {
    [key]: createContentStub({
      key,
      creativeName,
      slotCount,
      loops: [loop],
    }),
  }
}

function makeCreative({
  id,
  name,
  selectedScreenIds,
  startDate,
  endDate,
  hourStart,
  hourEnd,
  days,
  allDays,
  slots,
  orientation = 'Landscape',
  targetAspectRatio = 'any',
  mediaIds = [],
}) {
  const hours = hoursFromRange(hourStart, hourEnd)
  return {
    id,
    name,
    patternType: 'weekly',
    repeatUnit: 'week',
    startDate,
    endDate,
    repeatEveryWeeks: 1,
    allDays,
    days: allDays ? [...DAYS] : days,
    monthDays: startDate
      ? [Number(String(startDate).split('-')[2]) || 1]
      : [1],
    endMode: 'date',
    runDays: 4,
    hours,
    hourStart,
    hourEnd,
    orientation,
    targetAspectRatio,
    selectedScreenIds: [...selectedScreenIds],
    contentByKey: seedContentWithMediaIds(
      orientation,
      name,
      slots,
      mediaIds,
    ),
  }
}

/** Full editable draft — same shape as Campaign Builder. */
export function createSampleBuilderDraft() {
  const slots = 6
  const hero = makeCreative({
    id: 'cr_sample_hero',
    name: 'Hero — malls',
    selectedScreenIds: HERO_SCREENS,
    startDate: '2026-03-01',
    endDate: '2026-03-31',
    hourStart: 10,
    hourEnd: 22,
    allDays: true,
    days: DAYS,
    slots,
    orientation: 'Landscape',
    // city 15s → 2 slots, food 10s → 1, square 10s → 1
    mediaIds: ['med_city', 'med_food', 'med_square'],
  })
  const gym = makeCreative({
    id: 'cr_sample_gym',
    name: 'Gym cutdown',
    selectedScreenIds: GYM_SCREENS,
    startDate: '2026-03-08',
    endDate: '2026-03-31',
    hourStart: 16,
    hourEnd: 21,
    allDays: false,
    days: ['fri', 'sat'],
    slots,
    orientation: 'Portrait',
    // fit 20s → 2, galalogo 10s → 1, ikea ~10s → 1
    mediaIds: ['med_fit', 'med_galalogo', 'med_ikea'],
  })

  return {
    name: 'Ramadan Retail Push',
    advertiser: 'Nike GCC',
    type: 'Paid',
    value: '12000',
    currency: 'USD',
    slots,
    startDate: '2026-03-01',
    endDate: '2026-03-31',
    hourStart: 10,
    hourEnd: 22,
    selectedScreenIds: [...HERO_SCREENS, ...GYM_SCREENS],
    creatives: [hero, gym],
    revenue: {
      referringCompanyIds: ['co_oasis'],
      screenPrices: {
        'SCR-1042': 280,
        'SCR-2101': 260,
      },
    },
  }
}

export const CAMPAIGN_DETAIL_SAMPLE = {
  id: 'cmp_sample',
  status: 'Ended',
  country: 'Kuwait',
  kpis: [
    { label: 'Advertiser paid', value: '$12,000', sub: 'Campaign total' },
    { label: 'Companies earn', value: '$8,140', sub: 'After share / referrals' },
    {
      label: 'Play delivery',
      value: 'See tab',
      sub: 'Guaranteed · actual · missed · extra',
    },
    {
      label: 'Online (scheduled)',
      value: '96.0%',
      sub: 'From play shortfall, not dense extras',
    },
    { label: 'Uptime', value: '96.4%', sub: 'In opening hours' },
  ],
  payables: [
    {
      id: 'dpay_1',
      company: 'Inspire Media',
      share: '70%',
      screens: 3,
      allocated: 540,
      earnings: 378,
      delivery: '93.6%',
      deliveryMeta: '664.6h / 710h · from play shortfall',
      status: 'Unpaid',
    },
    {
      id: 'dpay_2',
      company: 'Avenues Ops',
      share: '65%',
      screens: 3,
      allocated: 820,
      earnings: 533,
      delivery: '98.9%',
      deliveryMeta: '858.4h / 868h · from play shortfall',
      status: 'Unpaid',
    },
    {
      id: 'dpay_3',
      company: 'Oasis Digital',
      share: 'Referring 100%',
      screens: 2,
      allocated: 470,
      earnings: 470,
      delivery: '94.3%',
      deliveryMeta: '467.5h / 496h · from play shortfall',
      status: 'Paid',
    },
  ],
  metrics: [
    {
      location: 'Fitness First — Sharq',
      screens: 3,
      playsPerDay: 144,
      uptime: '99.2%',
      visitors: 'Est. 1.2k/day',
    },
    {
      location: 'The Avenues — Zone A',
      screens: 2,
      playsPerDay: 320,
      uptime: '93.6%',
      visitors: 'Est. 8.4k/day',
    },
    {
      location: 'Dubai Marina Gym',
      screens: 1,
      playsPerDay: 168,
      uptime: '88.1%',
      visitors: 'Est. 3.1k/day',
    },
    {
      location: 'Salmiya Café Row',
      screens: 2,
      playsPerDay: 200,
      uptime: '97.8%',
      visitors: 'Est. 2.0k/day',
    },
  ],
  /**
   * Finance tab: company → location → screen.
   * Online % = (guaranteed plays − missed) / guaranteed — synced from play delivery.
   * Dense-loop extras do not inflate Online %. Editable when onlinePct < 95.
   */
  financeScreens: [
    {
      id: 'cd_fs_1042',
      screenId: 'SCR-1042',
      name: 'Lobby LED',
      location: 'Fitness First — Sharq',
      company: 'Inspire Media',
      share: '70%',
      sharePct: 70,
      originalAllocated: 280,
      allocated: 280,
      earnings: 196,
      expectedH: 310,
      actualH: 308.1,
      onlinePct: 99.4,
      payment: 'Unpaid',
    },
    {
      id: 'cd_fs_1043',
      screenId: 'SCR-1043',
      name: 'Cardio Wall',
      location: 'Fitness First — Sharq',
      company: 'Inspire Media',
      share: '70%',
      sharePct: 70,
      originalAllocated: 260,
      allocated: 260,
      earnings: 182,
      expectedH: 310,
      actualH: 279,
      onlinePct: 90.0,
      payment: 'Unpaid',
    },
    {
      id: 'cd_fs_4401',
      screenId: 'SCR-4401',
      name: 'Reception Strip',
      location: 'Fitness First — Sharq',
      company: 'Inspire Media',
      share: '70%',
      sharePct: 70,
      originalAllocated: 200,
      allocated: 200,
      earnings: 140,
      expectedH: 90,
      actualH: 77.5,
      onlinePct: 86.1,
      payment: 'Unpaid',
    },
    {
      id: 'cd_fs_2101',
      screenId: 'SCR-2101',
      name: 'Atrium Banner',
      location: 'The Avenues — Zone A',
      company: 'Avenues Ops',
      share: '65%',
      sharePct: 65,
      originalAllocated: 300,
      allocated: 300,
      earnings: 195,
      expectedH: 310,
      actualH: 309.4,
      onlinePct: 99.8,
      payment: 'Unpaid',
    },
    {
      id: 'cd_fs_2102',
      screenId: 'SCR-2102',
      name: 'Food Court A',
      location: 'The Avenues — Zone A',
      company: 'Avenues Ops',
      share: '65%',
      sharePct: 65,
      originalAllocated: 280,
      allocated: 280,
      earnings: 182,
      expectedH: 310,
      actualH: 301,
      onlinePct: 97.1,
      payment: 'Unpaid',
    },
    {
      id: 'cd_fs_6601',
      screenId: 'SCR-6601',
      name: 'Marina Lobby',
      location: 'Dubai Marina Gym',
      company: 'Avenues Ops',
      share: '65%',
      sharePct: 65,
      originalAllocated: 240,
      allocated: 240,
      earnings: 156,
      expectedH: 248,
      actualH: 248,
      onlinePct: 100,
      payment: 'Unpaid',
    },
    {
      id: 'cd_fs_5501',
      screenId: 'SCR-5501',
      name: 'Entrance Portrait',
      location: 'Salmiya Café Row',
      company: 'Oasis Digital',
      share: 'Referring 100%',
      sharePct: 100,
      originalAllocated: 250,
      allocated: 250,
      earnings: 250,
      expectedH: 248,
      actualH: 247.5,
      onlinePct: 99.8,
      payment: 'Paid',
      paymentRecord: {
        paidAt: '2026-11-08T11:20',
        method: 'bank_transfer',
        reference: 'NBK-884291',
        notes: 'Transfer completed same day',
        receiptName: 'oasis-transfer-slip.jpg',
      },
    },
    {
      id: 'cd_fs_5502',
      screenId: 'SCR-5502',
      name: 'Counter Strip',
      location: 'Salmiya Café Row',
      company: 'Oasis Digital',
      share: 'Referring 100%',
      sharePct: 100,
      originalAllocated: 220,
      allocated: 220,
      earnings: 220,
      expectedH: 248,
      actualH: 220,
      onlinePct: 88.7,
      payment: 'Paid',
      paymentRecord: {
        paidAt: '2026-11-08T11:20',
        method: 'bank_transfer',
        reference: 'NBK-884291',
        notes: 'Transfer completed same day',
        receiptName: 'oasis-transfer-slip.jpg',
      },
    },
  ],
}
