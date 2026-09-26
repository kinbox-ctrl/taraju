import { useEffect, useRef, useState } from 'react'
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import {
  Bell, ChevronDown, FilePlus2, FileText, IndianRupee, LayoutDashboard, LogOut, Menu, PackagePlus, Plus, Receipt,
  Search, ShoppingBag, Sparkles, UserPlus, Users, X,
} from 'lucide-react'
import { Logo, LogoMark } from './Logo'
import { CommandPalette } from './CommandPalette'
import { Avatar } from './ui'
import { NAV } from './nav'
import { useStore } from '../lib/store'
import { invoiceSummary, itemStock } from '../lib/utils'

const CREATE = [
  { label: 'Sales Invoice', to: '/app/sales/new', icon: FilePlus2, kbd: 'Alt+N', tone: 'bg-brand-50 text-brand-700' },
  { label: 'Purchase Bill', to: '/app/purchases/new', icon: ShoppingBag, tone: 'bg-sky-50 text-sky-700' },
  { label: 'Payment', to: '/app/payments?new=1', icon: IndianRupee, tone: 'bg-emerald-50 text-emerald-700' },
  { label: 'Expense', to: '/app/expenses?new=1', icon: Receipt, tone: 'bg-rose-50 text-rose-700' },
  { label: 'Party', to: '/app/parties?new=1', icon: UserPlus, tone: 'bg-violet-50 text-violet-700' },
  { label: 'Item', to: '/app/items?new=1', icon: PackagePlus, tone: 'bg-amber-50 text-amber-700' },
]

/** Full sidebar (desktop + mobile drawer). `rail` renders the icon-only tablet version. */
function Sidebar({ onNavigate, rail = false }: { onNavigate?: () => void; rail?: boolean }) {
  const { db } = useStore()
  const groups = [...new Set(NAV.map((n) => n.group))]
  return (
    <div className="relative flex h-full flex-col overflow-hidden bg-brand-950 text-brand-100">
      <div className="pointer-events-none absolute -left-24 top-1/3 h-64 w-64 rounded-full bg-brand-500/15 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-20 -right-20 h-56 w-56 rounded-full bg-gold-400/10 blur-3xl" />
      <div className={`relative ${rail ? 'flex justify-center py-5' : 'px-5 pb-5 pt-6'}`}>
        {rail ? <LogoMark size={38} /> : <Logo light tagline size={38} />}
      </div>
      <nav className={`relative flex-1 overflow-y-auto ${rail ? 'space-y-1 px-2.5' : 'px-3'}`}>
        {groups.map((g) => (
          <div key={g} className={rail ? 'space-y-1 border-t border-white/5 pt-2 first:border-0 first:pt-0' : 'mb-4'}>
            {!rail && <div className="px-3 pb-1.5 text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400/70">{g}</div>}
            {NAV.filter((n) => n.group === g).map(({ to, label, icon: Icon, end }) => (
              <NavLink key={to} to={to} end={end} onClick={onNavigate} title={rail ? label : undefined}
                className={({ isActive }) =>
                  `group relative flex items-center rounded-xl text-sm font-medium transition ${rail ? 'h-11 justify-center' : 'gap-3 px-3 py-2.5'} ${
                    isActive ? 'bg-gradient-to-r from-white/15 to-white/5 text-white shadow-inner ring-1 ring-white/10' : 'text-slate-300/80 hover:bg-white/5 hover:text-white'
                  }`}>
                {({ isActive }) => (
                  <>
                    {isActive && <span className="absolute -left-3 top-1/2 h-6 w-1 -translate-y-1/2 rounded-r-full bg-brand-400" />}
                    <Icon size={rail ? 20 : 18} className={`transition ${isActive ? 'text-brand-400' : 'group-hover:scale-110'}`} />
                    {!rail && label}
                  </>
                )}
              </NavLink>
            ))}
          </div>
        ))}
      </nav>
      {!rail && (
        <div className="relative m-3 overflow-hidden rounded-2xl bg-gradient-to-br from-brand-700 to-brand-900 p-4 ring-1 ring-white/10">
          <div className="absolute -right-6 -top-6 h-20 w-20 rounded-full bg-gold-400/20 blur-xl" />
          <div className="relative flex items-center gap-2 text-sm font-bold text-white"><Sparkles size={16} className="text-brand-400" /> Taraju Pro</div>
          <p className="relative mt-1 text-xs leading-relaxed text-brand-100/80">E-way bills, e-invoicing and multi-user access.</p>
          <button className="relative mt-3 w-full rounded-lg bg-brand-500 py-1.5 text-xs font-bold text-white transition hover:bg-brand-400 cursor-pointer">Upgrade</button>
          <div className="relative mt-2 truncate text-center text-[10px] text-brand-300">{db.business.name}</div>
        </div>
      )}
    </div>
  )
}

