// Stress testing: scenario library bar chart + table, and a custom scenario builder with sliders.
import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell } from 'recharts'
import { Card } from '../../components/ui.jsx'
import CountUp from '../../components/CountUp.jsx'
import { api } from '../../lib/api.js'
import { cr, pc } from '../../lib/format.js'

const tip = { contentStyle: { background: '#0b1322', border: '1px solid rgba(120,160,200,.2)', borderRadius: 10, color: '#e6edf7', fontSize: 12 } }
const FIELDS = [
  ['eq_in', 'India equities', -40, 40, '%'], ['eq_gl', 'Global equities', -40, 40, '%'],
  ['fx', 'USD/INR', -20, 20, '%'], ['dy', 'Rates shock', -3, 3, ' pp'], ['comm', 'Commodities', -50, 50, '%'],
]

export default function Stress({ s, pid }) {
  const [f, setF] = useState({ eq_in: -10, eq_gl: -10, fx: 5, dy: 1, comm: 0 })
  const [res, setRes] = useState(null), [busy, setBusy] = useState(false), [err, setErr] = useState('')
  const run = () => {
    setBusy(true); setErr('')
    api('/stress/custom?portfolio=' + pid, Object.fromEntries(Object.entries(f).map(([k, v]) => [k, (+v || 0) / 100])))
      .then(setRes).catch(e => setErr(e.message)).finally(() => setBusy(false))
  }
  return <>
    <Card title="Scenario library — portfolio P&L under each shock" d={.05} pad={false}>
      <div className="chartbox"><ResponsiveContainer width="100%" height={230}>
        <BarChart data={s.stress} margin={{ left: 8 }}>
          <CartesianGrid stroke="rgba(120,160,200,.08)" vertical={false} />
          <XAxis dataKey="name" tick={{ fill: '#8598b3', fontSize: 11 }} interval={0} axisLine={false} tickLine={false} />
          <YAxis tickFormatter={x => (x * 100).toFixed(0) + '%'} tick={{ fill: '#8598b3', fontSize: 11 }} axisLine={false} tickLine={false} />
          <Tooltip {...tip} formatter={x => pc(x)} cursor={{ fill: 'rgba(248,113,113,.06)' }} />
          <Bar dataKey="pct" radius={[4, 4, 0, 0]}>
            {s.stress.map(x => <Cell key={x.name} fill={x.pct < -.15 ? '#ef4444' : '#f59e0b'} />)}
          </Bar>
        </BarChart>
      </ResponsiveContainer></div>
      <div className="card-b"><div className="tbl">
        <table><thead><tr><th>Scenario</th><th className="n">P&L</th><th className="n">% of exposure</th><th>Largest losses</th></tr></thead><tbody>
          {s.stress.map(x => <tr key={x.name}><td data-label="Scenario"><b>{x.name}</b></td><td data-label="P&L" className="n neg">{cr(x.loss)}</td><td data-label="% of exposure" className="n">{pc(x.pct)}</td>
            <td data-label="Largest losses">{x.top.map(t => `${t.symbol} ${cr(t.pnl)}`).join(', ')}</td></tr>)}
        </tbody></table>
      </div></div>
    </Card>

    <Card title="Custom scenario builder" d={.1}>
      <div className="sliders">{FIELDS.map(([k, label, min, max, unit]) => <label key={k} className="slider">
        <span className="slider-l"><span>{label}</span><b>{f[k]}{unit}</b></span>
        <input type="range" min={min} max={max} step={k === 'dy' ? .25 : 1} value={f[k]} onChange={e => setF({ ...f, [k]: +e.target.value })} />
      </label>)}</div>
      <div className="row-end"><button className="btn" onClick={run} disabled={busy}>{busy ? 'Running…' : 'Run scenario'}</button></div>
      {err && <p className="neg">{err}</p>}
      <AnimatePresence>{res && <motion.div className="stress-res"
        initial={{ opacity: 0, y: 10, scale: .98 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0 }}>
        Portfolio P&L <b className="neg"><CountUp value={res.loss} format={cr} /></b> ({pc(res.pct)} of exposure).
        Largest losses: {res.top.map(t => `${t.symbol} ${cr(t.pnl)}`).join(', ')}.
      </motion.div>}</AnimatePresence>
    </Card>
  </>
}
