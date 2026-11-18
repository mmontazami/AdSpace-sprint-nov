import { useMemo, useState } from 'react'
import {
  ANY_ASPECT_RATIO,
  CREATIVE_ORIENTATIONS,
  filterScreenIdsByFormat,
  isCreativeFormatValid,
} from '../../data/aspectRatios'
import { INVENTORY } from '../../data/inventory'
import { seedContentForFormat } from '../../data/creativeContent'
import { buildBookedScreenMap } from '../../data/screenStatuses'
import RelatedQuestionChip from '../../components/RelatedQuestionChip'
import AspectRatioPicker from './AspectRatioPicker'
import CreativeContentStep from './CreativeContentStep'
import InventoryPicker from './InventoryPicker'
import HoursPainter, { hoursFromRange, hoursRange } from './HoursPainter'
import MonthDayPicker, {
  defaultMonthDaysFromStart,
} from './MonthDayPicker'

const DAYS = [
  { id: 'sun', label: 'Su' },
  { id: 'mon', label: 'Mo' },
  { id: 'tue', label: 'Tu' },
  { id: 'wed', label: 'We' },
  { id: 'thu', label: 'Th' },
  { id: 'fri', label: 'Fr' },
  { id: 'sat', label: 'Sa' },
]

const REPEAT_UNITS = [
  { id: 'week', label: 'week', patternType: 'weekly' },
  { id: 'month', label: 'month', patternType: 'monthly' },
]

const PHASES = ['format', 'content', 'schedule', 'hours', 'screens']

function formatHour(h) {
  return `${String(h).padStart(2, '0')}:00`
}

function creativeRepeatUnit(creative) {
  if (creative?.repeatUnit === 'month' || creative?.patternType === 'monthly') {
    return 'month'
  }
  // Yearly is not supported — fall back to week
  return 'week'
}

function effectiveDays(creative) {
  if (creative.allDays) return DAYS.map((d) => d.id)
  return creative.days || []
}

function effectiveMonthDays(creative) {
  return (creative.monthDays || [])
    .map(Number)
    .filter((d) => d >= 1 && d <= 31)
}

function isPatternValid(creative) {
  if (!creative.name?.trim()) return false
  if (!creative.startDate) return false
  const every = Number(creative.repeatEveryWeeks) || 0
  if (every < 1) return false
  const unit = creativeRepeatUnit(creative)
  if (unit === 'week' && !effectiveDays(creative).length) return false
  if (unit === 'month' && !effectiveMonthDays(creative).length) return false
  if (creative.endMode === 'date') {
    if (!creative.endDate) return false
    if (creative.startDate > creative.endDate) return false
  }
  if (creative.endMode === 'runDays') {
    if (!creative.runDays || creative.runDays < 1) return false
  }
  // endMode 'campaign' ends with the campaign date range from step 1
  return true
}

function isHoursValid(creative, campaign) {
  const start = Number(campaign?.hourStart)
  const end = Number(campaign?.hourEnd)
  const hasWindow =
    Number.isFinite(start) && Number.isFinite(end) && start < end
  const selected = (creative.hours || []).filter((h) =>
    hasWindow ? h >= start && h < end : true,
  )
  return selected.length > 0
}

function selectionBreakdown(screenIds) {
  const selected = new Set(screenIds || [])
  const companies = new Set()
  const locations = new Set()
  let screens = 0
  for (const loc of INVENTORY) {
    for (const screen of loc.screens) {
      if (!selected.has(screen.id)) continue
      screens += 1
      locations.add(loc.locationId)
      companies.add(loc.companyId)
    }
  }
  return {
    companies: companies.size,
    locations: locations.size,
    screens,
  }
}

