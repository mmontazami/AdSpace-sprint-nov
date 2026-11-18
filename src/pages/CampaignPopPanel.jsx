import { useMemo, useState } from 'react'
import {
  buildPopUnits,
  creativesOnScreen,
  formatPopProgress,
  popUnitsForScreen,
  popUnitsForScreenCreative,
  summarizePopByScreen,
  summarizePopUnits,
} from '../data/campaignProofOfPlay'
import {
  buildPlayDeliveryRows,
  buildPlayDeliveryTree,
  formatDuration,
  formatPct,
  formatPlays,
  sumPlayMetrics,
} from '../data/playDelivery'

function statusClass(status) {
  if (status === 'Healthy' || status === 'Planned') return 'ok'
  if (status === 'Watch') return 'ready'
  if (status === 'Needs review') return 'warn'
  return 'hold'
}

function popTone(summary) {
  if (!summary || summary.total === 0) return 'hold'
  if (summary.complete) return 'ok'
  if (summary.done > 0) return 'ready'
  return 'warn'
}

function PopChip({ summary, size = 'sm' }) {
  const tone = popTone(summary)
  return (
    <span
      className={`cd-pop-chip ${tone} ${size === 'lg' ? 'lg' : ''}`}
      title="Admin Proof of Play · 1 media × 1 screen"
    >
      {formatPopProgress(summary)}
    </span>
  )
}

/** Always-labeled metric cell — readable without relying on a distant header. */
function MetricCell({ label, plays, sec, tone, title }) {
  return (
    <div className={`cd-pd-cell ${tone || ''}`} title={title || label}>
      <em>{label}</em>
      <strong>{formatPlays(plays)}</strong>
      <span>{formatDuration(sec)}</span>
    </div>
  )
}

function PctCell({ label, pct, tone, title }) {
  return (
    <div className={`cd-pd-cell pct ${tone || ''}`} title={title || label}>
      <em>{label}</em>
      <strong>{formatPct(pct)}</strong>
    </div>
  )
}

function PopCell({ summary }) {
  return (
    <div className="cd-pd-cell pop">
      <em>PoP</em>
      <PopChip summary={summary} />
    </div>
  )
}

/** Shared metric strip for company / location rollups. */
function RollupMetrics({ metrics, popSummary, plannedOnly }) {
  return (
    <div className={`cd-pd-rollup${plannedOnly ? ' planned' : ''}`}>
      <MetricCell
        label="Guaranteed"
        plays={metrics.guaranteedPlays}
        sec={metrics.guaranteedSec}
        tone="guaranteed"
        title="Minimum guaranteed plays / airtime"
      />
      {!plannedOnly && (
        <>
          <PctCell
            label="Of guarantee"
            pct={metrics.hasActual ? metrics.guaranteedDeliveryPct : null}
            tone="guaranteed-pct"
            title="Share of promised floor that ran (max 100%)"
          />
          <PctCell
            label="Total played"
            pct={metrics.hasActual ? metrics.totalPlayPct : null}
            tone="total-pct"
            title="All plays vs guarantee (can exceed 100%)"
          />
          <MetricCell
            label="Actual"
            plays={metrics.hasActual ? metrics.actualPlays : null}
            sec={metrics.hasActual ? metrics.actualSec : null}
            tone="actual"
          />
          <MetricCell
            label="Missed"
            plays={metrics.hasActual ? metrics.missedPlays : null}
            sec={metrics.hasActual ? metrics.missedSec : null}
            tone="missed"
            title="Missed offline"
          />
          <MetricCell
            label="Extra"
            plays={metrics.hasActual ? metrics.extraPlays : null}
            sec={metrics.hasActual ? metrics.extraSec : null}
            tone="extra"
            title="Extra from dense loops"
          />
          <PopCell summary={popSummary} />
        </>
      )}
    </div>
  )
}

