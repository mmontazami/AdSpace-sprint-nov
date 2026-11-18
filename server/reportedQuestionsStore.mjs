/**
 * Shared create/delete helpers for reported questions JSON store.
 * Used by the Vite dev middleware and the Vercel API route.
 */

export const DELETE_PASSWORD = '123456'

/** Soft ceiling to avoid abusive payloads (still very large for real notes). */
export const MAX_BODY_CHARS = 100_000
export const MAX_TITLE_CHARS = 500
export const MAX_REPORTER_CHARS = 120

export function normalizeList(data) {
  return Array.isArray(data) ? data : []
}

export function parseJsonBody(raw) {
  try {
    return JSON.parse(raw)
  } catch {
    return null
  }
}

function nextId(existing) {
  const nextIndex = existing.reduce((max, q) => {
    const n = Number(String(q.id || '').replace(/^R/, ''))
    return Number.isFinite(n) ? Math.max(max, n) : max
  }, 0)
  return `R${String(nextIndex + 1).padStart(2, '0')}`
}

/**
 * Keep internal newlines; only trim ends. Reject empty / oversized fields.
 */
export function sanitizeCreateInput(input) {
  const reporter = String(input?.reporter ?? '')
    .replace(/^\s+|\s+$/g, '')
  const title = String(input?.title ?? '')
    .replace(/^\s+|\s+$/g, '')
  const body = String(input?.body ?? '')
    .replace(/^\s+|\s+$/g, '')

  if (!reporter || !title || !body) {
    return { ok: false, error: 'Reporter, title, and question are required.' }
  }
  if (reporter.length > MAX_REPORTER_CHARS) {
    return {
      ok: false,
      error: `Reporter must be ${MAX_REPORTER_CHARS} characters or fewer.`,
    }
  }
  if (title.length > MAX_TITLE_CHARS) {
    return {
      ok: false,
      error: `Title must be ${MAX_TITLE_CHARS} characters or fewer.`,
    }
  }
  if (body.length > MAX_BODY_CHARS) {
    return {
      ok: false,
      error: `Question must be ${MAX_BODY_CHARS.toLocaleString()} characters or fewer.`,
    }
  }

  return {
    ok: true,
    value: {
      reporter,
      title,
      body,
      pageLabel: String(input?.pageLabel || 'Unknown page'),
      link: input?.link && typeof input.link === 'object' ? input.link : null,
    },
  }
}

export function applyCreate(existing, input) {
  const cleaned = sanitizeCreateInput(input)
  if (!cleaned.ok) return cleaned

  const list = normalizeList(existing)
  const item = {
    id: nextId(list),
    ...cleaned.value,
    createdAt: new Date().toISOString(),
    status: 'open',
  }
  return { ok: true, item, list: [item, ...list] }
}

export function applyDelete(existing, id, password) {
  if (password !== DELETE_PASSWORD) {
    return { ok: false, error: 'Incorrect password.' }
  }
  const list = normalizeList(existing)
  const next = list.filter((q) => q.id !== id)
  if (next.length === list.length) {
    return { ok: false, error: 'Question not found.' }
  }
  return { ok: true, list: next }
}