export default function CreativeModal({
  creative: initial,
  campaign,
  creatives = [],
  focusPatternQuestion = false,
  focusContentQuestion = false,
  initialPhase = 'format',
  onOpenQuestion,
  onSave,
  onClose,
}) {
  const [creative, setCreative] = useState(initial)
  const [phase, setPhase] = useState(
    PHASES.includes(initialPhase) ? initialPhase : 'format',
  )

  const patternOk = useMemo(() => isPatternValid(creative), [creative])
  const hoursOk = useMemo(
    () => isHoursValid(creative, campaign),
    [creative, campaign],
  )
  const formatOk = useMemo(() => isCreativeFormatValid(creative), [creative])
  const selection = useMemo(
    () => selectionBreakdown(creative.selectedScreenIds),
    [creative.selectedScreenIds],
  )
  const formatScreenIds = useMemo(
    () =>
      filterScreenIdsByFormat(campaign.selectedScreenIds || [], {
        orientation: creative.orientation,
        targetAspectRatio: creative.targetAspectRatio,
      }),
    [
      campaign.selectedScreenIds,
      creative.orientation,
      creative.targetAspectRatio,
    ],
  )
  const bookedScreens = useMemo(
    () => buildBookedScreenMap(creatives, creative, campaign),
    [creatives, creative, campaign],
  )
  const poolCount = campaign.selectedScreenIds?.length || 0
  const bookedInFormat = useMemo(() => {
    const allowed = new Set(formatScreenIds)
    let n = 0
    for (const id of bookedScreens.keys()) {
      if (allowed.has(id)) n += 1
    }
    return n
  }, [bookedScreens, formatScreenIds])
  const formatMismatchCount = Math.max(0, poolCount - formatScreenIds.length)
  const availableInPool = Math.max(0, formatScreenIds.length - bookedInFormat)

  const range = hoursRange(creative.hours || [])
  const repeatUnit = creativeRepeatUnit(creative)

  function patch(partial) {
    setCreative((prev) => {
      const next = { ...prev, ...partial }
      if (
        partial.orientation != null ||
        partial.targetAspectRatio != null
      ) {
        const allowed = new Set(
          filterScreenIdsByFormat(campaign.selectedScreenIds || [], {
            orientation: next.orientation,
            targetAspectRatio: next.targetAspectRatio,
          }),
        )
        next.selectedScreenIds = (next.selectedScreenIds || []).filter((id) =>
          allowed.has(id),
        )
      }
      return next
    })
  }

  function setOrientation(orientation) {
    if (orientation === 'Square') {
      patch({
        orientation,
        targetAspectRatio: ANY_ASPECT_RATIO,
      })
      return
    }
    patch({
      orientation,
      targetAspectRatio: prevAspectOrAny(creative, orientation),
    })
  }

  function prevAspectOrAny(current, orientation) {
    if (current.orientation === orientation && current.targetAspectRatio) {
      return current.targetAspectRatio
    }
    return ANY_ASPECT_RATIO
  }

  function setRepeatUnit(unit) {
    const match = REPEAT_UNITS.find((u) => u.id === unit) || REPEAT_UNITS[0]
    const next = {
      repeatUnit: match.id,
      patternType: match.patternType,
    }
    if (
      match.id === 'month' &&
      !(creative.monthDays && creative.monthDays.length)
    ) {
      next.monthDays = defaultMonthDaysFromStart(creative.startDate)
    }
    patch(next)
  }

  function toggleDay(id) {
    const set = new Set(creative.days || [])
    if (set.has(id)) set.delete(id)
    else set.add(id)
    const days = DAYS.map((d) => d.id).filter((d) => set.has(d))
    patch({
      days,
      allDays: days.length === DAYS.length,
    })
  }

  const daysForDisplay = effectiveDays(creative)
  const monthDaysForDisplay = effectiveMonthDays(creative)

  function handleSave() {
    if (
      !patternOk ||
      !hoursOk ||
      !formatOk ||
      creative.selectedScreenIds.length === 0
    ) {
      return
    }
    onSave({
      ...creative,
      hourStart: range.hourStart,
      hourEnd: range.hourEnd,
    })
  }

  function goNext() {
    const idx = PHASES.indexOf(phase)
    const next = PHASES[idx + 1]
    if (next) setPhase(next)
  }

  function goBackPhase() {
    const idx = PHASES.indexOf(phase)
    const prev = PHASES[idx - 1]
    if (prev) setPhase(prev)
    else onClose()
  }

  const campaignEndDate = campaign.endDate || '—'
  const endDateDisplay =
    creative.endMode === 'campaign' || creative.endMode === 'never'
      ? `Campaign end · ${campaignEndDate}`
      : creative.endMode === 'runDays'
        ? `After ${creative.runDays || '—'} times`
        : creative.endDate || '—'

  const canGoContent = formatOk
  const canGoSchedule = formatOk
  const canGoHours = canGoSchedule && patternOk
  const canGoScreens = canGoHours && hoursOk

  const formatSummary =
    creative.orientation === 'Square'
      ? 'Square · 1:1'
      : creative.orientation
        ? `${creative.orientation} · ${
            creative.targetAspectRatio === ANY_ASPECT_RATIO ||
            !creative.targetAspectRatio
              ? 'Any resolution'
              : creative.targetAspectRatio
          }`
        : 'Format not set'

  return (
    <div className="modal-backdrop" role="presentation" onClick={onClose}>
      <div
        className={`modal-sheet ${
          phase === 'screens' || phase === 'format' ? 'phase-screens' : ''
        } ${phase === 'content' ? 'content-modal editor-open' : ''}`}
        role="dialog"
        aria-modal="true"
        aria-label="Creative editor"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="modal-head">
          <div className="modal-head-copy">
            <h2>{creative.name || 'Untitled creative'}</h2>
            <p className="modal-sub">
              {campaign.startDate} → {campaign.endDate} ·{' '}
              {formatHour(campaign.hourStart)}–{formatHour(campaign.hourEnd)} ·{' '}
              {campaign.slots} slots
            </p>
          </div>
          <button type="button" className="btn-ghost compact" onClick={onClose}>
            Close
          </button>
        </header>

        <div className="modal-phases">
          <button
            type="button"
            className={`phase-tab ${phase === 'format' ? 'active' : ''}`}
            onClick={() => setPhase('format')}
          >
            <span className="phase-index">01</span>
            Format
          </button>
          <button
            type="button"
            className={`phase-tab ${phase === 'content' ? 'active' : ''}`}
            disabled={!canGoContent}
            onClick={() => canGoContent && setPhase('content')}
          >
            <span className="phase-index">02</span>
            Content
          </button>
          <button
            type="button"
            className={`phase-tab ${phase === 'schedule' ? 'active' : ''}`}
            disabled={!canGoSchedule}
            onClick={() => canGoSchedule && setPhase('schedule')}
          >
            <span className="phase-index">03</span>
            Pattern
          </button>
          <button
            type="button"
            className={`phase-tab ${phase === 'hours' ? 'active' : ''}`}
            disabled={!canGoHours}
            onClick={() => canGoHours && setPhase('hours')}
          >
            <span className="phase-index">04</span>
            Hours
          </button>
          <button
            type="button"
            className={`phase-tab ${phase === 'screens' ? 'active' : ''}`}
            disabled={!canGoScreens}
            onClick={() => canGoScreens && setPhase('screens')}
          >
            <span className="phase-index">05</span>
            Screens
          </button>
        </div>

        <div
          className={`modal-body ${
            phase === 'content' ? 'content-modal-body is-editor' : ''
          }`}
        >
          {phase === 'schedule' && (
            <div className="pattern-flow">
              <section
                className={`notion-repeat-card has-question ${
                  focusPatternQuestion ? 'is-question-focus' : ''
                }`}
              >
                <div className="notion-repeat-head">
                  <h3>Repeat</h3>
                  <RelatedQuestionChip
                    questionId="Q04.7"
                    title="Creative date schedule UI (Pattern) vs Notion Calendar"
                    onOpen={() => onOpenQuestion?.('Q04.7')}
                  />
                </div>

                <div className="notion-repeat-row">
                  <span className="notion-repeat-label">Starts</span>
                  <input
                    type="date"
                    className="notion-repeat-input"
                    value={creative.startDate}
                    onChange={(e) => patch({ startDate: e.target.value })}
                  />
                </div>

                <div className="notion-repeat-row">
                  <span className="notion-repeat-label">Every</span>
                  <div className="notion-repeat-every">
                    <input
                      type="number"
                      min={1}
                      className="notion-repeat-input notion-repeat-count"
                      value={creative.repeatEveryWeeks}
                      onChange={(e) =>
                        patch({
                          repeatEveryWeeks: Math.max(
                            1,
                            Number(e.target.value) || 1,
                          ),
                        })
                      }
                    />
                    <select
                      className="notion-repeat-input notion-repeat-unit"
                      value={repeatUnit}
                      onChange={(e) => setRepeatUnit(e.target.value)}
                    >
                      {REPEAT_UNITS.map((unit) => (
                        <option key={unit.id} value={unit.id}>
                          {unit.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {repeatUnit === 'week' && (
                  <div className="notion-repeat-row notion-repeat-days-row">
                    <span className="notion-repeat-label">On</span>
                    <div
                      className="notion-day-row"
                      role="group"
                      aria-label="Days of week"
                    >
                      {DAYS.map((d) => {
                        const on = (creative.days || []).includes(d.id)
                        return (
                          <button
                            key={d.id}
                            type="button"
                            className={`notion-day-chip ${on ? 'on' : ''}`}
                            aria-pressed={on}
                            onClick={() => toggleDay(d.id)}
                          >
                            {d.label}
                          </button>
                        )
                      })}
                    </div>
                  </div>
                )}

                {repeatUnit === 'month' && (
                  <div className="notion-repeat-row notion-repeat-days-row">
                    <span className="notion-repeat-label">On</span>
                    <MonthDayPicker
                      selectedDays={creative.monthDays || []}
                      onChange={(monthDays) => patch({ monthDays })}
                    />
                  </div>
                )}

                <div className="notion-repeat-ends">
                  <span className="notion-repeat-label">Ends</span>
                  <div
                    className="notion-ends-list"
                    role="radiogroup"
                    aria-label="Ends"
                  >
                    <label
                      className={`notion-ends-option ${
                        creative.endMode === 'campaign' ||
                        creative.endMode === 'never'
                          ? 'on'
                          : ''
                      }`}
                    >
                      <input
                        type="radio"
                        name="creative-end-mode"
                        checked={
                          creative.endMode === 'campaign' ||
                          creative.endMode === 'never'
                        }
                        onChange={() =>
                          patch({
                            endMode: 'campaign',
                            endDate: campaign.endDate || creative.endDate,
                          })
                        }
                      />
                      <span className="notion-radio" aria-hidden="true" />
                      <span>Campaign end</span>
                      <span className="notion-ends-suffix">
                        {campaignEndDate}
                      </span>
                    </label>

                    <label
                      className={`notion-ends-option ${
                        creative.endMode === 'date' ? 'on' : ''
                      }`}
                    >
                      <input
                        type="radio"
                        name="creative-end-mode"
                        checked={creative.endMode === 'date'}
                        onChange={() => patch({ endMode: 'date' })}
                      />
                      <span className="notion-radio" aria-hidden="true" />
                      <span>On</span>
                      <input
                        type="date"
                        className="notion-repeat-input"
                        value={creative.endDate || ''}
                        max={campaign.endDate || undefined}
                        disabled={creative.endMode !== 'date'}
                        onChange={(e) =>
                          patch({
                            endMode: 'date',
                            endDate: e.target.value,
                          })
                        }
                      />
                    </label>

                    <label
                      className={`notion-ends-option ${
                        creative.endMode === 'runDays' ? 'on' : ''
                      }`}
                    >
                      <input
                        type="radio"
                        name="creative-end-mode"
                        checked={creative.endMode === 'runDays'}
                        onChange={() => patch({ endMode: 'runDays' })}
                      />
                      <span className="notion-radio" aria-hidden="true" />
                      <span>After</span>
                      <input
                        type="number"
                        min={1}
                        className="notion-repeat-input notion-repeat-count"
                        value={creative.runDays || 1}
                        disabled={creative.endMode !== 'runDays'}
                        onChange={(e) =>
                          patch({
                            endMode: 'runDays',
                            runDays: Math.max(1, Number(e.target.value) || 1),
                          })
                        }
                      />
                      <span className="notion-ends-suffix">times</span>
                    </label>
                  </div>
                </div>

                <p className="notion-repeat-hint">
                  Hours stay on the next step. Pattern stays inside the campaign
                  window ({campaign.startDate} → {campaign.endDate}).
                </p>
              </section>
            </div>
          )}

          {phase === 'hours' && (
            <HoursPainter
              hours={creative.hours || []}
              onChange={(hours) => patch({ hours })}
              allowedHourStart={campaign.hourStart}
              allowedHourEnd={campaign.hourEnd}
            />
          )}

          {phase === 'format' && (
            <div className="creative-format">
              <section className="format-orient-block">
                <div className="format-orient-copy">
                  <h3>Orientation</h3>
                  <p>
                    Choose how this creative should frame. Square skips
                    resolution; screen pick later lists only 1:1 inventory.
                  </p>
                </div>
                <div
                  className="format-orient-row"
                  role="radiogroup"
                  aria-label="Orientation"
                >
                  {CREATIVE_ORIENTATIONS.map((opt) => {
                    const active = creative.orientation === opt.id
                    return (
                      <button
                        key={opt.id}
                        type="button"
                        role="radio"
                        aria-checked={active}
                        className={`format-orient-card ${active ? 'on' : ''}`}
                        onClick={() => setOrientation(opt.id)}
                      >
                        <strong>{opt.label}</strong>
                        <span>{opt.blurb}</span>
                      </button>
                    )
                  })}
                </div>
              </section>

              {creative.orientation === 'Landscape' ||
              creative.orientation === 'Portrait' ? (
                <section className="format-ratio-block">
                  <div className="format-orient-copy">
                    <h3>Resolution</h3>
                    <p>
                      Any first, then resolutions from screens chosen in
                      campaign Choose screens — for{' '}
                      {creative.orientation.toLowerCase()} only.
                    </p>
                  </div>
                  <AspectRatioPicker
                    orientation={creative.orientation}
                    screenIds={campaign.selectedScreenIds || []}
                    value={creative.targetAspectRatio || ANY_ASPECT_RATIO}
                    onChange={(resolution) =>
                      patch({ targetAspectRatio: resolution })
                    }
                  />
                </section>
              ) : null}

              {creative.orientation === 'Square' ? (
                <p className="format-square-note" role="status">
                  Square selected — content is next; screen pick later marks
                  non-square as Wrong format ({formatScreenIds.length} square
                  match
                  {formatScreenIds.length === 1 ? '' : 'es'}).
                </p>
              ) : null}
            </div>
          )}

          {phase === 'screens' && (
            <div className="creative-screens">
              <div className="cs-screens-banner">
                <div>
                  <strong>Campaign inventory</strong>
                  <span>
                    {formatSummary} · every {creative.repeatEveryWeeks}{' '}
                    {repeatUnit}
                    {Number(creative.repeatEveryWeeks) === 1 ? '' : 's'} ·{' '}
                    {creative.startDate} → {endDateDisplay}
                    {repeatUnit === 'week'
                      ? ` · ${
                          creative.allDays || daysForDisplay.length === 7
                            ? 'All days'
                            : `${daysForDisplay.length} day${
                                daysForDisplay.length === 1 ? '' : 's'
                              }`
                        }`
                      : repeatUnit === 'month'
                        ? ` · day${
                            monthDaysForDisplay.length === 1 ? '' : 's'
                          } ${
                            monthDaysForDisplay.length
                              ? monthDaysForDisplay.join(', ')
                              : '—'
                          }`
                        : ''}{' '}
                    · {creative.hours?.length || 0} hours (
                    {formatHour(range.hourStart)}–{formatHour(range.hourEnd)})
                  </span>
                </div>
                <div className="cs-screens-status" aria-label="Screen statuses">
                  <span className="cs-status-pill reason-available">
                    Available · {availableInPool}
                  </span>
                  <span className="cs-status-pill reason-format_mismatch">
                    Wrong format · {formatMismatchCount}
                  </span>
                  <span className="cs-status-pill reason-booked_elsewhere">
                    In another creative · {bookedInFormat}
                  </span>
                </div>
              </div>
              {(campaign.selectedScreenIds?.length || 0) === 0 ? (
                <div className="creatives-empty">
                  <h3>No campaign screens yet</h3>
                  <p>
                    Go back to Choose screens and pick screens for this
                    campaign before assigning them to a creative.
                  </p>
                </div>
              ) : (
                <InventoryPicker
                  compact
                  availabilityMode="creative"
                  slots={campaign.slots}
                  hourStart={range.hourStart}
                  hourEnd={range.hourEnd}
                  startDate={creative.startDate}
                  endDate={
                    creative.endMode === 'date'
                      ? creative.endDate
                      : campaign.endDate
                  }
                  selectedScreenIds={creative.selectedScreenIds}
                  onChangeSelected={(ids) => patch({ selectedScreenIds: ids })}
                  bookedScreens={bookedScreens}
                  allowedScreenIds={campaign.selectedScreenIds}
                  requiredOrientation={creative.orientation}
                  requiredAspectRatio={creative.targetAspectRatio}
                />
              )}
            </div>
          )}

          {phase === 'content' && (
            <CreativeContentStep
              creative={creative}
              creatives={creatives}
              campaign={campaign}
              contentByKey={creative.contentByKey || {}}
              onChangeContent={(contentByKey) => patch({ contentByKey })}
              focusContentQuestion={focusContentQuestion}
              onOpenQuestion={onOpenQuestion}
            />
          )}
        </div>

        <footer className="modal-foot">
          <button type="button" className="btn-ghost" onClick={goBackPhase}>
            Back
          </button>

          {phase === 'format' && (
            <button
              type="button"
              className="btn-primary"
              disabled={!formatOk}
              onClick={goNext}
            >
              Next: content
            </button>
          )}
          {phase === 'content' && (
            <button
              type="button"
              className="btn-primary"
              onClick={goNext}
            >
              Next: pattern
            </button>
          )}
          {phase === 'schedule' && (
            <button
              type="button"
              className="btn-primary"
              disabled={!patternOk}
              onClick={goNext}
            >
              Next: hours
            </button>
          )}
          {phase === 'hours' && (
            <button
              type="button"
              className="btn-primary"
              disabled={!hoursOk}
              onClick={goNext}
            >
              Next: screens
            </button>
          )}
          {phase === 'screens' && (
            <div className="modal-foot-actions">
              <span className="modal-selection-summary">
                {selection.screens === 0
                  ? 'Selected: none'
                  : `Selected: ${selection.companies} compan${selection.companies === 1 ? 'y' : 'ies'} · ${selection.locations} location${selection.locations === 1 ? '' : 's'} · ${selection.screens} screen${selection.screens === 1 ? '' : 's'}`}
              </span>
              <button
                type="button"
                className="btn-primary"
                disabled={
                  selection.screens === 0 ||
                  !patternOk ||
                  !hoursOk ||
                  !formatOk
                }
                onClick={handleSave}
              >
                Save creative
              </button>
            </div>
          )}
        </footer>
      </div>
    </div>
  )
}

export function createEmptyCreative(campaign, index = 1) {
  // Default to campaign window so schedules overlap across creatives
  // (needed for “In another creative” conflicts in the Screens picker).
  const hourStart = Number(campaign.hourStart ?? 10)
  const hourEnd = Number(campaign.hourEnd ?? 22)
  const hours = hoursFromRange(hourStart, hourEnd)
  const range = hoursRange(hours)
  const name = index === 1 ? 'Primary cut' : `Creative ${index}`
  const campaignScreens = campaign.selectedScreenIds || []
  // First creative keeps only 2 screens so later creatives always see
  // 1–2 “In another creative” examples — not the whole pool blocked.
  const selectedScreenIds =
    index === 1 ? campaignScreens.slice(0, Math.min(2, campaignScreens.length)) : []
  return {
    id: `cr_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    name,
    patternType: 'weekly',
    repeatUnit: 'week',
    startDate: campaign.startDate || '2026-03-01',
    endDate: campaign.endDate || '2026-03-31',
    repeatEveryWeeks: 1,
    allDays: true,
    days: DAYS.map((d) => d.id),
    monthDays: defaultMonthDaysFromStart(
      campaign.startDate || '2026-03-01',
    ),
    endMode: 'campaign',
    runDays: 4,
    hours,
    hourStart: range.hourStart,
    hourEnd: range.hourEnd,
    selectedScreenIds,
    orientation: 'Landscape',
    targetAspectRatio: ANY_ASPECT_RATIO,
    contentByKey:
      index === 1 && selectedScreenIds.length > 0
        ? seedContentForFormat(
            'Landscape',
            name,
            Number(campaign.slots) || 6,
          )
        : {},
  }
}

export { formatHour, DAYS }
