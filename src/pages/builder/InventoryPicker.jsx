import { useEffect, useMemo, useState } from 'react'
import {
  AUDIENCES,
  COMPANIES,
  COUNTRIES,
  INVENTORY,
  LOCATION_TYPES,
  SCREEN_ORIENTATIONS,
  SCREEN_RESOLUTIONS,
  SCREEN_TAGS,
  getCompany,
  getScreenAvailability,
  isScreenSelectable,
} from '../../data/inventory'
import {
  getLoopMode,
  computeGuarantee,
  formatDuration,
  formatPlays,
  loopModeForSlots,
} from '../../data/loopModes'
import MultiSelectFilter from './MultiSelectFilter'
import ScreenStatusGuide from './ScreenStatusGuide'

function formatHour(h) {
  return `${String(h).padStart(2, '0')}:00`
}

function sortSelectableFirst(screens) {
  return [...screens].sort((a, b) => {
    if (a.selectable !== b.selectable) return a.selectable ? -1 : 1
    return a.id.localeCompare(b.id)
  })
}

function checkState(selectableIds, selected) {
  if (selectableIds.length === 0) return 'none'
  const n = selectableIds.filter((id) => selected.has(id)).length
  if (n === 0) return 'unchecked'
  if (n === selectableIds.length) return 'checked'
  return 'partial'
}

function allIds(items) {
  return items.map((i) => i.id)
}

function estimatePickerBookedHours(hourStart, hourEnd, startDate, endDate) {
  const hours = Math.max(0, (Number(hourEnd) || 0) - (Number(hourStart) || 0))
  if (!startDate || !endDate || hours <= 0) return hours * 14
  const start = new Date(`${startDate}T00:00:00`)
  const end = new Date(`${endDate}T00:00:00`)
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || end < start) {
    return hours * 14
  }
  const days =
    Math.round((end.getTime() - start.getTime()) / (24 * 60 * 60 * 1000)) + 1
  return days * hours
}

