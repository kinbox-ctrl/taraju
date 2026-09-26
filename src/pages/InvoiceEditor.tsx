import { useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Plus, Save, Search, Trash2, UserPlus, AlertTriangle } from 'lucide-react'
import { useStore } from '../lib/store'
import type { Invoice, InvoiceKind, InvoiceLine, Item, Party, PayMode } from '../lib/types'
import { Button, Field, useToast } from '../components/ui'
import { ItemModal, PartyModal } from '../components/forms'
import {
  GST_RATES, addDays, amountInWords, invoiceTotals, itemStock, lineCalc, money, nextInvoiceNumber, round2, today, uid,
} from '../lib/utils'

function Combo<T extends { id: string }>({ items, value, onPick, render, sub, placeholder, filter, onCreate, createLabel, autoFocus }: {
  items: T[]; value: string; onPick: (t: T) => void; render: (t: T) => string; sub?: (t: T) => string
  placeholder: string; filter: (t: T, q: string) => boolean; onCreate?: (q: string) => void; createLabel?: string; autoFocus?: boolean
}) {
  const [q, setQ] = useState(value)
  const [open, setOpen] = useState(false)
  const [hi, setHi] = useState(0)
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => setQ(value), [value])
  useEffect(() => {
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) { setOpen(false); setQ(value) } }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [value])
  const list = items.filter((t) => !q || q === value || filter(t, q.toLowerCase())).slice(0, 8)
  const pick = (t: T) => { onPick(t); setOpen(false) }
  return (
    <div className="relative" ref={ref}>
      <Search size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
      <input
        autoFocus={autoFocus}
        className="input pl-8"
        value={q}
        placeholder={placeholder}
        onFocus={(e) => { setOpen(true); e.target.select() }}
        onChange={(e) => { setQ(e.target.value); setOpen(true); setHi(0) }}
        onKeyDown={(e) => {
          if (e.key === 'ArrowDown') { e.preventDefault(); setHi((h) => Math.min(h + 1, list.length - 1)) }
          if (e.key === 'ArrowUp') { e.preventDefault(); setHi((h) => Math.max(h - 1, 0)) }
          if (e.key === 'Enter') { e.preventDefault(); if (list[hi]) pick(list[hi]); else if (onCreate && q) { onCreate(q); setOpen(false) } }
          if (e.key === 'Escape') { setOpen(false); setQ(value) }
        }}
      />
      {open && (
        <div className="absolute z-30 mt-1.5 max-h-72 w-full min-w-64 overflow-y-auto rounded-xl border border-slate-200 bg-white p-1 shadow-xl">
          {list.map((t, i) => (
            <button key={t.id} type="button" onMouseEnter={() => setHi(i)} onClick={() => pick(t)}
              className={`block w-full rounded-lg px-3 py-2 text-left cursor-pointer ${i === hi ? 'bg-brand-50' : ''}`}>
              <div className="text-sm font-semibold">{render(t)}</div>
              {sub && <div className="text-xs text-slate-500">{sub(t)}</div>}
            </button>
          ))}
          {list.length === 0 && !onCreate && <div className="px-3 py-2 text-sm text-slate-500">No matches</div>}
          {onCreate && (
            <button type="button" onClick={() => { onCreate(q === value ? '' : q); setOpen(false) }} className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm font-semibold text-brand-700 hover:bg-brand-50 cursor-pointer">
              <Plus size={14} /> {createLabel}{q && q !== value ? ` “${q}”` : ''}
            </button>
          )}
        </div>
      )}
    </div>
  )
}

const emptyLine = (): InvoiceLine => ({ itemId: '', name: '', hsn: '', unit: 'PCS', qty: 1, rate: 0, discount: 0, gstRate: 18 })

