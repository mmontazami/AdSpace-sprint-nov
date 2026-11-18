import { useMemo, useState } from 'react'
import {
  ADMIN_SCREENS,
  SCREEN_AD_SCHEDULED,
  SCREEN_MONTHS,
  SCREEN_TYPE_FILTERS,
  companiesFromScreens,
  countriesFromScreens,
  formatDurationMinutes,
} from '../data/screens'
import { COMPANIES } from '../data/inventory'
import './ScreensPage.css'

function hostStatusForCompany(companyName) {
  const company = COMPANIES.find((c) => c.name === companyName)
  return company?.hostStatus === 'Verified' ? 'Verified' : 'Unverified'
}

function statusLabel(status) {
  if (status === 'online') return 'Online'
  if (status === 'wifi') return 'Online via WiFi'
  return 'Offline'
}

function playbackLabel(playback) {
  if (playback === 'scheduled') return 'Scheduled'
  return 'None'
}

function typeLabel(type) {
  if (type === 'ad-supported') return 'Ad-supported'
  if (type === 'ad-free') return 'Ad-free'
  return type
}

function TypeCell({ row }) {
  if (row.type !== 'ad-free') {
    return (
      <span className={`scr-badge type ${row.type}`}>{typeLabel(row.type)}</span>
    )
  }

  const hasSeat = Boolean(row.seat?.assigned)
  return (
    <div className="scr-type-cell">
      <span className={`scr-badge type ${row.type}`}>{typeLabel(row.type)}</span>
      {hasSeat ? (
        <span className="scr-seat has-seat" tabIndex={0}>
          Seat assigned
          <span className="scr-seat-tip" role="tooltip">
            Valid until {row.seat.validUntilLabel}
            <em>{row.seat.cycle === 'annual' ? 'Annual' : 'Monthly'} billing</em>
          </span>
        </span>
      ) : (
        <span className="scr-seat no-seat" tabIndex={0}>
          No seat
          <span className="scr-seat-tip" role="tooltip">
            Watermarked · free until a seat is assigned
          </span>
        </span>
      )}
    </div>
  )
}

function adScheduledLabel(value) {
  if (value === 'current-hour') return 'Current hour'
  if (value === 'today') return 'Today'
  return 'None'
}

function OrientationIcon({ orientation }) {
  const isPortrait = orientation === 'portrait'
  return (
    <span className={`scr-orient ${isPortrait ? 'portrait' : 'landscape'}`}>
      <span className="scr-orient-icon" aria-hidden="true" />
      {isPortrait ? 'Portrait' : 'Landscape'}
    </span>
  )
}

function StatusBadge({ status }) {
  return (
    <span className={`scr-badge status ${status}`}>
      <span className="scr-status-dot" aria-hidden="true" />
      {statusLabel(status)}
    </span>
  )
}

function UptimeCell({ row }) {
  if (row.telemetry === 'missing' || row.onlinePct == null) {
    return (
      <span className="scr-uptime missing">
        —
        <span className="meta">No telemetry</span>
      </span>
    )
  }
  const tone =
    row.onlinePct >= 98 ? 'ok' : row.onlinePct >= 90 ? 'warn' : 'bad'
  return (
    <span className={`scr-uptime ${tone}`}>
      {row.onlinePct.toFixed(1)}%
      <span className="meta">
        {formatDurationMinutes(row.onlineMinutes)} /{' '}
        {formatDurationMinutes(row.expectedMinutes)}
      </span>
    </span>
  )
}

