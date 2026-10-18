// Small shared UI primitives: animated Card, KPI tile, Tag. `d` = entry animation delay (s).
import { motion } from 'framer-motion'

export function Card({ title, right, children, className = '', pad = true, d = 0 }) {
  return <motion.section className={'card ' + className}
    initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
    transition={{ duration: .45, delay: d, ease: [0.22, 1, 0.36, 1] }}>
    {(title || right) && <header className="card-h"><h3>{title}</h3><div className="card-h-r">{right}</div></header>}
    <div className={pad ? 'card-b' : 'card-b0'}>{children}</div>
  </motion.section>
}

export function Kpi({ label, children, sub, tone = '', d = 0 }) {
  return <motion.div className={'kpi ' + tone}
    initial={{ opacity: 0, y: 14, scale: .97 }} animate={{ opacity: 1, y: 0, scale: 1 }}
    whileHover={{ y: -4, transition: { duration: .18 } }}
    transition={{ duration: .4, delay: d, ease: [0.22, 1, 0.36, 1] }}>
    <small>{label}</small><div className="kpi-v">{children}</div><small className="kpi-s">{sub}</small>
  </motion.div>
}

export const Tag = ({ tone, children }) => <span className={'tag ' + tone}>{children}</span>
