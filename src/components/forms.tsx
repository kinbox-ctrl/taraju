import { useEffect, useState } from 'react'
import { useStore } from '../lib/store'
import type { Item, Party, PartyType, PayMode, Payment } from '../lib/types'
import { GST_RATES, STATES, UNITS, invoiceSummary, money, today } from '../lib/utils'
import { Button, Field, Modal, useToast } from './ui'

const blankParty = (type: PartyType, state: string): Party => ({
  id: '', type, name: '', gstin: '', phone: '', email: '', state, address: '', openingBalance: 0, createdAt: today(),
})

export function PartyModal({ open, onClose, initial, defaultType = 'customer', onSaved }: {
  open: boolean; onClose: () => void; initial?: Party | null; defaultType?: PartyType; onSaved?: (p: Party) => void
}) {
  const { db, saveParty } = useStore()
  const toast = useToast()
  const [p, setP] = useState<Party>(initial ?? blankParty(defaultType, db.business.state))
  const [err, setErr] = useState('')
  useEffect(() => {
    if (open) { setP(initial ?? blankParty(defaultType, db.business.state)); setErr('') }
  }, [open, initial, defaultType, db.business.state])
  const set = <K extends keyof Party>(k: K, v: Party[K]) => setP((x) => ({ ...x, [k]: v }))

  const onGstin = (v: string) => {
    const g = v.toUpperCase().replace(/\s/g, '').slice(0, 15)
    set('gstin', g)
    // First two digits of GSTIN are the state code
    const code = parseInt(g.slice(0, 2))
    const codes: Record<number, string> = { 1: 'Jammu and Kashmir', 2: 'Himachal Pradesh', 3: 'Punjab', 5: 'Uttarakhand', 6: 'Haryana', 7: 'Delhi', 8: 'Rajasthan', 9: 'Uttar Pradesh', 10: 'Bihar', 18: 'Assam', 19: 'West Bengal', 20: 'Jharkhand', 21: 'Odisha', 22: 'Chhattisgarh', 23: 'Madhya Pradesh', 24: 'Gujarat', 27: 'Maharashtra', 29: 'Karnataka', 30: 'Goa', 32: 'Kerala', 33: 'Tamil Nadu', 34: 'Puducherry', 36: 'Telangana', 37: 'Andhra Pradesh' }
    if (codes[code]) set('state', codes[code])
  }

  const submit = () => {
    if (!p.name.trim()) return setErr('Party name is required.')
    if (p.gstin && !/^\d{2}[A-Z]{5}\d{4}[A-Z][A-Z\d]Z[A-Z\d]$/.test(p.gstin)) return setErr('GSTIN looks invalid (15 characters, e.g. 07ABCDE1234F1Z5).')
    const saved = saveParty({ ...p, name: p.name.trim() })
    toast(`${saved.name} ${initial ? 'updated' : 'added'}`)
    onSaved?.(saved)
    onClose()
  }

  return (
    <Modal open={open} onClose={onClose} title={initial ? 'Edit party' : 'Add party'} wide
      footer={<><Button variant="secondary" onClick={onClose}>Cancel</Button><Button onClick={submit}>Save party</Button></>}>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Type" className="sm:col-span-2">
          <div className="inline-flex rounded-xl bg-slate-100 p-1">
            {(['customer', 'supplier'] as const).map((t) => (
              <button key={t} type="button" onClick={() => set('type', t)} className={`rounded-lg px-4 py-1.5 text-sm font-semibold capitalize cursor-pointer ${p.type === t ? 'bg-white shadow-sm' : 'text-slate-500'}`}>{t}</button>
            ))}
          </div>
        </Field>
        <Field label="Name *" className="sm:col-span-2"><input autoFocus className="input" value={p.name} onChange={(e) => set('name', e.target.value)} placeholder="e.g. Sharma General Store" /></Field>
        <Field label="GSTIN"><input className="input font-mono uppercase" value={p.gstin} onChange={(e) => onGstin(e.target.value)} placeholder="07ABCDE1234F1Z5" /></Field>
        <Field label="State (place of supply)">
          <select className="input" value={p.state} onChange={(e) => set('state', e.target.value)}>{STATES.map((s) => <option key={s}>{s}</option>)}</select>
        </Field>
        <Field label="Phone"><input className="input" value={p.phone} onChange={(e) => set('phone', e.target.value)} placeholder="98XXXXXXXX" /></Field>
        <Field label="Email"><input className="input" value={p.email} onChange={(e) => set('email', e.target.value)} placeholder="name@example.com" /></Field>
        <Field label="Address" className="sm:col-span-2"><textarea rows={2} className="input" value={p.address} onChange={(e) => set('address', e.target.value)} /></Field>
        <Field label={`Opening balance (${p.type === 'customer' ? 'they owe you' : 'you owe them'})`}>
          <input type="number" className="input num" value={p.openingBalance || ''} onChange={(e) => set('openingBalance', Number(e.target.value))} placeholder="0" />
        </Field>
      </div>
      {err && <div className="mt-4 rounded-xl bg-rose-50 px-3.5 py-2.5 text-sm text-rose-700">{err}</div>}
    </Modal>
  )
}

