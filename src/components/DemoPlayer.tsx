import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { CheckCheck, CheckCircle2, FileText, Maximize2, Pause, Play, RotateCcw, X } from 'lucide-react'

/**
 * A code-driven "product video": five scenes rendered on a fixed 800×450 stage and scaled to fit.
 * Everything is a pure function of the playhead, so it can pause, seek and loop like a real video.
 */

const W = 800
const H = 450
const SCENE = 4.6 // seconds per scene
const SCENES = [
  { title: 'Create a GST invoice in seconds', url: 'sales/new' },
  { title: 'GST calculated to the paisa', url: 'sales/new' },
  { title: 'Share on WhatsApp with a UPI link', url: 'invoice/INV-0142' },
  { title: 'Get paid — status updates instantly', url: 'sales' },
  { title: 'Watch your business grow', url: 'dashboard' },
]
const TOTAL = SCENE * SCENES.length

const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v))
const seg = (p: number, a: number, b: number) => clamp((p - a) / (b - a))
const ease = (x: number) => 1 - Math.pow(1 - x, 3)
const pop = (x: number) => (x <= 0 ? 0 : x >= 1 ? 1 : 1 + 2.2 * Math.pow(x - 1, 3) + 1.2 * Math.pow(x - 1, 2))
const inr = (n: number) => '₹' + new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 }).format(Math.round(n))
const typed = (s: string, p: number) => s.slice(0, Math.floor(s.length * clamp(p)))
const inStyle = (p: number, dy = 14): CSSProperties => ({ opacity: ease(p), transform: `translateY(${(1 - ease(p)) * dy}px)` })

function Cursor({ path, p }: { path: [number, number, number, boolean?][]; p: number }) {
  let i = 0
  while (i < path.length - 1 && p > path[i + 1][0]) i++
  const a = path[i]
  const b = path[Math.min(i + 1, path.length - 1)]
  const k = b[0] === a[0] ? 1 : ease(seg(p, a[0], b[0]))
  const x = a[1] + (b[1] - a[1]) * k
  const y = a[2] + (b[2] - a[2]) * k
  const clicking = path.some(([t, , , c]) => c && p >= t && p < t + 0.06)
  return (
    <div className="pointer-events-none absolute z-30" style={{ left: x, top: y, transition: 'none' }}>
      {clicking && <span className="absolute -left-3 -top-3 h-6 w-6 animate-ping rounded-full bg-brand-400/60" />}
      <svg width="20" height="20" viewBox="0 0 24 24" style={{ transform: `scale(${clicking ? 0.85 : 1})`, filter: 'drop-shadow(0 2px 3px rgba(0,0,0,.35))' }}>
        <path d="M4 2l15 9-6.5 1.5L9.5 19z" fill="#fff" stroke="#062c60" strokeWidth="1.6" strokeLinejoin="round" />
      </svg>
    </div>
  )
}

function Chrome({ scene, children }: { scene: number; children: ReactNode }) {
  const nav = ['Dashboard', 'Sales', 'Purchases', 'Parties', 'Items', 'Reports']
  const active = scene === 4 ? 0 : 1
  return (
    <div className="absolute inset-0 flex flex-col bg-slate-50">
      <div className="flex h-7 shrink-0 items-center gap-1.5 border-b border-slate-200 bg-white px-3">
        <span className="h-2 w-2 rounded-full bg-rose-400" /><span className="h-2 w-2 rounded-full bg-amber-400" /><span className="h-2 w-2 rounded-full bg-emerald-400" />
        <span className="ml-3 rounded bg-slate-100 px-2.5 py-0.5 text-[9px] text-slate-500">app.taraju.in/{SCENES[scene].url}</span>
      </div>
      <div className="flex min-h-0 flex-1">
        <div className="w-[128px] shrink-0 bg-brand-950 px-2.5 py-3">
          <img src="/brand/wordmark-light.png" alt="" className="mb-4 ml-1 h-5 w-auto" />
          {nav.map((n, i) => (
            <div key={n} className={`mb-1 rounded-md px-2 py-1.5 text-[10px] font-medium ${i === active ? 'bg-white/10 text-white' : 'text-slate-400'}`}>{n}</div>
          ))}
        </div>
        <div className="relative min-w-0 flex-1 overflow-hidden">{children}</div>
      </div>
    </div>
  )
}

