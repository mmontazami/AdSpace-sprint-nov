import { INVENTORY, getCompany } from './inventory'

/** Unique screens selected across all creatives. */
export function campaignSelectedScreens(creatives) {
  const ids = new Set()
  for (const creative of creatives || []) {
    for (const id of creative.selectedScreenIds || []) ids.add(id)
  }

  const rows = []
  for (const loc of INVENTORY) {
    for (const screen of loc.screens) {
      if (!ids.has(screen.id)) continue
      rows.push({
        screenId: screen.id,
        screenName: screen.name,
        locationId: loc.locationId,
        locationName: loc.locationName,
        companyId: loc.companyId,
        company: loc.company,
        type: loc.type,
        audience: loc.audience,
        country: loc.country,
        governorate: loc.governorate,
        shareOverridePercent: loc.shareOverridePercent ?? null,
      })
    }
  }
  return rows
}

export function defaultPricePerScreen(campaignTotal, screenCount) {
  const total = Number(campaignTotal) || 0
  const n = Math.max(0, screenCount)
  if (n === 0) return 0
  return round3(total / n)
}

function round3(n) {
  return Math.round((Number(n) || 0) * 1000) / 1000
}

function hasOwn(obj, key) {
  return Object.prototype.hasOwnProperty.call(obj || {}, key)
}

/** Split `remaining` equally across `ids`, fixing rounding on the last item. */
function splitEqually(prices, ids, remaining) {
  if (ids.length === 0) return
  const each = round3(remaining / ids.length)
  let assigned = 0
  ids.forEach((id, index) => {
    if (index === ids.length - 1) {
      prices.set(id, round3(remaining - assigned))
    } else {
      prices.set(id, each)
      assigned = round3(assigned + each)
    }
  })
}

/**
 * Allocate one Budget Bundle:
 * lockedPrices stay fixed; unlocked screens absorb the rest equally.
 */
export function allocateBundle(bundle) {
  const screenIds = [...(bundle?.screenIds || [])]
  const budget = round3(Number(bundle?.budget) || 0)
  const locks = bundle?.lockedPrices || {}
  const lockedIds = screenIds.filter((id) => hasOwn(locks, id))
  const flexibleIds = screenIds.filter((id) => !hasOwn(locks, id))

  let lockedSum = 0
  for (const id of lockedIds) lockedSum += Number(locks[id]) || 0
  lockedSum = round3(lockedSum)

  const remaining = round3(budget - lockedSum)
  const overAllocated = remaining < -0.001
  const underWithNoFlexible = flexibleIds.length === 0 && remaining > 0.001
  const absorbBlocked = overAllocated || underWithNoFlexible
  const mismatchDirection = overAllocated
    ? 'over'
    : underWithNoFlexible
      ? 'under'
      : null

  const prices = new Map()
  for (const id of lockedIds) {
    prices.set(id, round3(Number(locks[id]) || 0))
  }

  const canSplit = flexibleIds.length > 0 && !overAllocated
  if (canSplit) {
    splitEqually(prices, flexibleIds, remaining)
  } else {
    for (const id of flexibleIds) prices.set(id, 0)
  }

  const flexibleEach = canSplit ? round3(remaining / flexibleIds.length) : 0

  return {
    prices,
    lockedIds: new Set(lockedIds),
    flexibleIds,
    flexibleEach,
    lockedSum,
    remainingForFlexible: remaining,
    budget,
    screenCount: screenIds.length,
    absorbBlocked,
    mismatchDirection,
    overAllocated,
    equalEach:
      screenIds.length > 0 ? round3(budget / screenIds.length) : 0,
  }
}

export function listBundles(revenue) {
  return Array.isArray(revenue?.bundles) ? revenue.bundles : []
}

export function screenBundleMap(revenue) {
  const map = new Map()
  for (const bundle of listBundles(revenue)) {
    for (const id of bundle.screenIds || []) {
      map.set(id, bundle)
    }
  }
  return map
}

export function nextBundleName(revenue) {
  const n = listBundles(revenue).length + 1
  return `Budget Bundle ${n}`
}

export function suggestBundleBudget(
  campaignTotal,
  revenue,
  selectedCount,
  openScreenCount,
) {
  const total = Number(campaignTotal) || 0
  const bundled = rootBundles(revenue).reduce(
    (sum, b) => sum + (Number(b.budget) || 0),
    0,
  )
  const unassigned = Math.max(0, round3(total - bundled))
  const selected = Math.max(0, selectedCount || 0)
  const open = Math.max(0, openScreenCount || 0)
  if (selected <= 0) return unassigned
  if (open <= 0) return unassigned
  // Proportional slice of the leftover campaign pool for this selection.
  return round3(unassigned * (selected / open))
}

