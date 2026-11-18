import { useEffect, useMemo, useRef, useState } from 'react'
import RelatedQuestionChip from '../../components/RelatedQuestionChip'
import {
  advertiserInitials,
  advertiserNames,
  advertiserSpendSummary,
  normalizeAdvertiserList,
} from '../../data/advertisers'
import {
  SLOT_MODE_BANDS,
  SLOT_SEC,
  creativeAdSec,
  formatDuration,
  getLoopMode,
  loopModeForSlots,
} from '../../data/loopModes'

const TYPES = [
  {
    id: 'Paid',
    blurb: 'Collects campaign total / value. Money movement + occupancy.',
  },
  {
    id: 'Free',
    blurb: 'On-the-house. No money movement; counts toward occupancy.',
  },
  {
    id: 'Admin',
    blurb: "Ad Space’s own advertising. Does not count toward occupancy.",
  },
]

const CURRENCIES = ['USD', 'KWD', 'SAR', 'AED', 'QAR', 'BHD', 'OMR']
const HOURS = Array.from({ length: 25 }, (_, i) => i)

function formatHour(h) {
  return `${String(h).padStart(2, '0')}:00`
}

export default function StepCampaignInfo({
  draft,
  advertisers,
  onChange,
  onAdvertiserCommit,
  focusAnchor = null,
  onFocusConsumed,
  onOpenQuestion,
}) {
  const [advQuery, setAdvQuery] = useState(draft.advertiser)
  const [open, setOpen] = useState(false)
  const [slotsFocused, setSlotsFocused] = useState(false)
  const slotsFieldRef = useRef(null)
  const advertiserList = useMemo(
    () => normalizeAdvertiserList(advertisers),
    [advertisers],
  )
  const advertiserNameList = useMemo(
    () => advertiserNames(advertiserList),
    [advertiserList],
  )

  useEffect(() => {
    setAdvQuery(draft.advertiser || '')
  }, [draft.advertiser])

  useEffect(() => {
    if (focusAnchor !== 'slots') return
    setSlotsFocused(true)
    window.requestAnimationFrame(() => {
      slotsFieldRef.current?.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      })
    })
    const t = window.setTimeout(() => setSlotsFocused(false), 1800)
    onFocusConsumed?.()
    return () => window.clearTimeout(t)
  }, [focusAnchor, onFocusConsumed])

  const suggestions = useMemo(() => {
    const q = advQuery.trim().toLowerCase()
    const ranked = advertiserList.map((a) => ({
      ...a,
      summary: advertiserSpendSummary(a.name),
    }))
    if (!q) return ranked
    return ranked.filter(
      (a) =>
        a.name.toLowerCase().includes(q) ||
        (a.contactName || '').toLowerCase().includes(q),
    )
  }, [advQuery, advertiserList])

  const exactMatch = advertiserNameList.some(
    (a) => a.toLowerCase() === advQuery.trim().toLowerCase(),
  )

  const slotMode = useMemo(() => loopModeForSlots(draft.slots), [draft.slots])
  const adDurationSec = creativeAdSec(draft.slots)

  function pickAdvertiser(name) {
    setAdvQuery(name)
    onAdvertiserCommit(name)
    setOpen(false)
  }

  function commitTyped() {
    if (!advQuery.trim()) return
    onAdvertiserCommit(advQuery)
    setOpen(false)
  }

  return (
    <div className="step-block">
      <h2>Campaign info</h2>
      <p className="step-help">
        Basics first, then the campaign booking window. Next you choose which
        screens this campaign may use; creatives assign from that pool.
      </p>

      <section className="setup-section">
        <h3>Campaign information</h3>
        <div className="form-grid">
          <label className="field">
            <span>Campaign name</span>
            <input
              type="text"
              value={draft.name}
              onChange={(e) => onChange({ name: e.target.value })}
              placeholder="e.g. Ramadan Retail Push"
            />
          </label>

          <div className={`field combobox advertiser-combo ${open ? 'is-open' : ''}`}>
            <span>Advertiser</span>
            <div className="advertiser-combo-shell">
              <div className="advertiser-combo-control">
                {advQuery.trim() ? (
                  <span className="advertiser-combo-avatar" aria-hidden="true">
                    {advertiserInitials(advQuery)}
                  </span>
                ) : (
                  <span
                    className="advertiser-combo-avatar is-empty"
                    aria-hidden="true"
                  >
                    +
                  </span>
                )}
                <input
                  type="text"
                  value={advQuery}
                  placeholder="Search advertisers or type a new name"
                  aria-expanded={open}
                  aria-autocomplete="list"
                  onChange={(e) => {
                    setAdvQuery(e.target.value)
                    onChange({ advertiser: e.target.value })
                    setOpen(true)
                  }}
                  onFocus={() => setOpen(true)}
                  onBlur={() => window.setTimeout(() => setOpen(false), 150)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      commitTyped()
                    }
                    if (e.key === 'Escape') setOpen(false)
                  }}
                />
              </div>
              {open && (
                <ul className="combo-list advertiser-combo-list" role="listbox">
                  {suggestions.map((row) => {
                    const active =
                      row.name.toLowerCase() === advQuery.trim().toLowerCase()
                    return (
                      <li key={row.id}>
                        <button
                          type="button"
                          className={`advertiser-combo-option ${
                            active ? 'is-active' : ''
                          }`}
                          onMouseDown={() => pickAdvertiser(row.name)}
                        >
                          <span
                            className="advertiser-combo-avatar"
                            aria-hidden="true"
                          >
                            {advertiserInitials(row.name)}
                          </span>
                          <span className="advertiser-combo-copy">
                            <strong>{row.name}</strong>
                            <em>
                              {row.summary.campaignCount} campaign
                              {row.summary.campaignCount === 1 ? '' : 's'}
                              {row.summary.paidCount > 0
                                ? ` · ${row.summary.totalSpendLabel} paid`
                                : ''}
                              {row.country ? ` · ${row.country}` : ''}
                            </em>
                          </span>
                        </button>
                      </li>
                    )
                  })}
                  {advQuery.trim() && !exactMatch && (
                    <li>
                      <button
                        type="button"
                        className="create-option advertiser-combo-create"
                        onMouseDown={() => pickAdvertiser(advQuery.trim())}
                      >
                        <span
                          className="advertiser-combo-avatar is-create"
                          aria-hidden="true"
                        >
                          +
                        </span>
                        <span className="advertiser-combo-copy">
                          <strong>Create “{advQuery.trim()}”</strong>
                          <em>
                            New advertiser — saved for reuse on later campaigns
                          </em>
                        </span>
                      </button>
                    </li>
                  )}
                  {suggestions.length === 0 && !advQuery.trim() && (
                    <li className="combo-empty">No advertisers yet</li>
                  )}
                </ul>
              )}
            </div>
            <p className="hint">
              Search an existing brand or type a new name. Creating one keeps it
              for the next campaign.
            </p>
          </div>

          <fieldset className="field type-fieldset">
            <legend>Campaign type</legend>
            <div className="type-row" role="group" aria-label="Campaign type">
              {TYPES.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  className={`type-card ${draft.type === t.id ? 'selected' : ''}`}
                  onClick={() => onChange({ type: t.id })}
                >
                  <strong>{t.id}</strong>
                  <span>{t.blurb}</span>
                </button>
              ))}
            </div>
          </fieldset>

          {draft.type === 'Paid' && (
            <div className="paid-row">
              <label className="field">
                <span>Campaign total / value</span>
                <input
                  type="number"
                  min="1"
                  step="1"
                  value={draft.value}
                  onChange={(e) => onChange({ value: e.target.value })}
                  placeholder="10000"
                />
              </label>
              <label className="field">
                <span>Currency</span>
                <select
                  value={draft.currency}
                  onChange={(e) => onChange({ currency: e.target.value })}
                >
                  {CURRENCIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          )}
        </div>
      </section>

      <section
        className={`setup-section setup-section-emphasis ${
          slotsFocused ? 'is-question-focus' : ''
        }`}
      >
        <div className="setup-emphasis-head">
          <p className="setup-emphasis-kicker">Required · drives inventory</p>
          <h3>Slots & campaign window</h3>
          <p className="step-help nested">
            Slot count locks the content/ad loop mode. Date and hour bounds
            define the booking window — the next step only lists matching
            inventory; creatives schedule inside it.
          </p>
        </div>

        <div className="schedule-grid">
          <div
            ref={slotsFieldRef}
            className={`field has-question slots-field ${
              slotsFocused ? 'is-question-focus' : ''
            }`}
          >
            <span id="campaign-slots-label">Slots (1–18)</span>
            <input
              id="campaign-slots"
              type="number"
              min={1}
              max={18}
              value={draft.slots}
              aria-labelledby="campaign-slots-label"
              onChange={(e) => onChange({ slots: Number(e.target.value) })}
            />
            <RelatedQuestionChip
              questionId="Q04.3"
              title="Slot count vs content/ad loop modes"
              onOpen={() => onOpenQuestion?.('Q04.3')}
            />
          </div>
          <label className="field">
            <span>Start date</span>
            <input
              type="date"
              value={draft.startDate}
              onChange={(e) => onChange({ startDate: e.target.value })}
            />
          </label>
          <label className="field">
            <span>End date</span>
            <input
              type="date"
              value={draft.endDate}
              onChange={(e) => onChange({ endDate: e.target.value })}
            />
          </label>
          <label className="field">
            <span>Hours from</span>
            <select
              value={draft.hourStart}
              onChange={(e) => onChange({ hourStart: Number(e.target.value) })}
            >
              {HOURS.slice(0, 24).map((h) => (
                <option key={h} value={h}>
                  {formatHour(h)}
                </option>
              ))}
            </select>
          </label>
          <label className="field">
            <span>Hours to</span>
            <select
              value={draft.hourEnd}
              onChange={(e) => onChange({ hourEnd: Number(e.target.value) })}
            >
              {HOURS.slice(1).map((h) => (
                <option key={h} value={h}>
                  {formatHour(h)}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div
          className="slot-mode-panel"
          role="status"
          aria-live="polite"
          aria-atomic="true"
        >
          <div className="slot-mode-active">
            <em>Selected loop mode</em>
            <strong>{slotMode.mode.label}</strong>
            <span>
              {draft.slots || 0} slot{(draft.slots || 0) === 1 ? '' : 's'} ·{' '}
              {SLOT_SEC}s each · ad package {formatDuration(adDurationSec)} ·
              band {slotMode.rangeLabel}
            </span>
          </div>
          <ul className="slot-mode-bands" aria-label="Slot bands and loop modes">
            {SLOT_MODE_BANDS.map((band) => {
              const mode = getLoopMode(band.id)
              const active = band.id === slotMode.id
              return (
                <li
                  key={band.id}
                  className={`slot-mode-band ${active ? 'active' : ''}`}
                >
                  <span className="slot-mode-band-range">{band.rangeLabel}</span>
                  <strong>{mode.label}</strong>
                  {active && <em className="slot-mode-band-tag">Selected</em>}
                </li>
              )
            })}
          </ul>
        </div>
      </section>
    </div>
  )
}
