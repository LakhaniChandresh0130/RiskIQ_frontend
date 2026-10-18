// Dense ERP-style table: column sorting, optional search box, pagination.
// columns: [{ key, label, n (right-align numbers), render(row), sort:false }]
import { useMemo, useState } from 'react'

export default function DataTable({ columns, rows, size = 15, search }) {
  const [q, setQ] = useState(''), [pg, setPg] = useState(0), [sort, setSort] = useState(null)
  const filtered = useMemo(() => {
    let out = rows || []
    if (q && search) { const t = q.toLowerCase(); out = out.filter(r => search(r).toLowerCase().includes(t)) }
    if (sort) out = [...out].sort((a, b) => {
      const x = a[sort.key], y = b[sort.key]
      return (typeof x === 'number' && typeof y === 'number' ? x - y : String(x).localeCompare(String(y))) * sort.dir
    })
    return out
  }, [rows, q, sort, search])
  const pages = Math.max(1, Math.ceil(filtered.length / size)), cur = filtered.slice(pg * size, pg * size + size)
  const click = c => setSort(s => s?.key === c.key ? (s.dir === (c.n ? -1 : 1) ? { key: c.key, dir: -s.dir } : null) : { key: c.key, dir: c.n ? -1 : 1 })
  const arrow = c => sort?.key === c.key ? (sort.dir === 1 ? '▲' : '▼') : ''
  return <>
    {search && <input className="search" placeholder="Search…" value={q} onChange={e => { setQ(e.target.value); setPg(0) }} />}
    <div className="tbl"><table><thead><tr>
      {columns.map(c => <th key={c.key} className={(c.n ? 'n ' : '') + (c.sort === false ? '' : 'sortable')} onClick={() => c.sort !== false && click(c)}>{c.label}<span className="sarrow">{arrow(c)}</span></th>)}
    </tr></thead><tbody>
      {cur.map((r, i) => <tr key={r.key ?? i}>{columns.map(c => <td key={c.key} className={c.n ? 'n' : ''} data-label={c.label}>{c.render ? c.render(r) : r[c.key]}</td>)}</tr>)}
      {!cur.length && <tr><td colSpan={columns.length} className="empty">Nothing matches.</td></tr>}
    </tbody></table></div>
    <div className="pager"><button className="btn ghost" disabled={pg === 0} onClick={() => setPg(pg - 1)}>‹ Prev</button>
      <span>{filtered.length.toLocaleString('en-IN')} rows · page {pg + 1} of {pages}</span>
      <button className="btn ghost" disabled={pg >= pages - 1} onClick={() => setPg(pg + 1)}>Next ›</button></div>
  </>
}
