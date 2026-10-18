import { useEffect, useState } from 'react'

export default function Portfolios({ api, list, pid, setPid, onChanged }) {
  const [name, setName] = useState(''), [msg, setMsg] = useState(null), [busy, setBusy] = useState(false), [conns, setConns] = useState([])
  useEffect(() => { api('/connectors').then(setConns).catch(() => {}) }, [])
  useEffect(() => {                                           // Zerodha redirects back here with ?request_token=...
    const t = new URLSearchParams(location.search).get('request_token')
    if (t) { history.replaceState({}, '', '/'); run(() => api('/connectors/kite/import', { request_token: t })) }
  }, [])
  const run = async fn => {
    setBusy(true); setMsg(null)
    try { const r = await fn(); setMsg({ ok: true, t: `Imported ${r.report.rows_ok.toLocaleString('en-IN')} positions` + (r.report.errors?.length ? `, ${r.report.errors.length} rows skipped (first: row ${r.report.errors[0].row})` : '') }); onChanged(r.id) }
    catch (e) { setMsg({ ok: false, t: e.message }) }
    setBusy(false)
  }
  const upload = e => { const f = e.target.files[0]; if (!f) return
    run(() => api(`/portfolios?name=${encodeURIComponent(name || f.name)}&filename=${encodeURIComponent(f.name)}`, f, true)); e.target.value = '' }
  const kite = () => api('/connectors/kite/login').then(d => { location.href = d.url }).catch(e => setMsg({ ok: false, t: e.message }))
  return <>
    <div className="card"><h3>Add a portfolio</h3><div className="form2">
      <label>Portfolio name<input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Equity desk, Mumbai" /></label>
      <label className="btn file">Upload CSV or Excel<input type="file" accept=".csv,.xlsx,.xls" onChange={upload} disabled={busy} hidden /></label>
      <a className="btn alt" href="/api/template.csv">Download template</a>
      <button className="btn alt" disabled={busy} onClick={() => run(() => api('/portfolios/demo-large?n=5000', {}))}>Generate 5,000-position test book</button></div>
      <p className="hint">Required column: symbol, plus market_value or quantity and price. Optional: exchange (NSE, BSE or a US exchange), currency, asset_class, sector, name, duration. USD rows are converted to INR.</p>
      {msg && <p className={msg.ok ? 'okmsg' : 'neg'}>{msg.t}</p>}</div>
    <div className="card"><h3>Your portfolios</h3><div><table><thead><tr><th>Name</th><th>Source</th><th className="n">Positions</th><th></th></tr></thead><tbody>
      {list.map(p => <tr key={p.id}><td>{p.id === pid ? <b>{p.name}</b> : p.name}</td><td>{p.source}</td><td className="n">{p.n_positions?.toLocaleString('en-IN')}</td>
        <td className="n"><button className="btn alt" onClick={() => setPid(p.id)}>Open</button>{p.id !== 'demo' && <button className="btn alt" onClick={() => confirm('Delete this portfolio?') && api(`/portfolios/${p.id}/delete`, {}).then(() => onChanged('demo'))}>Delete</button>}</td></tr>)}</tbody></table></div></div>
    <div className="card"><h3>Connect a data source</h3><div><table><thead><tr><th>Connector</th><th>Status</th><th></th></tr></thead><tbody>
      {conns.map(c => <tr key={c.id}><td>{c.name}</td><td>{c.status}</td><td className="n">{c.id === 'kite' && c.status === 'available' && <button className="btn alt" onClick={kite}>Connect Zerodha</button>}</td></tr>)}</tbody></table></div></div>
  </>
}
