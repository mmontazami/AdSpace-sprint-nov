import { useEffect, useRef, useState } from 'react'
import { INVENTORY } from '../../data/inventory'
import { creativeContentStatus } from '../../data/creativeContent'
import CreativeModal, { createEmptyCreative, DAYS } from './CreativeModal'
import { hoursRange } from './HoursPainter'
import ScreenStatusGuide from './ScreenStatusGuide'

function formatHour(h) {
  return `${String(h).padStart(2, '0')}:00`
}

function dayLabel(days) {
  if (!days?.length) return 'No days'
  if (days.length === 7) return 'Every day'
  const weekday = ['mon', 'tue', 'wed', 'thu', 'fri']
  if (
    days.length === 5 &&
    weekday.every((d) => days.includes(d)) &&
    !days.includes('sat') &&
    !days.includes('sun')
  ) {
    return 'Weekdays'
  }
  if (
    days.length === 6 &&
    !days.includes('sat') &&
    ['sun', ...weekday].every((d) => days.includes(d))
  ) {
    return 'Sun–Fri'
  }
  const map = Object.fromEntries(DAYS.map((d) => [d.id, d.label]))
  return days.map((d) => map[d]).join(', ')
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

function creativeWindow(c) {
  const unit =
    c.repeatUnit === 'month' || c.patternType === 'monthly' ? 'month' : 'week'
  const end =
    c.endMode === 'campaign' || c.endMode === 'never'
      ? 'campaign end'
      : c.endMode === 'runDays'
        ? `after ${c.runDays} times`
        : c.endDate || '—'
  const days =
    unit === 'month'
      ? (c.monthDays || []).length
        ? `day${(c.monthDays || []).length === 1 ? '' : 's'} ${(c.monthDays || []).join(', ')}`
        : 'No days'
      : c.allDays || (c.days || []).length === 7
        ? 'All days'
        : dayLabel(c.days)
  return {
    pattern: c.patternType || 'weekly',
    cadence: `every ${c.repeatEveryWeeks || 1} ${unit}${
      Number(c.repeatEveryWeeks) === 1 ? '' : 's'
    }`,
    range: `${c.startDate || '—'} → ${end}`,
    days,
  }
}

export default function StepCreatives({
  draft,
  onChange,
  focusAnchor,
  onFocusConsumed,
  onOpenQuestion,
}) {
  const [editing, setEditing] = useState(null)
  const [editingInitialPhase, setEditingInitialPhase] = useState('format')
  const [renamingId, setRenamingId] = useState(null)
  const [renameValue, setRenameValue] = useState('')
  const [focusPatternQuestion, setFocusPatternQuestion] = useState(false)
  const [focusContentQuestion, setFocusContentQuestion] = useState(false)
  const renameInputRef = useRef(null)

  const creatives = draft.creatives || []

  useEffect(() => {
    if (renamingId && renameInputRef.current) {
      renameInputRef.current.focus()
      renameInputRef.current.select()
    }
  }, [renamingId])

  useEffect(() => {
    if (focusAnchor !== 'creative-pattern') return
    setFocusPatternQuestion(true)
    setFocusContentQuestion(false)
    setEditingInitialPhase('schedule')
    if (!editing) {
      if (creatives.length > 0) {
        setEditing({ ...creatives[0] })
      } else {
        setEditing(createEmptyCreative(draft, 1))
      }
    }
    onFocusConsumed?.()
  }, [focusAnchor, editing, creatives, draft, onFocusConsumed])

  useEffect(() => {
    if (focusAnchor !== 'creative-content') return
    setFocusContentQuestion(true)
    setFocusPatternQuestion(false)
    setEditingInitialPhase('content')
    if (!editing) {
      if (creatives.length > 0) {
        setEditing({ ...creatives[0] })
      } else {
        setEditing(createEmptyCreative(draft, 1))
      }
    }
    onFocusConsumed?.()
  }, [focusAnchor, editing, creatives, draft, onFocusConsumed])

  function setCreatives(next) {
    onChange({ creatives: next })
  }

  function addCreative() {
    const creative = createEmptyCreative(draft, creatives.length + 1)
    setFocusPatternQuestion(false)
    setFocusContentQuestion(false)
    setEditingInitialPhase('format')
    setEditing(creative)
  }

  function openEditor(creative, phase = 'format') {
    setFocusPatternQuestion(false)
    setFocusContentQuestion(false)
    setEditingInitialPhase(phase)
    setEditing({ ...creative })
  }

  function saveCreative(creative) {
    const exists = creatives.some((c) => c.id === creative.id)
    setCreatives(
      exists
        ? creatives.map((c) => (c.id === creative.id ? creative : c))
        : [...creatives, creative],
    )
    setFocusPatternQuestion(false)
    setFocusContentQuestion(false)
    setEditingInitialPhase('format')
    setEditing(null)
  }

  function removeCreative(id) {
    if (renamingId === id) {
      setRenamingId(null)
      setRenameValue('')
    }
    setCreatives(creatives.filter((c) => c.id !== id))
  }

  function startRename(creative) {
    setRenamingId(creative.id)
    setRenameValue(creative.name || '')
  }

  function cancelRename() {
    setRenamingId(null)
    setRenameValue('')
  }

  function commitRename() {
    if (!renamingId) return
    const nextName = renameValue.trim()
    if (!nextName) {
      cancelRename()
      return
    }
    setCreatives(
      creatives.map((c) =>
        c.id === renamingId ? { ...c, name: nextName } : c,
      ),
    )
    setRenamingId(null)
    setRenameValue('')
  }

  return (
    <div className="step-block creatives-step">
      <div className="creatives-head">
        <div className="creatives-head-copy">
          <p className="creatives-kicker">Step 03</p>
          <h2>Creatives</h2>
          <p className="step-help">
            Each creative needs format (orientation / resolution), content,
            schedule, hours, and screens from the campaign pool. Without content
            it stays inactive. Screens are limited by the campaign pool and
            format.
          </p>
        </div>
        <div className="creatives-head-aside">
          <ScreenStatusGuide mode="creative" />
          <span className="creatives-count-pill">
            <strong>{creatives.length}</strong>
            creative{creatives.length === 1 ? '' : 's'}
          </span>
          <button type="button" className="btn-primary" onClick={addCreative}>
            + Add creative
          </button>
        </div>
      </div>

      {creatives.length === 0 ? (
        <div className="creatives-empty">
          <div className="creatives-empty-mark" aria-hidden="true">
            <span />
            <span />
            <span />
          </div>
          <h3>No creatives yet</h3>
          <p>
            Build the first cut: set the weekly pattern, hours, format, screens,
            then media in the same editor.
          </p>
          <button type="button" className="btn-primary" onClick={addCreative}>
            Create the first creative
          </button>
        </div>
      ) : (
        <ul className="creatives-list">
          {creatives.map((c, index) => {
            const windowMeta = creativeWindow(c)
            const selection = selectionBreakdown(c.selectedScreenIds)
            const range = hoursRange(c.hours || [])
            const isRenaming = renamingId === c.id
            const contentStatus = creativeContentStatus(c)
            const contentReady = contentStatus.ready

            return (
              <li
                key={c.id}
                className={`creative-card ${contentReady ? 'active' : 'inactive'}`}
              >
                <div className="creative-index" aria-hidden="true">
                  {String(index + 1).padStart(2, '0')}
                </div>

                <div className="creative-body">
                  <div className="creative-title-row">
                    {isRenaming ? (
                      <form
                        className="creative-rename"
                        onSubmit={(e) => {
                          e.preventDefault()
                          commitRename()
                        }}
                      >
                        <input
                          ref={renameInputRef}
                          type="text"
                          value={renameValue}
                          onChange={(e) => setRenameValue(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Escape') {
                              e.preventDefault()
                              cancelRename()
                            }
                          }}
                          onBlur={commitRename}
                          aria-label="Creative name"
                          maxLength={80}
                        />
                        <button
                          type="submit"
                          className="btn-ghost compact"
                          onMouseDown={(e) => e.preventDefault()}
                        >
                          Done
                        </button>
                      </form>
                    ) : (
                      <>
                        <h3 className="creative-name">{c.name || 'Untitled'}</h3>
                        <button
                          type="button"
                          className="creative-rename-btn"
                          onClick={() => startRename(c)}
                          title="Rename"
                          aria-label={`Rename ${c.name || 'creative'}`}
                        >
                          Edit
                        </button>
                        <span
                          className={`creative-active-pill ${contentReady ? 'on' : 'off'}`}
                          title={contentStatus.detail}
                        >
                          {contentReady ? 'Active' : 'Inactive'}
                        </span>
                      </>
                    )}
                  </div>

                  <p className="creative-schedule">
                    <span className="creative-schedule-pattern">
                      {windowMeta.pattern}
                    </span>
                    <span className="creative-sep" />
                    <span>{windowMeta.cadence}</span>
                    <span className="creative-sep" />
                    <span>{windowMeta.range}</span>
                    {windowMeta.days ? (
                      <>
                        <span className="creative-sep" />
                        <span>{windowMeta.days}</span>
                      </>
                    ) : null}
                  </p>

                  <div className="creative-chips">
                    <span className="creative-chip">
                      {c.hours?.length || 0} hours
                      {range.hourEnd > range.hourStart
                        ? ` · ${formatHour(range.hourStart)}–${formatHour(range.hourEnd)}`
                        : ''}
                    </span>
                    <span className="creative-chip">
                      {c.orientation || 'No format'}
                      {c.orientation && c.orientation !== 'Square'
                        ? ` · ${
                            !c.targetAspectRatio || c.targetAspectRatio === 'any'
                              ? 'Any resolution'
                              : c.targetAspectRatio
                          }`
                        : c.orientation === 'Square'
                          ? ' · 1:1'
                          : ''}
                    </span>
                    <span className="creative-chip accent">
                      {selection.screens} screen
                      {selection.screens === 1 ? '' : 's'}
                    </span>
                    <span className="creative-chip muted">
                      {selection.companies} compan
                      {selection.companies === 1 ? 'y' : 'ies'}
                    </span>
                    <span className="creative-chip muted">
                      {selection.locations} location
                      {selection.locations === 1 ? '' : 's'}
                    </span>
                    <span
                      className={`creative-chip content ${contentReady ? 'ready' : 'missing'}`}
                      title={contentStatus.detail}
                    >
                      {contentStatus.label}
                    </span>
                  </div>
                </div>

                <div className="creative-actions">
                  <button
                    type="button"
                    className="btn-ghost compact"
                    onClick={() => openEditor(c)}
                  >
                    Open editor
                  </button>
                  <button
                    type="button"
                    className="btn-ghost compact danger"
                    onClick={() => removeCreative(c.id)}
                  >
                    Remove
                  </button>
                </div>
              </li>
            )
          })}
        </ul>
      )}

      {editing && (
        <CreativeModal
          key={`${editing.id}_${editingInitialPhase}_${focusContentQuestion}_${focusPatternQuestion}`}
          creative={editing}
          campaign={draft}
          creatives={creatives}
          initialPhase={editingInitialPhase}
          focusPatternQuestion={focusPatternQuestion}
          focusContentQuestion={focusContentQuestion}
          onOpenQuestion={onOpenQuestion}
          onSave={saveCreative}
          onClose={() => {
            setFocusPatternQuestion(false)
            setFocusContentQuestion(false)
            setEditingInitialPhase('schedule')
            setEditing(null)
          }}
        />
      )}
    </div>
  )
}
