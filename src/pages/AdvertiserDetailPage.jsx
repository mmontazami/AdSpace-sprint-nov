import { useMemo, useState } from 'react'
import {
  advertiserInitials,
  advertiserSpendSummary,
  campaignsForAdvertiser,
} from '../data/advertisers'
import { campaignPayoutLabel } from '../data/campaigns'
import { money } from '../data/revenueAllocation'
import './AdvertisersPage.css'

function formatDate(iso) {
  if (!iso) return '—'
  return new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(iso))
}

function formatMoneyCell(campaign) {
  if (campaign.type !== 'Paid' || campaign.value == null) return '—'
  return money(campaign.value, campaign.currency || 'USD')
}

export default function AdvertiserDetailPage({
  advertiser,
  onBack,
  onChangeAdvertiser,
  onOpenCampaign,
}) {
  const [draft, setDraft] = useState(() => ({ ...advertiser }))
  const [savedFlash, setSavedFlash] = useState(false)

  const campaigns = useMemo(
    () => campaignsForAdvertiser(advertiser.name),
    [advertiser.name],
  )

  const summary = useMemo(
    () => advertiserSpendSummary(advertiser.name),
    [advertiser.name],
  )

  function patch(partial) {
    setDraft((prev) => ({ ...prev, ...partial }))
  }

  function save() {
    const next = {
      ...draft,
      name: draft.name.trim() || advertiser.name,
    }
    onChangeAdvertiser?.(next)
    setDraft(next)
    setSavedFlash(true)
    window.setTimeout(() => setSavedFlash(false), 1600)
  }

  return (
    <div className="advertiser-detail">
      <header className="advertiser-detail-top">
        <button type="button" className="linkish" onClick={onBack}>
          ← Advertisers
        </button>
        <div className="advertiser-detail-actions">
          {savedFlash && <span className="saved-flash">Saved</span>}
          <button type="button" className="btn-primary" onClick={save}>
            Save changes
          </button>
        </div>
      </header>

      <div className="advertiser-detail-hero">
        <span className="advertiser-avatar lg" aria-hidden="true">
          {advertiserInitials(draft.name)}
        </span>
        <div>
          <p className="advertiser-detail-kicker">Advertiser detail</p>
          <h1>{draft.name || 'Untitled advertiser'}</h1>
          <p className="advertiser-detail-sub">
            {summary.campaignCount} campaign
            {summary.campaignCount === 1 ? '' : 's'} · {summary.paidCount} paid
            · spend {summary.totalSpendLabel}
          </p>
        </div>
      </div>

      <section className="advertiser-edit-card">
        <h2>Profile</h2>
        <div className="advertiser-edit-grid">
          <label className="field">
            <span>Name</span>
            <input
              type="text"
              value={draft.name}
              onChange={(e) => patch({ name: e.target.value })}
            />
          </label>
          <label className="field">
            <span>Status</span>
            <select
              value={draft.status || 'Active'}
              onChange={(e) => patch({ status: e.target.value })}
            >
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </select>
          </label>
          <label className="field">
            <span>Contact name</span>
            <input
              type="text"
              value={draft.contactName || ''}
              onChange={(e) => patch({ contactName: e.target.value })}
            />
          </label>
          <label className="field">
            <span>Contact email</span>
            <input
              type="email"
              value={draft.contactEmail || ''}
              onChange={(e) => patch({ contactEmail: e.target.value })}
            />
          </label>
          <label className="field">
            <span>Country</span>
            <input
              type="text"
              value={draft.country || ''}
              onChange={(e) => patch({ country: e.target.value })}
              placeholder="KW / AE / …"
            />
          </label>
          <label className="field span-2">
            <span>Notes</span>
            <textarea
              rows={3}
              value={draft.notes || ''}
              onChange={(e) => patch({ notes: e.target.value })}
            />
          </label>
        </div>
      </section>

      <section className="advertiser-campaigns-card">
        <div className="advertiser-campaigns-head">
          <div>
            <h2>Campaign history</h2>
            <p>
              Campaigns booked under this advertiser, with spend for Paid rows.
            </p>
          </div>
          <div className="advertiser-spend-pill">
            <em>Total paid spend</em>
            <strong>{summary.totalSpendLabel}</strong>
          </div>
        </div>

        <div className="table-wrap">
          <table className="advertisers-table compact">
            <thead>
              <tr>
                <th>Campaign</th>
                <th>Type</th>
                <th>Status</th>
                <th>Dates</th>
                <th>Screens</th>
                <th>Spend</th>
                <th>Payout</th>
              </tr>
            </thead>
            <tbody>
              {campaigns.length === 0 ? (
                <tr>
                  <td colSpan={7} className="advertisers-empty">
                    No campaigns for this advertiser yet.
                  </td>
                </tr>
              ) : (
                campaigns.map((c) => {
                  const payout = campaignPayoutLabel(c)
                  return (
                    <tr
                      key={c.id}
                      className={onOpenCampaign ? 'is-clickable' : ''}
                      tabIndex={onOpenCampaign ? 0 : undefined}
                      onClick={() => onOpenCampaign?.(c)}
                      onKeyDown={(e) => {
                        if (!onOpenCampaign) return
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault()
                          onOpenCampaign(c)
                        }
                      }}
                    >
                      <td>
                        <strong>{c.name}</strong>
                      </td>
                      <td>{c.type}</td>
                      <td>{c.status}</td>
                      <td>
                        {formatDate(c.startDate)} → {formatDate(c.endDate)}
                      </td>
                      <td>{c.screens ?? '—'}</td>
                      <td>{formatMoneyCell(c)}</td>
                      <td>{payout || '—'}</td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}
