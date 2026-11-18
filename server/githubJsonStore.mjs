/**
 * Read/write a JSON file in the GitHub repo (persists on Vercel deploys).
 *
 * Env:
 * - REPORTED_QUESTIONS_GITHUB_TOKEN (fine-grained PAT: Contents Read+Write on this repo)
 * - REPORTED_QUESTIONS_GITHUB_REPO  e.g. mmontazami/AdSpace-sprint-nov
 * - REPORTED_QUESTIONS_GITHUB_PATH  default: data/reported-questions.json
 * - REPORTED_QUESTIONS_GITHUB_BRANCH optional (omit unless you must pin a branch)
 */

import { normalizeList, parseJsonBody } from './reportedQuestionsStore.mjs'

function normalizeRepo(raw) {
  let repo = String(raw || '').trim()
  repo = repo.replace(/^https?:\/\/github\.com\//i, '')
  repo = repo.replace(/\.git$/i, '')
  repo = repo.replace(/^\/+|\/+$/g, '')
  return repo
}

function normalizePath(raw) {
  return String(raw || 'data/reported-questions.json')
    .trim()
    .replace(/^\/+/, '')
}

function config() {
  const token = String(process.env.REPORTED_QUESTIONS_GITHUB_TOKEN || '').trim()
  const repo = normalizeRepo(process.env.REPORTED_QUESTIONS_GITHUB_REPO)
  const path = normalizePath(process.env.REPORTED_QUESTIONS_GITHUB_PATH)
  const branch = String(process.env.REPORTED_QUESTIONS_GITHUB_BRANCH || '').trim()
  return { token, repo, path, branch }
}

function contentsApiPath(repo, filePath) {
  const encoded = filePath
    .split('/')
    .filter(Boolean)
    .map((part) => encodeURIComponent(part))
    .join('/')
  return `/repos/${repo}/contents/${encoded}`
}

export function githubStoreConfigured() {
  const { token, repo } = config()
  return Boolean(token && repo && repo.includes('/'))
}

function help404(repo, path) {
  return [
    `GitHub returned 404 for ${repo} → ${path}.`,
    'Usually means the token cannot access this repo, or REPO/PATH is wrong.',
    'Fix checklist:',
    '1) REPORTED_QUESTIONS_GITHUB_REPO must be exactly owner/name (example: mmontazami/AdSpace-sprint-nov)',
    '2) Token must be a fine-grained PAT with Repository access to that repo and Contents: Read and write',
    '3) REPORTED_QUESTIONS_GITHUB_PATH should be data/reported-questions.json (or leave unset)',
    '4) After changing env vars on Vercel, Redeploy',
  ].join(' ')
}

async function githubFetch(urlPath, init = {}) {
  const { token } = config()
  const res = await fetch(`https://api.github.com${urlPath}`, {
    ...init,
    headers: {
      Accept: 'application/vnd.github+json',
      Authorization: `Bearer ${token}`,
      'X-GitHub-Api-Version': '2022-11-28',
      'User-Agent': 'adspace-wireframes-reported-questions',
      ...(init.body ? { 'Content-Type': 'application/json' } : {}),
      ...(init.headers || {}),
    },
  })
  return res
}

async function assertRepoAccess() {
  const { repo } = config()
  if (!repo.includes('/')) {
    return {
      ok: false,
      error: `Invalid REPORTED_QUESTIONS_GITHUB_REPO "${repo}". Use owner/name, e.g. mmontazami/AdSpace-sprint-nov.`,
    }
  }

  const res = await githubFetch(`/repos/${repo}`)
  if (res.status === 404 || res.status === 401 || res.status === 403) {
    return {
      ok: false,
      error: help404(repo, '(repo)'),
    }
  }
  if (!res.ok) {
    const text = await res.text()
    return {
      ok: false,
      error: `GitHub repo check failed (${res.status}): ${text}`,
    }
  }

  const data = await res.json()
  return {
    ok: true,
    defaultBranch: data.default_branch || 'main',
    permissions: data.permissions || null,
  }
}

export async function readGithubJson() {
  const { repo, path, branch } = config()
  if (!githubStoreConfigured()) {
    return { ok: false, error: 'GitHub store is not configured.', list: [] }
  }

  const access = await assertRepoAccess()
  if (!access.ok) return { ...access, list: [] }

  const qs = branch ? `?ref=${encodeURIComponent(branch)}` : ''
  const res = await githubFetch(`${contentsApiPath(repo, path)}${qs}`)

  if (res.status === 404) {
    // File missing (ok to create on write) — only after repo access succeeded.
    return { ok: true, list: [], sha: null, defaultBranch: access.defaultBranch }
  }
  if (!res.ok) {
    const text = await res.text()
    return {
      ok: false,
      error: `GitHub read failed (${res.status}): ${text}`,
      list: [],
    }
  }

  const data = await res.json()
  if (Array.isArray(data)) {
    return {
      ok: false,
      error: `GitHub path "${path}" is a directory. Point REPORTED_QUESTIONS_GITHUB_PATH at the JSON file.`,
      list: [],
    }
  }

  const decoded = Buffer.from(data.content || '', 'base64').toString('utf8')
  const parsed = parseJsonBody(decoded)
  return {
    ok: true,
    list: normalizeList(parsed),
    sha: data.sha || null,
    defaultBranch: access.defaultBranch,
  }
}

export async function writeGithubJson(list, message) {
  const { repo, path, branch } = config()
  if (!githubStoreConfigured()) {
    return {
      ok: false,
      error:
        'GitHub store is not configured. Set REPORTED_QUESTIONS_GITHUB_TOKEN and REPORTED_QUESTIONS_GITHUB_REPO on Vercel.',
    }
  }

  const current = await readGithubJson()
  if (!current.ok) return current

  // Prefer explicit branch; otherwise use repo default so PUT targets a real ref.
  const targetBranch = branch || current.defaultBranch || ''

  const body = {
    message: message || 'Update reported questions',
    content: Buffer.from(`${JSON.stringify(list, null, 2)}\n`, 'utf8').toString(
      'base64',
    ),
  }
  if (current.sha) body.sha = current.sha
  if (targetBranch) body.branch = targetBranch

  const res = await githubFetch(contentsApiPath(repo, path), {
    method: 'PUT',
    body: JSON.stringify(body),
  })

  if (!res.ok) {
    const text = await res.text()
    if (res.status === 404 || res.status === 403 || res.status === 401) {
      return { ok: false, error: `${help404(repo, path)} Raw: ${text}` }
    }
    return {
      ok: false,
      error: `GitHub write failed (${res.status}): ${text}`,
    }
  }

  return { ok: true, list }
}