const ITEMS = [
  { n: 'Basmati Rice Premium 5kg', q: 10, r: 640 },
  { n: 'Sunflower Oil 1L', q: 24, r: 165 },
]

function SceneInvoice({ p }: { p: number }) {
  const name = typed('Sharma General Store', seg(p, 0.1, 0.36))
  const picked = p > 0.4
  const rows = ITEMS.map((it, i) => ({ ...it, s: seg(p, 0.48 + i * 0.14, 0.6 + i * 0.14) }))
  const total = rows.reduce((a, r) => a + r.q * r.r * ease(r.s), 0)
  return (
    <div className="p-5">
      <div className="text-[15px] font-extrabold text-ink" style={{ fontFamily: 'Outfit' }}>New Tax Invoice</div>
      <div className="mt-0.5 text-[9px] text-slate-500">{picked ? 'Intra-state supply · CGST + SGST' : 'Pick a party to calculate GST'}</div>
      <div className="mt-3 grid grid-cols-[1.6fr_1fr_1fr] gap-2.5 rounded-xl border border-slate-200 bg-white p-3">
        <div>
          <div className="mb-1 text-[8px] font-bold uppercase tracking-wide text-slate-400">Bill to</div>
          <div className={`flex h-7 items-center rounded-lg border px-2 text-[10px] ${p > 0.08 && !picked ? 'border-brand-500 ring-2 ring-brand-500/15' : 'border-slate-200'}`}>
            {name || <span className="text-slate-300">Search customer…</span>}
            {!picked && p > 0.08 && <span className="ml-px h-3 w-px animate-pulse bg-ink" />}
          </div>
          {picked && <div className="mt-1 rounded bg-slate-50 px-1.5 py-1 font-mono text-[8px] text-slate-600" style={inStyle(seg(p, 0.4, 0.47), 6)}>07AAKCS1234F1Z5 · Delhi</div>}
        </div>
        <div><div className="mb-1 text-[8px] font-bold uppercase tracking-wide text-slate-400">Invoice no.</div><div className="flex h-7 items-center rounded-lg border border-slate-200 px-2 font-mono text-[10px]">INV-0142</div></div>
        <div><div className="mb-1 text-[8px] font-bold uppercase tracking-wide text-slate-400">Date</div><div className="flex h-7 items-center rounded-lg border border-slate-200 px-2 text-[10px]">24 Sep 2026</div></div>
      </div>
      <div className="mt-2.5 overflow-hidden rounded-xl border border-slate-200 bg-white">
        <div className="grid grid-cols-[2fr_.6fr_.8fr_.6fr_1fr] bg-slate-50 px-3 py-1.5 text-[8px] font-bold uppercase tracking-wide text-slate-400"><span>Item</span><span>Qty</span><span>Rate</span><span>GST</span><span className="text-right">Amount</span></div>
        {rows.map((r) => r.s > 0 && (
          <div key={r.n} className="grid grid-cols-[2fr_.6fr_.8fr_.6fr_1fr] border-t border-slate-100 px-3 py-2 text-[10px]" style={inStyle(r.s, 10)}>
            <span className="font-semibold">{r.n}</span><span>{r.q}</span><span>₹{r.r}</span><span>5%</span><span className="text-right font-mono font-semibold">{inr(r.q * r.r * 1.05 * ease(r.s))}</span>
          </div>
        ))}
        <div className="border-t border-slate-100 px-3 py-2 text-[10px] font-semibold text-brand-600">+ Add line</div>
      </div>
      <div className="absolute bottom-5 right-5 rounded-xl bg-gradient-to-br from-brand-700 to-brand-900 px-4 py-2.5 text-white shadow-lg" style={inStyle(seg(p, 0.5, 0.62))}>
        <div className="text-[8px] text-slate-300">Grand total</div>
        <div className="font-mono text-lg font-bold">{inr(total * 1.05)}</div>
      </div>
      <Cursor p={p} path={[[0, 520, 300], [0.08, 90, 92, true], [0.38, 110, 124], [0.42, 110, 124, true], [0.5, 160, 190], [0.62, 160, 222], [0.85, 560, 360], [1, 560, 360]]} />
    </div>
  )
}

