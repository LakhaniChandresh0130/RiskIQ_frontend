import { useEffect, useState, useMemo, memo } from 'react'
import Portfolios from './Portfolios.jsx'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine, BarChart, Bar, CartesianGrid } from 'recharts'

const cr = v => (v < 0 ? '-' : '') + '₹' + (Math.abs(v) / 1e7).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' cr'
const pc = v => (v * 100).toFixed(2) + '%'
const api = (u, body, raw) => fetch('/api' + u, body ? { method: 'POST', headers: raw ? {} : { 'Content-Type': 'application/json' }, body: raw ? body : JSON.stringify(body) } : {}).then(async r => { const d = await r.json().catch(() => ({})); if (!r.ok) throw new Error(typeof d.detail === 'string' ? d.detail : r.statusText); return d })

const Card = ({ title, children }) => <div className="card"><h3>{title}</h3><div>{children}</div></div>
const KPI = ({ t, v, sub, cls = '' }) => <div className={'kpi ' + cls}><small>{t}</small><div>{v}</div><small>{sub}</small></div>

const PositionsTable = memo(({ rows, total }) => {
  const [pg, setPg] = useState(0), [q, setQ] = useState(''), size = 25
  const f = useMemo(() => q ? rows.filter(r => (r.symbol + r.name + r.sector).toLowerCase().includes(q.toLowerCase())) : rows, [rows, q])
  const pages = Math.max(1, Math.ceil(f.length / size)), cur = f.slice(pg * size, pg * size + size)
  return <Card title={`Positions and risk contribution: ${total.toLocaleString('en-IN')} lines, ${rows.length.toLocaleString('en-IN')} instruments`}>
    <input className="search" placeholder="Search symbol, name or sector" value={q} onChange={e => { setQ(e.target.value); setPg(0) }} />
    <table><thead><tr><th>Symbol</th><th>Name</th><th>Class</th><th>Ccy</th><th>Sector</th><th className="n">Value</th><th className="n">Weight</th><th className="n">Component VaR</th><th className="n">% of risk</th></tr></thead><tbody>
      {cur.map(p => <tr key={p.symbol + p.sector}><td><b>{p.symbol}</b></td><td>{p.name}</td><td>{p.cls}</td><td>{p.ccy}</td><td>{p.sector}</td><td className="n">{cr(p.value)}</td><td className="n">{pc(p.weight)}</td><td className="n">{cr(p.comp_var)}</td><td className="n">{pc(p.pct)}</td></tr>)}</tbody></table>
    <div className="pager"><button className="btn" disabled={pg === 0} onClick={() => setPg(pg - 1)}>Previous</button><span>Page {pg + 1} of {pages}</span><button className="btn" disabled={pg >= pages - 1} onClick={() => setPg(pg + 1)}>Next</button></div>
  </Card>
})

function Dashboard({ s }) {
  const m = s.methods || {}, v = m.parametric?.var || 0, u = s.nav ? v / s.nav : 0
  const st = u >= (s.limits?.crit || 1) ? 'crit' : u >= (s.limits?.warn || 1) ? 'warn' : ''
  const bt = s.backtest || { zone: 'green', breaches: 0, kupiec_p: 1 }
  return <>
    <div className="kpis">
      <KPI t="Gross exposure" v={cr(s.nav || 0)} sub={(s.n_lines || 0).toLocaleString("en-IN") + " lines, INR base"} />
      <KPI t="VaR 99%, 1-day" v={cr(v)} sub={pc(u) + ' of exposure'} cls={st} />
      <KPI t="Expected shortfall 99%" v={cr(m.parametric?.es || 0)} sub="Parametric, EWMA λ=0.94" />
      <KPI t="Limit utilisation" v={s.limits?.crit ? (u / s.limits.crit * 100).toFixed(0) + '%' : 'N/A'} sub="of critical limit" cls={st} />
      <KPI t="Open alerts" v={(s.alerts || []).length} sub={(s.alerts || []).filter(a => a.severity === 'critical').length + ' critical'} cls={(s.alerts || []).some(a => a.severity === 'critical') ? 'crit' : ''} />
    </div>
    <div className="grid2">
      <Card title="1-day 99% VaR, last 120 trading days">
        <ResponsiveContainer width="100%" height={260}>
          <LineChart data={s.var_series || []}><CartesianGrid stroke="#e8ecf1" /><XAxis dataKey="date" tick={{ fontSize: 11 }} minTickGap={40} />
            <YAxis tickFormatter={x => (x / 1e7).toFixed(1)} tick={{ fontSize: 11 }} unit=" cr" width={60} />
            <Tooltip formatter={x => cr(x)} />
            <ReferenceLine y={s.limits.warn * s.nav} stroke="#b45309" strokeDasharray="4 3" label={{ value: 'warning', fontSize: 11, fill: '#b45309' }} />
            <ReferenceLine y={s.limits.crit * s.nav} stroke="#b91c1c" strokeDasharray="4 3" label={{ value: 'critical', fontSize: 11, fill: '#b91c1c' }} />
            <Line dataKey="var" stroke="#0f766e" dot={false} strokeWidth={2} /></LineChart>
        </ResponsiveContainer>
      </Card>
      <div style={{ display: 'grid', gap: 12, alignContent: 'start' }}>
        <Card title="Method comparison (1-day, 99%)">
          <table><thead><tr><th>Method</th><th className="n">VaR</th><th className="n">ES</th></tr></thead><tbody>
            {Object.entries(m).map(([k, d]) => <tr key={k}><td>{k.replace('_', ' ')}</td><td className="n">{cr(d?.var || 0)}</td><td className="n">{cr(d?.es || 0)}</td></tr>)}
          </tbody></table>
        </Card>
        <Card title="Backtest, 250 days">
          <span className={'tag ' + bt.zone}>{bt.zone}</span> {bt.breaches} breaches (expected ~2.5). Kupiec p-value {bt.kupiec_p?.toFixed(3) || 'N/A'}.
        </Card>
      </div>
    </div>
    <PositionsTable rows={s.positions || []} total={s.n_lines || 0} />
  </>
}

