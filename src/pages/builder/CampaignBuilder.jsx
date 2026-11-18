import { useEffect, useMemo, useState } from 'react'
import {
  ADVERTISERS,
  createAdvertiser,
  normalizeAdvertiserList,
} from '../../data/advertisers'
import { seedContentForFormat } from '../../data/creativeContent'
import {
  campaignSelectedScreens,
  checkoutSummary,
  money,
} from '../../data/revenueAllocation'
import { createEmptyCreative } from './CreativeModal'
import StepCampaignInfo from './StepCampaignInfo'
import StepChooseLocation from './StepChooseLocation'
import StepCreatives from './StepCreatives'
import StepRevenue from './StepRevenue'
import './CampaignBuilder.css'

const STEPS = [
  { id: 1, label: 'Campaign info' },
  { id: 2, label: 'Choose screens' },
  { id: 3, label: 'Creatives' },
  { id: 4, label: 'Revenue', paidOnly: true },
]

/**
 * Wireframe defaults — c2a1 screens (slots 1–6 band).
 * Two creatives share an overlapping window so Screens always shows
 * 1–2 “In another creative” examples.
 */
const DEFAULT_CAMPAIGN_SCREENS = [
  // Inspire Media
  'SCR-1042',
  'SCR-1043',
  'SCR-1045',
  'SCR-2102',
  'SCR-2103',
  'SCR-E701',
  'SCR-E702',
  // Avenues Ops
  'SCR-3301',
  'SCR-3304',
  'SCR-A101',
  'SCR-A102',
  'SCR-A103',
  'SCR-8802',
  'SCR-8803',
  // Metro Display
  'SCR-5501',
  'SCR-5502',
  'SCR-5503',
  'SCR-B201',
  'SCR-B202',
  'SCR-B301',
  // Beacon Hosts
  'SCR-C301',
  'SCR-C302',
  'SCR-C303',
  'SCR-C401',
  'SCR-C402',
  // Coastal Screens
  'SCR-D501',
  'SCR-D502',
  'SCR-D503',
  'SCR-D601',
  'SCR-D603',
]

/** Screens held by Primary — show as booked when editing the other creative. */
const DEMO_PRIMARY_SCREENS = [
  'SCR-1042',
  'SCR-1043',
  'SCR-1045',
  'SCR-3301',
  'SCR-A101',
  'SCR-E701',
  'SCR-C301',
  'SCR-D501',
]
/** Screens held by Weekend cut — show as booked when editing Primary. */
const DEMO_SECONDARY_SCREENS = [
  'SCR-5502',
  'SCR-5503',
  'SCR-B201',
  'SCR-3304',
  'SCR-C302',
  'SCR-D503',
  'SCR-8803',
]

function buildInitialDraft() {
  const base = {
    name: 'Ramadan Retail Push',
    advertiser: 'Nike GCC',
    type: 'Paid',
    value: '12000',
    currency: 'USD',
    slots: 6,
    startDate: '2026-03-01',
    endDate: '2026-03-31',
    hourStart: 10,
    hourEnd: 22,
    selectedScreenIds: [...DEFAULT_CAMPAIGN_SCREENS],
    creatives: [],
    revenue: {
      referringCompanyIds: [],
      screenPrices: {},
      bundles: [],
    },
  }

  const primary = {
    ...createEmptyCreative(base, 1),
    id: 'cr_demo_primary',
    name: 'Primary cut',
    orientation: 'Landscape',
    targetAspectRatio: 'any',
    selectedScreenIds: [...DEMO_PRIMARY_SCREENS],
    contentByKey: seedContentForFormat(
      'Landscape',
      'Primary cut',
      base.slots,
    ),
  }

  const secondary = {
    ...createEmptyCreative(base, 2),
    id: 'cr_demo_weekend',
    name: 'Weekend cut',
    orientation: 'Landscape',
    targetAspectRatio: 'any',
    selectedScreenIds: [...DEMO_SECONDARY_SCREENS],
    contentByKey: seedContentForFormat(
      'Landscape',
      'Weekend cut',
      base.slots,
    ),
  }

  return { ...base, creatives: [primary, secondary] }
}

