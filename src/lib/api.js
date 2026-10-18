// Single API client for every backend call. Returns parsed JSON or throws a readable Error.
export async function api(path, body, raw, customToken) {
  const token = customToken || localStorage.getItem('riskiq-token')
  const headers = raw ? {} : { 'Content-Type': 'application/json' }
  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }
  const r = await fetch('/api' + path, body ? {
    method: 'POST',
    headers,
    body: raw ? body : JSON.stringify(body),
  } : { headers })
  const d = await r.json().catch(() => ({}))
  if (!r.ok) {
    const errorMsg = typeof d.detail === 'string' ? d.detail : r.statusText
    if (r.status === 401) {
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('auth:unauthorized', { detail: errorMsg }))
      }
      throw new Error(errorMsg || 'Authentication required. Please sign in again.')
    } else if (r.status === 403) {
      throw new Error('You do not have permission to access this resource.')
    } else if (r.status === 404) {
      throw new Error('The requested resource was not found.')
    } else if (r.status === 500) {
      throw new Error(errorMsg || 'Server error. Please try again later or contact support.')
    }
    throw new Error(errorMsg || 'Request failed')
  }
  return d
}
