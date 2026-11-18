import { CAMPAIGNS } from './campaigns'
import { money } from './revenueAllocation'

/**
 * Advertisers for Admin list / detail and Campaign Builder combobox reuse.
 */

export const ADVERTISERS = [
  {
    id: 'adv_nike',
    name: 'Nike GCC',
    contactName: 'Sara Al-Harbi',
    contactEmail: 'sara@nike-gcc.example',
    country: 'AE',
    notes: 'Retail + mall campaigns across GCC.',
    status: 'Active',
  },
  {
    id: 'adv_pepsi',
    name: 'PepsiCo',
    contactName: 'Omar Faris',
    contactEmail: 'omar@pepsico.example',
    country: 'KW',
    notes: 'Seasonal beverage pushes.',
    status: 'Active',
  },
  {
    id: 'adv_nbk',
    name: 'NBK',
    contactName: 'Lina Hajji',
    contactEmail: 'lina@nbk.example',
    country: 'KW',
    notes: 'Branch and soft-launch bookings.',
    status: 'Active',
  },
  {
    id: 'adv_roast',
    name: 'Local Roast Co.',
    contactName: 'Maya Nasser',
    contactEmail: 'maya@localroast.example',
    country: 'KW',
    notes: 'Free / awareness weeks.',
    status: 'Active',
  },
  {
    id: 'adv_avenues',
    name: 'The Avenues',
    contactName: 'Khaled Mansour',
    contactEmail: 'khaled@avenues.example',
    country: 'KW',
    notes: 'Mall wayfinding and house promos.',
    status: 'Active',
  },
  {
    id: 'adv_adspace',
    name: 'Ad Space',
    contactName: 'Platform Ops',
    contactEmail: 'ops@adspace.example',
    country: 'KW',
    notes: 'Admin / house campaigns.',
    status: 'Active',
  },
]

export function advertiserNames(list = ADVERTISERS) {
  return list.map((a) => (typeof a === 'string' ? a : a.name))
}

export function normalizeAdvertiserList(list) {
  return (list || []).map((a, index) => {
    if (typeof a === 'string') {
      return {
        id: `adv_${index}_${a.toLowerCase().replace(/\s+/g, '_')}`,
        name: a,
        contactName: '',
        contactEmail: '',
        country: '',
        notes: '',
        status: 'Active',
      }
    }
    return a
  })
}

export function findAdvertiserByName(list, name) {
  const needle = String(name || '')
    .trim()
    .toLowerCase()
  if (!needle) return null
  return (
    normalizeAdvertiserList(list).find(
      (a) => a.name.toLowerCase() === needle,
    ) || null
  )
}

export function campaignsForAdvertiser(advertiserName, campaigns = CAMPAIGNS) {
  const needle = String(advertiserName || '')
    .trim()
    .toLowerCase()
  if (!needle) return []
  return campaigns
    .filter((c) => (c.advertiser || '').toLowerCase() === needle)
    .sort((a, b) => (b.startDate || '').localeCompare(a.startDate || ''))
}

export function advertiserSpendSummary(advertiserName, campaigns = CAMPAIGNS) {
  const rows = campaignsForAdvertiser(advertiserName, campaigns)
  const paid = rows.filter((c) => c.type === 'Paid' && Number(c.value) > 0)
  const totalSpend = paid.reduce((sum, c) => sum + (Number(c.value) || 0), 0)
  const currency = paid[0]?.currency || 'USD'
  return {
    campaignCount: rows.length,
    paidCount: paid.length,
    liveCount: rows.filter((c) => c.status === 'Live').length,
    totalSpend,
    currency,
    totalSpendLabel: money(totalSpend, currency),
  }
}

export function createAdvertiser(name, partial = {}) {
  const trimmed = String(name || '').trim()
  return {
    id: `adv_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    name: trimmed,
    contactName: '',
    contactEmail: '',
    country: '',
    notes: '',
    status: 'Active',
    ...partial,
    name: trimmed || partial.name || 'Untitled advertiser',
  }
}

export function advertiserInitials(name) {
  const parts = String(name || '')
    .trim()
    .split(/\s+/)
    .filter(Boolean)
  if (parts.length === 0) return '?'
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return `${parts[0][0]}${parts[1][0]}`.toUpperCase()
}