const INITIAL_DRAFT = buildInitialDraft()

function pruneCreativesToScreens(creatives, screenIds) {
  const allowed = new Set(screenIds || [])
  return (creatives || []).map((c) => ({
    ...c,
    selectedScreenIds: (c.selectedScreenIds || []).filter((id) =>
      allowed.has(id),
    ),
  }))
}

export default function CampaignBuilder({
  onBack,
  initialStep = 1,
  focusAnchor = null,
  onFocusConsumed,
  onOpenQuestion,
  advertisers: advertisersProp,
  onChangeAdvertisers,
}) {
  const [step, setStep] = useState(initialStep || 1)
  const [draft, setDraft] = useState(() => buildInitialDraft())
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
  const [savedFlash, setSavedFlash] = useState(false)

  useEffect(() => {
    if (initialStep) setStep(initialStep)
  }, [initialStep])

  const visibleSteps = useMemo(
    () => STEPS.filter((s) => !(s.paidOnly && draft.type !== 'Paid')),
    [draft.type],
  )

  function patchDraft(partial) {
    setDraft((prev) => {
      const next = { ...prev, ...partial }
      if (partial.selectedScreenIds) {
        next.creatives = pruneCreativesToScreens(
          next.creatives,
          partial.selectedScreenIds,
        )
      }
      return next
    })
  }

  function handleAdvertiserCommit(name) {
    const trimmed = name.trim()
    if (!trimmed) return
    patchDraft({ advertiser: trimmed })
    setAdvertisers((prev) => {
      const list = normalizeAdvertiserList(prev)
      if (list.some((a) => a.name.toLowerCase() === trimmed.toLowerCase())) {
        return list
      }
      return [...list, createAdvertiser(trimmed)].sort((a, b) =>
        a.name.localeCompare(b.name),
      )
    })
  }

  function saveDraft() {
    setSavedFlash(true)
    window.setTimeout(() => setSavedFlash(false), 1600)
  }

  function goNext() {
    const idx = visibleSteps.findIndex((s) => s.id === step)
    const next = visibleSteps[idx + 1]
    if (next && !next.soon) setStep(next.id)
  }

  function goBack() {
    const idx = visibleSteps.findIndex((s) => s.id === step)
    const prev = visibleSteps[idx - 1]
    if (prev) setStep(prev.id)
  }

  const canContinueStep1 =
    draft.name.trim() &&
    draft.advertiser.trim() &&
    (draft.type !== 'Paid' || (Number(draft.value) > 0 && draft.currency)) &&
    draft.slots >= 1 &&
    draft.slots <= 18 &&
    draft.startDate &&
    draft.endDate &&
    draft.startDate <= draft.endDate &&
    draft.hourStart < draft.hourEnd

  const canContinueStep2 = (draft.selectedScreenIds?.length || 0) > 0

  const step2ScreenCount = draft.selectedScreenIds?.length || 0
  const step2CampaignTotal = Number(draft.value) || 0
  const step2AvgPerScreen =
    draft.type === 'Paid' && step2ScreenCount > 0
      ? step2CampaignTotal / step2ScreenCount
      : null

  const canContinueStep3 =
    draft.creatives.length >= 1 &&
    draft.creatives.every((c) => c.selectedScreenIds?.length > 0)

  const revenueCheckout = useMemo(() => {
    if (draft.type !== 'Paid') return null
    const rows = campaignSelectedScreens(draft.creatives)
    return checkoutSummary(rows, draft.revenue, Number(draft.value) || 0)
  }, [draft.type, draft.creatives, draft.revenue, draft.value])

  const canContinueStep4 =
    draft.type !== 'Paid' ||
    (canContinueStep3 &&
      revenueCheckout &&
      revenueCheckout.screenCount > 0 &&
      !revenueCheckout.absorbBlocked &&
      !revenueCheckout.totalsMismatch)

  return (
    <div className="builder">
      <header className="builder-top">
        <button type="button" className="linkish" onClick={onBack}>
          ← Campaigns
        </button>
        <div className="builder-top-actions">
          {savedFlash && <span className="saved-flash">Draft saved</span>}
          <button type="button" className="btn-ghost" onClick={saveDraft}>
            Save draft
          </button>
        </div>
      </header>

      <div className="builder-title-row">
        <div>
          <h1>New campaign</h1>
          <p className="builder-sub">
            Page-based workspace · incomplete drafts can be saved and resumed
          </p>
        </div>
      </div>

      <nav className="step-rail" aria-label="Campaign builder steps">
        {visibleSteps.map((s) => {
          const active = s.id === step
          const clickable = !s.soon
          return (
            <button
              key={s.id}
              type="button"
              className={`step-pill ${active ? 'active' : ''} ${s.soon ? 'soon' : ''}`}
              disabled={!clickable}
              onClick={() => clickable && setStep(s.id)}
            >
              <span className="step-num">{s.id}</span>
              <span>{s.label}</span>
              {s.soon && <span className="soon-tag">soon</span>}
            </button>
          )
        })}
      </nav>

      <section className="builder-panel">
        {step === 1 && (
          <StepCampaignInfo
            draft={draft}
            advertisers={advertisers}
            onChange={patchDraft}
            onAdvertiserCommit={handleAdvertiserCommit}
            focusAnchor={focusAnchor}
            onFocusConsumed={onFocusConsumed}
            onOpenQuestion={onOpenQuestion}
          />
        )}
        {step === 2 && (
          <StepChooseLocation draft={draft} onChange={patchDraft} />
        )}
        {step === 3 && (
          <StepCreatives
            draft={draft}
            onChange={patchDraft}
            focusAnchor={focusAnchor}
            onFocusConsumed={onFocusConsumed}
            onOpenQuestion={onOpenQuestion}
          />
        )}
        {step === 4 && draft.type === 'Paid' && (
          <StepRevenue draft={draft} onChange={patchDraft} />
        )}
      </section>

      <footer className="builder-footer">
        <button type="button" className="btn-ghost" onClick={goBack} disabled={step === 1}>
          Back
        </button>
        <div className="footer-right">
          {step === 1 && (
            <button
              type="button"
              className="btn-primary"
              disabled={!canContinueStep1}
              onClick={goNext}
            >
              Continue to screens
            </button>
          )}
          {step === 2 && (
            <div className="footer-step2-actions">
              <div className="footer-screen-summary" aria-live="polite">
                <span>
                  <strong>{step2ScreenCount}</strong> screen
                  {step2ScreenCount === 1 ? '' : 's'} selected
                </span>
                {draft.type === 'Paid' ? (
                  <span>
                    Avg{' '}
                    <strong>
                      {step2AvgPerScreen == null
                        ? '—'
                        : money(step2AvgPerScreen, draft.currency || 'USD')}
                    </strong>{' '}
                    / screen
                  </span>
                ) : (
                  <span className="footer-screen-summary-muted">
                    Admin · no campaign total
                  </span>
                )}
              </div>
              <button
                type="button"
                className="btn-primary"
                disabled={!canContinueStep2}
                onClick={goNext}
              >
                Continue to creatives
              </button>
            </div>
          )}
          {step === 3 && (
            <button
              type="button"
              className="btn-primary"
              disabled={!canContinueStep3}
              onClick={() => {
                if (draft.type === 'Paid') goNext()
                else saveDraft()
              }}
            >
              {draft.type === 'Paid'
                ? 'Continue to revenue'
                : 'Save & continue later'}
            </button>
          )}
          {step === 4 && (
            <div className="footer-continue">
              <button
                type="button"
                className="btn-primary"
                disabled={!canContinueStep4}
                onClick={saveDraft}
                title={
                  revenueCheckout?.totalsMismatch
                    ? 'Disabled: campaign total and allocated-to-screens differ because of locked prices'
                    : 'Save this campaign'
                }
              >
                {revenueCheckout?.totalsMismatch
                  ? 'Fix price mismatch to continue'
                  : 'Save campaign'}
              </button>
              {revenueCheckout?.totalsMismatch && (
                <p className="footer-block-reason" role="status">
                  Disabled by settlement mismatch — campaign total ≠ allocated
                  to screens. Unlock or change locked prices until both match.
                </p>
              )}
            </div>
          )}
        </div>
      </footer>
    </div>
  )
}
