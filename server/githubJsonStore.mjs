/**
 * Read/write a JSON file in the GitHub repo (persists on Vercel deploys).
 *
 * Env:
 * - REPORTED_QUESTIONS_GITHUB_TOKEN (required for writes; fine-grained PAT with Contents)
 * - REPORTED_QUESTIONS_GITHUB_REPO  e.g. owner/AdSpace
 * - REPORTED_QUESTIONS_GITHUB_PATH  default: data/reported-questions.json
 * - REPORTED_QUESTIONS_GITHUB_BRANCH optional (default repo default branch)
 */

import { normalizeList, parseJsonBody } from './reportedQuestionsStore.mjs'

function config() {
  const token = process.env.REPORTED_QUESTIONS_GITHUB_TOKEN || ''
  const repo = process.env.REPORTED_QUESTIONS_GITHUB_REPO || ''
  const path =
    process.env.REPORTED_QUESTIONS_GITHUB_PATH ||
    'data/reported-questions.json'
  const branch = process.env.REPORTED_QUESTIONS_GITHUB_BRANCH || ''
  return { token, repo, path, branch }
}

export function githubStoreConfigured() {
  const { token, repo } = config()
  return Boolean(token && repo)
}

async function githubFetch(urlPath, init = {}) {
  const { token } = config()
  const res = await fetch(`https://api.github.com${urlPath}`, {
    ...init,
    headers: {
      Accept: 'application/vnd.github+json',
      Authorization: `Bearer ${token}`,
      'X-GitHub-Api-Version': '2022-11-28',
      'Content-Type': 'application/json',
      ...(init.headers || {}),
    },
  })
  return res
}

export async function readGithubJson() {
  const { repo, path, branch } = config()
  if (!githubStoreConfigured()) {
    return { ok: false, error: 'GitHub store is not configured.', list: [] }
  }

  const qs = branch ? `?ref=${encodeURIComponent(branch)}` : ''
  const res = await githubFetch(
    `/repos/${repo}/contents/${path.split('/').map(encodeURIComponent).join('/')}${qs}`,
  )

  if (res.status === 404) {
    return { ok: true, list: [], sha: null }
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
  const decoded = Buffer.from(data.content || '', 'base64').toString('utf8')
  const parsed = parseJsonBody(decoded)
  return {
    ok: true,
    list: normalizeList(parsed),
    sha: data.sha || null,
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

  const body = {
    message: message || 'Update reported questions',
    content: Buffer.from(JSON.stringify(list, null, 2) + '\n', 'utf8').toString(
      'base64',
    ),
  }
  if (current.sha) body.sha = current.sha
  if (branch) body.branch = branch

  const res = await githubFetch(
    `/repos/${repo}/contents/${path.split('/').map(encodeURIComponent).join('/')}`,
    {
      method: 'PUT',
      body: JSON.stringify(body),
    },
  )

  if (!res.ok) {
    const text = await res.text()
    return {
      ok: false,
      error: `GitHub write failed (${res.status}): ${text}`,
    }
  }

  return { ok: true, list }
}
