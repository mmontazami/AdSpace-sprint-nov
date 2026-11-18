import { useMemo, useState } from 'react'
import {
  COMPANY_UPTIME_SCREENS,
  EARNINGS_CHART,
  EARNINGS_CURRENCIES,
  EARNINGS_INVENTORY,
  EARNINGS_KPI_META,
  EARNINGS_LINES,
  EARNINGS_MONTHS,
  HOST_STATE_DEMOS,
  POP_AWAITING,
  STATEMENTS_PAYOUTS,
  allocationBars,
  convertFromKwd,
  defaultCurrencyForCountry,
  moneyEarnings,
  summarizeEarnings,
} from '../data/earnings'
import './EarningsPage.css'

const PAGE_TABS = [
  { id: 'overview', label: 'Overview' },
  { id: 'statements', label: 'Statements & Payouts' },
]

const BREAKDOWN_VIEWS = [
  { id: 'campaign', label: 'Campaign' },
  { id: 'location', label: 'Location' },
  { id: 'screen', label: 'Screen' },
]

function countryLabel(code) {
  const map = {
    KW: 'Kuwait',
    AE: 'UAE',
    SA: 'Saudi Arabia',
    QA: 'Qatar',
    BH: 'Bahrain',
    OM: 'Oman',
  }
  return map[code] || code
}

function statusTone(status) {
  if (status === 'Paid') return 'ok'
  if (status === 'Ready' || status === 'In progress') return 'ready'
  if (status === 'Awaiting PoP') return 'warn'
  return ''
}