function TotalsBar({ metrics, popSummary, plannedOnly }) {
  return (
    <div
      className={`cd-pop-totals cd-pd-totals${plannedOnly ? ' planned' : ''}`}
    >
      <div>
        <em>Screens</em>
        <strong>{metrics.count}</strong>
      </div>
      <div>
        <em>Guaranteed (min)</em>
        <strong>{formatPlays(metrics.guaranteedPlays)}</strong>
        <span>{formatDuration(metrics.guaranteedSec)}</span>
      </div>
      {!plannedOnly && (
        <>
          <div>
            <em>Of guarantee</em>
            <strong>
              {metrics.hasActual
                ? formatPct(metrics.guaranteedDeliveryPct)
                : '—'}
            </strong>
            <span>Max 100%</span>
          </div>
          <div className="tone-extra">
            <em>Total played</em>
            <strong>
              {metrics.hasActual ? formatPct(metrics.totalPlayPct) : '—'}
            </strong>
            <span>Can exceed 100%</span>
          </div>
          <div>
            <em>Actual</em>
            <strong>
              {metrics.hasActual ? formatPlays(metrics.actualPlays) : '—'}
            </strong>
            <span>
              {metrics.hasActual ? formatDuration(metrics.actualSec) : '—'}
            </span>
          </div>
          <div className="tone-warn">
            <em>Missed (offline)</em>
            <strong>
              {metrics.hasActual ? formatPlays(metrics.missedPlays) : '—'}
            </strong>
            <span>
              {metrics.hasActual ? formatDuration(metrics.missedSec) : '—'}
            </span>
          </div>
          <div className="tone-extra">
            <em>Extra (dense loops)</em>
            <strong>
              {metrics.hasActual ? formatPlays(metrics.extraPlays) : '—'}
            </strong>
            <span>
              {metrics.hasActual ? formatDuration(metrics.extraSec) : '—'}
            </span>
          </div>
          <div className={`tone-pop ${popTone(popSummary)}`}>
            <em>Proof of Play</em>
            <strong>
              {popSummary.total > 0
                ? `${popSummary.done}/${popSummary.total}`
                : '—'}
            </strong>
            <span>
              {popSummary.complete
                ? 'All verified'
                : popSummary.remaining
                  ? `${popSummary.remaining} remaining`
                  : 'Admin toggle'}
            </span>
          </div>
        </>
      )}
    </div>
  )
}

function initialDraftMap(units, verifiedMap) {
  const next = {}
  for (const u of units) next[u.id] = Boolean(verifiedMap[u.id])
  return next
}

function ManagePopModal({
  screenId,
  screenName,
  creativeName,
  units,
  verifiedMap,
  onClose,
  onSave,
}) {
  const [draftMap, setDraftMap] = useState(() =>
    initialDraftMap(units, verifiedMap),
  )

  const draftSummary = summarizePopUnits(units, draftMap)

  function toggle(id) {
    setDraftMap((prev) => ({ ...prev, [id]: !prev[id] }))
  }

  function markAll(value) {
    const next = {}
    for (const u of units) next[u.id] = value
    setDraftMap(next)
  }

  return (
    <div className="cd-pay-backdrop" role="presentation" onClick={onClose}>
      <div
        className="cd-pay-modal cd-pop-manage-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="cd-pop-manage-title"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="cd-pay-head">
          <div>
            <h2 id="cd-pop-manage-title">Manage Proof of Play</h2>
            <p>
              {screenId} · {screenName} · {creativeName}
            </p>
          </div>
          <button type="button" className="btn-ghost compact" onClick={onClose}>
            Close
          </button>
        </header>

        <p className="cd-pop-manage-blurb">
          One admin check per distinct media on this screen. Slot count is
          airtime only — an 18s file still needs one PoP.
        </p>

        <div className="cd-pop-manage-toolbar">
          <PopChip summary={draftSummary} size="lg" />
          <div className="cd-pop-manage-bulk">
            <button
              type="button"
              className="btn-ghost compact"
              onClick={() => markAll(true)}
            >
              Check all
            </button>
            <button
              type="button"
              className="btn-ghost compact"
              onClick={() => markAll(false)}
            >
              Clear all
            </button>
          </div>
        </div>

        <ul className="cd-pop-media-list">
          {units.map((u) => {
            const checked = Boolean(draftMap[u.id])
            return (
              <li key={u.id} className={checked ? 'is-verified' : ''}>
                <div
                  className="cd-pop-media-thumb"
                  style={{ background: u.thumb || 'rgba(44,56,72,0.9)' }}
                  aria-hidden="true"
                >
                  <span>{u.type === 'video' ? '▶' : '▣'}</span>
                </div>
                <div className="cd-pop-media-meta">
                  <strong>{u.name}</strong>
                  <span className="meta">
                    {u.slots} slot{u.slots === 1 ? '' : 's'}
                    {u.durationLabel ? ` · ${u.durationLabel}` : ''}
                    {u.orientation ? ` · ${u.orientation}` : ''}
                  </span>
                </div>
                <label className="cd-pop-check">
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => toggle(u.id)}
                  />
                  <span>{checked ? 'Verified' : 'Pending'}</span>
                </label>
              </li>
            )
          })}
        </ul>

        <footer className="cd-pay-foot">
          <button type="button" className="btn-ghost" onClick={onClose}>
            Cancel
          </button>
          <button
            type="button"
            className="btn-primary"
            onClick={() => onSave(draftMap)}
          >
            Save PoP
          </button>
        </footer>
      </div>
    </div>
  )
}

