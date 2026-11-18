import { useEffect, useMemo, useRef, useState } from 'react'
import {
  AUDIENCES,
  COMPANIES,
  COUNTRIES,
  LOCATION_TYPES,
} from '../../data/inventory'
import {
  allocateBundle,
  buildRevenueTree,
  campaignSelectedScreens,
  checkoutSummary,
  childBundles,
  createBudgetBundle,
  describePoolFilters,
  dissolveBudgetBundle,
  effectiveBundleBudget,
  listBundles,
  lockPriceInBundle,
  lockSharedTotalInBundle,
  matchRowsByFilters,
  money,
  nextBundleName,
  rootBundles,
  screenBundleMap,
  suggestBundleBudget,
  summarizeRowMatch,
  unlockPricesInBundle,
  updateBudgetBundle,
} from '../../data/revenueAllocation'
import {
  buildPlayDeliveryRows,
  formatDuration,
  formatPlays,
  sumPlayMetrics,
} from '../../data/playDelivery'
import MultiSelectFilter from './MultiSelectFilter'
import PoolFilterForm from './PoolFilterForm'

function checkState(ids, selected) {
  if (ids.length === 0) return 'none'
  const n = ids.filter((id) => selected.has(id)).length
  if (n === 0) return 'unchecked'
  if (n === ids.length) return 'checked'
  return 'partial'
}

function selectableIds(screens) {
  return screens.filter((s) => !s.bundled).map((s) => s.id)
}

