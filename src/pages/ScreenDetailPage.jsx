import { useMemo, useState } from 'react'
import {
  formatDurationMinutes,
  getScreenDetailSample,
} from '../data/screenDetailSample'
import {
  formatDuration,
  formatPct,
  formatPlays,
  getScreenCampaignCreatives,
} from '../data/companyScreensUptime'
import './ScreenDetailPage.css'

function statusLabel(status) {
  if (status === 'online') return 'Online'
  if (status === 'wifi') return 'Online via WiFi'
  return 'Offline'
}

function Icon({ name }) {
  const body = {
    back: <polyline points="15 18 9 12 15 6" />,
    pin: (
      <>
        <path d="M12 21s7-4.5 7-11a7 7 0 1 0-14 0c0 6.5 7 11 7 11z" />
        <circle cx="12" cy="10" r="2.2" />
      </>
    ),
    monitor: (
      <>
        <rect x="3" y="4" width="18" height="12" rx="2" />
        <path d="M8 20h8M12 16v4" />
      </>
    ),
    calendar: (
      <>
        <rect x="3" y="5" width="18" height="16" rx="2" />
        <path d="M8 3v4M16 3v4M3 10h18" />
      </>
    ),
    clock: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="M12 7v5l3 2" />
      </>
    ),
    pulse: <path d="M3 12h3l2-5 4 10 2-5h7" />,
    shield: <path d="M12 3l8 3v6c0 5-3.5 8.5-8 10-4.5-1.5-8-5-8-10V6l8-3z" />,
    edit: (
      <>
        <path d="M12 20h9" />
        <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5z" />
      </>
    ),
    check: <polyline points="5 13 9 17 19 7" />,
    list: (
      <>
        <path d="M9 6h12M9 12h12M9 18h12" />
        <circle cx="4.5" cy="6" r="1" />
        <circle cx="4.5" cy="12" r="1" />
        <circle cx="4.5" cy="18" r="1" />
      </>
    ),
    link: (
      <>
        <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
        <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
      </>
    ),
    device: (
      <>
        <rect x="7" y="2" width="10" height="20" rx="2" />
        <path d="M11 18h2" />
      </>
    ),
  }
  return (
    <svg
      className="sd-icon"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {body[name]}
    </svg>
  )
}

function UptimeBar({ online, offline, unknown, expected }) {
  if (expected == null || expected <= 0) {
    return <div className="sd-bar empty">No opening-hours baseline</div>
  }
  const o = (online / expected) * 100
  const f = (offline / expected) * 100
  const u = (unknown / expected) * 100
  return (
    <div
      className="sd-bar"
      title={`Online ${o.toFixed(1)}% · Offline ${f.toFixed(1)}% · No telemetry ${u.toFixed(1)}%`}
    >
      <span className="online" style={{ width: `${o}%` }} />
      <span className="offline" style={{ width: `${f}%` }} />
      <span className="unknown" style={{ width: `${u}%` }} />
    </div>
  )
}

/**
 * Wireframe Screen Detail — product-like layout plus opening hours & uptime.
 */