/**
 * Campaign total stays fixed.
 *
 * Prefer Budget Bundles when present:
 * - Each bundle owns a budget split across its screens (locks absorb inside the bundle).
 * - Screens outside any bundle share the leftover campaign budget equally.
 *
 * Legacy fallback (no bundles): screenPrices = manual overrides (locked);
 * remaining budget splits equally across non-overridden screens.
 */
export function computeScreenAllocations(rows, revenue, campaignTotal) {
  const bundles = listBundles(revenue)
  if (bundles.length > 0) {
    return computeBundleAllocations(rows, revenue, campaignTotal)
  }
  return computeLegacyAllocations(rows, revenue, campaignTotal)
}

function computeLegacyAllocations(rows, revenue, campaignTotal) {
  const total = Number(campaignTotal) || 0
  const overrides = revenue?.screenPrices || {}
  const overriddenIds = rows
    .map((r) => r.screenId)
    .filter((id) => hasOwn(overrides, id))

  let lockedSum = 0
  for (const id of overriddenIds) {
    lockedSum += Number(overrides[id]) || 0
  }
  lockedSum = round3(lockedSum)

  const flexibleIds = rows
    .map((r) => r.screenId)
    .filter((id) => !hasOwn(overrides, id))

  const remaining = round3(total - lockedSum)
  const overAllocated = remaining < -0.001
  const underWithNoFlexible = flexibleIds.length === 0 && remaining > 0.001
  const absorbBlocked = overAllocated || underWithNoFlexible
  const mismatchDirection = overAllocated
    ? 'over'
    : underWithNoFlexible
      ? 'under'
      : null

  const canSplitRemainder = flexibleIds.length > 0 && !overAllocated
  const flexibleEach = canSplitRemainder
    ? round3(remaining / flexibleIds.length)
    : 0

  const prices = new Map()
  if (canSplitRemainder) {
    splitEqually(prices, flexibleIds, remaining)
  } else {
    for (const id of flexibleIds) prices.set(id, 0)
  }
  for (const id of overriddenIds) {
    prices.set(id, round3(Number(overrides[id]) || 0))
  }

  return {
    prices,
    overriddenIds: new Set(overriddenIds),
    flexibleIds,
    flexibleEach,
    lockedSum,
    remainingForFlexible: remaining,
    absorbBlocked,
    mismatchDirection,
    overAllocated,
    defaultEach: defaultPricePerScreen(total, rows.length),
    mode: 'legacy',
    bundles: [],
    bundleByScreen: new Map(),
    bundledBudgetSum: 0,
    unbundledIds: flexibleIds,
    unassignedBudget: remaining,
  }
}

