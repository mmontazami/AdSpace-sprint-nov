import { useMemo, useRef, useState } from 'react'

const ALL_HOURS = Array.from({ length: 24 }, (_, i) => i)

const PRESETS = [
  { id: 'all', label: 'All allowed' },
  { id: 'clear', label: 'Clear' },
  { id: 'office', label: 'Office 9–5' },
  { id: 'store', label: 'Store 8–9' },
  { id: 'morning', label: 'Morning' },
  { id: 'evening', label: 'Evening' },
]

function formatHourLabel(h) {
  return `${String(h).padStart(2, '0')}:00`
}

function presetHours(id, allowed) {
  let next
  switch (id) {
    case 'all':
      next = [...allowed]
      break
    case 'clear':
      next = []
      break
    case 'office':
      next = ALL_HOURS.filter((h) => h >= 9 && h < 17)
      break
    case 'store':
      next = ALL_HOURS.filter((h) => h >= 8 && h < 21)
      break
    case 'morning':
      next = ALL_HOURS.filter((h) => h >= 6 && h < 12)
      break
    case 'evening':
      next = ALL_HOURS.filter((h) => h >= 17 && h < 23)
      break
    default:
      next = [...allowed]
  }
  const allow = new Set(allowed)
  return next.filter((h) => allow.has(h))
}

function hourTick(h) {
  if (h === 0) return '12a'
  if (h === 12) return '12p'
  if (h < 12) return `${h}a`
  return `${h - 12}p`
}

function showTick(h) {
  return h % 3 === 0
}

/**
 * Creative hours painter. Hours outside the campaign working window
 * (allowedHourStart–allowedHourEnd) are blocked at both ends.
 */