export default function ScreenDetailPage({ screenRef, onBack }) {
  const detail = useMemo(
    () => getScreenDetailSample(screenRef),
    [screenRef],
  )
  const [screenType, setScreenType] = useState(detail.screenType)
  const [safeMode, setSafeMode] = useState(detail.playbackSafeMode)
  const [periodFrom, setPeriodFrom] = useState(detail.uptime.periodFrom)
  const [periodTo, setPeriodTo] = useState(detail.uptime.periodTo)
  const [campaignFrom, setCampaignFrom] = useState('2026-03-01')
  const [campaignTo, setCampaignTo] = useState('2026-06-30')
  const [campaignFilter, setCampaignFilter] = useState('all')

  const campaignCreatives = useMemo(
    () =>
      getScreenCampaignCreatives(detail.screenId, {
        from: campaignFrom,
        to: campaignTo,
      }),
    [detail.screenId, campaignFrom, campaignTo],
  )

  const campaignOptions = useMemo(() => {
    const map = new Map()
    for (const row of campaignCreatives) {
      map.set(row.campaignId, row.campaignName)
    }
    return [...map.entries()]
      .map(([id, name]) => ({ id, name }))
      .sort((a, b) => a.name.localeCompare(b.name))
  }, [campaignCreatives])

  const visibleCampaignCreatives = useMemo(() => {
    if (campaignFilter === 'all') return campaignCreatives
    return campaignCreatives.filter((r) => r.campaignId === campaignFilter)
  }, [campaignCreatives, campaignFilter])

  const up = detail.uptime
  const pctTone =
    up.onlinePct == null
      ? ''
      : up.onlinePct >= 98
        ? 'ok'
        : up.onlinePct >= 90
          ? 'warn'
          : 'bad'

  return (
    <div className="sd-page">
      <button type="button" className="sd-back" onClick={onBack}>
        <Icon name="back" />
        Screens
      </button>

      <header className="sd-hero">
        <div className="sd-hero-main">
          <div className="sd-title-line">
            <h1>{detail.screenName}</h1>
            <button type="button" className="sd-icon-btn" title="Edit name">
              <Icon name="edit" />
            </button>
            <span className="sd-screen-id">{detail.screenId}</span>
          </div>
          <div className="sd-chips">
            <span className="sd-chip">
              <Icon name="pin" />
              {detail.location}
            </span>
            <span className="sd-chip">
              <Icon name="monitor" />
              {detail.orientation}
            </span>
            <span className="sd-chip">
              {screenType === 'ad-supported' ? 'Ad-supported' : 'Ad-free'}
            </span>
            <span className="sd-chip">
              {detail.hasSchedule ? 'Has schedule' : 'No schedule'}
            </span>
            <span className="sd-chip">{detail.platform}</span>
          </div>
        </div>
        <div className={`sd-status-card ${detail.statusNow}`}>
          <div className="sd-status-top">
            <span className="sd-status-dot" />
            <strong>{statusLabel(detail.statusNow)}</strong>
          </div>
          <span>{detail.statusBlurb}</span>
        </div>
      </header>

      <section className="sd-card">
        <div className="sd-card-head">
          <div className="sd-card-title">
            <span className="sd-sec-icon calendars">
              <Icon name="calendar" />
            </span>
            <div>
              <h2>Schedules</h2>
              <p>
                Playlists and ads use this screen’s local clock (
                {detail.timezone}).
              </p>
            </div>
          </div>
          <div className="sd-card-actions">
            <button type="button" className="btn-ghost compact">
              Company schedule
            </button>
            <button type="button" className="btn-ghost compact">
              <Icon name="list" />
              Schedules
            </button>
          </div>
        </div>
      </section>

      <div className="sd-grid-2">
        <section className="sd-card">
          <div className="sd-card-title">
            <span className="sd-sec-icon pin">
              <Icon name="pin" />
            </span>
            <div>
              <h2>Current location</h2>
              <p className="sd-help">
                Move this screen to another company location. Opening hours
                follow the location’s Advertising Information.
              </p>
            </div>
          </div>
          <label className="sd-field">
            <span>Location</span>
            <select defaultValue={detail.location}>
              <option>{detail.location}</option>
              <option>Cafe Mantou</option>
              <option>The Avenues — Zone A</option>
            </select>
          </label>
          <div className="sd-address">
            <em>Address</em>
            <strong>{detail.locationAddress}</strong>
          </div>
        </section>

        <section className="sd-card">
          <div className="sd-card-title">
            <span className="sd-sec-icon type">
              <Icon name="monitor" />
            </span>
            <div>
              <h2>Screen type</h2>
              <p className="sd-help">
                Hour scheduling only pairs playlists that match this inventory
                type.
              </p>
            </div>
          </div>
          <div className="sd-type-row">
            <button
              type="button"
              className={`sd-type ${screenType === 'ad-free' ? 'active' : ''}`}
              onClick={() => setScreenType('ad-free')}
            >
              <span className="sd-type-check" aria-hidden="true">
                {screenType === 'ad-free' ? <Icon name="check" /> : null}
              </span>
              <strong>Ad-free</strong>
              <span>Playlists only</span>
            </button>
            <button
              type="button"
              className={`sd-type ${screenType === 'ad-supported' ? 'active' : ''}`}
              onClick={() => setScreenType('ad-supported')}
            >
              <span className="sd-type-check" aria-hidden="true">
                {screenType === 'ad-supported' ? <Icon name="check" /> : null}
              </span>
              <strong>Ad-supported</strong>
              <span>Playlists and ads</span>
            </button>
          </div>
          <p className="sd-note">
            Switching type clears weekly hour slots that no longer apply.
          </p>
        </section>
      </div>

      <section className="sd-card sd-card-hours">
        <div className="sd-card-head">
          <div className="sd-card-title">
            <span className="sd-sec-icon clock">
              <Icon name="clock" />
            </span>
            <div>
              <h2>Opening hours</h2>
              <p>
                From the location’s Advertising Information. Operating uptime is
                measured only inside these hours — not the full day.
              </p>
            </div>
          </div>
          <button type="button" className="btn-ghost compact">
            Edit on location
          </button>
        </div>
        {!detail.openingHoursSet ? (
          <p className="sd-alert">
            Opening hours are not set for this location. Operating uptime cannot
            be calculated until hours are saved.
          </p>
        ) : (
          <>
            <div className="sd-hours-summary">
              <span>
                Typical day · <strong>{detail.openingHoursSummary}</strong>
              </span>
              <span className="sd-tz">{detail.timezone}</span>
            </div>
            <div className="sd-hours-grid">
              {detail.openingHours.map((h) => (
                <div
                  key={h.day}
                  className={`sd-hour-day ${h.closed ? 'closed' : ''}`}
                >
                  <em>{h.day}</em>
                  <strong>
                    {h.closed ? 'Closed' : `${h.open}–${h.close}`}
                  </strong>
                </div>
              ))}
            </div>
          </>
        )}
      </section>

      <section className="sd-card sd-card-uptime">
        <div className="sd-card-title">
          <span className="sd-sec-icon pulse">
            <Icon name="pulse" />
          </span>
          <div>
            <h2>Operating uptime</h2>
            <p>
              Online vs confirmed offline vs missing telemetry during opening
              hours in the selected period.
            </p>
          </div>
        </div>

        <div className="sd-uptime-period">
          <div className="sd-uptime-period-copy">
            <em>Reporting period</em>
            <strong>{up.periodLabel}</strong>
            <span>Sample figures · dates are UI-only in this wireframe</span>
          </div>
          <div className="sd-uptime-period-controls">
            <label className="sd-field compact">
              <span>From</span>
              <input
                type="date"
                value={periodFrom}
                max={periodTo}
                onChange={(e) => setPeriodFrom(e.target.value)}
              />
            </label>
            <label className="sd-field compact">
              <span>To</span>
              <input
                type="date"
                value={periodTo}
                min={periodFrom}
                onChange={(e) => setPeriodTo(e.target.value)}
              />
            </label>
          </div>
        </div>

        {up.offlineDuringAds && (
          <p className="sd-alert warn">
            Offline during opening hours while ads were scheduled — delivery
            risk for booked campaigns.
          </p>
        )}

        <div className="sd-uptime-kpis">
          <div className={`sd-kpi hero ${pctTone}`}>
            <em>Uptime</em>
            <strong>
              {up.onlinePct == null ? '—' : `${up.onlinePct.toFixed(1)}%`}
            </strong>
            <span>vs opening hours</span>
          </div>
          <div className="sd-kpi">
            <em>Online</em>
            <strong>{formatDurationMinutes(up.onlineMinutes)}</strong>
          </div>
          <div className="sd-kpi">
            <em>Confirmed offline</em>
            <strong>{formatDurationMinutes(up.offlineMinutes)}</strong>
          </div>
          <div className="sd-kpi">
            <em>No telemetry</em>
            <strong>{formatDurationMinutes(up.unknownMinutes)}</strong>
          </div>
          <div className="sd-kpi">
            <em>Expected</em>
            <strong>{formatDurationMinutes(up.expectedMinutes)}</strong>
            <span>opening-hour minutes</span>
          </div>
        </div>

        <UptimeBar
          online={up.onlineMinutes || 0}
          offline={up.offlineMinutes || 0}
          unknown={up.unknownMinutes || 0}
          expected={up.expectedMinutes}
        />

        <div className="sd-legend">
          <span>
            <i className="online" /> Online
          </span>
          <span>
            <i className="offline" /> Confirmed offline
          </span>
          <span>
            <i className="unknown" /> No telemetry
          </span>
        </div>

        {up.daily?.length > 0 && (
          <>
            <h3 className="sd-daily-title">Recent opening-hour days</h3>
            <div className="sd-daily">
              {up.daily.map((d) => (
                <div
                  key={d.day}
                  className={`sd-day ${d.offline ? 'had-offline' : 'stable'}`}
                >
                  <em>{d.day}</em>
                  <strong>{d.onlinePct}%</strong>
                  <span>{d.offline ? 'Had offline' : 'Stable'}</span>
                </div>
              ))}
            </div>
          </>
        )}
      </section>

      <section className="sd-card sd-card-campaigns">
        <div className="sd-card-title">
          <span className="sd-sec-icon list">
            <Icon name="list" />
          </span>
          <div>
            <h2>Campaigns &amp; creatives</h2>
            <p>
              Which campaigns and creatives booked this screen. Filter by date
              range (creative window overlap) and campaign.
            </p>
          </div>
        </div>

        <div className="sd-campaign-filters">
          <label className="sd-field compact">
            <span>From</span>
            <input
              type="date"
              value={campaignFrom}
              max={campaignTo || undefined}
              onChange={(e) => {
                setCampaignFrom(e.target.value)
                setCampaignFilter('all')
              }}
            />
          </label>
          <label className="sd-field compact">
            <span>To</span>
            <input
              type="date"
              value={campaignTo}
              min={campaignFrom || undefined}
              onChange={(e) => {
                setCampaignTo(e.target.value)
                setCampaignFilter('all')
              }}
            />
          </label>
          <label className="sd-field compact grow">
            <span>Campaign</span>
            <select
              value={campaignFilter}
              onChange={(e) => setCampaignFilter(e.target.value)}
            >
              <option value="all">All campaigns</option>
              {campaignOptions.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </label>
        </div>

        {visibleCampaignCreatives.length === 0 ? (
          <p className="sd-empty-soft">
            No campaigns or creatives overlap this screen in the selected range.
          </p>
        ) : (
          <ul className="sd-campaign-list">
            {visibleCampaignCreatives.map((row) => (
              <li key={row.key} className="sd-campaign-item">
                <div className="sd-campaign-item-head">
                  <div className="sd-campaign-item-copy">
                    <span className="sd-camp-level">Campaign</span>
                    <strong>{row.campaignName}</strong>
                    <span className="meta">
                      {row.advertiser} · {row.campaignStatus} ·{' '}
                      {row.campaignDatesLabel}
                    </span>
                  </div>
                  <span
                    className={`sd-status-pill ${
                      row.status === 'Healthy'
                        ? 'ok'
                        : row.status === 'Watch'
                          ? 'warn'
                          : row.status === 'Needs review'
                            ? 'bad'
                            : ''
                    }`}
                  >
                    {row.status}
                  </span>
                </div>

                <div className="sd-creative-block">
                  <div className="sd-creative-copy">
                    <span className="sd-camp-level creative">Creative</span>
                    <strong>{row.creativeName}</strong>
                    <div className="sd-creative-meta">
                      <span>
                        <em>Dates</em> {row.datesLabel}
                      </span>
                      <span>
                        <em>Hours</em> {row.hoursLabel}
                      </span>
                      <span>
                        <em>Days</em> {row.daysLabel}
                      </span>
                      {row.modeShort && (
                        <span>
                          <em>Mode</em> {row.modeShort}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="sd-creative-metrics">
                    <div>
                      <em>Guaranteed</em>
                      <strong>{formatPlays(row.guaranteedPlays)}</strong>
                      <span>{formatDuration(row.guaranteedSec)}</span>
                    </div>
                    <div>
                      <em>Of guarantee</em>
                      <strong>{formatPct(row.guaranteedDeliveryPct)}</strong>
                    </div>
                    <div>
                      <em>Total played</em>
                      <strong>{formatPct(row.totalPlayPct)}</strong>
                    </div>
                    <div>
                      <em>Actual</em>
                      <strong>
                        {row.actualPlays == null
                          ? '—'
                          : formatPlays(row.actualPlays)}
                      </strong>
                      <span>
                        {row.actualSec == null
                          ? '—'
                          : formatDuration(row.actualSec)}
                      </span>
                    </div>
                    <div>
                      <em>Missed</em>
                      <strong>
                        {row.missedPlays == null
                          ? '—'
                          : formatPlays(row.missedPlays)}
                      </strong>
                    </div>
                    <div>
                      <em>Extra</em>
                      <strong>
                        {row.extraPlays == null
                          ? '—'
                          : formatPlays(row.extraPlays)}
                      </strong>
                    </div>
                  </div>
                  {row.fillNote && (
                    <p className="sd-creative-note">{row.fillNote}</p>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="sd-card">
        <div className="sd-card-title">
          <span className="sd-sec-icon shield">
            <Icon name="shield" />
          </span>
          <div>
            <h2>
              Playback mode <span className="sd-tech">TECH</span>
            </h2>
            <p>Turn off heavier media effects when the device needs stability.</p>
          </div>
        </div>
        <label className="sd-toggle-row">
          <span>
            <strong>Playback-safe mode</strong>
            <em>Reduces transitions and heavy overlays</em>
          </span>
          <span className={`sd-switch ${safeMode ? 'on' : ''}`}>
            <input
              type="checkbox"
              checked={safeMode}
              onChange={(e) => setSafeMode(e.target.checked)}
            />
            <span className="sd-switch-track" aria-hidden="true">
              <span className="sd-switch-knob" />
            </span>
            <span className="sd-switch-label">{safeMode ? 'ON' : 'OFF'}</span>
          </span>
        </label>
      </section>

      <div className="sd-grid-2">
        <section className="sd-card sd-panel-blue">
          <div className="sd-panel-head blue">
            <Icon name="link" />
            <h2>Status &amp; pairing</h2>
          </div>
          <dl className="sd-dl">
            <div>
              <dt>Location</dt>
              <dd>{detail.locationAddress}</dd>
            </div>
            <div>
              <dt>Device ID</dt>
              <dd className="mono">{detail.deviceId}</dd>
            </div>
            <div>
              <dt>Pairing code</dt>
              <dd>
                <span className="sd-pill soft">{detail.pairingCode}</span>
              </dd>
            </div>
          </dl>
          <h3 className="sd-subhead">Activity</h3>
          <div className="sd-activity">
            <div>
              <em>Created</em>
              <strong>{detail.createdAt}</strong>
            </div>
            <div>
              <em>Last updated</em>
              <strong>{detail.updatedAt}</strong>
            </div>
            <div>
              <em>Last ping</em>
              <strong>{detail.lastPing}</strong>
            </div>
            <div>
              <em>Uptime (this session)</em>
              <strong>{detail.sessionUptime}</strong>
            </div>
          </div>
        </section>

        <section className="sd-card sd-panel-amber">
          <div className="sd-panel-head amber">
            <Icon name="device" />
            <h2>Device details</h2>
          </div>
          <dl className="sd-dl">
            <div>
              <dt>Display</dt>
              <dd>
                {detail.display.resolution}
                <span className="sd-sep">·</span>
                {detail.display.reportedOrientation}
                <span className="sd-sep">·</span>
                ratio {detail.display.pixelRatio}
                <span className="sd-sep">·</span>
                {detail.display.colorDepth}-bit
              </dd>
            </div>
            <div>
              <dt>Frontend version</dt>
              <dd>{detail.frontendVersion}</dd>
            </div>
            <div>
              <dt>Install source</dt>
              <dd>{detail.installSource}</dd>
            </div>
            <div>
              <dt>Platform &amp; language</dt>
              <dd>{detail.platformLanguage}</dd>
            </div>
            <div>
              <dt>Playback clock</dt>
              <dd>
                <select defaultValue={detail.timezone}>
                  <option>{detail.timezone}</option>
                  <option>Asia/Riyadh</option>
                  <option>Asia/Dubai</option>
                </select>
              </dd>
            </div>
            <div>
              <dt>User agent</dt>
              <dd>{detail.userAgent}</dd>
            </div>
            <div>
              <dt>Rotation</dt>
              <dd>
                <select defaultValue={detail.rotation}>
                  <option>0° (No rotation)</option>
                  <option>90°</option>
                  <option>180°</option>
                  <option>270°</option>
                </select>
              </dd>
            </div>
          </dl>
          <h3 className="sd-subhead">Android permissions</h3>
          <ul className="sd-perms">
            {detail.permissions.map((p) => (
              <li key={p.name}>
                <span>{p.name}</span>
                <em className={p.status === 'Granted' ? 'ok' : 'bad'}>
                  {p.status}
                </em>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  )
}