function computeBundleAllocations(rows, revenue, campaignTotal) {
  const total = Number(campaignTotal) || 0
  const rowIds = rows.map((r) => r.screenId)
  const rowIdSet = new Set(rowIds)
  const prices = new Map()
  const overriddenIds = new Set()
  const bundleByScreen = new Map()
  const bundleSummaries = []
  let absorbBlocked = false
  let mismatchDirection = null

  // Only root pool budgets count against campaign total (children carve from parent).
  const bundledBudgetSum = round3(
    rootBundles(revenue).reduce((sum, b) => sum + (Number(b.budget) || 0), 0),
  )

  for (const bundle of listBundles(revenue)) {
    const screenIds = (bundle.screenIds || []).filter((id) => rowIdSet.has(id))
    const effectiveBudget = effectiveBundleBudget(bundle, revenue)
    const scoped = { ...bundle, screenIds, budget: effectiveBudget }
    const alloc = allocateBundle(scoped)
    bundleSummaries.push({
      id: bundle.id,
      name: bundle.name,
      parentId: bundle.parentId || null,
      filters: bundle.filters || null,
      ...alloc,
      poolBudget: round3(Number(bundle.budget) || 0),
      screenIds,
    })

    if (alloc.absorbBlocked) {
      absorbBlocked = true
      mismatchDirection = alloc.mismatchDirection
    }

    for (const id of screenIds) {
      bundleByScreen.set(id, bundle)
      const price = alloc.prices.get(id) || 0
      prices.set(id, price)
      if (alloc.lockedIds.has(id)) overriddenIds.add(id)
    }
  }

  const unbundledIds = rowIds.filter((id) => !bundleByScreen.has(id))
  const unassignedBudget = round3(total - bundledBudgetSum)
  const overUnassigned = unassignedBudget < -0.001
  const underWithNoOpen =
    unbundledIds.length === 0 && unassignedBudget > 0.001

  if (overUnassigned) {
    absorbBlocked = true
    mismatchDirection = 'over'
  } else if (underWithNoOpen) {
    absorbBlocked = true
    if (!mismatchDirection) mismatchDirection = 'under'
  }

  const canSplitOpen = unbundledIds.length > 0 && !overUnassigned
  const flexibleEach = canSplitOpen
    ? round3(unassignedBudget / unbundledIds.length)
    : 0

  if (canSplitOpen) {
    splitEqually(prices, unbundledIds, unassignedBudget)
  } else {
    for (const id of unbundledIds) prices.set(id, 0)
  }

  // Flexible = unlocked inside bundles + fully open (unbundled) screens
  const flexibleIds = rowIds.filter((id) => !overriddenIds.has(id))

  return {
    prices,
    overriddenIds,
    flexibleIds,
    flexibleEach,
    lockedSum: round3(
      [...overriddenIds].reduce((s, id) => s + (prices.get(id) || 0), 0),
    ),
    remainingForFlexible: unassignedBudget,
    absorbBlocked,
    mismatchDirection,
    overAllocated: overUnassigned || mismatchDirection === 'over',
    defaultEach: defaultPricePerScreen(total, rows.length),
    mode: 'bundles',
    bundles: bundleSummaries,
    bundleByScreen,
    bundledBudgetSum,
    unbundledIds,
    unassignedBudget,
  }
}

export function companySharePercent(companyId, isReferring) {
  if (isReferring) return 100
  const company = getCompany(companyId)
  return Number(company?.revenueSharePercent) || 0
}

export function effectiveSharePercent(row, isReferring) {
  if (isReferring) return 100
  if (row.shareOverridePercent != null) return Number(row.shareOverridePercent)
  return companySharePercent(row.companyId, false)
}

export function buildRevenueTree(rows, revenue, campaignTotal) {
  const allocation = computeScreenAllocations(rows, revenue, campaignTotal)
  const referring = new Set(revenue?.referringCompanyIds || [])
  const byCompany = new Map()

  for (const row of rows) {
    const price = allocation.prices.get(row.screenId) || 0
    const referringCompany = referring.has(row.companyId)
    const share = effectiveSharePercent(row, referringCompany)
    const earnings = round3(price * (share / 100))
    const adspace = round3(price - earnings)
    const bundle = allocation.bundleByScreen?.get(row.screenId) || null

    if (!byCompany.has(row.companyId)) {
      const company = getCompany(row.companyId)
      byCompany.set(row.companyId, {
        id: row.companyId,
        name: row.company,
        hostStatus: company?.hostStatus,
        baseSharePercent: company?.revenueSharePercent ?? 0,
        referring: referringCompany,
        locations: new Map(),
        screenCount: 0,
        allocated: 0,
        earnings: 0,
        adspace: 0,
      })
    }

    const companyNode = byCompany.get(row.companyId)
    if (!companyNode.locations.has(row.locationId)) {
      companyNode.locations.set(row.locationId, {
        id: row.locationId,
        name: row.locationName,
        type: row.type,
        audience: row.audience,
        combination: `${row.audience} · ${row.type}`,
        country: row.country,
        governorate: row.governorate,
        shareOverridePercent: row.shareOverridePercent,
        screens: [],
        screenCount: 0,
        allocated: 0,
        earnings: 0,
        adspace: 0,
      })
    }

    const locationNode = companyNode.locations.get(row.locationId)
    const overridden = allocation.overriddenIds.has(row.screenId)
    locationNode.screens.push({
      id: row.screenId,
      name: row.screenName,
      price,
      share,
      earnings,
      adspace,
      overridden,
      flexible: !overridden,
      bundled: !!bundle,
      bundleId: bundle?.id || null,
      bundleName: bundle?.name || null,
    })
    locationNode.screenCount += 1
    locationNode.allocated += price
    locationNode.earnings += earnings
    locationNode.adspace += adspace

    companyNode.screenCount += 1
    companyNode.allocated += price
    companyNode.earnings += earnings
    companyNode.adspace += adspace
  }

  const companies = [...byCompany.values()]
    .map((company) => ({
      ...company,
      locations: [...company.locations.values()].map((loc) => ({
        ...loc,
        allocated: round3(loc.allocated),
        earnings: round3(loc.earnings),
        adspace: round3(loc.adspace),
        screens: loc.screens.sort((a, b) => a.id.localeCompare(b.id)),
      })),
      allocated: round3(company.allocated),
      earnings: round3(company.earnings),
      adspace: round3(company.adspace),
    }))
    .sort((a, b) => a.name.localeCompare(b.name))

  return { companies, allocation }
}