function Drivers({ s }) {
  const [lv, setLv] = useState('position'), d = s.attribution?.[lv] || []
  return <Card title="Risk drivers (component VaR, 99%)">
    <div className="tabs" style={{ marginBottom: 10 }}>{['position', 'sector', 'asset_class', 'currency'].map(k => <button key={k} className={lv === k ? 'on' : ''} onClick={() => setLv(k)}>{k.replace('_', ' ')}</button>)}</div>
    <ResponsiveContainer width="100%" height={Math.max(160, d.length * 30)}>
      <BarChart data={d} layout="vertical" margin={{ left: 30 }}><CartesianGrid stroke="#e8ecf1" /><XAxis type="number" tickFormatter={x => (x * 100).toFixed(0) + '%'} /><YAxis type="category" dataKey="key" width={90} />
        <Tooltip formatter={x => pc(x)} /><Bar dataKey="pct" fill="#0f766e" /></BarChart>
    </ResponsiveContainer>
    <table><thead><tr><th>{lv.replace('_', ' ')}</th><th className="n">Component VaR</th><th className="n">% of risk</th></tr></thead><tbody>
      {d.map(r => <tr key={r.key}><td>{r.key}</td><td className="n">{cr(r.var)}</td><td className="n">{pc(r.pct)}</td></tr>)}</tbody></table>
  </Card>
}

function Stress({ s, pid }) {
  const [f, setF] = useState({ eq_in: -10, eq_gl: -10, fx: 5, dy: 1, comm: 0 }), [res, setRes] = useState(null)
  const run = () => api('/stress/custom?portfolio=' + pid, Object.fromEntries(Object.entries(f).map(([k, v]) => [k, (+v || 0) / 100]))).then(setRes)
  const L = { eq_in: 'India equities %', eq_gl: 'Global equities %', fx: 'USD/INR %', dy: 'Rates shock (pp)', comm: 'Commodities %' }
  const stress = s.stress || []
  return <>
    <Card title="Scenario library">
      <ResponsiveContainer width="100%" height={220}><BarChart data={stress.map(x => ({ name: x.name, pct: x.pct }))} margin={{ left: 10 }}>
        <CartesianGrid stroke="#e8ecf1" /><XAxis dataKey="name" tick={{ fontSize: 11 }} interval={0} /><YAxis tickFormatter={x => (x * 100).toFixed(0) + '%'} /><Tooltip formatter={x => pc(x)} /><Bar dataKey="pct" fill="#b91c1c" /></BarChart></ResponsiveContainer>
      <table><thead><tr><th>Scenario</th><th className="n">P&amp;L</th><th className="n">% NAV</th><th>Largest losses</th></tr></thead><tbody>
        {stress.map(x => <tr key={x.name}><td>{x.name}</td><td className="n neg">{cr(x.loss)}</td><td className="n">{pc(x.pct)}</td><td>{x.top.map(t => `${t.symbol} ${cr(t.pnl)}`).join(', ')}</td></tr>)}</tbody></table>
    </Card>
    <Card title="Custom scenario builder">
      <div className="form">{Object.keys(L).map(k => <label key={k}>{L[k]}<input type="number" step="0.5" value={f[k]} onChange={e => setF({ ...f, [k]: e.target.value })} /></label>)}
        <button className="btn" onClick={run}>Run scenario</button></div>
      {res && <p>Portfolio P&amp;L <b className="neg">{cr(res.loss)}</b> ({pc(res.pct)} of NAV). Largest losses: {res.top.map(t => `${t.symbol} ${cr(t.pnl)}`).join(', ')}.</p>}
    </Card>
  </>
}