function SceneGST({ p }: { p: number }) {
  const lines = [['Taxable value', 10360], ['CGST @ 2.5%', 259], ['SGST @ 2.5%', 259]] as const
  const total = 10878 * ease(seg(p, 0.45, 0.72))
  const saved = p > 0.8
  return (
    <div className="flex h-full items-center justify-center gap-6 p-6">
      <div className="w-[300px] rounded-2xl border border-slate-200 bg-white p-4 shadow-xl" style={{ transform: `scale(${0.94 + 0.06 * ease(seg(p, 0, 0.2))})`, opacity: ease(seg(p, 0, 0.15)) }}>
        <div className="mb-3 text-[12px] font-bold">Summary</div>
        {lines.map(([l, v], i) => {
          const s = seg(p, 0.1 + i * 0.1, 0.22 + i * 0.1)
          const hot = p > 0.1 + i * 0.1 && p < 0.34 + i * 0.1
          return (
            <div key={l} className={`mb-1 flex justify-between rounded-lg px-2 py-1.5 text-[11px] transition-colors ${hot ? 'bg-brand-50' : ''}`} style={inStyle(s, 8)}>
              <span className="text-slate-600">{l}</span><span className="font-mono font-semibold">{inr(v * ease(s))}.00</span>
            </div>
          )
        })}
        <div className="mt-2 rounded-xl bg-gradient-to-br from-brand-700 to-brand-900 p-3 text-white">
          <div className="text-[9px] text-slate-300">Grand total</div>
          <div className="font-mono text-2xl font-bold">{inr(total)}.00</div>
          <div className="mt-0.5 h-3 text-[8.5px] text-brand-200">{typed('Ten Thousand Eight Hundred Seventy Eight Rupees Only', seg(p, 0.6, 0.85))}</div>
        </div>
        <div className="mt-3 flex h-8 items-center justify-center rounded-lg bg-brand-700 text-[11px] font-bold text-white" style={{ transform: `scale(${p > 0.76 && p < 0.8 ? 0.95 : 1})` }}>Save Invoice</div>
      </div>
      <div className="w-[200px] space-y-2">
        {['Auto CGST / SGST / IGST', 'HSN-wise tax breakup', 'Amount in words'].map((t, i) => (
          <div key={t} className="flex items-center gap-2 rounded-xl bg-white px-3 py-2 text-[10px] font-semibold shadow-sm ring-1 ring-slate-200" style={inStyle(seg(p, 0.2 + i * 0.12, 0.34 + i * 0.12), 10)}>
            <CheckCircle2 size={14} className="text-brand-500" />{t}
          </div>
        ))}
      </div>
      {saved && (
        <div className="absolute bottom-5 left-1/2 flex -translate-x-1/2 items-center gap-2 rounded-xl bg-ink px-3.5 py-2 text-[10px] font-semibold text-white shadow-xl" style={inStyle(seg(p, 0.8, 0.88))}>
          <CheckCircle2 size={14} className="text-emerald-400" /> Invoice INV-0142 saved
        </div>
      )}
      <Cursor p={p} path={[[0, 600, 380], [0.3, 470, 330], [0.76, 330, 356, true], [1, 340, 380]]} />
    </div>
  )
}

