import { Fragment, useMemo, useState } from 'react'
import {
  FINANCE_ALERTS,
  FINANCE_CURRENCIES,
  FINANCE_GROUP_VIEWS,
  FINANCE_SCREENS,
  DELIVERY_READY_PCT,
  FINANCE_MONTHS,
  canMarkPaidScreen,
  convertFromKwd,
  financeSummaryFromScreens,
  groupFinanceScreens,
  markScreenPaid,
  moneyFinance,
} from '../data/finance'
import './FinancePage.css'

function statusClass(status) {
  if (status === 'Paid') return 'ok'
  if (status === 'Ready to pay') return 'ready'
  if (status === 'Low delivery') return 'warn'
  if (status === 'On hold') return 'hold'
  return ''
}

function deliveryClass(pct) {
  if (pct == null) return 'delivery-miss'
  if (pct >= DELIVERY_READY_PCT) return 'delivery-ok'
  return 'delivery-warn'
}

function formatHours(h) {
  if (h == null) return '—'
  return `${h}h`
}

function formatPct(pct) {
  if (pct == null) return '—'
  return `${pct}%`
}

function groupSubtitle(view, group) {
  const screens = `${group.screenCount} screen${group.screenCount === 1 ? '' : 's'}`
  const paid = `${group.paidCount} of ${group.screenCount} paid`
  if (view === 'campaign') return `${screens} · ${paid}`
  if (view === 'location') return `${screens} · ${paid}`
  return `${screens} · ${paid}`
}