export default function InventoryPicker({
  slots,
  hourStart,
  hourEnd,
  startDate,
  endDate,
  selectedScreenIds,
  onChangeSelected,
  bookedScreens = null,
  compact = false,
  /** When set, only these screen IDs appear (campaign inventory pool). */
  allowedScreenIds = null,
  /**
   * marketplace = full eligibility / hours / slots gates (campaign Choose screens).
   * creative = Format mismatch + overlap with another creative.
   */
  availabilityMode = 'marketplace',
  /** Creative Format step — blocks non-matching orientation / resolution. */
  requiredOrientation = null,
  requiredAspectRatio = null,
}) {
  const isCreativeMode = availabilityMode === 'creative'
  const requiredLoopModeId = isCreativeMode
    ? null
    : loopModeForSlots(slots).id
  const [query, setQuery] = useState('')

  const inventorySource = useMemo(() => {
    const allowed =
      allowedScreenIds == null ? null : new Set(allowedScreenIds)
    return INVENTORY.map((loc) => ({
      ...loc,
      screens: loc.screens.filter((s) => {
        if (allowed && !allowed.has(s.id)) return false
        // Q04.3: marketplace only shows screens matching the slot-locked mode.
        if (
          requiredLoopModeId &&
          (s.loopMode || 'c2a1') !== requiredLoopModeId
        ) {
          return false
        }
        return true
      }),
    }))
      // Q03.1: campaign Choose screens lists only Verified companies.
      .filter((loc) => getCompany(loc.companyId)?.hostStatus === 'Verified')
      .filter((loc) => loc.screens.length > 0)
  }, [allowedScreenIds, requiredLoopModeId])

  const sourceCompanies = useMemo(() => {
    const ids = new Set(inventorySource.map((loc) => loc.companyId))
    return COMPANIES.filter((c) => ids.has(c.id))
  }, [inventorySource])

  const companyOptions = useMemo(
    () =>
      sourceCompanies.map((c) => ({
        id: c.id,
        label: c.name,
        meta: c.hostStatus,
      })),
    [sourceCompanies],
  )

  const [selectedCompanyIds, setSelectedCompanyIds] = useState(() =>
    allIds(COMPANIES),
  )
  const [selectedLocationIds, setSelectedLocationIds] = useState(() =>
    INVENTORY.map((l) => l.locationId),
  )
  const [selectedTypes, setSelectedTypes] = useState(() => [...LOCATION_TYPES])
  const [selectedAudiences, setSelectedAudiences] = useState(() => [...AUDIENCES])
  const [selectedCountries, setSelectedCountries] = useState(() => [...COUNTRIES])
  const [selectedGovernorates, setSelectedGovernorates] = useState([])
  const [selectedTags, setSelectedTags] = useState(() => [...SCREEN_TAGS])
  const [selectedOrientations, setSelectedOrientations] = useState(() => [
    ...SCREEN_ORIENTATIONS,
  ])
  // Empty = Any (no resolution filter)
  const [selectedResolutions, setSelectedResolutions] = useState([])
  const [govInitialized, setGovInitialized] = useState(false)

  const [openCompanyId, setOpenCompanyId] = useState(null)
  const [openLocations, setOpenLocations] = useState({})

  // Keep company / location filters aligned when the allowed pool changes.
  useEffect(() => {
    const companyIds = sourceCompanies.map((c) => c.id)
    const locationIds = inventorySource.map((l) => l.locationId)
    setSelectedCompanyIds(companyIds)
    setSelectedLocationIds(locationIds)
  }, [sourceCompanies, inventorySource])

  const scheduleCtx = {
    slots: Number(slots) || 0,
    hourStart: Number(hourStart),
    hourEnd: Number(hourEnd),
    bookedScreens,
    mode: availabilityMode,
    requiredOrientation,
    requiredAspectRatio,
  }

  const bookedHoursEstimate = useMemo(
    () => estimatePickerBookedHours(hourStart, hourEnd, startDate, endDate),
    [hourStart, hourEnd, startDate, endDate],
  )

  function guaranteeForScreen(screen) {
    return computeGuarantee({
      modeId: screen.loopMode || 'c2a1',
      slots: Number(slots) || 0,
      bookedHours: bookedHoursEstimate,
    })
  }

  const companyIdSet = useMemo(
    () => new Set(selectedCompanyIds),
    [selectedCompanyIds],
  )

  const locationsForCompanies = useMemo(
    () => inventorySource.filter((loc) => companyIdSet.has(loc.companyId)),
    [inventorySource, companyIdSet],
  )

  const locationOptions = useMemo(
    () =>
      locationsForCompanies.map((loc) => ({
        id: loc.locationId,
        label: loc.locationName,
        meta: loc.company,
      })),
    [locationsForCompanies],
  )

  // Locations always follow selected companies; default = all under those companies.
  useEffect(() => {
    setSelectedLocationIds(locationsForCompanies.map((l) => l.locationId))
  }, [locationsForCompanies])

  const governorateOptions = useMemo(() => {
    const set = new Set()
    for (const loc of inventorySource) {
      if (
        selectedCountries.includes(loc.country) &&
        companyIdSet.has(loc.companyId)
      ) {
        set.add(loc.governorate)
      }
    }
    return [...set].sort().map((g) => ({ id: g, label: g }))
  }, [inventorySource, selectedCountries, companyIdSet])

  useEffect(() => {
    const allowed = new Set(governorateOptions.map((g) => g.id))
    if (!govInitialized) {
      setSelectedGovernorates([...allowed])
      setGovInitialized(true)
      return
    }
    setSelectedGovernorates((prev) => {
      const kept = prev.filter((id) => allowed.has(id))
      if (kept.length === 0) return [...allowed]
      // When country set changes, prefer all currently allowed.
      return [...allowed]
    })
  }, [governorateOptions, govInitialized])

  const typeOptions = useMemo(
    () => LOCATION_TYPES.map((t) => ({ id: t, label: t })),
    [],
  )
  const audienceOptions = useMemo(
    () => AUDIENCES.map((a) => ({ id: a, label: a })),
    [],
  )
  const countryOptions = useMemo(
    () => COUNTRIES.map((c) => ({ id: c, label: c })),
    [],
  )
  const tagOptions = useMemo(
    () => SCREEN_TAGS.map((t) => ({ id: t, label: t })),
    [],
  )
  const orientationOptions = useMemo(
    () => SCREEN_ORIENTATIONS.map((o) => ({ id: o, label: o })),
    [],
  )
  const resolutionOptions = useMemo(
    () => SCREEN_RESOLUTIONS.map((r) => ({ id: r, label: r })),
    [],
  )
  const companyTree = useMemo(() => {
    const q = query.trim().toLowerCase()
    const locationIdSet = new Set(selectedLocationIds)
    const typeSet = new Set(selectedTypes)
    const audienceSet = new Set(selectedAudiences)
    const countrySet = new Set(selectedCountries)
    const govSet = new Set(selectedGovernorates)
    const tagSet = new Set(selectedTags)
    const orientationSet = new Set(selectedOrientations)
    const resolutionSet = new Set(selectedResolutions)
    const anyResolution =
      selectedResolutions.length === 0 ||
      selectedResolutions.length === SCREEN_RESOLUTIONS.length
    const byCompany = new Map()

    for (const loc of inventorySource) {
      const company = getCompany(loc.companyId)
      if (!companyIdSet.has(loc.companyId)) continue
      if (!locationIdSet.has(loc.locationId)) continue
      if (!typeSet.has(loc.type)) continue
      if (!audienceSet.has(loc.audience)) continue
      if (!countrySet.has(loc.country)) continue
      if (!govSet.has(loc.governorate)) continue

      const screens = loc.screens
        .map((screen) => {
          const availability = getScreenAvailability(loc, screen, scheduleCtx)
          return {
            ...screen,
            ...availability,
            hostStatus: company?.hostStatus,
          }
        })
        .filter((screen) => {
          const allOrientationsSelected =
            selectedOrientations.length === SCREEN_ORIENTATIONS.length
          if (!allOrientationsSelected) {
            if (selectedOrientations.length === 0) return false
            if (!orientationSet.has(screen.orientation)) return false
          }

          if (!anyResolution) {
            if (!resolutionSet.has(screen.resolution)) return false
          }

          const allTagsSelected = selectedTags.length === SCREEN_TAGS.length
          if (!allTagsSelected) {
            if (selectedTags.length === 0) return false
            const hit = (screen.tags || []).some((t) => tagSet.has(t))
            if (!hit) return false
          }
          if (!q) return true
          const hay =
            `${screen.id} ${screen.name} ${loc.locationName} ${loc.company} ${screen.orientation || ''} ${screen.resolution || ''}`.toLowerCase()
          return hay.includes(q)
        })

      if (screens.length === 0) continue

      const locationNode = {
        ...loc,
        hostStatus: company?.hostStatus,
        screens: sortSelectableFirst(screens),
        totalScreens: screens.length,
        availableScreens: screens.filter((s) => s.selectable).length,
        outsideHoursScreens: screens.filter((s) => s.reason === 'outside_hours')
          .length,
        formatMismatchScreens: screens.filter(
          (s) => s.reason === 'format_mismatch',
        ).length,
        bookedElsewhereScreens: screens.filter(
          (s) => s.reason === 'booked_elsewhere',
        ).length,
        insufficientSlotsScreens: screens.filter(
          (s) => s.reason === 'insufficient_slots',
        ).length,
      }

      if (!byCompany.has(loc.companyId)) {
        byCompany.set(loc.companyId, {
          id: loc.companyId,
          name: loc.company,
          hostStatus: company?.hostStatus,
          locations: [],
        })
      }
      byCompany.get(loc.companyId).locations.push(locationNode)
    }

    return [...byCompany.values()]
      .map((company) => {
        const locations = [...company.locations].sort(
          (a, b) => b.availableScreens - a.availableScreens,
        )
        return {
          ...company,
          locations,
          locationCount: locations.length,
          totalScreens: locations.reduce((n, l) => n + l.totalScreens, 0),
          availableScreens: locations.reduce((n, l) => n + l.availableScreens, 0),
          outsideHoursScreens: locations.reduce(
            (n, l) => n + l.outsideHoursScreens,
            0,
          ),
          formatMismatchScreens: locations.reduce(
            (n, l) => n + l.formatMismatchScreens,
            0,
          ),
          bookedElsewhereScreens: locations.reduce(
            (n, l) => n + l.bookedElsewhereScreens,
            0,
          ),
          insufficientSlotsScreens: locations.reduce(
            (n, l) => n + l.insufficientSlotsScreens,
            0,
          ),
        }
      })
      .sort((a, b) => b.availableScreens - a.availableScreens)
  }, [
    inventorySource,
    query,
    selectedCompanyIds,
    selectedLocationIds,
    selectedTypes,
    selectedAudiences,
    selectedCountries,
    selectedGovernorates,
    selectedTags,
    selectedOrientations,
    selectedResolutions,
    slots,
    hourStart,
    hourEnd,
    bookedScreens,
    availabilityMode,
    requiredOrientation,
    requiredAspectRatio,
  ])

  const filteredSelectableIds = useMemo(() => {
    const ids = []
    for (const company of companyTree) {
      for (const loc of company.locations) {
        for (const screen of loc.screens) {
          if (screen.selectable) ids.push(screen.id)
        }
      }
    }
    return ids
  }, [companyTree])

  const selected = new Set(selectedScreenIds)

  function setSelected(nextIds) {
    onChangeSelected(nextIds)
  }

  useEffect(() => {
    const stillValid = selectedScreenIds.filter((id) => {
      for (const loc of inventorySource) {
        const screen = loc.screens.find((s) => s.id === id)
        if (screen) return isScreenSelectable(loc, screen, scheduleCtx)
      }
      return false
    })
    if (stillValid.length !== selectedScreenIds.length) {
      onChangeSelected(stillValid)
    }
  }, [
    slots,
    hourStart,
    hourEnd,
    bookedScreens,
    inventorySource,
    requiredOrientation,
    requiredAspectRatio,
  ])

  function toggleScreen(id, selectable) {
    if (!selectable) return
    const next = new Set(selected)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    setSelected([...next])
  }

  function toggleIds(ids, state) {
    if (ids.length === 0) return
    const next = new Set(selected)
    if (state === 'checked') ids.forEach((id) => next.delete(id))
    else ids.forEach((id) => next.add(id))
    setSelected([...next])
  }

  function toggleCompany(company) {
    const ids = company.locations.flatMap((loc) =>
      loc.screens.filter((s) => s.selectable).map((s) => s.id),
    )
    toggleIds(ids, checkState(ids, selected))
  }

  function toggleLocation(loc) {
    const ids = loc.screens.filter((s) => s.selectable).map((s) => s.id)
    toggleIds(ids, checkState(ids, selected))
  }

  function selectAllFiltered() {
    const next = new Set(selected)
    filteredSelectableIds.forEach((id) => next.add(id))
    setSelected([...next])
  }

  function clearSelection() {
    setSelected([])
  }

  const totalAvailable = companyTree.reduce((n, c) => n + c.availableScreens, 0)
  const totalLocationsInView = companyTree.reduce(
    (n, c) => n + c.locationCount,
    0,
  )
  const totalScreensInView = companyTree.reduce((n, c) => n + c.totalScreens, 0)
  const totalOutsideHours = companyTree.reduce(
    (n, c) => n + c.outsideHoursScreens,
    0,
  )
  const totalFormatMismatch = companyTree.reduce(
    (n, c) => n + c.formatMismatchScreens,
    0,
  )
  const totalBookedElsewhere = companyTree.reduce(
    (n, c) => n + c.bookedElsewhereScreens,
    0,
  )
  const totalInsufficientSlots = companyTree.reduce(
    (n, c) => n + c.insufficientSlotsScreens,
    0,
  )

  return (
    <div className={`inventory-picker ${compact ? 'compact' : ''}`}>
      {!compact && (
        <div className="window-summary">
          <span>
            <em>Slots</em> <strong>{slots}</strong>
          </span>
          <span className="inv-dot" />
          <span>
            <em>Dates</em>{' '}
            <strong>
              {startDate || '—'} → {endDate || '—'}
            </strong>
          </span>
          <span className="inv-dot" />
          <span>
            <em>Hours</em>{' '}
            <strong>
              {formatHour(hourStart)} – {formatHour(hourEnd)}
            </strong>
          </span>
        </div>
      )}

      <div className="inv-shell">
        <div className="inv-filters">
          <div className="inv-filters-row">
            <label className="field inv-search">
              <span className={compact ? 'sr-only' : undefined}>
                Search name / ID
              </span>
              <input
                type="search"
                placeholder="Search name / ID…"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </label>

            <MultiSelectFilter
              label="Company"
              hideLabel={compact}
              options={companyOptions}
              selectedIds={selectedCompanyIds}
              onChange={setSelectedCompanyIds}
              allLabel="All companies"
              searchPlaceholder="Search companies…"
            />

            <MultiSelectFilter
              label="Location"
              hideLabel={compact}
              options={locationOptions}
              selectedIds={selectedLocationIds}
              onChange={setSelectedLocationIds}
              allLabel="All locations"
              searchPlaceholder="Search locations…"
              disabled={locationOptions.length === 0}
            />

            <MultiSelectFilter
              label="Type"
              hideLabel={compact}
              options={typeOptions}
              selectedIds={selectedTypes}
              onChange={setSelectedTypes}
              allLabel="All types"
              searchPlaceholder="Search types…"
            />

            <MultiSelectFilter
              label="Audience"
              hideLabel={compact}
              options={audienceOptions}
              selectedIds={selectedAudiences}
              onChange={setSelectedAudiences}
              allLabel="All audiences"
            />
          </div>

          <div className="inv-filters-row">
            <MultiSelectFilter
              label="Country"
              hideLabel={compact}
              options={countryOptions}
              selectedIds={selectedCountries}
              onChange={setSelectedCountries}
              allLabel="All countries"
              searchPlaceholder="Search countries…"
            />

            <MultiSelectFilter
              label="Area"
              hideLabel={compact}
              options={governorateOptions}
              selectedIds={selectedGovernorates}
              onChange={setSelectedGovernorates}
              allLabel="All areas"
              searchPlaceholder="Search areas…"
              disabled={governorateOptions.length === 0}
            />

            <MultiSelectFilter
              label="Orientation"
              hideLabel={compact}
              options={orientationOptions}
              selectedIds={selectedOrientations}
              onChange={setSelectedOrientations}
              allLabel="All orientations"
              searchPlaceholder="Search orientations…"
            />

            <MultiSelectFilter
              label="Resolution"
              hideLabel={compact}
              options={resolutionOptions}
              selectedIds={selectedResolutions}
              onChange={setSelectedResolutions}
              emptyLabel="Any"
              allLabel="Any"
              searchPlaceholder="Search resolutions…"
            />

            <MultiSelectFilter
              label="Tag"
              hideLabel={compact}
              options={tagOptions}
              selectedIds={selectedTags}
              onChange={setSelectedTags}
              allLabel="All tags"
              searchPlaceholder="Search tags…"
            />
          </div>
        </div>

        <div className="inv-summary">
          <div className="inv-summary-main">
            <span className="inv-stat">
              <strong>{companyTree.length}</strong>
              <em>companies</em>
            </span>
            <span className="inv-dot" />
            <span className="inv-stat">
              <strong>{totalLocationsInView}</strong>
              <em>locations</em>
            </span>
            <span className="inv-dot" />
            <span className="inv-stat">
              <strong>{totalScreensInView}</strong>
              <em>screens</em>
            </span>
            <span className="inv-dot" />
            <span
              className="inv-stat"
              title="Sum of guaranteed min plays for currently selected screens"
            >
              <strong>
                {formatPlays(
                  selectedScreenIds.reduce((sum, id) => {
                    for (const loc of INVENTORY) {
                      const screen = loc.screens.find((s) => s.id === id)
                      if (screen) return sum + guaranteeForScreen(screen).plays
                    }
                    return sum
                  }, 0),
                )}
              </strong>
              <em>guaranteed plays</em>
            </span>
            <span className="inv-dot" />
            <span className="inv-stat muted">
              <strong>{totalAvailable}</strong>
              <em>available</em>
            </span>
            <span className="inv-dot" />
            <span
              className="inv-stat warn-booked"
              title="Already selected in another creative with overlapping schedule"
            >
              <strong>{totalBookedElsewhere}</strong>
              <em>in another creative</em>
            </span>
            {isCreativeMode ? (
              <>
                <span className="inv-dot" />
                <span
                  className="inv-stat warn-format"
                  title="Orientation or resolution does not match the Format step"
                >
                  <strong>{totalFormatMismatch}</strong>
                  <em>wrong format</em>
                </span>
              </>
            ) : (
              <>
                <span className="inv-dot" />
                <span
                  className="inv-stat warn-hours"
                  title="Outside selected time window / opening hours"
                >
                  <strong>{totalOutsideHours}</strong>
                  <em>outside hours</em>
                </span>
                <span className="inv-dot" />
                <span
                  className="inv-stat warn-slots"
                  title="Not enough free slots for this campaign"
                >
                  <strong>{totalInsufficientSlots}</strong>
                  <em>low slots</em>
                </span>
              </>
            )}
          </div>

          <div className="inv-bulk">
            <button
              type="button"
              className="btn-ghost compact"
              disabled={filteredSelectableIds.length === 0}
              onClick={selectAllFiltered}
            >
              Select all filtered
            </button>
            <button
              type="button"
              className="btn-ghost compact"
              disabled={selectedScreenIds.length === 0}
              onClick={clearSelection}
            >
              Clear selection
            </button>
          </div>
        </div>

        <div className="inv-hierarchy-bar">
          <span className="inv-hierarchy-label">Browse order</span>
          <ol className="inv-hierarchy-trail">
            <li className="level-company">
              <em>1</em> Company
            </li>
            <li className="level-location">
              <em>2</em> Location
            </li>
            <li className="level-screen">
              <em>3</em> Screen
            </li>
          </ol>
          <p className="inv-sort-note">
            {isCreativeMode
              ? 'Expand a company to see its locations, then pick screens · Blocked when Format does not match or another creative overlaps'
              : 'Expand a company to see its locations, then expand a location to pick screens · Only Verified companies appear here'}
          </p>
          <ScreenStatusGuide compact={compact} mode={availabilityMode} />
        </div>

        <div className="inv-tree">
          {companyTree.length === 0 ? (
            <p className="empty-picker">No companies match these filters.</p>
          ) : (
            companyTree.map((company) => {
              const companyOpen = openCompanyId === company.id
              const companyIds = company.locations.flatMap((loc) =>
                loc.screens.filter((s) => s.selectable).map((s) => s.id),
              )
              const companyState = checkState(companyIds, selected)

              function toggleCompanyOpen() {
                setOpenCompanyId((prev) =>
                  prev === company.id ? null : company.id,
                )
              }

              return (
                <div
                  key={company.id}
                  className={`inv-company ${companyOpen ? 'open' : ''}`}
                >
                  <div className="inv-company-row">
                    <button
                      type="button"
                      className="inv-expand"
                      aria-expanded={companyOpen}
                      aria-label={
                        companyOpen
                          ? `Collapse locations for ${company.name}`
                          : `Expand locations for ${company.name}`
                      }
                      onClick={toggleCompanyOpen}
                    >
                      <span className="inv-chevron" />
                    </button>

                    <label className={`inv-check ${companyState}`}>
                      <input
                        type="checkbox"
                        checked={companyState === 'checked'}
                        ref={(el) => {
                          if (el) el.indeterminate = companyState === 'partial'
                        }}
                        disabled={company.availableScreens === 0}
                        onChange={() => toggleCompany(company)}
                      />
                    </label>

                    <button
                      type="button"
                      className="inv-company-main"
                      onClick={toggleCompanyOpen}
                    >
                      <span className="inv-company-text">
                        <span className="inv-level-badge company">Company</span>
                        <span className="inv-company-name">{company.name}</span>
                        <span
                          className={`inv-host-pill ${String(company.hostStatus)
                            .toLowerCase()
                            .replace(/\s+/g, '-')}`}
                        >
                          {company.hostStatus}
                        </span>
                        {!companyOpen && (
                          <span className="inv-expand-hint">
                            Expand for locations
                          </span>
                        )}
                      </span>
                      <span className="inv-metrics">
                        <span className="metric">
                          <strong>{company.locationCount}</strong> locations
                        </span>
                        <span className="metric available">
                          <strong>{company.availableScreens}</strong> available
                        </span>
                        {company.outsideHoursScreens > 0 && (
                          <span
                            className="metric warn-hours"
                            title="Outside selected time window / opening hours"
                          >
                            <strong>{company.outsideHoursScreens}</strong> outside
                            hours
                          </span>
                        )}
                        {company.bookedElsewhereScreens > 0 && (
                          <span
                            className="metric warn-booked"
                            title="Already selected in another creative with overlapping schedule"
                          >
                            <strong>{company.bookedElsewhereScreens}</strong> in
                            another creative
                          </span>
                        )}
                        {company.insufficientSlotsScreens > 0 && (
                          <span
                            className="metric warn-slots"
                            title="Not enough free slots for this campaign"
                          >
                            <strong>{company.insufficientSlotsScreens}</strong>{' '}
                            low slots
                          </span>
                        )}
                      </span>
                    </button>
                  </div>

                  {companyOpen && (
                    <div className="inv-locations">
                      <div className="inv-nested-head">
                        <span className="inv-level-badge location">
                          Locations
                        </span>
                        <span>
                          Inside <strong>{company.name}</strong> · expand a
                          location to see its screens
                        </span>
                      </div>
                      {company.locations.map((loc) => {
                        const locOpen = !!openLocations[loc.locationId]
                        const locIds = loc.screens
                          .filter((s) => s.selectable)
                          .map((s) => s.id)
                        const locState = checkState(locIds, selected)

                        return (
                          <div
                            key={loc.locationId}
                            className={`inv-location ${locOpen ? 'open' : ''}`}
                          >
                            <div className="inv-location-row">
                              <button
                                type="button"
                                className="inv-expand nested"
                                aria-expanded={locOpen}
                                aria-label={
                                  locOpen
                                    ? `Collapse screens for ${loc.locationName}`
                                    : `Expand screens for ${loc.locationName}`
                                }
                                onClick={() =>
                                  setOpenLocations((prev) => ({
                                    ...prev,
                                    [loc.locationId]: !prev[loc.locationId],
                                  }))
                                }
                              >
                                <span className="inv-chevron" />
                              </button>

                              <label className={`inv-check ${locState}`}>
                                <input
                                  type="checkbox"
                                  checked={locState === 'checked'}
                                  ref={(el) => {
                                    if (el)
                                      el.indeterminate = locState === 'partial'
                                  }}
                                  disabled={loc.availableScreens === 0}
                                  onChange={() => toggleLocation(loc)}
                                />
                              </label>

                              <button
                                type="button"
                                className="inv-location-main"
                                onClick={() =>
                                  setOpenLocations((prev) => ({
                                    ...prev,
                                    [loc.locationId]: !prev[loc.locationId],
                                  }))
                                }
                              >
                                <span className="inv-location-text">
                                  <span className="inv-location-title">
                                    <span className="inv-level-badge location">
                                      Location
                                    </span>
                                    <span className="inv-location-name">
                                      {loc.locationName}
                                    </span>
                                    {!locOpen && (
                                      <span className="inv-expand-hint">
                                        Expand for screens
                                      </span>
                                    )}
                                  </span>
                                  <span className="inv-location-meta">
                                    {loc.type} · {loc.audience} · {loc.country} ·{' '}
                                    {loc.governorate}
                                  </span>
                                </span>
                                <span className="inv-metrics compact">
                                  <span className="metric available">
                                    <strong>{loc.availableScreens}</strong>{' '}
                                    available
                                  </span>
                                  {loc.outsideHoursScreens > 0 && (
                                    <span
                                      className="metric warn-hours"
                                      title="Outside selected time window / opening hours"
                                    >
                                      <strong>{loc.outsideHoursScreens}</strong>{' '}
                                      outside hours
                                    </span>
                                  )}
                                  {loc.bookedElsewhereScreens > 0 && (
                                    <span
                                      className="metric warn-booked"
                                      title="Already selected in another creative with overlapping schedule"
                                    >
                                      <strong>{loc.bookedElsewhereScreens}</strong>{' '}
                                      in another creative
                                    </span>
                                  )}
                                  {loc.insufficientSlotsScreens > 0 && (
                                    <span
                                      className="metric warn-slots"
                                      title="Not enough free slots for this campaign"
                                    >
                                      <strong>
                                        {loc.insufficientSlotsScreens}
                                      </strong>{' '}
                                      low slots
                                    </span>
                                  )}
                                </span>
                              </button>
                            </div>

                            {locOpen && (
                              <div className="inv-screens-wrap">
                                <div className="inv-nested-head screens">
                                  <span className="inv-level-badge screen">
                                    Screens
                                  </span>
                                  <span>
                                    At <strong>{loc.locationName}</strong>
                                  </span>
                                </div>
                                <ul className="inv-screens">
                                  {loc.screens.map((screen) => {
                                    const checked = selected.has(screen.id)
                                    return (
                                      <li
                                        key={screen.id}
                                        className={
                                          screen.selectable ? '' : 'unavailable'
                                        }
                                      >
                                        <label>
                                          <input
                                            type="checkbox"
                                            checked={checked}
                                            disabled={!screen.selectable}
                                            onChange={() =>
                                              toggleScreen(
                                                screen.id,
                                                screen.selectable,
                                              )
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
                                          <span className="scr-tags">
                                            {[
                                              screen.orientation,
                                              screen.resolution,
                                              ...(screen.tags || []).slice(0, 1),
                                            ]
                                              .filter(Boolean)
                                              .join(' · ')}
                                          </span>
                                          <span className="scr-slots">
                                            {screen.freeSlots} free slots
                                          </span>
                                          <span
                                            className="scr-mode"
                                            title={getLoopMode(screen.loopMode).label}
                                          >
                                            {getLoopMode(screen.loopMode).short}
                                          </span>
                                          <span
                                            className="scr-guarantee"
                                            title="Guaranteed minimum plays / airtime at full mode capacity"
                                          >
                                            ≥{formatPlays(guaranteeForScreen(screen).plays)}
                                            <em>
                                              {formatDuration(
                                                guaranteeForScreen(screen).airtimeSec,
                                              )}
                                            </em>
                                          </span>
                                          {screen.selectable ? (
                                            isCreativeMode ? (
                                              <span className="scr-reason reason-available">
                                                Available
                                              </span>
                                            ) : null
                                          ) : (
                                            <span
                                              className={`scr-reason reason-${screen.reason || 'other'}`}
                                              title={
                                                screen.reason ===
                                                  'booked_elsewhere' &&
                                                screen.detail
                                                  ? `Used by: ${screen.detail}`
                                                  : screen.detail || undefined
                                              }
                                            >
                                              {screen.reason ===
                                                'booked_elsewhere' &&
                                              screen.detail
                                                ? `In “${screen.detail}”`
                                                : screen.reason ===
                                                    'format_mismatch'
                                                  ? screen.detail
                                                    ? `Wrong format · ${screen.detail}`
                                                    : 'Wrong format'
                                                  : screen.label ||
                                                    'Unavailable'}
                                            </span>
                                          )}
                                        </label>
                                      </li>
                                    )
                                  })}
                                </ul>
                              </div>
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
      </div>
    </div>
  )
}