export default function StepRevenue({ draft, onChange }) {
  const revenue = draft.revenue || {
    referringCompanyIds: [],
    screenPrices: {},
    bundles: [],
  }
  const currency = draft.currency || 'USD'
  const campaignTotal = Number(draft.value) || 0
  const bundles = listBundles(revenue)
  const poolRoots = useMemo(() => rootBundles(revenue), [revenue])

  const allRows = useMemo(
    () => campaignSelectedScreens(draft.creatives),
    [draft.creatives],
  )

  const playRows = useMemo(
    () => buildPlayDeliveryRows(draft, { plannedOnly: true }),
    [draft],
  )
  const playByScreen = useMemo(() => {
    const map = new Map()
    for (const row of playRows) map.set(row.screenId, row)
    return map
  }, [playRows])
  const playTotals = useMemo(() => sumPlayMetrics(playRows), [playRows])

  const companyOptions = useMemo(
    () =>
      COMPANIES.filter((c) => allRows.some((r) => r.companyId === c.id)).map(
        (c) => ({ id: c.id, label: c.name }),
      ),
    [allRows],
  )

  const locationOptions = useMemo(() => {
    const map = new Map()
    for (const row of allRows) {
      if (!map.has(row.locationId)) {
        map.set(row.locationId, {
          id: row.locationId,
          label: row.locationName,
          meta: row.company,
        })
      }
    }
    return [...map.values()].sort((a, b) => a.label.localeCompare(b.label))
  }, [allRows])

  const [query, setQuery] = useState('')
  const [selectedCompanyIds, setSelectedCompanyIds] = useState(() =>
    companyOptions.map((c) => c.id),
  )
  const [selectedLocationIds, setSelectedLocationIds] = useState(() =>
    locationOptions.map((l) => l.id),
  )
  const [selectedTypes, setSelectedTypes] = useState(() => [...LOCATION_TYPES])
  const [selectedAudiences, setSelectedAudiences] = useState(() => [
    ...AUDIENCES,
  ])
  const [selectedCountries, setSelectedCountries] = useState(() => [
    ...COUNTRIES,
  ])
  const [selectedIds, setSelectedIds] = useState(() => new Set())
  const [bundleBudget, setBundleBudget] = useState('')
  const [bundleName, setBundleName] = useState('')
  const [createOpen, setCreateOpen] = useState(false)
  const [openCompanyId, setOpenCompanyId] = useState(null)
  const [openLocations, setOpenLocations] = useState({})
  const [detailBundleId, setDetailBundleId] = useState(null)
  const [bundleSelectedIds, setBundleSelectedIds] = useState(() => new Set())
  const [bundleLockPrice, setBundleLockPrice] = useState('')
  const [lockError, setLockError] = useState(null)
  const [inlineEditId, setInlineEditId] = useState(null)
  const [inlineEditPrice, setInlineEditPrice] = useState('')
  const [rulesOpen, setRulesOpen] = useState(false)
  const [factorCompact, setFactorCompact] = useState(false)
  const factorSentinelRef = useRef(null)
  const [expandedPoolIds, setExpandedPoolIds] = useState(() => new Set())
  const [poolFormParentId, setPoolFormParentId] = useState(null)
  const [poolLabel, setPoolLabel] = useState('')
  const [poolBudget, setPoolBudget] = useState('')
  const [poolCompanyIds, setPoolCompanyIds] = useState([])
  const [poolLocationIds, setPoolLocationIds] = useState([])
  const [poolTypes, setPoolTypes] = useState([])
  const [poolAudiences, setPoolAudiences] = useState([])
  const [poolCountries, setPoolCountries] = useState([])

  useEffect(() => {
    setSelectedCompanyIds((prev) => {
      const allowed = new Set(companyOptions.map((c) => c.id))
      const kept = prev.filter((id) => allowed.has(id))
      return kept.length ? kept : companyOptions.map((c) => c.id)
    })
    setSelectedLocationIds((prev) => {
      const allowed = new Set(locationOptions.map((l) => l.id))
      const kept = prev.filter((id) => allowed.has(id))
      return kept.length ? kept : locationOptions.map((l) => l.id)
    })
  }, [companyOptions, locationOptions])

  useEffect(() => {
    const sentinel = factorSentinelRef.current
    if (!sentinel || typeof IntersectionObserver === 'undefined') return undefined
    const observer = new IntersectionObserver(
      ([entry]) => setFactorCompact(!entry.isIntersecting),
      { threshold: 0, rootMargin: '-12px 0px 0px 0px' },
    )
    observer.observe(sentinel)
    return () => observer.disconnect()
  }, [])

  const filteredRows = useMemo(() => {
    const q = query.trim().toLowerCase()
    const companySet = new Set(selectedCompanyIds)
    const locationSet = new Set(selectedLocationIds)
    const typeSet = new Set(selectedTypes)
    const audienceSet = new Set(selectedAudiences)
    const countrySet = new Set(selectedCountries)
    return allRows.filter((row) => {
      if (!companySet.has(row.companyId)) return false
      if (!locationSet.has(row.locationId)) return false
      if (!typeSet.has(row.type)) return false
      if (!audienceSet.has(row.audience)) return false
      if (!countrySet.has(row.country)) return false
      if (!q) return true
      const hay =
        `${row.screenId} ${row.screenName} ${row.locationName} ${row.company} ${row.type} ${row.audience}`.toLowerCase()
      return hay.includes(q)
    })
  }, [
    allRows,
    query,
    selectedCompanyIds,
    selectedLocationIds,
    selectedTypes,
    selectedAudiences,
    selectedCountries,
  ])

  const { companies: tree } = useMemo(
    () => buildRevenueTree(filteredRows, revenue, campaignTotal),
    [filteredRows, revenue, campaignTotal],
  )

  const fullCheckout = useMemo(
    () => checkoutSummary(allRows, revenue, campaignTotal),
    [allRows, revenue, campaignTotal],
  )

  const selectedScreenIds = useMemo(() => [...selectedIds], [selectedIds])
  const suggestedBudget = useMemo(
    () =>
      suggestBundleBudget(
        campaignTotal,
        revenue,
        selectedScreenIds.length,
        fullCheckout.unbundledCount,
      ),
    [
      campaignTotal,
      revenue,
      selectedScreenIds.length,
      fullCheckout.unbundledCount,
    ],
  )
  const equalPreview =
    selectedScreenIds.length > 0 && bundleBudget !== ''
      ? (Number(bundleBudget) || 0) / selectedScreenIds.length
      : selectedScreenIds.length > 0
        ? suggestedBudget / selectedScreenIds.length
        : 0

  const detailBundle = useMemo(
    () => bundles.find((b) => b.id === detailBundleId) || null,
    [bundles, detailBundleId],
  )

  const detailAlloc = useMemo(() => {
    if (!detailBundle) return null
    const effectiveBudget = effectiveBundleBudget(detailBundle, revenue)
    return allocateBundle({ ...detailBundle, budget: effectiveBudget })
  }, [detailBundle, revenue])

  const detailRows = useMemo(() => {
    if (!detailBundle) return []
    const idSet = new Set(detailBundle.screenIds || [])
    return allRows.filter((r) => idSet.has(r.screenId))
  }, [detailBundle, allRows])

  const poolFilters = useMemo(
    () => ({
      companyIds: poolCompanyIds,
      locationIds: poolLocationIds,
      types: poolTypes,
      audiences: poolAudiences,
      countries: poolCountries,
    }),
    [
      poolCompanyIds,
      poolLocationIds,
      poolTypes,
      poolAudiences,
      poolCountries,
    ],
  )

  const poolSourceRows = useMemo(() => {
    if (poolFormParentId) {
      const parent = bundles.find((b) => b.id === poolFormParentId)
      if (!parent) return []
      const idSet = new Set(parent.screenIds || [])
      return allRows.filter((r) => idSet.has(r.screenId))
    }
    const taken = screenBundleMap(revenue)
    return allRows.filter((r) => !taken.has(r.screenId))
  }, [poolFormParentId, bundles, allRows, revenue])

  const poolMatchRows = useMemo(
    () => matchRowsByFilters(poolSourceRows, poolFilters),
    [poolSourceRows, poolFilters],
  )
  const poolMatchSummary = useMemo(
    () => summarizeRowMatch(poolMatchRows),
    [poolMatchRows],
  )

  const poolFormMaxBudget = useMemo(() => {
    if (poolFormParentId) {
      const parent = bundles.find((b) => b.id === poolFormParentId)
      return parent ? effectiveBundleBudget(parent, revenue) : 0
    }
    return fullCheckout.unassignedBudget
  }, [poolFormParentId, bundles, revenue, fullCheckout.unassignedBudget])

  const poolSuggestedBudget = useMemo(() => {
    if (poolFormParentId) {
      if (poolMatchRows.length === 0 || poolSourceRows.length === 0) return 0
      return Math.round(
        ((poolFormMaxBudget * poolMatchRows.length) / poolSourceRows.length) *
          1000,
      ) / 1000
    }
    return suggestBundleBudget(
      campaignTotal,
      revenue,
      poolMatchRows.length,
      fullCheckout.unbundledCount,
    )
  }, [
    poolFormParentId,
    poolMatchRows.length,
    poolSourceRows.length,
    poolFormMaxBudget,
    campaignTotal,
    revenue,
    fullCheckout.unbundledCount,
  ])

  useEffect(() => {
    if (!detailBundleId) {
      setBundleSelectedIds(new Set())
      setBundleLockPrice('')
      setLockError(null)
      setInlineEditId(null)
      setInlineEditPrice('')
      return
    }
    if (!bundles.some((b) => b.id === detailBundleId)) {
      setDetailBundleId(null)
    }
  }, [detailBundleId, bundles])

  const bulkLockEachPreview =
    bundleSelectedIds.size > 0 && bundleLockPrice !== ''
      ? (Number(bundleLockPrice) || 0) / bundleSelectedIds.size
      : 0

  function toggleReferring(companyId) {
    const set = new Set(revenue.referringCompanyIds || [])
    if (set.has(companyId)) set.delete(companyId)
    else set.add(companyId)
    onChange({
      revenue: {
        ...revenue,
        referringCompanyIds: [...set],
      },
    })
  }

  function toggleIds(ids) {
    const free = ids.filter((id) => {
      const screen = findScreenInTree(tree, id)
      return screen ? !screen.bundled : true
    })
    if (free.length === 0) return
    setSelectedIds((prev) => {
      const next = new Set(prev)
      const state = checkState(free, next)
      if (state === 'checked') free.forEach((id) => next.delete(id))
      else free.forEach((id) => next.add(id))
      return next
    })
  }

  function resetPoolForm(parentId = null) {
    setPoolFormParentId(parentId)
    setPoolLabel('')
    setPoolBudget('')
    setPoolCompanyIds([])
    setPoolLocationIds([])
    setPoolTypes([])
    setPoolAudiences([])
    setPoolCountries([])
  }

  function openCreateBundle() {
    if (selectedScreenIds.length === 0) return
    setBundleName('')
    setBundleBudget(String(suggestedBudget))
    setCreateOpen(true)
  }

  function createBundle() {
    if (selectedScreenIds.length === 0) return
    const budgetValue =
      bundleBudget === '' ? suggestedBudget : Number(bundleBudget)
    if (!Number.isFinite(budgetValue) || budgetValue < 0) return

    const nextRevenue = createBudgetBundle(revenue, {
      screenIds: selectedScreenIds,
      budget: budgetValue,
      name: bundleName.trim() || nextBundleName(revenue),
    })
    const created = listBundles(nextRevenue).slice(-1)[0]
    onChange({ revenue: nextRevenue })
    setSelectedIds(new Set())
    setBundleBudget('')
    setBundleName('')
    setCreateOpen(false)
    if (created) setDetailBundleId(created.id)
  }

  function addFilterPool() {
    if (poolMatchRows.length === 0) return
    const budgetValue =
      poolBudget === '' ? poolSuggestedBudget : Number(poolBudget)
    if (!Number.isFinite(budgetValue) || budgetValue < 0) return
    if (budgetValue > poolFormMaxBudget + 0.001) return

    const nextRevenue = createBudgetBundle(revenue, {
      screenIds: poolMatchRows.map((r) => r.screenId),
      budget: budgetValue,
      name: poolLabel.trim() || nextBundleName(revenue),
      filters: poolFilters,
      parentId: poolFormParentId,
    })
    const created = listBundles(nextRevenue).slice(-1)[0]
    onChange({ revenue: nextRevenue })
    if (poolFormParentId) {
      setExpandedPoolIds((prev) => new Set([...prev, poolFormParentId]))
    }
    resetPoolForm(null)
    if (created) setDetailBundleId(created.id)
  }

  function removeBundle(bundleId) {
    onChange({ revenue: dissolveBudgetBundle(revenue, bundleId) })
    if (detailBundleId === bundleId) setDetailBundleId(null)
  }

  function renameBundle(bundleId, name) {
    onChange({
      revenue: updateBudgetBundle(revenue, bundleId, {
        name: name.trim() || nextBundleName(revenue),
      }),
    })
  }

  function updateBundleBudgetValue(bundleId, budget) {
    const value = Number(budget)
    if (!Number.isFinite(value) || value < 0) return
    onChange({
      revenue: updateBudgetBundle(revenue, bundleId, { budget: value }),
    })
  }

  function toggleBundleScreenIds(ids) {
    if (ids.length === 0) return
    setBundleSelectedIds((prev) => {
      const next = new Set(prev)
      const state = checkState(ids, next)
      if (state === 'checked') ids.forEach((id) => next.delete(id))
      else ids.forEach((id) => next.add(id))
      return next
    })
  }

  function applyBundleLock() {
    if (!detailBundle || bundleSelectedIds.size === 0) return
    const total = Number(bundleLockPrice)
    if (!Number.isFinite(total) || total < 0) return

    const result = lockSharedTotalInBundle(
      revenue,
      detailBundle.id,
      [...bundleSelectedIds],
      total,
    )
    if (!result.ok) {
      setLockError(
        result.reason === 'price_over_budget'
          ? `Selected total cannot exceed the bundle budget (${money(detailBundle.budget, currency)}).`
          : `Locked total (${money(result.lockedSum, currency)}) would exceed the bundle budget (${money(result.budget, currency)}).`,
      )
      return
    }
    setLockError(null)
    onChange({ revenue: result.revenue })
    setBundleSelectedIds(new Set())
    setBundleLockPrice('')
    setInlineEditId(null)
  }

  function unlockBundleSelected() {
    if (!detailBundle || bundleSelectedIds.size === 0) return
    onChange({
      revenue: unlockPricesInBundle(revenue, detailBundle.id, [
        ...bundleSelectedIds,
      ]),
    })
    setBundleSelectedIds(new Set())
    setLockError(null)
  }

  function startInlineEdit(screenId, currentPrice) {
    setInlineEditId(screenId)
    setInlineEditPrice(String(currentPrice))
    setLockError(null)
  }

  function cancelInlineEdit() {
    setInlineEditId(null)
    setInlineEditPrice('')
  }

  function saveInlineEdit() {
    if (!detailBundle || !inlineEditId) return
    const value = Number(inlineEditPrice)
    if (!Number.isFinite(value) || value < 0) return

    const result = lockPriceInBundle(
      revenue,
      detailBundle.id,
      inlineEditId,
      value,
    )
    if (!result.ok) {
      setLockError(
        result.reason === 'price_over_budget'
          ? `Price cannot exceed the bundle budget (${money(detailBundle.budget, currency)}).`
          : `Locked total (${money(result.lockedSum, currency)}) would exceed the bundle budget (${money(result.budget, currency)}).`,
      )
      return
    }
    setLockError(null)
    onChange({ revenue: result.revenue })
    setInlineEditId(null)
    setInlineEditPrice('')
  }

  const typeOptions = LOCATION_TYPES.map((t) => ({ id: t, label: t }))
  const audienceOptions = AUDIENCES.map((a) => ({ id: a, label: a }))
  const countryOptions = COUNTRIES.map((c) => ({ id: c, label: c }))

  if (allRows.length === 0) {
    return (
      <div className="step-block revenue-step">
        <div className="creatives-head">
          <div className="creatives-head-copy">
            <p className="creatives-kicker">Step 04 · Paid only</p>
            <h2>Revenue allocation</h2>
            <p className="step-help">
              Select screens on at least one creative first.
            </p>
          </div>
        </div>
        <div className="creatives-empty">
          <h3>No screens in this campaign yet</h3>
          <p>
            Choose screens for the campaign, then assign them on creatives
            before setting prices.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="step-block revenue-step">
      <div className="creatives-head">
        <div className="creatives-head-copy">
          <p className="creatives-kicker">Step 04 · Paid only</p>
          <h2>Revenue allocation</h2>
          <p className="step-help">
            Build <em>budget pools</em> from filters (and nested pools inside a
            pool). Screens not in a pool share the leftover campaign budget
            equally. Manage locks from a pool’s detail sheet.
          </p>
        </div>
        <button
          type="button"
          className="btn-ghost compact"
          onClick={() => setRulesOpen(true)}
        >
          Dev rules
        </button>
      </div>

      <div ref={factorSentinelRef} className="rev-factor-sentinel" aria-hidden />

      <div
        className={`rev-factor ${factorCompact ? 'is-compact' : ''} ${fullCheckout.totalsMismatch || fullCheckout.absorbBlocked ? 'has-warn' : ''}`}
      >
        <div className="rev-factor-hero">
          <span className="rev-factor-kicker">Settlement</span>
          <strong className="rev-factor-total">
            {money(fullCheckout.campaignTotal, currency)}
          </strong>
          <em>Campaign total</em>
          {!factorCompact && fullCheckout.allocated > 0 && (
            <div
              className="rev-factor-bar"
              title="Companies earn vs Ad Space retain"
            >
              <span
                className="earn"
                style={{ width: `${fullCheckout.companyPercent}%` }}
              />
              <span
                className="retain"
                style={{ width: `${fullCheckout.adspacePercent}%` }}
              />
            </div>
          )}
        </div>

        <div className="rev-factor-metrics" aria-label="Settlement metrics">
          <div className="rev-factor-tile">
            <em>Allocated</em>
            <strong>{money(fullCheckout.allocated, currency)}</strong>
            {fullCheckout.totalsMismatch && (
              <span className="rev-factor-delta">
                Δ{' '}
                {money(
                  fullCheckout.allocated - fullCheckout.campaignTotal,
                  currency,
                )}
              </span>
            )}
          </div>
          <div className="rev-factor-tile earn">
            <em>Companies</em>
            <strong>{money(fullCheckout.companyEarnings, currency)}</strong>
            <span className="meta">{fullCheckout.companyPercent}%</span>
          </div>
          <div className="rev-factor-tile retain">
            <em>Ad Space</em>
            <strong>{money(fullCheckout.adspaceTake, currency)}</strong>
            <span className="meta">{fullCheckout.adspacePercent}%</span>
          </div>
          <div className="rev-factor-tile">
            <em>In filter pools</em>
            <strong>{money(fullCheckout.bundledBudgetSum, currency)}</strong>
            <span className="meta">{fullCheckout.bundleCount} root pools</span>
          </div>
          <div className="rev-factor-tile">
            <em>Remainder to rest</em>
            <strong>{money(fullCheckout.unassignedBudget, currency)}</strong>
            <span className="meta">
              {fullCheckout.unbundledCount} screens
            </span>
          </div>
          <div className="rev-factor-tile plays">
            <em>Guaranteed</em>
            <strong>{formatPlays(playTotals.guaranteedPlays)}</strong>
            <span className="meta">
              {formatDuration(playTotals.guaranteedSec)}
            </span>
          </div>
        </div>

        {(fullCheckout.absorbBlocked || fullCheckout.totalsMismatch) && (
          <p className="rev-factor-warn" role="alert">
            {fullCheckout.mismatchDirection === 'over'
              ? 'Bundle budgets / locked prices exceed the campaign total.'
              : 'No open screens left to absorb leftover campaign budget.'}{' '}
            Continue is disabled until this is fixed.
          </p>
        )}
      </div>

      <section className="rev-pools" aria-label="Budget pools">
        <header className="rev-pools-head">
          <div>
            <h3>Budget pools</h3>
            <p>
              Filter match → create a pool · nested pools carve screens + budget
              from a parent · tip: location &gt; company &gt; type / audience /
              country
            </p>
          </div>
          <span className="rev-pools-count">
            {poolRoots.length} root · {bundles.length} total
          </span>
        </header>

        {poolRoots.length === 0 ? (
          <div className="rev-pools-empty">
            <strong>No pools yet</strong>
            <p>
              Use filters below to match open screens, set a budget, and add a
              pool — or select screens in the list and use Pool from selection.
            </p>
          </div>
        ) : (
          <ul className="rev-pool-list">
            {poolRoots.map((bundle) => {
              const kids = childBundles(revenue, bundle.id)
              const expanded = expandedPoolIds.has(bundle.id)
              const effective = effectiveBundleBudget(bundle, revenue)
              const alloc = allocateBundle({
                ...bundle,
                budget: effective,
              })
              const nesting = poolFormParentId === bundle.id
              return (
                <li
                  key={bundle.id}
                  className={`rev-pool-item ${expanded ? 'is-open' : ''} ${alloc.absorbBlocked ? 'has-error' : ''}`}
                >
                  <div className="rev-pool-row">
                    <button
                      type="button"
                      className="inv-expand"
                      aria-expanded={expanded}
                      onClick={() =>
                        setExpandedPoolIds((prev) => {
                          const next = new Set(prev)
                          if (next.has(bundle.id)) next.delete(bundle.id)
                          else next.add(bundle.id)
                          return next
                        })
                      }
                    >
                      <span className="inv-chevron" />
                    </button>
                    <button
                      type="button"
                      className="rev-pool-main"
                      onClick={() => setDetailBundleId(bundle.id)}
                    >
                      <strong>{bundle.name}</strong>
                      <span className="rev-pool-meta">
                        {describePoolFilters(bundle.filters)}
                      </span>
                    </button>
                    <span className="rev-pool-stats">
                      {(bundle.screenIds || []).length} screens
                      {kids.length > 0 ? ` · ${kids.length} nested` : ''} →{' '}
                      {money(alloc.equalEach, currency)} each unlocked
                    </span>
                    <label className="rev-pool-budget field">
                      <span className="sr-only">Pool budget</span>
                      <input
                        type="number"
                        min="0"
                        step="0.001"
                        value={bundle.budget}
                        onChange={(e) =>
                          updateBundleBudgetValue(bundle.id, e.target.value)
                        }
                      />
                    </label>
                    <button
                      type="button"
                      className="btn-ghost compact"
                      title="Remove pool"
                      onClick={() => removeBundle(bundle.id)}
                    >
                      Delete
                    </button>
                  </div>

                  {expanded && (
                    <div className="rev-pool-body">
                      <div className="rev-pool-body-actions">
                        <button
                          type="button"
                          className="btn-ghost compact"
                          onClick={() => setDetailBundleId(bundle.id)}
                        >
                          Manage locks
                        </button>
                        <button
                          type="button"
                          className="btn-ghost compact"
                          onClick={() => {
                            resetPoolForm(bundle.id)
                            setPoolBudget(String(Math.max(0, effective)))
                          }}
                        >
                          + Nested pool from filters
                        </button>
                      </div>

                      {kids.length > 0 && (
                        <ul className="rev-pool-children">
                          {kids.map((child) => {
                            const childAlloc = allocateBundle(child)
                            return (
                              <li key={child.id} className="rev-pool-child">
                                <button
                                  type="button"
                                  className="rev-pool-main nested"
                                  onClick={() => setDetailBundleId(child.id)}
                                >
                                  <strong>{child.name}</strong>
                                  <span className="rev-pool-meta">
                                    {describePoolFilters(child.filters)}
                                  </span>
                                </button>
                                <span className="rev-pool-stats">
                                  {(child.screenIds || []).length} screens →{' '}
                                  {money(childAlloc.equalEach, currency)} each
                                </span>
                                <label className="rev-pool-budget field">
                                  <span className="sr-only">Nested budget</span>
                                  <input
                                    type="number"
                                    min="0"
                                    step="0.001"
                                    value={child.budget}
                                    onChange={(e) =>
                                      updateBundleBudgetValue(
                                        child.id,
                                        e.target.value,
                                      )
                                    }
                                  />
                                </label>
                                <button
                                  type="button"
                                  className="btn-ghost compact"
                                  onClick={() => removeBundle(child.id)}
                                >
                                  Delete
                                </button>
                              </li>
                            )
                          })}
                        </ul>
                      )}

                      {nesting && (
                        <div className="rev-pool-add is-nested">
                          <p className="rev-pool-add-note">
                            Nested inside <strong>{bundle.name}</strong> · max{' '}
                            {money(poolFormMaxBudget, currency)} left in parent
                          </p>
                          <PoolFilterForm
                            currency={currency}
                            label={poolLabel}
                            onLabel={setPoolLabel}
                            budget={poolBudget}
                            onBudget={setPoolBudget}
                            suggestedBudget={poolSuggestedBudget}
                            companyOptions={companyOptions}
                            locationOptions={locationOptions}
                            typeOptions={typeOptions}
                            audienceOptions={audienceOptions}
                            countryOptions={countryOptions}
                            companyIds={poolCompanyIds}
                            locationIds={poolLocationIds}
                            types={poolTypes}
                            audiences={poolAudiences}
                            countries={poolCountries}
                            onCompanies={setPoolCompanyIds}
                            onLocations={setPoolLocationIds}
                            onTypes={setPoolTypes}
                            onAudiences={setPoolAudiences}
                            onCountries={setPoolCountries}
                            matchSummary={poolMatchSummary}
                            onAdd={addFilterPool}
                            onCancel={() => resetPoolForm(null)}
                            addLabel="+ Add nested pool"
                          />
                        </div>
                      )}
                    </div>
                  )}
                </li>
              )
            })}
          </ul>
        )}

        {poolFormParentId == null && (
          <div className="rev-pool-add">
            <PoolFilterForm
              currency={currency}
              label={poolLabel}
              onLabel={setPoolLabel}
              budget={poolBudget}
              onBudget={setPoolBudget}
              suggestedBudget={poolSuggestedBudget}
              companyOptions={companyOptions}
              locationOptions={locationOptions}
              typeOptions={typeOptions}
              audienceOptions={audienceOptions}
              countryOptions={countryOptions}
              companyIds={poolCompanyIds}
              locationIds={poolLocationIds}
              types={poolTypes}
              audiences={poolAudiences}
              countries={poolCountries}
              onCompanies={setPoolCompanyIds}
              onLocations={setPoolLocationIds}
              onTypes={setPoolTypes}
              onAudiences={setPoolAudiences}
              onCountries={setPoolCountries}
              matchSummary={poolMatchSummary}
              onAdd={addFilterPool}
              selectionCount={selectedScreenIds.length}
              onPoolFromSelection={
                selectedScreenIds.length > 0 ? openCreateBundle : null
              }
              addLabel="+ Add filter pool"
            />
          </div>
        )}
      </section>

      <section className="rev-screens-panel" aria-label="All screens">
        <header className="rev-split-head">
          <div>
            <h3>All screens</h3>
            <p>
              {allRows.length} in campaign · {fullCheckout.unbundledCount} open
              (not in a pool)
            </p>
          </div>
        </header>

        <div className="rev-filters">
          <label className="field inv-search">
            <span className="sr-only">Search</span>
            <input
              type="search"
              placeholder="Search company / location / screen…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </label>
          <MultiSelectFilter
            label="Company"
            hideLabel
            options={companyOptions}
            selectedIds={selectedCompanyIds}
            onChange={setSelectedCompanyIds}
            allLabel="All companies"
          />
          <MultiSelectFilter
            label="Location"
            hideLabel
            options={locationOptions}
            selectedIds={selectedLocationIds}
            onChange={setSelectedLocationIds}
            allLabel="All locations"
          />
          <MultiSelectFilter
            label="Type"
            hideLabel
            options={typeOptions}
            selectedIds={selectedTypes}
            onChange={setSelectedTypes}
            allLabel="All types"
          />
          <MultiSelectFilter
            label="Audience"
            hideLabel
            options={audienceOptions}
            selectedIds={selectedAudiences}
            onChange={setSelectedAudiences}
            allLabel="All audiences"
          />
          <MultiSelectFilter
            label="Country"
            hideLabel
            options={countryOptions}
            selectedIds={selectedCountries}
            onChange={setSelectedCountries}
            allLabel="All countries"
          />
        </div>

<div className="rev-tree">
            {tree.length === 0 ? (
              <p className="empty-picker">No companies match these filters.</p>
            ) : (
              tree.map((company) => {
                const companyOpen = openCompanyId === company.id
                const companySelectable = company.locations.flatMap((l) =>
                  selectableIds(l.screens),
                )
                const companyState = checkState(companySelectable, selectedIds)
                const shareLabel = company.referring
                  ? 100
                  : company.baseSharePercent

                return (
                  <div
                    key={company.id}
                    className={`rev-company ${companyOpen ? 'open' : ''}`}
                  >
                    <div className="rev-row company">
                      <button
                        type="button"
                        className="inv-expand"
                        aria-expanded={companyOpen}
                        onClick={() =>
                          setOpenCompanyId((prev) =>
                            prev === company.id ? null : company.id,
                          )
                        }
                      >
                        <span className="inv-chevron" />
                      </button>
                      <label
                        className={`inv-check ${companyState} ${companySelectable.length === 0 ? 'is-disabled' : ''}`}
                      >
                        <input
                          type="checkbox"
                          disabled={companySelectable.length === 0}
                          checked={companyState === 'checked'}
                          ref={(el) => {
                            if (el)
                              el.indeterminate = companyState === 'partial'
                          }}
                          onChange={() => toggleIds(companySelectable)}
                        />
                      </label>
                      <button
                        type="button"
                        className="rev-main"
                        onClick={() =>
                          setOpenCompanyId((prev) =>
                            prev === company.id ? null : company.id,
                          )
                        }
                      >
                        <span className="rev-title">
                          <span className="inv-level-badge company">
                            Company
                          </span>
                          <strong>{company.name}</strong>
                        </span>
                        <span className="rev-meta">
                          {company.screenCount} screens ·{' '}
                          {company.locations.length} locations
                        </span>
                      </button>
                      <label className="rev-referring">
                        <input
                          type="checkbox"
                          checked={company.referring}
                          onChange={() => toggleReferring(company.id)}
                        />
                        Referring
                      </label>
                      <span className="rev-share">
                        Share <strong>{shareLabel}%</strong>
                      </span>
                      <span className="rev-money">
                        <strong>{money(company.allocated, currency)}</strong>
                        <em>earn {money(company.earnings, currency)}</em>
                      </span>
                      {(() => {
                        const plays = sumPlaysForScreens(
                          company.locations.flatMap((l) =>
                            l.screens.map((s) => s.id),
                          ),
                          playByScreen,
                        )
                        return plays.guaranteedPlays > 0 ? (
                          <span
                            className="rev-plays-chip"
                            title="Guaranteed min plays for this company’s screens"
                          >
                            ≥{formatPlays(plays.guaranteedPlays)}
                            <em>{formatDuration(plays.guaranteedSec)}</em>
                          </span>
                        ) : null
                      })()}
                    </div>

                    {companyOpen && (
                      <div className="rev-locations">
                        {company.locations.map((loc) => {
                          const locOpen = !!openLocations[loc.id]
                          const locSelectable = selectableIds(loc.screens)
                          const locState = checkState(
                            locSelectable,
                            selectedIds,
                          )
                          const locPlays = sumPlaysForScreens(
                            loc.screens.map((s) => s.id),
                            playByScreen,
                          )
                          return (
                            <div
                              key={loc.id}
                              className={`rev-location ${locOpen ? 'open' : ''}`}
                            >
                              <div className="rev-row location">
                                <button
                                  type="button"
                                  className="inv-expand nested"
                                  aria-expanded={locOpen}
                                  onClick={() =>
                                    setOpenLocations((prev) => ({
                                      ...prev,
                                      [loc.id]: !prev[loc.id],
                                    }))
                                  }
                                >
                                  <span className="inv-chevron" />
                                </button>
                                <label
                                  className={`inv-check ${locState} ${locSelectable.length === 0 ? 'is-disabled' : ''}`}
                                >
                                  <input
                                    type="checkbox"
                                    disabled={locSelectable.length === 0}
                                    checked={locState === 'checked'}
                                    ref={(el) => {
                                      if (el)
                                        el.indeterminate =
                                          locState === 'partial'
                                    }}
                                    onChange={() => toggleIds(locSelectable)}
                                  />
                                </label>
                                <button
                                  type="button"
                                  className="rev-main"
                                  onClick={() =>
                                    setOpenLocations((prev) => ({
                                      ...prev,
                                      [loc.id]: !prev[loc.id],
                                    }))
                                  }
                                >
                                  <span className="rev-title">
                                    <span className="inv-level-badge location">
                                      Location
                                    </span>
                                    <strong>{loc.name}</strong>
                                  </span>
                                  <span className="rev-meta">
                                    {loc.combination} · {loc.country} ·{' '}
                                    {loc.governorate}
                                  </span>
                                </button>
                                <span className="rev-money">
                                  <strong>
                                    {money(loc.allocated, currency)}
                                  </strong>
                                  <em>
                                    {loc.screenCount} screen
                                    {loc.screenCount === 1 ? '' : 's'}
                                  </em>
                                </span>
                                {locPlays.guaranteedPlays > 0 && (
                                  <span
                                    className="rev-plays-chip"
                                    title="Guaranteed min plays for this location"
                                  >
                                    ≥{formatPlays(locPlays.guaranteedPlays)}
                                    <em>
                                      {formatDuration(locPlays.guaranteedSec)}
                                    </em>
                                  </span>
                                )}
                              </div>

                              {locOpen && (
                                <ul className="rev-screens">
                                  {loc.screens.map((screen) => {
                                    const checked = selectedIds.has(screen.id)
                                    const play = playByScreen.get(screen.id)
                                    return (
                                      <li key={screen.id}>
                                        <label
                                          className={`rev-screen-row ${
                                            screen.bundled
                                              ? 'is-bundled'
                                              : screen.overridden
                                                ? 'is-locked'
                                                : 'is-auto'
                                          }`}
                                        >
                                          <input
                                            type="checkbox"
                                            disabled={screen.bundled}
                                            checked={
                                              screen.bundled ? false : checked
                                            }
                                            onChange={() =>
                                              toggleIds([screen.id])
                                            }
                                          />
                                          <span className="inv-level-badge screen tiny">
                                            Screen
                                          </span>
                                          <span className="scr-id">
                                            {screen.id}
                                          </span>
                                          <span className="scr-name">
                                            {screen.name}
                                          </span>
                                          {play && (
                                            <span
                                              className="scr-guarantee"
                                              title={`${play.modeLabel} · guaranteed minimum plays for this campaign window`}
                                            >
                                              <em>Guaranteed</em>
                                              {play.modeShort} · ≥
                                              {formatPlays(play.guaranteedPlays)}
                                              <span>
                                                {formatDuration(
                                                  play.guaranteedSec,
                                                )}
                                              </span>
                                            </span>
                                          )}
                                          {screen.bundled ? (
                                            <button
                                              type="button"
                                              className="rev-bundle-chip"
                                              title="Open this Budget Bundle"
                                              onClick={(e) => {
                                                e.preventDefault()
                                                setDetailBundleId(
                                                  screen.bundleId,
                                                )
                                              }}
                                            >
                                              In {screen.bundleName}
                                            </button>
                                          ) : (
                                            <span className="rev-flexible">
                                              Open
                                            </span>
                                          )}
                                          <span className="rev-screen-price">
                                            {money(screen.price, currency)}
                                            <em>
                                              {screen.bundled
                                                ? screen.overridden
                                                  ? 'locked in bundle'
                                                  : 'bundle / screen'
                                                : 'open / screen'}
                                            </em>
                                          </span>
                                          <span className="rev-screen-earn">
                                            earn{' '}
                                            {money(screen.earnings, currency)}
                                            <em>
                                              {screen.share}% of allocated
                                            </em>
                                          </span>
                                        </label>
                                      </li>
                                    )
                                  })}
                                </ul>
                              )}
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </div>
                )
              })
            )}
          </div>

          {selectedScreenIds.length > 0 && (
            <div className="rev-sticky-create">
              <div className="rev-sticky-create-copy">
                <strong>
                  {selectedScreenIds.length} screen
                  {selectedScreenIds.length === 1 ? '' : 's'} selected
                </strong>
                <span>
                  Suggested {money(suggestedBudget, currency)} · ≈{' '}
                  {money(equalPreview, currency)} / screen
                </span>
              </div>
              <div className="rev-sticky-create-actions">
                <button
                  type="button"
                  className="btn-ghost compact"
                  onClick={() => setSelectedIds(new Set())}
                >
                  Clear
                </button>
                <button
                  type="button"
                  className="btn-primary compact"
                  onClick={openCreateBundle}
                >
                  Create Budget Bundle
                </button>
              </div>
            </div>
          )}
      </section>

      {createOpen && (
        <div className="modal-backdrop" onClick={() => setCreateOpen(false)}>
          <div
            className="modal-sheet rev-create-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="rev-create-title"
            onClick={(e) => e.stopPropagation()}
          >
            <header className="modal-head">
              <div className="modal-head-copy">
                <p className="creatives-kicker">New package</p>
                <h2 id="rev-create-title">Create Budget Bundle</h2>
                <p className="modal-sub">
                  {selectedScreenIds.length} screen
                  {selectedScreenIds.length === 1 ? '' : 's'} will share this
                  budget equally.
                </p>
              </div>
              <button
                type="button"
                className="btn-ghost compact"
                onClick={() => setCreateOpen(false)}
              >
                Close
              </button>
            </header>
            <div className="modal-body">
              <div className="rev-create-fields">
                <label className="field">
                  <span>Bundle name</span>
                  <input
                    type="text"
                    placeholder={nextBundleName(revenue)}
                    value={bundleName}
                    onChange={(e) => setBundleName(e.target.value)}
                    autoFocus
                  />
                </label>
                <label className="field">
                  <span>Bundle budget</span>
                  <input
                    type="number"
                    min="0"
                    step="0.001"
                    value={bundleBudget}
                    onChange={(e) => setBundleBudget(e.target.value)}
                  />
                </label>
              </div>
              <p className="rev-create-preview">
                ≈ {money(equalPreview, currency)} per screen · Open pool left
                after create:{' '}
                {money(
                  Math.max(
                    0,
                    fullCheckout.unassignedBudget -
                      (Number(bundleBudget) || 0),
                  ),
                  currency,
                )}
              </p>
            </div>
            <footer className="modal-foot">
              <div className="modal-foot-actions">
                <button
                  type="button"
                  className="btn-ghost"
                  onClick={() => setCreateOpen(false)}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn-primary"
                  onClick={createBundle}
                >
                  Create bundle
                </button>
              </div>
            </footer>
          </div>
        </div>
      )}

      {detailBundle && detailAlloc && (
        <div
          className="modal-backdrop"
          onClick={() => setDetailBundleId(null)}
        >
          <div
            className="modal-sheet rev-bundle-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="rev-bundle-title"
            onClick={(e) => e.stopPropagation()}
          >
            <header className="modal-head">
              <div className="modal-head-copy">
                <p className="creatives-kicker">Budget Bundle</p>
                <h2 id="rev-bundle-title">
                  <input
                    className="rev-bundle-name-input"
                    value={detailBundle.name}
                    onChange={(e) =>
                      renameBundle(detailBundle.id, e.target.value)
                    }
                    aria-label="Bundle name"
                  />
                </h2>
                <p className="modal-sub">
                  Select screens and lock a shared total — it splits equally
                  across the selection. Or edit one screen’s price inline.
                  Remaining budget redistributes to unlocked screens.
                </p>
              </div>
              <button
                type="button"
                className="btn-ghost compact"
                onClick={() => setDetailBundleId(null)}
              >
                Close
              </button>
            </header>

            <div className="modal-body rev-bundle-modal-body">
              <div className="rev-bundle-modal-stats">
                <label className="rev-bulk-price">
                  <span>Bundle budget</span>
                  <input
                    type="number"
                    min="0"
                    step="0.001"
                    value={detailBundle.budget}
                    onChange={(e) =>
                      updateBundleBudgetValue(detailBundle.id, e.target.value)
                    }
                  />
                </label>
                <div className="rev-stat">
                  <em>Screens</em>
                  <strong>{detailBundle.screenIds.length}</strong>
                </div>
                <div className="rev-stat">
                  <em>Equal / screen</em>
                  <strong>{money(detailAlloc.equalEach, currency)}</strong>
                </div>
                <div className="rev-stat">
                  <em>Locked sum</em>
                  <strong>{money(detailAlloc.lockedSum, currency)}</strong>
                </div>
                <div className="rev-stat">
                  <em>Auto each</em>
                  <strong>{money(detailAlloc.flexibleEach, currency)}</strong>
                </div>
              </div>

              <div className="rev-bulk-bar rev-bundle-lock-bar">
                <div className="rev-bulk-copy">
                  <strong>
                    {bundleSelectedIds.size} screen
                    {bundleSelectedIds.size === 1 ? '' : 's'} selected
                  </strong>
                  <span>
                    Enter a shared total for the selection
                    {bundleSelectedIds.size > 0 && bundleLockPrice !== '' && (
                      <>
                        {' '}
                        · ≈ {money(bulkLockEachPreview, currency)} each
                      </>
                    )}
                    {' · '}
                    max left{' '}
                    <em>
                      {money(
                        Math.max(
                          0,
                          detailAlloc.budget - detailAlloc.lockedSum,
                        ),
                        currency,
                      )}
                    </em>
                  </span>
                </div>
                <div className="rev-bulk-actions">
                  <label className="rev-bulk-price">
                    <span>
                      {bundleSelectedIds.size <= 1
                        ? 'Lock total'
                        : 'Lock total for selected'}
                    </span>
                    <input
                      type="number"
                      min="0"
                      step="0.001"
                      placeholder={
                        bundleSelectedIds.size > 0
                          ? String(
                              Math.round(
                                detailAlloc.flexibleEach *
                                  bundleSelectedIds.size *
                                  1000,
                              ) / 1000,
                            )
                          : String(detailAlloc.flexibleEach)
                      }
                      value={bundleLockPrice}
                      onChange={(e) => {
                        setBundleLockPrice(e.target.value)
                        setLockError(null)
                      }}
                    />
                  </label>
                  <button
                    type="button"
                    className="btn-primary compact"
                    disabled={
                      bundleSelectedIds.size === 0 || bundleLockPrice === ''
                    }
                    onClick={applyBundleLock}
                  >
                    Lock & split
                  </button>
                  <button
                    type="button"
                    className="btn-ghost compact"
                    disabled={bundleSelectedIds.size === 0}
                    onClick={unlockBundleSelected}
                  >
                    Unlock selected
                  </button>
                </div>
              </div>

              {lockError && (
                <p className="rev-bundle-warn" role="alert">
                  {lockError}
                </p>
              )}

              <ul className="rev-bundle-screens">
                {detailRows.map((row) => {
                  const price = detailAlloc.prices.get(row.screenId) || 0
                  const locked = detailAlloc.lockedIds.has(row.screenId)
                  const checked = bundleSelectedIds.has(row.screenId)
                  const editing = inlineEditId === row.screenId
                  return (
                    <li key={row.screenId}>
                      <div
                        className={`rev-screen-row ${locked ? 'is-locked' : 'is-auto'} ${editing ? 'is-editing' : ''}`}
                      >
                        <label className="rev-screen-check">
                          <input
                            type="checkbox"
                            checked={checked}
                            disabled={editing}
                            onChange={() =>
                              toggleBundleScreenIds([row.screenId])
                            }
                          />
                        </label>
                        <span className="scr-id">{row.screenId}</span>
                        <span className="scr-name">{row.screenName}</span>
                        <span className="rev-meta">
                          {row.company} · {row.locationName}
                        </span>
                        {locked ? (
                          <span className="rev-override">Locked</span>
                        ) : (
                          <span className="rev-flexible">Auto</span>
                        )}
                        {editing ? (
                          <div className="rev-inline-edit">
                            <input
                              type="number"
                              min="0"
                              step="0.001"
                              value={inlineEditPrice}
                              onChange={(e) =>
                                setInlineEditPrice(e.target.value)
                              }
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  e.preventDefault()
                                  saveInlineEdit()
                                }
                                if (e.key === 'Escape') {
                                  e.preventDefault()
                                  cancelInlineEdit()
                                }
                              }}
                              autoFocus
                              aria-label={`Price for ${row.screenId}`}
                            />
                            <button
                              type="button"
                              className="btn-primary compact"
                              onClick={saveInlineEdit}
                            >
                              Save
                            </button>
                            <button
                              type="button"
                              className="btn-ghost compact"
                              onClick={cancelInlineEdit}
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <span className="rev-screen-price">
                            {money(price, currency)}
                            <em>{locked ? 'locked' : 'auto in bundle'}</em>
                            <button
                              type="button"
                              className="rev-price-edit"
                              title="Edit this screen’s price"
                              aria-label={`Edit price for ${row.screenId}`}
                              onClick={() =>
                                startInlineEdit(row.screenId, price)
                              }
                            >
                              <svg
                                width="14"
                                height="14"
                                viewBox="0 0 24 24"
                                fill="none"
                                aria-hidden
                              >
                                <path
                                  d="M4 20h4.5L19 9.5 14.5 5 4 15.5V20z"
                                  stroke="currentColor"
                                  strokeWidth="1.8"
                                  strokeLinejoin="round"
                                />
                                <path
                                  d="M12.5 7l4.5 4.5"
                                  stroke="currentColor"
                                  strokeWidth="1.8"
                                  strokeLinecap="round"
                                />
                              </svg>
                            </button>
                          </span>
                        )}
                      </div>
                    </li>
                  )
                })}
              </ul>
            </div>

            <footer className="modal-foot">
              <p className="modal-hint">
                Remaining after locks:{' '}
                {money(
                  Math.max(0, detailAlloc.remainingForFlexible),
                  currency,
                )}{' '}
                → {detailAlloc.flexibleIds.length} auto screen
                {detailAlloc.flexibleIds.length === 1 ? '' : 's'}
              </p>
              <div className="modal-foot-actions">
                <button
                  type="button"
                  className="btn-ghost"
                  onClick={() => removeBundle(detailBundle.id)}
                >
                  Dissolve bundle
                </button>
                <button
                  type="button"
                  className="btn-primary"
                  onClick={() => setDetailBundleId(null)}
                >
                  Done
                </button>
              </div>
            </footer>
          </div>
        </div>
      )}

      {rulesOpen && (
        <div className="modal-backdrop" onClick={() => setRulesOpen(false)}>
          <div
            className="modal-sheet rev-rules-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="rev-rules-title"
            onClick={(e) => e.stopPropagation()}
          >
            <header className="modal-head">
              <div className="modal-head-copy">
                <p className="creatives-kicker">Wireframe · implementer</p>
                <h2 id="rev-rules-title">Budget Bundle rules</h2>
              </div>
              <button
                type="button"
                className="btn-ghost compact"
                onClick={() => setRulesOpen(false)}
              >
                Close
              </button>
            </header>
            <div className="modal-body">
              <ol className="rev-rules-list">
                <li>
                  <strong>Left = screens, right = packages.</strong>
                  Select open screens, then create a Budget Bundle from the
                  sticky action. Packaged screens stay listed but disabled.
                </li>
                <li>
                  <strong>Locks stay inside the bundle.</strong>
                  Open a package to lock screens. Leftover budget redistributes
                  across the other screens in that same bundle.
                </li>
                <li>
                  <strong>Open screens absorb campaign leftover.</strong>
                  Screens not in any bundle share campaign total − sum of
                  bundle budgets.
                </li>
              </ol>
            </div>
            <footer className="modal-foot">
              <div className="modal-foot-actions">
                <button
                  type="button"
                  className="btn-primary"
                  onClick={() => setRulesOpen(false)}
                >
                  Got it
                </button>
              </div>
            </footer>
          </div>
        </div>
      )}
    </div>
  )
}

function findScreenInTree(tree, screenId) {
  for (const company of tree) {
    for (const loc of company.locations) {
      const screen = loc.screens.find((s) => s.id === screenId)
      if (screen) return screen
    }
  }
  return null
}

function sumPlaysForScreens(screenIds, playByScreen) {
  let guaranteedPlays = 0
  let guaranteedSec = 0
  for (const id of screenIds) {
    const play = playByScreen.get(id)
    if (!play) continue
    guaranteedPlays += play.guaranteedPlays || 0
    guaranteedSec += play.guaranteedSec || 0
  }
  return { guaranteedPlays, guaranteedSec }
}
