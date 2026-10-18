// App shell: aurora backdrop, sidebar nav with a sliding active marker, topbar with
// global portfolio selector, and animated page transitions. Snapshot data is cached per portfolio.
import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { api } from '../lib/api.js'
import { setCcy } from '../lib/format.js'
import { AuthProvider, useAuth } from '../contexts/AuthContext.jsx'
import Dashboard from '../features/dashboard/Dashboard.jsx'
import Portfolios from '../features/portfolios/Portfolios.jsx'
import Drivers from '../features/drivers/Drivers.jsx'
import Stress from '../features/stress/Stress.jsx'
import Alerts from '../features/alerts/Alerts.jsx'
import Agent from '../features/agent/Agent.jsx'
import Admin from '../features/admin/Admin.jsx'
import Governance from '../features/governance/Governance.jsx'
import Audit from '../features/audit/Audit.jsx'
import Auth from '../features/auth/Auth.jsx'
import PendingApproval from '../features/auth/PendingApproval.jsx'
import ErrorBoundary from '../components/ErrorBoundary.jsx'

const NAV = [
  ['dashboard', 'Dashboard', 'M3 3h7v7H3zM14 3h7v4h-7zM14 11h7v10h-7zM3 14h7v7H3z'],
  ['portfolios', 'Portfolios', 'M4 7h16M4 7l1-3h14l1 3M5 7v12h14V7M9 11h6'],
  ['drivers', 'Risk drivers', 'M4 20V10M10 20V4M16 20v-7M21 20H3'],
  ['stress', 'Stress testing', 'M13 2L4 14h6l-1 8 9-12h-6z'],
  ['alerts', 'Alerts', 'M12 3a6 6 0 00-6 6v4l-2 3h16l-2-3V9a6 6 0 00-6-6zM10 19a2 2 0 004 0'],
  ['agent', 'AI analyst', 'M12 3l1.8 4.6L18 9l-4.2 1.4L12 15l-1.8-4.6L6 9l4.2-1.4zM19 15l.9 2.1L22 18l-2.1.9L19 21l-.9-2.1L16 18l2.1-.9z'],
  ['governance', 'Governance', 'M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5'],
  ['admin', 'Admin', 'M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M9 7a4 4 0 100-8 4 4 0 000 8z'],
  ['audit', 'Audit', 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2'],
]
const Icon = ({ d }) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" strokeLinecap="round"><path d={d} /></svg>
const TITLES = { dashboard: 'Home › Risk › Dashboard', portfolios: 'Home › Portfolios', drivers: 'Home › Risk › Drivers', stress: 'Home › Risk › Stress testing', alerts: 'Home › Risk › Alerts', agent: 'Home › AI analyst', governance: 'Home › Governance', admin: 'Home › Admin', audit: 'Home › Audit' }

const CCY_ORDER = ['INR', 'USD', 'EUR', 'GBP', 'JPY', 'SGD', 'AED', 'CHF']
const cache = new Map()

function AppContent() {
  const { user, hasPermission, logout, loading, isPendingApproval, isSuperAdmin } = useAuth()
  const [pid, setPid] = useState('demo'), [list, setList] = useState([]), [s, setS] = useState(null)
  const [page, setPage] = useState('dashboard'), [err, setErr] = useState('')
  const [curr, setCurr] = useState(() => localStorage.getItem('riskiq-ccy') || 'INR')
  const [rates, setRates] = useState({ INR: 1 })
  const [adminFilter, setAdminFilter] = useState('all')
  const [adminList, setAdminList] = useState([])

  const loadList = (filterAdmin = adminFilter) => {
    const q = isSuperAdmin() && filterAdmin && filterAdmin !== 'all' ? `?admin_id=${encodeURIComponent(filterAdmin)}` : ''
    api(`/portfolios${q}`).then(data => {
      setList(data)
      // If current portfolio is not in new list or belongs to another user, reset to demo or first item
      setPid(currPid => {
        if (currPid === 'demo') return 'demo'
        const exists = data.some(p => p.id === currPid)
        return exists ? currPid : (data[0]?.id || 'demo')
      })
    }).catch(e => {
      setErr(e.message || 'Failed to load portfolios. Please check your connection.')
    })
  }

  const loadAdmins = () => {
    if (user?.role === 'super_admin' || hasPermission('admin')) {
      api('/members').then(m => {
        const admins = m.filter(x => x.role === 'admin' || x.role === 'super_admin')
        setAdminList(admins)
      }).catch(() => {})
    }
  }

  const load = (id, force) => {
    setErr('')
    if (!force && cache.has(id)) return setS(cache.get(id))
    setS(null)
    api(`/portfolios/${id}/snapshot`).then(d => { cache.set(id, d); setS(d) })
      .catch(e => {
        setErr(e.message || 'Cannot reach the backend on port 8000. Start it with: uvicorn main:app --port 8000')
      })
  }
  useEffect(() => {
    if (!user) return
    cache.clear()
    setPid('demo')
    loadList()
  }, [user?.sub, adminFilter])
  useEffect(() => { if (user) loadAdmins() }, [user?.role])
  useEffect(() => { api('/fx').then(r => { setCcy(curr, r[curr] ?? 1); setRates(r) }).catch(() => {}) }, [])
  useEffect(() => { if (user) load(pid) }, [pid, user])
  const pickCcy = c => { setCcy(c, rates[c] ?? 1); localStorage.setItem('riskiq-ccy', c); setCurr(c) }
  const changed = id => { cache.clear(); loadList(); id === pid ? load(pid, true) : setPid(id); setPage('dashboard') }
  const nAlerts = s?.alerts?.length ?? 0
  const currencyOptions = CCY_ORDER.map(c => ({ code: c, available: !!rates[c] }))

  // Filter nav based on permissions
  const filteredNav = NAV.filter(([key]) => {
    if (key === 'admin') return hasPermission('admin')
    if (key === 'governance') return hasPermission('read')
    if (key === 'audit') return hasPermission('audit')
    return true
  })

  const pages = {
    dashboard: s && <Dashboard s={s} />,
    drivers: s && <Drivers s={s} />,
    stress: s && <Stress s={s} pid={pid} />,
    alerts: s && <Alerts s={s} refresh={() => load(pid, true)} />,
    agent: <Agent key={pid} pid={pid} />,
    portfolios: <Portfolios list={list} pid={pid} setPid={id => { setPid(id); setPage('dashboard') }} onChanged={changed} />,
    governance: <Governance pid={pid} />,
    admin: <Admin />,
    audit: <Audit />,
  }
  const ready = page === 'portfolios' || page === 'agent' || page === 'governance' || page === 'admin' || page === 'audit' || s

  if (loading) {
    return <div className="auth-container">
      <div className="aurora"><i /><i /><i /><div className="gridfx" /></div>
      <div className="auth-card">
        <div className="skels">{[...Array(3)].map((_, i) => <div key={i} className="skel" style={{ animationDelay: i * .12 + 's' }} />)}</div>
      </div>
    </div>
  }

  if (!user) {
    return <Auth />
  }

  if (isPendingApproval()) {
    return <PendingApproval />
  }

  return <div className="app">
    <div className="aurora"><i /><i /><i /><div className="gridfx" /></div>

    <aside>
      <div className="brand"><span className="logo" /><div><b>RiskIQ</b><small>quant risk platform</small></div></div>
      <nav>{filteredNav.map(([k, l, d]) => <button key={k} className={page === k ? 'on' : ''} onClick={() => setPage(k)}>
        {page === k && <motion.span className="navmark" layoutId="navmark" transition={{ type: 'spring', stiffness: 420, damping: 34 }} />}
        <Icon d={d} /><span className="nl">{l}</span>
        {k === 'alerts' && nAlerts > 0 && <span className="badge">{nAlerts}</span>}
      </button>)}</nav>
      <div className="sidefoot">
        <div style={{ marginBottom: '8px' }}>
          <span className="chip-meta">{user?.role}</span>
        </div>
        <button className="btn sm ghost" onClick={logout} style={{ width: '100%' }}>Logout</button>
        <div style={{ marginTop: '8px' }}>India + global markets<br />INR base reporting</div>
      </div>
    </aside>

    <main>
      <header>
        <div className="crumbs"><b>{TITLES[page]}</b>
          {isSuperAdmin() && adminList.length > 0 && (
            <select
              value={adminFilter}
              onChange={e => setAdminFilter(e.target.value)}
              aria-label="Filter by Admin"
              title="Filter portfolios by Admin"
              style={{
                marginLeft: '8px',
                background: 'rgba(99, 102, 241, 0.12)',
                border: '1px solid rgba(99, 102, 241, 0.3)',
                color: 'inherit',
                borderRadius: '6px',
                padding: '4px 8px',
                fontSize: '12px'
              }}
            >
              <option value="all">👥 All Admins' Books</option>
              {adminList.map(a => (
                <option key={a.id} value={a.user_id || a.id}>
                  👤 Admin: {a.email || a.user_id} ({a.role})
                </option>
              ))}
            </select>
          )}
          <select value={pid} onChange={e => setPid(e.target.value)} aria-label="Portfolio">
            {list.length ? list.map(p => (
              <option key={p.id} value={p.id}>
                {p.name} {p.owner_email ? `(${p.owner_email})` : ''}
              </option>
            )) : <option value="demo">Demo book</option>}
          </select></div>
        <div className="meta">
          {s && <><span className="chip-meta">as of {s.as_of || 'N/A'}</span>
            <span className={'chip-meta ' + (s.data_quality?.live ? 'live' : 'proxy')}>{s.data_source || 'N/A'}</span>
            <span className="chip-meta perf">computed in {s.compute_ms || 0} ms</span></>}
          <select className="ccysel" value={curr} onChange={e => pickCcy(e.target.value)} aria-label="Display currency" title="Display currency">
            {currencyOptions.map(opt => <option key={opt.code} value={opt.code} disabled={!opt.available}>{opt.code}</option>)}
          </select>
          <button className={'bell' + (nAlerts ? ' ring' : '')} onClick={() => setPage('alerts')} title="Open alerts">
            <Icon d="M12 3a6 6 0 00-6 6v4l-2 3h16l-2-3V9a6 6 0 00-6-6zM10 19a2 2 0 004 0" />{nAlerts > 0 && <span className="badge">{nAlerts}</span>}
          </button>
        </div>
      </header>

      <AnimatePresence mode="wait"><motion.section key={page + '-' + curr}
        initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: .22 }}>
        {ready ? pages[page]
          : err ? <div className="card"><div className="card-b neg">{err}</div></div>
          : <div className="skels">{[...Array(4)].map((_, i) => <div key={i} className="skel" style={{ animationDelay: i * .12 + 's' }} />)}</div>}
        {err && s === null && ready && page !== 'portfolios' && <p className="neg">{err}</p>}
      </motion.section></AnimatePresence>
    </main>
  </div>
}

export default function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </ErrorBoundary>
  )
}
