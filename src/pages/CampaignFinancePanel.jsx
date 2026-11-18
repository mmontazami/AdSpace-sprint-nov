import { useEffect, useMemo, useRef, useState } from 'react'
import {
  buildPopUnits,
  formatPopProgress,
  summarizePopUnits,
} from '../data/campaignProofOfPlay'
import { ONLINE_EDIT_THRESHOLD_PCT } from '../data/campaigns'
import {
  buildPlayDeliveryRows,
  formatDuration,
  formatPct,
  formatPlays,
} from '../data/playDelivery'
import RelatedQuestionChip from '../components/RelatedQuestionChip'

const PAYMENT_METHODS = [
  { value: '', label: '— Not set' },
  { value: 'bank_transfer', label: 'Bank transfer' },
  { value: 'wire', label: 'Wire / SWIFT' },
  { value: 'cheque', label: 'Cheque' },
  { value: 'cash', label: 'Cash' },
  { value: 'other', label: 'Other' },
]

function emptyPaymentForm() {
  return {
    paidAt: '',
    method: '',
    reference: '',
    notes: '',
    receiptName: '',
  }
}

function recordToForm(record) {
  if (!record) return emptyPaymentForm()
  return {
    paidAt: record.paidAt || '',
    method: record.method || '',
    reference: record.reference || '',
    notes: record.notes || '',
    receiptName: record.receiptName || '',
  }
}

function formToRecord(form) {
  const paidAt = form.paidAt?.trim() || ''
  const method = form.method || ''
  const reference = form.reference?.trim() || ''
  const notes = form.notes?.trim() || ''
  const receiptName = form.receiptName || ''
  if (!paidAt && !method && !reference && !notes && !receiptName) return null
  return { paidAt, method, reference, notes, receiptName }
}

function methodLabel(value) {
  return PAYMENT_METHODS.find((m) => m.value === value)?.label || value || '—'
}

function money(n, currency = 'USD') {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(n)
}

function onlineTone(pct) {
  if (pct == null) return 'hold'
  if (pct >= ONLINE_EDIT_THRESHOLD_PCT) return 'ok'
  if (pct >= 90) return 'ready'
  return 'warn'
}

function canEditScreenAmount(row) {
  if (!row || row.payment === 'Paid') return false
  return row.onlinePct != null && row.onlinePct < ONLINE_EDIT_THRESHOLD_PCT
}

function companyStatus(screens) {
  if (screens.length === 0) return 'Unpaid'
  if (screens.every((s) => s.payment === 'Paid')) return 'Paid'
  if (screens.some((s) => s.payment === 'Paid')) return 'Partial'
  return 'Unpaid'
}

function companyPaymentRecord(screens) {
  return screens.find((s) => s.paymentRecord)?.paymentRecord || null
}

function rollupHours(screens) {
  const expectedH = screens.reduce((s, r) => s + (r.expectedH || 0), 0)
  const actualH = screens.reduce((s, r) => s + (r.actualH || 0), 0)
  const onlinePct =
    expectedH > 0 ? Math.round((actualH / expectedH) * 1000) / 10 : null
  return { expectedH, actualH, onlinePct }
}

function rollupMoney(screens) {
  const originalAllocated = screens.reduce(
    (s, r) => s + (r.originalAllocated ?? r.allocated ?? 0),
    0,
  )
  const allocated = screens.reduce((s, r) => s + (r.allocated || 0), 0)
  const earnings = screens.reduce((s, r) => s + (r.earnings || 0), 0)
  return { originalAllocated, allocated, earnings }
}

