/**
 * ORCA API Client — Centralized backend communication layer.
 * Handles auth, SSE streaming for chat, and domain API calls.
 * Falls back gracefully when backend is unreachable.
 */

// ── Base Config ──────────────────────────────────────────────────────────────

const API_BASE = (import.meta as any).env?.VITE_API_URL || ''

// ── Types ────────────────────────────────────────────────────────────────────

export interface AuthResponse {
  access_token: string
  token_type: string
  user: {
    name: string
    email: string
    role: string
  }
}

export interface RegisterPayload {
  name: string
  email: string
  phone: string
  password: string
  role: string
  aadhaar_hash?: string
  organization?: string
  port_of_origin?: string
}

export interface LoginPayload {
  email: string
  password: string
}

export interface ChatQueryPayload {
  query: string
  session_id?: string
  user_role?: string
  language?: string
  location?: { lat: number; lon: number } | null
}

export interface SSEEvent {
  type: 'status' | 'advisory' | 'risk' | 'intent' | 'done' | 'error'
  message?: string
  data?: any
  session_id?: string
}

export interface HealthStatus {
  status: string
  checks: {
    llm?: string
    redis?: string
    db?: string
  }
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function getAuthHeaders(): Record<string, string> {
  const token = localStorage.getItem('orca_access_token')
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  }
  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }
  return headers
}

async function apiFetch<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_BASE}${path}`
  const response = await fetch(url, {
    ...options,
    headers: {
      ...getAuthHeaders(),
      ...(options.headers || {}),
    },
  })
  if (!response.ok) {
    const errorBody = await response.text().catch(() => '')
    throw new Error(`API ${response.status}: ${errorBody || response.statusText}`)
  }
  return response.json()
}

// ── Auth ─────────────────────────────────────────────────────────────────────

export async function apiLogin(payload: LoginPayload): Promise<AuthResponse> {
  const result = await apiFetch<AuthResponse>('/auth/login', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
  // Store token
  localStorage.setItem('orca_access_token', result.access_token)
  return result
}

export async function apiRegister(payload: RegisterPayload): Promise<AuthResponse> {
  const result = await apiFetch<AuthResponse>('/auth/register', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
  // Store token
  localStorage.setItem('orca_access_token', result.access_token)
  return result
}

export function apiLogout(): void {
  localStorage.removeItem('orca_access_token')
}

export function isAuthenticated(): boolean {
  return !!localStorage.getItem('orca_access_token')
}

// ── Chat / Agent Reasoning (SSE Streaming) ───────────────────────────────────

/**
 * Streams the ORCA multi-agent pipeline response via Server-Sent Events.
 * Calls `onEvent` for each parsed SSE event as it arrives.
 * Returns an AbortController to cancel the stream.
 */
export function chatQuerySSE(
  payload: ChatQueryPayload,
  onEvent: (event: SSEEvent) => void,
  onError: (error: Error) => void,
  onComplete: () => void,
): AbortController {
  const controller = new AbortController()
  const url = `${API_BASE}/chat/query`

  fetch(url, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({
      query: payload.query,
      session_id: payload.session_id || crypto.randomUUID(),
      user_role: payload.user_role || 'fisherman',
      language: payload.language || 'en',
      location: payload.location || null,
    }),
    signal: controller.signal,
  })
    .then(async (response) => {
      if (!response.ok) {
        throw new Error(`Chat API error: ${response.status}`)
      }

      const reader = response.body?.getReader()
      if (!reader) {
        throw new Error('No response body stream')
      }

      const decoder = new TextDecoder()
      let buffer = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() || '' // keep incomplete line in buffer

        for (const line of lines) {
          const trimmed = line.trim()
          if (trimmed.startsWith('data: ')) {
            try {
              const jsonStr = trimmed.slice(6) // remove "data: "
              const event: SSEEvent = JSON.parse(jsonStr)
              onEvent(event)
            } catch {
              // skip malformed JSON
            }
          }
        }
      }

      onComplete()
    })
    .catch((err) => {
      if (err.name !== 'AbortError') {
        onError(err)
      }
    })

  return controller
}

// ── Health ────────────────────────────────────────────────────────────────────

export async function getHealthReady(): Promise<HealthStatus> {
  return apiFetch<HealthStatus>('/health/ready')
}

export interface HealthResponse {
  status: string
  app: string
  env?: string
}

export async function apiHealth(): Promise<HealthResponse> {
  return apiFetch<HealthResponse>('/health')
}

export async function getHealthLiveness(): Promise<HealthResponse> {
  return apiHealth()
}

// ── Domain APIs (currently stubs on backend, ready for expansion) ─────────

export async function getMarineData() {
  return apiFetch('/marine/')
}

export async function getWeatherData() {
  return apiFetch('/weather/')
}

export async function getVesselsData() {
  return apiFetch('/vessels/')
}

export async function getRiskData() {
  return apiFetch('/risk/')
}

// ── Backend Availability Check ───────────────────────────────────────────────

/**
 * Quick check if the backend is reachable.
 * Used by components to decide whether to use real API or mock fallback.
 */
export async function isBackendAvailable(): Promise<boolean> {
  try {
    const response = await fetch(`${API_BASE}/health`, {
      method: 'GET',
      signal: AbortSignal.timeout(3000),
    })
    return response.ok
  } catch {
    return false
  }
}
