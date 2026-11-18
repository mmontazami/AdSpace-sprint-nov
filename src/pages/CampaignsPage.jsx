import { useMemo, useState } from 'react'
import {
  CAMPAIGNS,
  CAMPAIGN_TYPES,
  CAMPAIGN_STATUSES,
  campaignPayoutLabel,
} from '../data/campaigns'
import './CampaignsPage.css'

const SORT_OPTIONS = [
  { value: 'payout-unpaid', label: 'Payout (Unpaid first)' },
  { value: 'payout-paid', label: 'Payout (Paid first)' },
  { value: 'name-asc', label: 'Name A–Z' },
  { value: 'name-desc', label: 'Name Z–A' },
  { value: 'advertiser-asc', label: 'Advertiser A–Z' },
  { value: 'advertiser-desc', label: 'Advertiser Z–A' },
  { value: 'start-desc', label: 'Start date (newest)' },
  { value: 'start-asc', label: 'Start date (oldest)' },
  { value: 'value-desc', label: 'Value (high → low)' },
  { value: 'value-asc', label: 'Value (low → high)' },
]

/** Rank for payout sort: Unpaid → Paid → not due / N/A */
function payoutSortRank(label, unpaidFirst) {
  if (label === 'Unpaid') return unpaidFirst ? 0 : 1
  if (label === 'Paid') return unpaidFirst ? 1 : 0
  return 2
}

function formatMoney(value, currency) {
  if (value == null) return '—'
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency || 'USD',
    maximumFractionDigits: 0,
  }).format(value)
}

function formatDate(iso) {
  if (!iso) return '—'
  return new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(iso))
}

function formatDelivery(campaign) {
  if (campaign.type !== 'Paid') return '—'
  if (campaign.status === 'Draft' || campaign.deliveryPct == null) return '—'
  return `${campaign.deliveryPct}%`
}

function compareCampaigns(a, b, sort) {
  const payoutA = campaignPayoutLabel(a)
  const payoutB = campaignPayoutLabel(b)

  switch (sort) {
    case 'payout-unpaid': {
      const d =
        payoutSortRank(payoutA, true) - payoutSortRank(payoutB, true)
      return d !== 0 ? d : a.name.localeCompare(b.name)
    }
    case 'payout-paid': {
      const d =
        payoutSortRank(payoutA, false) - payoutSortRank(payoutB, false)
      return d !== 0 ? d : a.name.localeCompare(b.name)
    }
    case 'name-desc':
      return b.name.localeCompare(a.name)
    case 'advertiser-asc':
      return a.advertiser.localeCompare(b.advertiser)
    case 'advertiser-desc':
      return b.advertiser.localeCompare(a.advertiser)
    case 'start-desc':
      return (b.startDate || '').localeCompare(a.startDate || '')
    case 'start-asc':
      return (a.startDate || '').localeCompare(b.startDate || '')
    case 'value-desc':
      return (b.value ?? -1) - (a.value ?? -1)
    case 'value-asc':
      return (
        (a.value ?? Number.MAX_SAFE_INTEGER) -
        (b.value ?? Number.MAX_SAFE_INTEGER)
      )
    case 'name-asc':
    default:
      return a.name.localeCompare(b.name)
  }
}

function matchesPayoutFilter(campaign, payoutFilter) {
  const label = campaignPayoutLabel(campaign)
  if (payoutFilter === 'all') return true
  if (payoutFilter === 'unpaid') return label === 'Unpaid'
  if (payoutFilter === 'paid') return label === 'Paid'
  if (payoutFilter === 'not-due') return label == null
  return true
}

