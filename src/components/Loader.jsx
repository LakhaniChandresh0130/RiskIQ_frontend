// Comprehensive loading component with different variants
import { motion } from 'framer-motion'

export function Spinner({ size = 'md', className = '' }) {
  const sizes = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
    xl: 'w-16 h-16'
  }
  return (
    <div className={`inline-block ${sizes[size]} ${className}`}>
      <svg
        className="animate-spin"
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
      >
        <circle
          className="opacity-25"
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          strokeWidth="4"
        />
        <path
          className="opacity-75"
          fill="currentColor"
          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
        />
      </svg>
    </div>
  )
}

export function ButtonLoader({ text = 'Loading...' }) {
  return (
    <span className="flex items-center gap-2">
      <Spinner size="sm" />
      {text}
    </span>
  )
}

export function PageLoader({ message = 'Loading...' }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
      <Spinner size="xl" />
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="text-[#8598b3]"
      >
        {message}
      </motion.p>
    </div>
  )
}

export function InlineLoader({ text = 'Loading...' }) {
  return (
    <div className="flex items-center gap-2 text-[#8598b3]">
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
