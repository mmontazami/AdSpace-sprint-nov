import { useEffect, useMemo, useRef, useState } from 'react'

/**
 * Searchable multi-select. All options selected by default (controlled).
 * Hovering an option reveals Only when more than one item is currently selected.
 */
export default function MultiSelectFilter({
  label,
  hideLabel = false,
  options,
  selectedIds,
  onChange,
  allLabel = 'All',
  /** When set, empty selection shows this label and means “no filter” (e.g. Any). */
  emptyLabel = null,
  searchPlaceholder = 'Search…',
  disabled = false,
}) {
  const [open, setOpen] = useState(false)
  const [q, setQ] = useState('')
  const rootRef = useRef(null)

  useEffect(() => {
    function onDoc(e) {
      if (!rootRef.current?.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', onDoc)
    return () => document.removeEventListener('mousedown', onDoc)
  }, [])

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase()
    if (!needle) return options
    return options.filter((o) => o.label.toLowerCase().includes(needle))
  }, [options, q])

  const selectedSet = useMemo(() => new Set(selectedIds), [selectedIds])
  const allSelected =
    options.length > 0 && options.every((o) => selectedSet.has(o.id))
  const noneSelected = selectedIds.length === 0
  const showOnly = selectedIds.length > 1

  const summary = (() => {
    if (options.length === 0) return 'None'
    if (noneSelected) return emptyLabel || 'None selected'
    if (allSelected && !emptyLabel) return allLabel
    if (allSelected && emptyLabel) return emptyLabel
    if (selectedIds.length === 1) {
      return options.find((o) => o.id === selectedIds[0])?.label ?? '1 selected'
    }
    return `${selectedIds.length} selected`
  })()

  function toggle(id) {
    const next = new Set(selectedIds)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    onChange([...next])
  }

  function only(id) {
    onChange([id])
  }

  function selectAllVisible() {
    onChange(options.map((o) => o.id))
  }

  return (
    <div
      className={`msf ${disabled ? 'disabled' : ''} ${hideLabel ? 'msf-nolabel' : ''}`}
      ref={rootRef}
    >
      <span className={`msf-label ${hideLabel ? 'sr-only' : ''}`}>{label}</span>
      <button
        type="button"
        className={`msf-trigger ${open ? 'open' : ''}`}
        disabled={disabled || options.length === 0}
        onClick={() => setOpen((v) => !v)}
        title={label}
        aria-label={label}
      >
        <span className="msf-summary">
          {hideLabel ? (
            <>
              <em>{label}</em> {summary}
            </>
          ) : (
            summary
          )}
        </span>
        <span className="msf-caret" />
      </button>

      {open && (
        <div className="msf-panel">
          <input
            className="msf-search"
            type="search"
            placeholder={searchPlaceholder}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            autoFocus
          />
          <div className="msf-actions">
            <button type="button" onClick={selectAllVisible}>
              Select all
            </button>
            <button type="button" onClick={() => onChange([])}>
              Clear
            </button>
          </div>
          <ul className="msf-list">
            {filtered.length === 0 ? (
              <li className="msf-empty">No matches</li>
            ) : (
              filtered.map((opt) => {
                const checked = selectedSet.has(opt.id)
                return (
                  <li key={opt.id} className="msf-item">
                    <label>
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggle(opt.id)}
                      />
                      <span className="msf-item-label">{opt.label}</span>
                      {opt.meta && <span className="msf-item-meta">{opt.meta}</span>}
                    </label>
                    {showOnly && (
                      <button
                        type="button"
                        className="msf-only"
                        onClick={() => only(opt.id)}
                      >
                        Only
                      </button>
                    )}
                  </li>
                )
              })
            )}
          </ul>
        </div>
      )}
    </div>
  )
}