export function money(n, currency = 'USD') {
  const value = Number(n) || 0
  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
      maximumFractionDigits: 3,
    }).format(value)
  } catch {
    return `${currency} ${value.toFixed(3)}`
  }
}

export function applyPriceToScreens(revenue, screenIds, price) {
  const next = { ...(revenue?.screenPrices || {}) }
  const value = round3(price)
  for (const id of screenIds) {
    next[id] = value
  }
  return {
    ...revenue,
    screenPrices: next,
  }
}

export function clearPricesForScreens(revenue, screenIds) {
  const next = { ...(revenue?.screenPrices || {}) }
  for (const id of screenIds) delete next[id]
  return {
    ...revenue,
    screenPrices: next,
  }
}

export function rootBundles(revenue) {
  return listBundles(revenue).filter((b) => !b.parentId)
}

export function childBundles(revenue, parentId) {
  return listBundles(revenue).filter((b) => b.parentId === parentId)
}

/** Parent pool budget minus nested child pool budgets. */
export function effectiveBundleBudget(bundle, revenue) {
  const childSum = childBundles(revenue, bundle?.id).reduce(
    (sum, child) => sum + (Number(child.budget) || 0),
    0,
  )
  return round3((Number(bundle?.budget) || 0) - childSum)
}

export function matchRowsByFilters(rows, filters = {}) {
  const companyIds = filters.companyIds
  const locationIds = filters.locationIds
  const types = filters.types
  const audiences = filters.audiences
  const countries = filters.countries
  const companySet =
    companyIds && companyIds.length > 0 ? new Set(companyIds) : null
  const locationSet =
    locationIds && locationIds.length > 0 ? new Set(locationIds) : null
  const typeSet = types && types.length > 0 ? new Set(types) : null
  const audienceSet =
    audiences && audiences.length > 0 ? new Set(audiences) : null
  const countrySet =
    countries && countries.length > 0 ? new Set(countries) : null

  return (rows || []).filter((row) => {
    if (companySet && !companySet.has(row.companyId)) return false
    if (locationSet && !locationSet.has(row.locationId)) return false
    if (typeSet && !typeSet.has(row.type)) return false
    if (audienceSet && !audienceSet.has(row.audience)) return false
    if (countrySet && !countrySet.has(row.country)) return false
    return true
  })
}

export function summarizeRowMatch(rows) {
  const list = rows || []
  return {
    screens: list.length,
    companies: new Set(list.map((r) => r.companyId)).size,
    locations: new Set(list.map((r) => r.locationId)).size,
  }
}

export function describePoolFilters(filters) {
  if (!filters) return 'Custom selection'
  const parts = []
  if (filters.companyIds?.length === 1) parts.push('1 company')
  else if (filters.companyIds?.length > 1)
    parts.push(`${filters.companyIds.length} companies`)
  if (filters.locationIds?.length === 1) parts.push('1 location')
  else if (filters.locationIds?.length > 1)
    parts.push(`${filters.locationIds.length} locations`)
  if (filters.types?.length) parts.push(`Type: ${filters.types.join(', ')}`)
  if (filters.audiences?.length)
    parts.push(`Audience: ${filters.audiences.join(', ')}`)
  if (filters.countries?.length)
    parts.push(`Country: ${filters.countries.join(', ')}`)
  return parts.length ? parts.join(' · ') : 'All matching screens'
}

