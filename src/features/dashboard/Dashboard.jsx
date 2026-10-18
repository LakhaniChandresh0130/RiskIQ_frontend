// Dashboard: KPI strip (animated counters), VaR trend vs limits, 3D risk skyline, positions grid.
import { lazy, Suspense } from 'react'
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine, CartesianGrid } from 'recharts'
import { Card, Kpi, Tag } from '../../components/ui.jsx'
import DataTable from '../../components/DataTable.jsx'
import CountUp from '../../components/CountUp.jsx'
import ErrorBoundary from '../../components/ErrorBoundary.jsx'
import { cr, pc, int, ax, ccy } from '../../lib/format.js'

const RiskField3D = lazy(() => import('../../components/RiskField3D.jsx'))
const tip = { contentStyle: { background: '#0b1322', border: '1px solid rgba(120,160,200,.2)', borderRadius: 10, color: '#e6edf7', fontSize: 12 } }

const POS_COLS = [
  { key: 'symbol', label: 'Symbol', render: r => <b>{r.symbol}</b> },
  { key: 'name', label: 'Name' }, { key: 'cls', label: 'Class' }, { key: 'ccy', label: 'Ccy' }, { key: 'sector', label: 'Sector' },
  { key: 'value', label: 'Value', n: true, render: r => cr(r.value) },
  { key: 'weight', label: 'Weight', n: true, render: r => pc(r.weight) },
  { key: 'comp_var', label: 'Comp VaR', n: true, render: r => cr(r.comp_var) },
  { key: 'pct', label: '% of risk', n: true, render: r => pc(r.pct) },
]

export default function Dashboard({ s }) {
  if (!s) return <div className="card"><div className="card-b">Loading dashboard data...</div></div>
  const m = s.methods || {}, u = s.nav ? (m.parametric?.var || 0) / s.nav : 0
  const tone = u >= (s.limits?.crit || 1) ? 'crit' : u >= (s.limits?.warn || 1) ? 'warn' : ''
  const bt = s.backtest || { zone: 'green', breaches: 0, kupiec_p: 1 }
  return <>
    <div className="kpis">
      <Kpi label="Gross exposure" sub={int(s.n_lines || 0) + ' lines · shown in ' + ccy()}><CountUp value={s.nav || 0} format={cr} /></Kpi>
      <Kpi label="VaR 99% · 1-day" sub={pc(u) + ' of exposure'} tone={tone} d={.05}><CountUp value={m.parametric?.var || 0} format={cr} /></Kpi>
      <Kpi label="Expected shortfall 99%" sub="Parametric · EWMA λ=0.94" d={.1}><CountUp value={m.parametric?.es || 0} format={cr} /></Kpi>
      <Kpi label="Limit utilisation" sub="of critical limit" tone={tone} d={.15}><CountUp value={s.limits?.crit ? u / s.limits.crit * 100 : 0} format={v => v.toFixed(0) + '%'} /></Kpi>
      <Kpi label="Open alerts" sub={(s.alerts || []).filter(a => a.severity === 'critical').length + ' critical'} tone={(s.alerts || []).some(a => a.severity === 'critical') ? 'crit' : (s.alerts || []).length ? 'warn' : ''} d={.2}><CountUp value={(s.alerts || []).length} format={int} /></Kpi>
    </div>

    <div className="grid-2-1">
      <Card title="1-day 99% VaR — last 120 trading days" d={.1} pad={false}>
        <div className="chartbox"><ResponsiveContainer width="100%" height={280}>
          {s.var_series && s.var_series.length > 0 ? (
            <AreaChart data={s.var_series}>
              <defs><linearGradient id="varFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#22d3ee" stopOpacity={.4} /><stop offset="100%" stopColor="#22d3ee" stopOpacity={0} />
              </linearGradient></defs>
              <CartesianGrid stroke="rgba(120,160,200,.08)" vertical={false} />
              <XAxis dataKey="date" tick={{ fill: '#8598b3', fontSize: 11 }} minTickGap={45} axisLine={false} tickLine={false} />
              <YAxis tickFormatter={ax} tick={{ fill: '#8598b3', fontSize: 11 }} axisLine={false} tickLine={false} width={64} />
              <Tooltip {...tip} formatter={x => cr(x)} />
              {s.limits?.warn && s.nav && <ReferenceLine y={s.limits.warn * s.nav} stroke="#fbbf24" strokeDasharray="4 3" label={{ value: 'warning', fontSize: 11, fill: '#fbbf24' }} />}
              {s.limits?.crit && s.nav && <ReferenceLine y={s.limits.crit * s.nav} stroke="#f87171" strokeDasharray="4 3" label={{ value: 'critical', fontSize: 11, fill: '#f87171' }} />}
              <Area type="monotone" dataKey="var" stroke="#22d3ee" strokeWidth={2} fill="url(#varFill)" dot={false} />
            </AreaChart>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#8598b3' }}>
              Loading chart data...
            </div>
          )}
        </ResponsiveContainer></div>
      </Card>
      <div className="stack">
        <Card title="Method comparison · 1-day 99%" d={.15}>
          <table className="mini"><thead><tr><th>Method</th><th className="n">VaR</th><th className="n">ES</th></tr></thead><tbody>
            {Object.entries(m).map(([k, x]) => <tr key={k}><td>{k.replace('_', ' ')}</td><td className="n">{cr(x?.var || 0)}</td><td className="n">{cr(x?.es || 0)}</td></tr>)}
          </tbody></table>
        </Card>
        <Card title="Backtest · 250 days" d={.2}>
          <div className="btrow"><Tag tone={bt.zone}>{bt.zone}</Tag><div><b>{bt.breaches} breaches</b> <small>(expected ≈ 2.5)</small><br /><small>Kupiec p-value {bt.kupiec_p?.toFixed(3) || 'N/A'}</small></div></div>
        </Card>
      </div>
    </div>

    <Card title="Risk skyline — each tower is a position's share of 99% VaR" d={.15} pad={false}>
      <ErrorBoundary><Suspense fallback={<div className="scene3d"><div className="scene3d-tip">Loading 3D view…</div></div>}>
        <RiskField3D data={s.attribution?.position || []} /></Suspense></ErrorBoundary>
    </Card>

    <Card title={`Positions & risk contribution · ${int(s.n_lines)} lines, ${int((s.positions || []).length)} instruments`} d={.2}>
      <DataTable columns={POS_COLS} rows={s.positions || []} size={20} search={r => r.symbol + ' ' + r.name + ' ' + r.sector} />
    </Card>
  </>
}