function buildTree(screens) {
  const byCompany = new Map()
  for (const row of screens) {
    if (!byCompany.has(row.company)) {
      byCompany.set(row.company, {
        company: row.company,
        share: row.share,
        locations: new Map(),
      })
    }
    const co = byCompany.get(row.company)
    if (!co.locations.has(row.location)) {
      co.locations.set(row.location, {
        location: row.location,
        screens: [],
      })
    }
    co.locations.get(row.location).screens.push(row)
  }

  return [...byCompany.values()]
    .map((co) => {
      const locations = [...co.locations.values()]
        .map((loc) => {
          const screens = [...loc.screens].sort((a, b) =>
            (a.screenId || '').localeCompare(b.screenId || ''),
          )
          return {
            location: loc.location,
            screens,
            ...rollupMoney(screens),
            ...rollupHours(screens),
          }
        })
        .sort((a, b) => a.location.localeCompare(b.location))
      const screens = locations.flatMap((l) => l.screens)
      return {
        company: co.company,
        share: co.share,
        locations,
        screens,
        locationCount: locations.length,
        ...rollupMoney(screens),
        ...rollupHours(screens),
        status: companyStatus(screens),
        paymentRecord: companyPaymentRecord(screens),
      }
    })
    .sort((a, b) => a.company.localeCompare(b.company))
}

function DeliveryMeter({ pct, actualH, expectedH, size = 'md' }) {
  const tone = onlineTone(pct)
  const width = pct == null ? 0 : Math.max(0, Math.min(100, pct))
  return (
    <div className={`cd-fin-delivery cd-fin-delivery-${size} tone-${tone}`}>
      <div className="cd-fin-delivery-top">
        <span className="cd-fin-delivery-label">Online</span>
        <strong className="cd-fin-delivery-pct">
          {pct == null ? '—' : `${pct}%`}
        </strong>
      </div>
      <div
        className="cd-fin-delivery-track"
        role="progressbar"
        aria-valuenow={pct ?? 0}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label="Company play delivery"
      >
        <span style={{ width: `${width}%` }} />
      </div>
      {actualH != null && expectedH != null && (
        <span className="cd-fin-delivery-hours">
          {actualH}h / {expectedH}h
        </span>
      )}
    </div>
  )
}

