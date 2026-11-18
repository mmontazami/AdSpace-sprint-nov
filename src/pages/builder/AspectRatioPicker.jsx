import { useMemo, useState } from 'react'
import {
  ANY_ASPECT_RATIO,
  resolutionsFromScreens,
} from '../../data/aspectRatios'

function CheckIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">
      <path
        d="M3.5 8.5 6.5 11.5 12.5 4.5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function SearchIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">
      <circle
        cx="7"
        cy="7"
        r="4.5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
      />
      <path
        d="M10.5 10.5 13.5 13.5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  )
}

/**
 * Format resolution picker — Any first, then resolutions from campaign screens.
 */
export default function AspectRatioPicker({
  orientation,
  screenIds,
  value,
  onChange,
}) {
  const [query, setQuery] = useState('')

  const fromScreens = useMemo(
    () => resolutionsFromScreens(screenIds, orientation),
    [screenIds, orientation],
  )

  const needle = query.trim().toLowerCase()

  const filteredFromScreens = useMemo(() => {
    if (!needle) return fromScreens
    return fromScreens.filter(
      (row) =>
        row.resolution.toLowerCase().includes(needle) ||
        (row.ratio && row.ratio.toLowerCase().includes(needle)),
    )
  }, [fromScreens, needle])

  const showAny =
    !needle || 'any'.includes(needle) || 'all'.includes(needle)

  const selected = value || ANY_ASPECT_RATIO

  return (
    <div className="aspect-ratio-picker">
      <label className="aspect-ratio-search">
        <span className="sr-only">Search resolutions</span>
        <SearchIcon />
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search resolutions…"
          autoComplete="off"
        />
      </label>

      <div
        className="aspect-ratio-menu"
        role="listbox"
        aria-label="Target resolution"
      >
        {showAny && (
          <section className="aspect-ratio-group">
            <h4>Fit</h4>
            <ul>
              <li>
                <button
                  type="button"
                  role="option"
                  aria-selected={selected === ANY_ASPECT_RATIO}
                  className={`aspect-ratio-option ${
                    selected === ANY_ASPECT_RATIO ? 'active' : ''
                  }`}
                  onClick={() => onChange(ANY_ASPECT_RATIO)}
                >
                  <span className="aspect-ratio-option-main">
                    <strong>Any</strong>
                    <em>· every {orientation?.toLowerCase()} screen</em>
                  </span>
                  {selected === ANY_ASPECT_RATIO && <CheckIcon />}
                </button>
              </li>
            </ul>
          </section>
        )}

        {filteredFromScreens.length > 0 && (
          <section className="aspect-ratio-group">
            <h4>From your screens</h4>
            <ul>
              {filteredFromScreens.map((row) => {
                const active = selected === row.resolution
                return (
                  <li key={row.resolution}>
                    <button
                      type="button"
                      role="option"
                      aria-selected={active}
                      className={`aspect-ratio-option ${active ? 'active' : ''}`}
                      onClick={() => onChange(row.resolution)}
                    >
                      <span className="aspect-ratio-option-main">
                        <strong>{row.resolution}</strong>
                        <em>
                          · {row.count} screen{row.count === 1 ? '' : 's'}
                          {row.ratio ? ` · ${row.ratio}` : ''}
                        </em>
                      </span>
                      {active && <CheckIcon />}
                    </button>
                  </li>
                )
              })}
            </ul>
          </section>
        )}

        {filteredFromScreens.length === 0 && !showAny && (
          <p className="aspect-ratio-empty">
            No resolutions match “{query}”.
          </p>
        )}

        {filteredFromScreens.length === 0 && showAny && !needle && (
          <p className="aspect-ratio-empty">
            No {orientation?.toLowerCase()} resolutions in the campaign screen
            pool yet.
          </p>
        )}
      </div>
    </div>
  )
}
