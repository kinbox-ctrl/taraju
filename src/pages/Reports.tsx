import { useState } from 'react'
import { Bar, BarChart, Cell, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { Download } from 'lucide-react'
import { useStore } from '../lib/store'
import { Button, PageHeader, Tabs } from '../components/ui'
import { compact, downloadCSV, fmtDate, invoiceSummary, itemStock, money, round2 } from '../lib/utils'

type Range = 'month' | 'last' | 'fy' | 'all'
type Tab = 'pl' | 'gstr1' | 'gstr3b' | 'register' | 'stock'

function rangeOf(r: Range): [string, string] {
  const n = new Date()
  const iso = (d: Date) => new Date(d.getTime() - d.getTimezoneOffset() * 6e4).toISOString().slice(0, 10)
  if (r === 'month') return [iso(new Date(n.getFullYear(), n.getMonth(), 1)), iso(n)]
  if (r === 'last') return [iso(new Date(n.getFullYear(), n.getMonth() - 1, 1)), iso(new Date(n.getFullYear(), n.getMonth(), 0))]
  if (r === 'fy') { const y = n.getMonth() >= 3 ? n.getFullYear() : n.getFullYear() - 1; return [`${y}-04-01`, `${y + 1}-03-31`] }
  return ['0000-01-01', '9999-12-31']
}

export default function Reports() {
  const { db } = useStore()
  const [range, setRange] = useState<Range>('fy')
  const [tab, setTab] = useState<Tab>('pl')
  const [from, to] = rangeOf(range)
  const inRange = (d: string) => d >= from && d <= to

  const invs = db.invoices.filter((i) => inRange(i.date)).map((inv) => ({ inv, s: invoiceSummary(db, inv) }))
  const sales = invs.filter((x) => x.inv.kind === 'sale')
  const purch = invs.filter((x) => x.inv.kind === 'purchase')
  const expenses = db.expenses.filter((e) => inRange(e.date))
  const sum = <T,>(a: T[], f: (x: T) => number) => round2(a.reduce((s, x) => s + f(x), 0))

  const salesTaxable = sum(sales, (x) => x.s.taxable)
  const cogs = sum(sales, (x) => x.inv.lines.reduce((a, l) => a + l.qty * (db.items.find((i) => i.id === l.itemId)?.purchasePrice ?? 0), 0))
  const expTotal = sum(expenses, (e) => e.amount)
  const gross = salesTaxable - cogs
  const net = gross - expTotal

  const out = { taxable: salesTaxable, cgst: sum(sales, (x) => x.s.cgst), sgst: sum(sales, (x) => x.s.sgst), igst: sum(sales, (x) => x.s.igst) }
  const itc = { taxable: sum(purch, (x) => x.s.taxable), cgst: sum(purch, (x) => x.s.cgst), sgst: sum(purch, (x) => x.s.sgst), igst: sum(purch, (x) => x.s.igst) }
  const b2b = sales.filter((x) => x.s.party?.gstin)
  const b2c = sales.filter((x) => !x.s.party?.gstin)

  const hsn: Record<string, { hsn: string; qty: number; taxable: number; tax: number; rate: number }> = {}
  for (const { inv } of sales) for (const l of inv.lines) {
    const k = `${l.hsn}|${l.gstRate}`
    const taxable = l.qty * l.rate * (1 - (l.discount || 0) / 100)
    hsn[k] ??= { hsn: l.hsn || '—', qty: 0, taxable: 0, tax: 0, rate: l.gstRate }
    hsn[k].qty += l.qty; hsn[k].taxable += taxable; hsn[k].tax += (taxable * l.gstRate) / 100
  }

  const plChart = [{ name: 'Revenue', v: salesTaxable }, { name: 'Cost of goods', v: cogs }, { name: 'Expenses', v: expTotal }, { name: 'Net profit', v: net }]

  return (
    <div>
      <PageHeader title="Reports & GST" subtitle={range === 'all' ? 'All time' : `${fmtDate(from)} – ${fmtDate(to)}`}
        actions={<select className="input w-auto" value={range} onChange={(e) => setRange(e.target.value as Range)}>
          <option value="month">This month</option><option value="last">Last month</option><option value="fy">This financial year</option><option value="all">All time</option>
        </select>} />
      <div className="mb-5 max-w-full overflow-x-auto">
        <Tabs value={tab} onChange={setTab} options={[
          { value: 'pl', label: 'Profit & Loss' }, { value: 'gstr1', label: 'GSTR-1' }, { value: 'gstr3b', label: 'GSTR-3B' },
          { value: 'register', label: 'Sales register' }, { value: 'stock', label: 'Stock summary' },
        ]} />
      </div>

      {tab === 'pl' && (
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_380px]">
          <div className="card p-5">
            <h2 className="mb-4 font-bold">Profit overview</h2>
            <div className="h-72">
              <ResponsiveContainer>
                <BarChart data={plChart} margin={{ left: -8 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#eef2f6" vertical={false} />
                  <XAxis dataKey="name" tickLine={false} axisLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
                  <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: '#94a3b8' }} tickFormatter={(v) => compact(v)} />
                  <Tooltip formatter={(v) => money(Number(v))} contentStyle={{ borderRadius: 12, fontSize: 12 }} cursor={{ fill: '#f1f5f9' }} />
                  <Bar dataKey="v" radius={[8, 8, 0, 0]} animationDuration={1000}>{plChart.map((d, i) => <Cell key={i} fill={i === 3 ? (d.v >= 0 ? '#0ea673' : '#e11d48') : i === 0 ? '#062c60' : '#fbbf24'} />)}</Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div className="card p-5">
            <h2 className="mb-4 font-bold">Profit & Loss statement</h2>
            <dl className="space-y-3 text-sm">
              <PL l="Sales (taxable value)" v={salesTaxable} />
              <PL l="Less: Cost of goods sold" v={-cogs} />
              <div className="border-t border-dashed border-slate-200" />
              <PL l="Gross profit" v={gross} strong />
              <div className="text-xs text-slate-500">Gross margin {salesTaxable ? ((gross / salesTaxable) * 100).toFixed(1) : 0}%</div>
              <PL l="Less: Expenses" v={-expTotal} />
              <div className="border-t border-slate-200" />
            </dl>
            <div className={`mt-3 flex justify-between rounded-xl px-4 py-3 font-bold ${net >= 0 ? 'bg-emerald-50 text-emerald-800' : 'bg-rose-50 text-rose-800'}`}><span>Net profit</span><span className="num">{money(net)}</span></div>
          </div>
        </div>
      )}

      {tab === 'gstr1' && (
        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-4">
            {[['B2B invoices', b2b.length], ['B2C invoices', b2c.length], ['Taxable value', money(out.taxable)], ['Total tax', money(out.cgst + out.sgst + out.igst)]].map(([l, v]) => (
              <div key={l as string} className="card px-5 py-4"><div className="text-xs text-slate-500">{l}</div><div className="num text-lg font-bold">{v}</div></div>
            ))}
          </div>
          <ReportTable numFrom={4} title="B2B — invoices to registered parties" onExport={() => downloadCSV('gstr1-b2b.csv', [['GSTIN', 'Party', 'Invoice', 'Date', 'Place of supply', 'Taxable', 'CGST', 'SGST', 'IGST', 'Total'], ...b2b.map(({ inv, s }) => [s.party!.gstin, s.party!.name, inv.number, inv.date, s.party!.state, s.taxable, s.cgst, s.sgst, s.igst, s.total])])}
            head={['GSTIN', 'Party', 'Invoice', 'Date', 'Taxable', 'Tax', 'Total']}
            rows={b2b.map(({ inv, s }) => [<span className="font-mono text-xs">{s.party!.gstin}</span>, s.party!.name, <span className="font-mono text-xs">{inv.number}</span>, fmtDate(inv.date), money(s.taxable), money(s.tax), money(s.total)])} />
          <ReportTable numFrom={1} title="HSN-wise summary" onExport={() => downloadCSV('gstr1-hsn.csv', [['HSN', 'Rate', 'Qty', 'Taxable', 'Tax'], ...Object.values(hsn).map((h) => [h.hsn, h.rate, h.qty, round2(h.taxable), round2(h.tax)])])}
            head={['HSN', 'GST rate', 'Qty', 'Taxable value', 'Tax']}
            rows={Object.values(hsn).map((h) => [<span className="font-mono text-xs">{h.hsn}</span>, `${h.rate}%`, h.qty, money(h.taxable), money(h.tax)])} />
        </div>
      )}

      {tab === 'gstr3b' && (
        <div className="card overflow-hidden">
          <div className="border-b border-slate-100 px-5 py-4"><h2 className="font-bold">GSTR-3B summary</h2><p className="text-xs text-slate-500">Output tax on sales less input tax credit on purchases</p></div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px]">
              <thead className="bg-slate-50/60"><tr><th className="th">Particulars</th><th className="th text-right">Taxable</th><th className="th text-right">CGST</th><th className="th text-right">SGST</th><th className="th text-right">IGST</th></tr></thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                <tr><td className="td font-medium">3.1 Outward taxable supplies</td>{[out.taxable, out.cgst, out.sgst, out.igst].map((v, i) => <td key={i} className="td num text-right">{money(v)}</td>)}</tr>
                <tr><td className="td font-medium">4. Eligible ITC (purchases)</td>{[itc.taxable, itc.cgst, itc.sgst, itc.igst].map((v, i) => <td key={i} className="td num text-right text-emerald-700">{money(v)}</td>)}</tr>
                <tr className="bg-brand-50/60 font-bold"><td className="td">Net tax payable</td><td className="td" />{[out.cgst - itc.cgst, out.sgst - itc.sgst, out.igst - itc.igst].map((v, i) => <td key={i} className={`td num text-right ${v < 0 ? 'text-emerald-700' : ''}`}>{money(v)}</td>)}</tr>
              </tbody>
            </table>
          </div>
          <div className="flex items-center justify-between bg-brand-950 px-5 py-4 text-white">
            <span className="text-sm text-brand-200">Total GST payable (after ITC)</span>
            <span className="num text-xl font-extrabold">{money(Math.max(0, out.cgst + out.sgst + out.igst - itc.cgst - itc.sgst - itc.igst))}</span>
          </div>
        </div>
      )}

      {tab === 'register' && (
        <ReportTable numFrom={3} title="Sales register" onExport={() => downloadCSV('sales-register.csv', [['Invoice', 'Date', 'Party', 'Taxable', 'CGST', 'SGST', 'IGST', 'Total', 'Paid', 'Due'], ...sales.map(({ inv, s }) => [inv.number, inv.date, s.party?.name ?? '', s.taxable, s.cgst, s.sgst, s.igst, s.total, s.paid, s.due])])}
          head={['Invoice', 'Date', 'Party', 'Taxable', 'GST', 'Total', 'Due']}
          rows={sales.sort((a, b) => a.inv.date.localeCompare(b.inv.date)).map(({ inv, s }) => [<span className="font-mono text-xs">{inv.number}</span>, fmtDate(inv.date), s.party?.name ?? '—', money(s.taxable), money(s.tax), money(s.total), money(s.due)])}
          foot={['Total', '', '', money(out.taxable), money(out.cgst + out.sgst + out.igst), money(sum(sales, (x) => x.s.total)), money(sum(sales, (x) => x.s.due))]} />
      )}

      {tab === 'stock' && (
        <ReportTable numFrom={1} title="Stock summary (current)" onExport={() => downloadCSV('stock-summary.csv', [['Item', 'Opening', 'Purchased', 'Sold', 'Closing', 'Value'], ...db.items.map((i) => { const m = moves(i.id); return [i.name, i.openingStock, m.in, m.out, itemStock(db, i), itemStock(db, i) * i.purchasePrice] })])}
          head={['Item', 'Opening', 'Purchased', 'Sold', 'Closing', 'Value']}
          rows={db.items.map((i) => { const m = moves(i.id); const c = itemStock(db, i); return [i.name, i.openingStock, m.in, m.out, <span className={c <= i.lowStockAt ? 'font-bold text-amber-600' : 'font-semibold'}>{c} {i.unit}</span>, money(Math.max(0, c) * i.purchasePrice)] })} />
      )}
    </div>
  )

  function moves(id: string) {
    let i = 0, o = 0
    for (const inv of db.invoices) for (const l of inv.lines) if (l.itemId === id) inv.kind === 'purchase' ? (i += l.qty) : (o += l.qty)
    return { in: i, out: o }
  }
}

