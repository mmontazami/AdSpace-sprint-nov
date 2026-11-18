import { useEffect, useMemo, useState } from 'react'
import {
  ADVERTISERS,
  createAdvertiser,
  normalizeAdvertiserList,
} from '../data/advertisers'
import {
  CAMPAIGN_DETAIL_SAMPLE,
  createSampleBuilderDraft,
} from '../data/campaignDetailSample'
import { seedPopVerifiedMap } from '../data/campaignProofOfPlay'
import { ONLINE_EDIT_THRESHOLD_PCT } from '../data/campaigns'
import { syncFinanceScreensWithPlayDelivery } from '../data/playDelivery'
import StepCampaignInfo from './builder/StepCampaignInfo'
import StepChooseLocation from './builder/StepChooseLocation'
import StepCreatives from './builder/StepCreatives'
import StepRevenue from './builder/StepRevenue'
import CampaignPopPanel from './CampaignPopPanel'
import CampaignFinancePanel from './CampaignFinancePanel'
import './builder/CampaignBuilder.css'
import './CampaignDetailPage.css'

function buildInvoiceAdjustments(screens) {
  return screens
    .filter((r) => {
      const original = r.originalAllocated ?? r.allocated ?? 0
      return (r.allocated || 0) < original
    })
    .map((r) => {
      const originalAllocated = r.originalAllocated ?? r.allocated
      return {
        screenId: r.screenId,
        name: r.name,
        company: r.company,
        location: r.location,
        onlinePct: r.onlinePct,
        originalAllocated,
        allocated: r.allocated,
        delta: originalAllocated - (r.allocated || 0),
      }
    })
}

function buildInvoiceStats(screens) {
  const original = screens.reduce(
    (s, r) => s + (r.originalAllocated ?? r.allocated ?? 0),
    0,
  )
  const allocated = screens.reduce((s, r) => s + (r.allocated || 0), 0)
  return {
    original,
    allocated,
    withheld: original - allocated,
  }
}

function money(n, currency = 'USD') {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(n)
}

function formatDate(iso) {
  if (!iso) return '—'
  return new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(iso))
}

function payClass(status) {
  if (status === 'Paid') return 'ok'
  if (status === 'Ready to pay' || status === 'Unpaid') return 'ready'
  if (status === 'Low delivery') return 'warn'
  if (status === 'On hold') return 'hold'
  return ''
}

const EDIT_TABS = [
  { id: 'overview', label: 'Overview' },
  { id: 'setup', label: 'Campaign info' },
  { id: 'screens', label: 'Choose screens' },
  { id: 'creatives', label: 'Creatives' },
  { id: 'revenue', label: 'Revenue', paidOnly: true },
  { id: 'finance', label: 'Finance', paidOnly: true },
  { id: 'delivery', label: 'Delivery & PoP', paidOnly: true },
]

function pruneCreativesToScreens(creatives, screenIds) {
  const allowed = new Set(screenIds || [])
  return (creatives || []).map((c) => ({
    ...c,
    selectedScreenIds: (c.selectedScreenIds || []).filter((id) =>
      allowed.has(id),
    ),
  }))
}

/**
 * Wireframe: one shared filled sample opened from any campaigns-list row.
 * Finance: company → location → screen; Mark as Paid on company only.
 */
