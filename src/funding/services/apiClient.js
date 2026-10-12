/**
 * funding/services/apiClient.js
 *
 * Thin HTTP client for the funding backend.
 *
 * Talks to process.env.REACT_APP_API_URL when it's set. When it's NOT set
 * — or when a request fails with a network error — it falls back to local
 * fixtures so the UI is fully testable before Lindelani's endpoints exist.
 *
 * Flip to the real backend by setting REACT_APP_API_URL in .env. No code
 * change required.
 */

import { auth } from "../../firebaseConfig"
import fixtures from "../fixtures/demoData"

const BASE_URL = process.env.REACT_APP_API_URL || ""
const USE_FIXTURES = !BASE_URL

// ── Auth header ───────────────────────────────────────────────────────────
const getAuthToken = async () => {
  const user = auth.currentUser
  if (!user) return null
  try {
    return await user.getIdToken()
  } catch {
    return null
  }
}

// ── Core request ──────────────────────────────────────────────────────────
const request = async (method, path, body = null, { idempotencyKey = null } = {}) => {
  if (USE_FIXTURES) return fixture(method, path, body)

  const token = await getAuthToken()
  const headers = {
    "Content-Type": "application/json",
    "ngrok-skip-browser-warning": "true",
  }
  if (token) headers.Authorization = `Bearer ${token}`
  if (idempotencyKey) headers["Idempotency-Key"] = idempotencyKey

  let response
  try {
    response = await fetch(`${BASE_URL}${path}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    })
  } catch (networkError) {
    console.warn(`[funding/apiClient] Network error on ${method} ${path} — falling back to fixture.`, networkError?.message)
    return fixture(method, path, body)
  }

  if (!response.ok) {
    let errorPayload = null
    try { errorPayload = await response.json() } catch { /* ignore */ }
    const err = new Error(errorPayload?.message || `Request failed with ${response.status}`)
    err.status = response.status
    err.code = errorPayload?.code || "REQUEST_FAILED"
    err.payload = errorPayload
    throw err
  }

  // Handle file downloads separately — caller can use `requestBlob`.
  if (method === "GET" && path.includes("/download")) return response
  return response.json()
}

// ── Fixture resolver ──────────────────────────────────────────────────────
const fixture = (method, path, body) => {
  // Simple pattern-matching fixture router. Enough to make the frontend
  // testable end-to-end before the backend exists.

  // GET /funding/config
  if (method === "GET" && path === "/funding/config") {
    return Promise.resolve(fixtures.config)
  }

  // POST /funding/requests — create funding request
  if (method === "POST" && path === "/funding/requests") {
    const requestId = `FR-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
    return Promise.resolve({ requestId, ...body, status: "draft" })
  }

  // PATCH /funding/requests/{id} — save draft
  if (method === "PATCH" && path.startsWith("/funding/requests/")) {
    return Promise.resolve({ ok: true, savedAt: new Date().toISOString() })
  }

  // GET /funding/requests/{id}/preflight
  if (method === "GET" && path.endsWith("/preflight")) {
    return Promise.resolve(fixtures.preflight)
  }

  // GET /funding/requests/{id}/submissions?opportunityId=...&status=live
  // (must come before the generic /matches check to avoid confusion)
  if (method === "GET" && path.includes("/submissions?") && path.includes("status=live")) {
    return Promise.resolve({ rows: fixtures.liveSubmissions || [] })
  }

  // GET /funding/requests/{id}/matches
  if (method === "GET" && path.endsWith("/matches")) {
    return Promise.resolve(fixtures.matches)
  }

  // GET /opportunities/{id}/requirements?requestId=
  if (method === "GET" && path.includes("/opportunities/") && path.includes("/requirements")) {
    return Promise.resolve(fixtures.requirements)
  }

  // POST /opportunities/{id}/submissions — freeze + submit
  if (method === "POST" && path.includes("/opportunities/") && path.endsWith("/submissions")) {
    return Promise.resolve({
      submissionId: `SUB-${Date.now()}`,
      version: 1,
      frozenAt: new Date().toISOString(),
      status: "submitted",
      ...body,
    })
  }

  // GET /scores/{id}/bridge
  if (method === "GET" && path.includes("/scores/") && path.endsWith("/bridge")) {
    return Promise.resolve(fixtures.scoreBridge)
  }

  // GET /investors/{firmId}/submissions — investor pipeline
  if (method === "GET" && path.includes("/investors/") && path.endsWith("/submissions")) {
    return Promise.resolve({ rows: fixtures.submissions || [] })
  }

  // Default: unknown fixture
  return Promise.reject(new Error(`No fixture for ${method} ${path}`))
}

// ── Public API ────────────────────────────────────────────────────────────

export const getConfig = () => request("GET", "/funding/config")

export const createFundingRequest = (payload, { idempotencyKey } = {}) =>
  request("POST", "/funding/requests", payload, { idempotencyKey })

export const saveFundingRequest = (requestId, payload) =>
  request("PATCH", `/funding/requests/${requestId}`, payload)

export const preflight = (requestId) =>
  request("GET", `/funding/requests/${requestId}/preflight`)

export const getMatches = (requestId) =>
  request("GET", `/funding/requests/${requestId}/matches`)

export const getOpportunityRequirements = (opportunityId, requestId) =>
  request("GET", `/opportunities/${opportunityId}/requirements?requestId=${requestId}`)

export const submitToOpportunity = (opportunityId, payload, { idempotencyKey } = {}) =>
  request("POST", `/opportunities/${opportunityId}/submissions`, payload, { idempotencyKey })

export const getScoreBridge = (scoreId) =>
  request("GET", `/scores/${scoreId}/bridge`)

// ── Phase 5 additions ────────────────────────────────────────────────────
export const freezeSubmission = (opportunityId, payload, { idempotencyKey } = {}) =>
  request("POST", `/opportunities/${opportunityId}/submissions`, payload, { idempotencyKey })

export const listLiveSubmissions = (requestId, opportunityId) =>
  request("GET", `/funding/requests/${requestId}/submissions?opportunityId=${opportunityId}&status=live`)

// ── Phase 6 additions ────────────────────────────────────────────────────
export const listFirmSubmissions = (firmId) =>
  request("GET", `/investors/${firmId}/submissions`)

// ── Downloads — stream binary ─────────────────────────────────────────────
export const downloadSubmission = async (submissionId, format = "pdf", version = null) => {
  if (USE_FIXTURES) {
    console.warn(`[funding/apiClient] Downloads are stubbed in fixture mode. Would fetch: ${format} for ${submissionId}.`)
    return null
  }
  const token = await getAuthToken()
  const qs = new URLSearchParams({ format })
  if (version) qs.set("version", version)
  const res = await fetch(`${BASE_URL}/submissions/${submissionId}/download?${qs}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  })
  if (!res.ok) throw new Error(`Download failed (${res.status})`)
  return res.blob()
}

export const IS_FIXTURE_MODE = USE_FIXTURES

export default {
  getConfig,
  createFundingRequest,
  saveFundingRequest,
  preflight,
  getMatches,
  getOpportunityRequirements,
  submitToOpportunity,
  getScoreBridge,
  freezeSubmission,
  listLiveSubmissions,
  listFirmSubmissions,
  downloadSubmission,
  IS_FIXTURE_MODE,
}