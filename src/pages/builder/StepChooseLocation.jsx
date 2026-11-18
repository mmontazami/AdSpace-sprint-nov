import { loopModeForSlots } from '../../data/loopModes'
import { money } from '../../data/revenueAllocation'
import InventoryPicker from './InventoryPicker'
import ScreenStatusGuide from './ScreenStatusGuide'

function formatHour(h) {
  return `${String(h).padStart(2, '0')}:00`
}

export default function StepChooseLocation({ draft, onChange }) {
  const selectedCount = draft.selectedScreenIds?.length || 0
  const slotMode = loopModeForSlots(draft.slots)
  const campaignTotal = Number(draft.value) || 0
  const avgPerScreen =
    draft.type === 'Paid' && selectedCount > 0
      ? campaignTotal / selectedCount
      : null

  return (
    <div className="step-block location-step">
      <div className="creatives-head">
        <div className="creatives-head-copy">
          <p className="creatives-kicker">Step 02</p>
          <h2>Choose screens</h2>
          <p className="step-help">
            Inventory for this campaign’s booking window (
            {draft.startDate || '—'} → {draft.endDate || '—'} ·{' '}
            {formatHour(draft.hourStart)}–{formatHour(draft.hourEnd)} ·{' '}
            {draft.slots} slots · {slotMode.mode.label}). Only screens on that
            loop mode are listed. Select the screens this campaign may use;
            creatives in the next step only see this pool.
          </p>
        </div>
        <div className="creatives-head-aside">
          <ScreenStatusGuide mode="marketplace" />
          <div className="screens-selection-summary">
            <span className="creatives-count-pill">
              <strong>{selectedCount}</strong>
              screen{selectedCount === 1 ? '' : 's'} selected
            </span>
            {draft.type === 'Paid' && (
              <span
                className="creatives-count-pill screens-avg-pill"
                title="Equal split of campaign total across selected screens"
              >
                Avg{' '}
                <strong>
                  {avgPerScreen == null
                    ? '—'
                    : money(avgPerScreen, draft.currency || 'USD')}
                </strong>
                / screen
              </span>
            )}
          </div>
        </div>
      </div>

      <InventoryPicker
        availabilityMode="marketplace"
        slots={draft.slots}
        hourStart={draft.hourStart}
        hourEnd={draft.hourEnd}
        startDate={draft.startDate}
        endDate={draft.endDate}
        selectedScreenIds={draft.selectedScreenIds || []}
        onChangeSelected={(ids) => onChange({ selectedScreenIds: ids })}
      />
    </div>
  )
}
