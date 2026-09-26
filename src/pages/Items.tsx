import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Download, Package, Pencil, Plus, Trash2 } from 'lucide-react'
import { useStore } from '../lib/store'
import type { Item } from '../lib/types'
import { Badge, Button, Empty, MobileRow, Modal, PageHeader, SearchInput, Tabs } from '../components/ui'
import { ItemModal } from '../components/forms'
import { downloadCSV, itemStock, money, money0 } from '../lib/utils'

type F = 'all' | 'low' | 'out'

export default function Items() {
  const { db, deleteItem } = useStore()
  const [params, setParams] = useSearchParams()
  const [q, setQ] = useState('')
  const [f, setF] = useState<F>('all')
  const [modal, setModal] = useState<{ item: Item | null } | null>(null)
  const [del, setDel] = useState<Item | null>(null)
  useEffect(() => { if (params.get('new')) { setModal({ item: null }); setParams({}, { replace: true }) } }, [params, setParams])

  const rows = db.items.map((i) => ({ i, s: itemStock(db, i) }))
  const filtered = rows
    .filter(({ i }) => !q || [i.name, i.sku, i.hsn, i.category].some((x) => x.toLowerCase().includes(q.toLowerCase())))
    .filter(({ i, s }) => f === 'all' || (f === 'out' ? s <= 0 : s > 0 && s <= i.lowStockAt))
  const value = rows.reduce((a, r) => a + Math.max(0, r.s) * r.i.purchasePrice, 0)
  const used = (id: string) => db.invoices.some((inv) => inv.lines.some((l) => l.itemId === id))

  return (
    <div>
      <PageHeader title="Items & Stock" subtitle="Products and services with live stock levels"
        actions={<>
          <Button variant="secondary" icon={Download} onClick={() => downloadCSV('stock.csv', [['Name', 'SKU', 'HSN', 'Unit', 'Sale price', 'Purchase price', 'GST %', 'Stock', 'Stock value'], ...rows.map(({ i, s }) => [i.name, i.sku, i.hsn, i.unit, i.salePrice, i.purchasePrice, i.gstRate, s, Math.max(0, s) * i.purchasePrice])])}>Export</Button>
          <Button icon={Plus} onClick={() => setModal({ item: null })}>Add Item</Button>
        </>} />
      <div className="mb-5 grid grid-cols-3 gap-2 sm:gap-4">
        <div className="card px-3 py-3 sm:px-5 sm:py-4"><div className="truncate text-[11px] text-slate-500 sm:text-xs">Total items</div><div className="num truncate text-sm font-bold sm:text-xl">{db.items.length}</div></div>
        <div className="card px-3 py-3 sm:px-5 sm:py-4"><div className="truncate text-[11px] text-slate-500 sm:text-xs">Stock value (at cost)</div><div className="num truncate text-sm font-bold sm:text-xl text-brand-700">{money0(value)}</div></div>
        <div className="card px-3 py-3 sm:px-5 sm:py-4"><div className="truncate text-[11px] text-slate-500 sm:text-xs">Low / out of stock</div><div className="num truncate text-sm font-bold sm:text-xl text-amber-600">{rows.filter((r) => r.s <= r.i.lowStockAt).length}</div></div>
      </div>
      <div className="card overflow-hidden">
        <div className="flex flex-col gap-3 border-b border-slate-100 p-3 sm:p-4 md:flex-row md:items-center md:justify-between">
          <Tabs value={f} onChange={setF} options={[
            { value: 'all', label: 'All', count: rows.length },
            { value: 'low', label: 'Low stock', count: rows.filter((r) => r.s > 0 && r.s <= r.i.lowStockAt).length },
            { value: 'out', label: 'Out of stock', count: rows.filter((r) => r.s <= 0).length },
          ]} />
          <SearchInput value={q} onChange={setQ} placeholder="Search name, SKU, HSN…" />
        </div>
        {filtered.length === 0 ? (
          <Empty icon={Package} title="No items" text="Add products or services to start billing." action={<Button icon={Plus} onClick={() => setModal({ item: null })}>Add item</Button>} />
        ) : (
          <>
          <div className="divide-y divide-slate-100 md:hidden">
            {filtered.map(({ i, s }) => (
              <MobileRow key={i.id} onClick={() => setModal({ item: i })}
                left={<div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-brand-50 to-brand-100 text-brand-700"><Package size={18} /></div>}
                title={i.name} subtitle={`${money(i.salePrice)} · GST ${i.gstRate}%${i.hsn ? ` · HSN ${i.hsn}` : ''}`}
                right={<div className={`num text-sm font-bold ${s <= 0 ? 'text-rose-600' : s <= i.lowStockAt ? 'text-amber-600' : 'text-ink'}`}>{s}</div>}
                rightSub={<span className="text-[11px] text-slate-400">{i.unit}</span>} />
            ))}
          </div>
          <div className="hidden overflow-x-auto md:block">
            <table className="w-full min-w-[820px]">
              <thead className="bg-slate-50/60"><tr><th className="th">Item</th><th className="th">HSN</th><th className="th text-right">Sale price</th><th className="th text-right">Purchase</th><th className="th">GST</th><th className="th text-right">Stock</th><th className="th w-24" /></tr></thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map(({ i, s }) => (
                  <tr key={i.id} className="group hover:bg-slate-50/60">
                    <td className="td"><div className="font-semibold">{i.name}</div><div className="text-xs text-slate-500">{[i.sku, i.category].filter(Boolean).join(' · ')}</div></td>
                    <td className="td font-mono text-xs text-slate-600">{i.hsn || '—'}</td>
                    <td className="td num text-right font-semibold">{money(i.salePrice)}</td>
                    <td className="td num text-right text-slate-600">{money(i.purchasePrice)}</td>
                    <td className="td"><Badge tone="brand">{i.gstRate}%</Badge></td>
                    <td className="td text-right">
                      <span className={`num font-bold ${s <= 0 ? 'text-rose-600' : s <= i.lowStockAt ? 'text-amber-600' : 'text-ink'}`}>{s}</span> <span className="text-xs text-slate-400">{i.unit}</span>
                    </td>
                    <td className="td">
                      <div className="flex justify-end gap-1 opacity-60 transition group-hover:opacity-100">
                        <button onClick={() => setModal({ item: i })} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-ink cursor-pointer"><Pencil size={15} /></button>
                        <button onClick={() => setDel(i)} className="rounded-lg p-2 text-slate-500 hover:bg-rose-50 hover:text-rose-600 cursor-pointer"><Trash2 size={15} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          </>
        )}
      </div>
      <ItemModal open={!!modal} onClose={() => setModal(null)} initial={modal?.item} />
      <Modal open={!!del} onClose={() => setDel(null)} title="Delete item?"
        footer={<><Button variant="secondary" onClick={() => setDel(null)}>Cancel</Button>{del && !used(del.id) && <Button variant="danger" onClick={() => { deleteItem(del.id); setDel(null) }}>Delete</Button>}</>}>
        <p className="text-sm text-slate-600">{del && used(del.id) ? `${del.name} is used on invoices and can’t be deleted.` : `${del?.name} will be permanently removed.`}</p>
      </Modal>
    </div>
  )
}