function OnlineLogModal({ screen, monthLabel, onClose }) {
  if (!screen) return null

  return (
    <div className="scr-modal-backdrop" onClick={onClose} role="presentation">
      <div
        className="scr-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="scr-log-title"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="scr-modal-head">
          <div>
            <h2 id="scr-log-title">Online log</h2>
            <p>
              {screen.screenName} · {screen.company} · {screen.location} ·{' '}
              {monthLabel}
            </p>
          </div>
          <button type="button" className="btn-ghost compact" onClick={onClose}>
            Close
          </button>
        </header>

        <div className="scr-modal-summary">
          <div>
            <em>Working hours</em>
            <strong>{screen.workingHours}</strong>
          </div>
          <div>
            <em>Online in period</em>
            <strong>
              {screen.telemetry === 'missing'
                ? '—'
                : formatDurationMinutes(screen.onlineMinutes)}
            </strong>
          </div>
          <div>
            <em>Uptime</em>
            <strong>
              {screen.onlinePct == null ? '—' : `${screen.onlinePct.toFixed(1)}%`}
            </strong>
          </div>
          <div>
            <em>Status now</em>
            <strong>
              <StatusBadge status={screen.status} />
            </strong>
          </div>
        </div>

        {screen.offlineDuringAds && (
          <p className="scr-modal-alert">
            Offline during opening hours while ads were scheduled — review gaps
            below.
          </p>
        )}

        <div className="scr-log-list">
          {(screen.logs || []).map((log, i) => (
            <div key={`${log.at}-${i}`} className={`scr-log-row ${log.event}`}>
              <span className="scr-log-event">{log.event}</span>
              <div>
                <strong>{log.at}</strong>
                <span className="meta">{log.detail}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default function ScreensPage() {
  const [monthId, setMonthId] = useState(SCREEN_MONTHS[0].id)
  const [query, setQuery] = useState('')
  const [typeFilter, setTypeFilter] = useState('all')
  const [companyFilter, setCompanyFilter] = useState('all')
  const [countryFilter, setCountryFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [adFilter, setAdFilter] = useState('all')
  const [updatableOnly, setUpdatableOnly] = useState(false)
  const [warnAdsOnly, setWarnAdsOnly] = useState(false)
  const [sortLastSeen, setSortLastSeen] = useState('desc')
  const [showExtraFilters, setShowExtraFilters] = useState(false)
  const [logScreenId, setLogScreenId] = useState(null)

  const month = SCREEN_MONTHS.find((m) => m.id === monthId) || SCREEN_MONTHS[0]
  const companies = useMemo(() => companiesFromScreens(), [])
  const countries = useMemo(() => countriesFromScreens(), [])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    let rows = ADMIN_SCREENS.filter((s) => {
      if (typeFilter !== 'all' && s.type !== typeFilter) return false
      if (companyFilter !== 'all' && s.company !== companyFilter) return false
      if (countryFilter !== 'all' && s.country !== countryFilter) return false
      if (statusFilter !== 'all' && s.status !== statusFilter) return false
      if (adFilter !== 'all' && s.adScheduled !== adFilter) return false
      if (updatableOnly && !s.updatable) return false
      if (warnAdsOnly && !s.offlineDuringAds) return false
      if (!q) return true
      const hay =
        `${s.company} ${s.location} ${s.screenName} ${s.country || ''} ${s.player}`.toLowerCase()
      return hay.includes(q)
    })

    rows = [...rows].sort((a, b) => {
      // Demo: keep one seated + one seatless Ad-free near the top.
      const pinRank = (s) => {
        if (s.id === 'scr-avenues-fc') return 0
        if (s.id === 'scr-avenues-kids') return 1
        return 2
      }
      const pinDiff = pinRank(a) - pinRank(b)
      if (pinDiff !== 0) return pinDiff
      return sortLastSeen === 'desc'
        ? b.lastSeenDays - a.lastSeenDays
        : a.lastSeenDays - b.lastSeenDays
    })
    return rows
  }, [
    query,
    typeFilter,
    companyFilter,
    countryFilter,
    statusFilter,
    adFilter,
    updatableOnly,
    warnAdsOnly,
    sortLastSeen,
  ])

  const counts = useMemo(() => {
    const online = filtered.filter((s) => s.status === 'online').length
    const wifi = filtered.filter((s) => s.status === 'wifi').length
    const offline = filtered.filter((s) => s.status === 'offline').length
    const warn = filtered.filter((s) => s.offlineDuringAds).length
    return { online, wifi, offline, warn }
  }, [filtered])

  const logScreen = ADMIN_SCREENS.find((s) => s.id === logScreenId) || null

  return (
    <div className="screens-page">
      <header className="screens-header">
        <div className="screens-title-row">
          <span className="screens-title-icon" aria-hidden="true" />
          <div>
            <h1>Screens (Admin)</h1>
            <p className="screens-subtitle">
              Inventory, connectivity, and opening-hours uptime · Warning when a
              screen is offline during opening hours &amp; has ads scheduled ·
              Target ≥ 98% online during working hours · {month.label}
            </p>
          </div>
        </div>
        <div className="screens-header-actions">
          <label className="field compact">
            <span>Period</span>
            <select value={monthId} onChange={(e) => setMonthId(e.target.value)}>
              {SCREEN_MONTHS.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.label}
                </option>
              ))}
            </select>
          </label>
        </div>
      </header>

      {counts.warn > 0 && (
        <div className="screens-alert">
          <strong>{counts.warn}</strong> screen
          {counts.warn === 1 ? '' : 's'} offline during opening hours with ads
          scheduled. Open the online log for gap detail.
        </div>
      )}

      <div className="screens-stats">
        <div className="screens-stat">
          <em>Showing</em>
          <strong>{filtered.length}</strong>
          <span>of {ADMIN_SCREENS.length} screens</span>
        </div>
        <div className="screens-stat ok">
          <em>Online</em>
          <strong>{counts.online}</strong>
        </div>
        <div className="screens-stat wifi">
          <em>Via WiFi</em>
          <strong>{counts.wifi}</strong>
        </div>
        <div className="screens-stat bad">
          <em>Offline</em>
          <strong>{counts.offline}</strong>
        </div>
      </div>

      <div className="screens-toolbar">
        <p className="screens-showing">
          Showing <strong>{filtered.length}</strong> screens
        </p>

        <div className="screens-toolbar-actions">
          <label className="field compact inline">
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              aria-label="Screen type"
            >
              {SCREEN_TYPE_FILTERS.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.label}
                </option>
              ))}
            </select>
          </label>

          <label className="field compact inline">
            <select
              value={companyFilter}
              onChange={(e) => setCompanyFilter(e.target.value)}
              aria-label="Company"
            >
              <option value="all">All companies</option>
              {companies.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </label>

          <div className="scr-status-toggles" role="group" aria-label="Status">
            <button
              type="button"
              className={`scr-status-toggle online ${statusFilter === 'online' ? 'active' : ''}`}
              title="Online"
              aria-pressed={statusFilter === 'online'}
              onClick={() =>
                setStatusFilter((v) => (v === 'online' ? 'all' : 'online'))
              }
            >
              <span className="scr-status-dot" />
            </button>
            <button
              type="button"
              className={`scr-status-toggle wifi ${statusFilter === 'wifi' ? 'active' : ''}`}
              title="Online via WiFi"
              aria-pressed={statusFilter === 'wifi'}
              onClick={() =>
                setStatusFilter((v) => (v === 'wifi' ? 'all' : 'wifi'))
              }
            >
              <span className="scr-wifi-icon" aria-hidden="true" />
            </button>
            <button
              type="button"
              className={`scr-status-toggle offline ${statusFilter === 'offline' ? 'active' : ''}`}
              title="Offline"
              aria-pressed={statusFilter === 'offline'}
              onClick={() =>
                setStatusFilter((v) => (v === 'offline' ? 'all' : 'offline'))
              }
            >
              <span className="scr-offline-icon" aria-hidden="true" />
            </button>
          </div>

          <button
            type="button"
            className={`btn-ghost compact ${showExtraFilters ? 'active' : ''}`}
            onClick={() => setShowExtraFilters((v) => !v)}
          >
            + Add filter
          </button>
        </div>
      </div>

      {showExtraFilters && (
        <div className="screens-extra-filters">
          <label className="field grow">
            <span>Search</span>
            <input
              type="search"
              placeholder="Search locations, screens, companies…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </label>
          <label className="field">
            <span>Country</span>
            <select
              value={countryFilter}
              onChange={(e) => setCountryFilter(e.target.value)}
            >
              <option value="all">All countries</option>
              {countries.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </label>
          <label className="field">
            <span>Ad scheduled</span>
            <select
              value={adFilter}
              onChange={(e) => setAdFilter(e.target.value)}
            >
              {SCREEN_AD_SCHEDULED.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.label}
                </option>
              ))}
            </select>
          </label>
          <label className="scr-check">
            <input
              type="checkbox"
              checked={updatableOnly}
              onChange={(e) => setUpdatableOnly(e.target.checked)}
            />
            Updatable only
          </label>
          <label className="scr-check">
            <input
              type="checkbox"
              checked={warnAdsOnly}
              onChange={(e) => setWarnAdsOnly(e.target.checked)}
            />
            Offline + ads warning
          </label>
        </div>
      )}

      <div className="screens-table-wrap">
        <table className="screens-table">
          <thead>
            <tr>
              <th>Company</th>
              <th>Location</th>
              <th>Country</th>
              <th>Screen</th>
              <th>Status</th>
              <th>
                <button
                  type="button"
                  className="scr-sort"
                  onClick={() =>
                    setSortLastSeen((v) => (v === 'desc' ? 'asc' : 'desc'))
                  }
                >
                  Last seen
                  <span className="scr-sort-icon" data-dir={sortLastSeen}>
                    ↕
                  </span>
                </button>
              </th>
              <th>Playback now</th>
              <th>Type</th>
              <th>Ad scheduled</th>
              <th>Orientation</th>
              <th>Working hours</th>
              <th>Online in period</th>
              <th>Uptime</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={14} className="screens-empty">
                  No screens match these filters.
                </td>
              </tr>
            ) : (
              filtered.map((row) => (
                <tr
                  key={row.id}
                  className={row.offlineDuringAds ? 'warn-ads' : undefined}
                >
                  <td>
                    <div className="scr-company-cell">
                      <span>{row.company}</span>
                      <span
                        className={`scr-badge host ${
                          hostStatusForCompany(row.company) === 'Verified'
                            ? 'verified'
                            : 'unverified'
                        }`}
                      >
                        {hostStatusForCompany(row.company)}
                      </span>
                    </div>
                  </td>
                  <td>{row.location}</td>
                  <td>
                    {row.country ? (
                      <span className="scr-country">
                        <span aria-hidden="true">{row.countryFlag}</span>
                        {row.country}
                      </span>
                    ) : (
                      <span className="scr-dash">—</span>
                    )}
                  </td>
                  <td>
                    <div className="scr-screen-cell">
                      <strong>{row.screenName}</strong>
                      {row.updatable && (
                        <span className="scr-badge updatable">Updatable</span>
                      )}
                      <span className="meta">{row.player}</span>
                    </div>
                  </td>
                  <td>
                    <StatusBadge status={row.status} />
                  </td>
                  <td className="scr-last-seen">{row.lastSeen}</td>
                  <td>
                    <span className={`scr-badge playback ${row.playbackNow}`}>
                      {playbackLabel(row.playbackNow)}
                    </span>
                  </td>
                  <td>
                    <TypeCell row={row} />
                  </td>
                  <td>
                    <span className={`scr-badge ad ${row.adScheduled}`}>
                      {adScheduledLabel(row.adScheduled)}
                      {row.offlineDuringAds && row.adScheduled !== 'none' && (
                        <span className="scr-ad-warn" title="Offline with ads">
                          !
                        </span>
                      )}
                    </span>
                  </td>
                  <td>
                    <OrientationIcon orientation={row.orientation} />
                  </td>
                  <td>
                    <span className="scr-hours">{row.workingHours}</span>
                  </td>
                  <td>
                    {row.telemetry === 'missing' ? (
                      <span className="scr-dash">—</span>
                    ) : (
                      <span className="scr-online-dur">
                        {formatDurationMinutes(row.onlineMinutes)}
                        <span className="meta">
                          of {formatDurationMinutes(row.expectedMinutes)}
                        </span>
                      </span>
                    )}
                  </td>
                  <td>
                    <UptimeCell row={row} />
                  </td>
                  <td className="scr-actions">
                    <button
                      type="button"
                      className="btn-ghost compact"
                      onClick={() => setLogScreenId(row.id)}
                    >
                      Online log
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <OnlineLogModal
        screen={logScreen}
        monthLabel={month.label}
        onClose={() => setLogScreenId(null)}
      />
    </div>
  )
}
