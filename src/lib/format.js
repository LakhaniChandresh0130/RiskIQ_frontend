// Display formatting. All values arrive as raw INR; `setCcy` switches the currency
// every formatter shows. INR keeps the Indian crore convention, other currencies
// convert and use compact notation ($12.40M, €8.20M …).
let DISP = { ccy: 'INR', rate: 1 }
export const setCcy = (ccy, rate = 1) => { DISP = { ccy, rate } }
export const ccy = () => DISP.ccy

const inrCr = v => (v < 0 ? '-' : '') + '₹' + (Math.abs(v) / 1e7).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' cr'
const compact = (v, fd) => new Intl.NumberFormat('en', { style: 'currency', currency: DISP.ccy, notation: 'compact', maximumFractionDigits: fd }).format(v * DISP.rate)

// Full money value (KPIs, table cells)
export const cr = v => DISP.ccy === 'INR' ? inrCr(v) : compact(v, 2)
// Short axis value (chart ticks)
export const ax = v => DISP.ccy === 'INR' ? (v / 1e7).toFixed(1) + ' cr' : compact(v, 0)

export const pc = v => (v * 100).toFixed(2) + '%'
export const int = v => Math.round(v).toLocaleString('en-IN')