export default function FinancePage({ onOpenCampaign }) {
  const [monthId, setMonthId] = useState(FINANCE_MONTHS[0].id)
  const [currency, setCurrency] = useState('KWD')
  const [groupView, setGroupView] = useState('company')
  const [query, setQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [openId, setOpenId] = useState(null)
  const [screens, setScreens] = useState(FINANCE_SCREENS)
  const [flash, setFlash] = useState(null)
  const [selectedIds, setSelectedIds] = useState(() => new Set())

  const month = FINANCE_MONTHS.find((m) => m.id === monthId) || FINANCE_MONTHS[0]
  const showScreensUnder =
    groupView === 'company' || groupView === 'location' || groupView === 'campaign'

  const selectedMarkable = useMemo(() => {
    return screens.filter((s) => selectedIds.has(s.id) && canMarkPaidScreen(s))
  }, [screens, selectedIds])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return screens.filter((l) => {
      if (statusFilter !== 'all' && l.status !== statusFilter) return false
      if (!q) return true
      return (
        l.company.toLowerCase().includes(q) ||
        l.location.toLowerCase().includes(q) ||
        l.campaign.toLowerCase().includes(q) ||
        l.advertiser.toLowerCase().includes(q) ||
        l.country.toLowerCase().includes(q) ||
        l.screenId.toLowerCase().includes(q) ||
        l.screenName.toLowerCase().includes(q) ||
        (l.creative || '').toLowerCase().includes(q)
      )
    })
  }, [screens, query, statusFilter])

  const groups = useMemo(
    () => groupFinanceScreens(filtered, groupView),
    [filtered, groupView],
  )

  const summary = useMemo(
    () => financeSummaryFromScreens(filtered),
    [filtered],
  )

  const deliveryRollup = useMemo(() => {
    const expectedH = filtered.reduce((s, l) => s + (l.expectedH || 0), 0)
    const actualH = filtered.reduce((s, l) => s + (l.actualH || 0), 0)
    const deliveryPct =
      expectedH > 0 ? Math.round((actualH / expectedH) * 1000) / 10 : null
    return { expectedH, actualH, deliveryPct }
  }, [filtered])

  function amt(kwd) {
    return moneyFinance(convertFromKwd(kwd, currency), currency)
  }

  function toggleSelect(id) {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function toggleSelectAllInGroup(groupScreens) {
    const ids = groupScreens.map((s) => s.id)
    setSelectedIds((prev) => {
      const allOn = ids.length > 0 && ids.every((id) => prev.has(id))
      const next = new Set(prev)
      if (allOn) ids.forEach((id) => next.delete(id))
      else ids.forEach((id) => next.add(id))
      return next
    })
  }

  function markPaid(screenId) {
    const row = screens.find((l) => l.id === screenId)
    if (!canMarkPaidScreen(row)) return
    setScreens((prev) =>
      prev.map((l) => (l.id === screenId ? markScreenPaid(l) : l)),
    )
    setSelectedIds((prev) => {
      const next = new Set(prev)
      next.delete(screenId)
      return next
    })
    setFlash(
      `${row.screenId} · ${row.creative}: marked Paid. Earnings updates and statement PDF email go out (manual payout outside the system).`,
    )
    window.setTimeout(() => setFlash(null), 4200)
  }

  function markAllPaid(group) {
    const ids = new Set(
      group.screens.filter((s) => canMarkPaidScreen(s)).map((s) => s.id),
    )
    if (ids.size === 0) return
    setScreens((prev) =>
      prev.map((s) => (ids.has(s.id) ? markScreenPaid(s) : s)),
    )
    setSelectedIds((prev) => {
      const next = new Set(prev)
      ids.forEach((id) => next.delete(id))
      return next
    })
    setFlash(
      `${group.title}: marked Paid on ${ids.size} row${ids.size === 1 ? '' : 's'} (delivery ≥ ${DELIVERY_READY_PCT}% only).`,
    )
    window.setTimeout(() => setFlash(null), 4200)
  }

  function markSelectedPaid() {
    const ids = new Set(selectedMarkable.map((s) => s.id))
    if (ids.size === 0) return
    setScreens((prev) =>
      prev.map((s) => (ids.has(s.id) ? markScreenPaid(s) : s)),
    )
    setSelectedIds(new Set())
    setFlash(
      `Marked Paid on ${ids.size} selected row${ids.size === 1 ? '' : 's'} (delivery ≥ ${DELIVERY_READY_PCT}% only).`,
    )
    window.setTimeout(() => setFlash(null), 4200)
  }

  function markBlockReason(screen) {
    if (screen.deliveryPct == null || screen.deliveryPct < DELIVERY_READY_PCT) {
      return `Blocked until play delivery ≥ ${DELIVERY_READY_PCT}%`
    }
    if (screen.bankHold) return 'Blocked — bank letter on hold'
    if (screen.status === 'Paid') return 'Already paid'
    return 'Nothing owed'
  }

  return (
    <div className="finance-page">
      <header className="finance-header">
        <div>
          <h1>Finance</h1>
          <p className="finance-subtitle">
            Admin payables for Paid campaigns · Expand company / location for
            screens · Mark paid per screen or all ready children · Delivery ≥{' '}
            {DELIVERY_READY_PCT}% · {month.label}
          </p>
        </div>
        <div className="finance-header-actions">
          <label className="field compact">
            <span>Month</span>
            <select value={monthId} onChange={(e) => setMonthId(e.target.value)}>
              {FINANCE_MONTHS.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.label}
                </option>
              ))}
            </select>
          </label>
          <label className="field compact">
            <span>Currency</span>
            <select
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
            >
              {FINANCE_CURRENCIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </label>
          <button type="button" className="btn-ghost">
            Export Excel
          </button>
        </div>
      </header>

      {FINANCE_ALERTS.map((alert) => (
        <div key={alert.id} className={`finance-alert ${alert.tone}`}>
          <span>{alert.text}</span>
          <button type="button" className="btn-ghost compact">
            {alert.action}
          </button>
        </div>
      ))}

      {flash && (
        <p className="finance-flash" role="status">
          {flash}
        </p>
      )}

      <div className="finance-stats finance-stats-4">
        <div className="finance-stat">
          <em>Owed to companies</em>
          <strong>{amt(summary.owed)}</strong>
          <span>
            {summary.ready} ready · {summary.lowDelivery} low delivery ·{' '}
            {summary.onHold} on hold
          </span>
        </div>
        <div className="finance-stat">
          <em>Paid</em>
          <strong>{amt(summary.paid)}</strong>
          <span>Marked paid this period</span>
        </div>
        <div className="finance-stat">
          <em>Pending</em>
          <strong>{amt(summary.pending)}</strong>
          <span>Still open on statements</span>
        </div>
        <div className="finance-stat">
          <em>Play delivery</em>
          <strong className={deliveryClass(deliveryRollup.deliveryPct)}>
            {formatPct(deliveryRollup.deliveryPct)}
          </strong>
          <span>
            {formatHours(deliveryRollup.actualH)} online &amp; playing of{' '}
            {formatHours(deliveryRollup.expectedH)} expected
          </span>
        </div>
      </div>

      <div className="finance-tabs" role="tablist" aria-label="Group payables">
        {FINANCE_GROUP_VIEWS.map((v) => (
          <button
            key={v.id}
            type="button"
            role="tab"
            aria-selected={groupView === v.id}
            className={groupView === v.id ? 'active' : ''}
            onClick={() => {
              setGroupView(v.id)
              setOpenId(null)
              setSelectedIds(new Set())
            }}
          >
            {v.label}
          </button>
        ))}
      </div>

      <div className="finance-toolbar">
        <label className="field grow">
          <span>Search</span>
          <input
            type="search"
            placeholder="Screen, creative, company, location, campaign…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </label>
        <label className="field">
          <span>Status</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all">All</option>
            <option value="Low delivery">Low delivery</option>
            <option value="Ready to pay">Ready to pay</option>
            <option value="On hold">On hold</option>
            <option value="Paid">Paid</option>
          </select>
        </label>
      </div>

      <p className="finance-hint">
        Expand any group to see screen × creative rows. Select rows, then use
        Mark selected paid. Delivery gate ≥ {DELIVERY_READY_PCT}% (not on hold).
      </p>

      {selectedIds.size > 0 && (
        <div className="finance-bulk-bar" role="status">
          <span>
            {selectedIds.size} selected
            {selectedMarkable.length > 0
              ? ` · ${selectedMarkable.length} ready to pay`
              : ' · none ready to pay'}
          </span>
          <button
            type="button"
            className="btn-primary compact"
            disabled={selectedMarkable.length === 0}
            onClick={markSelectedPaid}
          >
            Mark selected paid
            {selectedMarkable.length > 0
              ? ` (${selectedMarkable.length})`
              : ''}
          </button>
          <button
            type="button"
            className="btn-ghost compact"
            onClick={() => setSelectedIds(new Set())}
          >
            Clear
          </button>
        </div>
      )}

      <div className="finance-table-wrap">
        <table className="finance-table">
          <thead>
            <tr>
              <th />
              <th>
                {groupView === 'campaign'
                  ? 'Campaign'
                  : groupView === 'location'
                    ? 'Location'
                    : 'Company'}
              </th>
              <th>Expected</th>
              <th>Actual</th>
              <th>Delivery %</th>
              <th>Paid of owed</th>
              <th>Owed</th>
              <th>Status</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {groups.map((group) => {
              const open = openId === group.id
              const fullyPaid = group.status === 'Paid'
              return (
                <Fragment key={group.id}>
                  <tr className={open ? 'open' : ''}>
                    <td>
                      <button
                        type="button"
                        className="finance-expand"
                        aria-expanded={open}
                        onClick={() =>
                          setOpenId((prev) =>
                            prev === group.id ? null : group.id,
                          )
                        }
                      >
                        {open ? '▾' : '▸'}
                      </button>
                    </td>
                    <td>
                      <button
                        type="button"
                        className="finance-row-title"
                        aria-expanded={open}
                        onClick={() =>
                          setOpenId((prev) =>
                            prev === group.id ? null : group.id,
                          )
                        }
                      >
                        <strong>{group.title}</strong>
                        <span className="meta">
                          {group.meta}
                          {group.meta ? ' · ' : ''}
                          {groupSubtitle(groupView, group)}
                        </span>
                      </button>
                    </td>
                    <td className="mono">{formatHours(group.expectedH)}</td>
                    <td className="mono">{formatHours(group.actualH)}</td>
                    <td>
                      <span className={deliveryClass(group.deliveryPct)}>
                        {formatPct(group.deliveryPct)}
                      </span>
                      <span className="meta">online &amp; playing</span>
                    </td>
                    <td>
                      {amt(group.paidKwd)}
                      <span className="meta">
                        of {amt(group.paidKwd + group.owedKwd)}
                      </span>
                    </td>
                    <td>
                      <strong>{amt(group.owedKwd)}</strong>
                    </td>
                    <td>
                      <span
                        className={`finance-status ${statusClass(group.status)}`}
                      >
                        {group.status}
                      </span>
                    </td>
                    <td className="actions">
                      {groupView === 'campaign' && (
                        <button
                          type="button"
                          className="btn-ghost compact"
                          onClick={() => onOpenCampaign?.(group.campaignId)}
                        >
                          Open campaign
                        </button>
                      )}
                      {fullyPaid ? (
                        <span className="finance-status ok">Paid</span>
                      ) : (
                        <button
                          type="button"
                          className="btn-primary compact"
                          disabled={!group.canMarkAll}
                          title={
                            group.canMarkAll
                              ? `Mark paid on ${group.markableCount} ready screen${group.markableCount === 1 ? '' : 's'}`
                              : 'No ready screens to pay'
                          }
                          onClick={() => markAllPaid(group)}
                        >
                          Mark paid
                          {group.markableCount > 0
                            ? ` (${group.markableCount})`
                            : ''}
                        </button>
                      )}
                      <button
                        type="button"
                        className="btn-ghost compact"
                        title="Statement of Account PDF"
                      >
                        PDF
                      </button>
                    </td>
                  </tr>
                  {open && showScreensUnder && (
                    <tr className="finance-detail-row">
                      <td colSpan={9}>
                        <div className="finance-detail">
                          <h3>
                            {groupView === 'campaign'
                              ? 'Screens × creatives'
                              : 'Screens'}
                          </h3>
                          <table className="finance-lines">
                            <thead>
                              <tr>
                                <th className="finance-check">
                                  <input
                                    type="checkbox"
                                    aria-label={`Select all in ${group.title}`}
                                    checked={
                                      group.screens.length > 0 &&
                                      group.screens.every((s) =>
                                        selectedIds.has(s.id),
                                      )
                                    }
                                    onChange={() =>
                                      toggleSelectAllInGroup(group.screens)
                                    }
                                  />
                                </th>
                                <th>Screen</th>
                                {groupView === 'company' && <th>Location</th>}
                                {groupView === 'location' && <th>Company</th>}
                                {groupView === 'campaign' && (
                                  <>
                                    <th>Company</th>
                                    <th>Location</th>
                                  </>
                                )}
                                {groupView !== 'campaign' && <th>Campaign</th>}
                                <th>Creative</th>
                                <th>Earnings</th>
                                <th>Expected</th>
                                <th>Actual</th>
                                <th>Delivery %</th>
                                <th>Status</th>
                                <th />
                              </tr>
                            </thead>
                            <tbody>
                              {group.screens.map((screen) => {
                                const markable = canMarkPaidScreen(screen)
                                const checked = selectedIds.has(screen.id)
                                return (
                                  <tr
                                    key={screen.id}
                                    className={checked ? 'is-selected' : ''}
                                  >
                                    <td className="finance-check">
                                      <input
                                        type="checkbox"
                                        aria-label={`Select ${screen.screenId} ${screen.creative}`}
                                        checked={checked}
                                        onChange={() => toggleSelect(screen.id)}
                                      />
                                    </td>
                                    <td>
                                      <strong>{screen.screenId}</strong>
                                      <span className="meta">
                                        {screen.screenName}
                                      </span>
                                    </td>
                                    {groupView === 'company' && (
                                      <td>{screen.location}</td>
                                    )}
                                    {groupView === 'location' && (
                                      <td>
                                        <strong>{screen.company}</strong>
                                        <span className="meta">
                                          {screen.referring
                                            ? 'referring 100%'
                                            : `share ${screen.sharePercent}%`}
                                        </span>
                                      </td>
                                    )}
                                    {groupView === 'campaign' && (
                                      <>
                                        <td>
                                          <strong>{screen.company}</strong>
                                          <span className="meta">
                                            {screen.referring
                                              ? 'referring 100%'
                                              : `share ${screen.sharePercent}%`}
                                          </span>
                                        </td>
                                        <td>{screen.location}</td>
                                      </>
                                    )}
                                    {groupView !== 'campaign' && (
                                      <td>
                                        <strong>{screen.campaign}</strong>
                                        <span className="meta">
                                          {screen.advertiser}
                                        </span>
                                      </td>
                                    )}
                                    <td>
                                      <strong>{screen.creative}</strong>
                                      <span className="meta">
                                        {screen.creativeSchedule}
                                      </span>
                                    </td>
                                    <td>
                                      <strong>{amt(screen.earningsKwd)}</strong>
                                      <span className="meta">
                                        of {amt(screen.allocatedKwd)} allocated
                                      </span>
                                    </td>
                                    <td className="mono">
                                      {formatHours(screen.expectedH)}
                                    </td>
                                    <td className="mono">
                                      {formatHours(screen.actualH)}
                                    </td>
                                    <td>
                                      <span
                                        className={deliveryClass(
                                          screen.deliveryPct,
                                        )}
                                      >
                                        {formatPct(screen.deliveryPct)}
                                      </span>
                                    </td>
                                    <td>
                                      <span
                                        className={`finance-status ${statusClass(screen.status)}`}
                                      >
                                        {screen.status}
                                      </span>
                                    </td>
                                    <td className="actions">
                                      {screen.status === 'Paid' ? (
                                        <span className="finance-status ok">
                                          Paid
                                        </span>
                                      ) : (
                                        <button
                                          type="button"
                                          className="btn-primary compact"
                                          disabled={!markable}
                                          title={
                                            markable
                                              ? 'Mark this screen as Paid'
                                              : markBlockReason(screen)
                                          }
                                          onClick={() => markPaid(screen.id)}
                                        >
                                          Mark paid
                                        </button>
                                      )}
                                    </td>
                                  </tr>
                                )
                              })}
                            </tbody>
                          </table>
                          <p className="finance-detail-note">
                            Earnings = allocated × company/location share
                            (referring keeps 100%). A screen can appear more
                            than once when creatives use non-overlapping
                            schedules. Mark paid applies per screen × creative
                            row; Mark all only includes rows that meet the
                            delivery gate.
                          </p>
                        </div>
                      </td>
                    </tr>
                  )}
                </Fragment>
              )
            })}
          </tbody>
        </table>
      </div>

      {groups.length === 0 && (
        <p className="finance-empty">No payables match these filters.</p>
      )}
    </div>
  )
}