export default function EarningsPage({ onOpenUptime }) {
  const [demoId, setDemoId] = useState('verified')
  const demo = HOST_STATE_DEMOS.find((d) => d.id === demoId) || HOST_STATE_DEMOS[4]
  const countryDefault = defaultCurrencyForCountry(demo.country)

  const [currency, setCurrency] = useState(countryDefault)
  const [monthId, setMonthId] = useState(EARNINGS_MONTHS[0].id)
  const [pageTab, setPageTab] = useState('overview')
  const [breakdown, setBreakdown] = useState('campaign')
  const [popOpen, setPopOpen] = useState(null)
  const [uploaded, setUploaded] = useState(() => new Set())

  const activeCurrency =
    currency && EARNINGS_CURRENCIES.includes(currency)
      ? currency
      : countryDefault

  function onDemoChange(id) {
    const next = HOST_STATE_DEMOS.find((d) => d.id === id)
    setDemoId(id)
    if (next) setCurrency(defaultCurrencyForCountry(next.country))
  }

  const month = EARNINGS_MONTHS.find((m) => m.id === monthId) || EARNINGS_MONTHS[0]
  const isVerified = demo.hostStatus === 'Verified'
  const hasEarnings = Boolean(demo.hasEarnings)
  const incompleteLocations = EARNINGS_INVENTORY.locationsIncomplete > 0

  const monthLines = useMemo(() => {
    if (!hasEarnings) return []
    return EARNINGS_LINES.filter((l) => l.monthId === monthId)
  }, [hasEarnings, monthId])

  const allLines = useMemo(
    () => (hasEarnings ? EARNINGS_LINES : []),
    [hasEarnings],
  )

  const summary = useMemo(() => summarizeEarnings(monthLines), [monthLines])
  const bars = useMemo(
    () => allocationBars(monthLines, breakdown),
    [monthLines, breakdown],
  )

  const chartMax = useMemo(
    () => Math.max(...EARNINGS_CHART.map((m) => m.earnedKwd), 1),
    [],
  )

  const uptimePreview = COMPANY_UPTIME_SCREENS.filter(
    (s) => s.telemetry !== 'missing',
  ).slice(0, 4)

  function amt(kwd) {
    return moneyEarnings(convertFromKwd(kwd, activeCurrency), activeCurrency)
  }

  function markUploaded(id) {
    setUploaded((prev) => new Set([...prev, id]))
    setPopOpen(null)
  }

  const awaitingPop = POP_AWAITING.filter((p) => !uploaded.has(p.id))

  return (
    <div className="earn-page">
      <header className="earn-header">
        <div>
          <h1>Earnings</h1>
          <p className="earn-company-line">
            {demo.companyName} · {countryLabel(demo.country)}
          </p>
        </div>
        <div className="earn-header-actions">
          <label className="field compact">
            <span>Demo Host state</span>
            <select
              value={demoId}
              onChange={(e) => onDemoChange(e.target.value)}
            >
              {HOST_STATE_DEMOS.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.label}
                </option>
              ))}
            </select>
          </label>
          {isVerified && (
            <>
              <label className="field compact">
                <span>Period</span>
                <select
                  value={monthId}
                  onChange={(e) => setMonthId(e.target.value)}
                >
                  {EARNINGS_MONTHS.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.label}
                    </option>
                  ))}
                </select>
              </label>
              <label className="field compact">
                <span>Display currency</span>
                <select
                  value={activeCurrency}
                  onChange={(e) => setCurrency(e.target.value)}
                >
                  {EARNINGS_CURRENCIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                      {c === countryDefault ? ' (default)' : ''}
                    </option>
                  ))}
                </select>
              </label>
            </>
          )}
        </div>
      </header>

      <div className="earn-host-row">
        <span
          className={`earn-host-pill ${demo.hostStatus.toLowerCase().replace(/\s+/g, '-')}`}
        >
          Host · {demo.hostStatus}
        </span>
        <span className="meta">
          Default currency from Earn with Ads country ({demo.country} →{' '}
          {countryDefault}). Super Admins do not set this.
        </span>
      </div>

      {!isVerified && (
        <section className="earn-state-card">
          {(demo.hostStatus === 'Not applied' ||
            demo.hostStatus === 'Incomplete') && (
            <>
              <h2>
                {demo.hostStatus === 'Not applied'
                  ? 'Start earning with ads'
                  : 'Finish your Host application'}
              </h2>
              <p>
                {demo.hostStatus === 'Not applied'
                  ? 'Your company has not applied to become a Verified Host. Complete Earn with Ads to unlock marketplace campaigns and earnings.'
                  : 'Your application is incomplete. An authorized Owner (or billing-authorized role) needs to finish the missing steps before review.'}
              </p>
              {demo.missing?.length > 0 && (
                <ul className="earn-missing">
                  {demo.missing.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              )}
            </>
          )}

          {demo.hostStatus === 'Pending' && (
            <>
              <h2>Application under review</h2>
              <p>
                We’ve received your Host application. Marketplace eligibility and
                earnings unlock after admin verification.
              </p>
              <ol className="earn-progress">
                {(demo.progress || []).map((step) => (
                  <li key={step.step} className={step.done ? 'done' : 'todo'}>
                    <span className="earn-progress-mark" aria-hidden="true" />
                    {step.step}
                    <em>{step.done ? 'Done' : 'In progress'}</em>
                  </li>
                ))}
              </ol>
            </>
          )}
        </section>
      )}

      {isVerified && incompleteLocations && (
        <section className="earn-banner">
          <div>
            <strong>Complete location advertising info</strong>
            <p>
              {EARNINGS_INVENTORY.locationsIncomplete} location
              {EARNINGS_INVENTORY.locationsIncomplete === 1 ? '' : 's'} still
              missing opening hours or audience — finish these to unlock more
              marketplace eligibility.
            </p>
          </div>
        </section>
      )}

      {isVerified && !hasEarnings && (
        <section className="earn-promo">
          <div className="earn-promo-icon" aria-hidden="true" />
          <div>
            <h2>No earnings yet</h2>
            <p>
              You’re a Verified Host, but nothing has been allocated to your
              screens this period. Keep Ad-Supported screens online during
              opening hours and wait for marketplace campaigns to book your
              inventory.
            </p>
            <div className="earn-next-steps">
              <button type="button" className="btn-ghost" onClick={onOpenUptime}>
                View screens
              </button>
            </div>
          </div>
        </section>
      )}

      {isVerified && (
        <>
          <div className="earn-page-tabs" role="tablist" aria-label="Earnings sections">
            {PAGE_TABS.map((t) => (
              <button
                key={t.id}
                type="button"
                role="tab"
                aria-selected={pageTab === t.id}
                className={pageTab === t.id ? 'active' : ''}
                onClick={() => setPageTab(t.id)}
              >
                {t.label}
              </button>
            ))}
          </div>

          {pageTab === 'overview' && (
            <div className="earn-overview">
              <div className="earn-kpis">
                <div className="earn-kpi">
                  <em>This month</em>
                  <strong>{hasEarnings ? amt(summary.total) : amt(0)}</strong>
                  <span>{month.label}</span>
                </div>
                <div className="earn-kpi warn">
                  <em>Pending payment</em>
                  <strong>{hasEarnings ? amt(summary.pending) : amt(0)}</strong>
                  <span>
                    {hasEarnings
                      ? `${awaitingPop.length} awaiting PoP · rest ready`
                      : 'Nothing pending'}
                  </span>
                </div>
                <div className="earn-kpi">
                  <em>Paid to date</em>
                  <strong>
                    {hasEarnings ? amt(EARNINGS_KPI_META.paidToDateKwd) : amt(0)}
                  </strong>
                  <span>
                    {hasEarnings
                      ? EARNINGS_KPI_META.paidToDateSince
                      : 'No payouts yet'}
                  </span>
                </div>
                <div className="earn-kpi accent">
                  <em>Referred income</em>
                  <strong>{hasEarnings ? amt(summary.referred) : amt(0)}</strong>
                  <span>
                    {hasEarnings
                      ? 'This month, at 100%'
                      : 'Refer a brand to keep 100%'}
                  </span>
                </div>
              </div>

              <div className="earn-overview-grid">
                <section className="earn-panel earn-chart-panel">
                  <div className="earn-panel-head">
                    <h2>Last 6 months</h2>
                    <div className="earn-chart-legend">
                      <span>
                        <i className="paid" /> Paid
                      </span>
                      <span>
                        <i className="pending" /> Pending
                      </span>
                    </div>
                  </div>
                  <div className="earn-chart" role="img" aria-label="Monthly earnings">
                    {EARNINGS_CHART.map((m) => {
                      const h = Math.max(
                        4,
                        Math.round((m.earnedKwd / chartMax) * 150),
                      )
                      return (
                        <div key={m.id} className="earn-chart-col">
                          <span className="earn-chart-val">
                            {hasEarnings ? Math.round(convertFromKwd(m.earnedKwd, activeCurrency)) : 0}
                          </span>
                          <div
                            className={`earn-chart-bar ${m.pending ? 'pending' : 'paid'}`}
                            style={{ height: hasEarnings ? h : 4 }}
                          />
                          <span className="earn-chart-label">{m.label}</span>
                        </div>
                      )
                    })}
                  </div>
                </section>

                <section className="earn-panel earn-alloc-panel">
                  <div className="earn-panel-head">
                    <h2>Where it comes from</h2>
                    <div className="earn-seg" role="tablist">
                      {BREAKDOWN_VIEWS.map((v) => (
                        <button
                          key={v.id}
                          type="button"
                          role="tab"
                          aria-selected={breakdown === v.id}
                          className={breakdown === v.id ? 'active' : ''}
                          onClick={() => setBreakdown(v.id)}
                        >
                          {v.label}
                        </button>
                      ))}
                    </div>
                  </div>
                  {!hasEarnings || bars.length === 0 ? (
                    <p className="earn-empty-copy">
                      Nothing yet. Campaigns on your screens will show here.
                    </p>
                  ) : (
                    <ul className="earn-alloc-list">
                      {bars.map((a) => (
                        <li key={a.id}>
                          <div className="earn-alloc-row">
                            <span>{a.name}</span>
                            <span className="meta">
                              {amt(a.earnedKwd)} · <b>{a.pct}%</b>
                            </span>
                          </div>
                          <div className="earn-alloc-track">
                            <div
                              className="earn-alloc-fill"
                              style={{ width: `${a.pct}%` }}
                            />
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </section>
              </div>

              {hasEarnings && awaitingPop.length > 0 && (
                <section className="earn-pop">
                  <div className="earn-pop-head">
                    <div>
                      <h2>Payouts awaiting Proof of Play</h2>
                      <p>
                        Upload one photo per distinct ad per screen to release
                        these payouts.
                      </p>
                    </div>
                  </div>
                  <ul className="earn-pop-list">
                    {awaitingPop.map((item) => (
                      <li key={item.id}>
                        <div>
                          <strong>
                            {item.adLabel} · {item.screenName}
                          </strong>
                          <span className="meta">
                            {item.campaign} · {item.location} · {amt(item.owedKwd)}
                          </span>
                        </div>
                        <button
                          type="button"
                          className="btn-primary compact"
                          onClick={() => setPopOpen(item)}
                        >
                          Upload PoP
                        </button>
                      </li>
                    ))}
                  </ul>
                </section>
              )}

              <section className="earn-panel earn-uptime-panel">
                <div className="earn-panel-head">
                  <div>
                    <h2>Screens · {month.label}</h2>
                    <p className="earn-panel-sub">
                      Measured during your opening hours ·{' '}
                      <b>Target: keep every screen above 98%</b>
                    </p>
                  </div>
                  <button
                    type="button"
                    className="btn-ghost compact"
                    onClick={onOpenUptime}
                  >
                    All screens →
                  </button>
                </div>
                {!hasEarnings ? (
                  <p className="earn-empty-copy">
                    Uptime shows here once you have ad-supported screens earning.
                  </p>
                ) : (
                  <ul className="earn-uptime-list">
                    {uptimePreview.map((u) => {
                      const tone =
                        u.onlinePct >= 98
                          ? 'ok'
                          : u.onlinePct >= 90
                            ? 'warn'
                            : 'bad'
                      return (
                        <li key={u.id} className={u.offlineDuringAds ? 'warn-ads' : ''}>
                          <div>
                            <strong>{u.screenName}</strong>
                            <span className="meta">
                              {u.location} · open {u.workingHours}
                            </span>
                          </div>
                          <div className="earn-uptime-right">
                            <span className={`earn-uptime-pct ${tone}`}>
                              {u.onlinePct.toFixed(1)}%
                            </span>
                            <span className={`meta ${tone}`}>
                              {u.onlinePct >= 98
                                ? 'On target'
                                : u.offlineDuringAds
                                  ? 'Below 98% · offline with ads'
                                  : 'Below 98%'}
                            </span>
                          </div>
                        </li>
                      )
                    })}
                  </ul>
                )}
              </section>

              <section className="earn-panel">
                <div className="earn-panel-head">
                  <h2>Inventory &amp; eligibility</h2>
                </div>
                <div className="earn-inventory">
                  <div className="earn-inv-card">
                    <em>Marketplace locations</em>
                    <strong>{EARNINGS_INVENTORY.marketplaceLocations}</strong>
                    <span>
                      {EARNINGS_INVENTORY.locationsEligible} eligible ·{' '}
                      {EARNINGS_INVENTORY.locationsIncomplete} incomplete
                    </span>
                  </div>
                  <div className="earn-inv-card">
                    <em>Ad-Supported screens</em>
                    <strong>{EARNINGS_INVENTORY.adSupportedScreens}</strong>
                    <span>
                      {EARNINGS_INVENTORY.screensEligible} eligible ·{' '}
                      {EARNINGS_INVENTORY.screensIneligible} not eligible
                    </span>
                  </div>
                </div>
                <table className="earn-elig-table">
                  <thead>
                    <tr>
                      <th>Location</th>
                      <th>Advertising</th>
                      <th>Eligible screens</th>
                      <th>Note</th>
                    </tr>
                  </thead>
                  <tbody>
                    {EARNINGS_INVENTORY.locations.map((loc) => (
                      <tr key={loc.id}>
                        <td>{loc.name}</td>
                        <td>
                          <span
                            className={`earn-badge ${loc.eligible ? 'ok' : 'warn'}`}
                          >
                            {loc.eligible ? 'Eligible' : 'Incomplete'}
                          </span>
                        </td>
                        <td>
                          {loc.eligibleScreens}/{loc.screens}
                        </td>
                        <td className="meta">{loc.reason}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </section>
            </div>
          )}

          {pageTab === 'statements' && (
            <section className="earn-panel earn-statements">
              <div className="earn-panel-head">
                <div>
                  <h2>Statements &amp; Payouts</h2>
                  <p className="earn-panel-sub">
                    Combined view — same records. Documents and Team live under
                    Company, not Earnings.
                  </p>
                </div>
              </div>
              {!hasEarnings ? (
                <p className="earn-empty-copy">No statements yet.</p>
              ) : (
                <table className="earn-stmt-table">
                  <thead>
                    <tr>
                      <th>Month</th>
                      <th>Status</th>
                      <th>Campaigns</th>
                      <th>Earned</th>
                      <th>Paid</th>
                      <th>Paid on</th>
                      <th>Account</th>
                    </tr>
                  </thead>
                  <tbody>
                    {STATEMENTS_PAYOUTS.map((row) => (
                      <tr key={row.id}>
                        <td>
                          <strong>{row.month}</strong>
                        </td>
                        <td>
                          <span className={`earn-badge ${statusTone(row.status)}`}>
                            {row.status}
                          </span>
                        </td>
                        <td className="meta">{row.campaigns}</td>
                        <td className="mono">{amt(row.earnedKwd)}</td>
                        <td className="mono">{amt(row.paidKwd)}</td>
                        <td>{row.paidAt || '—'}</td>
                        <td className="mono">{row.account}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}

              {hasEarnings && (
                <div className="earn-stmt-detail">
                  <h3>Lines in {month.label}</h3>
                  <table className="earn-stmt-table">
                    <thead>
                      <tr>
                        <th>Campaign</th>
                        <th>Screen</th>
                        <th>Share</th>
                        <th>Earned</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(allLines.filter((l) => l.monthId === monthId).length
                        ? allLines.filter((l) => l.monthId === monthId)
                        : []
                      ).map((line) => (
                        <tr key={line.id}>
                          <td>
                            <strong>{line.campaign}</strong>
                            <span className="meta">{line.advertiser}</span>
                          </td>
                          <td>
                            {line.screenName}
                            <span className="meta">{line.location}</span>
                          </td>
                          <td>
                            {line.referral ? 'Referral 100%' : `${line.sharePct}%`}
                          </td>
                          <td className="mono">{amt(line.earnedKwd)}</td>
                          <td>
                            <span className={`earn-badge ${statusTone(line.status)}`}>
                              {line.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          )}
        </>
      )}

      {popOpen && (
        <div
          className="earn-modal-backdrop"
          onClick={() => setPopOpen(null)}
          role="presentation"
        >
          <div
            className="earn-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="earn-pop-title"
            onClick={(e) => e.stopPropagation()}
          >
            <header className="earn-modal-head">
              <div>
                <h2 id="earn-pop-title">Upload Proof of Play</h2>
                <p>
                  {popOpen.adLabel} · {popOpen.screenName} · {popOpen.campaign}
                </p>
              </div>
              <button
                type="button"
                className="btn-ghost compact"
                onClick={() => setPopOpen(null)}
              >
                Close
              </button>
            </header>
            <div className="earn-modal-body">
              <label className="earn-upload">
                <span>Photo showing the ad on this screen</span>
                <input type="file" accept="image/*" />
              </label>
              <p className="meta">
                Wireframe: choosing a file is optional — mark uploaded to
                simulate completion.
              </p>
              <button
                type="button"
                className="btn-primary"
                onClick={() => markUploaded(popOpen.id)}
              >
                Mark uploaded
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
