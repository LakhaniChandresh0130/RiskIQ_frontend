import { useState, useEffect } from 'react'
import { api } from '../../lib/api.js'
import { useAuth } from '../../contexts/AuthContext.jsx'

export default function Audit() {
  const { hasPermission } = useAuth()
  const [logs, setLogs] = useState([])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const loadLogs = async () => {
    if (!hasPermission('audit')) return
    setLoading(true)
    try {
      const data = await api('/audit')
      setLogs(data || [])
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadLogs()
  }, [hasPermission])

  if (!hasPermission('audit')) {
    return <div className="card"><div className="card-b">You don't have permission to access this page.</div></div>
  }

  return (
    <div className="stack">
      <div className="card">
        <div className="card-h">
          <h3>Audit Log</h3>
          <button className="btn sm ghost" onClick={loadLogs} disabled={loading}>
            {loading ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>
        <div className="card-b">
          {error && <div className="card-b neg">{error}</div>}
          
          <div className="tbl">
            <table>
              <thead>
                <tr>
                  <th>Timestamp</th>
                  <th>User</th>
                  <th>Action</th>
                  <th>Entity</th>
                  <th>Details</th>
                </tr>
              </thead>
              <tbody>
                {logs.map(log => (
                  <tr key={log.id}>
                    <td className="sm">{new Date(log.created_at * 1000).toLocaleString()}</td>
                    <td>{log.user_id?.substring(0, 8)}...</td>
                    <td>
                      <span className="tag">{log.action}</span>
                    </td>
                    <td>{log.entity}</td>
                    <td className="sm">
                      {log.detail && typeof log.detail === 'object' ? (
                        <details>
                          <summary>View details</summary>
                          <pre>{JSON.stringify(log.detail, null, 2)}</pre>
                        </details>
                      ) : '-'}
                    </td>
                  </tr>
                ))}
                {logs.length === 0 && <tr><td colSpan="5" className="empty">No audit entries yet.</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-h">
          <h3>Action Types</h3>
        </div>
        <div className="card-b">
          <div className="stack" style={{ gap: '8px' }}>
            <div><span className="tag">org.create</span> - Organization created</div>
            <div><span className="tag">member.invite</span> - Member invited</div>
            <div><span className="tag">member.join</span> - Member joined organization</div>
            <div><span className="tag">member.role</span> - Member role changed</div>
            <div><span className="tag">portfolio.create</span> - Portfolio created</div>
            <div><span className="tag">portfolio.delete</span> - Portfolio deleted</div>
            <div><span className="tag">limits.propose</span> - Risk limits proposed</div>
            <div><span className="tag">limits.approve</span> - Risk limits approved</div>
            <div><span className="tag">scenario.propose</span> - Scenario proposed</div>
            <div><span className="tag">scenario.approve</span> - Scenario approved</div>
            <div><span className="tag">alert.acknowledged</span> - Alert acknowledged</div>
            <div><span className="tag">alert.resolved</span> - Alert resolved</div>
            <div><span className="tag">agent.chat</span> - AI analyst queried</div>
            <div><span className="tag">report.download</span> - Report downloaded</div>
          </div>
        </div>
      </div>
    </div>
  )
}
