import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Download, FilePlus2, IndianRupee, Mail, MapPin, Pencil, Phone, Trash2, UserX } from 'lucide-react'
import { useStore } from '../lib/store'
import { Avatar, Badge, Button, Empty, Modal } from '../components/ui'
import { PartyModal, PaymentModal } from '../components/forms'
import { downloadCSV, fmtDate, invoiceSummary, money, partyBalance } from '../lib/utils'

export default function PartyLedger() {
  const { id } = useParams()
  const { db, deleteParty } = useStore()
  const navigate = useNavigate()
  const [edit, setEdit] = useState(false)
  const [pay, setPay] = useState(false)
  const [confirm, setConfirm] = useState(false)
  const p = db.parties.find((x) => x.id === id)
  if (!p) return <div className="card"><Empty icon={UserX} title="Party not found" text="It may have been deleted." action={<Button onClick={() => navigate('/app/parties')}>Back</Button>} /></div>

  const isCust = p.type === 'customer'
  const invs = db.invoices.filter((i) => i.partyId === p.id)
  type Entry = { date: string; label: string; ref?: string; to?: string; debit: number; credit: number }
  const entries: Entry[] = [
    ...invs.map((i) => {
      const t = invoiceSummary(db, i).total
      return { date: i.date, label: i.kind === 'sale' ? 'Sales invoice' : 'Purchase bill', ref: i.number, to: `/app/invoice/${i.id}`, debit: i.kind === 'sale' ? t : 0, credit: i.kind === 'purchase' ? t : 0 }
    }),
    ...db.payments.filter((x) => x.partyId === p.id).map((x) => ({
      date: x.date, label: `Payment ${x.kind === 'in' ? 'received' : 'made'} · ${x.mode}`, ref: x.note, debit: x.kind === 'out' ? x.amount : 0, credit: x.kind === 'in' ? x.amount : 0,
    })),
  ].sort((a, b) => a.date.localeCompare(b.date))
  let run = isCust ? p.openingBalance : -p.openingBalance
  const withBal = entries.map((e) => { run += e.debit - e.credit; return { ...e, bal: run } })
  const bal = partyBalance(db, p)
  const canDelete = invs.length === 0 && !db.payments.some((x) => x.partyId === p.id)

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Link to="/app/parties" className="grid h-10 w-10 place-items-center rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"><ArrowLeft size={18} /></Link>
          <Avatar name={p.name} className="h-12 w-12 rounded-2xl text-base" />
          <div>
            <div className="flex flex-wrap items-center gap-2"><h1 className="text-lg font-extrabold sm:text-xl">{p.name}</h1><Badge tone={isCust ? 'brand' : 'blue'}>{p.type}</Badge></div>
            <div className="font-mono text-xs text-slate-500">{p.gstin || 'Unregistered'}</div>
          </div>
        </div>
        <div className="flex w-full flex-wrap gap-2 sm:w-auto">
          <Button variant="gold" className="flex-1 sm:flex-none" icon={IndianRupee} onClick={() => setPay(true)}>{isCust ? 'Receive payment' : 'Make payment'}</Button>
          <Button variant="secondary" icon={FilePlus2} onClick={() => navigate(isCust ? '/app/sales/new' : '/app/purchases/new')}><span className="hidden sm:inline">{isCust ? 'New invoice' : 'New bill'}</span></Button>
          <Button variant="secondary" icon={Pencil} onClick={() => setEdit(true)}><span className="hidden sm:inline">Edit</span></Button>
          <Button variant="ghost" icon={Trash2} onClick={() => setConfirm(true)} title="Delete party" />
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[300px_minmax(0,1fr)]">
        <div className="space-y-4">
          <div className={`card overflow-hidden`}>
            <div className={`p-5 ${bal > 0 ? 'bg-emerald-50' : bal < 0 ? 'bg-rose-50' : 'bg-slate-50'}`}>
              <div className="text-xs font-medium text-slate-600">{bal > 0 ? 'You will receive' : bal < 0 ? 'You will pay' : 'Settled'}</div>
              <div className={`num text-3xl font-extrabold ${bal > 0 ? 'text-emerald-700' : bal < 0 ? 'text-rose-700' : 'text-slate-500'}`}>{money(Math.abs(bal))}</div>
            </div>
            <div className="space-y-3 p-5 text-sm">
              {p.phone && <div className="flex items-center gap-2.5 text-slate-600"><Phone size={15} />{p.phone}</div>}
              {p.email && <div className="flex items-center gap-2.5 text-slate-600"><Mail size={15} />{p.email}</div>}
              <div className="flex items-start gap-2.5 text-slate-600"><MapPin size={15} className="mt-0.5 shrink-0" />{p.address ? `${p.address}, ` : ''}{p.state}</div>
            </div>
          </div>
        </div>

        <div className="card overflow-hidden">
          <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3.5 sm:px-5 sm:py-4">
            <h2 className="font-bold">Ledger statement</h2>
            <Button size="sm" variant="secondary" icon={Download} onClick={() => downloadCSV(`${p.name}-ledger.csv`, [['Date', 'Particulars', 'Ref', 'Debit', 'Credit', 'Balance'], ['', 'Opening balance', '', '', '', isCust ? p.openingBalance : -p.openingBalance], ...withBal.map((e) => [e.date, e.label, e.ref ?? '', e.debit, e.credit, e.bal])])}>CSV</Button>
          </div>
          <div className="divide-y divide-slate-100 md:hidden">
            <div className="flex justify-between bg-slate-50/60 px-4 py-2.5 text-xs text-slate-500"><span>Opening balance</span><span className="num font-semibold text-ink">{money(isCust ? p.openingBalance : -p.openingBalance)}</span></div>
            {withBal.map((e, i) => {
              const body = (
                <div className="flex items-center gap-3 px-4 py-3">
                  <div className={`grid h-9 w-9 shrink-0 place-items-center rounded-xl text-sm font-bold ${e.credit ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-600'}`}>{e.credit ? '↓' : '↑'}</div>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-semibold">{e.label}</div>
                    <div className="truncate text-xs text-slate-500">{fmtDate(e.date)}{e.ref && <> · <span className="font-mono">{e.ref}</span></>}</div>
                  </div>
                  <div className="shrink-0 text-right">
                    <div className={`num text-sm font-bold ${e.credit ? 'text-emerald-600' : ''}`}>{e.credit ? `−${money(e.credit)}` : `+${money(e.debit)}`}</div>
                    <div className={`num text-[11px] ${e.bal < 0 ? 'text-rose-500' : 'text-slate-400'}`}>Bal {money(e.bal)}</div>
                  </div>
                </div>
              )
              return e.to ? <Link key={i} to={e.to} className="block active:bg-slate-50">{body}</Link> : <div key={i}>{body}</div>
            })}
          </div>
          <div className="hidden overflow-x-auto md:block">
            <table className="w-full min-w-[640px]">
              <thead className="bg-slate-50/60"><tr><th className="th">Date</th><th className="th">Particulars</th><th className="th text-right">Debit</th><th className="th text-right">Credit</th><th className="th text-right">Balance</th></tr></thead>
              <tbody className="divide-y divide-slate-100">
                <tr className="bg-slate-50/40"><td className="td text-slate-400">—</td><td className="td font-medium text-slate-500">Opening balance</td><td className="td" /><td className="td" /><td className="td num text-right font-semibold">{money(isCust ? p.openingBalance : -p.openingBalance)}</td></tr>
                {withBal.map((e, i) => (
                  <tr key={i} className="hover:bg-slate-50/60">
                    <td className="td whitespace-nowrap text-slate-600">{fmtDate(e.date)}</td>
                    <td className="td">{e.to ? <Link to={e.to} className="font-medium hover:text-brand-700">{e.label} <span className="font-mono text-xs text-brand-700">{e.ref}</span></Link> : <span className="font-medium">{e.label} {e.ref && <span className="text-xs text-slate-400">· {e.ref}</span>}</span>}</td>
                    <td className="td num text-right">{e.debit ? money(e.debit) : ''}</td>
                    <td className="td num text-right text-emerald-700">{e.credit ? money(e.credit) : ''}</td>
                    <td className={`td num text-right font-semibold ${e.bal < 0 ? 'text-rose-600' : ''}`}>{money(e.bal)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {withBal.length === 0 && <p className="p-8 text-center text-sm text-slate-500">No transactions yet.</p>}
          </div>
        </div>
      </div>

      <PartyModal open={edit} onClose={() => setEdit(false)} initial={p} />
      <PaymentModal open={pay} onClose={() => setPay(false)} kind={isCust ? 'in' : 'out'} partyId={p.id} />
      <Modal open={confirm} onClose={() => setConfirm(false)} title="Delete party?"
        footer={<><Button variant="secondary" onClick={() => setConfirm(false)}>Cancel</Button>{canDelete && <Button variant="danger" onClick={() => { deleteParty(p.id); navigate('/app/parties') }}>Delete</Button>}</>}>
        <p className="text-sm text-slate-600">{canDelete ? `${p.name} will be permanently removed.` : `${p.name} has invoices or payments. Delete those first to keep your books balanced.`}</p>
      </Modal>
    </div>
  )
}
