import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import {
  CREATIVE_SCREEN_STATUSES,
  SCREEN_STATUSES,
} from '../../data/screenStatuses'

/**
 * Wireframe helper: explains inventory unavailable states for reviewers / implementers.
 * @param {'marketplace'|'creative'} [mode='marketplace']
 */
export default function ScreenStatusGuide({
  compact = false,
  mode = 'marketplace',
}) {
  const [open, setOpen] = useState(false)
  const statuses =
    mode === 'creative' ? CREATIVE_SCREEN_STATUSES : SCREEN_STATUSES
  const blurb =
    mode === 'creative'
      ? 'Inside a creative, campaign screens are available unless Format does not match or another creative overlaps on the same screen.'
      : 'Wireframe reference for implementers — reasons a screen may be selectable or blocked in campaign inventory.'

  useEffect(() => {
    if (!open) return undefined
    function onKey(e) {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('keydown', onKey)
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = prev
    }
  }, [open])

  return (
    <div className={`status-guide ${compact ? 'compact' : ''}`}>
      <button
        type="button"
        className="btn-ghost compact status-guide-trigger"
        aria-expanded={open}
        onClick={() => setOpen(true)}
      >
        Screen statuses
      </button>

      {open &&
        createPortal(
          <div
            className="status-guide-backdrop"
            role="presentation"
            onClick={() => setOpen(false)}
          >
            <div
              className="status-guide-panel"
              role="dialog"
              aria-label="Screen statuses"
              onClick={(e) => e.stopPropagation()}
            >
              <header className="status-guide-head">
                <div>
                  <strong>Screen statuses</strong>
                  <p>{blurb}</p>
                </div>
                <button
                  type="button"
                  className="btn-ghost compact"
                  onClick={() => setOpen(false)}
                >
                  Close
                </button>
              </header>

              <ol className="status-guide-list">
                {statuses.map((status, index) => (
                  <li
                    key={status.id}
                    className={`status-guide-item tone-${status.tone}`}
                  >
                    <div className="status-guide-item-top">
                      <span className="status-guide-index">
                        {String(index + 1).padStart(2, '0')}
                      </span>
                      <span
                        className={`status-guide-pill reason-${status.id}`}
                      >
                        {status.label}
                      </span>
                    </div>
                    <p className="status-guide-summary">{status.summary}</p>
                    <p className="status-guide-detail">{status.detail}</p>
                  </li>
                ))}
              </ol>
            </div>
          </div>,
          document.body,
        )}
    </div>
  )
}
