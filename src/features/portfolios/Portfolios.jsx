// Portfolios: upload CSV/Excel, generate a test book, connect Zerodha Kite, list and delete books.
import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Card } from '../../components/ui.jsx'
import { api } from '../../lib/api.js'
import { int } from '../../lib/format.js'

export default function Portfolios({ list, pid, setPid, onChanged }) {
  const [name, setName] = useState(''), [msg, setMsg] = useState(null), [busy, setBusy] = useState(false), [conns, setConns] = useState([])
  useEffect(() => { api('/connectors').then(setConns).catch(() => {}) }, [])
  useEffect(() => {                                           // Zerodha redirects back here with ?request_token=...
    const t = new URLSearchParams(location.search).get('request_token')
    if (t) { history.replaceState({}, '', '/'); run(() => api('/connectors/kite/import', { request_token: t })) }
  }, [])
  const run = async fn => {
    setBusy(true); setMsg(null)
    try { const r = await fn(); setMsg({ ok: true, t: `Imported ${int(r.report.rows_ok)} positions` + (r.report.errors?.length ? `, ${r.report.errors.length} rows skipped (first: row ${r.report.errors[0].row})` : '') }); onChanged(r.id) }
    catch (e) { setMsg({ ok: false, t: e.message }) }
    setBusy(false)
  }
  const upload = e => { const f = e.target.files[0]; if (!f) return
    run(() => api(`/portfolios?name=${encodeURIComponent(name || f.name)}&filename=${encodeURIComponent(f.name)}`, f, true)); e.target.value = '' }
  const kite = () => api('/connectors/kite/login').then(d => { location.href = d.url }).catch(e => setMsg({ ok: false, t: e.message }))
  return <>
    <Card title="Add a portfolio" d={.05}>
      <div className="form2">
        <label>Portfolio name<input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Equity desk, Mumbai" /></label>
        <label className={'btn file' + (busy ? ' off' : '')}>Upload CSV or Excel<input type="file" accept=".csv,.xlsx,.xls" onChange={upload} disabled={busy} hidden /></label>
        <a className="btn ghost" href="/api/template.csv">Download template</a>
      </div>
      <p className="hint">Required column: symbol, plus market_value or quantity and price. Optional: exchange (NSE, BSE or a US exchange), currency, asset_class, sector, name, duration. USD rows are converted to INR.</p>
      <AnimatePresence>{msg && <motion.p className={msg.ok ? 'okmsg' : 'neg'} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>{msg.t}</motion.p>}</AnimatePresence>
    </Card>

    <Card title="Portfolios" d={.1}><div className="tbl">
      <table><thead><tr><th>Name</th><th>Owner / Admin</th><th>Source</th><th className="n">Positions</th><th className="n"></th></tr></thead><tbody>
        {(list || []).map(p => <tr key={p.id}><td data-label="Name">{p.id === pid ? <b>{p.name}</b> : p.name}</td>
          <td data-label="Owner / Admin"><span className="chip-meta" style={{ fontSize: '11px' }}>{p.owner_email || (p.owner || 'You')}</span></td>
          <td data-label="Source" className="mut">{p.source}</td><td data-label="Positions" className="n">{int(p.n_positions ?? 0)}</td>
          <td data-label="" className="n"><button className="btn ghost sm" onClick={() => setPid(p.id)}>Open</button>
            <button className="btn ghost sm danger" onClick={() => confirm('Delete this portfolio?') && api(`/portfolios/${p.id}/delete`, {}).then(() => onChanged(null))}>Delete</button></td></tr>)}
        {(!list || list.length === 0) && <tr><td colSpan="5" className="empty">No portfolios found.</td></tr>}
      </tbody></table>
    </div></Card>

    <Card title="Connect a data source" d={.15}><div className="tbl">
      <table><thead><tr><th>Connector</th><th>Status</th><th className="n"></th></tr></thead><tbody>
        {conns.map(c => <tr key={c.id}><td data-label="Connector"><b>{c.name}</b></td><td data-label="Status" className="mut">{c.status}</td>
          <td data-label="" className="n">{c.id === 'kite' && c.status === 'available' && <button className="btn sm" onClick={kite}>Connect Zerodha</button>}</td></tr>)}
      </tbody></table>
    </div></Card>
  </>
}