const blankItem = (): Item => ({
  id: '', name: '', sku: '', hsn: '', category: 'General', unit: 'PCS', salePrice: 0, purchasePrice: 0, gstRate: 18, openingStock: 0, lowStockAt: 5,
})

export function ItemModal({ open, onClose, initial, onSaved, presetName }: {
  open: boolean; onClose: () => void; initial?: Item | null; onSaved?: (i: Item) => void; presetName?: string
}) {
  const { saveItem } = useStore()
  const toast = useToast()
  const [it, setIt] = useState<Item>(initial ?? blankItem())
  const [err, setErr] = useState('')
  useEffect(() => {
    if (open) { setIt(initial ?? { ...blankItem(), name: presetName ?? '' }); setErr('') }
  }, [open, initial, presetName])
  const set = <K extends keyof Item>(k: K, v: Item[K]) => setIt((x) => ({ ...x, [k]: v }))
  const num = (k: keyof Item) => (e: React.ChangeEvent<HTMLInputElement>) => set(k, Number(e.target.value) as never)

  const submit = () => {
    if (!it.name.trim()) return setErr('Item name is required.')
    const saved = saveItem({ ...it, name: it.name.trim() })
    toast(`${saved.name} ${initial ? 'updated' : 'added'}`)
    onSaved?.(saved)
    onClose()
  }
  const margin = it.salePrice && it.purchasePrice ? ((it.salePrice - it.purchasePrice) / it.salePrice) * 100 : null

  return (
    <Modal open={open} onClose={onClose} title={initial ? 'Edit item' : 'Add item'} wide
      footer={<><Button variant="secondary" onClick={onClose}>Cancel</Button><Button onClick={submit}>Save item</Button></>}>
      <div className="grid gap-4 sm:grid-cols-3">
        <Field label="Item name *" className="sm:col-span-2"><input autoFocus className="input" value={it.name} onChange={(e) => set('name', e.target.value)} placeholder="e.g. Basmati Rice 5kg" /></Field>
        <Field label="Category"><input className="input" value={it.category} onChange={(e) => set('category', e.target.value)} /></Field>
        <Field label="HSN / SAC"><input className="input font-mono" value={it.hsn} onChange={(e) => set('hsn', e.target.value)} placeholder="1006" /></Field>
        <Field label="SKU / Code"><input className="input font-mono" value={it.sku} onChange={(e) => set('sku', e.target.value)} /></Field>
        <Field label="Unit"><select className="input" value={it.unit} onChange={(e) => set('unit', e.target.value)}>{UNITS.map((u) => <option key={u}>{u}</option>)}</select></Field>
        <Field label="Sale price (₹, excl. GST)"><input type="number" className="input num" value={it.salePrice || ''} onChange={num('salePrice')} /></Field>
        <Field label="Purchase price (₹)"><input type="number" className="input num" value={it.purchasePrice || ''} onChange={num('purchasePrice')} /></Field>
        <Field label="GST rate"><select className="input" value={it.gstRate} onChange={(e) => set('gstRate', Number(e.target.value))}>{GST_RATES.map((r) => <option key={r} value={r}>{r}%</option>)}</select></Field>
        <Field label="Opening stock"><input type="number" className="input num" value={it.openingStock || ''} onChange={num('openingStock')} /></Field>
        <Field label="Low stock alert at"><input type="number" className="input num" value={it.lowStockAt || ''} onChange={num('lowStockAt')} /></Field>
        <div className="flex items-end">
          {margin !== null && <div className={`w-full rounded-xl px-3.5 py-2.5 text-sm font-semibold ${margin >= 0 ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}>Margin {margin.toFixed(1)}%</div>}
        </div>
      </div>
      {err && <div className="mt-4 rounded-xl bg-rose-50 px-3.5 py-2.5 text-sm text-rose-700">{err}</div>}
    </Modal>
  )
}

export function PaymentModal({ open, onClose, kind: kindProp = 'in', partyId: partyProp, invoiceId: invProp, initial }: {
  open: boolean; onClose: () => void; kind?: 'in' | 'out'; partyId?: string; invoiceId?: string; initial?: Payment | null
}) {
  const { db, savePayment } = useStore()
  const toast = useToast()
  const blank = (): Payment => ({ id: '', kind: kindProp, partyId: partyProp ?? '', invoiceId: invProp, amount: 0, date: today(), mode: 'UPI', note: '' })
  const [p, setP] = useState<Payment>(initial ?? blank())
  const [err, setErr] = useState('')
  useEffect(() => {
    if (!open) return
    const base = initial ?? blank()
    if (!initial && invProp) {
      const inv = db.invoices.find((i) => i.id === invProp)
      if (inv) base.amount = invoiceSummary(db, inv).due
    }
    setP(base)
    setErr('')
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, initial, kindProp, partyProp, invProp])
  const set = <K extends keyof Payment>(k: K, v: Payment[K]) => setP((x) => ({ ...x, [k]: v }))

  const openInvoices = db.invoices
    .filter((i) => i.partyId === p.partyId && i.kind === (p.kind === 'in' ? 'sale' : 'purchase'))
    .map((i) => ({ i, s: invoiceSummary(db, i) }))
    .filter((x) => x.s.due > 0 || x.i.id === p.invoiceId)

  const submit = () => {
    if (!p.partyId) return setErr('Select a party.')
    if (!(p.amount > 0)) return setErr('Enter an amount greater than zero.')
    savePayment(p)
    toast(`Payment of ${money(p.amount)} recorded`)
    onClose()
  }

  return (
    <Modal open={open} onClose={onClose} title={initial ? 'Edit payment' : p.kind === 'in' ? 'Payment in' : 'Payment out'}
      footer={<><Button variant="secondary" onClick={onClose}>Cancel</Button><Button onClick={submit}>Save payment</Button></>}>
      <div className="grid gap-4">
        {!invProp && (
          <div className="inline-flex w-fit rounded-xl bg-slate-100 p-1">
            {(['in', 'out'] as const).map((k) => (
              <button key={k} type="button" onClick={() => setP((x) => ({ ...x, kind: k, invoiceId: undefined }))} className={`rounded-lg px-4 py-1.5 text-sm font-semibold cursor-pointer ${p.kind === k ? 'bg-white shadow-sm' : 'text-slate-500'}`}>
                {k === 'in' ? 'Received (In)' : 'Paid (Out)'}
              </button>
            ))}
          </div>
        )}
        <Field label="Party">
          <select className="input" value={p.partyId} disabled={!!invProp} onChange={(e) => setP((x) => ({ ...x, partyId: e.target.value, invoiceId: undefined }))}>
            <option value="">Select party…</option>
            {db.parties.map((x) => <option key={x.id} value={x.id}>{x.name} ({x.type})</option>)}
          </select>
        </Field>
        {p.partyId && !invProp && (
          <Field label="Against invoice (optional)">
            <select className="input" value={p.invoiceId ?? ''} onChange={(e) => {
              const id = e.target.value || undefined
              const due = openInvoices.find((x) => x.i.id === id)?.s.due
              setP((x) => ({ ...x, invoiceId: id, amount: due ?? x.amount }))
            }}>
              <option value="">On account (no specific invoice)</option>
              {openInvoices.map(({ i, s }) => <option key={i.id} value={i.id}>{i.number} — due {money(s.due)}</option>)}
            </select>
          </Field>
        )}
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Amount (₹)"><input autoFocus type="number" className="input num text-lg font-bold" value={p.amount || ''} onChange={(e) => set('amount', Number(e.target.value))} /></Field>
          <Field label="Date"><input type="date" className="input" value={p.date} onChange={(e) => set('date', e.target.value)} /></Field>
        </div>
        <Field label="Mode">
          <div className="flex flex-wrap gap-1.5">
            {(['Cash', 'UPI', 'Bank', 'Card', 'Cheque'] as PayMode[]).map((m) => (
              <button key={m} type="button" onClick={() => set('mode', m)} className={`rounded-lg px-3.5 py-2 text-sm font-semibold ring-1 cursor-pointer ${p.mode === m ? 'bg-brand-700 text-white ring-brand-700' : 'text-slate-600 ring-slate-200 hover:bg-slate-50'}`}>{m}</button>
            ))}
          </div>
        </Field>
        <Field label="Note / reference"><input className="input" value={p.note} onChange={(e) => set('note', e.target.value)} placeholder="UTR, cheque no., etc." /></Field>
      </div>
      {err && <div className="mt-4 rounded-xl bg-rose-50 px-3.5 py-2.5 text-sm text-rose-700">{err}</div>}
    </Modal>
  )
}