export default function AppLayout() {
  const { user, logout, db } = useStore()
  const navigate = useNavigate()
  const loc = useLocation()
  const [drawer, setDrawer] = useState(false)
  const [newOpen, setNewOpen] = useState(false)
  const [sheet, setSheet] = useState(false)
  const [bellOpen, setBellOpen] = useState(false)
  const [palette, setPalette] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const newRef = useRef<HTMLDivElement>(null)
  const bellRef = useRef<HTMLDivElement>(null)

  useEffect(() => { if (!user) navigate('/login', { replace: true }) }, [user, navigate])
  useEffect(() => { setNewOpen(false); setBellOpen(false); setSheet(false); setDrawer(false); window.scrollTo(0, 0) }, [loc.pathname])
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 4)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])
  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (newRef.current && !newRef.current.contains(e.target as Node)) setNewOpen(false)
      if (bellRef.current && !bellRef.current.contains(e.target as Node)) setBellOpen(false)
    }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [])
  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (e.altKey && e.code === 'KeyN') { e.preventDefault(); navigate('/app/sales/new') }
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); setPalette((v) => !v) }
    }
    window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  }, [navigate])
  useEffect(() => {
    document.body.style.overflow = drawer || sheet ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [drawer, sheet])

  if (!user) return null

  const lowStock = db.items.filter((i) => itemStock(db, i) <= i.lowStockAt)
  const overdue = db.invoices.filter((i) => i.kind === 'sale' && invoiceSummary(db, i).status === 'Overdue')
  const alerts = [
    ...overdue.map((i) => ({ key: i.id, text: `${i.number} is overdue`, sub: 'Send a reminder', to: `/app/invoice/${i.id}`, dot: 'bg-rose-500' })),
    ...lowStock.map((i) => ({ key: i.id, text: `${i.name} is running low`, sub: `${itemStock(db, i)} ${i.unit} left`, to: '/app/items', dot: 'bg-amber-400' })),
  ]
  const isEditor = /\/(new|edit)$/.test(loc.pathname)

  return (
    <div className="min-h-screen bg-[radial-gradient(ellipse_at_top_right,_rgb(14_166_115/0.07),_transparent_50%)] md:pl-20 lg:pl-64 print:!pl-0">
      {/* Desktop sidebar / tablet rail */}
      <aside className="no-print fixed inset-y-0 left-0 z-30 hidden w-64 lg:block"><Sidebar /></aside>
      <aside className="no-print fixed inset-y-0 left-0 z-30 hidden w-20 md:block lg:hidden"><Sidebar rail /></aside>

      {/* Mobile drawer */}
      <div className={`no-print fixed inset-0 z-50 md:hidden ${drawer ? '' : 'pointer-events-none'}`}>
        <div className={`absolute inset-0 bg-ink/50 backdrop-blur-sm transition-opacity duration-300 ${drawer ? 'opacity-100' : 'opacity-0'}`} onClick={() => setDrawer(false)} />
        <div className={`absolute inset-y-0 left-0 w-[82%] max-w-72 shadow-2xl transition-transform duration-300 ease-out ${drawer ? 'translate-x-0' : '-translate-x-full'}`}>
          <Sidebar onNavigate={() => setDrawer(false)} />
          <button className="absolute right-3 top-6 rounded-lg p-1.5 text-white/70 hover:bg-white/10" onClick={() => setDrawer(false)}><X size={18} /></button>
        </div>
      </div>

      <header className={`no-print sticky top-0 z-20 flex h-16 items-center gap-2 border-b bg-white/75 px-3 backdrop-blur-xl transition-shadow sm:gap-3 sm:px-6 ${scrolled ? 'border-slate-200/80 shadow-[0_4px_24px_-12px_rgba(15,23,42,.15)]' : 'border-transparent'}`}>
        <button className="grid h-10 w-10 place-items-center rounded-xl text-slate-600 hover:bg-slate-100 md:hidden" onClick={() => setDrawer(true)} aria-label="Menu"><Menu size={20} /></button>
        <div className="min-w-0 flex-1 md:flex-none">
          <div className="truncate text-sm font-bold">{db.business.name}</div>
          <div className="hidden truncate text-xs text-slate-500 sm:block">{db.business.gstin ? `GSTIN ${db.business.gstin}` : 'Add GSTIN in Settings'} · FY 2026-27</div>
        </div>

        <button onClick={() => setPalette(true)} className="ml-auto hidden h-10 w-full max-w-xs items-center gap-2 rounded-xl border border-slate-200 bg-slate-50/80 px-3 text-sm text-slate-400 transition hover:border-brand-300 hover:bg-white md:flex cursor-pointer">
          <Search size={16} /> Search anything…
          <kbd className="ml-auto rounded-md bg-white px-1.5 py-0.5 text-[10px] font-semibold text-slate-500 ring-1 ring-slate-200">⌘K</kbd>
        </button>

        <div className="flex items-center gap-1 sm:gap-2 md:ml-0">
          <button onClick={() => setPalette(true)} className="grid h-10 w-10 place-items-center rounded-xl text-slate-600 hover:bg-slate-100 md:hidden" aria-label="Search"><Search size={19} /></button>
          <div className="relative hidden md:block" ref={newRef}>
            <button onClick={() => setNewOpen((v) => !v)}
              className="inline-flex h-10 items-center gap-1.5 rounded-xl bg-gradient-to-b from-brand-400 to-brand-600 px-3.5 text-sm font-semibold text-white shadow-md shadow-brand-900/20 transition hover:brightness-110 cursor-pointer">
              <Plus size={16} strokeWidth={2.5} /> Create <ChevronDown size={14} className={`transition ${newOpen ? 'rotate-180' : ''}`} />
            </button>
            {newOpen && (
              <div className="animate-rise absolute right-0 mt-2 w-64 rounded-2xl border border-slate-200 bg-white p-1.5 shadow-2xl">
                {CREATE.map(({ label, to, icon: Icon, kbd, tone }) => (
                  <button key={label} onClick={() => navigate(to)} className="flex w-full items-center gap-3 rounded-xl px-2.5 py-2 text-left text-sm font-medium hover:bg-slate-50 cursor-pointer">
                    <span className={`grid h-8 w-8 place-items-center rounded-lg ${tone}`}><Icon size={16} /></span>{label}
                    {kbd && <kbd className="ml-auto rounded bg-slate-100 px-1.5 py-0.5 text-[10px] text-slate-500">{kbd}</kbd>}
                  </button>
                ))}
              </div>
            )}
          </div>
          <div className="relative" ref={bellRef}>
            <button onClick={() => setBellOpen((v) => !v)} className="relative grid h-10 w-10 place-items-center rounded-xl text-slate-600 hover:bg-slate-100 cursor-pointer" aria-label="Alerts">
              <Bell size={19} />
              {alerts.length > 0 && <span className="absolute right-1.5 top-1.5 grid h-4 min-w-4 place-items-center rounded-full bg-rose-500 px-1 text-[9px] font-bold text-white ring-2 ring-white">{alerts.length}</span>}
            </button>
            {bellOpen && (
              <div className="animate-rise absolute right-0 mt-2 w-[min(20rem,calc(100vw-1.5rem))] rounded-2xl border border-slate-200 bg-white p-2 shadow-2xl">
                <div className="flex items-center justify-between px-2 py-1.5"><span className="text-sm font-bold">Alerts</span><span className="text-xs text-slate-400">{alerts.length}</span></div>
                {alerts.length === 0 && <div className="px-2 py-6 text-center text-sm text-slate-500">You're all caught up ✨</div>}
                <div className="max-h-80 overflow-y-auto">
                  {alerts.map((a) => (
                    <button key={a.key} onClick={() => navigate(a.to)} className="flex w-full items-start gap-3 rounded-xl px-2 py-2.5 text-left hover:bg-slate-50 cursor-pointer">
                      <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${a.dot}`} />
                      <span><span className="block text-sm font-medium">{a.text}</span><span className="text-xs text-slate-500">{a.sub}</span></span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
          <div className="hidden items-center gap-2.5 border-l border-slate-200 pl-3 sm:flex">
            <Avatar name={user.name} className="h-9 w-9 ring-2 ring-white" />
            <div className="hidden text-sm leading-tight xl:block">
              <div className="font-semibold">{user.name}</div>
              <div className="text-xs text-slate-500">{user.email}</div>
            </div>
          </div>
          <button title="Log out" onClick={() => { logout(); navigate('/') }} className="hidden h-10 w-10 place-items-center rounded-xl text-slate-500 hover:bg-rose-50 hover:text-rose-600 sm:grid cursor-pointer"><LogOut size={18} /></button>
        </div>
      </header>

      <main key={loc.pathname} className={`animate-rise mx-auto max-w-7xl px-3 py-5 sm:px-6 lg:py-8 print:!p-0 ${isEditor ? 'pb-40 md:pb-8' : 'pb-28 md:pb-8'}`}>
        <Outlet />
      </main>

      {/* Mobile bottom navigation */}
      {!isEditor && (
        <nav className="no-print fixed inset-x-0 bottom-0 z-30 border-t border-slate-200/80 bg-white/90 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl md:hidden">
          <div className="grid grid-cols-5 items-end px-2">
            {[
              { to: '/app', label: 'Home', icon: LayoutDashboard, end: true },
              { to: '/app/sales', label: 'Invoices', icon: FileText },
            ].map(({ to, label, icon: Icon, end }) => (
              <NavLink key={to} to={to} end={end} className={({ isActive }) => `flex flex-col items-center gap-0.5 py-2.5 text-[10px] font-semibold ${isActive ? 'text-brand-700' : 'text-slate-400'}`}>
                <Icon size={21} />{label}
              </NavLink>
            ))}
            <div className="flex justify-center">
              <button onClick={() => setSheet(true)} aria-label="Create"
                className="-mt-6 grid h-14 w-14 place-items-center rounded-2xl bg-gradient-to-br from-brand-400 to-brand-600 text-white shadow-xl shadow-brand-900/30 ring-4 ring-white transition active:scale-95 cursor-pointer">
                <Plus size={26} strokeWidth={2.5} />
              </button>
            </div>
            <NavLink to="/app/parties" className={({ isActive }) => `flex flex-col items-center gap-0.5 py-2.5 text-[10px] font-semibold ${isActive ? 'text-brand-700' : 'text-slate-400'}`}>
              <Users size={21} />Parties
            </NavLink>
            <button onClick={() => setDrawer(true)} className="flex flex-col items-center gap-0.5 py-2.5 text-[10px] font-semibold text-slate-400 cursor-pointer">
              <Menu size={21} />More
            </button>
          </div>
        </nav>
      )}

      {/* Mobile create sheet */}
      <div className={`no-print fixed inset-0 z-50 md:hidden ${sheet ? '' : 'pointer-events-none'}`}>
        <div className={`absolute inset-0 bg-ink/50 backdrop-blur-sm transition-opacity duration-300 ${sheet ? 'opacity-100' : 'opacity-0'}`} onClick={() => setSheet(false)} />
        <div className={`absolute inset-x-0 bottom-0 rounded-t-[28px] bg-white p-5 pb-[calc(1.25rem+env(safe-area-inset-bottom))] shadow-2xl transition-transform duration-300 ease-out ${sheet ? 'translate-y-0' : 'translate-y-full'}`}>
          <div className="mx-auto mb-4 h-1.5 w-10 rounded-full bg-slate-200" />
          <div className="mb-4 text-base font-bold">Create new</div>
          <div className="grid grid-cols-3 gap-3">
            {CREATE.map(({ label, to, icon: Icon, tone }) => (
              <button key={label} onClick={() => navigate(to)} className="flex flex-col items-center gap-2 rounded-2xl border border-slate-100 p-3.5 text-xs font-semibold transition active:scale-95 cursor-pointer">
                <span className={`grid h-11 w-11 place-items-center rounded-xl ${tone}`}><Icon size={20} /></span>{label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <CommandPalette open={palette} onClose={() => setPalette(false)} />
    </div>
  )
}
