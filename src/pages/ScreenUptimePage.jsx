import { useMemo, useState } from 'react'
import { COMPANY_UPTIME_SCREENS } from '../data/earnings'
import {
  buildCompanyScreenUptimeRows,
  buildCompanyUptimeTree,
  formatDuration,
  formatPct,
  formatPlays,
} from '../data/companyScreensUptime'
import './CampaignDetailPage.css'
import './ScreenUptimePage.css'

const TABS = [
  { id: 'all', label: 'All screens' },
  { id: 'uptime', label: 'Uptime' },
]

const UPTIME_GROUP_MODES = [
  { id: 'campaign', label: 'By campaign' },
  { id: 'screens', label: 'By screen' },
]

function statusLabel(status) {
  if (status === 'online') return 'Online'
  if (status === 'wifi') return 'Online via WiFi'
  return 'Offline'
}

function deliveryStatusClass(status) {
  if (status === 'Healthy' || status === 'Planned') return 'ok'
  if (status === 'Watch') return 'ready'
  if (status === 'Needs review') return 'warn'
  return 'hold'
}

function MetricChip({ label, plays, sec, tone }) {
  return (
    <div className={`up-metric-chip ${tone || ''}`}>
      <em>{label}</em>
      <strong>{plays == null ? '—' : formatPlays(plays)}</strong>
      <span>{sec == null ? '—' : formatDuration(sec)}</span>
    </div>
  )
}

function PctChip({ label, pct, tone }) {
  return (
    <div className={`up-metric-chip ${tone || ''}`}>
      <em>{label}</em>
      <strong>{formatPct(pct)}</strong>
    </div>
  )
}

function MetricsStrip({ metrics, compact = false }) {
  if (!metrics) return null
  return (
    <div className={`up-metrics-strip${compact ? ' compact' : ''}`}>
      <MetricChip
        label="Guaranteed"
        plays={metrics.guaranteedPlays}
        sec={metrics.guaranteedSec}
        tone="guaranteed"
      />
      <PctChip
        label="Of guarantee"
        pct={metrics.guaranteedDeliveryPct}
        tone="guarantee-pct"
      />
      <PctChip
        label="Total played"
        pct={metrics.totalPlayPct}
        tone="total-pct"
      />
      {!compact && (
        <>
          <MetricChip
            label="Actual"
            plays={metrics.hasActual ? metrics.actualPlays : null}
            sec={metrics.hasActual ? metrics.actualSec : null}
            tone="actual"
          />
          <MetricChip
            label="Missed"
            plays={metrics.hasActual ? metrics.missedPlays : null}
            sec={metrics.hasActual ? metrics.missedSec : null}
            tone="missed"
          />
          <MetricChip
            label="Extra"
            plays={metrics.hasActual ? metrics.extraPlays : null}
            sec={metrics.hasActual ? metrics.extraSec : null}
            tone="extra"
          />
        </>
      )}
    </div>
  )
}

function openScreenFromDelivery(onOpenScreen, row) {
  const match = COMPANY_UPTIME_SCREENS.find((s) => s.screenId === row.screenId)
  onOpenScreen?.(
    match || {
      id: `up-${row.screenId}`,
      screenId: row.screenId,
      screenName: row.screenName,
      location: row.location,
      workingHours: row.openingHours,
      timezone: 'Asia/Kuwait',
      onlinePct: row.onlinePct,
      expectedMinutes:
        row.expectedH != null ? Math.round(row.expectedH * 60) : null,
      onlineMinutes: row.actualH != null ? Math.round(row.actualH * 60) : null,
      offlineMinutes: 0,
      unknownMinutes: 0,
      statusNow: row.telemetry === 'missing' ? 'offline' : 'online',
      offlineDuringAds: false,
      adsScheduled: true,
      telemetry: row.telemetry,
      daily: [],
    },
  )
}