function PL({ l, v, strong }: { l: string; v: number; strong?: boolean }) {
  return <div className={`flex justify-between ${strong ? 'font-bold' : 'text-slate-600'}`}><dt>{l}</dt><dd className={`num ${v < 0 ? 'text-rose-600' : ''}`}>{money(v)}</dd></div>
}

function ReportTable({ title, head, rows, foot, onExport, numFrom }: { title: string; head: string[]; rows: React.ReactNode[][]; foot?: React.ReactNode[]; onExport: () => void; numFrom: number }) {
  return (
    <div className="card overflow-hidden">
      <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4"><h2 className="font-bold">{title}</h2><Button size="sm" variant="secondary" icon={Download} onClick={onExport}>Excel / CSV</Button></div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[640px]">
          <thead className="bg-slate-50/60"><tr>{head.map((h, i) => <th key={h} className={`th ${i >= numFrom ? 'text-right' : ''}`}>{h}</th>)}</tr></thead>
          <tbody className="divide-y divide-slate-100">
            {rows.map((r, i) => <tr key={i} className="hover:bg-slate-50/60">{r.map((c, j) => <td key={j} className={`td ${j >= numFrom ? 'num text-right' : ''}`}>{c}</td>)}</tr>)}
            {rows.length === 0 && <tr><td colSpan={head.length} className="p-8 text-center text-sm text-slate-500">No data for this period.</td></tr>}
          </tbody>
          {foot && rows.length > 0 && <tfoot className="border-t-2 border-slate-200 bg-slate-50 font-bold"><tr>{foot.map((c, j) => <td key={j} className={`td ${j >= numFrom ? 'num text-right' : ''}`}>{c}</td>)}</tr></tfoot>}
        </table>
      </div>
    </div>
  )
}
