import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { ArrowDownLeft, ArrowUpRight, Pencil, Plus, Trash2, Wallet } from 'lucide-react'
import { useStore } from '../lib/store'
import type { Payment } from '../lib/types'
import { Badge, Button, Empty, MobileRow, PageHeader, SearchInput, Tabs } from '../components/ui'
import { PaymentModal } from '../components/forms'
import { fmtDate, money, money0 } from '../lib/utils'

export default function Payments() {
  const { db, deletePayment } = useStore()
  const [params, setParams] = useSearchParams()
  const [tab, setTab] = useState<'all' | 'in' | 'out'>('all')
  const [q, setQ] = useState('')
  const [modal, setModal] = useState<{ p: Payment | null; kind: 'in' | 'out' } | null>(null)
  useEffect(() => { if (params.get('new')) { setModal({ p: null, kind: 'in' }); setParams({}, { replace: true }) } }, [params, setParams])

  const party = (id: string) => db.parties.find((p) => p.id === id)
  const inv = (id?: string) => db.invoices.find((i) => i.id === id)
  const rows = db.payments
    .filter((p) => tab === 'all' || p.kind === tab)
    .filter((p) => !q || party(p.partyId)?.name.toLowerCase().includes(q.toLowerCase()) || inv(p.invoiceId)?.number.toLowerCase().includes(q.toLowerCase()))
    .sort((a, b) => b.date.localeCompare(a.date))
  const tin = db.payments.filter((p) => p.kind === 'in').reduce((a, p) => a + p.amount, 0)
  const tout = db.payments.filter((p) => p.kind === 'out').reduce((a, p) => a + p.amount, 0)

  return (
    <div>
      <PageHeader title="Payments" subtitle="Money received from customers and paid to suppliers"
        actions={<>
          <Button variant="secondary" icon={ArrowUpRight} onClick={() => setModal({ p: null, kind: 'out' })}>Payment Out</Button>
          <Button icon={ArrowDownLeft} onClick={() => setModal({ p: null, kind: 'in' })}>Payment In</Button>
        </>} />
      <div className="mb-5 grid grid-cols-3 gap-2 sm:gap-4">
        <div className="card px-3 py-3 sm:px-5 sm:py-4"><div className="truncate text-[11px] text-slate-500 sm:text-xs">Total received</div><div className="num truncate text-sm font-bold sm:text-xl text-emerald-600">{money(tin)}</div></div>
        <div className="card px-3 py-3 sm:px-5 sm:py-4"><div className="truncate text-[11px] text-slate-500 sm:text-xs">Total paid</div><div className="num truncate text-sm font-bold sm:text-xl text-rose-600">{money(tout)}</div></div>
        <div className="card px-3 py-3 sm:px-5 sm:py-4"><div className="truncate text-[11px] text-slate-500 sm:text-xs">Net</div><div className="num truncate text-sm font-bold sm:text-xl">{money(tin - tout)}</div></div>
      </div>
      <div className="card overflow-hidden">
        <div className="flex flex-col gap-3 border-b border-slate-100 p-3 sm:p-4 md:flex-row md:items-center md:justify-between">
          <Tabs value={tab} onChange={setTab} options={[{ value: 'all', label: 'All' }, { value: 'in', label: 'Received' }, { value: 'out', label: 'Paid' }]} />
          <SearchInput value={q} onChange={setQ} placeholder="Search party or invoice…" />
        </div>
        {rows.length === 0 ? <Empty icon={Wallet} title="No payments" text="Record payments to keep balances accurate." action={<Button icon={Plus} onClick={() => setModal({ p: null, kind: 'in' })}>Record payment</Button>} /> : (
          <>
          <div className="divide-y divide-slate-100 md:hidden">
            {rows.map((p) => (
              <MobileRow key={p.id} onClick={() => setModal({ p, kind: p.kind })}
                left={<div className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl ${p.kind === 'in' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>{p.kind === 'in' ? <ArrowDownLeft size={18} /> : <ArrowUpRight size={18} />}</div>}
                title={party(p.partyId)?.name ?? '—'} subtitle={`${fmtDate(p.date)} · ${p.mode}${inv(p.invoiceId) ? ` · ${inv(p.invoiceId)!.number}` : ''}`}
                right={<div className={`num text-sm font-bold ${p.kind === 'in' ? 'text-emerald-600' : 'text-rose-600'}`}>{p.kind === 'in' ? '+' : '−'}{money0(p.amount)}</div>} />
            ))}
          </div>
          <div className="hidden overflow-x-auto md:block">
            <table className="w-full min-w-[720px]">
              <thead className="bg-slate-50/60"><tr><th className="th">Date</th><th className="th">Party</th><th className="th">Against</th><th className="th">Mode</th><th className="th text-right">Amount</th><th className="th w-24" /></tr></thead>
              <tbody className="divide-y divide-slate-100">
                {rows.map((p) => (
                  <tr key={p.id} className="group hover:bg-slate-50/60">
                    <td className="td whitespace-nowrap text-slate-600">{fmtDate(p.date)}</td>
                    <td className="td"><div className="flex items-center gap-2.5">
                      <div className={`grid h-8 w-8 place-items-center rounded-lg ${p.kind === 'in' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>{p.kind === 'in' ? <ArrowDownLeft size={16} /> : <ArrowUpRight size={16} />}</div>
                      <div><div className="font-semibold">{party(p.partyId)?.name ?? '—'}</div>{p.note && <div className="text-xs text-slate-500">{p.note}</div>}</div>
                    </div></td>
                    <td className="td">{inv(p.invoiceId) ? <Link to={`/app/invoice/${p.invoiceId}`} className="font-mono text-xs font-semibold text-brand-700 hover:underline">{inv(p.invoiceId)!.number}</Link> : <span className="text-xs text-slate-400">On account</span>}</td>
                    <td className="td"><Badge>{p.mode}</Badge></td>
                    <td className={`td num text-right font-bold ${p.kind === 'in' ? 'text-emerald-600' : 'text-rose-600'}`}>{p.kind === 'in' ? '+' : '−'} {money(p.amount)}</td>
                    <td className="td"><div className="flex justify-end gap-1 opacity-60 group-hover:opacity-100">
                      <button onClick={() => setModal({ p, kind: p.kind })} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 cursor-pointer"><Pencil size={15} /></button>
                      <button onClick={() => deletePayment(p.id)} className="rounded-lg p-2 text-slate-500 hover:bg-rose-50 hover:text-rose-600 cursor-pointer"><Trash2 size={15} /></button>
                    </div></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          </>
        )}
      </div>
      <PaymentModal open={!!modal} onClose={() => setModal(null)} kind={modal?.kind} initial={modal?.p} />
    </div>
  )
}
