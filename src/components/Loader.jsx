// Comprehensive loading component with self-contained styles
import { motion } from 'framer-motion'

export function Spinner({ size = 'md', className = '' }) {
  const pixelSizes = {
    sm: 14,
    md: 20,
    lg: 28,
    xl: 36
  }
  const px = pixelSizes[size] || 20

  return (
    <span
      className={className}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: `${px}px`,
        height: `${px}px`,
        verticalAlign: 'middle',
        flexShrink: 0
      }}
    >
      <svg
        style={{
          width: '100%',
          height: '100%',
          animation: 'spin 0.8s linear infinite'
        }}
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
      >
        <circle
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          strokeWidth="3.5"
          strokeOpacity="0.25"
        />
        <path
          fill="currentColor"
          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
        />
      </svg>
    </span>
  )
}

export function ButtonLoader({ text = 'Loading...' }) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
      <Spinner size="sm" />
      <span>{text}</span>
    </span>
  )
}

export function PageLoader({ message = 'Loading...' }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '320px', gap: '16px' }}>
      <Spinner size="xl" />
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        style={{ color: '#8598b3', fontSize: '14px' }}
      >
        {message}
      </motion.p>
    </div>
  )
}

export function InlineLoader({ text = 'Loading...' }) {
  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', color: '#8598b3' }}>
      <Spinner size="sm" />
      <span>{text}</span>
    </div>
  )
}

export function SkeletonCard({ count = 1 }) {
  return (
    <>
      {[...Array(count)].map((_, i) => (
        <motion.div
          key={i}
          className="card"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: i * 0.1 }}
        >
          <div className="card-h">
            <div className="h-6 w-1/3 bg-[#1e293b] rounded animate-pulse" />
          </div>
          <div className="card-b">
            <div className="space-y-3">
              <div className="h-4 w-full bg-[#1e293b] rounded animate-pulse" />
              <div className="h-4 w-3/4 bg-[#1e293b] rounded animate-pulse" />
              <div className="h-4 w-1/2 bg-[#1e293b] rounded animate-pulse" />
            </div>
          </div>
        </motion.div>
      ))}
    </>
  )
}

export function TableLoader({ rows = 5, cols = 4 }) {
  return (
    <div className="tbl">
      <table>
        <thead>
          <tr>
            {[...Array(cols)].map((_, i) => (
              <th key={i}>
                <div className="h-4 w-20 bg-[#1e293b] rounded animate-pulse" />
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {[...Array(rows)].map((_, rowIndex) => (
            <tr key={rowIndex}>
              {[...Array(cols)].map((_, colIndex) => (
                <td key={colIndex}>
                  <div className="h-4 w-full bg-[#1e293b] rounded animate-pulse" />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