function SceneShare({ p }: { p: number }) {
  const bubble = seg(p, 0.25, 0.4)
  const read = p > 0.68
  return (
    <div className="flex h-full items-center justify-center gap-8 bg-gradient-to-br from-slate-50 to-brand-50/60 p-6">
      <div className="max-w-[210px]" style={inStyle(seg(p, 0, 0.2))}>
        <div className="text-[18px] font-extrabold leading-tight text-ink" style={{ fontFamily: 'Outfit' }}>One tap to share.<br /><span className="text-brand-500">One tap to pay.</span></div>
        <p className="mt-2 text-[10px] leading-relaxed text-slate-600">Send the PDF invoice with a UPI pay link straight to your customer’s WhatsApp.</p>
      </div>
      <div className="relative h-[330px] w-[180px] overflow-hidden rounded-[26px] border-[5px] border-ink bg-[#efeae2] shadow-2xl" style={{ transform: `translateY(${(1 - ease(seg(p, 0, 0.22))) * 40}px)`, opacity: ease(seg(p, 0, 0.15)) }}>
        <div className="flex items-center gap-2 bg-[#075e54] px-2.5 py-2 text-white">
          <div className="grid h-6 w-6 place-items-center rounded-full bg-amber-400 text-[9px] font-bold text-ink">SG</div>
          <div><div className="text-[9px] font-semibold">Sharma General Store</div><div className="text-[7px] opacity-80">online</div></div>
        </div>
        <div className="space-y-2 p-2">
          <div className="ml-auto w-[140px] rounded-lg rounded-tr-none bg-[#d9fdd3] p-1.5 shadow-sm" style={{ ...inStyle(bubble, 16), transformOrigin: 'right top' }}>
            <div className="flex items-center gap-1.5 rounded-md bg-white/70 p-1.5">
              <div className="grid h-7 w-6 place-items-center rounded bg-rose-500 text-white"><FileText size={12} /></div>
              <div className="min-w-0"><div className="truncate text-[8px] font-bold">INV-0142.pdf</div><div className="text-[7px] text-slate-500">1 page · 84 KB</div></div>
            </div>
            <div className="mt-1 text-[8px] leading-snug text-slate-700">Invoice INV-0142 for <b>₹10,878</b> from Kartik Enterprises.</div>
            <div className="mt-1 rounded-md bg-brand-500 py-1 text-center text-[8px] font-bold text-white" style={{ transform: `scale(${pop(seg(p, 0.45, 0.6))})` }}>Pay ₹10,878 via UPI</div>
            <div className="mt-0.5 flex items-center justify-end gap-0.5 text-[6.5px] text-slate-500">10:42 <CheckCheck size={10} className={read ? 'text-sky-500' : 'text-slate-400'} /></div>
          </div>
          {p > 0.78 && (
            <div className="w-[110px] rounded-lg rounded-tl-none bg-white p-1.5 text-[8px] shadow-sm" style={inStyle(seg(p, 0.78, 0.9), 10)}>Paid ✅ Thank you!</div>
          )}
        </div>
      </div>
    </div>
  )
}

