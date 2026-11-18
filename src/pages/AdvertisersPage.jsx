import { useMemo, useState } from 'react'
import {
  ADVERTISERS,
  advertiserInitials,
  advertiserSpendSummary,
  createAdvertiser,
  normalizeAdvertiserList,
} from '../data/advertisers'
import './AdvertisersPage.css'

export default function AdvertisersPage({
  advertisers: advertisersProp,
  onChangeAdvertisers,
  onOpenAdvertiser,
}) {
  const [localAdvertisers, setLocalAdvertisers] = useState(() =>
    normalizeAdvertiserList(ADVERTISERS),
  )
  const advertisers = advertisersProp
    ? normalizeAdvertiserList(advertisersProp)
    : localAdvertisers

  function setAdvertisers(next) {
    if (onChangeAdvertisers) onChangeAdvertisers(next)
    else setLocalAdvertisers(next)
  }

  const [query, setQuery] = useState('')
  const [creating, setCreating] = useState(false)
  const [newName, setNewName] = useState('')

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase()
    return advertisers
      .map((a) => ({
        ...a,
        summary: advertiserSpendSummary(a.name),
      }))
      .filter((a) => {
        if (!q) return true
        return (
          a.name.toLowerCase().includes(q) ||
          (a.contactName || '').toLowerCase().includes(q) ||
          (a.contactEmail || '').toLowerCase().includes(q) ||
          (a.country || '').toLowerCase().includes(q)
        )
      })
      .sort((a, b) => a.name.localeCompare(b.name))
  }, [advertisers, query])

  function addAdvertiser() {
    const trimmed = newName.trim()
    if (!trimmed) return
    if (
      advertisers.some((a) => a.name.toLowerCase() === trimmed.toLowerCase())
    ) {
      setCreating(false)
      setNewName('')
      return
    }
    setAdvertisers([...advertisers, createAdvertiser(trimmed)])
    setCreating(false)
    setNewName('')
  }

  return (
    <div className="advertisers-page">
      <header className="advertisers-header">
        <div>
          <h1>Advertisers</h1>
          <p className="advertisers-subtitle">
            Brands and companies that book campaigns. Open one to edit details
            and review campaign history and spend.
          </p>
        </div>
        <button
          type="button"
          className="btn-primary"
          onClick={() => setCreating(true)}
        >
          + New advertiser
        </button>
      </header>

      {creating && (
        <section className="advertisers-create" aria-label="Create advertiser">
          <label className="field grow">
            <span>Advertiser name</span>
            <input
              type="text"
              value={newName}
              autoFocus
              placeholder="e.g. Nike GCC"
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  addAdvertiser()
                }
                if (e.key === 'Escape') {
                  setCreating(false)
                  setNewName('')
                }
              }}
            />
          </label>
          <div className="advertisers-create-actions">
            <button
              type="button"
              className="btn-ghost"
              onClick={() => {
                setCreating(false)
                setNewName('')
              }}
            >
              Cancel
            </button>
            <button
              type="button"
              className="btn-primary"
              disabled={!newName.trim()}
              onClick={addAdvertiser}
            >
              Create
            </button>
          </div>
        </section>
      )}

      <section className="advertisers-toolbar" aria-label="Advertiser filters">
        <label className="field grow">
          <span>Search</span>
          <input
            type="search"
            placeholder="Search name, contact, country…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </label>
      </section>

      <p className="advertisers-count">
        Showing <strong>{visible.length}</strong> of {advertisers.length}{' '}
        advertisers
      </p>

      <div className="table-wrap">
        <table className="advertisers-table">
          <thead>
            <tr>
              <th>Advertiser</th>
              <th>Contact</th>
              <th>Country</th>
              <th>Campaigns</th>
              <th>Paid spend</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {visible.length === 0 ? (
              <tr>
                <td colSpan={6} className="advertisers-empty">
                  No advertisers match this search.
                </td>
              </tr>
            ) : (
              visible.map((a) => (
                <tr
                  key={a.id}
                  className="is-clickable"
                  tabIndex={0}
                  onClick={() => onOpenAdvertiser?.(a)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault()
                      onOpenAdvertiser?.(a)
                    }
                  }}
                >
                  <td>
                    <div className="advertiser-cell">
                      <span className="advertiser-avatar" aria-hidden="true">
                        {advertiserInitials(a.name)}
                      </span>
                      <div>
                        <strong>{a.name}</strong>
                        {a.notes ? <em>{a.notes}</em> : null}
                      </div>
                    </div>
                  </td>
                  <td>
                    <div className="advertiser-contact">
                      <span>{a.contactName || '—'}</span>
                      <em>{a.contactEmail || ''}</em>
                    </div>
                  </td>
                  <td>{a.country || '—'}</td>
                  <td>
                    {a.summary.campaignCount}
                    {a.summary.liveCount > 0
                      ? ` · ${a.summary.liveCount} live`
                      : ''}
                  </td>
                  <td>{a.summary.totalSpendLabel}</td>
                  <td>
                    <span
                      className={`advertiser-status ${
                        a.status === 'Active' ? 'ok' : ''
                      }`}
                    >
                      {a.status || 'Active'}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
