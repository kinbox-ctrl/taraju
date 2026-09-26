import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { CornerDownLeft, FileText, Package, Search, User, Zap, type LucideIcon } from 'lucide-react'
import { useStore } from '../lib/store'
import { invoiceSummary, money } from '../lib/utils'
import { NAV } from './nav'

type Hit = { id: string; group: string; label: string; sub?: string; icon: LucideIcon; to: string }

const ACTIONS: Hit[] = [
  { id: 'a1', group: 'Actions', label: 'Create sales invoice', sub: 'Alt+N', icon: Zap, to: '/app/sales/new' },
  { id: 'a2', group: 'Actions', label: 'Create purchase bill', icon: Zap, to: '/app/purchases/new' },
  { id: 'a3', group: 'Actions', label: 'Record payment', icon: Zap, to: '/app/payments?new=1' },
  { id: 'a4', group: 'Actions', label: 'Add expense', icon: Zap, to: '/app/expenses?new=1' },
  { id: 'a5', group: 'Actions', label: 'Add party', icon: Zap, to: '/app/parties?new=1' },
  { id: 'a6', group: 'Actions', label: 'Add item', icon: Zap, to: '/app/items?new=1' },
]

export function CommandPalette({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { db } = useStore()
  const navigate = useNavigate()
  const [q, setQ] = useState('')
  const [hi, setHi] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLDivElement>(null)

  useEffect(() => { if (open) { setQ(''); setHi(0); setTimeout(() => inputRef.current?.focus(), 10) } }, [open])

  const hits = useMemo(() => {
    const s = q.trim().toLowerCase()
    const pages: Hit[] = NAV.map((n) => ({ id: n.to, group: 'Go to', label: n.label, icon: n.icon, to: n.to }))
    if (!s) return [...ACTIONS.slice(0, 4), ...pages]
    const m = (...xs: string[]) => xs.some((x) => x.toLowerCase().includes(s))
    const invs: Hit[] = db.invoices.filter((i) => m(i.number, db.parties.find((p) => p.id === i.partyId)?.name ?? '')).slice(0, 6).map((i) => {
      const sm = invoiceSummary(db, i)
      return { id: i.id, group: 'Invoices', label: `${i.number} · ${sm.party?.name ?? ''}`, sub: `${money(sm.total)} · ${sm.status}`, icon: FileText, to: `/app/invoice/${i.id}` }
    })
    const parties: Hit[] = db.parties.filter((p) => m(p.name, p.phone, p.gstin)).slice(0, 5).map((p) => ({ id: p.id, group: 'Parties', label: p.name, sub: p.type, icon: User, to: `/app/parties/${p.id}` }))
    const items: Hit[] = db.items.filter((i) => m(i.name, i.sku, i.hsn)).slice(0, 5).map((i) => ({ id: i.id, group: 'Items', label: i.name, sub: money(i.salePrice), icon: Package, to: '/app/items' }))
    return [...ACTIONS.filter((a) => m(a.label)), ...pages.filter((p) => m(p.label)), ...invs, ...parties, ...items]
  }, [q, db])

  useEffect(() => { listRef.current?.querySelector(`[data-i="${hi}"]`)?.scrollIntoView({ block: 'nearest' }) }, [hi])

  if (!open) return null
  const go = (h: Hit) => { onClose(); navigate(h.to) }
  let lastGroup = ''

  return (
    <div className="no-print fixed inset-0 z-[60] flex items-start justify-center bg-ink/40 px-3 pt-[10vh] backdrop-blur-sm" onMouseDown={onClose}>
      <div className="animate-rise w-full max-w-xl overflow-hidden rounded-3xl bg-white shadow-2xl ring-1 ring-slate-200" onMouseDown={(e) => e.stopPropagation()}>
        <div className="flex items-center gap-3 border-b border-slate-100 px-5">
          <Search size={18} className="text-slate-400" />
          <input
            ref={inputRef}
            value={q}
            onChange={(e) => { setQ(e.target.value); setHi(0) }}
            onKeyDown={(e) => {
              if (e.key === 'ArrowDown') { e.preventDefault(); setHi((h) => Math.min(h + 1, hits.length - 1)) }
              if (e.key === 'ArrowUp') { e.preventDefault(); setHi((h) => Math.max(h - 1, 0)) }
              if (e.key === 'Enter' && hits[hi]) go(hits[hi])
              if (e.key === 'Escape') onClose()
            }}
            placeholder="Search invoices, parties, items or jump to…"
            className="h-14 flex-1 bg-transparent text-[15px] outline-none placeholder:text-slate-400"
          />
          <kbd className="hidden rounded-md bg-slate-100 px-2 py-1 text-[10px] font-semibold text-slate-500 sm:block">ESC</kbd>
        </div>
        <div ref={listRef} className="max-h-[60vh] overflow-y-auto p-2">
          {hits.length === 0 && <div className="px-4 py-10 text-center text-sm text-slate-500">No results for “{q}”</div>}
          {hits.map((h, i) => {
            const header = h.group !== lastGroup ? (lastGroup = h.group) : null
            const Icon = h.icon
            return (
              <div key={h.group + h.id}>
                {header && <div className="px-3 pb-1 pt-3 text-[10px] font-bold uppercase tracking-widest text-slate-400">{header}</div>}
                <button data-i={i} onMouseMove={() => setHi(i)} onClick={() => go(h)}
                  className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left cursor-pointer ${i === hi ? 'bg-brand-50' : ''}`}>
                  <div className={`grid h-8 w-8 place-items-center rounded-lg ${i === hi ? 'bg-brand-600 text-white' : 'bg-slate-100 text-slate-500'}`}><Icon size={15} /></div>
                  <div className="min-w-0 flex-1"><div className="truncate text-sm font-semibold">{h.label}</div>{h.sub && <div className="truncate text-xs text-slate-500">{h.sub}</div>}</div>
                  {i === hi && <CornerDownLeft size={14} className="text-brand-600" />}
                </button>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