export default function HoursPainter({
  hours,
  onChange,
  allowedHourStart = 0,
  allowedHourEnd = 24,
}) {
  const windowStart = Number(allowedHourStart)
  const windowEnd = Number(allowedHourEnd)
  const hasWindow =
    Number.isFinite(windowStart) &&
    Number.isFinite(windowEnd) &&
    windowStart < windowEnd

  const allowed = useMemo(() => {
    if (!hasWindow) return [...ALL_HOURS]
    return ALL_HOURS.filter((h) => h >= windowStart && h < windowEnd)
  }, [hasWindow, windowStart, windowEnd])

  const allowedSet = useMemo(() => new Set(allowed), [allowed])
  const selected = useMemo(
    () => new Set((hours || []).filter((h) => allowedSet.has(h))),
    [hours, allowedSet],
  )

  const dragRef = useRef(null)
  const [dragging, setDragging] = useState(false)

  function setHours(next) {
    onChange(
      [...next].filter((h) => allowedSet.has(h)).sort((a, b) => a - b),
    )
  }

  function applyPreset(id) {
    setHours(presetHours(id, allowed))
  }

  function paintHour(h, mode) {
    if (!allowedSet.has(h)) return
    const next = new Set(selected)
    if (mode === 'add') next.add(h)
    else next.delete(h)
    setHours(next)
  }

  function onPointerDown(h, e) {
    if (!allowedSet.has(h)) return
    e.preventDefault()
    const mode = selected.has(h) ? 'remove' : 'add'
    dragRef.current = { mode, last: h }
    setDragging(true)
    paintHour(h, mode)
    e.currentTarget.setPointerCapture?.(e.pointerId)
  }

  function onPointerEnter(h) {
    if (!dragging || !dragRef.current) return
    if (!allowedSet.has(h)) return
    if (dragRef.current.last === h) return
    dragRef.current.last = h
    paintHour(h, dragRef.current.mode)
  }

  function onPointerUp() {
    dragRef.current = null
    setDragging(false)
  }

  const am = ALL_HOURS.slice(0, 12)
  const pm = ALL_HOURS.slice(12, 24)
  const count = selected.size
  const blockedBefore = hasWindow ? windowStart : 0
  const blockedAfter = hasWindow ? Math.max(0, 24 - windowEnd) : 0

  return (
    <div className="hours-flow">
      <div className="hours-intro">
        <div>
          <h3>Hours of the day</h3>
          <p>
            Select which hours this creative can play inside the campaign
            working window. Click or drag to paint — same hours on every
            scheduled day.
          </p>
        </div>
        <span className="hours-count">{count} hours selected</span>
      </div>

      {hasWindow && (
        <div className="hours-campaign-window" role="status">
          <div>
            <strong>Campaign working hours</strong>
            <span>
              {formatHourLabel(windowStart)}–{formatHourLabel(windowEnd)}
            </span>
          </div>
          <p>
            {blockedBefore > 0 || blockedAfter > 0
              ? `Blocked outside this window: ${
                  blockedBefore > 0
                    ? `${formatHourLabel(0)}–${formatHourLabel(windowStart)}`
                    : ''
                }${blockedBefore > 0 && blockedAfter > 0 ? ' and ' : ''}${
                  blockedAfter > 0
                    ? `${formatHourLabel(windowEnd)}–${formatHourLabel(24)}`
                    : ''
                }.`
              : 'Full day is available for this campaign.'}
          </p>
        </div>
      )}

      <div className="hours-quick">
        <span className="field-label">Quick</span>
        <div className="hours-presets">
          {PRESETS.map((p) => (
            <button
              key={p.id}
              type="button"
              className="hours-preset"
              onClick={() => applyPreset(p.id)}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      <section
        className="hours-card"
        onPointerUp={onPointerUp}
        onPointerLeave={onPointerUp}
      >
        <HourRow
          hours={am}
          selected={selected}
          allowedSet={allowedSet}
          onPointerDown={onPointerDown}
          onPointerEnter={onPointerEnter}
        />
        <HourRow
          hours={pm}
          selected={selected}
          allowedSet={allowedSet}
          onPointerDown={onPointerDown}
          onPointerEnter={onPointerEnter}
        />
        <p className="hours-foot">
          {count === 0
            ? 'No hours selected'
            : count === allowed.length && allowed.length > 0
              ? `All ${count} campaign hours on every scheduled day`
              : `${count} hours on every scheduled day`}
        </p>
      </section>
    </div>
  )
}

function HourRow({
  hours,
  selected,
  allowedSet,
  onPointerDown,
  onPointerEnter,
}) {
  return (
    <div className="hour-row">
      <div className="hour-blocks">
        {hours.map((h) => {
          const blocked = !allowedSet.has(h)
          const on = !blocked && selected.has(h)
          return (
            <button
              key={h}
              type="button"
              className={`hour-block ${on ? 'on' : ''} ${
                blocked ? 'is-blocked' : ''
              }`}
              aria-pressed={on}
              aria-disabled={blocked}
              disabled={blocked}
              aria-label={
                blocked
                  ? `${hourTick(h)} · outside campaign hours`
                  : hourTick(h)
              }
              title={
                blocked ? 'Outside campaign working hours' : undefined
              }
              onPointerDown={(e) => onPointerDown(h, e)}
              onPointerEnter={() => onPointerEnter(h)}
            />
          )
        })}
      </div>
      <div className="hour-ticks">
        {hours.map((h) => (
          <span
            key={h}
            className={`${showTick(h) ? 'visible' : ''} ${
              allowedSet.has(h) ? '' : 'is-blocked-tick'
            }`}
          >
            {showTick(h) ? hourTick(h) : ''}
          </span>
        ))}
      </div>
    </div>
  )
}

export function allHoursSelected() {
  return [...ALL_HOURS]
}

/** Contiguous hour ids in [start, end). */
export function hoursFromRange(hourStart, hourEnd) {
  const start = Number(hourStart)
  const end = Number(hourEnd)
  if (!Number.isFinite(start) || !Number.isFinite(end) || start >= end) return []
  return ALL_HOURS.filter((h) => h >= start && h < end)
}

export function hoursRange(hours) {
  if (!hours?.length) return { hourStart: 0, hourEnd: 0 }
  const sorted = [...hours].sort((a, b) => a - b)
  return {
    hourStart: sorted[0],
    hourEnd: sorted[sorted.length - 1] + 1,
  }
}
