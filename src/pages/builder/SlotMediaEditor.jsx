import { useEffect, useMemo, useState } from 'react'
import { MEDIA_LIBRARY, mediaToSlotItem } from '../../data/mediaLibrary'
import {
  MAX_CONTENT_LOOPS,
  cloneLoop,
  createEmptyLoop,
  isAnyContentKey,
  loopHasFilledSlot,
  loopsHaveAnyFill,
  normalizePackageLoops,
} from '../../data/creativeContent'

const PREVIEW_TICK_MS = 900

export function SlotPlaybackPreview({
  loops,
  slotCount,
  packageLabel,
  compact = false,
  autoPlay = false,
  forcePaused = false,
  onPlayingChange,
}) {
  const [previewLoopIndex, setPreviewLoopIndex] = useState(0)
  const [slotIndex, setSlotIndex] = useState(0)
  const [playing, setPlaying] = useState(Boolean(autoPlay))
  const [progress, setProgress] = useState(0)

  const safeLoopIndex = Math.min(previewLoopIndex, Math.max(0, loops.length - 1))
  const activeLoop = loops[safeLoopIndex] || null
  const slots = activeLoop?.slots || []
  const current = slots[slotIndex] || null
  const filledCount = slots.filter(Boolean).length

  useEffect(() => {
    if (previewLoopIndex > loops.length - 1) {
      setPreviewLoopIndex(Math.max(0, loops.length - 1))
    }
  }, [loops.length, previewLoopIndex])

  useEffect(() => {
    setSlotIndex(0)
    setProgress(0)
  }, [safeLoopIndex])

  useEffect(() => {
    setSlotIndex(0)
    setProgress(0)
    setPlaying(false)
  }, [slotCount])

  useEffect(() => {
    if (forcePaused && playing) setPlaying(false)
  }, [forcePaused, playing])

  useEffect(() => {
    onPlayingChange?.(playing)
  }, [playing, onPlayingChange])

  useEffect(() => {
    if (!playing || forcePaused) return undefined
    if (slots.length === 0) {
      setPlaying(false)
      return undefined
    }

    setProgress(0)
    const started = Date.now()
    const tick = window.setInterval(() => {
      const elapsed = Date.now() - started
      setProgress(Math.min(1, elapsed / PREVIEW_TICK_MS))
    }, 40)

    const advance = window.setTimeout(() => {
      setProgress(0)
      if (slotIndex + 1 < slots.length) {
        setSlotIndex(slotIndex + 1)
        return
      }
      if (safeLoopIndex < loops.length - 1) {
        setPreviewLoopIndex(safeLoopIndex + 1)
        setSlotIndex(0)
        return
      }
      setSlotIndex(0)
    }, PREVIEW_TICK_MS)

    return () => {
      window.clearInterval(tick)
      window.clearTimeout(advance)
    }
  }, [playing, forcePaused, slotIndex, slots.length, safeLoopIndex, loops.length])

  function restart() {
    setSlotIndex(0)
    setProgress(0)
    setPlaying(true)
  }

  function step(delta) {
    setPlaying(false)
    setProgress(0)
    setSlotIndex((prev) => {
      const next = prev + delta
      if (next < 0) return Math.max(0, slots.length - 1)
      if (next >= slots.length) return 0
      return next
    })
  }

  function togglePlay() {
    setPlaying((prev) => !prev)
  }

  return (
    <section
      className={`slot-preview ${compact ? 'is-compact' : ''}`}
      aria-label="Playback preview"
    >
      <div className="slot-preview-head">
        <div>
          <p className="slot-editor-kicker">Playback preview</p>
          <strong>
            {packageLabel} · play-through {safeLoopIndex + 1}
          </strong>
        </div>
        {loops.length > 1 && (
          <div className="slot-preview-loops" role="tablist" aria-label="Play-through">
            {loops.map((loop, index) => (
              <button
                key={loop.id}
                type="button"
                role="tab"
                aria-selected={index === safeLoopIndex}
                className={index === safeLoopIndex ? 'active' : ''}
                onClick={() => {
                  setPreviewLoopIndex(index)
                  setSlotIndex(0)
                  setProgress(0)
                  setPlaying(false)
                }}
              >
                P{index + 1}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="slot-preview-stage">
        <div
          className={`slot-preview-screen ${current ? 'has-media' : 'empty'} ${playing ? 'playing' : ''}`}
          style={
            current
              ? { background: current.thumb }
              : undefined
          }
        >
          <div className="slot-preview-veil" />
          {current ? (
            <div className="slot-preview-meta">
              <em>{current.type}</em>
              <strong>{current.name}</strong>
              <span>
                Slot {slotIndex + 1}/{slotCount}
                {current.durationLabel ? ` · ${current.durationLabel}` : ''}
                {current.cutLabel ? ` · ${current.cutLabel}` : ''}
              </span>
            </div>
          ) : (
            <div className="slot-preview-meta empty">
              <strong>Empty slot</strong>
              <span>
                Slot {slotIndex + 1}/{slotCount} — drop media to preview it here
              </span>
            </div>
          )}
          <div className="slot-preview-progress" aria-hidden="true">
            <span style={{ width: `${progress * 100}%` }} />
          </div>
        </div>

        <div className="slot-preview-controls">
          <button type="button" className="btn-ghost compact" onClick={() => step(-1)}>
            Prev
          </button>
          <button
            type="button"
            className="btn-primary compact"
            onClick={togglePlay}
            disabled={filledCount === 0 && !current}
          >
            {playing ? 'Pause' : 'Play'}
          </button>
          <button type="button" className="btn-ghost compact" onClick={() => step(1)}>
            Next
          </button>
          <button type="button" className="btn-ghost compact" onClick={restart}>
            Restart
          </button>
          <span className="slot-preview-status">
            {filledCount}/{slotCount} filled · wireframe timing ~{PREVIEW_TICK_MS}ms/slot
          </span>
        </div>

        <ol className="slot-preview-timeline" aria-label="Slot timeline">
          {slots.map((slot, index) => (
            <li key={`preview-tl-${index}`}>
              <button
                type="button"
                className={`slot-preview-chip ${slot ? 'filled' : 'empty'} ${index === slotIndex ? 'current' : ''}`}
                onClick={() => {
                  setSlotIndex(index)
                  setProgress(0)
                  setPlaying(false)
                }}
                title={slot ? slot.name : `Empty slot ${index + 1}`}
              >
                <span
                  className="slot-preview-chip-thumb"
                  style={slot ? { background: slot.thumb } : undefined}
                />
                <em>S{index + 1}</em>
              </button>
            </li>
          ))}
        </ol>
      </div>
    </section>
  )
}

/**
 * Slot media builder for one resolution / ANY-orientation package.
 * “Loops” = doc loop-by-loop variations (like CMS bands): up to 5 full slot rows.
 */
export default function SlotMediaEditor({
  packageKey,
  packageLabel,
  initialPackage,
  slotCount,
  creativeName,
  onChange,
}) {
  const count = Math.max(1, Number(slotCount) || 6)
  const [loops, setLoops] = useState(() =>
    normalizePackageLoops(initialPackage, count),
  )
  const [mediaQuery, setMediaQuery] = useState('')
  const [mediaFilter, setMediaFilter] = useState('all') // all | video | image
  const [selectedMediaId, setSelectedMediaId] = useState(null)
  const [dragMediaId, setDragMediaId] = useState(null)
  const [dropTarget, setDropTarget] = useState(null)

  const filteredMedia = useMemo(() => {
    const q = mediaQuery.trim().toLowerCase()
    return MEDIA_LIBRARY.filter((m) => {
      if (mediaFilter === 'video' && m.type !== 'video') return false
      if (mediaFilter === 'image' && m.type !== 'image') return false
      if (!q) return true
      return (
        m.name.toLowerCase().includes(q) ||
        m.orientation.toLowerCase().includes(q)
      )
    })
  }, [mediaQuery, mediaFilter])

  function commit(nextLoops) {
    setLoops(nextLoops)
    onChange?.(nextLoops)
  }

  function placeMedia(loopIndex, slotIndex, mediaId) {
    const media = MEDIA_LIBRARY.find((m) => m.id === mediaId)
    if (!media) return
    const next = loops.map((loop, li) => {
      if (li !== loopIndex) return loop
      const slots = [...loop.slots]
      slots[slotIndex] = mediaToSlotItem(media)
      return { ...loop, slots }
    })
    commit(next)
  }

  function clearSlot(loopIndex, slotIndex) {
    const next = loops.map((loop, li) => {
      if (li !== loopIndex) return loop
      const slots = [...loop.slots]
      slots[slotIndex] = null
      return { ...loop, slots }
    })
    commit(next)
  }

  function handleSlotClick(loopIndex, slotIndex) {
    if (selectedMediaId) {
      placeMedia(loopIndex, slotIndex, selectedMediaId)
      return
    }
    if (loops[loopIndex]?.slots?.[slotIndex]) {
      clearSlot(loopIndex, slotIndex)
    }
  }

  function canAddLoop() {
    if (loops.length >= MAX_CONTENT_LOOPS) return false
    return loopsHaveAnyFill(loops)
  }

  function addEmptyLoop() {
    if (!canAddLoop()) return
    commit([...loops, createEmptyLoop(count)])
  }

  function copyLastLoop() {
    if (!canAddLoop()) return
    const source = [...loops].reverse().find(loopHasFilledSlot) || loops[loops.length - 1]
    commit([...loops, cloneLoop(source)])
  }

  function removeLoop(index) {
    if (loops.length <= 1) return
    commit(loops.filter((_, i) => i !== index))
  }

  const atMax = loops.length >= MAX_CONTENT_LOOPS

  return (
    <div className="slot-editor">
      <div className="slot-editor-main">
        <div className="slot-editor-toolbar">
          <div>
            <p className="slot-editor-kicker">
              {isAnyContentKey(packageKey)
                ? 'ANY package'
                : 'Resolution package'}
            </p>
            <h3>
              {packageLabel}
              <span>
                {count} slots · {creativeName}
              </span>
            </h3>
          </div>
          <span className="slot-version-count">
            {loops.length} / {MAX_CONTENT_LOOPS} play-throughs
          </span>
        </div>

        <SlotPlaybackPreview
          loops={loops}
          slotCount={count}
          packageLabel={packageLabel || packageKey}
        />

        <div className="slot-loops">
          {loops.map((loop, loopIndex) => (
            <div key={loop.id} className="slot-loop">
              <div className="slot-loop-head">
                <strong>Play-through {loopIndex + 1}</strong>
                <span>
                  {(loop.slots || []).filter(Boolean).length}/{count} filled
                </span>
                {loops.length > 1 && (
                  <button
                    type="button"
                    className="btn-ghost compact danger"
                    onClick={() => removeLoop(loopIndex)}
                  >
                    Remove
                  </button>
                )}
              </div>
              <div className="slot-row">
                {(loop.slots || []).map((slot, slotIndex) => {
                  const isDrop =
                    dropTarget?.loopIndex === loopIndex &&
                    dropTarget?.slotIndex === slotIndex
                  return (
                    <button
                      key={`${loop.id}_${slotIndex}`}
                      type="button"
                      className={`slot-cell ${slot ? 'filled' : 'empty'} ${isDrop ? 'drop' : ''}`}
                      onClick={() => handleSlotClick(loopIndex, slotIndex)}
                      onDragOver={(e) => {
                        e.preventDefault()
                        setDropTarget({ loopIndex, slotIndex })
                      }}
                      onDragLeave={() => setDropTarget(null)}
                      onDrop={(e) => {
                        e.preventDefault()
                        const id =
                          e.dataTransfer.getData('text/media-id') || dragMediaId
                        setDropTarget(null)
                        setDragMediaId(null)
                        if (id) placeMedia(loopIndex, slotIndex, id)
                      }}
                      title={
                        slot
                          ? `${slot.name} — click to clear`
                          : selectedMediaId
                            ? 'Click to place selected media'
                            : 'Drop media here'
                      }
                    >
                      {slot ? (
                        <>
                          <span
                            className="slot-thumb"
                            style={{ background: slot.thumb }}
                          />
                          <span className="slot-time">
                            {slot.durationLabel || '0:10'}
                          </span>
                          {slot.cutLabel && (
                            <span className="slot-cut">{slot.cutLabel}</span>
                          )}
                          <span className="slot-name">{slot.name}</span>
                        </>
                      ) : (
                        <span className="slot-empty-icon" aria-hidden="true">
                          ▢
                        </span>
                      )}
                      <span className="slot-index">S{slotIndex + 1}</span>
                    </button>
                  )
                })}
              </div>
            </div>
          ))}
        </div>

        {!atMax && (
          <div className={`slot-add-panel ${canAddLoop() ? '' : 'blocked'}`}>
            <div className="slot-add-copy">
              <strong>Need different media on the next run?</strong>
              <p>
                Screens keep repeating these slots. Add another play-through if
                some slots should show different ads next time — you can leave
                the rest the same. Maximum {MAX_CONTENT_LOOPS}.
              </p>
              {!canAddLoop() && (
                <p className="slot-add-gate">
                  Put media in at least one slot above, then you can add another
                  play-through.
                </p>
              )}
            </div>
            <div className="slot-add-actions">
              <button
                type="button"
                className="btn-primary compact"
                disabled={!canAddLoop()}
                onClick={copyLastLoop}
              >
                Duplicate this row
              </button>
              <button
                type="button"
                className="btn-ghost compact"
                disabled={!canAddLoop()}
                onClick={addEmptyLoop}
              >
                Start blank row
              </button>
            </div>
            <p className="slot-add-hint">
              <em>Duplicate</em> copies current slots so you only change what
              differs. <em>Blank</em> starts empty.
            </p>
          </div>
        )}

        {atMax && (
          <p className="slot-add-max">
            You’ve reached the maximum of {MAX_CONTENT_LOOPS} play-throughs.
          </p>
        )}
      </div>

      <aside className="slot-media-rail">
        <div className="slot-media-rail-head">
          <strong>Media</strong>
          <input
            type="search"
            placeholder="Search videos and images…"
            value={mediaQuery}
            onChange={(e) => setMediaQuery(e.target.value)}
          />
          <div className="slot-media-filters" role="group" aria-label="Media type">
            {[
              { id: 'all', label: 'All' },
              { id: 'video', label: 'Videos' },
              { id: 'image', label: 'Images' },
            ].map((opt) => (
              <button
                key={opt.id}
                type="button"
                className={mediaFilter === opt.id ? 'active' : ''}
                onClick={() => setMediaFilter(opt.id)}
              >
                {opt.label}
              </button>
            ))}
          </div>
          <p className="slot-media-hint">
            Drag onto a slot, or select then click a slot.
          </p>
        </div>

        <ul className="slot-media-list">
          {filteredMedia.map((media) => {
            const selected = selectedMediaId === media.id
            return (
              <li key={media.id}>
                <button
                  type="button"
                  className={`slot-media-item ${selected ? 'selected' : ''}`}
                  draggable
                  onDragStart={(e) => {
                    e.dataTransfer.setData('text/media-id', media.id)
                    e.dataTransfer.effectAllowed = 'copy'
                    setDragMediaId(media.id)
                  }}
                  onDragEnd={() => {
                    setDragMediaId(null)
                    setDropTarget(null)
                  }}
                  onClick={() =>
                    setSelectedMediaId((prev) =>
                      prev === media.id ? null : media.id,
                    )
                  }
                >
                  <span
                    className="slot-media-thumb"
                    style={{ background: media.thumb }}
                  />
                  <span className="slot-media-copy">
                    <strong>{media.name}</strong>
                    <span>
                      <em>{media.orientation}</em>
                      {media.type === 'video' ? ` · ${media.durationLabel}` : ''}
                    </span>
                    {media.cutLabel && (
                      <span className="slot-media-cut">{media.cutLabel}</span>
                    )}
                  </span>
                </button>
              </li>
            )
          })}
        </ul>
      </aside>
    </div>
  )
}