export function createBudgetBundle(
  revenue,
  { screenIds, budget, name, filters = null, parentId = null },
) {
  const ids = [...new Set(screenIds || [])]
  if (ids.length === 0) return revenue

  let freeIds = ids
  let bundles = listBundles(revenue)

  if (parentId) {
    const parent = bundles.find((b) => b.id === parentId)
    if (!parent) return revenue
    const parentSet = new Set(parent.screenIds || [])
    freeIds = ids.filter((id) => parentSet.has(id))
    if (freeIds.length === 0) return revenue

    const remaining = effectiveBundleBudget(parent, revenue)
    const childBudget = round3(Number(budget) || 0)
    if (childBudget > remaining + 0.001) return revenue

    const nextParentLocks = { ...(parent.lockedPrices || {}) }
    for (const id of freeIds) delete nextParentLocks[id]

    bundles = bundles.map((b) =>
      b.id === parentId
        ? {
            ...b,
            screenIds: (b.screenIds || []).filter((id) => !freeIds.includes(id)),
            lockedPrices: nextParentLocks,
          }
        : b,
    )
  } else {
    const taken = screenBundleMap(revenue)
    freeIds = ids.filter((id) => !taken.has(id))
    if (freeIds.length === 0) return revenue
  }

  const bundle = {
    id: `bnd_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`,
    name: (name && String(name).trim()) || nextBundleName(revenue),
    budget: round3(Number(budget) || 0),
    screenIds: freeIds,
    lockedPrices: {},
    parentId: parentId || null,
    filters: filters || null,
  }

  return {
    ...revenue,
    bundles: [...bundles, bundle],
  }
}

export function updateBudgetBundle(revenue, bundleId, patch) {
  return {
    ...revenue,
    bundles: listBundles(revenue).map((b) =>
      b.id === bundleId ? { ...b, ...patch } : b,
    ),
  }
}

function collectDescendantIds(revenue, bundleId) {
  const ids = []
  const queue = [bundleId]
  while (queue.length) {
    const id = queue.shift()
    for (const child of childBundles(revenue, id)) {
      ids.push(child.id)
      queue.push(child.id)
    }
  }
  return ids
}

export function dissolveBudgetBundle(revenue, bundleId) {
  const bundles = listBundles(revenue)
  const target = bundles.find((b) => b.id === bundleId)
  if (!target) return revenue

  const removeIds = new Set([
    bundleId,
    ...collectDescendantIds(revenue, bundleId),
  ])
  const returning = []
  for (const b of bundles) {
    if (!removeIds.has(b.id)) continue
    returning.push(...(b.screenIds || []))
  }

  let next = bundles.filter((b) => !removeIds.has(b.id))
  if (target.parentId) {
    next = next.map((b) =>
      b.id === target.parentId
        ? {
            ...b,
            screenIds: [...new Set([...(b.screenIds || []), ...returning])],
          }
        : b,
    )
  }

  return {
    ...revenue,
    bundles: next,
  }
}

/**
 * Apply per-screen lock amounts inside a bundle.
 * `priceById` maps screenId → locked price for that screen.
 * Rejects when the resulting locked sum would exceed the bundle budget.
 */
export function lockPriceMapInBundle(revenue, bundleId, priceById) {
  const bundle = listBundles(revenue).find((b) => b.id === bundleId)
  const entries = Object.entries(priceById || {})
  if (!bundle || entries.length === 0) {
    return { revenue, ok: false, reason: 'missing' }
  }

  const inBundle = new Set(bundle.screenIds || [])
  const nextLocks = { ...(bundle.lockedPrices || {}) }
  const targetSet = new Set()

  for (const [id, raw] of entries) {
    if (!inBundle.has(id)) continue
    const value = round3(Number(raw) || 0)
    if (value > (Number(bundle.budget) || 0) + 0.001) {
      return { revenue, ok: false, reason: 'price_over_budget' }
    }
    nextLocks[id] = value
    targetSet.add(id)
  }

  if (targetSet.size === 0) {
    return { revenue, ok: false, reason: 'missing' }
  }

  let lockedSum = 0
  for (const id of bundle.screenIds || []) {
    if (hasOwn(nextLocks, id)) lockedSum += Number(nextLocks[id]) || 0
  }
  lockedSum = round3(lockedSum)
  const budget = round3(Number(bundle.budget) || 0)

  if (lockedSum > budget + 0.001) {
    return {
      revenue,
      ok: false,
      reason: 'sum_over_budget',
      lockedSum,
      budget,
    }
  }

  return {
    revenue: updateBudgetBundle(revenue, bundleId, { lockedPrices: nextLocks }),
    ok: true,
  }
}

/**
 * Lock one screen inside a bundle to an exact price.
 */
export function lockPriceInBundle(revenue, bundleId, screenId, price) {
  return lockPriceMapInBundle(revenue, bundleId, { [screenId]: price })
}

/**
 * Lock selected screens by splitting a shared total equally across them.
 * Example: 3 screens + total 900 → each locks at 300 (last absorbs rounding).
 */
