import { createContext, useCallback, useContext, useEffect, useRef, useState, type ButtonHTMLAttributes, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { CheckCircle2, TrendingDown, TrendingUp, X, type LucideIcon } from 'lucide-react'

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'gold'
const variants: Record<Variant, string> = {
  primary: 'bg-brand-700 text-white hover:bg-brand-800 shadow-sm shadow-brand-900/20',
  secondary: 'bg-white text-ink border border-slate-200 hover:bg-slate-50',
  ghost: 'text-slate-600 hover:bg-slate-100 hover:text-ink',
  danger: 'bg-rose-600 text-white hover:bg-rose-700',
  gold: 'bg-brand-500 text-white hover:bg-brand-600 shadow-sm shadow-brand-900/20',
}

export function Button({
  variant = 'primary', icon: Icon, size = 'md', className = '', children, ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant; icon?: LucideIcon; size?: 'sm' | 'md' | 'lg' }) {
  const sz = size === 'sm' ? 'h-8 px-3 text-xs' : size === 'lg' ? 'h-12 px-6 text-base' : 'h-10 px-4 text-sm'
  return (
    <button
      {...rest}
      className={`inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition active:scale-[.98] disabled:opacity-50 disabled:pointer-events-none cursor-pointer ${sz} ${variants[variant]} ${className}`}
    >
      {Icon && <Icon size={size === 'sm' ? 14 : 16} strokeWidth={2.25} />}
      {children}
    </button>
  )
}

export function PageHeader({ title, subtitle, actions }: { title: string; subtitle?: string; actions?: ReactNode }) {
  return (
    <div className="mb-5 flex flex-wrap items-end justify-between gap-3 sm:mb-6 sm:gap-4">
      <div className="min-w-0">
        <h1 className="text-xl font-extrabold tracking-tight text-ink sm:text-2xl">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-slate-500">{subtitle}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  )
}

const tones = {
  green: 'bg-emerald-50 text-emerald-700 ring-emerald-600/15',
  amber: 'bg-amber-50 text-amber-700 ring-amber-600/20',
  red: 'bg-rose-50 text-rose-700 ring-rose-600/15',
  blue: 'bg-sky-50 text-sky-700 ring-sky-600/15',
  gray: 'bg-slate-100 text-slate-600 ring-slate-500/15',
  brand: 'bg-brand-50 text-brand-700 ring-brand-600/15',
}
export type Tone = keyof typeof tones
export function Badge({ tone = 'gray', children }: { tone?: Tone; children: ReactNode }) {
  return <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset ${tones[tone]}`}>{children}</span>
}
export const statusTone = (s: string): Tone =>
  s === 'Paid' ? 'green' : s === 'Partial' ? 'amber' : s === 'Overdue' ? 'red' : 'gray'

/** Smoothly counts from the previous value to `value` (from 0 on first mount). */
export function CountUp({ value, format = (n: number) => String(Math.round(n)), duration = 900 }: { value: number; format?: (n: number) => string; duration?: number }) {
  const [shown, setShown] = useState(0)
  const from = useRef(0)
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) { setShown(value); return }
    const start = performance.now()
    const a = from.current
    let raf = 0
    const tick = (now: number) => {
      const k = Math.min(1, (now - start) / duration)
      const v = a + (value - a) * (1 - Math.pow(1 - k, 3))
      setShown(v)
      from.current = v
      if (k < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [value, duration])
  return <>{format(shown)}</>
}

export function Sparkline({ data, color = '#0ea673', height = 36 }: { data: number[]; color?: string; height?: number }) {
  const w = 120
  const max = Math.max(...data, 1)
  const min = Math.min(...data, 0)
  const pts = data.map((v, i) => [(i / Math.max(1, data.length - 1)) * w, height - 3 - ((v - min) / (max - min || 1)) * (height - 6)])
  const line = pts.map((p, i) => `${i ? 'L' : 'M'}${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(' ')
  const id = `sp${color.replace('#', '')}`
  return (
    <svg viewBox={`0 0 ${w} ${height}`} preserveAspectRatio="none" className="h-9 w-full" aria-hidden>
      <defs><linearGradient id={id} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor={color} stopOpacity=".25" /><stop offset="1" stopColor={color} stopOpacity="0" /></linearGradient></defs>
      <path d={`${line} L${w},${height} L0,${height} Z`} fill={`url(#${id})`} className="spark-fill" />
      <path d={line} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" pathLength={1} className="spark-draw" />
    </svg>
  )
}

const statTones = {
  brand: { chip: 'bg-brand-50 text-brand-700', color: '#0ea673' },
  gold: { chip: 'bg-amber-50 text-amber-600', color: '#f59e0b' },
  rose: { chip: 'bg-rose-50 text-rose-600', color: '#e11d48' },
  sky: { chip: 'bg-sky-50 text-sky-600', color: '#0284c7' },
}

export function StatCard({ label, value, hint, icon: Icon, tone = 'brand', spark, trend }: {
  label: string; value: ReactNode; hint?: ReactNode; icon: LucideIcon; tone?: keyof typeof statTones; spark?: number[]; trend?: number | null
}) {
  const t = statTones[tone]
  return (
    <div className="card group relative overflow-hidden p-4 transition duration-300 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-slate-200/70 sm:p-5">
      <div className="pointer-events-none absolute -right-10 -top-10 h-28 w-28 rounded-full opacity-0 blur-2xl transition duration-500 group-hover:opacity-40" style={{ background: t.color }} />
      <div className="flex items-start justify-between gap-2">
        <div className="text-xs font-medium text-slate-500 sm:text-[13px]">{label}</div>
        <div className={`grid h-8 w-8 shrink-0 place-items-center rounded-xl sm:h-9 sm:w-9 ${t.chip}`}><Icon size={17} /></div>
      </div>
      <div className="num mt-2 truncate text-xl font-bold tracking-tight text-ink sm:mt-3 sm:text-2xl">{value}</div>
      <div className="mt-1 flex items-center gap-2 text-xs text-slate-500">
        {trend !== undefined && trend !== null && Number.isFinite(trend) && (
          <span className={`inline-flex items-center gap-0.5 rounded-md px-1.5 py-0.5 font-semibold ${trend >= 0 ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}>
            {trend >= 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}{Math.abs(trend).toFixed(0)}%
          </span>
        )}
        {hint && <span className="truncate">{hint}</span>}
      </div>
      {spark && <div className="-mx-1 mt-3"><Sparkline data={spark} color={t.color} /></div>}
    </div>
  )
}

export function Modal({ open, onClose, title, children, footer, wide }: {
  open: boolean; onClose: () => void; title: string; children: ReactNode; footer?: ReactNode; wide?: boolean
}) {
  useEffect(() => {
    if (!open) return
    const h = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  }, [open, onClose])
  if (!open) return null
  return createPortal(
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-ink/40 p-0 backdrop-blur-sm sm:items-center sm:p-4" onMouseDown={onClose}>
      <div
        className={`animate-rise flex max-h-[92vh] w-full flex-col rounded-t-3xl bg-white shadow-2xl sm:rounded-3xl ${wide ? 'sm:max-w-3xl' : 'sm:max-w-lg'}`}
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4 sm:px-6">
          <h3 className="text-lg font-bold">{title}</h3>
          <button onClick={onClose} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-ink cursor-pointer"><X size={18} /></button>
        </div>
        <div className="overflow-y-auto px-5 py-5 sm:px-6">{children}</div>
        {footer && <div className="flex justify-end gap-2 border-t border-slate-100 px-5 py-4 pb-[calc(1rem+env(safe-area-inset-bottom))] sm:px-6 sm:pb-4">{footer}</div>}
      </div>
    </div>,
    document.body,
  )
}

export function Field({ label, children, className = '' }: { label: string; children: ReactNode; className?: string }) {
  return <label className={`block ${className}`}><span className="label">{label}</span>{children}</label>
}

export function Empty({ icon: Icon, title, text, action }: { icon: LucideIcon; title: string; text: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
      <div className="mb-4 grid h-14 w-14 place-items-center rounded-2xl bg-brand-50 text-brand-600"><Icon size={26} /></div>
      <div className="font-bold">{title}</div>
      <p className="mt-1 max-w-sm text-sm text-slate-500">{text}</p>
      {action && <div className="mt-5">{action}</div>}
    </div>
  )
}

export function Tabs<T extends string>({ value, onChange, options }: { value: T; onChange: (v: T) => void; options: { value: T; label: string; count?: number }[] }) {
  return (
    <div className="inline-flex max-w-full overflow-x-auto rounded-xl bg-slate-100 p-1 [scrollbar-width:none]">
      {options.map((o) => (
        <button
          key={o.value}
          onClick={() => onChange(o.value)}
          className={`flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-lg px-3 py-1.5 text-sm font-semibold transition sm:px-3.5 cursor-pointer ${value === o.value ? 'bg-white text-ink shadow-sm' : 'text-slate-500 hover:text-ink'}`}
        >
          {o.label}
          {o.count !== undefined && <span className="rounded-md bg-slate-200/70 px-1.5 text-[11px]">{o.count}</span>}
        </button>
      ))}
    </div>
  )
}

export function SearchInput({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder: string }) {
  return (
    <div className="relative w-full md:w-72">
      <svg className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></svg>
      <input className="input pl-9" value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} />
    </div>
  )
}

type ToastItem = { id: number; message: string; tone: 'success' | 'error' }
const ToastCtx = createContext<(message: string, tone?: ToastItem['tone']) => void>(() => {})
export const useToast = () => useContext(ToastCtx)

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([])
  const push = useCallback((message: string, tone: ToastItem['tone'] = 'success') => {
    const id = Date.now() + Math.random()
    setItems((x) => [...x, { id, message, tone }])
    setTimeout(() => setItems((x) => x.filter((t) => t.id !== id)), 2800)
  }, [])
  return (
    <ToastCtx.Provider value={push}>
      {children}
      <div className="no-print pointer-events-none fixed inset-x-0 bottom-20 z-[70] flex flex-col items-center gap-2 px-4 md:bottom-6">
        {items.map((t) => (
          <div key={t.id} className="animate-rise pointer-events-auto flex items-center gap-2.5 rounded-2xl bg-ink/95 px-4 py-3 text-sm font-medium text-white shadow-2xl shadow-ink/30 ring-1 ring-white/10 backdrop-blur">
            {t.tone === 'success' ? <CheckCircle2 size={18} className="text-emerald-400" /> : <X size={18} className="text-rose-400" />}
            {t.message}
          </div>
        ))}
      </div>
    </ToastCtx.Provider>
  )
}

/** Tap-friendly row used for list pages on small screens. */
export function MobileRow({ onClick, left, title, subtitle, right, rightSub }: {
  onClick?: () => void; left?: ReactNode; title: ReactNode; subtitle?: ReactNode; right?: ReactNode; rightSub?: ReactNode
}) {
  return (
    <button type="button" onClick={onClick} className="flex w-full items-center gap-3 px-4 py-3.5 text-left transition active:bg-slate-50 cursor-pointer">
      {left}
      <div className="min-w-0 flex-1">
        <div className="truncate text-sm font-semibold">{title}</div>
        {subtitle && <div className="mt-0.5 truncate text-xs text-slate-500">{subtitle}</div>}
      </div>
      <div className="shrink-0 text-right">
        {right}
        {rightSub && <div className="mt-0.5">{rightSub}</div>}
      </div>
    </button>
  )
}

export function Avatar({ name, className = '' }: { name: string; className?: string }) {
  const palettes = ['from-brand-400 to-brand-700', 'from-amber-300 to-amber-500', 'from-sky-400 to-indigo-500', 'from-rose-400 to-pink-600', 'from-emerald-400 to-teal-600', 'from-violet-400 to-purple-600']
  const h = [...name].reduce((a, c) => a + c.charCodeAt(0), 0) % palettes.length
  const initials = name.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]).join('').toUpperCase()
  return <div className={`grid h-10 w-10 shrink-0 place-items-center rounded-full bg-gradient-to-br text-sm font-bold text-white shadow-sm ${palettes[h]} ${className}`}>{initials || '?'}</div>
}