const Alerts = ({ s }) => <Card title="Alert inbox">{(s.alerts || []).length ? (s.alerts || []).map(a => <div key={a.id} className={'alert ' + a.severity}>
  <span className={'tag ' + a.severity}>{a.severity}</span> <b>{a.title}</b> <small>({a.as_of}, rule: {a.rule})</small><div>{a.explanation}</div></div>) : 'No active alerts. All metrics are inside limits.'}</Card>

function Agent({ pid }) {
  const [msgs, setMsgs] = useState([{ r: 'a', t: 'Ask about risk, drivers, alerts or stress scenarios. Numbers come from the risk engine, not from the model.' }]), [q, setQ] = useState(''), [busy, setBusy] = useState(false)
  const send = async e => {
    e.preventDefault(); if (!q.trim() || busy) return
    const text = q; setQ(''); setBusy(true); setMsgs(m => [...m, { r: 'u', t: text }])
    try { const r = await api('/agent/chat', { message: text, portfolio: pid }); setMsgs(m => [...m, { r: 'a', t: r.answer, n: `Tools: ${r.tools.join(', ') || 'none'} · ${r.mode}` }]) }
    catch { setMsgs(m => [...m, { r: 'a', t: 'The request failed. Check that the backend is running.' }]) }
    setBusy(false)
  }
  return <Card title="AI risk analyst"><div className="chat">
    {msgs.map((m, i) => <div key={i} className={'msg ' + (m.r === 'u' ? 'u' : '')}>{m.t}{m.n && <small>{m.n}</small>}</div>)}
    <form onSubmit={send}><input value={q} onChange={e => setQ(e.target.value)} placeholder="Why did risk go up today?" /><button className="btn" disabled={busy}>{busy ? 'Working…' : 'Ask'}</button></form></div></Card>
}

const cache = new Map()
export default function App() {
  const [pid, setPid] = useState('demo'), [list, setList] = useState([]), [s, setS] = useState(null), [page, setPage] = useState('dashboard'), [err, setErr] = useState('')
  const loadList = () => api('/portfolios').then(setList).catch(() => {})
  const load = (id, force) => { setErr(''); if (!force && cache.has(id)) return setS(cache.get(id)); setS(null)
    api(`/portfolios/${id}/snapshot`).then(d => { cache.set(id, d); setS(d) }).catch(e => setErr(e.message || 'Cannot reach the backend on port 8000. Start it with: uvicorn main:app --port 8000')) }
  useEffect(() => { loadList() }, [])
  useEffect(() => { load(pid) }, [pid])
  const changed = id => { cache.clear(); loadList(); id === pid ? load(pid, true) : setPid(id); setPage('dashboard') }
  const nav = [['dashboard', 'Dashboard'], ['portfolios', 'Portfolios'], ['drivers', 'Risk drivers'], ['stress', 'Stress testing'], ['alerts', 'Alerts'], ['agent', 'AI analyst']]
  const pages = { dashboard: s && <Dashboard s={s} />, drivers: s && <Drivers s={s} />, stress: s && <Stress s={s} pid={pid} />, alerts: s && <Alerts s={s} />, agent: <Agent key={pid} pid={pid} />,
    portfolios: <Portfolios api={api} list={list} pid={pid} setPid={id => { setPid(id); setPage('dashboard') }} onChanged={changed} /> }
  const ready = page === 'portfolios' || page === 'agent' || s
  return <div className="app">
    <aside><h1>RiskIQ</h1>{nav.map(([k, l]) => <button key={k} className={page === k ? 'on' : ''} onClick={() => setPage(k)}>{l}{k === 'alerts' && s?.alerts.length > 0 && <span className="badge">{s.alerts.length}</span>}</button>)}</aside>
    <main><header><div><b>{nav.find(n => n[0] === page)[1]}</b>
      <select value={pid} onChange={e => setPid(e.target.value)} aria-label="Portfolio">{list.length ? list.map(p => <option key={p.id} value={p.id}>{p.name}</option>) : <option value="demo">Demo book</option>}</select></div>
      <div>{s && <><span>As of {s.as_of}</span><span>Data: {s.data_source}</span><span>Computed in {s.compute_ms} ms</span></>}</div></header>
      <section>{ready ? pages[page] : <p>{err || 'Loading risk snapshot…'}</p>}{err && s === null && ready && page !== 'portfolios' && <p className="neg">{err}</p>}</section></main>
  </div>
}