function ScreenDeliveryTable({
  screens,
  plannedOnly,
  openScreens,
  onToggleScreen,
  popByScreen,
  popUnits,
  popVerified,
  onManagePop,
}) {
  const colCount = plannedOnly ? 5 : 12

  return (
    <div className="table-wrap cd-pd-table-wrap">
      <table className="cd-table compact cd-pd-screen-table">
        <thead>
          <tr>
            <th className="cd-pd-col-expand" title="Open PoP creatives">
              PoP
            </th>
            <th>Screen</th>
            <th>Mode</th>
            <th>Creatives</th>
            <th>Guaranteed</th>
            {!plannedOnly && (
              <>
                <th title="Share of promised floor that ran (max 100%)">
                  Of guarantee
                </th>
                <th title="All plays vs guarantee (can exceed 100%)">
                  Total played
                </th>
                <th>Actual</th>
                <th title="Missed offline">Missed</th>
                <th title="Extra from dense loops">Extra</th>
                <th>Status</th>
                <th title="Admin Proof of Play">PoP</th>
              </>
            )}
          </tr>
        </thead>
        <tbody>
          {screens.map((row) => {
            const screenOpen = openScreens.has(row.screenId)
            const screenPop = popByScreen.get(row.screenId) || {
              total: 0,
              done: 0,
              complete: false,
              remaining: 0,
            }
            const creativeRows =
              row.creativeRefs?.length > 0
                ? row.creativeRefs
                : creativesOnScreen(popUnits, row.screenId)

            return (
              <ScreenTableBlock
                key={row.screenId}
                row={row}
                plannedOnly={plannedOnly}
                colCount={colCount}
                screenOpen={screenOpen}
                screenPop={screenPop}
                creativeRows={creativeRows}
                popUnits={popUnits}
                popVerified={popVerified}
                onToggle={() => onToggleScreen(row.screenId)}
                onManagePop={onManagePop}
              />
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

function ScreenTableBlock({
  row,
  plannedOnly,
  colCount,
  screenOpen,
  screenPop,
  creativeRows,
  popUnits,
  popVerified,
  onToggle,
  onManagePop,
}) {
  const creativeCount = creativeRows.length
  const expandHint = screenOpen
    ? 'Hide PoP creatives'
    : `Show ${creativeCount} creative${creativeCount === 1 ? '' : 's'} for PoP`

  return (
    <>
      <tr
        className={`cd-pd-screen-tr${screenOpen ? ' is-open' : ''}${plannedOnly ? '' : ' is-expandable'}`}
        onClick={plannedOnly ? undefined : onToggle}
        aria-expanded={plannedOnly ? undefined : screenOpen}
        title={plannedOnly ? undefined : expandHint}
      >
        <td className="cd-pd-col-expand">
          {!plannedOnly && (
            <span
              className={`cd-pd-expand-btn${screenOpen ? ' is-open' : ''}`}
              aria-hidden="true"
            >
              <span className="cd-pd-expand-chevron">
                {screenOpen ? '▾' : '▸'}
              </span>
              <span className="cd-pd-expand-label">PoP</span>
            </span>
          )}
        </td>
        <td>
          <strong className="cd-pd-screen-id">{row.screenId}</strong>
          <span className="meta">{row.screenName}</span>
          {!plannedOnly && (
            <span className={`cd-pd-row-hint${screenOpen ? ' is-open' : ''}`}>
              {screenOpen
                ? 'PoP creatives open below'
                : 'Click row → PoP by creative'}
            </span>
          )}
        </td>
        <td>
          <span className="cd-pd-mode">{row.modeShort}</span>
          <span className="meta">{row.modeLabel}</span>
        </td>
        <td>
          <div className="cd-pd-creative-tags">
            {creativeRows.map((cr) => (
              <span key={cr.id || cr.name} className="cd-pop-creative">
                {cr.name}
              </span>
            ))}
          </div>
        </td>
        <td className="mono">
          <span className="cd-pd-stack guaranteed">
            <strong>{formatPlays(row.guaranteedPlays)}</strong>
            <em>{formatDuration(row.guaranteedSec)}</em>
          </span>
        </td>
        {!plannedOnly && (
          <>
            <td className="mono">
              <span className="cd-pd-stack guaranteed-pct">
                <strong>{formatPct(row.guaranteedDeliveryPct)}</strong>
              </span>
            </td>
            <td className="mono">
              <span className="cd-pd-stack total-pct">
                <strong>{formatPct(row.totalPlayPct)}</strong>
              </span>
            </td>
            <td className="mono">
              <span className="cd-pd-stack actual">
                <strong>{formatPlays(row.actualPlays)}</strong>
                <em>{formatDuration(row.actualSec)}</em>
              </span>
            </td>
            <td className="mono">
              <span className="cd-pd-stack missed">
                <strong>{formatPlays(row.missedPlays)}</strong>
                <em>{formatDuration(row.missedSec)}</em>
              </span>
            </td>
            <td className="mono">
              <span className="cd-pd-stack extra">
                <strong>{formatPlays(row.extraPlays)}</strong>
                <em>{formatDuration(row.extraSec)}</em>
              </span>
            </td>
            <td>
              <span className={`cd-pill ${statusClass(row.status)}`}>
                {row.status}
              </span>
              {row.fillNote ? (
                <span className="meta cd-pd-fill-note">{row.fillNote}</span>
              ) : null}
            </td>
            <td>
              <div className="cd-pd-pop-cell">
                <PopChip summary={screenPop} />
                <span className="cd-pd-pop-open-link">
                  {screenOpen ? 'Hide' : 'Open'}
                </span>
              </div>
            </td>
          </>
        )}
      </tr>

      {screenOpen && !plannedOnly && (
        <tr className="cd-pd-pop-detail-tr">
          <td colSpan={colCount}>
            <div className="cd-pd-pop-detail">
              <div className="cd-pd-pop-detail-rail" aria-hidden="true" />
              <div className="cd-pd-pop-detail-body">
                <div className="cd-pd-pop-detail-head">
                  <div>
                    <span className="cd-pd-pop-kicker">Proof of Play</span>
                    <strong>
                      {creativeCount} creative
                      {creativeCount === 1 ? '' : 's'} on {row.screenId}
                    </strong>
                    <span className="meta">
                      Verify each media for this screen, then Save in Manage
                      PoP
                    </span>
                  </div>
                  <PopChip summary={screenPop} size="lg" />
                </div>

                {creativeRows.length === 0 ? (
                  <p className="cd-pop-empty nested">
                    No creatives / media on this screen.
                  </p>
                ) : (
                  <ul className="cd-pd-creative-cards">
                    {creativeRows.map((cr) => {
                      const mediaUnits = popUnitsForScreenCreative(
                        popUnits,
                        row.screenId,
                        cr.id,
                      )
                      const crPop = summarizePopUnits(mediaUnits, popVerified)
                      return (
                        <li
                          key={cr.id}
                          className={`cd-pd-creative-card${crPop.complete ? ' is-done' : ''}`}
                        >
                          <div className="cd-pd-creative-card-top">
                            <div className="cd-pd-creative-card-title">
                              <span className="cd-fin-level creative">
                                Creative
                              </span>
                              <strong>{cr.name}</strong>
                              <span className="meta">
                                {mediaUnits.length} media · 1 PoP each
                              </span>
                            </div>
                            <div className="cd-pd-creative-card-actions">
                              <PopChip summary={crPop} />
                              <button
                                type="button"
                                className="btn-primary compact"
                                disabled={mediaUnits.length === 0}
                                onClick={(e) => {
                                  e.stopPropagation()
                                  onManagePop(row, cr)
                                }}
                              >
                                Manage PoP
                              </button>
                            </div>
                          </div>

                          <div className="cd-pd-creative-media-grid">
                            {mediaUnits.length === 0 ? (
                              <span className="meta">No media in this creative</span>
                            ) : (
                              mediaUnits.map((m) => {
                                const verified = Boolean(popVerified[m.id])
                                return (
                                  <div
                                    key={m.id}
                                    className={`cd-pd-media-tile${verified ? ' is-on' : ''}`}
                                    title={`${m.name} · ${m.slots} slot${m.slots === 1 ? '' : 's'}${m.durationLabel ? ` · ${m.durationLabel}` : ''}`}
                                  >
                                    <div
                                      className="cd-pd-media-tile-thumb"
                                      style={{
                                        background:
                                          m.thumb || 'rgba(44,56,72,0.9)',
                                      }}
                                    >
                                      <span>
                                        {m.type === 'video' ? '▶' : '▣'}
                                      </span>
                                      {verified && (
                                        <em className="cd-pd-media-tile-check">
                                          ✓
                                        </em>
                                      )}
                                    </div>
                                    <div className="cd-pd-media-tile-meta">
                                      <strong>{m.name}</strong>
                                      <span>
                                        {m.slots} slot
                                        {m.slots === 1 ? '' : 's'}
                                        {m.durationLabel
                                          ? ` · ${m.durationLabel}`
                                          : ''}
                                      </span>
                                      <span
                                        className={`cd-pd-media-tile-state${verified ? ' on' : ''}`}
                                      >
                                        {verified ? 'Verified' : 'Pending'}
                                      </span>
                                    </div>
                                  </div>
                                )
                              })
                            )}
                          </div>
                        </li>
                      )
                    })}
                  </ul>
                )}
              </div>
            </div>
          </td>
        </tr>
      )}
    </>
  )
}

/**
 * Play delivery + admin Proof of Play.
 * Company → location rollups, then a clear screen delivery table;
 * expand a screen row for PoP by creative.
 */
export default function CampaignPopPanel({
  draft,
  plannedOnly = false,
  title = 'Play delivery & Proof of Play',
  blurb,
  popVerified = {},
  onChangePopVerified,
}) {
  const rows = useMemo(
    () => buildPlayDeliveryRows(draft, { plannedOnly }),
    [draft, plannedOnly],
  )

  const popUnits = useMemo(() => buildPopUnits(draft), [draft])
  const popByScreen = useMemo(
    () => summarizePopByScreen(popUnits, popVerified),
    [popUnits, popVerified],
  )

  const companies = useMemo(
    () => [...new Set(rows.map((r) => r.company))].sort(),
    [rows],
  )
  const locations = useMemo(
    () => [...new Set(rows.map((r) => r.location))].sort(),
    [rows],
  )
  const creatives = useMemo(
    () => [...new Set(rows.flatMap((r) => r.creatives))].sort(),
    [rows],
  )

  const [query, setQuery] = useState('')
  const [company, setCompany] = useState('all')
  const [location, setLocation] = useState('all')
  const [creative, setCreative] = useState('all')
  const [status, setStatus] = useState('all')
  const [popFilter, setPopFilter] = useState('all')
  const [openCompanies, setOpenCompanies] = useState(() => new Set())
  const [openLocations, setOpenLocations] = useState(() => new Set())
  const [openScreens, setOpenScreens] = useState(() => new Set())
  const [manageTarget, setManageTarget] = useState(null)
  const [savedFlash, setSavedFlash] = useState(null)

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase()
    return rows.filter((r) => {
      if (company !== 'all' && r.company !== company) return false
      if (location !== 'all' && r.location !== location) return false
      if (creative !== 'all' && !r.creatives.includes(creative)) return false
      if (status !== 'all' && r.status !== status) return false
      const pop = popByScreen.get(r.screenId) || {
        total: 0,
        done: 0,
        complete: false,
      }
      if (popFilter === 'complete' && !pop.complete) return false
      if (popFilter === 'incomplete' && (pop.complete || pop.total === 0)) {
        return false
      }
      if (!q) return true
      const hay =
        `${r.screenId} ${r.screenName} ${r.company} ${r.location} ${r.creatives.join(' ')} ${r.modeShort}`.toLowerCase()
      return hay.includes(q)
    })
  }, [
    rows,
    query,
    company,
    location,
    creative,
    status,
    popFilter,
    popByScreen,
  ])

  const tree = useMemo(() => buildPlayDeliveryTree(visible), [visible])
  const totals = useMemo(() => sumPlayMetrics(visible), [visible])
  const visiblePopUnits = useMemo(() => {
    const ids = new Set(visible.map((r) => r.screenId))
    return popUnits.filter((u) => ids.has(u.screenId))
  }, [popUnits, visible])
  const popTotals = useMemo(
    () => summarizePopUnits(visiblePopUnits, popVerified),
    [visiblePopUnits, popVerified],
  )

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

  function toggleScreen(screenId) {
    setOpenScreens((prev) => {
      const next = new Set(prev)
      if (next.has(screenId)) next.delete(screenId)
      else next.add(screenId)
      return next
    })
  }

  function companyPopSummary(screens) {
    const units = screens.flatMap((s) =>
      popUnitsForScreen(popUnits, s.screenId),
    )
    return summarizePopUnits(units, popVerified)
  }

  function openManage(screen, creativeRef) {
    setManageTarget({
      screenId: screen.screenId,
      screenName: screen.screenName,
      creativeId: creativeRef.id,
      creativeName: creativeRef.name,
    })
  }

  function saveManage(draftMap) {
    if (!onChangePopVerified || !manageTarget) {
      setManageTarget(null)
      return
    }
    const next = { ...popVerified }
    for (const [id, on] of Object.entries(draftMap)) {
      if (on) next[id] = true
      else delete next[id]
    }
    onChangePopVerified(next)
    setSavedFlash(
      `${manageTarget.screenId} · ${manageTarget.creativeName}: PoP saved`,
    )
    setManageTarget(null)
    window.setTimeout(() => setSavedFlash(null), 2200)
  }

  const manageUnits = manageTarget
    ? popUnitsForScreenCreative(
        popUnits,
        manageTarget.screenId,
        manageTarget.creativeId,
      )
    : []

  const defaultBlurb = plannedOnly
    ? 'Minimum guaranteed plays and ad airtime at full content/ad mode capacity for the selected screens and schedule. Actual delivery appears after the campaign runs.'
    : 'Screen table shows delivery the same way as before. Expand a screen only for Proof of Play by creative — admin toggle per media, no photos.'

  return (
    <div className="cd-pop-panel">
      <div className="cd-panel-head">
        <h2>{title}</h2>
        <p>{blurb || defaultBlurb}</p>
      </div>

      {savedFlash && <p className="cd-pop-flash">{savedFlash}</p>}

      <TotalsBar
        metrics={totals}
        popSummary={popTotals}
        plannedOnly={plannedOnly}
      />

      <div className="cd-pd-legend" aria-hidden="true">
        <span>
          <i className="cd-pd-swatch guaranteed" /> Guaranteed min
        </span>
        {!plannedOnly && (
          <>
            <span>
              <i className="cd-pd-swatch guaranteed-pct" /> Of guarantee (≤100%)
            </span>
            <span>
              <i className="cd-pd-swatch total-pct" /> Total played (can &gt;100%)
            </span>
            <span>
              <i className="cd-pd-swatch actual" /> Actual
            </span>
            <span>
              <i className="cd-pd-swatch missed" /> Missed offline
            </span>
            <span>
              <i className="cd-pd-swatch extra" /> Extra dense loops
            </span>
            <span>
              <i className="cd-pd-swatch pop" /> Admin PoP
            </span>
          </>
        )}
      </div>

      <div className="cd-pop-filters">
        <label className="field grow">
          <span>Search</span>
          <input
            type="search"
            placeholder="Screen, company, location, creative…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </label>
        <label className="field">
          <span>Company</span>
          <select value={company} onChange={(e) => setCompany(e.target.value)}>
            <option value="all">All companies</option>
            {companies.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </label>
        <label className="field">
          <span>Location</span>
          <select
            value={location}
            onChange={(e) => setLocation(e.target.value)}
          >
            <option value="all">All locations</option>
            {locations.map((l) => (
              <option key={l} value={l}>
                {l}
              </option>
            ))}
          </select>
        </label>
        <label className="field">
          <span>Creative</span>
          <select
            value={creative}
            onChange={(e) => setCreative(e.target.value)}
          >
            <option value="all">All creatives</option>
            {creatives.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </label>
        {!plannedOnly && (
          <>
            <label className="field">
              <span>Delivery status</span>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
              >
                <option value="all">All statuses</option>
                <option value="Healthy">Healthy</option>
                <option value="Watch">Watch</option>
                <option value="Needs review">Needs review</option>
                <option value="No telemetry">No telemetry</option>
              </select>
            </label>
            <label className="field">
              <span>PoP</span>
              <select
                value={popFilter}
                onChange={(e) => setPopFilter(e.target.value)}
              >
                <option value="all">All PoP</option>
                <option value="incomplete">Incomplete</option>
                <option value="complete">Complete</option>
              </select>
            </label>
          </>
        )}
      </div>

      <div className="cd-pd-tree" role="tree">
        {tree.length === 0 ? (
          <p className="cd-pop-empty">No screens match these filters.</p>
        ) : (
          tree.map((co) => {
            const coOpen = openCompanies.has(co.company)
            const coPop = companyPopSummary(co.screens)
            return (
              <div
                key={co.company}
                className={`cd-pd-company${coOpen ? ' is-open' : ''}`}
                role="treeitem"
                aria-expanded={coOpen}
              >
                <button
                  type="button"
                  className="cd-pd-row company"
                  onClick={() => toggleCompany(co.company)}
                >
                  <span className="cd-fin-chevron">{coOpen ? '▾' : '▸'}</span>
                  <span className="cd-pd-identity">
                    <span className="cd-fin-level company">Company</span>
                    <strong>{co.company}</strong>
                    <span className="meta">
                      {co.locations.length} location
                      {co.locations.length === 1 ? '' : 's'} ·{' '}
                      {co.screens.length} screen
                      {co.screens.length === 1 ? '' : 's'}
                    </span>
                  </span>
                  <RollupMetrics
                    metrics={co.metrics}
                    popSummary={coPop}
                    plannedOnly={plannedOnly}
                  />
                </button>

                {coOpen && (
                  <div className="cd-pd-locations">
                    {co.locations.map((loc) => {
                      const locKey = `${co.company}::${loc.location}`
                      const locOpen = openLocations.has(locKey)
                      const locPop = companyPopSummary(loc.screens)
                      return (
                        <div
                          key={locKey}
                          className={`cd-pd-location${locOpen ? ' is-open' : ''}`}
                        >
                          <button
                            type="button"
                            className="cd-pd-row location"
                            onClick={() => toggleLocation(locKey)}
                          >
                            <span className="cd-fin-chevron">
                              {locOpen ? '▾' : '▸'}
                            </span>
                            <span className="cd-pd-identity">
                              <span className="cd-fin-level location">
                                Location
                              </span>
                              <strong>{loc.location}</strong>
                              <span className="meta">
                                {loc.screens.length} screen
                                {loc.screens.length === 1 ? '' : 's'}
                              </span>
                            </span>
                            <RollupMetrics
                              metrics={loc.metrics}
                              popSummary={locPop}
                              plannedOnly={plannedOnly}
                            />
                          </button>

                          {locOpen && (
                            <ScreenDeliveryTable
                              screens={loc.screens}
                              plannedOnly={plannedOnly}
                              openScreens={openScreens}
                              onToggleScreen={toggleScreen}
                              popByScreen={popByScreen}
                              popUnits={popUnits}
                              popVerified={popVerified}
                              onManagePop={openManage}
                            />
                          )}
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            )
          })
        )}
      </div>

      {manageTarget && (
        <ManagePopModal
          key={`${manageTarget.screenId}::${manageTarget.creativeId}`}
          screenId={manageTarget.screenId}
          screenName={manageTarget.screenName}
          creativeName={manageTarget.creativeName}
          units={manageUnits}
          verifiedMap={popVerified}
          onClose={() => setManageTarget(null)}
          onSave={saveManage}
        />
      )}
    </div>
  )
}