function SceneInvoices({ p }: { p: number }) {
  const paid = p > 0.5
  const burst = seg(p, 0.5, 0.85)
  const rows = [
    ['INV-0142', 'Sharma General Store', 10878],
    ['INV-0141', 'Gupta Traders', 8215],
    ['INV-0140', 'Anand Supermart', 19677],
    ['INV-0139', 'Walk-in Customer', 941],
  ] as const
  return (
    <div className="p-5">
      <div className="text-[15px] font-extrabold" style={{ fontFamily: 'Outfit' }}>Sales & Invoices</div>
      <div className="mt-3 grid grid-cols-3 gap-2">
        {[['Total', 39711], ['Received', paid ? 21819 : 10941], ['Balance due', paid ? 17892 : 28770]].map(([l, v], i) => (
          <div key={l as string} className="rounded-xl border border-slate-200 bg-white px-3 py-2">
            <div className="text-[8px] text-slate-500">{l}</div>
            <div className={`font-mono text-[13px] font-bold transition-colors duration-500 ${i === 1 ? 'text-emerald-600' : i === 2 ? 'text-amber-600' : ''}`}>{inr(v as number)}</div>
          </div>
        ))}
      </div>
      <div className="mt-2.5 overflow-hidden rounded-xl border border-slate-200 bg-white">
        {rows.map(([n, party, amt], i) => {
          const first = i === 0
          return (
            <div key={n} className={`relative flex items-center gap-3 border-b border-slate-100 px-3 py-2.5 text-[10px] last:border-0 ${first && paid ? 'bg-emerald-50/70' : ''}`} style={{ transition: 'background .5s' }}>
              <span className="font-mono font-semibold text-brand-700">{n}</span>
              <span className="flex-1 font-medium">{party}</span>
              <span className="font-mono font-semibold">{inr(amt)}</span>
              <span className={`relative w-14 rounded-full px-2 py-0.5 text-center text-[8px] font-bold ${first ? (paid ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500') : i === 2 ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'}`}
                style={first && paid ? { transform: `scale(${pop(seg(p, 0.5, 0.62))})` } : undefined}>
                {first ? (paid ? 'Paid' : 'Unpaid') : i === 2 ? 'Partial' : 'Paid'}
                {first && burst > 0 && burst < 1 && Array.from({ length: 10 }).map((_, k) => {
                  const ang = (k / 10) * Math.PI * 2
                  const d = 26 * ease(burst)
                  return <span key={k} className="absolute left-1/2 top-1/2 h-1.5 w-1.5 rounded-full" style={{ background: ['#0ea673', '#fbbf24', '#062c60', '#34d399'][k % 4], opacity: 1 - burst, transform: `translate(${Math.cos(ang) * d - 3}px, ${Math.sin(ang) * d - 3}px)` }} />
                })}
              </span>
            </div>
          )
        })}
      </div>
      <div className="absolute bottom-5 right-5 flex w-[220px] items-center gap-2.5 rounded-xl border border-slate-100 bg-white p-2.5 shadow-2xl"
        style={{ opacity: ease(seg(p, 0.28, 0.4)), transform: `translateY(${(1 - ease(seg(p, 0.28, 0.4))) * 30}px)` }}>
        <div className="grid h-8 w-8 place-items-center rounded-lg bg-emerald-50 text-emerald-600"><CheckCircle2 size={16} /></div>
        <div><div className="text-[9px] font-semibold text-emerald-700">Payment received</div><div className="font-mono text-[12px] font-bold">₹10,878.00</div><div className="text-[8px] text-slate-500">via UPI · Sharma General Store</div></div>
      </div>
    </div>
  )
}

function SceneGrow({ p }: { p: number }) {
  const bars = [34, 46, 40, 58, 52, 70, 64, 82, 74, 88, 96, 100]
  const endCard = seg(p, 0.72, 0.86)
  return (
    <div className="h-full p-5">
      <div className="rounded-2xl bg-gradient-to-br from-brand-700 via-brand-800 to-brand-950 p-4 text-white" style={inStyle(seg(p, 0, 0.15))}>
        <div className="text-[9px] text-slate-300">Good evening, Kartik 👋</div>
        <div className="flex items-end gap-2">
          <div className="font-mono text-[22px] font-bold">{inr(482190 * ease(seg(p, 0.05, 0.5)))}</div>
          <div className="mb-1 text-[10px] font-bold text-brand-300">▲ {Math.round(24 * ease(seg(p, 0.1, 0.5)))}%</div>
        </div>
      </div>
      <div className="mt-3 grid grid-cols-[2fr_1fr] gap-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-3">
          <div className="mb-2 text-[10px] font-bold">Sales this year</div>
          <div className="relative flex h-[150px] items-end gap-1.5">
            <div className="absolute -top-1 right-0 flex items-center gap-1 rounded-full bg-brand-50 px-2 py-0.5 text-[9px] font-bold text-brand-600" style={{ transform: `scale(${pop(seg(p, 0.45, 0.6))})` }}>▲ Growing 24%</div>
            {bars.map((h, i) => (
              <div key={i} className="flex-1 rounded-t-md bg-gradient-to-t from-brand-600 to-brand-300" style={{ height: `${h * ease(seg(p, 0.08 + i * 0.03, 0.3 + i * 0.03))}%` }} />
            ))}
          </div>
        </div>
        <div className="space-y-2">
          {[['To collect', 68400, 'text-amber-600'], ['Profit', 112000, 'text-emerald-600'], ['GST payable', 18240, 'text-brand-700']].map(([l, v, c], i) => (
            <div key={l as string} className="rounded-xl border border-slate-200 bg-white px-3 py-2" style={inStyle(seg(p, 0.15 + i * 0.1, 0.3 + i * 0.1), 10)}>
              <div className="text-[8px] text-slate-500">{l}</div>
              <div className={`font-mono text-[13px] font-bold ${c}`}>{inr((v as number) * ease(seg(p, 0.2 + i * 0.1, 0.55)))}</div>
            </div>
          ))}
        </div>
      </div>
      {endCard > 0 && (
        <div className="absolute inset-0 grid place-items-center bg-white/85 backdrop-blur-sm" style={{ opacity: endCard }}>
          <div className="text-center" style={{ transform: `scale(${0.9 + 0.1 * ease(endCard)})` }}>
            <img src="/brand/wordmark.png" alt="Taraju" className="mx-auto h-14 w-auto" />
            <div className="mt-2 text-[11px] font-medium tracking-[0.2em] text-brand-800" style={{ fontFamily: 'Outfit' }}>GST <span className="text-brand-500">|</span> BILLING <span className="text-brand-500">|</span> ACCOUNTING</div>
            <div className="mt-4 inline-flex rounded-xl bg-brand-500 px-4 py-2 text-[11px] font-bold text-white shadow-lg">Start free today →</div>
          </div>
        </div>
      )}
    </div>
  )
}

