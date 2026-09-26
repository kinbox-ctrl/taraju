import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Download, Plus, Users } from 'lucide-react'
import { useStore } from '../lib/store'
import type { PartyType } from '../lib/types'
import { Avatar, Button, Empty, MobileRow, PageHeader, SearchInput, Tabs } from '../components/ui'
import { PartyModal } from '../components/forms'
import { downloadCSV, money, partyBalance } from '../lib/utils'

export default function Parties() {
  const { db } = useStore()
  const navigate = useNavigate()
  const [params, setParams] = useSearchParams()
  const [tab, setTab] = useState<PartyType>('customer')
  const [q, setQ] = useState('')
  const [open, setOpen] = useState(false)
  useEffect(() => { if (params.get('new')) { setOpen(true); setParams({}, { replace: true }) } }, [params, setParams])

  const rows = db.parties.filter((p) => p.type === tab).map((p) => ({ p, b: partyBalance(db, p) }))
    .filter(({ p }) => !q || [p.name, p.phone, p.gstin].some((x) => x.toLowerCase().includes(q.toLowerCase())))
    .sort((a, b) => Math.abs(b.b) - Math.abs(a.b))
  const all = db.parties.map((p) => partyBalance(db, p))
  const receivable = all.filter((b) => b > 0).reduce((a, b) => a + b, 0)
  const payable = all.filter((b) => b < 0).reduce((a, b) => a - b, 0)

  return (
    <div>
      <PageHeader title="Parties" subtitle="Customers and suppliers with live outstanding balances"
        actions={<>
          <Button variant="secondary" icon={Download} onClick={() => downloadCSV('parties.csv', [['Name', 'Type', 'GSTIN', 'Phone', 'State', 'Balance'], ...db.parties.map((p) => [p.name, p.type, p.gstin, p.phone, p.state, partyBalance(db, p)])])}>Export</Button>
          <Button icon={Plus} onClick={() => setOpen(true)}>Add Party</Button>
        </>} />
      <div className="mb-5 grid grid-cols-2 gap-3 sm:gap-4">
        <div className="card flex items-center justify-between px-4 py-3 sm:px-5 sm:py-4"><div><div className="text-xs text-slate-500">You’ll receive</div><div className="num text-base font-bold text-emerald-600 sm:text-xl">{money(receivable)}</div></div><div className="hidden text-3xl sm:block">📥</div></div>
        <div className="card flex items-center justify-between px-4 py-3 sm:px-5 sm:py-4"><div><div className="text-xs text-slate-500">You’ll pay</div><div className="num text-base font-bold text-rose-600 sm:text-xl">{money(payable)}</div></div><div className="hidden text-3xl sm:block">📤</div></div>
      </div>
      <div className="card overflow-hidden">
        <div className="flex flex-col gap-3 border-b border-slate-100 p-3 sm:p-4 md:flex-row md:items-center md:justify-between">
          <Tabs value={tab} onChange={setTab} options={[
            { value: 'customer', label: 'Customers', count: db.parties.filter((p) => p.type === 'customer').length },
            { value: 'supplier', label: 'Suppliers', count: db.parties.filter((p) => p.type === 'supplier').length },
          ]} />
          <SearchInput value={q} onChange={setQ} placeholder="Search name, phone, GSTIN…" />
        </div>
        {rows.length === 0 ? (
          <Empty icon={Users} title={`No ${tab}s found`} text="Add parties to bill them and track their balances." action={<Button icon={Plus} onClick={() => setOpen(true)}>Add {tab}</Button>} />
        ) : (
          <>
          <div className="divide-y divide-slate-100 md:hidden">
            {rows.map(({ p, b }) => (
              <MobileRow key={p.id} onClick={() => navigate(`/app/parties/${p.id}`)} left={<Avatar name={p.name} />}
                title={p.name} subtitle={p.phone || p.gstin || p.state}
                right={<div className={`num text-sm font-bold ${b > 0 ? 'text-emerald-600' : b < 0 ? 'text-rose-600' : 'text-slate-400'}`}>{money(Math.abs(b))}</div>}
                rightSub={<span className="text-[11px] text-slate-400">{b > 0 ? 'to receive' : b < 0 ? 'to pay' : 'settled'}</span>} />
            ))}
          </div>
          <div className="hidden overflow-x-auto md:block">
            <table className="w-full min-w-[640px]">
              <thead className="bg-slate-50/60"><tr><th className="th">Name</th><th className="th">GSTIN</th><th className="th">Phone</th><th className="th">State</th><th className="th text-right">Balance</th></tr></thead>
              <tbody className="divide-y divide-slate-100">
                {rows.map(({ p, b }) => (
                  <tr key={p.id} onClick={() => navigate(`/app/parties/${p.id}`)} className="cursor-pointer hover:bg-brand-50/40">
                    <td className="td"><div className="flex items-center gap-3"><Avatar name={p.name} className="h-9 w-9 text-xs" /><span className="font-semibold">{p.name}</span></div></td>
                    <td className="td font-mono text-xs text-slate-600">{p.gstin || <span className="font-sans text-slate-400">Unregistered</span>}</td>
                    <td className="td text-slate-600">{p.phone || '—'}</td>
                    <td className="td text-slate-600">{p.state}</td>
                    <td className="td text-right">
                      <div className={`num font-bold ${b > 0 ? 'text-emerald-600' : b < 0 ? 'text-rose-600' : 'text-slate-400'}`}>{money(Math.abs(b))}</div>
                      <div className="text-[11px] text-slate-400">{b > 0 ? 'to receive' : b < 0 ? 'to pay' : 'settled'}</div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          </>
        )}
      </div>
      <PartyModal open={open} onClose={() => setOpen(false)} defaultType={tab} />
    </div>
  )
}