function AllScreensTab({ onOpenScreen }) {
  const [locationFilter, setLocationFilter] = useState('all')
  const [warnOnly, setWarnOnly] = useState(false)

  const locations = useMemo(
    () => [...new Set(COMPANY_UPTIME_SCREENS.map((s) => s.location))].sort(),
    [],
  )

  const rows = useMemo(() => {
    return COMPANY_UPTIME_SCREENS.filter((s) => {
      if (locationFilter !== 'all' && s.location !== locationFilter) return false
      if (warnOnly && !s.offlineDuringAds) return false
      return true
    })
  }, [locationFilter, warnOnly])

  const warnCount = rows.filter((s) => s.offlineDuringAds).length

  return (
    <>
      <div className="up-tab-toolbar">
        <label className="field compact">
          <span>Location</span>
          <select
            value={locationFilter}
            onChange={(e) => setLocationFilter(e.target.value)}
          >
            <option value="all">All locations</option>
            {locations.map((loc) => (
              <option key={loc} value={loc}>
                {loc}
              </option>
            ))}
          </select>
        </label>
        <label className="up-check">
          <input
            type="checkbox"
            checked={warnOnly}
            onChange={(e) => setWarnOnly(e.target.checked)}
          />
          Offline + ads only
        </label>
      </div>

      {warnCount > 0 && (
        <div className="up-banner">
          <strong>{warnCount}</strong> screen
          {warnCount === 1 ? '' : 's'} offline during opening hours with ads
          scheduled.
        </div>
      )}

      <div className="up-table-wrap">
        <table className="up-table up-table-simple">
          <thead>
            <tr>
              <th>Screen</th>
              <th>Location</th>
              <th>Opening hours</th>
              <th>Status now</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={5} className="up-empty-cell">
                  No screens match these filters.
                </td>
              </tr>
            ) : (
              rows.map((row) => (
                <tr
                  key={row.id}
                  className={row.offlineDuringAds ? 'warn-ads' : undefined}
                >
                  <td>
                    <strong>{row.screenName}</strong>
                    <span className="meta">{row.screenId}</span>
                    {row.offlineDuringAds && (
                      <span className="up-warn-pill">Offline + ads</span>
                    )}
                  </td>
                  <td>{row.location}</td>
                  <td>
                    <span>{row.workingHours}</span>
                    <span className="meta">{row.timezone}</span>
                  </td>
                  <td>
                    <span className={`up-status ${row.statusNow}`}>
                      {statusLabel(row.statusNow)}
                    </span>
                  </td>
                  <td className="up-actions">
                    <button
                      type="button"
                      className="btn-primary compact"
                      onClick={() => onOpenScreen?.(row)}
                    >
                      Open screen
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </>
  )
}

function ScreenDeliveryCard({ row, onOpen }) {
  return (
    <article className="up-screen-card">
      <div className="up-screen-card-main">
        <div className="up-screen-card-id">
          <strong>{row.screenId}</strong>
          <span className="meta">{row.screenName}</span>
          <span className="meta">{row.location}</span>
        </div>
        <div className="up-screen-card-mode">
          <span className="up-mode-pill">{row.modeShort}</span>
          <span className="meta">{row.modeLabel}</span>
        </div>
        <span className={`cd-pill ${deliveryStatusClass(row.status)}`}>
          {row.status}
        </span>
        <button
          type="button"
          className="btn-ghost compact"
          onClick={() => onOpen(row)}
        >
          Open
        </button>
      </div>
      <MetricsStrip
        metrics={{
          guaranteedPlays: row.guaranteedPlays,
          guaranteedSec: row.guaranteedSec,
          guaranteedDeliveryPct: row.guaranteedDeliveryPct,
          totalPlayPct: row.totalPlayPct,
          hasActual: row.actualPlays != null,
          actualPlays: row.actualPlays,
          actualSec: row.actualSec,
          missedPlays: row.missedPlays,
          missedSec: row.missedSec,
          extraPlays: row.extraPlays,
          extraSec: row.extraSec,
        }}
      />
      {row.fillNote && <p className="up-screen-card-note">{row.fillNote}</p>}
    </article>
  )
}

function UptimeByCampaign({ onOpenScreen }) {
  const { campaigns } = useMemo(() => buildCompanyUptimeTree(), [])
  const [openCampaigns, setOpenCampaigns] = useState(
    () => new Set(campaigns.map((c) => c.id)),
  )
  const [openCreatives, setOpenCreatives] = useState(() => {
    const keys = new Set()
    for (const c of campaigns) {
      for (const cr of c.creatives) keys.add(`${c.id}::${cr.id}`)
    }
    return keys
  })

  function toggleCampaign(id) {
    setOpenCampaigns((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function toggleCreative(key) {
    setOpenCreatives((prev) => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }

  if (!campaigns.length) {
    return <p className="up-empty-copy">No campaign delivery for this company.</p>
  }

  return (
    <div className="up-group-stack">
      {campaigns.map((campaign) => {
        const open = openCampaigns.has(campaign.id)
        return (
          <section
            key={campaign.id}
            className={`up-group-card campaign${open ? ' is-open' : ''}`}
          >
            <button
              type="button"
              className="up-group-head"
              onClick={() => toggleCampaign(campaign.id)}
              aria-expanded={open}
            >
              <span className="up-group-chevron">{open ? '▾' : '▸'}</span>
              <div className="up-group-copy">
                <span className="up-group-level">Campaign</span>
                <strong>{campaign.name}</strong>
                <span className="meta">
                  {campaign.advertiser} · {campaign.status} ·{' '}
                  {campaign.datesLabel} · {campaign.creatives.length} creative
                  {campaign.creatives.length === 1 ? '' : 's'} ·{' '}
                  {campaign.screenCount} screen
                  {campaign.screenCount === 1 ? '' : 's'}
                </span>
              </div>
              <MetricsStrip metrics={campaign.metrics} compact />
            </button>

            {open && (
              <div className="up-group-body">
                {campaign.creatives.map((creative) => {
                  const crKey = `${campaign.id}::${creative.id}`
                  const crOpen = openCreatives.has(crKey)
                  return (
                    <section
                      key={crKey}
                      className={`up-group-card creative${crOpen ? ' is-open' : ''}`}
                    >
                      <button
                        type="button"
                        className="up-group-head nested"
                        onClick={() => toggleCreative(crKey)}
                        aria-expanded={crOpen}
                      >
                        <span className="up-group-chevron">
                          {crOpen ? '▾' : '▸'}
                        </span>
                        <div className="up-group-copy">
                          <span className="up-group-level creative">
                            Creative
                          </span>
                          <strong>{creative.name}</strong>
                          <div className="up-schedule-chips">
                            <span>
                              <em>Dates</em> {creative.datesLabel}
                            </span>
                            <span>
                              <em>Hours</em> {creative.hoursLabel}
                            </span>
                            <span>
                              <em>Days</em> {creative.daysLabel}
                            </span>
                          </div>
                        </div>
                        <MetricsStrip metrics={creative.metrics} compact />
                      </button>

                      {crOpen && (
                        <div className="up-screen-list">
                          {creative.screens.map((row) => (
                            <ScreenDeliveryCard
                              key={row.screenId}
                              row={row}
                              onOpen={(r) =>
                                openScreenFromDelivery(onOpenScreen, r)
                              }
                            />
                          ))}
                        </div>
                      )}
                    </section>
                  )
                })}
              </div>
            )}
          </section>
        )
      })}
    </div>
  )
}

function UptimeByScreen({ onOpenScreen }) {
  const [from, setFrom] = useState('2026-03-01')
  const [to, setTo] = useState('2026-06-30')

  const rows = useMemo(
    () => buildCompanyScreenUptimeRows({ from, to }),
    [from, to],
  )

  return (
    <div className="up-by-screen">
      <div className="up-date-filters">
        <label className="field compact">
          <span>From</span>
          <input
            type="date"
            value={from}
            max={to || undefined}
            onChange={(e) => setFrom(e.target.value)}
          />
        </label>
        <label className="field compact">
          <span>To</span>
          <input
            type="date"
            value={to}
            min={from || undefined}
            onChange={(e) => setTo(e.target.value)}
          />
        </label>
        <p className="up-date-hint">
          Screens with at least one creative overlapping this range. Campaign
          chips list which campaigns ran on each screen.
        </p>
      </div>

      {rows.length === 0 ? (
        <p className="up-empty-copy">
          No screens had campaigns in this date range.
        </p>
      ) : (
        <div className="up-screen-list flat">
          {rows.map((row) => (
            <article key={row.screenId} className="up-screen-card with-campaigns">
              <div className="up-screen-card-main">
                <div className="up-screen-card-id">
                  <strong>{row.screenId}</strong>
                  <span className="meta">{row.screenName}</span>
                  <span className="meta">{row.location}</span>
                </div>
                <div className="up-screen-card-mode">
                  <span className="up-mode-pill">{row.modeShort}</span>
                  <span className="meta">{row.modeLabel}</span>
                </div>
                <span className={`cd-pill ${deliveryStatusClass(row.status)}`}>
                  {row.status}
                </span>
                <button
                  type="button"
                  className="btn-ghost compact"
                  onClick={() =>
                    openScreenFromDelivery(onOpenScreen, row.sampleRow)
                  }
                >
                  Open
                </button>
              </div>

              <div className="up-campaign-chips" aria-label="Campaigns on screen">
                <em>Campaigns</em>
                <div className="up-campaign-chip-list">
                  {row.campaigns.map((camp) => (
                    <span key={camp.id} className="up-campaign-chip">
                      <strong>{camp.name}</strong>
                      <span>
                        {camp.datesLabel}
                        {camp.creatives.length
                          ? ` · ${camp.creatives.map((c) => c.name).join(', ')}`
                          : ''}
                      </span>
                    </span>
                  ))}
                </div>
              </div>

              <MetricsStrip metrics={row.metrics} />
            </article>
          ))}
        </div>
      )}
    </div>
  )
}

function UptimeTab({ onOpenScreen }) {
  const [groupMode, setGroupMode] = useState('campaign')

  return (
    <div className="up-uptime-tab">
      <div className="up-group-modes" role="tablist" aria-label="Uptime grouping">
        {UPTIME_GROUP_MODES.map((mode) => (
          <button
            key={mode.id}
            type="button"
            role="tab"
            aria-selected={groupMode === mode.id}
            className={`up-group-mode${groupMode === mode.id ? ' active' : ''}`}
            onClick={() => setGroupMode(mode.id)}
          >
            {mode.label}
          </button>
        ))}
      </div>

      <p className="up-campaign-blurb">
        {groupMode === 'campaign'
          ? 'Campaign → creative → screens. Each creative shows its schedule; delivery metrics match Finance / Play delivery.'
          : 'All company screens in the selected date range, with the campaigns that ran on each screen.'}
      </p>

      {groupMode === 'campaign' ? (
        <UptimeByCampaign onOpenScreen={onOpenScreen} />
      ) : (
        <UptimeByScreen onOpenScreen={onOpenScreen} />
      )}
    </div>
  )
}

export default function ScreenUptimePage({ onOpenScreen }) {
  const [tab, setTab] = useState('all')

  return (
    <div className="up-page">
      <header className="up-header">
        <div>
          <h1>Screens</h1>
          <p className="up-subtitle">
            Company inventory and campaign delivery. All screens lists inventory;
            Uptime shows guaranteed vs played by campaign or by screen.
          </p>
        </div>
      </header>

      <div className="up-tabs" role="tablist" aria-label="Screens views">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            role="tab"
            aria-selected={tab === t.id}
            className={`up-tab${tab === t.id ? ' active' : ''}`}
            onClick={() => setTab(t.id)}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div role="tabpanel">
        {tab === 'all' ? (
          <AllScreensTab onOpenScreen={onOpenScreen} />
        ) : (
          <UptimeTab onOpenScreen={onOpenScreen} />
        )}
      </div>
    </div>
  )
}
