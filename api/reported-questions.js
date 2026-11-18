/**
 * Vercel serverless API for reported questions.
 * Persists to wireframes/data/reported-questions.json via the GitHub Contents API.
 */

import {
  applyCreate,
  applyDelete,
  normalizeList,
} from '../server/reportedQuestionsStore.mjs'
import {
  githubStoreConfigured,
  readGithubJson,
  writeGithubJson,
} from '../server/githubJsonStore.mjs'

function send(res, status, payload) {
  res.statusCode = status
  res.setHeader('Content-Type', 'application/json; charset=utf-8')
  res.setHeader('Cache-Control', 'no-store')
  res.end(JSON.stringify(payload))
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = []
    req.on('data', (c) => chunks.push(c))
    req.on('end', () => {
      const raw = Buffer.concat(chunks).toString('utf8')
      if (!raw) return resolve({})
      try {
        resolve(JSON.parse(raw))
      } catch {
        resolve(null)
      }
    })
    req.on('error', reject)
  })
}

export default async function handler(req, res) {
  if (req.method === 'OPTIONS') {
    res.statusCode = 204
    res.end()
    return
  }

  if (!githubStoreConfigured()) {
    send(res, 503, {
      ok: false,
      error:
        'Reported questions store is not configured on Vercel. Set REPORTED_QUESTIONS_GITHUB_TOKEN and REPORTED_QUESTIONS_GITHUB_REPO.',
      list: [],
    })
    return
  }

  try {
    if (req.method === 'GET') {
      const current = await readGithubJson()
      if (!current.ok) return send(res, 502, current)
      return send(res, 200, { ok: true, list: normalizeList(current.list) })
    }

    if (req.method === 'POST') {
      const body = await readBody(req)
      if (!body) return send(res, 400, { ok: false, error: 'Invalid JSON body.' })
      const current = await readGithubJson()
      if (!current.ok) return send(res, 502, current)
      const result = applyCreate(current.list, body)
      if (!result.ok) return send(res, 400, result)
      const written = await writeGithubJson(
        result.list,
        `Add reported question ${result.item.id}`,
      )
      if (!written.ok) return send(res, 502, written)
      return send(res, 201, {
        ok: true,
        item: result.item,
        list: result.list,
      })
    }

    if (req.method === 'DELETE') {
      const body = await readBody(req)
      if (!body) return send(res, 400, { ok: false, error: 'Invalid JSON body.' })
      const current = await readGithubJson()
      if (!current.ok) return send(res, 502, current)
      const result = applyDelete(current.list, body.id, body.password)
      if (!result.ok) {
        const status = result.error === 'Incorrect password.' ? 403 : 404
        return send(res, status, result)
      }
      const written = await writeGithubJson(
        result.list,
        `Delete reported question ${body.id}`,
      )
      if (!written.ok) return send(res, 502, written)
      return send(res, 200, { ok: true, list: result.list })
    }

    res.setHeader('Allow', 'GET, POST, DELETE, OPTIONS')
    send(res, 405, { ok: false, error: 'Method not allowed.' })
  } catch (err) {
    console.error('[api/reported-questions]', err)
    send(res, 500, { ok: false, error: err?.message || 'Server error' })
  }
}
