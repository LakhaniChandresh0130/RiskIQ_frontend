// Risk drivers: component VaR by position / sector / asset class / currency.
import { useState } from 'react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell } from 'recharts'
import { Card } from '../../components/ui.jsx'
import DataTable from '../../components/DataTable.jsx'
import { cr, pc } from '../../lib/format.js'

const LEVELS = [['position', 'Position'], ['sector', 'Sector'], ['asset_class', 'Asset class'], ['currency', 'Currency']]
const tip = { contentStyle: { background: '#0b1322', border: '1px solid rgba(120,160,200,.2)', borderRadius: 10, color: '#e6edf7', fontSize: 12 } }
const COLS = [
  { key: 'key', label: 'Driver', render: r => <b>{r.key}</b> },
  { key: 'var', label: 'Component VaR', n: true, render: r => cr(r.var) },
  { key: 'pct', label: '% of risk', n: true, render: r => pc(r.pct) },
]

export default function Drivers({ s }) {
  const [lv, setLv] = useState('position'), d = s.attribution?.[lv] || []
  const max = Math.max(...d.map(x => x.pct), 1e-9)
  return <>
    <Card title="Risk drivers — component VaR, 1-day 99%" d={.05}
      right={<div className="tabs">{LEVELS.map(([k, l]) => <button key={k} className={lv === k ? 'on' : ''} onClick={() => setLv(k)}>{l}</button>)}</div>}>
      <div className="chartbox"><ResponsiveContainer width="100%" height={Math.max(200, Math.min(d.length, 14) * 34)}>
        <BarChart data={d.slice(0, 14)} layout="vertical" margin={{ left: 40 }}>
          <CartesianGrid stroke="rgba(120,160,200,.08)" horizontal={false} />
          <XAxis type="number" tickFormatter={x => (x * 100).toFixed(0) + '%'} tick={{ fill: '#8598b3', fontSize: 11 }} axisLine={false} tickLine={false} />
          <YAxis type="category" dataKey="key" width={110} tick={{ fill: '#c6d2e4', fontSize: 11 }} axisLine={false} tickLine={false} />
          <Tooltip {...tip} formatter={x => pc(x)} cursor={{ fill: 'rgba(34,211,238,.06)' }} />
          <Bar dataKey="pct" radius={[0, 4, 4, 0]}>
            {d.slice(0, 14).map(r => <Cell key={r.key} fill={r.pct / max > .66 ? '#ef4444' : r.pct / max > .33 ? '#f59e0b' : '#22d3ee'} />)}
          </Bar>
        </BarChart>
      </ResponsiveContainer></div>
      <DataTable columns={COLS} rows={d} size={14} />
    </Card>
  </>
}
