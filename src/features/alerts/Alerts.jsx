// Alert inbox: severity filters, AI-written explanations, acknowledge / resolve actions.
import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Card, Tag } from '../../components/ui.jsx'
import { api } from '../../lib/api.js'

const SEV = [['all', 'All'], ['critical', 'Critical'], ['warning', 'Warning']]

export default function Alerts({ s, refresh }) {
  if (!s) return <div className="card"><div className="card-b">Loading alerts data...</div></div>
  const [sev, setSev] = useState('all'), [busy, setBusy] = useState('')
  const rows = (s.alerts || []).filter(a => sev === 'all' || a.severity === sev)
  const act = async (a, verb) => {
    setBusy(a.id + verb)
    try { await api(`/alerts/${a.id}/${verb}`, {}); refresh() }
    catch (e) { alert(e.message) }
    setBusy('')
  }
  return <Card title="Alert inbox" d={.05}
    right={<div className="tabs">{SEV.map(([k, l]) => <button key={k} className={sev === k ? 'on' : ''} onClick={() => setSev(k)}>{l}</button>)}</div>}>
    {!rows.length && <p className="mut">No active alerts. All metrics are inside limits.</p>}
    <AnimatePresence initial={false}>{rows.map((a, i) => <motion.div key={a.id ?? i} className={'alert ' + a.severity}
      layout initial={{ opacity: 0, x: -14 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 14 }}
      transition={{ duration: .3, delay: i * .04 }}>
      <div className="alert-h"><Tag tone={a.severity}>{a.severity}</Tag><b>{a.title}</b>
        <small className="mut">{a.as_of} · rule: {a.rule}</small>
        {a.id && <span className="alert-act">
          <button className="btn ghost sm" disabled={busy} onClick={() => act(a, 'ack')}>Acknowledge</button>
          <button className="btn ghost sm" disabled={busy} onClick={() => act(a, 'resolve')}>Resolve</button>
        </span>}</div>
      <div className="alert-b">{a.explanation}</div>
    </motion.div>)}</AnimatePresence>
  </Card>
}
