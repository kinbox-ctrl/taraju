import { Link, useNavigate } from 'react-router-dom'
import { Area, AreaChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import {
  AlertTriangle, ArrowDownLeft, ArrowRight, ArrowUpRight, FilePlus2, IndianRupee, PackagePlus, ShoppingBag,
  TrendingUp, UserPlus, Wallet,
} from 'lucide-react'
import { useStore } from '../lib/store'
import { Avatar, Badge, CountUp, MobileRow, StatCard, statusTone } from '../components/ui'
import { compact, fmtDate, invoiceSummary, itemStock, lineCalc, money, money0, partyBalance } from '../lib/utils'

const DONUT = ['#0ea673', '#062c60', '#fbbf24', '#0284c7', '#8b5cf6']

export default function Dashboard() {
  const { db, user } = useStore()
  const navigate = useNavigate()
  const now = new Date()
  const ym = (d: string) => d.slice(0, 7)
  const monthKey = (offset: number) => {
    const d = new Date(now.getFullYear(), now.getMonth() + offset, 1)
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
  }
  const thisMonth = monthKey(0)
  const lastMonth = monthKey(-1)

  const sums = db.invoices.map((i) => ({ inv: i, s: invoiceSummary(db, i) }))
  const totalFor = (kind: 'sale' | 'purchase', m: string) => sums.filter((x) => x.inv.kind === kind && ym(x.inv.date) === m).reduce((a, x) => a + x.s.total, 0)
  const salesMonth = totalFor('sale', thisMonth)
  const purchMonth = totalFor('purchase', thisMonth)
  const pct = (a: number, b: number) => (b ? ((a - b) / b) * 100 : null)
  const balances = db.parties.map((p) => ({ p, b: partyBalance(db, p) }))
  const receivable = balances.filter((x) => x.b > 0).reduce((a, x) => a + x.b, 0)
  const payable = balances.filter((x) => x.b < 0).reduce((a, x) => a - x.b, 0)
  const overdueCount = sums.filter((x) => x.inv.kind === 'sale' && x.s.status === 'Overdue').length

  const months = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - 5 + i, 1)
    return { key: monthKey(i - 5), label: d.toLocaleString('en-IN', { month: 'short' }) }
  })
  const series = months.map((m) => ({ month: m.label, Sales: totalFor('sale', m.key), Purchases: totalFor('purchase', m.key) }))

  // daily sales for the last 14 days → sparkline
  const days = Array.from({ length: 14 }, (_, i) => new Date(now.getTime() - (13 - i) * 864e5).toISOString().slice(0, 10))
  const dailySpark = (kind: 'sale' | 'purchase') => days.map((d) => sums.filter((x) => x.inv.kind === kind && x.inv.date <= d && x.inv.date > new Date(new Date(d).getTime() - 7 * 864e5).toISOString().slice(0, 10)).reduce((a, x) => a + x.s.total, 0))

  const cashIn = db.payments.filter((p) => p.kind === 'in' && ym(p.date) === thisMonth).reduce((a, p) => a + p.amount, 0)
  const cashOut = db.payments.filter((p) => p.kind === 'out' && ym(p.date) === thisMonth).reduce((a, p) => a + p.amount, 0)
    + db.expenses.filter((e) => ym(e.date) === thisMonth).reduce((a, e) => a + e.amount, 0)

  const itemSales: Record<string, number> = {}
  for (const { inv } of sums) if (inv.kind === 'sale') for (const l of inv.lines) itemSales[l.name] = (itemSales[l.name] ?? 0) + lineCalc(l).taxable
  const top = Object.entries(itemSales).sort((a, b) => b[1] - a[1])
  const topItems = [...top.slice(0, 4).map(([name, value]) => ({ name, value })), ...(top.length > 4 ? [{ name: 'Others', value: top.slice(4).reduce((a, x) => a + x[1], 0) }] : [])]
  const topTotal = topItems.reduce((a, x) => a + x.value, 0)

  const recent = sums.filter((x) => x.inv.kind === 'sale').sort((a, b) => b.inv.date.localeCompare(a.inv.date)).slice(0, 6)
  const low = db.items.map((i) => ({ i, s: itemStock(db, i) })).filter((x) => x.s <= x.i.lowStockAt).slice(0, 5)
  const topDebtors = balances.filter((x) => x.b > 0 && x.p.type === 'customer').sort((a, b) => b.b - a.b).slice(0, 4)
  const collected = sums.filter((x) => x.inv.kind === 'sale').reduce((a, x) => a + Math.min(x.s.paid, x.s.total), 0)
  const billed = sums.filter((x) => x.inv.kind === 'sale').reduce((a, x) => a + x.s.total, 0)
  const collectRate = billed ? Math.round((collected / billed) * 100) : 0

  const hour = now.getHours()
  const greet = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'

  return (
    <div className="space-y-5 sm:space-y-6">
      {/* Welcome banner */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-brand-700 via-brand-800 to-brand-950 p-5 text-white shadow-xl shadow-brand-900/20 sm:p-7">
        <div className="hero-grid absolute inset-0 opacity-20" />
        <div className="absolute -right-16 -top-16 h-64 w-64 rounded-full bg-brand-400/20 blur-3xl" />
        <div className="absolute -bottom-24 left-1/3 h-56 w-56 rounded-full bg-brand-500/25 blur-3xl" />
        <div className="relative flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-medium text-brand-200 sm:text-sm">{now.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
            <h1 className="mt-1 text-2xl font-extrabold tracking-tight sm:text-3xl">{greet}, {user?.name} 👋</h1>
            <p className="mt-2 max-w-md text-sm text-brand-100/80">
              You’ve billed <span className="font-bold text-white"><CountUp value={salesMonth} format={money0} duration={1200} /></span> this month
              {pct(salesMonth, totalFor('sale', lastMonth)) !== null && <> — <span className="font-bold text-brand-300">{pct(salesMonth, totalFor('sale', lastMonth))! >= 0 ? '▲' : '▼'} {Math.abs(pct(salesMonth, totalFor('sale', lastMonth))!).toFixed(0)}%</span> vs last month</>}.
            </p>
            {overdueCount > 0 && (
              <Link to="/app/sales?status=Overdue" className="mt-4 inline-flex items-center gap-2 rounded-xl bg-white/10 px-3 py-1.5 text-xs font-semibold ring-1 ring-white/20 backdrop-blur transition hover:bg-white/20 sm:text-sm">
                <AlertTriangle size={15} className="text-amber-300" /> {overdueCount} overdue invoice{overdueCount > 1 ? 's' : ''} need attention <ArrowRight size={14} />
              </Link>
            )}
          </div>
          <div className="grid grid-cols-4 gap-2 sm:gap-3 lg:w-[440px]">
            {[
              { l: 'Invoice', i: FilePlus2, to: '/app/sales/new', primary: true },
              { l: 'Purchase', i: ShoppingBag, to: '/app/purchases/new' },
              { l: 'Party', i: UserPlus, to: '/app/parties?new=1' },
              { l: 'Item', i: PackagePlus, to: '/app/items?new=1' },
            ].map(({ l, i: Icon, to, primary }) => (
              <button key={l} onClick={() => navigate(to)}
                className={`group flex flex-col items-center gap-1.5 rounded-2xl px-1 py-3 text-[11px] font-bold transition hover:-translate-y-0.5 active:scale-95 sm:text-xs cursor-pointer ${primary ? 'btn-shimmer bg-brand-500 text-white shadow-lg shadow-black/20 hover:bg-brand-400' : 'bg-white/10 ring-1 ring-white/15 backdrop-blur hover:bg-white/20'}`}>
                <Icon size={20} className="transition group-hover:scale-110" />+ {l}
              </button>
            ))}
          </div>
        </div>
      </section>

      <div className="stagger grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
        <StatCard label="Sales this month" value={<CountUp value={salesMonth} format={money0} />} icon={TrendingUp} trend={pct(salesMonth, totalFor('sale', lastMonth))} hint="vs last month" spark={dailySpark('sale')} />
        <StatCard label="Purchases" value={<CountUp value={purchMonth} format={money0} />} icon={ShoppingBag} tone="sky" trend={pct(purchMonth, totalFor('purchase', lastMonth))} hint="vs last month" spark={dailySpark('purchase')} />
        <StatCard label="To collect" value={<CountUp value={receivable} format={money0} />} icon={ArrowDownLeft} tone="gold" hint={`${balances.filter((x) => x.b > 0).length} parties`} />
        <StatCard label="To pay" value={<CountUp value={payable} format={money0} />} icon={ArrowUpRight} tone="rose" hint={`${balances.filter((x) => x.b < 0).length} suppliers`} />
      </div>

      <div className="grid gap-5 sm:gap-6 xl:grid-cols-3">
        <div className="card p-4 sm:p-5 xl:col-span-2">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2 className="font-bold">Sales vs Purchases</h2>
              <p className="text-xs text-slate-500">Last 6 months</p>
            </div>
            <div className="flex gap-4 text-xs font-medium text-slate-500">
              <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-brand-500" />Sales</span>
              <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-gold-400" />Purchases</span>
            </div>
          </div>
          <div className="h-56 sm:h-72">
            <ResponsiveContainer>
              <AreaChart data={series} margin={{ left: -12, right: 8, top: 8 }}>
                <defs>
                  <linearGradient id="gs" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#0ea673" stopOpacity={0.35} /><stop offset="1" stopColor="#0ea673" stopOpacity={0} /></linearGradient>
                  <linearGradient id="gp" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#fbbf24" stopOpacity={0.3} /><stop offset="1" stopColor="#fbbf24" stopOpacity={0} /></linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#eef2f6" vertical={false} />
                <XAxis dataKey="month" tickLine={false} axisLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
                <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: '#94a3b8' }} tickFormatter={(v) => compact(v)} />
                <Tooltip formatter={(v) => money(Number(v))} contentStyle={{ borderRadius: 14, border: '1px solid #e2e8f0', fontSize: 12, boxShadow: '0 10px 30px -10px rgba(15,23,42,.2)' }} />
                <Area type="monotone" dataKey="Sales" stroke="#0ea673" strokeWidth={2.5} fill="url(#gs)" animationDuration={1200} activeDot={{ r: 5, strokeWidth: 2, stroke: '#fff' }} />
                <Area type="monotone" dataKey="Purchases" stroke="#f59e0b" strokeWidth={2.5} fill="url(#gp)" animationDuration={1200} activeDot={{ r: 5, strokeWidth: 2, stroke: '#fff' }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="grid gap-5 sm:grid-cols-2 sm:gap-6 xl:grid-cols-1">
          <div className="card overflow-hidden">
            <div className="relative overflow-hidden bg-gradient-to-br from-ink to-brand-950 p-5 text-white">
              <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-brand-500/30 blur-2xl" />
              <div className="relative flex items-center gap-2 text-sm text-brand-200"><Wallet size={16} /> Cash flow this month</div>
              <div className={`num relative mt-2 text-3xl font-extrabold ${cashIn - cashOut < 0 ? 'text-rose-300' : ''}`}><CountUp value={cashIn - cashOut} format={money0} /></div>
            </div>
            <div className="grid grid-cols-2 divide-x divide-slate-100">
              <div className="p-4"><div className="text-xs text-slate-500">Money in</div><div className="num font-bold text-emerald-600">{money0(cashIn)}</div></div>
              <div className="p-4"><div className="text-xs text-slate-500">Money out</div><div className="num font-bold text-rose-600">{money0(cashOut)}</div></div>
            </div>
          </div>
          <div className="card flex items-center gap-5 p-5">
            <div className="relative h-20 w-20 shrink-0">
              <svg viewBox="0 0 36 36" className="h-20 w-20 -rotate-90">
                <circle cx="18" cy="18" r="15.5" fill="none" stroke="#f1f5f9" strokeWidth="4" />
                <circle cx="18" cy="18" r="15.5" fill="none" stroke="url(#cr)" strokeWidth="4" strokeLinecap="round" strokeDasharray={`${collectRate * 0.974} 100`} className="transition-[stroke-dasharray] duration-1000" style={{ animation: 'draw-ring 1.4s .3s cubic-bezier(.2,.7,.2,1) both' }} />
                <defs><linearGradient id="cr"><stop offset="0" stopColor="#34bb8a" /><stop offset="1" stopColor="#062c60" /></linearGradient></defs>
              </svg>
              <div className="num absolute inset-0 grid place-items-center text-sm font-bold"><CountUp value={collectRate} format={(n) => `${Math.round(n)}%`} duration={1400} /></div>
            </div>
            <div>
              <div className="font-bold">Collection rate</div>
              <p className="mt-0.5 text-xs text-slate-500">{money0(collected)} collected of {money0(billed)} billed</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-5 sm:gap-6 xl:grid-cols-3">
        <div className="card overflow-hidden xl:col-span-2">
          <div className="flex items-center justify-between px-4 py-4 sm:px-5"><h2 className="font-bold">Recent invoices</h2><Link to="/app/sales" className="inline-flex items-center gap-1 text-xs font-semibold text-brand-700 hover:gap-1.5 transition-all">View all <ArrowRight size={13} /></Link></div>
          <div className="hidden overflow-x-auto md:block">
            <table className="w-full">
              <thead className="border-y border-slate-100 bg-slate-50/60"><tr><th className="th">Invoice</th><th className="th">Party</th><th className="th">Date</th><th className="th text-right">Amount</th><th className="th">Status</th></tr></thead>
              <tbody className="divide-y divide-slate-100">
                {recent.map(({ inv, s }) => (
                  <tr key={inv.id} onClick={() => navigate(`/app/invoice/${inv.id}`)} className="cursor-pointer transition hover:bg-brand-50/40">
                    <td className="td font-mono text-xs font-semibold text-brand-700">{inv.number}</td>
                    <td className="td"><div className="flex items-center gap-2.5"><Avatar name={s.party?.name ?? '?'} className="h-8 w-8 text-xs" /><span className="font-medium">{s.party?.name ?? '—'}</span></div></td>
                    <td className="td text-slate-500">{fmtDate(inv.date)}</td>
                    <td className="td num text-right font-semibold">{money(s.total)}</td>
                    <td className="td"><Badge tone={statusTone(s.status)}>{s.status}</Badge></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="divide-y divide-slate-100 border-t border-slate-100 md:hidden">
            {recent.map(({ inv, s }) => (
              <MobileRow key={inv.id} onClick={() => navigate(`/app/invoice/${inv.id}`)} left={<Avatar name={s.party?.name ?? '?'} />}
                title={s.party?.name ?? '—'} subtitle={<><span className="font-mono">{inv.number}</span> · {fmtDate(inv.date)}</>}
                right={<div className="num text-sm font-bold">{money0(s.total)}</div>} rightSub={<Badge tone={statusTone(s.status)}>{s.status}</Badge>} />
            ))}
          </div>
          {recent.length === 0 && <p className="p-6 text-center text-sm text-slate-500">No invoices yet — create your first one.</p>}
        </div>

        <div className="grid gap-5 sm:grid-cols-2 sm:gap-6 xl:grid-cols-1">
          <div className="card p-5">
            <h2 className="mb-3 font-bold">Top selling items</h2>
            {topItems.length === 0 ? <p className="text-sm text-slate-500">No sales yet.</p> : (
              <div className="flex items-center gap-4">
                <div className="relative h-28 w-28 shrink-0">
                  <ResponsiveContainer>
                    <PieChart>
                      <Pie data={topItems} dataKey="value" innerRadius={34} outerRadius={54} paddingAngle={3} stroke="none" animationDuration={1000}>
                        {topItems.map((_, i) => <Cell key={i} fill={DONUT[i % DONUT.length]} />)}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="num absolute inset-0 grid place-items-center text-[11px] font-bold">{compact(topTotal)}</div>
                </div>
                <div className="min-w-0 flex-1 space-y-1.5">
                  {topItems.map((t, i) => (
                    <div key={t.name} className="flex items-center gap-2 text-xs">
                      <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: DONUT[i % DONUT.length] }} />
                      <span className="min-w-0 flex-1 truncate text-slate-600">{t.name}</span>
                      <span className="num font-semibold">{Math.round((t.value / topTotal) * 100)}%</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
          <div className="card p-5">
            <div className="mb-3 flex items-center justify-between"><h2 className="font-bold">Top dues</h2><Link to="/app/parties" className="text-xs font-semibold text-brand-700">View all</Link></div>
            {topDebtors.length === 0 && <p className="text-sm text-slate-500">No pending dues. 🎉</p>}
            <div className="space-y-1">
              {topDebtors.map(({ p, b }) => (
                <Link key={p.id} to={`/app/parties/${p.id}`} className="flex items-center gap-3 rounded-xl p-1.5 transition hover:bg-slate-50">
                  <Avatar name={p.name} className="h-9 w-9 text-xs" />
                  <div className="min-w-0 flex-1 truncate text-sm font-semibold">{p.name}</div>
                  <div className="num text-sm font-bold text-amber-600">{money0(b)}</div>
                </Link>
              ))}
            </div>
          </div>
          <div className="card p-5 sm:col-span-2 xl:col-span-1">
            <div className="mb-3 flex items-center justify-between"><h2 className="font-bold">Low stock</h2><Link to="/app/items" className="text-xs font-semibold text-brand-700">Inventory</Link></div>
            {low.length === 0 && <p className="text-sm text-slate-500">All items are well stocked.</p>}
            <div className="space-y-3">
              {low.map(({ i, s }) => (
                <div key={i.id}>
                  <div className="flex justify-between gap-2 text-sm"><span className="truncate font-medium">{i.name}</span><span className={`num shrink-0 font-bold ${s <= 0 ? 'text-rose-600' : 'text-amber-600'}`}>{s} {i.unit}</span></div>
                  <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-slate-100">
                    <div className={`h-full rounded-full ${s <= 0 ? 'bg-rose-500' : 'bg-gradient-to-r from-amber-300 to-amber-500'}`} style={{ width: `${Math.max(4, Math.min(100, (s / (i.lowStockAt * 2)) * 100))}%` }} />
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-5 flex items-center gap-2 rounded-xl bg-brand-50 p-3 text-xs text-brand-800"><IndianRupee size={14} /> Stock value: <span className="num font-bold">{money0(db.items.reduce((a, i) => a + Math.max(0, itemStock(db, i)) * i.purchasePrice, 0))}</span></div>
          </div>
        </div>
      </div>
    </div>
  )
}
