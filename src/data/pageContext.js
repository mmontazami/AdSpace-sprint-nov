/** Human labels + deep-link shapes for the current wireframe surface. */

export const VIEW_LABELS = {
  list: 'Campaigns',
  builder: 'Campaign Builder',
  detail: 'Campaign Detail',
  advertisers: 'Advertisers',
  'advertiser-detail': 'Advertiser detail',
  screens: 'Screens (Admin)',
  earnings: 'Earnings (Company)',
  uptime: 'Screens (Company)',
  'screen-detail': 'Screen detail',
  questions: 'Client questions',
}

export const DETAIL_TAB_LABELS = {
  overview: 'Overview',
  setup: 'Campaign info',
  screens: 'Choose screens',
  creatives: 'Creatives',
  revenue: 'Revenue',
  finance: 'Finance',
  delivery: 'Delivery & PoP',
}

export const BUILDER_STEP_LABELS = {
  1: 'Campaign info',
  2: 'Choose screens',
  3: 'Creatives',
  4: 'Revenue',
}

/**
 * @param {{ view: string, tab?: string|null, step?: number|null }} ctx
 * @returns {{ label: string, link: { view: string, tab?: string, step?: number, label: string } }}
 */
export function describePageContext(ctx) {
  const view = ctx?.view || 'list'
  const viewLabel = VIEW_LABELS[view] || view

  if (view === 'detail') {
    const tab = ctx.tab || 'overview'
    const tabLabel = DETAIL_TAB_LABELS[tab] || tab
    const label = `${viewLabel} · ${tabLabel}`
    return {
      label,
      link: { view: 'detail', tab, label },
    }
  }

  if (view === 'builder') {
    const step = ctx.step || 1
    const stepLabel = BUILDER_STEP_LABELS[step] || `Step ${step}`
    const label = `${viewLabel} · ${stepLabel}`
    return {
      label,
      link: { view: 'builder', step, label },
    }
  }

  return {
    label: viewLabel,
    link: { view, label: viewLabel },
  }
}
