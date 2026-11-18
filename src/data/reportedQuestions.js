/**
 * Client API for reported questions.
 * Local (Vite): persists to data/reported-questions.json via /api/reported-questions
 * Vercel: same API writes that JSON in the GitHub repo (shared, durable).
 */

const REPORTER_KEY = 'adspace.wireframes.lastReporter'
const LEGACY_STORAGE_KEY = 'adspace.wireframes.reportedQuestions.v1'
const API_URL = '/api/reported-questions'

/** Required to delete a reported question from the list. */
export const DELETE_PASSWORD = '123456'

async function api(method, body) {
  const res = await fetch(API_URL, {
    method,
    headers: body ? { 'Content-Type': 'application/json' } : undefined,
    body: body ? JSON.stringify(body) : undefined,
    cache: 'no-store',
  })
  let payload = null
  try {
    payload = await res.json()
  } catch {
    payload = null
  }
  if (!payload) {
    return {
      ok: false,
      error: `Request failed (${res.status}).`,
      list: [],
    }
  }
  return payload
}

export function loadLastReporter() {
  if (typeof window === 'undefined') return ''
  return window.localStorage.getItem(REPORTER_KEY) || ''
}

export function saveLastReporter(name) {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(REPORTER_KEY, name)
}

function readLegacyLocalList() {
  if (typeof window === 'undefined') return []
  try {
    const raw = window.localStorage.getItem(LEGACY_STORAGE_KEY)
    const list = raw ? JSON.parse(raw) : []
    return Array.isArray(list) ? list : []
  } catch {
    return []
  }
}

function clearLegacyLocalList() {
  if (typeof window === 'undefined') return
  window.localStorage.removeItem(LEGACY_STORAGE_KEY)
}

/**
 * Load shared list from the JSON-backed API.
 * One-time: migrate any leftover localStorage items into the JSON store.
 */
export async function fetchReportedQuestions() {
  const result = await api('GET')
  if (!result.ok) return result

  const legacy = readLegacyLocalList()
  if (legacy.length === 0) return result

  let list = result.list || []
  const existingKeys = new Set(
    list.map((q) => `${q.reporter}::${q.title}::${q.body}`),
  )

  for (const item of [...legacy].reverse()) {
    const key = `${item.reporter}::${item.title}::${item.body}`
    if (existingKeys.has(key)) continue
    const created = await api('POST', {
      reporter: item.reporter,
      title: item.title,
      body: item.body,
      pageLabel: item.pageLabel,
      link: item.link,
    })
    if (created.ok) {
      list = created.list
      existingKeys.add(key)
    }
  }

  clearLegacyLocalList()
  return { ok: true, list }
}

/**
 * @param {{
 *   reporter: string,
 *   title: string,
 *   body: string,
 *   pageLabel: string,
 *   link: { view: string, tab?: string, step?: number, label: string },
 * }} input
 */
export async function createReportedQuestion(input) {
  const result = await api('POST', input)
  if (result.ok && result.item?.reporter) {
    saveLastReporter(result.item.reporter)
  }
  return result
}

/**
 * @param {string} id
 * @param {string} password
 */
export async function deleteReportedQuestion(id, password) {
  return api('DELETE', { id, password })
}
