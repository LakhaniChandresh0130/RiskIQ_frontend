// Error display component with retry functionality
import { useState } from 'react'
import { motion } from 'framer-motion'

export function ErrorDisplay({ error, onRetry, message }) {
  const [isRetrying, setIsRetrying] = useState(false)

  const handleRetry = async () => {
    if (!onRetry) return
    setIsRetrying(true)
    try {
      await onRetry()
    } finally {
      setIsRetrying(false)
    }
  }

  const getErrorMessage = (error) => {
    if (typeof error === 'string') return error
    if (error?.message) return error.message
    return 'An unexpected error occurred'
  }

  const getSuggestedAction = (error) => {
    const msg = getErrorMessage(error).toLowerCase()
    if (msg.includes('network') || msg.includes('fetch') || msg.includes('connection')) {
      return 'Please check your internet connection and try again.'
    }
    if (msg.includes('401') || msg.includes('unauthorized') || msg.includes('authentication')) {
      return 'Your session has expired. Please log in again.'
    }
    if (msg.includes('403') || msg.includes('permission')) {
      return 'You do not have permission to perform this action.'
    }
    if (msg.includes('404') || msg.includes('not found')) {
      return 'The requested resource was not found.'
    }
    if (msg.includes('500') || msg.includes('server error')) {
      return 'A server error occurred. Please try again later.'
    }
    return 'Please try again or contact support if the problem persists.'
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="card"
    >
      <div className="card-b neg" style={{ padding: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
          <div style={{ fontSize: '32px' }}>⚠️</div>
          <div style={{ flex: 1 }}>
            <h3 style={{ margin: '0 0 8px 0', fontSize: '16px' }}>
              {message || 'Something went wrong'}
            </h3>
            <p style={{ margin: '0 0 12px 0', color: '#ef4444', fontSize: '14px' }}>
              {getErrorMessage(error)}
            </p>
            <p style={{ margin: '0 0 16px 0', color: '#64748b', fontSize: '13px' }}>
              {getSuggestedAction(error)}
            </p>
            {onRetry && (
              <button
                className="btn"
                onClick={handleRetry}
                disabled={isRetrying}
                style={{ marginRight: '8px' }}
              >
                {isRetrying ? 'Retrying...' : 'Try Again'}
              </button>
            )}
            <button
              className="btn alt"
              onClick={() => window.location.reload()}
            >
              Refresh Page
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  )
}

export function InlineError({ error, compact = false }) {
  const getErrorMessage = (error) => {
    if (typeof error === 'string') return error
    if (error?.message) return error.message
    return 'An error occurred'
  }

  if (compact) {
    return <span className="neg" style={{ fontSize: '13px' }}>{getErrorMessage(error)}</span>
  }

  return (
    <div className="neg" style={{ padding: '12px', background: '#fef2f2', borderRadius: '6px', marginTop: '8px' }}>
      <strong>Error:</strong> {getErrorMessage(error)}
    </div>
  )
}
