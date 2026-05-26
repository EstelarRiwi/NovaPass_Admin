const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'

interface RequestOptions extends RequestInit {
  params?: Record<string, string>
}

function buildUrl(path: string, params?: Record<string, string>): string {
  const url = new URL(`${API_BASE}${path}`)
  if (params) {
    Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v))
  }
  return url.toString()
}

function getToken(): string | null {
  return localStorage.getItem('token')
}

function setToken(token: string | null): void {
  if (token) localStorage.setItem('token', token)
  else localStorage.removeItem('token')
}

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { params, ...fetchOptions } = options
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(fetchOptions.headers as Record<string, string>),
  }

  const token = getToken()
  if (token) headers['Authorization'] = `Bearer ${token}`

  const response = await fetch(buildUrl(path, params), {
    ...fetchOptions,
    headers,
  })

  if (response.status === 401) {
    setToken(null)
    localStorage.removeItem('user')
    window.location.href = '/login'
    throw new Error('Session expired')
  }

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Request failed' }))
    throw new Error(error.message || `HTTP ${response.status}`)
  }

  return response.json()
}

export const api = {
  getToken,
  setToken,
  get: <T>(path: string, params?: Record<string, string>) =>
    request<T>(path, { method: 'GET', params }),
  post: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: 'POST', body: body ? JSON.stringify(body) : undefined }),
  put: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: 'PUT', body: body ? JSON.stringify(body) : undefined }),
  delete: <T>(path: string) =>
    request<T>(path, { method: 'DELETE' }),
}
