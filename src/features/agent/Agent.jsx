// AI risk analyst chat. The backend agent calls risk tools for every number;
// the "How I got this" panel under each answer shows the exact tool calls it made.
import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Card, Tag } from '../../components/ui.jsx'
import { api } from '../../lib/api.js'

const SUGGESTED = [
  'Why did risk change today?', 'Which positions drive the most VaR?',
  'What happens in a 2008-style crash?', 'Summarise my open alerts',
  'Explain my sector concentration', 'How does the backtest look?',
]

const Steps = ({ steps }) => {
  const [open, setOpen] = useState(false)
  if (!steps?.length) return null
  return <div className="steps">
    <button className="steps-h" onClick={() => setOpen(o => !o)}>
      <span className={'chev' + (open ? ' open' : '')}>›</span> How I got this · {steps.length} tool call{steps.length > 1 ? 's' : ''}
    </button>
    <AnimatePresence>{open && <motion.div className="steps-b"
      initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}>
      {steps.map((st, i) => <div key={i} className="step">
        <code className={st.ok ? 'ok' : 'bad'}>{st.tool}</code>
        {Object.keys(st.args || {}).length > 0 && <small>{JSON.stringify(st.args)}</small>}
        {st.preview && <details><summary>result</summary><pre>{st.preview}</pre></details>}
      </div>)}
    </motion.div>}</AnimatePresence>
  </div>
}

const Typing = () => <motion.div className="msg a typing" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
  <span className="dot" /><span className="dot" /><span className="dot" />
</motion.div>

export default function Agent({ pid }) {
  const [msgs, setMsgs] = useState([{
    r: 'a', t: 'I am your risk analyst. Ask about exposure, VaR, drivers, stress scenarios or alerts — every number I report is computed by the risk engine, never guessed.',
  }])
  const [q, setQ] = useState(''), [busy, setBusy] = useState(false)
  const box = useRef(null)
  useEffect(() => { box.current?.scrollTo({ top: box.current.scrollHeight, behavior: 'smooth' }) }, [msgs, busy])

  const ask = async text => {
    if (!text.trim() || busy) return
    setQ(''); setBusy(true); setMsgs(m => [...m, { r: 'u', t: text }])
    try {
      const r = await api('/agent/chat', { message: text, portfolio: pid })
      setMsgs(m => [...m, { r: 'a', t: r.answer, mode: r.mode, steps: r.steps }])
    } catch { setMsgs(m => [...m, { r: 'a', t: 'The request failed — is the backend running on port 8000?' }]) }
    setBusy(false)
  }

  return <Card title="AI risk analyst" d={.05} className="agent" pad={false}
    right={<span className="mut sm">tools compute · the model only explains</span>}>
    <div className="chatwrap">
      <div className="chat" ref={box}>
        {msgs.map((m, i) => <motion.div key={i} className={'msg ' + m.r}
          initial={{ opacity: 0, y: 12, scale: .98 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ duration: .25 }}>
          {m.t}
          {m.mode && <div className="msg-meta"><Tag tone={m.mode === 'rule-based' ? 'warning' : 'ok'}>{m.mode}</Tag></div>}
          <Steps steps={m.steps} />
        </motion.div>)}
        <AnimatePresence>{busy && <Typing />}</AnimatePresence>
      </div>
      <div className="suggest">{SUGGESTED.map(p => <button key={p} className="chip" disabled={busy} onClick={() => ask(p)}>{p}</button>)}</div>
      <form className="chatform" onSubmit={e => { e.preventDefault(); ask(q) }}>
        <input value={q} onChange={e => setQ(e.target.value)} placeholder="Why did VaR rise today?" autoFocus />
        <button className="btn" disabled={busy || !q.trim()}>{busy ? 'Working…' : 'Ask'}</button>
      </form>
    </div>
  </Card>
}
