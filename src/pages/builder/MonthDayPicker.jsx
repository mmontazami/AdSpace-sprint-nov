import { useMemo } from 'react'

const MONTH_DAY_OPTIONS = Array.from({ length: 31 }, (_, i) => i + 1)

/**
 * Monthly pattern day picker — same chip UX as weekly weekdays.
 * Pick day-of-month numbers 1–31; they repeat every N months.
 */
export default function MonthDayPicker({ selectedDays = [], onChange }) {
  const selected = useMemo(
    () =>
      new Set(
        (selectedDays || []).map(Number).filter((d) => d >= 1 && d <= 31),
      ),
    [selectedDays],
  )

  function toggleDay(day) {
    const next = new Set(selected)
    if (next.has(day)) next.delete(day)
    else next.add(day)
    onChange([...next].sort((a, b) => a - b))
  }

  return (
    <div
      className="notion-day-row notion-month-day-row"
      role="group"
      aria-label="Days of month"
    >
      {MONTH_DAY_OPTIONS.map((day) => {
        const on = selected.has(day)
        return (
          <button
            key={day}
            type="button"
            className={`notion-day-chip ${on ? 'on' : ''}`}
            aria-pressed={on}
            onClick={() => toggleDay(day)}
          >
            {day}
          </button>
        )
      })}
    </div>
  )
}

export function defaultMonthDaysFromStart(startDate) {
  if (!startDate) return [1]
  const day = Number(String(startDate).split('-')[2])
  if (!day || day < 1 || day > 31) return [1]
  return [day]
}