export default function CampaignsPage({ onNewCampaign, onOpenCampaign }) {
  const [query, setQuery] = useState('')
  const [advertiser, setAdvertiser] = useState('all')
  const [type, setType] = useState('all')
  const [status, setStatus] = useState('all')
  const [payoutFilter, setPayoutFilter] = useState('all')
  const [sort, setSort] = useState('payout-unpaid')

  const advertisers = useMemo(() => {
    const counts = new Map()
    for (const c of CAMPAIGNS) {
      counts.set(c.advertiser, (counts.get(c.advertiser) || 0) + 1)
    }
    return [...counts.entries()]
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => a.name.localeCompare(b.name))
  }, [])

  const payoutCounts = useMemo(() => {
    let unpaid = 0
    let paid = 0
    let notDue = 0
    for (const c of CAMPAIGNS) {
      const label = campaignPayoutLabel(c)
      if (label === 'Unpaid') unpaid += 1
      else if (label === 'Paid') paid += 1
      else notDue += 1
    }
    return { unpaid, paid, notDue, all: CAMPAIGNS.length }
  }, [])

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase()

    return CAMPAIGNS.filter((c) => {
      if (advertiser !== 'all' && c.advertiser !== advertiser) return false
      if (type !== 'all' && c.type !== type) return false
      if (status !== 'all' && c.status !== status) return false
      if (!matchesPayoutFilter(c, payoutFilter)) return false
      if (!q) return true
      const payout = campaignPayoutLabel(c)
      return (
        c.name.toLowerCase().includes(q) ||
        c.advertiser.toLowerCase().includes(q) ||
        c.type.toLowerCase().includes(q) ||
        c.status.toLowerCase().includes(q) ||
        (payout && payout.toLowerCase().includes(q))
      )
    }).sort((a, b) => compareCampaigns(a, b, sort))
  }, [query, advertiser, type, status, payoutFilter, sort])

  const payoutSortActive =
    sort === 'payout-unpaid' || sort === 'payout-paid'

  function togglePayoutColumnSort() {
    setSort((prev) =>
      prev === 'payout-unpaid' ? 'payout-paid' : 'payout-unpaid',
    )
  }

  function clearPayoutFilter() {
    setPayoutFilter('all')
  }

  function clearAdvertiserFilter() {
    setAdvertiser('all')
  }

  const payoutChips = [
    {
      id: 'all',
      label: 'All',
      count: payoutCounts.all,
      hint: 'Every campaign',
    },
    {
      id: 'unpaid',
      label: 'Unpaid',
      count: payoutCounts.unpaid,
      hint: 'Ended Paid campaigns still owed',
      tone: 'unpaid',
    },
    {
      id: 'paid',
      label: 'Paid',
      count: payoutCounts.paid,
      hint: 'Ended Paid campaigns already paid out',
      tone: 'paid',
    },
    {
      id: 'not-due',
      label: 'Not due yet',
      count: payoutCounts.notDue,
      hint: 'Window still open, or Free / Admin / Draft',
      tone: 'na',
    },
  ]

  return (
    <div className="campaigns-page">
      <header className="campaigns-header">
        <div>
          <h1>Campaigns</h1>
          <p className="campaigns-subtitle">
            Advertiser → Campaign inventory. Payout applies only after a Paid
            campaign’s main time window ends.
          </p>
        </div>
        <button type="button" className="btn-primary" onClick={onNewCampaign}>
          + New campaign
        </button>
      </header>

      <section
        className={`campaigns-advertiser-bar ${
          advertiser !== 'all' ? 'is-active' : ''
        }`}
        aria-label="Filter by advertiser"
      >
        <div className="campaigns-advertiser-bar-copy">
          <p className="campaigns-advertiser-label">Advertiser</p>
          <p className="campaigns-advertiser-hint">
            Primary way to scope the list — pick who the campaigns belong to.
          </p>
        </div>
        <div className="campaigns-advertiser-controls">
          <label className="campaigns-advertiser-field">
            <select
              aria-label="Advertiser"
              value={advertiser}
              onChange={(e) => setAdvertiser(e.target.value)}
            >
              <option value="all">All advertisers · {CAMPAIGNS.length}</option>
              {advertisers.map((row) => (
                <option key={row.name} value={row.name}>
                  {row.name} · {row.count}
                </option>
              ))}
            </select>
          </label>
          {advertiser !== 'all' && (
            <button
              type="button"
              className="campaigns-advertiser-clear"
              onClick={clearAdvertiserFilter}
            >
              Clear
            </button>
          )}
        </div>
      </section>

      <section
        className="campaigns-payout-bar"
        aria-label="Filter by payout status"
      >
        <div className="campaigns-payout-bar-head">
          <div>
            <p className="campaigns-payout-label">Payout</p>
            <p className="campaigns-payout-hint">
              Filter ended Paid campaigns by whether hosts have been paid.
            </p>
          </div>
          {payoutFilter !== 'all' && (
            <button
              type="button"
              className="campaigns-payout-clear"
              onClick={clearPayoutFilter}
            >
              Clear payout filter
            </button>
          )}
        </div>
        <div className="campaigns-payout-chips" role="group">
          {payoutChips.map((chip) => {
            const active = payoutFilter === chip.id
            return (
              <button
                key={chip.id}
                type="button"
                className={`payout-chip ${chip.tone || ''} ${active ? 'active' : ''}`}
                aria-pressed={active}
                title={chip.hint}
                onClick={() => setPayoutFilter(chip.id)}
              >
                <span className="payout-chip-label">{chip.label}</span>
                <span className="payout-chip-count">{chip.count}</span>
              </button>
            )
          })}
        </div>
      </section>

      <section className="campaigns-toolbar" aria-label="Campaign filters">
        <label className="field grow">
          <span>Search</span>
          <input
            type="search"
            placeholder="Search by name, advertiser, type, status, payout…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </label>

        <label className="field">
          <span>Type</span>
          <select value={type} onChange={(e) => setType(e.target.value)}>
            <option value="all">All types</option>
            {CAMPAIGN_TYPES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </label>

        <label className="field">
          <span>Status</span>
          <select value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="all">All statuses</option>
            {CAMPAIGN_STATUSES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </label>

        <label className={`field ${payoutSortActive ? 'field-emphasis' : ''}`}>
          <span>Sort</span>
          <select value={sort} onChange={(e) => setSort(e.target.value)}>
            {SORT_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </label>
      </section>

      <p className="campaigns-count">
        Showing <strong>{visible.length}</strong> of {CAMPAIGNS.length} campaigns
        {advertiser !== 'all' && (
          <>
            {' '}
            · advertiser: <strong className="count-advertiser">{advertiser}</strong>
          </>
        )}
        {payoutFilter !== 'all' && (
          <>
            {' '}
            · payout:{' '}
            <strong className={`count-payout-${payoutFilter}`}>
              {payoutChips.find((c) => c.id === payoutFilter)?.label}
            </strong>
          </>
        )}
      </p>

      <div className="table-wrap">
        <table className="campaigns-table">
          <thead>
            <tr>
              <th>Campaign</th>
              <th>Advertiser</th>
              <th>Type</th>
              <th>Status</th>
              <th
                className={`th-sortable th-payout ${payoutSortActive ? 'is-sorted' : ''}`}
                aria-sort={
                  sort === 'payout-unpaid'
                    ? 'ascending'
                    : sort === 'payout-paid'
                      ? 'descending'
                      : 'none'
                }
              >
                <button
                  type="button"
                  className="th-sort-btn"
                  onClick={(e) => {
                    e.stopPropagation()
                    togglePayoutColumnSort()
                  }}
                  title="Sort by payout status"
                >
                  Payout
                  <span className="th-sort-icon" aria-hidden="true">
                    {sort === 'payout-unpaid'
                      ? '↑ Unpaid'
                      : sort === 'payout-paid'
                        ? '↑ Paid'
                        : '↕'}
                  </span>
                </button>
              </th>
              <th>Value</th>
              <th>Schedule</th>
              <th>Screens</th>
              <th>Delivery</th>
            </tr>
          </thead>
          <tbody>
            {visible.length === 0 ? (
              <tr>
                <td colSpan={9} className="empty-cell">
                  No campaigns match these filters.
                  {payoutFilter !== 'all' && (
                    <>
                      {' '}
                      <button
                        type="button"
                        className="linkish-inline"
                        onClick={clearPayoutFilter}
                      >
                        Clear payout filter
                      </button>
                    </>
                  )}
                </td>
              </tr>
            ) : (
              visible.map((c) => {
                const payout = campaignPayoutLabel(c)
                return (
                  <tr
                    key={c.id}
                    className={`campaign-row ${payout === 'Unpaid' ? 'row-unpaid' : ''}`}
                    tabIndex={0}
                    role="link"
                    aria-label={`Open sample detail for ${c.name}`}
                    onClick={() => onOpenCampaign?.(c)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault()
                        onOpenCampaign?.(c)
                      }
                    }}
                  >
                    <td>
                      <span className="campaign-name">{c.name}</span>
                    </td>
                    <td>{c.advertiser}</td>
                    <td>
                      <span className={`badge type-${c.type.toLowerCase()}`}>
                        {c.type}
                      </span>
                    </td>
                    <td>
                      <span
                        className={`badge status-${c.status.toLowerCase()}`}
                      >
                        {c.status}
                      </span>
                    </td>
                    <td>
                      {payout == null ? (
                        <span className="payout-na" title="Not due yet">
                          Not due
                        </span>
                      ) : (
                        <span
                          className={`badge payout-${payout.toLowerCase()}`}
                        >
                          {payout}
                        </span>
                      )}
                    </td>
                    <td className="mono">
                      {formatMoney(c.value, c.currency)}
                    </td>
                    <td className="schedule">
                      {formatDate(c.startDate)} → {formatDate(c.endDate)}
                    </td>
                    <td className="mono">{c.screens || '—'}</td>
                    <td className="mono">{formatDelivery(c)}</td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
