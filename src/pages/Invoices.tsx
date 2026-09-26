import { useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Download, FileText, Plus, ShoppingCart } from 'lucide-react'
import { useStore } from '../lib/store'
import type { InvoiceKind } from '../lib/types'
import { Avatar, Badge, Button, Empty, MobileRow, PageHeader, SearchInput, Tabs, statusTone } from '../components/ui'
import { downloadCSV, fmtDate, invoiceSummary, money, money0 } from '../lib/utils'

type Status = 'All' | 'Paid' | 'Partial' | 'Unpaid' | 'Overdue'

export default function Invoices({ kind }: { kind: InvoiceKind }) {
  const { db } = useStore()
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const [q, setQ] = useState('')
  const [status, setStatus] = useState<Status>((params.get('status') as Status) || 'All')
  const isSale = kind === 'sale'

  const rows = useMemo(
    () => db.invoices.filter((i) => i.kind === kind).map((inv) => ({ inv, s: invoiceSummary(db, inv) }))
      .sort((a, b) => b.inv.date.localeCompare(a.inv.date) || b.inv.number.localeCompare(a.inv.number)),
    [db, kind],
  )
  const filtered = rows.filter(({ inv, s }) =>
    (status === 'All' || s.status === status) &&
    (!q || inv.number.toLowerCase().includes(q.toLowerCase()) || s.party?.name.toLowerCase().includes(q.toLowerCase())))

  const total = filtered.reduce((a, r) => a + r.s.total, 0)
  const paid = filtered.reduce((a, r) => a + Math.min(r.s.paid, r.s.total), 0)
  const count = (st: Status) => rows.filter((r) => st === 'All' || r.s.status === st).length

  const exportCsv = () =>
    downloadCSV(`${isSale ? 'sales' : 'purchases'}.csv`, [
      ['Number', 'Date', 'Party', 'GSTIN', 'Taxable', 'CGST', 'SGST', 'IGST', 'Total', 'Paid', 'Due', 'Status'],
      ...filtered.map(({ inv, s }) => [inv.number, inv.date, s.party?.name ?? '', s.party?.gstin ?? '', s.taxable, s.cgst, s.sgst, s.igst, s.total, s.paid, s.due, s.status]),
    ])

  return (
    <div>
      <PageHeader
        title={isSale ? 'Sales & Invoices' : 'Purchases'}
        subtitle={isSale ? 'All tax invoices issued to your customers' : 'Bills received from your suppliers'}
        actions={<>
          <Button variant="secondary" icon={Download} onClick={exportCsv}>Export</Button>
          <Button icon={Plus} onClick={() => navigate(isSale ? '/app/sales/new' : '/app/purchases/new')}>{isSale ? 'New Invoice' : 'New Purchase'}</Button>
        </>}
      />

      <div className="mb-5 grid grid-cols-3 gap-2 sm:gap-4">
        {[['Total', total, 'text-ink'], [isSale ? 'Received' : 'Paid', paid, 'text-emerald-600'], ['Balance due', total - paid, 'text-amber-600']].map(([l, v, c]) => (
          <div key={l as string} className="card px-3 py-3 sm:px-5 sm:py-4">
            <div className="truncate text-[11px] font-medium text-slate-500 sm:text-xs">{l}</div>
            <div className={`num mt-1 truncate text-sm font-bold sm:text-xl ${c}`}><span className="sm:hidden">{money0(v as number)}</span><span className="hidden sm:inline">{money(v as number)}</span></div>
          </div>
        ))}
      </div>

      <div className="card overflow-hidden">
        <div className="flex flex-col-reverse gap-3 border-b border-slate-100 p-3 sm:p-4 md:flex-row md:items-center md:justify-between">
          <div className="max-w-full overflow-x-auto">
            <Tabs value={status} onChange={setStatus} options={(['All', 'Paid', 'Partial', 'Unpaid', 'Overdue'] as Status[]).map((s) => ({ value: s, label: s, count: count(s) }))} />
          </div>
          <SearchInput value={q} onChange={setQ} placeholder="Search number or party…" />
        </div>
        {filtered.length === 0 ? (
          <Empty
            icon={isSale ? FileText : ShoppingCart}
            title={rows.length ? 'No matches' : isSale ? 'No invoices yet' : 'No purchases yet'}
            text={rows.length ? 'Try a different search or filter.' : isSale ? 'Create your first GST invoice in seconds.' : 'Record supplier bills to keep stock and payables up to date.'}
            action={!rows.length && <Button icon={Plus} onClick={() => navigate(isSale ? '/app/sales/new' : '/app/purchases/new')}>Create</Button>}
          />
        ) : (
          <>
          <div className="divide-y divide-slate-100 md:hidden">
            {filtered.map(({ inv, s }) => (
              <MobileRow key={inv.id} onClick={() => navigate(`/app/invoice/${inv.id}`)} left={<Avatar name={s.party?.name ?? '?'} />}
                title={s.party?.name ?? 'Unknown party'} subtitle={<><span className="font-mono">{inv.number}</span> · {fmtDate(inv.date)}</>}
                right={<div className="num text-sm font-bold">{money(s.total)}</div>}
                rightSub={s.due > 0 && s.status !== 'Unpaid' ? <span className="num text-[11px] font-semibold text-amber-600">Due {money0(s.due)}</span> : <Badge tone={statusTone(s.status)}>{s.status}</Badge>} />
            ))}
          </div>
          <div className="hidden overflow-x-auto md:block">
            <table className="w-full min-w-[760px]">
              <thead className="bg-slate-50/60"><tr>
                <th className="th">Number</th><th className="th">Party</th><th className="th">Date</th><th className="th">Due</th>
                <th className="th text-right">Amount</th><th className="th text-right">Balance</th><th className="th">Status</th>
              </tr></thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map(({ inv, s }) => (
                  <tr key={inv.id} onClick={() => navigate(`/app/invoice/${inv.id}`)} className="cursor-pointer transition hover:bg-brand-50/40">
                    <td className="td font-mono text-xs font-semibold text-brand-700">{inv.number}</td>
                    <td className="td"><div className="flex items-center gap-3"><Avatar name={s.party?.name ?? '?'} className="h-9 w-9 text-xs" /><div>
                      <div className="font-semibold">{s.party?.name ?? 'Unknown party'}</div>
                      <div className="text-xs text-slate-500">{s.party?.gstin || s.party?.phone || '—'}</div>
                    </div></div></td>
                    <td className="td text-slate-600">{fmtDate(inv.date)}</td>
                    <td className="td text-slate-600">{fmtDate(inv.dueDate)}</td>
                    <td className="td num text-right font-semibold">{money(s.total)}</td>
                    <td className={`td num text-right ${s.due > 0 ? 'font-semibold text-amber-600' : 'text-slate-400'}`}>{money(s.due)}</td>
                    <td className="td"><Badge tone={statusTone(s.status)}>{s.status}</Badge></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          </>
        )}
      </div>
    </div>
  )
}
