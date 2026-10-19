import { useState, useEffect } from 'react'
import { api } from '../../lib/api.js'
import { useAuth } from '../../contexts/AuthContext.jsx'

export default function Admin() {
  const { user, hasPermission } = useAuth()
  const [members, setMembers] = useState([])
  const [portfolios, setPortfolios] = useState([])
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole, setInviteRole] = useState('analyst')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [selectedPortfolio, setSelectedPortfolio] = useState('')
  const [telegramToken, setTelegramToken] = useState('')
  const [telegramChatId, setTelegramChatId] = useState('')

  const loadMembers = async () => {
    try {
      const data = await api('/members')
      setMembers(data)
    } catch (e) {
      setError(e.message)
    }
  }

  const loadPortfolios = async () => {
    try {
      const data = await api('/portfolios')
      setPortfolios(data)
    } catch (e) {
      setError(e.message)
    }
  }

  useEffect(() => {
    if (hasPermission('admin')) {
      loadMembers()
      loadPortfolios()
    }
  }, [hasPermission])

  const handleInvite = async (e) => {
    e.preventDefault()
    if (!inviteEmail) return
    setLoading(true)
    setError('')
    try {
      await api('/members', { email: inviteEmail, role: inviteRole })
      setInviteEmail('')
      await loadMembers()
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  const handleRoleChange = async (memberId, newRole) => {
    try {
      await api(`/members/${memberId}/role`, { role: newRole })
      await loadMembers()
    } catch (e) {
      setError(e.message)
    }
  }

  const loadPortfolioTelegram = async (pid) => {
    if (!pid) return
    try {
      const data = await api(`/portfolios/${pid}/telegram`)
      setTelegramToken(data.telegram_bot_token || '')
      setTelegramChatId(data.telegram_chat_id || '')
    } catch (e) {
      setError(e.message)
    }
  }

  const handleSaveTelegram = async (e) => {
    e.preventDefault()
    if (!selectedPortfolio) return
    setLoading(true)
    setError('')
    try {
      await api(`/portfolios/${selectedPortfolio}/telegram`, {
        telegram_bot_token: telegramToken,
        telegram_chat_id: telegramChatId
      })
      await loadPortfolios()
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  if (!hasPermission('admin')) {
    return <div className="card"><div className="card-b">You don't have permission to access this page.</div></div>
  }

  const isSuperAdmin = user?.role === 'super_admin'
  // Super Admin can invite/assign all roles including admin.
  // Regular Admin can only invite/assign regular roles (risk_manager, analyst, viewer, auditor).
  const assignableRoles = isSuperAdmin
    ? ['super_admin', 'admin', 'risk_manager', 'analyst', 'viewer', 'auditor']
    : ['risk_manager', 'analyst', 'viewer', 'auditor']

  return (
    <div className="stack">
      <div className="card">
        <div className="card-h">
          <h3>Team Members & Role Approval</h3>
        </div>
        <div className="card-b">
          <div className="card-b info" style={{ marginBottom: '16px' }}>
            <strong>Hierarchy & Approval Rules:</strong><br/>
            • <strong>Super Admin:</strong> Full authority. Can invite, approve, and assign the <strong>Admin</strong> role or delegate other roles.<br/>
            • <strong>Admin:</strong> Can approve pending users and assign regular roles (<em>risk_manager, analyst, viewer, auditor</em>). Only sees and manages their own portfolios.<br/>
            • <strong>Pending Users:</strong> Must wait for Admin / Super Admin approval before accessing platform features.<br/>
            <br/>
            <strong>Your Current Role:</strong> <span className="chip-meta">{user?.role}</span>
          </div>

          {error && <div className="card-b neg">{error}</div>}

          <form onSubmit={handleInvite} className="form2">
            <div>
              <label>Email</label>
              <input
                type="email"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                placeholder="new@member.com"
                required
              />
            </div>
            <div>
              <label>Role</label>
              <select value={inviteRole} onChange={(e) => setInviteRole(e.target.value)}>
                {assignableRoles.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
            <button type="submit" className="btn" disabled={loading}>
              {loading ? 'Inviting...' : 'Invite Member'}
            </button>
          </form>

          <div className="tbl" style={{ marginTop: '16px' }}>
            <table>
              <thead>
                <tr>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Status</th>
                  <th>Joined</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {members.map(m => {
                  const cannotEdit = !isSuperAdmin && (m.role === 'admin' || m.role === 'super_admin')
                  const isLastSuperAdmin = m.role === 'super_admin' && members.filter(x => x.role === 'super_admin').length === 1
                  return (
                    <tr key={m.id}>
                      <td>
                        <b>{m.email || m.user_id}</b>
                        {m.user_id === user?.sub && <span className="tag blue" style={{ marginLeft: '6px' }}>You</span>}
                      </td>
                      <td>
                        {m.role ? (
                          cannotEdit ? (
                            <span className="tag purple">{m.role}</span>
                          ) : (
                            <select
                              value={m.role}
                              onChange={(e) => handleRoleChange(m.id, e.target.value)}
                              disabled={isLastSuperAdmin}
                            >
                              {assignableRoles.map(r => <option key={r} value={r}>{r}</option>)}
                            </select>
                          )
                        ) : (
                          <span className="tag yellow">Awaiting Approval</span>
                        )}
                      </td>
                      <td>
                        {m.role ? (
                          <span className="tag green">Active</span>
                        ) : (
                          <span className="tag red">Pending Approval</span>
                        )}
                      </td>
                      <td>{new Date(m.created_at * 1000).toLocaleDateString()}</td>
                      <td>
                        {!m.role ? (
                          <div style={{ display: 'flex', gap: '6px' }}>
                            {isSuperAdmin && (
                              <button
                                className="btn sm"
                                onClick={() => handleRoleChange(m.id, 'admin')}
                                style={{ fontSize: '11px', background: 'var(--blue, #2563eb)' }}
                                title="Approve this user as an Admin"
                              >
                                Approve Admin
                              </button>
                            )}
                            <button
                              className="btn sm"
                              onClick={() => handleRoleChange(m.id, 'analyst')}
                              style={{ fontSize: '11px' }}
                              title="Approve as Analyst"
                            >
                              Approve Analyst
                            </button>
                            <button
                              className="btn sm ghost"
                              onClick={() => handleRoleChange(m.id, 'viewer')}
                              style={{ fontSize: '11px' }}
                              title="Approve as Viewer"
                            >
                              Approve Viewer
                            </button>
                          </div>
                        ) : (
                          <span style={{ fontSize: '12px', color: '#888' }}>
                            {m.user_id === user?.sub ? 'Self' : 'Approved'}
                          </span>
                        )}
                      </td>
                    </tr>
                  )
                })}
                {members.length === 0 && <tr><td colSpan="5" className="empty">No members yet. Invite someone to get started.</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-h">
          <h3>Portfolio Telegram Alerts</h3>
        </div>
        <div className="card-b">
          <p className="hint">Configure Telegram bot credentials for each portfolio to receive portfolio-specific alerts.</p>
          
          <div className="form-group" style={{ marginTop: '16px' }}>
            <label>Select Portfolio</label>
            <select
              value={selectedPortfolio}
              onChange={(e) => { setSelectedPortfolio(e.target.value); loadPortfolioTelegram(e.target.value) }}
            >
              <option value="">-- Select a portfolio --</option>
              {portfolios.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>

          {selectedPortfolio && (
            <form onSubmit={handleSaveTelegram} style={{ marginTop: '16px' }}>
              <div className="form-group">
                <label>Telegram Bot Token</label>
                <input
                  type="text"
                  value={telegramToken}
                  onChange={(e) => setTelegramToken(e.target.value)}
                  placeholder="123456:ABC-DEF1234ghIkl-zyx57W2v1u123ew11"
                />
                <small className="hint">Get from @BotFather: /newbot</small>
              </div>
              
              <div className="form-group">
                <label>Telegram Chat ID</label>
                <input
                  type="text"
                  value={telegramChatId}
                  onChange={(e) => setTelegramChatId(e.target.value)}
                  placeholder="123456789"
                />
                <small className="hint">Message your bot, then check: https://api.telegram.org/bot&lt;token&gt;/getUpdates</small>
              </div>

              <button type="submit" className="btn" disabled={loading}>
                {loading ? 'Saving...' : 'Save Telegram Settings'}
              </button>
            </form>
          )}

          {portfolios.length > 0 && (
            <div className="tbl" style={{ marginTop: '20px' }}>
              <table className="mini">
                <thead>
                  <tr>
                    <th>Portfolio</th>
                    <th>Telegram Configured</th>
                  </tr>
                </thead>
                <tbody>
                  {portfolios.map(p => (
                    <tr key={p.id}>
                      <td>{p.name}</td>
                      <td>
                        {p.telegram_bot_token && p.telegram_chat_id ? (
                          <span className="tag green">Yes</span>
                        ) : (
                          <span className="tag yellow">No</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      <div className="card">
        <div className="card-h">
          <h3>Role Hierarchy & Permissions</h3>
        </div>
        <div className="card-b">
          <table className="mini">
            <thead>
              <tr>
                <th>Role</th>
                <th>Read</th>
                <th>Write</th>
                <th>Approve</th>
                <th>Audit</th>
                <th>Admin</th>
                <th>Portfolio Visibility</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><b>super_admin</b></td>
                <td>✓</td><td>✓</td><td>✓</td><td>✓</td><td>✓</td>
                <td>All portfolios (can filter by any admin)</td>
              </tr>
              <tr>
                <td><b>admin</b></td>
                <td>✓</td><td>✓</td><td>✓</td><td>✓</td><td>✓</td>
                <td>Own portfolios only</td>
              </tr>
              <tr>
                <td><b>risk_manager</b></td>
                <td>✓</td><td>✓</td><td>✓</td><td>-</td><td>-</td>
              </tr>
              <tr>
                <td><b>analyst</b></td>
                <td>✓</td><td>✓</td><td>-</td><td>-</td><td>-</td>
              </tr>
              <tr>
                <td><b>viewer</b></td>
                <td>✓</td><td>-</td><td>-</td><td>-</td><td>-</td>
              </tr>
              <tr>
                <td><b>auditor</b></td>
                <td>✓</td><td>-</td><td>-</td><td>✓</td><td>-</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