function defaultPaidAtLocal() {
  const d = new Date()
  const pad = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

/**
 * Campaign detail Finance: company → location → screen.
 * Mark as Paid only on the company row (offline payment details modal).
 * Paid rows: ⋮ menu to edit details or revert to Unpaid.
 * Per-screen payable editable when online % < threshold (decrease only).
 */
export default function CampaignFinancePanel({
  screens,
  currency = 'USD',
  onChangeScreens,
  focusAnchor = null,
  onFocusConsumed,
  onOpenQuestion,
  draft = null,
  popVerified = {},
}) {
  const playByScreen = useMemo(() => {
    const map = new Map()
    if (!draft) return map
    for (const row of buildPlayDeliveryRows(draft, { plannedOnly: false })) {
      map.set(row.screenId, row)
    }
    return map
  }, [draft])

  const popUnits = useMemo(() => buildPopUnits(draft), [draft])

  const popByCompany = useMemo(() => {
    const screenCompany = new Map()
    for (const row of playByScreen.values()) {
      screenCompany.set(row.screenId, row.company)
    }
    for (const s of screens || []) {
      if (!screenCompany.has(s.screenId)) {
        screenCompany.set(s.screenId, s.company)
      }
    }
    const byCompany = new Map()
    for (const unit of popUnits) {
      const company = screenCompany.get(unit.screenId)
      if (!company) continue
      if (!byCompany.has(company)) byCompany.set(company, [])
      byCompany.get(company).push(unit)
    }
    const out = new Map()
    for (const [company, units] of byCompany) {
      out.set(company, summarizePopUnits(units, popVerified))
    }
    return out
  }, [popUnits, screens, popVerified, playByScreen])
  const [openCompanies, setOpenCompanies] = useState(() => new Set())
  const [openLocations, setOpenLocations] = useState(() => new Set())
  const [flash, setFlash] = useState(null)
  const [editingId, setEditingId] = useState(null)
  const [editValue, setEditValue] = useState('')
  const [payModal, setPayModal] = useState(null)
  const [payForm, setPayForm] = useState(emptyPaymentForm)
  const [menuOpen, setMenuOpen] = useState(null)
  const [payableFocused, setPayableFocused] = useState(false)
  const menuRef = useRef(null)
  const payableAnchorRef = useRef(null)

  const tree = useMemo(() => buildTree(screens), [screens])

  const stats = useMemo(() => {
    const original = screens.reduce(
      (s, r) => s + (r.originalAllocated ?? r.allocated ?? 0),
      0,
    )
    const allocated = screens.reduce((s, r) => s + (r.allocated || 0), 0)
    const earnings = screens.reduce((s, r) => s + (r.earnings || 0), 0)
    const paid = screens
      .filter((r) => r.payment === 'Paid')
      .reduce((s, r) => s + (r.earnings || 0), 0)
    const adjusted = screens.filter(
      (r) => (r.allocated || 0) < (r.originalAllocated ?? r.allocated ?? 0),
    )
    const withheld = original - allocated
    return {
      original,
      allocated,
      earnings,
      paid,
      outstanding: earnings - paid,
      withheld,
      adjustedCount: adjusted.length,
      companiesPaid: tree.filter((c) => c.status === 'Paid').length,
      companiesTotal: tree.length,
    }
  }, [screens, tree])

  const adjustments = useMemo(() => {
    return screens
      .filter(
        (r) =>
          (r.originalAllocated ?? r.allocated) != null &&
          (r.allocated || 0) < (r.originalAllocated ?? r.allocated),
      )
      .map((r) => ({
        screenId: r.screenId,
        name: r.name,
        company: r.company,
        location: r.location,
        onlinePct: r.onlinePct,
        originalAllocated: r.originalAllocated ?? r.allocated,
        allocated: r.allocated,
        delta: (r.originalAllocated ?? r.allocated) - (r.allocated || 0),
      }))
  }, [screens])

  useEffect(() => {
    if (!menuOpen) return undefined
    function onDoc(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(null)
      }
    }
    function onKey(e) {
      if (e.key === 'Escape') setMenuOpen(null)
    }
    document.addEventListener('mousedown', onDoc)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDoc)
      document.removeEventListener('keydown', onKey)
    }
  }, [menuOpen])

  useEffect(() => {
    if (focusAnchor !== 'screen-payable') return undefined
    // Open a company that has editable shortfall screens (sample: Avenues Ops).
    const shortfall = screens.find(
      (r) =>
        r.payment !== 'Paid' &&
        r.onlinePct != null &&
        r.onlinePct < ONLINE_EDIT_THRESHOLD_PCT,
    )
    if (shortfall) {
      setOpenCompanies((prev) => new Set(prev).add(shortfall.company))
      setOpenLocations((prev) =>
        new Set(prev).add(`${shortfall.company}::${shortfall.location}`),
      )
    }
    setPayableFocused(true)
    window.requestAnimationFrame(() => {
      payableAnchorRef.current?.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      })
    })
    const t = window.setTimeout(() => setPayableFocused(false), 1800)
    onFocusConsumed?.()
    return () => window.clearTimeout(t)
  }, [focusAnchor, onFocusConsumed, screens])

  function showFlash(msg) {
    setFlash(msg)
    window.setTimeout(() => setFlash(null), 3200)
  }

  function toggleCompany(name) {
    setOpenCompanies((prev) => {
      const next = new Set(prev)
      if (next.has(name)) next.delete(name)
      else next.add(name)
      return next
    })
  }

  function toggleLocation(key) {
    setOpenLocations((prev) => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }

  function openMarkPaid(companyName) {
    const group = tree.find((c) => c.company === companyName)
    if (!group || group.status === 'Paid') return
    const pop = popByCompany.get(companyName)
    if (pop && pop.total > 0 && !pop.complete) {
      showFlash(
        `${companyName}: complete Proof of Play first (${pop.done}/${pop.total}) in Delivery & PoP`,
      )
      return
    }
    setMenuOpen(null)
    setPayModal({ mode: 'mark', company: companyName, earnings: group.earnings })
    setPayForm({ ...emptyPaymentForm(), paidAt: defaultPaidAtLocal() })
  }

  function openEditPayment(companyName) {
    const group = tree.find((c) => c.company === companyName)
    if (!group || group.status !== 'Paid') return
    setMenuOpen(null)
    setPayModal({
      mode: 'edit',
      company: companyName,
      earnings: group.earnings,
    })
    setPayForm(recordToForm(group.paymentRecord))
  }

  function closePayModal() {
    setPayModal(null)
    setPayForm(emptyPaymentForm())
  }

  function confirmPayModal() {
    if (!payModal) return
    const record = formToRecord(payForm)
    const { company, mode } = payModal
    onChangeScreens(
      screens.map((s) =>
        s.company === company
          ? {
              ...s,
              payment: 'Paid',
              paymentRecord: record,
            }
          : s,
      ),
    )
    closePayModal()
    showFlash(
      mode === 'edit'
        ? `${company}: payment details updated`
        : `${company}: marked Paid · optional payment record saved · statement PDF email + Earnings update (manual payout outside the system)`,
    )
  }

  function revertCompanyPaid(companyName) {
    setMenuOpen(null)
    onChangeScreens(
      screens.map((s) =>
        s.company === companyName
          ? { ...s, payment: 'Unpaid', paymentRecord: null }
          : s,
      ),
    )
    showFlash(
      `${companyName}: reverted to Unpaid · screen amounts editable again · fix and Mark as Paid when ready`,
    )
  }

  function startEdit(row) {
    if (!canEditScreenAmount(row)) return
    setEditingId(row.id)
    setEditValue(String(row.allocated))
  }

  function cancelEdit() {
    setEditingId(null)
    setEditValue('')
  }

  function commitEdit(row) {
    const original = row.originalAllocated ?? row.allocated
    const next = Number(editValue)
    if (!Number.isFinite(next)) {
      cancelEdit()
      return
    }
    const clamped = Math.max(0, Math.min(original, Math.round(next)))
    const earnings = Math.round((clamped * (row.sharePct || 0)) / 100)
    onChangeScreens(
      screens.map((s) =>
        s.id === row.id
          ? {
              ...s,
              allocated: clamped,
              earnings,
            }
          : s,
      ),
    )
    setEditingId(null)
    setEditValue('')
    if (clamped < original) {
      showFlash(
        `${row.screenId}: payable reduced ${money(original, currency)} → ${money(clamped, currency)} (online ${row.onlinePct}%). Appears on final invoice in Revenue.`,
      )
    } else {
      showFlash(`${row.screenId}: payable unchanged`)
    }
  }

  return (
    <section className="cd-panel">
      <div className="cd-panel-head">
        <h2>Finance · payables by company</h2>
        <p>
          Companies first — expand to locations, then screens. Online % =
          (guaranteed − missed) / guaranteed from Delivery & PoP — dense-loop
          extras do not raise it. Mark as Paid is blocked until that
          company&apos;s admin Proof of Play is complete. Edit a screen
          payable when Online is below {ONLINE_EDIT_THRESHOLD_PCT}% (decrease
          only).
        </p>
        <div
          ref={payableAnchorRef}
          className={`cd-fin-question-anchor field has-question ${payableFocused ? 'is-question-focus' : ''}`}
        >
          <RelatedQuestionChip
            questionId="Q05.2"
            title="Mark as Paid when online hours fall short"
            onOpen={() => onOpenQuestion?.('Q05.2')}
          />
        </div>
      </div>

      {flash && (
        <p className="cd-finance-flash" role="status">
          {flash}
        </p>
      )}

      <div className="cd-finance-stats cd-finance-stats-4">
        <div className="cd-kpi">
          <em>Original allocation</em>
          <strong>{money(stats.original, currency)}</strong>
          <span>Campaign screen totals</span>
        </div>
        <div className="cd-kpi">
          <em>Payable now</em>
          <strong>{money(stats.allocated, currency)}</strong>
          <span>
            {stats.adjustedCount > 0
              ? `${stats.adjustedCount} screen${stats.adjustedCount === 1 ? '' : 's'} adjusted · −${money(stats.withheld, currency)}`
              : 'No shortfall edits'}
          </span>
        </div>
        <div className="cd-kpi">
          <em>Company earnings</em>
          <strong>{money(stats.earnings, currency)}</strong>
          <span>After share / referral</span>
        </div>
        <div className="cd-kpi">
          <em>Companies paid</em>
          <strong>
            {stats.companiesPaid}/{stats.companiesTotal}
          </strong>
          <span>Outstanding {money(stats.outstanding, currency)}</span>
        </div>
      </div>

      {adjustments.length > 0 && (
        <div className="cd-finance-adjustments">
          <h3>Shortfall adjustments (final invoice)</h3>
          <ul>
            {adjustments.map((a) => (
              <li key={a.screenId}>
                <strong>{a.screenId}</strong> · {a.company} · online{' '}
                {a.onlinePct}% · {money(a.originalAllocated, currency)} →{' '}
                {money(a.allocated, currency)} (−{money(a.delta, currency)})
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="cd-finance-tree" role="tree">
        <div className="cd-fin-legend" aria-hidden="true">
          <span>
            <i className="cd-fin-level-dot company" /> Company
          </span>
          <span>
            <i className="cd-fin-level-dot location" /> Location
          </span>
          <span>
            <i className="cd-fin-level-dot screen" /> Screen
          </span>
        </div>

        {tree.map((co) => {
          const coOpen = openCompanies.has(co.company)
          const coPop = popByCompany.get(co.company) || {
            total: 0,
            done: 0,
            complete: true,
            remaining: 0,
          }
          const popBlocksPaid =
            co.status !== 'Paid' && coPop.total > 0 && !coPop.complete
          return (
            <div
              key={co.company}
              className={`cd-fin-company${coOpen ? ' is-open' : ''}`}
              role="treeitem"
              aria-expanded={coOpen}
            >
              <div className="cd-fin-row company">
                <button
                  type="button"
                  className="cd-fin-toggle"
                  aria-expanded={coOpen}
                  onClick={() => toggleCompany(co.company)}
                >
                  <span className="cd-fin-chevron">{coOpen ? '▾' : '▸'}</span>
                  <span className="cd-fin-identity">
                    <span className="cd-fin-level company">Company</span>
                    <strong className="cd-fin-title">{co.company}</strong>
                    <span className="meta">
                      {co.share} · {co.locationCount} location
                      {co.locationCount === 1 ? '' : 's'} · {co.screens.length}{' '}
                      screen{co.screens.length === 1 ? '' : 's'}
                      {co.status === 'Paid' && co.paymentRecord?.reference
                        ? ` · ref ${co.paymentRecord.reference}`
                        : ''}
                    </span>
                  </span>
                </button>
                <DeliveryMeter
                  pct={co.onlinePct}
                  actualH={co.actualH}
                  expectedH={co.expectedH}
                  size="lg"
                />
                <div className="cd-fin-money">
                  <span className="cd-fin-money-label">Payable</span>
                  <span className="mono">
                    {money(co.allocated, currency)}
                    {co.allocated < co.originalAllocated && (
                      <span className="cd-fin-was">
                        was {money(co.originalAllocated, currency)}
                      </span>
                    )}
                  </span>
                  <span className="mono muted">
                    earn {money(co.earnings, currency)}
                  </span>
                </div>
                {coPop.total > 0 && (
                  <span
                    className={`cd-pop-chip ${coPop.complete ? 'ok' : coPop.done > 0 ? 'ready' : 'warn'}`}
                    title="Admin Proof of Play progress for this company"
                  >
                    {formatPopProgress(coPop)}
                  </span>
                )}
                <span
                  className={`cd-pill ${
                    co.status === 'Paid'
                      ? 'ok'
                      : co.status === 'Partial'
                        ? 'ready'
                        : 'warn'
                  }`}
                >
                  {co.status}
                </span>
                {co.status === 'Paid' ? (
                  <div
                    className="cd-fin-menu-wrap"
                    ref={menuOpen === co.company ? menuRef : null}
                  >
                    <button
                      type="button"
                      className="cd-fin-menu-btn"
                      aria-label={`Actions for ${co.company}`}
                      aria-expanded={menuOpen === co.company}
                      aria-haspopup="menu"
                      onClick={() =>
                        setMenuOpen((prev) =>
                          prev === co.company ? null : co.company,
                        )
                      }
                    >
                      ⋮
                    </button>
                    {menuOpen === co.company && (
                      <div className="cd-fin-menu" role="menu">
                        <button
                          type="button"
                          role="menuitem"
                          onClick={() => openEditPayment(co.company)}
                        >
                          Edit payment details
                        </button>
                        <button
                          type="button"
                          role="menuitem"
                          className="danger"
                          onClick={() => revertCompanyPaid(co.company)}
                        >
                          Mark as Unpaid
                        </button>
                      </div>
                    )}
                  </div>
                ) : (
                  <button
                    type="button"
                    className="btn-primary compact"
                    disabled={popBlocksPaid}
                    title={
                      popBlocksPaid
                        ? `Complete PoP first (${coPop.done}/${coPop.total}) in Delivery & PoP`
                        : 'Record offline payment'
                    }
                    onClick={() => {
                      if (popBlocksPaid) return
                      openMarkPaid(co.company)
                    }}
                  >
                    Mark as Paid
                  </button>
                )}
              </div>

              {coOpen && (
                <div className="cd-fin-locations">
                  {co.locations.map((loc) => {
                    const locKey = `${co.company}::${loc.location}`
                    const locOpen = openLocations.has(locKey)
                    return (
                      <div
                        key={locKey}
                        className={`cd-fin-location${locOpen ? ' is-open' : ''}`}
                        role="group"
                      >
                        <button
                          type="button"
                          className="cd-fin-row location"
                          aria-expanded={locOpen}
                          onClick={() => toggleLocation(locKey)}
                        >
                          <span className="cd-fin-chevron">
                            {locOpen ? '▾' : '▸'}
                          </span>
                          <span className="cd-fin-identity">
                            <span className="cd-fin-level location">
                              Location
                            </span>
                            <strong className="cd-fin-title">
                              {loc.location}
                            </strong>
                            <span className="meta">
                              {loc.screens.length} screen
                              {loc.screens.length === 1 ? '' : 's'}
                            </span>
                          </span>
                          <DeliveryMeter
                            pct={loc.onlinePct}
                            actualH={loc.actualH}
                            expectedH={loc.expectedH}
                            size="sm"
                          />
                          <div className="cd-fin-money">
                            <span className="mono">
                              {money(loc.allocated, currency)}
                            </span>
                            <span className="mono muted">
                              earn {money(loc.earnings, currency)}
                            </span>
                          </div>
                        </button>

                        {locOpen && (
                          <div className="cd-fin-screens">
                            <div className="cd-fin-screens-head">
                              <span className="cd-fin-level screen">
                                Screens
                              </span>
                              <span className="meta">
                                Per-screen payable · edit when online &lt;{' '}
                                {ONLINE_EDIT_THRESHOLD_PCT}%
                              </span>
                            </div>
                            <table className="cd-table compact cd-fin-screen-table">
                              <thead>
                                <tr>
                                  <th>Screen</th>
                                  <th>Of guarantee</th>
                                  <th>Total played</th>
                                  <th>Guaranteed</th>
                                  <th>Missed</th>
                                  <th>Extra</th>
                                  <th>Allocated</th>
                                  <th>Earnings</th>
                                  <th />
                                </tr>
                              </thead>
                              <tbody>
                                {loc.screens.map((row) => {
                                  const editable = canEditScreenAmount(row)
                                  const isEditing = editingId === row.id
                                  const reduced =
                                    (row.allocated || 0) <
                                    (row.originalAllocated ?? row.allocated)
                                  const play = playByScreen.get(row.screenId)
                                  return (
                                    <tr key={row.id}>
                                      <td>
                                        <strong>{row.screenId}</strong>
                                        <span className="meta">
                                          {row.name}
                                          {play ? ` · ${play.modeShort}` : ''}
                                        </span>
                                      </td>
                                      <td className="mono">
                                        <span
                                          className={`cd-pill ${onlineTone(row.onlinePct)}`}
                                          title="Of guarantee — max 100%"
                                        >
                                          {formatPct(
                                            play?.guaranteedDeliveryPct ??
                                              row.onlinePct,
                                          )}
                                        </span>
                                        <span className="meta">
                                          {row.actualH}h / {row.expectedH}h
                                        </span>
                                      </td>
                                      <td className="mono">
                                        <span
                                          className="cd-pd-pct total-pct"
                                          title="Total played vs guarantee — can exceed 100%"
                                        >
                                          <strong>
                                            {formatPct(play?.totalPlayPct)}
                                          </strong>
                                        </span>
                                      </td>
                                      <td className="mono">
                                        {play ? (
                                          <span className="cd-pd-metric guaranteed">
                                            <strong>
                                              {formatPlays(play.guaranteedPlays)}
                                            </strong>
                                            <em>
                                              {formatDuration(play.guaranteedSec)}
                                            </em>
                                          </span>
                                        ) : (
                                          '—'
                                        )}
                                      </td>
                                      <td className="mono">
                                        {play?.missedPlays != null ? (
                                          <span className="cd-pd-metric missed">
                                            <strong>
                                              {formatPlays(play.missedPlays)}
                                            </strong>
                                            <em>
                                              {formatDuration(play.missedSec)}
                                            </em>
                                          </span>
                                        ) : (
                                          '—'
                                        )}
                                      </td>
                                      <td className="mono">
                                        {play?.extraPlays != null ? (
                                          <span className="cd-pd-metric extra">
                                            <strong>
                                              {formatPlays(play.extraPlays)}
                                            </strong>
                                            <em>
                                              {formatDuration(play.extraSec)}
                                            </em>
                                          </span>
                                        ) : (
                                          '—'
                                        )}
                                      </td>
                                      <td className="mono">
                                        {isEditing ? (
                                          <input
                                            className="cd-fin-amount-input"
                                            type="number"
                                            min={0}
                                            max={
                                              row.originalAllocated ??
                                              row.allocated
                                            }
                                            step={1}
                                            value={editValue}
                                            onChange={(e) =>
                                              setEditValue(e.target.value)
                                            }
                                            onKeyDown={(e) => {
                                              if (e.key === 'Enter') {
                                                e.preventDefault()
                                                commitEdit(row)
                                              }
                                              if (e.key === 'Escape')
                                                cancelEdit()
                                            }}
                                            autoFocus
                                          />
                                        ) : (
                                          <>
                                            <strong>
                                              {money(row.allocated, currency)}
                                            </strong>
                                            {reduced && (
                                              <span className="meta">
                                                was{' '}
                                                {money(
                                                  row.originalAllocated,
                                                  currency,
                                                )}
                                              </span>
                                            )}
                                          </>
                                        )}
                                      </td>
                                      <td className="mono">
                                        {money(row.earnings, currency)}
                                      </td>
                                      <td className="actions">
                                        {row.payment === 'Paid' ? (
                                          <span className="cd-pill ok">
                                            Paid
                                          </span>
                                        ) : isEditing ? (
                                          <>
                                            <button
                                              type="button"
                                              className="btn-primary compact"
                                              onClick={() => commitEdit(row)}
                                            >
                                              Save
                                            </button>
                                            <button
                                              type="button"
                                              className="btn-ghost compact"
                                              onClick={cancelEdit}
                                            >
                                              Cancel
                                            </button>
                                          </>
                                        ) : editable ? (
                                          <button
                                            type="button"
                                            className="btn-ghost compact"
                                            title={`Online ${row.onlinePct}% < ${ONLINE_EDIT_THRESHOLD_PCT}% — decrease only`}
                                            onClick={() => startEdit(row)}
                                          >
                                            Edit amount
                                          </button>
                                        ) : (
                                          <span className="cd-fin-locked">
                                            {row.onlinePct >=
                                            ONLINE_EDIT_THRESHOLD_PCT
                                              ? `≥${ONLINE_EDIT_THRESHOLD_PCT}%`
                                              : '—'}
                                          </span>
                                        )}
                                      </td>
                                    </tr>
                                  )
                                })}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {payModal && (
        <div
          className="cd-pay-backdrop"
          onClick={closePayModal}
          role="presentation"
        >
          <div
            className="cd-pay-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="cd-pay-title"
            onClick={(e) => e.stopPropagation()}
          >
            <header className="cd-pay-head">
              <div>
                <h2 id="cd-pay-title">
                  {payModal.mode === 'edit'
                    ? 'Edit payment details'
                    : 'Record offline payment'}
                </h2>
                <p>
                  {payModal.company} ·{' '}
                  {money(payModal.earnings, currency)} company earnings · all
                  fields optional (payouts are manual outside the system)
                </p>
              </div>
              <button
                type="button"
                className="btn-ghost compact"
                onClick={closePayModal}
              >
                Close
              </button>
            </header>

            <div className="cd-pay-body">
              <label className="cd-pay-field">
                <span>Paid at (date & time)</span>
                <input
                  type="datetime-local"
                  value={payForm.paidAt}
                  onChange={(e) =>
                    setPayForm((f) => ({ ...f, paidAt: e.target.value }))
                  }
                />
              </label>

              <label className="cd-pay-field">
                <span>Payment method</span>
                <select
                  value={payForm.method}
                  onChange={(e) =>
                    setPayForm((f) => ({ ...f, method: e.target.value }))
                  }
                >
                  {PAYMENT_METHODS.map((m) => (
                    <option key={m.value || 'none'} value={m.value}>
                      {m.label}
                    </option>
                  ))}
                </select>
              </label>

              <label className="cd-pay-field">
                <span>Reference / tracking number</span>
                <input
                  type="text"
                  placeholder="Bank ref, UTR, SWIFT conf., cheque no…"
                  value={payForm.reference}
                  onChange={(e) =>
                    setPayForm((f) => ({ ...f, reference: e.target.value }))
                  }
                />
                <em className="cd-pay-hint">
                  One field covers bank transfer reference, wire confirmation,
                  cheque number, or local instant-pay ID.
                </em>
              </label>

              <label className="cd-pay-field">
                <span>Notes</span>
                <textarea
                  rows={2}
                  placeholder="Reconciliation note, bounce reason, internal memo…"
                  value={payForm.notes}
                  onChange={(e) =>
                    setPayForm((f) => ({ ...f, notes: e.target.value }))
                  }
                />
              </label>

              <label className="cd-pay-field">
                <span>Receipt photo / slip</span>
                <input
                  type="file"
                  accept="image/*,.pdf"
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    setPayForm((f) => ({
                      ...f,
                      receiptName: file ? file.name : '',
                    }))
                  }}
                />
                {payForm.receiptName ? (
                  <em className="cd-pay-hint">Attached: {payForm.receiptName}</em>
                ) : (
                  <em className="cd-pay-hint">
                    Optional image or PDF of the transfer slip / cheque scan.
                  </em>
                )}
              </label>

              {(payForm.method || payForm.reference || payForm.paidAt) && (
                <p className="cd-pay-preview meta">
                  Preview: {payForm.paidAt || 'no date'} ·{' '}
                  {methodLabel(payForm.method)}
                  {payForm.reference ? ` · ${payForm.reference}` : ''}
                </p>
              )}
            </div>

            <footer className="cd-pay-foot">
              <button
                type="button"
                className="btn-ghost"
                onClick={closePayModal}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn-primary"
                onClick={confirmPayModal}
              >
                {payModal.mode === 'edit' ? 'Save details' : 'Confirm Paid'}
              </button>
            </footer>
          </div>
        </div>
      )}
    </section>
  )
}
