import { useState, useEffect } from 'react'
import { api } from '../../lib/api.js'
import { useAuth } from '../../contexts/AuthContext.jsx'

export default function Governance({ pid }) {
  const { user, hasPermission } = useAuth()
  const [tab, setTab] = useState('limits')
  const [limits, setLimits] = useState([])
  const [scenarios, setScenarios] = useState([])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  // Limits form
  const [warn, setWarn] = useState(0.02)
  const [crit, setCrit] = useState(0.03)

  // Scenario form
  const [scenarioName, setScenarioName] = useState('')
  const [scenarioDef, setScenarioDef] = useState({ eq_in: -0.2 })

  const loadData = async () => {
    try {
      const [lims, scens] = await Promise.all([
        api(`/limits?portfolio=${pid}`),
        api('/scenarios')
      ])
      setLimits(lims.rows || [])
      setScenarios(scens || [])
    } catch (e) {
      setError(e.message)
    }
  }

  useEffect(() => {
    loadData()
  }, [pid])

  const handleProposeLimits = async (e) => {
    e.preventDefault()
    if (!hasPermission('write')) return
    setLoading(true)
    setError('')
    try {
      await api('/limits', { portfolio: pid, warn, crit })
      await loadData()
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  const handleApproveLimits = async (lid) => {
    if (!hasPermission('approve')) return
    try {
      await api(`/limits/${lid}/approve`)
      await loadData()
    } catch (e) {
      setError(e.message)
    }
  }

  const handleProposeScenario = async (e) => {
    e.preventDefault()
    if (!hasPermission('write')) return
    setLoading(true)
    setError('')
    try {
      await api('/scenarios', { name: scenarioName, definition: scenarioDef })
      setScenarioName('')
      setScenarioDef({ eq_in: -0.2 })
      await loadData()
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  const handleApproveScenario = async (sid) => {
    if (!hasPermission('approve')) return
    try {
      await api(`/scenarios/${sid}/approve`)
      await loadData()
    } catch (e) {
      setError(e.message)
    }
  }

  if (!hasPermission('read')) {
    return <div className="card"><div className="card-b">You don't have permission to access this page.</div></div>
  }

  return (
    <div className="stack">
      <div className="tabs">
        <button className={tab === 'limits' ? 'on' : ''} onClick={() => setTab('limits')}>Risk Limits</button>
        <button className={tab === 'scenarios' ? 'on' : ''} onClick={() => setTab('scenarios')}>Stress Scenarios</button>
      </div>

      {error && <div className="card-b neg">{error}</div>}

      {tab === 'limits' && (
        <>
          {hasPermission('write') && (
            <div className="card">
              <div className="card-h">
                <h3>Propose New Limits</h3>
              </div>
              <div className="card-b">
                <form onSubmit={handleProposeLimits} className="form2">
                  <div>
                    <label>Warning threshold (VaR/NAV)</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      max="1"
                      value={warn}
                      onChange={(e) => setWarn(parseFloat(e.target.value))}
                      required
                    />
                  </div>
                  <div>
                    <label>Critical threshold (VaR/NAV)</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      max="1"
                      value={crit}
                      onChange={(e) => setCrit(parseFloat(e.target.value))}
                      required
                    />
                  </div>
                  <button type="submit" className="btn" disabled={loading}>
                    {loading ? 'Proposing...' : 'Propose'}
                  </button>
                </form>
              </div>
            </div>
          )}

          <div className="card">
            <div className="card-h">
              <h3>Limit History</h3>
            </div>
            <div className="card-b">
              <div className="tbl">
                <table>
                  <thead>
                    <tr>
                      <th>Status</th>
                      <th>Warning</th>
                      <th>Critical</th>
                      <th>Proposed by</th>
                      <th>Approved by</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {limits.map(l => (
                      <tr key={l.id}>
                        <td>
                          <span className={`tag ${l.status === 'active' ? 'green' : l.status === 'pending' ? 'yellow' : ''}`}>
                            {l.status}
                          </span>
                        </td>
                        <td>{(l.warn * 100).toFixed(1)}%</td>
                        <td>{(l.crit * 100).toFixed(1)}%</td>
                        <td>{l.proposed_by?.substring(0, 8)}...</td>
                        <td>{l.approved_by ? l.approved_by.substring(0, 8) + '...' : '-'}</td>
                        <td>
                          {l.status === 'pending' && hasPermission('approve') && l.proposed_by !== user?.sub && (
                            <button className="btn sm" onClick={() => handleApproveLimits(l.id)}>Approve</button>
                          )}
                        </td>
                      </tr>
                    ))}
                    {limits.length === 0 && <tr><td colSpan="6" className="empty">No limits proposed yet.</td></tr>}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </>
      )}

      {tab === 'scenarios' && (
        <>
          {hasPermission('write') && (
            <div className="card">
              <div className="card-h">
                <h3>Propose New Scenario</h3>
              </div>
              <div className="card-b">
                <form onSubmit={handleProposeScenario}>
                  <div className="form-group">
                    <label>Scenario Name</label>
                    <input
                      type="text"
                      value={scenarioName}
                      onChange={(e) => setScenarioName(e.target.value)}
                      placeholder="e.g., Tech sector crash"
                      required
                      maxLength={60}
                    />
                  </div>
                  <div className="form-group">
                    <label>Equity India shock</label>
                    <input
                      type="number"
                      step="0.01"
                      min="-1"
                      max="1"
                      value={scenarioDef.eq_in || 0}
                      onChange={(e) => setScenarioDef({ ...scenarioDef, eq_in: parseFloat(e.target.value) })}
                    />
                  </div>
                  <div className="form-group">
                    <label>Equity Global shock</label>
                    <input
                      type="number"
                      step="0.01"
                      min="-1"
                      max="1"
                      value={scenarioDef.eq_gl || 0}
                      onChange={(e) => setScenarioDef({ ...scenarioDef, eq_gl: parseFloat(e.target.value) })}
                    />
                  </div>
                  <div className="form-group">
                    <label>FX shock</label>
                    <input
                      type="number"
                      step="0.01"
                      min="-1"
                      max="1"
                      value={scenarioDef.fx || 0}
                      onChange={(e) => setScenarioDef({ ...scenarioDef, fx: parseFloat(e.target.value) })}
                    />
                  </div>
                  <button type="submit" className="btn" disabled={loading}>
                    {loading ? 'Proposing...' : 'Propose'}
                  </button>
                </form>
              </div>
            </div>
          )}

          <div className="card">
            <div className="card-h">
              <h3>Scenario Library</h3>
            </div>
            <div className="card-b">
              <div className="tbl">
                <table>
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Definition</th>
                      <th>Status</th>
                      <th>Proposed by</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {scenarios.map(s => (
                      <tr key={s.id}>
                        <td><b>{s.name}</b></td>
                        <td className="sm">{JSON.stringify(s.definition)}</td>
                        <td>
                          <span className={`tag ${s.status === 'approved' ? 'green' : s.status === 'pending' ? 'yellow' : ''}`}>
                            {s.status}
                          </span>
                        </td>
                        <td>{s.proposed_by?.substring(0, 8)}...</td>
                        <td>
                          {s.status === 'pending' && hasPermission('approve') && s.proposed_by !== user?.sub && (
                            <button className="btn sm" onClick={() => handleApproveScenario(s.id)}>Approve</button>
                          )}
                        </td>
                      </tr>
                    ))}
                    {scenarios.length === 0 && <tr><td colSpan="5" className="empty">No scenarios proposed yet.</td></tr>}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
