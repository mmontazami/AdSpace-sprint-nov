import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  applyCreate,
  applyDelete,
  normalizeList,
  parseJsonBody,
} from './reportedQuestionsStore.mjs'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const DATA_FILE = path.resolve(__dirname, '../data/reported-questions.json')

async function readList() {
  try {
    const raw = await fs.readFile(DATA_FILE, 'utf8')
    return normalizeList(parseJsonBody(raw))
  } catch (err) {
    if (err && err.code === 'ENOENT') return []
    throw err
  }
}

async function writeList(list) {
  await fs.mkdir(path.dirname(DATA_FILE), { recursive: true })
  await fs.writeFile(DATA_FILE, `${JSON.stringify(list, null, 2)}\n`, 'utf8')
}

function sendJson(res, status, payload) {
  res.statusCode = status
  res.setHeader('Content-Type', 'application/json; charset=utf-8')
  res.end(JSON.stringify(payload))
}

function readRequestBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = []
    req.on('data', (chunk) => chunks.push(chunk))
    req.on('end', () => {
      resolve(Buffer.concat(chunks).toString('utf8'))
    })
    req.on('error', reject)
  })
}

/**
 * Dev-only API that persists reported questions to data/reported-questions.json.
 */
export function reportedQuestionsApiPlugin() {
  return {
    name: 'reported-questions-api',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        const url = req.url?.split('?')[0]
        if (url !== '/api/reported-questions') return next()

        try {
          if (req.method === 'GET') {
            const list = await readList()
            return sendJson(res, 200, { ok: true, list })
          }

          if (req.method === 'POST') {
            const raw = await readRequestBody(req)
            const body = parseJsonBody(raw) || {}
            const existing = await readList()
            const result = applyCreate(existing, body)
            if (!result.ok) return sendJson(res, 400, result)
            await writeList(result.list)
            return sendJson(res, 201, {
              ok: true,
              item: result.item,
              list: result.list,
            })
          }

          if (req.method === 'DELETE') {
            const raw = await readRequestBody(req)
            const body = parseJsonBody(raw) || {}
            const existing = await readList()
            const result = applyDelete(existing, body.id, body.password)
            if (!result.ok) {
              const status = result.error === 'Incorrect password.' ? 403 : 404
              return sendJson(res, status, result)
            }
            await writeList(result.list)
            return sendJson(res, 200, { ok: true, list: result.list })
          }

          res.setHeader('Allow', 'GET, POST, DELETE')
          return sendJson(res, 405, { ok: false, error: 'Method not allowed.' })
        } catch (err) {
          console.error('[reported-questions-api]', err)
          return sendJson(res, 500, {
            ok: false,
            error: err?.message || 'Server error',
          })
        }
      })
    },
  }
}