const RENDER = [SceneInvoice, SceneGST, SceneShare, SceneInvoices, SceneGrow]

export function DemoPlayer({ autoPlay = true, className = '', onExpand, startAt = 0 }: { autoPlay?: boolean; className?: string; onExpand?: () => void; startAt?: number }) {
  const [t, setT] = useState(() => clamp(startAt, 0, TOTAL - 0.01))
  const [playing, setPlaying] = useState(autoPlay)
  const [scale, setScale] = useState(1)
  const [visible, setVisible] = useState(true)
  const box = useRef<HTMLDivElement>(null)
  const last = useRef<number | null>(null)

  useLayoutEffect(() => {
    const el = box.current
    if (!el) return
    const ro = new ResizeObserver(([e]) => setScale(e.contentRect.width / W))
    ro.observe(el)
    const io = new IntersectionObserver(([e]) => setVisible(e.isIntersecting))
    io.observe(el)
    return () => { ro.disconnect(); io.disconnect() }
  }, [])

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) { setPlaying(false); setT(SCENE * 4 + SCENE * 0.9) }
  }, [])

  useEffect(() => {
    if (!playing || !visible) { last.current = null; return }
    let raf = 0
    const tick = (now: number) => {
      if (last.current !== null) setT((x) => (x + (now - last.current!) / 1000) % TOTAL)
      last.current = now
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [playing, visible])

  const scene = Math.min(SCENES.length - 1, Math.floor(t / SCENE))
  const p = (t - scene * SCENE) / SCENE
  const Scene = RENDER[scene]
  const fade = Math.min(seg(p, 0, 0.06), 1 - seg(p, 0.95, 1))

  return (
    <div className={`group relative overflow-hidden rounded-2xl bg-ink shadow-2xl shadow-brand-950/30 ring-1 ring-black/5 ${className}`}>
      <div ref={box} className="relative w-full" style={{ aspectRatio: `${W} / ${H}` }}>
        <div className="absolute left-0 top-0 origin-top-left" style={{ width: W, height: H, transform: `scale(${scale})` }}>
          <Chrome scene={scene}>
            <div className="absolute inset-0" style={{ opacity: fade }}><Scene p={p} /></div>
          </Chrome>
        </div>

        <div className="absolute bottom-3 left-3 flex items-center gap-1.5 rounded-full bg-ink/75 px-2.5 py-1 text-[10px] font-semibold text-white backdrop-blur sm:bottom-4 sm:left-4">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-rose-500" /> Product tour
        </div>
        {onExpand && (
          <button onClick={onExpand} className="absolute bottom-3 right-3 flex items-center gap-1.5 rounded-full bg-white/90 px-2.5 py-1 text-[10px] font-bold text-ink opacity-0 shadow-md backdrop-blur transition group-hover:opacity-100 sm:bottom-4 sm:right-4 cursor-pointer">
            <Maximize2 size={12} /> Watch full screen
          </button>
        )}
        {!playing && (
          <button onClick={() => setPlaying(true)} className="absolute inset-0 grid place-items-center bg-ink/20 cursor-pointer" aria-label="Play">
            <span className="grid h-16 w-16 place-items-center rounded-full bg-white text-brand-700 shadow-2xl transition hover:scale-110"><Play size={26} fill="currentColor" className="ml-1" /></span>
          </button>
        )}
      </div>

      {/* Player bar: caption + scene progress + controls */}
      <div className="flex items-center gap-2.5 px-3 py-2.5 sm:gap-3 sm:px-4">
        <button onClick={() => setPlaying((v) => !v)} className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-brand-500 text-white transition hover:bg-brand-400 cursor-pointer" aria-label={playing ? 'Pause' : 'Play'}>
          {playing ? <Pause size={14} fill="currentColor" /> : <Play size={14} fill="currentColor" className="ml-0.5" />}
        </button>
        <div className="min-w-0 flex-1">
          <div key={scene} className="animate-word flex items-center gap-1.5 truncate text-[12px] font-semibold text-white sm:text-sm" style={{ fontFamily: 'Outfit' }}>
            <span className="text-brand-400">{scene + 1}/{SCENES.length}</span> {SCENES[scene].title}
          </div>
          <div className="mt-1.5 flex gap-1">
            {SCENES.map((sc, i) => (
              <button key={sc.title} onClick={() => setT(i * SCENE + 0.01)} className="h-1 flex-1 overflow-hidden rounded-full bg-white/20 transition hover:bg-white/35 cursor-pointer" aria-label={`Scene ${i + 1}: ${sc.title}`}>
                <span className="block h-full rounded-full bg-brand-400" style={{ width: `${i < scene ? 100 : i === scene ? p * 100 : 0}%` }} />
              </button>
            ))}
          </div>
        </div>
        <span className="hidden shrink-0 font-mono text-[10px] text-white/60 sm:block">0:{String(Math.floor(t)).padStart(2, '0')} / 0:{Math.round(TOTAL)}</span>
        <button onClick={() => setT(0)} className="hidden h-8 w-8 shrink-0 place-items-center rounded-full text-white/70 transition hover:bg-white/10 hover:text-white sm:grid cursor-pointer" aria-label="Restart"><RotateCcw size={14} /></button>
      </div>
    </div>
  )
}

export function DemoModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  useEffect(() => {
    if (!open) return
    const h = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', h)
    document.body.style.overflow = 'hidden'
    return () => { window.removeEventListener('keydown', h); document.body.style.overflow = '' }
  }, [open, onClose])
  if (!open) return null
  return createPortal(
    <div className="fixed inset-0 z-[80] grid place-items-center bg-ink/80 p-3 backdrop-blur-md sm:p-8" onMouseDown={onClose}>
      <div className="animate-rise w-full max-w-5xl" onMouseDown={(e) => e.stopPropagation()}>
        <div className="mb-3 flex items-center justify-between text-white">
          <div className="text-sm font-semibold sm:text-base" style={{ fontFamily: 'Outfit' }}>Taraju in 23 seconds</div>
          <button onClick={onClose} className="grid h-9 w-9 place-items-center rounded-full bg-white/10 transition hover:bg-white/20 cursor-pointer" aria-label="Close"><X size={18} /></button>
        </div>
        <DemoPlayer autoPlay className="rounded-2xl sm:rounded-3xl" />
      </div>
    </div>,
    document.body,
  )
}
