// Single API client for every backend call. Returns parsed JSON or throws a readable Error.
// Includes retry logic for network errors and improved error messages.

const MAX_RETRIES = 2
const RETRY_DELAY = 1000

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

function isRetryableError(status, error) {
  // Retry on network errors, 5xx server errors, and specific rate limit errors
  if (!status && error?.name === 'TypeError') return true // Network error
  if (status >= 500 && status < 600) return true // Server errors
  if (status === 429) return true // Rate limit
  return false
}

export async function api(path, body, raw, customToken, retries = MAX_RETRIES) {
  const token = customToken || localStorage.getItem('riskiq-token')
  const headers = raw ? {} : { 'Content-Type': 'application/json' }
  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }

  let response, data, lastError

  try {
    response = await fetch('/api' + path, body ? {
      method: 'POST',
      headers,
      body: raw ? body : JSON.stringify(body),
    } : { headers })
  } catch (error) {
    lastError = error
    if (retries > 0 && isRetryableError(null, error)) {
      await sleep(RETRY_DELAY)
      return api(path, body, raw, customToken, retries - 1)
    }
    throw new Error('Network error. Please check your connection and try again.')
  }

  try {
    data = await response.json().catch(() => ({}))
  } catch {
    data = {}
  }

  if (!response.ok) {
    const errorMsg = typeof data.detail === 'string' ? data.detail : response.statusText
    lastError = new Error(errorMsg)

    if (response.status === 401) {
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('auth:unauthorized', { detail: errorMsg }))
      }
      throw new Error(errorMsg || 'Authentication required. Please sign in again.')
    } else if (response.status === 403) {
      throw new Error('You do not have permission to access this resource.')
    } else if (response.status === 404) {
      throw new Error('The requested resource was not found.')
    } else if (response.status === 429) {
      if (retries > 0) {
        await sleep(RETRY_DELAY * 2)
        return api(path, body, raw, customToken, retries - 1)
      }
      throw new Error('Too many requests. Please wait a moment and try again.')
    } else if (response.status >= 500) {
      if (retries > 0) {
        await sleep(RETRY_DELAY)
        return api(path, body, raw, customToken, retries - 1)
      }
      throw new Error(errorMsg || 'Server error. Please try again later or contact support.')
    }
    throw new Error(errorMsg || 'Request failed')
  }

  return data
}

// Convenience method for API calls with automatic retry on failure
export async function apiWithRetry(path, body, raw, customToken, maxRetries = MAX_RETRIES) {
  return api(path, body, raw, customToken, maxRetries)
}