export function lockSharedTotalInBundle(revenue, bundleId, screenIds, total) {
  const ids = [...new Set(screenIds || [])]
  const amount = round3(Number(total) || 0)
  if (ids.length === 0) {
    return { revenue, ok: false, reason: 'missing' }
  }
  if (amount > (Number(listBundles(revenue).find((b) => b.id === bundleId)?.budget) || 0) + 0.001) {
    return { revenue, ok: false, reason: 'price_over_budget' }
  }

  const priceById = {}
  const each = round3(amount / ids.length)
  let assigned = 0
  ids.forEach((id, index) => {
    if (index === ids.length - 1) {
      priceById[id] = round3(amount - assigned)
    } else {
      priceById[id] = each
      assigned = round3(assigned + each)
    }
  })

  return lockPriceMapInBundle(revenue, bundleId, priceById)
}

/** @deprecated Prefer lockSharedTotalInBundle / lockPriceInBundle */
export function lockPricesInBundle(revenue, bundleId, screenIds, price) {
  const ids = [...new Set(screenIds || [])]
  if (ids.length <= 1) {
    return lockPriceInBundle(revenue, bundleId, ids[0], price)
  }
  // Legacy callers passed per-screen price; keep that meaning.
  const priceById = {}
  for (const id of ids) priceById[id] = price
  return lockPriceMapInBundle(revenue, bundleId, priceById)
}

export function unlockPricesInBundle(revenue, bundleId, screenIds) {
  const bundle = listBundles(revenue).find((b) => b.id === bundleId)
  if (!bundle) return revenue
  const nextLocks = { ...(bundle.lockedPrices || {}) }
  for (const id of screenIds || []) delete nextLocks[id]
  return updateBudgetBundle(revenue, bundleId, { lockedPrices: nextLocks })
}

/**
 * Diff prices before/after an override apply — who absorbed the change.
 */
export function allocationImpact(rows, beforeRevenue, afterRevenue, campaignTotal) {
  const before = computeScreenAllocations(rows, beforeRevenue, campaignTotal)
  const after = computeScreenAllocations(rows, afterRevenue, campaignTotal)
  const changed = []
  for (const row of rows) {
    const a = before.prices.get(row.screenId) || 0
    const b = after.prices.get(row.screenId) || 0
    if (Math.abs(a - b) > 0.0005) {
      changed.push({
        screenId: row.screenId,
        screenName: row.screenName,
        locationName: row.locationName,
        company: row.company,
        from: a,
        to: b,
        delta: round3(b - a),
        lockedAfter: after.overriddenIds.has(row.screenId),
      })
    }
  }
  return {
    changed,
    absorbBlocked: after.absorbBlocked,
    mismatchDirection: after.mismatchDirection,
    flexibleEach: after.flexibleEach,
    flexibleCount: after.flexibleIds.length,
  }
}

export function checkoutSummary(rows, revenue, campaignTotal) {
  const { companies, allocation } = buildRevenueTree(
    rows,
    revenue,
    campaignTotal,
  )
  const allocated = round3(
    [...allocation.prices.values()].reduce((s, n) => s + n, 0),
  )
  const companyEarnings = round3(
    companies.reduce((s, c) => s + c.earnings, 0),
  )
  const adspaceTake = round3(allocated - companyEarnings)
  const totalsMismatch = Math.abs(allocated - round3(campaignTotal)) > 0.001
  return {
    campaignTotal: round3(campaignTotal),
    screenCount: rows.length,
    defaultEach: allocation.defaultEach,
    allocated,
    companyEarnings,
    adspaceTake,
    adspacePercent:
      allocated > 0 ? round3((adspaceTake / allocated) * 100) : 0,
    companyPercent:
      allocated > 0 ? round3((companyEarnings / allocated) * 100) : 0,
    overriddenCount: allocation.overriddenIds.size,
    flexibleCount: allocation.flexibleIds.length,
    absorbBlocked: allocation.absorbBlocked,
    totalsMismatch,
    mismatchDirection: allocation.mismatchDirection,
    lockedSum: allocation.lockedSum,
    referringCount: (revenue?.referringCompanyIds || []).length,
    companies,
    mode: allocation.mode,
    bundleCount: rootBundles(revenue).length,
    bundledBudgetSum: allocation.bundledBudgetSum || 0,
    unassignedBudget: allocation.unassignedBudget ?? 0,
    unbundledCount: allocation.unbundledIds?.length || 0,
  }
}
