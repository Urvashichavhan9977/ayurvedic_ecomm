// Thin fetch wrapper used by every admin API module.
// Kept dependency-free (no axios) to match the existing frontend stack.

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1'

const TOKEN_KEY = 'amrita_admin_token'

export function getAdminToken() {
  return localStorage.getItem(TOKEN_KEY)
}

export function setAdminToken(token) {
  if (token) localStorage.setItem(TOKEN_KEY, token)
  else localStorage.removeItem(TOKEN_KEY)
}

/**
 * Fires a request against the backend API, attaching the admin's bearer
 * token (if present) and normalizing errors into a single shape so every
 * caller can just `catch (err) { err.message }`.
 */
export async function apiRequest(path, { method = 'GET', body, headers } = {}) {
  const token = getAdminToken()

  const res = await fetch(`${API_URL}${path}`, {
    method,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...headers,
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  })

  let data = null
  try {
    data = await res.json()
  } catch {
    // No JSON body (e.g. 204) — leave data as null.
  }

  if (!res.ok) {
    const message = (data && data.message) || `Request failed with status ${res.status}`
    const error = new Error(message)
    error.status = res.status
    error.data = data
    throw error
  }

  return data
}

export const apiGet = (path) => apiRequest(path, { method: 'GET' })
export const apiPost = (path, body) => apiRequest(path, { method: 'POST', body })
export const apiPut = (path, body) => apiRequest(path, { method: 'PUT', body })
export const apiPatch = (path, body) => apiRequest(path, { method: 'PATCH', body })
export const apiDelete = (path) => apiRequest(path, { method: 'DELETE' })