export default function CampaignDetailPage({
  onBack,
  backLabel = '← Campaigns',
  initialTab = 'overview',
  focusAnchor = null,
  onFocusConsumed,
  onOpenQuestion,
  advertisers: advertisersProp,
  onChangeAdvertisers,
}) {
  const sample = CAMPAIGN_DETAIL_SAMPLE
  const [draft, setDraft] = useState(() => createSampleBuilderDraft())
  const [localAdvertisers, setLocalAdvertisers] = useState(() =>
    normalizeAdvertiserList(ADVERTISERS),
  )
  const advertisers = advertisersProp
    ? normalizeAdvertiserList(advertisersProp)
    : localAdvertisers
  function setAdvertisers(next) {
    if (onChangeAdvertisers) onChangeAdvertisers(next)
    else setLocalAdvertisers(next)
  }
  const [tab, setTab] = useState(initialTab)
  const [overviewSub, setOverviewSub] = useState('payables')
  const [savedFlash, setSavedFlash] = useState(false)
  const [financeScreens, setFinanceScreens] = useState(() =>
    syncFinanceScreensWithPlayDelivery(
      sample.financeScreens || [],
      createSampleBuilderDraft(),
    ),
  )
  const [popVerified, setPopVerified] = useState(() =>
    seedPopVerifiedMap(createSampleBuilderDraft()),
  )

  const invoiceAdjustments = useMemo(
    () => buildInvoiceAdjustments(financeScreens),
    [financeScreens],
  )
  const invoiceStats = useMemo(
    () => buildInvoiceStats(financeScreens),
    [financeScreens],
  )

  const visibleTabs = useMemo(
    () => EDIT_TABS.filter((t) => !(t.paidOnly && draft.type !== 'Paid')),
    [draft.type],
  )

  useEffect(() => {
    setTab(initialTab)
  }, [initialTab])

  useEffect(() => {
    if (!visibleTabs.some((t) => t.id === tab)) setTab('overview')
  }, [visibleTabs, tab])

  function patchDraft(partial) {
    setDraft((prev) => {
      const next = { ...prev, ...partial }
      if (partial.selectedScreenIds) {
        next.creatives = pruneCreativesToScreens(
          next.creatives,
          partial.selectedScreenIds,
        )
      }
      return next
    })
  }

  function handleAdvertiserCommit(name) {
    const trimmed = name.trim()
    if (!trimmed) return
    patchDraft({ advertiser: trimmed })
    setAdvertisers((prev) => {
      const list = normalizeAdvertiserList(prev)
      if (list.some((a) => a.name.toLowerCase() === trimmed.toLowerCase())) {
        return list
      }
      return [...list, createAdvertiser(trimmed)].sort((a, b) =>
        a.name.localeCompare(b.name),
      )
    })
  }

  function saveCampaign() {
    setSavedFlash(true)
    window.setTimeout(() => setSavedFlash(false), 1600)
  }

  const screenCount = useMemo(() => {
    if (draft.selectedScreenIds?.length) return draft.selectedScreenIds.length
    const ids = new Set()
    for (const creative of draft.creatives || []) {
      for (const id of creative.selectedScreenIds || []) ids.add(id)
    }
    return ids.size
  }, [draft.selectedScreenIds, draft.creatives])

  const currency = draft.currency || 'USD'

  return (
    <div className="campaign-detail">
      <header className="cd-top">
        <button type="button" className="linkish" onClick={onBack}>
          {backLabel}
        </button>
        <div className="cd-top-actions">
          {savedFlash && <span className="cd-saved">Saved</span>}
          <button type="button" className="btn-ghost">
            Export Excel
          </button>
          <button type="button" className="btn-ghost">
            Swap creative
          </button>
          <button type="button" className="btn-primary" onClick={saveCampaign}>
            Save changes
          </button>
        </div>
      </header>

      <div className="cd-title-row">
        <div>
          <p className="cd-kicker">Campaign detail · editable sample</p>
          <h1>{draft.name || 'Untitled campaign'}</h1>
          <p className="cd-sub">
            {draft.advertiser || '—'} · {sample.country} · {draft.slots} slots ·{' '}
            {formatDate(draft.startDate)} → {formatDate(draft.endDate)} ·{' '}
            {draft.hourStart}:00–{draft.hourEnd}:00 · {screenCount} screens
          </p>
        </div>
        <div className="cd-badges">
          <span className={`badge type-${(draft.type || 'Paid').toLowerCase()}`}>
            {draft.type}
          </span>
          <span className={`badge status-${sample.status.toLowerCase()}`}>
            {sample.status}
          </span>
          {draft.type === 'Paid' && (
            <span className="cd-value">
              {money(Number(draft.value) || 0, currency)}
            </span>
          )}
        </div>
      </div>

      <p className="cd-sample-note">
        Edit Info, Screens, Creatives, and Revenue like creation. Delivery
        & PoP shows guaranteed min plays vs actual, plus admin Proof of Play
        toggles per media × screen. Finance payables are per company and stay
        gated until that company&apos;s PoP is complete; screens under{' '}
        {ONLINE_EDIT_THRESHOLD_PCT}% online can have payable decreased (shown
        on Revenue invoice).
      </p>

      <nav className="cd-edit-rail" aria-label="Campaign detail sections">
        {visibleTabs.map((t) => (
          <button
            key={t.id}
            type="button"
            className={`cd-rail-pill ${tab === t.id ? 'active' : ''}`}
            onClick={() => setTab(t.id)}
          >
            {t.label}
          </button>
        ))}
      </nav>

      {tab === 'overview' && (
        <>
          <div className="cd-kpis">
            {sample.kpis.map((k) => (
              <div key={k.label} className="cd-kpi">
                <em>{k.label}</em>
                <strong>{k.value}</strong>
                <span>{k.sub}</span>
              </div>
            ))}
          </div>

          <div className="cd-tabs" role="tablist" aria-label="Overview sections">
            {[
              { id: 'payables', label: 'Payables' },
              { id: 'metrics', label: 'Metrics' },
            ].map((t) => (
              <button
                key={t.id}
                type="button"
                role="tab"
                aria-selected={overviewSub === t.id}
                className={overviewSub === t.id ? 'active' : ''}
                onClick={() => setOverviewSub(t.id)}
              >
                {t.label}
              </button>
            ))}
          </div>

          {overviewSub === 'payables' && (
            <section className="cd-panel">
              <div className="cd-panel-head">
                <h2>Payables & statements</h2>
                <p>
                  Company earnings after share / referral. Open the Finance tab
                  to review screens and Mark as Paid per company.
                </p>
              </div>
              <div className="table-wrap">
                <table className="cd-table">
                  <thead>
                    <tr>
                      <th>Company</th>
                      <th>Share</th>
                      <th>Screens</th>
                      <th>Allocated</th>
                      <th>Earnings</th>
                      <th>Delivery</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sample.payables.map((row) => (
                      <tr key={row.id}>
                        <td>
                          <strong>{row.company}</strong>
                        </td>
                        <td>{row.share}</td>
                        <td className="mono">{row.screens}</td>
                        <td className="mono">{money(row.allocated)}</td>
                        <td className="mono">
                          <strong>{money(row.earnings)}</strong>
                        </td>
                        <td className="mono">
                          {row.delivery}
                          <span className="meta">{row.deliveryMeta}</span>
                        </td>
                        <td>
                          <span className={`cd-pill ${payClass(row.status)}`}>
                            {row.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          )}

          {overviewSub === 'metrics' && (
            <section className="cd-panel">
              <div className="cd-panel-head">
                <h2>Metrics</h2>
                <p>
                  Plays / day and uptime inside opening hours for locations on
                  this campaign.
                </p>
              </div>
              <div className="table-wrap">
                <table className="cd-table">
                  <thead>
                    <tr>
                      <th>Location</th>
                      <th>Screens</th>
                      <th>Plays / day</th>
                      <th>Uptime in hours</th>
                      <th>Daily visitors</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sample.metrics.map((row) => (
                      <tr key={row.location}>
                        <td>
                          <strong>{row.location}</strong>
                        </td>
                        <td className="mono">{row.screens}</td>
                        <td className="mono">{row.playsPerDay}</td>
                        <td className="mono">{row.uptime}</td>
                        <td>{row.visitors}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          )}
        </>
      )}

      {tab === 'setup' && (
        <section className="cd-edit-panel builder">
          <StepCampaignInfo
            draft={draft}
            advertisers={advertisers}
            onChange={patchDraft}
            onAdvertiserCommit={handleAdvertiserCommit}
          />
        </section>
      )}

      {tab === 'screens' && (
        <section className="cd-edit-panel builder">
          <StepChooseLocation draft={draft} onChange={patchDraft} />
        </section>
      )}

      {tab === 'creatives' && (
        <section className="cd-edit-panel builder">
          <StepCreatives draft={draft} onChange={patchDraft} />
        </section>
      )}

      {tab === 'revenue' && draft.type === 'Paid' && (
        <section className="cd-edit-panel builder">
          <div className="cd-invoice-panel">
            <div className="cd-panel-head">
              <h2>Final invoice · shortfall adjustments</h2>
              <p>
                Amounts reduced in Finance for screens under{' '}
                {ONLINE_EDIT_THRESHOLD_PCT}% online. Original campaign
                allocation stays on record; payable lines use the adjusted
                figures.
              </p>
            </div>
            <div className="cd-invoice-summary">
              <div>
                <em>Original allocation</em>
                <strong>{money(invoiceStats.original, currency)}</strong>
              </div>
              <div>
                <em>Payable after edits</em>
                <strong>{money(invoiceStats.allocated, currency)}</strong>
              </div>
              <div>
                <em>Withheld / difference</em>
                <strong>{money(invoiceStats.withheld, currency)}</strong>
              </div>
            </div>
            {invoiceAdjustments.length === 0 ? (
              <p className="cd-invoice-empty">
                No screen amounts have been reduced yet. Edit payables on
                Finance for screens below {ONLINE_EDIT_THRESHOLD_PCT}% online.
              </p>
            ) : (
              <div className="table-wrap">
                <table className="cd-table">
                  <thead>
                    <tr>
                      <th>Screen</th>
                      <th>Company</th>
                      <th>Online</th>
                      <th>Original</th>
                      <th>Payable</th>
                      <th>Difference</th>
                    </tr>
                  </thead>
                  <tbody>
                    {invoiceAdjustments.map((row) => (
                      <tr key={row.screenId}>
                        <td>
                          <strong>{row.screenId}</strong>
                          <span className="meta">{row.name}</span>
                        </td>
                        <td>
                          {row.company}
                          <span className="meta">{row.location}</span>
                        </td>
                        <td className="mono">{row.onlinePct}%</td>
                        <td className="mono">
                          {money(row.originalAllocated, currency)}
                        </td>
                        <td className="mono">
                          <strong>{money(row.allocated, currency)}</strong>
                        </td>
                        <td className="mono">−{money(row.delta, currency)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
          <StepRevenue draft={draft} onChange={patchDraft} />
        </section>
      )}

      {tab === 'finance' && draft.type === 'Paid' && (
        <CampaignFinancePanel
          screens={financeScreens}
          currency={currency}
          draft={draft}
          popVerified={popVerified}
          onChangeScreens={setFinanceScreens}
          focusAnchor={focusAnchor}
          onFocusConsumed={onFocusConsumed}
          onOpenQuestion={onOpenQuestion}
        />
      )}

      {tab === 'delivery' && draft.type === 'Paid' && (
        <section className="cd-panel cd-pop-wrap">
          <CampaignPopPanel
            draft={draft}
            popVerified={popVerified}
            onChangePopVerified={setPopVerified}
          />
        </section>
      )}
    </div>
  )
}
