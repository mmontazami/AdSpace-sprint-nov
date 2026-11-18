import MultiSelectFilter from './MultiSelectFilter'
import { money } from '../../data/revenueAllocation'

export default function PoolFilterForm({
  currency,
  label,
  onLabel,
  budget,
  onBudget,
  suggestedBudget,
  companyOptions,
  locationOptions,
  typeOptions,
  audienceOptions,
  countryOptions,
  companyIds,
  locationIds,
  types,
  audiences,
  countries,
  onCompanies,
  onLocations,
  onTypes,
  onAudiences,
  onCountries,
  matchSummary,
  onAdd,
  onCancel = null,
  selectionCount = 0,
  onPoolFromSelection = null,
  addLabel = '+ Add filter pool',
}) {
  const canAdd = matchSummary.screens > 0

  return (
    <div className="rev-pool-form">
      <div className="rev-pool-form-fields">
        <label className="field">
          <span>Label (optional)</span>
          <input
            type="text"
            placeholder="e.g. Kuwait malls"
            value={label}
            onChange={(e) => onLabel(e.target.value)}
          />
        </label>
        <label className="field">
          <span>Budget {currency === 'USD' ? '$' : currency}</span>
          <input
            type="number"
            min="0"
            step="0.001"
            placeholder={String(suggestedBudget || 0)}
            value={budget}
            onChange={(e) => onBudget(e.target.value)}
          />
        </label>
      </div>

      <div className="rev-pool-form-filters">
        <MultiSelectFilter
          label="Company"
          hideLabel
          options={companyOptions}
          selectedIds={
            companyIds.length ? companyIds : companyOptions.map((c) => c.id)
          }
          onChange={(ids) => {
            const all = companyOptions.map((c) => c.id)
            onCompanies(ids.length === all.length ? [] : ids)
          }}
          allLabel="All companies"
        />
        <MultiSelectFilter
          label="Location"
          hideLabel
          options={locationOptions}
          selectedIds={
            locationIds.length ? locationIds : locationOptions.map((l) => l.id)
          }
          onChange={(ids) => {
            const all = locationOptions.map((l) => l.id)
            onLocations(ids.length === all.length ? [] : ids)
          }}
          allLabel="All locations"
        />
        <MultiSelectFilter
          label="Type"
          hideLabel
          options={typeOptions}
          selectedIds={types.length ? types : typeOptions.map((t) => t.id)}
          onChange={(ids) => {
            const all = typeOptions.map((t) => t.id)
            onTypes(ids.length === all.length ? [] : ids)
          }}
          allLabel="All types"
        />
        <MultiSelectFilter
          label="Audience"
          hideLabel
          options={audienceOptions}
          selectedIds={
            audiences.length ? audiences : audienceOptions.map((a) => a.id)
          }
          onChange={(ids) => {
            const all = audienceOptions.map((a) => a.id)
            onAudiences(ids.length === all.length ? [] : ids)
          }}
          allLabel="All audiences"
        />
        <MultiSelectFilter
          label="Country"
          hideLabel
          options={countryOptions}
          selectedIds={
            countries.length ? countries : countryOptions.map((c) => c.id)
          }
          onChange={(ids) => {
            const all = countryOptions.map((c) => c.id)
            onCountries(ids.length === all.length ? [] : ids)
          }}
          allLabel="All countries"
        />
      </div>

      <div className="rev-pool-form-foot">
        <p className="rev-pool-match" role="status">
          {matchSummary.screens} screen{matchSummary.screens === 1 ? '' : 's'} ·{' '}
          {matchSummary.companies} compan
          {matchSummary.companies === 1 ? 'y' : 'ies'} ·{' '}
          {matchSummary.locations} location
          {matchSummary.locations === 1 ? '' : 's'}
          {matchSummary.screens > 0 && (
            <>
              {' '}
              · ≈{' '}
              {money(
                (Number(budget) || suggestedBudget || 0) /
                  Math.max(1, matchSummary.screens),
                currency,
              )}{' '}
              / screen
            </>
          )}
        </p>
        <div className="rev-pool-form-actions">
          {onCancel && (
            <button type="button" className="btn-ghost compact" onClick={onCancel}>
              Cancel
            </button>
          )}
          {onPoolFromSelection && (
            <button
              type="button"
              className="btn-ghost compact"
              onClick={onPoolFromSelection}
            >
              Pool from selection ({selectionCount})
            </button>
          )}
          <button
            type="button"
            className="btn-primary compact"
            disabled={!canAdd}
            onClick={onAdd}
          >
            {addLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
