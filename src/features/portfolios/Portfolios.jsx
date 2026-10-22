// Portfolios: upload CSV/Excel, generate a test book, connect Zerodha Kite, list and delete books.
import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Card } from '../../components/ui.jsx'
import { Spinner, ButtonLoader, TableLoader } from '../../components/Loader.jsx'
import { useToast } from '../../components/Toast.jsx'
import { ErrorDisplay } from '../../components/ErrorDisplay.jsx'
import { api } from '../../lib/api.js'
import { int } from '../../lib/format.js'

export default function Portfolios({ list, setList, pid, setPid, onChanged }) {
  const [name, setName] = useState(''), [msg, setMsg] = useState(null), [busy, setBusy] = useState(false), [conns, setConns] = useState([])
  const [deleting, setDeleting] = useState(null)
  const [connecting, setConnecting] = useState(false)
  const [loadingConns, setLoadingConns] = useState(true)
  const { success, error } = useToast()

  useEffect(() => {
    setLoadingConns(true)
    api('/connectors')
      .then(setConns)
      .catch(() => {})
      .finally(() => setLoadingConns(false))
  }, [])

  useEffect(() => {
    const t = new URLSearchParams(location.search).get('request_token')
    if (t) {
      history.replaceState({}, '', '/')
      run(() => api('/connectors/kite/import', { request_token: t }))
    }
  }, [])

  const run = async fn => {
    setBusy(true)
    setMsg(null)
    try {
      const r = await fn()
      const successMsg = `Imported ${int(r.report.rows_ok)} positions` + (r.report.errors?.length ? `, ${r.report.errors.length} rows skipped (first: row ${r.report.errors[0].row})` : '')
      setMsg({ ok: true, t: successMsg })
      success(successMsg)
      onChanged(r.id)
    } catch (e) {
      const errorMsg = e.message || 'Failed to import portfolio'
      setMsg({ ok: false, t: errorMsg })
      error(errorMsg)
    }
    setBusy(false)
  }

  const upload = e => {
    const f = e.target.files[0]
    if (!f) return
    run(() => api(`/portfolios?name=${encodeURIComponent(name || f.name)}&filename=${encodeURIComponent(f.name)}`, f, true))
    e.target.value = ''
  }

  const kite = async () => {
    setConnecting(true)
    try {
      const d = await api('/connectors/kite/login')
      location.href = d.url
    } catch (e) {
      error(e.message || 'Failed to connect to Zerodha')
      setConnecting(false)
    }
  }

  const deletePortfolio = async (id, name) => {
    if (!confirm(`Delete portfolio "${name}"? This action cannot be undone.`)) return
    setDeleting(id)

    // Optimistic update: remove from list immediately
    const previousList = list
    if (setList) {
      setList(prev => prev.filter(p => p.id !== id))
    }

    try {
      await api(`/portfolios/${id}/delete`, {})
      success(`Portfolio "${name}" deleted successfully`)
      onChanged(null)
    } catch (e) {
      // Revert optimistic update on error
      if (setList) setList(previousList)
      error(e.message || 'Failed to delete portfolio')
    } finally {
      setDeleting(null)
    }
  }

  return <>
    <Card title="Add a portfolio" d={.05}>
      <div className="form2">
        <label>Portfolio name<input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Equity desk, Mumbai" disabled={busy} /></label>
        <label className={'btn file' + (busy ? ' off' : '')}>
          {busy ? <ButtonLoader text="Uploading..." /> : 'Upload CSV or Excel'}
          <input type="file" accept=".csv,.xlsx,.xls" onChange={upload} disabled={busy} hidden />
        </label>
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
          <td data-label="" className="n">
            <button className="btn ghost sm" onClick={() => setPid(p.id)}>Open</button>
            <button
              className="btn ghost sm danger"
              onClick={() => deletePortfolio(p.id, p.name)}
              disabled={deleting === p.id}
            >
              {deleting === p.id ? <Spinner size="sm" /> : 'Delete'}
            </button>
          </td></tr>)}
        {(!list || list.length === 0) && <tr><td colSpan="5" className="empty">No portfolios found.</td></tr>}
      </tbody></table>
    </div></Card>

    <Card title="Connect a data source" d={.15}><div className="tbl">
      {loadingConns ? (
        <TableLoader rows={3} cols={3} />
      ) : (
        <table><thead><tr><th>Connector</th><th>Status</th><th className="n"></th></tr></thead><tbody>
          {conns.map(c => <tr key={c.id}><td data-label="Connector"><b>{c.name}</b></td><td data-label="Status" className="mut">{c.status}</td>
            <td data-label="" className="n">
              {c.id === 'kite' && c.status === 'available' && (
                <button className="btn sm" onClick={kite} disabled={connecting}>
                  {connecting ? <ButtonLoader text="Connecting..." /> : 'Connect Zerodha'}
                </button>
              )}
            </td></tr>)}
        </tbody></table>
      )}
    </div></Card>
  </>
}