export default function InvoiceEditor({ kind: kindProp }: { kind?: InvoiceKind }) {
  const { id } = useParams()
  const { db, saveInvoice, savePayment } = useStore()
  const toast = useToast()
  const navigate = useNavigate()
  const existing = id ? db.invoices.find((i) => i.id === id) : undefined
  const kind: InvoiceKind = existing?.kind ?? kindProp ?? 'sale'
  const isSale = kind === 'sale'

  const [inv, setInv] = useState<Invoice>(() => existing ?? {
    id: '', kind, number: nextInvoiceNumber(db, kind), date: today(), dueDate: addDays(today(), isSale ? 15 : 30),
    partyId: '', lines: [emptyLine()], notes: '', createdAt: today(),
  })
  const [received, setReceived] = useState('')
  const [mode, setMode] = useState<PayMode>('Cash')
  const [partyModal, setPartyModal] = useState(false)
  const [itemModal, setItemModal] = useState<{ row: number; name: string } | null>(null)
  const [err, setErr] = useState('')

  const party = db.parties.find((p) => p.id === inv.partyId)
  const inter = !!party && party.state !== db.business.state
  const t = useMemo(() => invoiceTotals(inv, inter), [inv, inter])
  const set = <K extends keyof Invoice>(k: K, v: Invoice[K]) => setInv((x) => ({ ...x, [k]: v }))
  const setLine = (i: number, patch: Partial<InvoiceLine>) => setInv((x) => ({ ...x, lines: x.lines.map((l, j) => (j === i ? { ...l, ...patch } : l)) }))
  const pickItem = (i: number, it: Item) => setLine(i, {
    itemId: it.id, name: it.name, hsn: it.hsn, unit: it.unit, gstRate: it.gstRate, rate: isSale ? it.salePrice : it.purchasePrice,
  })

  const partyList = db.parties.filter((p) => (isSale ? p.type === 'customer' : p.type === 'supplier'))
  const otherParties = db.parties.filter((p) => !partyList.includes(p))

  const save = (andNew = false) => {
    setErr('')
    window.scrollTo({ top: 0, behavior: 'smooth' })
    if (!inv.partyId) return setErr(`Select a ${isSale ? 'customer' : 'supplier'}.`)
    const lines = inv.lines.filter((l) => l.name.trim())
    if (!lines.length) return setErr('Add at least one item.')
    if (lines.some((l) => l.qty <= 0)) return setErr('Quantity must be greater than zero.')
    if (db.invoices.some((i) => i.kind === kind && i.number === inv.number && i.id !== inv.id)) return setErr(`Number ${inv.number} is already used.`)
    const saved = saveInvoice({ ...inv, lines })
    const amt = round2(Number(received) || 0)
    if (!existing && amt > 0)
      savePayment({ id: uid(), kind: isSale ? 'in' : 'out', partyId: inv.partyId, invoiceId: saved.id, amount: Math.min(amt, t.total), date: inv.date, mode, note: '' })
    toast(`${isSale ? 'Invoice' : 'Bill'} ${inv.number} saved`)
    if (andNew) {
      const bumped = inv.number.replace(/(\d+)(?!.*\d)/, (m) => String(Number(m) + 1).padStart(m.length, '0'))
      setInv({ ...inv, id: '', number: bumped, partyId: '', lines: [emptyLine()], notes: '' })
      setReceived('')
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } else navigate(`/app/invoice/${saved.id}`, { replace: true })
  }

  const stockFor = (l: InvoiceLine) => {
    const item = db.items.find((x) => x.id === l.itemId)
    if (!item) return null
    const own = existing?.lines.filter((x) => x.itemId === item.id).reduce((a, x) => a + x.qty, 0) ?? 0
    return itemStock(db, item) + own * (isSale ? 1 : -1)
  }
  const removeLine = (i: number) => setInv((x) => ({ ...x, lines: x.lines.length > 1 ? x.lines.filter((_, j) => j !== i) : [emptyLine()] }))
  const itemCombo = (l: InvoiceLine, i: number) => (
    <Combo<Item>
      items={db.items}
      value={l.name}
      onPick={(it) => pickItem(i, it)}
      render={(it) => it.name}
      sub={(it) => `${money(isSale ? it.salePrice : it.purchasePrice)} · GST ${it.gstRate}% · Stock ${itemStock(db, it)} ${it.unit}`}
      filter={(it, q) => it.name.toLowerCase().includes(q) || it.sku.toLowerCase().includes(q) || it.hsn.includes(q)}
      placeholder="Search item…"
      onCreate={(q) => setItemModal({ row: i, name: q })}
      createLabel="Create item"
    />
  )

  useEffect(() => {
    const h = (e: KeyboardEvent) => { if ((e.ctrlKey || e.metaKey) && e.key === 's') { e.preventDefault(); save() } }
    window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  })

  return (
    <div>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3 sm:mb-6">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="grid h-10 w-10 place-items-center rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 cursor-pointer"><ArrowLeft size={18} /></button>
          <div>
            <h1 className="text-xl font-extrabold tracking-tight sm:text-2xl">{existing ? 'Edit' : 'New'} {isSale ? 'Tax Invoice' : 'Purchase Bill'}</h1>
            <p className="text-xs text-slate-500 sm:text-sm">{inter ? 'Inter-state supply · IGST applies' : party ? 'Intra-state supply · CGST + SGST' : 'Pick a party to calculate GST'}</p>
          </div>
        </div>
        <div className="hidden gap-2 md:flex">
          {!existing && <Button variant="secondary" onClick={() => save(true)}>Save & New</Button>}
          <Button icon={Save} onClick={() => save()}>Save {isSale ? 'Invoice' : 'Bill'} <kbd className="ml-1 hidden rounded bg-white/15 px-1.5 text-[10px] sm:inline">⌘S</kbd></Button>
        </div>
      </div>

      {err && <div className="mb-4 flex items-center gap-2 rounded-xl bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700 ring-1 ring-rose-200"><AlertTriangle size={16} /> {err}</div>}

      <div className="grid gap-5 sm:gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
        <div className="min-w-0 space-y-5 sm:space-y-6">
          <div className="card grid grid-cols-2 gap-3 p-4 sm:gap-4 sm:p-5 md:grid-cols-4">
            <div className="col-span-2">
              <span className="label">{isSale ? 'Bill to (customer)' : 'Supplier'} *</span>
              <div className="flex gap-2">
                <div className="flex-1">
                  <Combo<Party>
                    items={[...partyList, ...otherParties]}
                    value={party?.name ?? ''}
                    onPick={(p) => set('partyId', p.id)}
                    render={(p) => p.name}
                    sub={(p) => [p.type, p.gstin || 'Unregistered', p.state].join(' · ')}
                    filter={(p, q) => p.name.toLowerCase().includes(q) || p.phone.includes(q) || p.gstin.toLowerCase().includes(q)}
                    placeholder="Search by name, phone or GSTIN"
                    onCreate={() => setPartyModal(true)}
                    createLabel="Add new party"
                    autoFocus={!existing && window.matchMedia('(min-width: 768px)').matches}
                  />
                </div>
                <button type="button" onClick={() => setPartyModal(true)} title="Add party" className="grid h-[42px] w-[42px] shrink-0 place-items-center rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 cursor-pointer"><UserPlus size={16} /></button>
              </div>
              {party && (
                <div className="mt-2 rounded-xl bg-slate-50 px-3 py-2 text-xs text-slate-600">
                  {party.gstin && <span className="font-mono font-semibold text-ink">{party.gstin} · </span>}{party.address || party.state}
                </div>
              )}
            </div>
            <Field label={isSale ? 'Invoice no.' : 'Bill no.'}><input className="input font-mono" value={inv.number} onChange={(e) => set('number', e.target.value)} /></Field>
            <Field label="Date"><input type="date" className="input" value={inv.date} onChange={(e) => set('date', e.target.value)} /></Field>
            <Field label="Payment terms" className="md:col-start-3">
              <select className="input" value={Math.round((+new Date(inv.dueDate) - +new Date(inv.date)) / 864e5)} onChange={(e) => set('dueDate', addDays(inv.date, Number(e.target.value)))}>
                {[0, 7, 15, 30, 45, 60].map((d) => <option key={d} value={d}>{d === 0 ? 'Due on receipt' : `Net ${d} days`}</option>)}
                {![0, 7, 15, 30, 45, 60].includes(Math.round((+new Date(inv.dueDate) - +new Date(inv.date)) / 864e5)) && <option value={Math.round((+new Date(inv.dueDate) - +new Date(inv.date)) / 864e5)}>Custom</option>}
              </select>
            </Field>
            <Field label="Due date"><input type="date" className="input" value={inv.dueDate} onChange={(e) => set('dueDate', e.target.value)} /></Field>
          </div>

          <div className="card overflow-visible">
            <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3.5 sm:px-5 sm:py-4">
              <h2 className="font-bold">Items</h2>
              <span className="text-xs text-slate-500">{inv.lines.filter((l) => l.name).length} line(s)</span>
            </div>
            <div className="divide-y divide-slate-100 md:hidden">
              {inv.lines.map((l, i) => {
                const c = lineCalc(l)
                const stock = stockFor(l)
                const short = isSale && stock !== null && l.qty > stock
                return (
                  <div key={i} className="space-y-3 p-4">
                    <div className="flex items-start gap-2">
                      <span className="mt-2.5 grid h-6 w-6 shrink-0 place-items-center rounded-full bg-brand-50 text-[11px] font-bold text-brand-700">{i + 1}</span>
                      <div className="min-w-0 flex-1">
                        {itemCombo(l, i)}
                        {stock !== null && <div className={`mt-1 px-1 text-[11px] ${short ? 'font-semibold text-rose-600' : 'text-slate-400'}`}>{short ? `Only ${stock} ${l.unit} in stock` : `In stock: ${stock} ${l.unit}`}{l.hsn && ` · HSN ${l.hsn}`}</div>}
                      </div>
                      <button onClick={() => removeLine(i)} className="mt-1 rounded-lg p-2 text-slate-400 active:bg-rose-50 active:text-rose-600" aria-label="Remove line"><Trash2 size={16} /></button>
                    </div>
                    <div className="grid grid-cols-4 gap-2 pl-8">
                      <label><span className="mb-1 block text-[10px] font-semibold uppercase text-slate-400">Qty</span><input type="number" inputMode="decimal" min={0} className="input num px-2.5" value={l.qty} onChange={(e) => setLine(i, { qty: Number(e.target.value) })} /></label>
                      <label className="col-span-2"><span className="mb-1 block text-[10px] font-semibold uppercase text-slate-400">Rate ₹</span><input type="number" inputMode="decimal" min={0} className="input num px-2.5" value={l.rate} onChange={(e) => setLine(i, { rate: Number(e.target.value) })} /></label>
                      <label><span className="mb-1 block text-[10px] font-semibold uppercase text-slate-400">Disc %</span><input type="number" inputMode="decimal" min={0} max={100} className="input num px-2.5" value={l.discount} onChange={(e) => setLine(i, { discount: Number(e.target.value) })} /></label>
                    </div>
                    <div className="flex items-center justify-between pl-8">
                      <select className="input w-auto px-2.5 py-1.5 text-xs" value={l.gstRate} onChange={(e) => setLine(i, { gstRate: Number(e.target.value) })}>{GST_RATES.map((r) => <option key={r} value={r}>GST {r}%</option>)}</select>
                      <span className="num text-base font-bold">{money(c.total)}</span>
                    </div>
                  </div>
                )
              })}
            </div>
            <div className="hidden overflow-x-auto md:block">
              <table className="w-full min-w-[820px]">
                <thead className="bg-slate-50/60"><tr>
                  <th className="th w-8">#</th><th className="th">Item</th><th className="th w-24">HSN</th><th className="th w-24">Qty</th>
                  <th className="th w-28">Rate ₹</th><th className="th w-20">Disc %</th><th className="th w-24">GST</th><th className="th w-32 text-right">Amount</th><th className="w-10" />
                </tr></thead>
                <tbody className="divide-y divide-slate-100">
                  {inv.lines.map((l, i) => {
                    const c = lineCalc(l)
                    const stock = stockFor(l)
                    const short = isSale && stock !== null && l.qty > stock
                    return (
                      <tr key={i} className="align-top">
                        <td className="td pt-5 text-xs text-slate-400">{i + 1}</td>
                        <td className="px-2 py-2.5">
                          {itemCombo(l, i)}
                          {stock !== null && <div className={`mt-1 px-1 text-[11px] ${short ? 'font-semibold text-rose-600' : 'text-slate-400'}`}>{short ? `Only ${stock} ${l.unit} in stock` : `In stock: ${stock} ${l.unit}`}</div>}
                        </td>
                        <td className="px-2 py-2.5"><input className="input px-2.5 font-mono text-xs" value={l.hsn} onChange={(e) => setLine(i, { hsn: e.target.value })} /></td>
                        <td className="px-2 py-2.5"><input type="number" min={0} className="input num px-2.5" value={l.qty} onChange={(e) => setLine(i, { qty: Number(e.target.value) })} /></td>
                        <td className="px-2 py-2.5"><input type="number" min={0} className="input num px-2.5" value={l.rate} onChange={(e) => setLine(i, { rate: Number(e.target.value) })} /></td>
                        <td className="px-2 py-2.5"><input type="number" min={0} max={100} className="input num px-2.5" value={l.discount} onChange={(e) => setLine(i, { discount: Number(e.target.value) })} /></td>
                        <td className="px-2 py-2.5">
                          <select className="input px-2" value={l.gstRate} onChange={(e) => setLine(i, { gstRate: Number(e.target.value) })}>{GST_RATES.map((r) => <option key={r} value={r}>{r}%</option>)}</select>
                        </td>
                        <td className="td num pt-5 text-right font-semibold">{money(c.total)}</td>
                        <td className="py-2.5 pr-3">
                          <button onClick={() => removeLine(i)} className="mt-1.5 rounded-lg p-2 text-slate-400 hover:bg-rose-50 hover:text-rose-600 cursor-pointer"><Trash2 size={15} /></button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
            <div className="border-t border-slate-100 p-3">
              <Button variant="ghost" icon={Plus} className="w-full md:w-auto" onClick={() => set('lines', [...inv.lines, emptyLine()])}>Add line</Button>
            </div>
          </div>

          <div className="card p-4 sm:p-5">
            <Field label="Notes / terms"><textarea rows={3} className="input" value={inv.notes} onChange={(e) => set('notes', e.target.value)} placeholder={db.business.terms} /></Field>
          </div>
        </div>

        <div className="space-y-4 xl:sticky xl:top-24 xl:self-start">
          <div className="card p-5">
            <h2 className="mb-4 font-bold">Summary</h2>
            <dl className="space-y-2.5 text-sm">
              <Row l="Taxable amount" v={money(t.taxable)} />
              {t.discount > 0 && <Row l="Discount" v={`− ${money(t.discount)}`} muted />}
              {inter ? <Row l="IGST" v={money(t.igst)} /> : <><Row l="CGST" v={money(t.cgst)} /><Row l="SGST" v={money(t.sgst)} /></>}
              {t.roundOff !== 0 && <Row l="Round off" v={money(t.roundOff)} muted />}
            </dl>
            <div className="mt-4 rounded-2xl bg-gradient-to-br from-brand-700 to-brand-900 p-4 text-white">
              <div className="text-xs text-brand-200">Grand total</div>
              <div className="num text-3xl font-extrabold">{money(t.total)}</div>
              <div className="mt-1 text-[11px] leading-snug text-brand-200">{amountInWords(t.total)}</div>
            </div>
          </div>
          {!existing && (
            <div className="card space-y-3 p-5">
              <h2 className="font-bold">{isSale ? 'Payment received' : 'Payment made'}</h2>
              <div className="flex gap-2">
                <input type="number" className="input num" placeholder="0.00" value={received} onChange={(e) => setReceived(e.target.value)} />
                <Button variant="secondary" onClick={() => setReceived(String(t.total))}>Full</Button>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {(['Cash', 'UPI', 'Bank', 'Card', 'Cheque'] as PayMode[]).map((m) => (
                  <button key={m} type="button" onClick={() => setMode(m)} className={`rounded-lg px-3 py-1.5 text-xs font-semibold ring-1 cursor-pointer ${mode === m ? 'bg-brand-700 text-white ring-brand-700' : 'text-slate-600 ring-slate-200 hover:bg-slate-50'}`}>{m}</button>
                ))}
              </div>
              {Number(received) > 0 && <div className="text-xs text-slate-500">Balance due: <span className="num font-semibold text-amber-600">{money(Math.max(0, t.total - Number(received)))}</span></div>}
            </div>
          )}
        </div>
      </div>

      {createPortal(
      <div className="no-print fixed inset-x-0 bottom-0 z-30 border-t border-slate-200 bg-white/95 px-4 pb-[calc(0.75rem+env(safe-area-inset-bottom))] pt-3 shadow-[0_-8px_30px_-12px_rgba(15,23,42,.25)] backdrop-blur-xl md:hidden">
        <div className="mb-2.5 flex items-baseline justify-between">
          <span className="text-xs text-slate-500">Total {inter ? '(incl. IGST)' : '(incl. GST)'}</span>
          <span className="num text-xl font-extrabold text-brand-800">{money(t.total)}</span>
        </div>
        <div className="flex gap-2">
          {!existing && <Button variant="secondary" className="flex-1" onClick={() => save(true)}>Save & New</Button>}
          <Button icon={Save} className="flex-[2]" onClick={() => save()}>Save {isSale ? 'Invoice' : 'Bill'}</Button>
        </div>
      </div>
      , document.body)}

      <PartyModal open={partyModal} onClose={() => setPartyModal(false)} defaultType={isSale ? 'customer' : 'supplier'} onSaved={(p) => set('partyId', p.id)} />
      <ItemModal open={!!itemModal} onClose={() => setItemModal(null)} presetName={itemModal?.name} onSaved={(it) => itemModal && pickItem(itemModal.row, it)} />
    </div>
  )
}

function Row({ l, v, muted }: { l: string; v: string; muted?: boolean }) {
  return <div className={`flex justify-between ${muted ? 'text-slate-400' : 'text-slate-600'}`}><dt>{l}</dt><dd className="num font-medium text-ink">{v}</dd></div>
}
