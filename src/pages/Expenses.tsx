import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Pencil, Plus, Receipt, Trash2 } from 'lucide-react'
import { useStore } from '../lib/store'
import type { Expense, PayMode } from '../lib/types'
import { Badge, Button, Empty, Field, MobileRow, Modal, PageHeader, useToast } from '../components/ui'
import { EXPENSE_CATEGORIES, fmtDate, money, today } from '../lib/utils'

const blank = (): Expense => ({ id: '', date: today(), category: 'Rent', amount: 0, mode: 'Cash', note: '' })

export default function Expenses() {
  const { db, saveExpense, deleteExpense } = useStore()
  const toast = useToast()
  const [params, setParams] = useSearchParams()
  const [edit, setEdit] = useState<Expense | null>(null)
  const [err, setErr] = useState('')
  useEffect(() => { if (params.get('new')) { setEdit(blank()); setParams({}, { replace: true }) } }, [params, setParams])

  const rows = [...db.expenses].sort((a, b) => b.date.localeCompare(a.date))
  const total = rows.reduce((a, e) => a + e.amount, 0)
  const byCat = EXPENSE_CATEGORIES.map((c) => ({ c, v: rows.filter((e) => e.category === c).reduce((a, e) => a + e.amount, 0) })).filter((x) => x.v > 0).sort((a, b) => b.v - a.v)

  const save = () => {
    if (!edit) return
    if (!(edit.amount > 0)) return setErr('Enter an amount greater than zero.')
    saveExpense(edit)
    toast(`${edit.category} expense saved`)
    setEdit(null)
  }

  return (
    <div>
      <PageHeader title="Expenses" subtitle="Rent, salaries, bills and other business spending" actions={<Button icon={Plus} onClick={() => { setErr(''); setEdit(blank()) }}>Add Expense</Button>} />
      <div className="grid gap-5 sm:gap-6 lg:grid-cols-[minmax(0,1fr)_300px]">
        <div className="order-2 lg:order-1">
        <div className="card overflow-hidden">
          {rows.length === 0 ? <Empty icon={Receipt} title="No expenses yet" text="Track spending to see your real profit." action={<Button icon={Plus} onClick={() => setEdit(blank())}>Add expense</Button>} /> : (
            <>
            <div className="divide-y divide-slate-100 md:hidden">
              {rows.map((e) => (
                <MobileRow key={e.id} onClick={() => { setErr(''); setEdit(e) }}
                  left={<div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-rose-50 text-rose-600"><Receipt size={18} /></div>}
                  title={e.category} subtitle={`${fmtDate(e.date)} · ${e.mode}${e.note ? ` · ${e.note}` : ''}`}
                  right={<div className="num text-sm font-bold">{money(e.amount)}</div>} />
              ))}
            </div>
            <div className="hidden overflow-x-auto md:block">
              <table className="w-full min-w-[560px]">
                <thead className="bg-slate-50/60"><tr><th className="th">Date</th><th className="th">Category</th><th className="th">Mode</th><th className="th text-right">Amount</th><th className="th w-24" /></tr></thead>
                <tbody className="divide-y divide-slate-100">
                  {rows.map((e) => (
                    <tr key={e.id} className="group hover:bg-slate-50/60">
                      <td className="td whitespace-nowrap text-slate-600">{fmtDate(e.date)}</td>
                      <td className="td"><div className="font-semibold">{e.category}</div>{e.note && <div className="text-xs text-slate-500">{e.note}</div>}</td>
                      <td className="td"><Badge>{e.mode}</Badge></td>
                      <td className="td num text-right font-bold">{money(e.amount)}</td>
                      <td className="td"><div className="flex justify-end gap-1 opacity-60 group-hover:opacity-100">
                        <button onClick={() => { setErr(''); setEdit(e) }} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 cursor-pointer"><Pencil size={15} /></button>
                        <button onClick={() => deleteExpense(e.id)} className="rounded-lg p-2 text-slate-500 hover:bg-rose-50 hover:text-rose-600 cursor-pointer"><Trash2 size={15} /></button>
                      </div></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            </>
          )}
        </div>
        </div>
        <div className="card order-1 h-fit p-5 lg:order-2">
          <div className="text-xs text-slate-500">Total expenses</div>
          <div className="num text-2xl font-extrabold text-rose-600">{money(total)}</div>
          <div className="mt-5 space-y-3">
            {byCat.map(({ c, v }) => (
              <div key={c}>
                <div className="flex justify-between text-sm"><span className="font-medium">{c}</span><span className="num text-slate-600">{money(v)}</span></div>
                <div className="mt-1 h-1.5 rounded-full bg-slate-100"><div className="h-full rounded-full bg-gradient-to-r from-brand-500 to-brand-700" style={{ width: `${(v / total) * 100}%` }} /></div>
              </div>
            ))}
          </div>
        </div>
      </div>
      <Modal open={!!edit} onClose={() => setEdit(null)} title={edit?.id ? 'Edit expense' : 'Add expense'}
        footer={<><Button variant="secondary" onClick={() => setEdit(null)}>Cancel</Button><Button onClick={save}>Save</Button></>}>
        {edit && (
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Category"><select className="input" value={edit.category} onChange={(e) => setEdit({ ...edit, category: e.target.value })}>{EXPENSE_CATEGORIES.map((c) => <option key={c}>{c}</option>)}</select></Field>
            <Field label="Date"><input type="date" className="input" value={edit.date} onChange={(e) => setEdit({ ...edit, date: e.target.value })} /></Field>
            <Field label="Amount (₹)"><input autoFocus type="number" className="input num" value={edit.amount || ''} onChange={(e) => setEdit({ ...edit, amount: Number(e.target.value) })} /></Field>
            <Field label="Mode"><select className="input" value={edit.mode} onChange={(e) => setEdit({ ...edit, mode: e.target.value as PayMode })}>{['Cash', 'UPI', 'Bank', 'Card', 'Cheque'].map((m) => <option key={m}>{m}</option>)}</select></Field>
            <Field label="Note" className="sm:col-span-2"><input className="input" value={edit.note} onChange={(e) => setEdit({ ...edit, note: e.target.value })} /></Field>
            {err && <div className="rounded-xl bg-rose-50 px-3.5 py-2.5 text-sm text-rose-700 sm:col-span-2">{err}</div>}
          </div>
        )}
      </Modal>
    </div>
  )
}
