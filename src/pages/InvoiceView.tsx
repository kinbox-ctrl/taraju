import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Copy, IndianRupee, MessageCircle, Pencil, Printer, Trash2 } from 'lucide-react'
import { useStore } from '../lib/store'
import { Badge, Button, Empty, Modal, statusTone, useToast } from '../components/ui'
import { PaymentModal } from '../components/forms'
import { amountInWords, fmtDate, invoiceSummary, lineCalc, money, nextInvoiceNumber, today, addDays, uid } from '../lib/utils'
import { FileX } from 'lucide-react'

export default function InvoiceView() {
  const { id } = useParams()
  const { db, deleteInvoice, deletePayment, saveInvoice } = useStore()
  const toast = useToast()
  const navigate = useNavigate()
  const [payOpen, setPayOpen] = useState(false)
  const [confirm, setConfirm] = useState(false)
  const inv = db.invoices.find((i) => i.id === id)

  if (!inv) return <div className="card"><Empty icon={FileX} title="Invoice not found" text="It may have been deleted." action={<Button onClick={() => navigate('/app/sales')}>Back to invoices</Button>} /></div>

  const s = invoiceSummary(db, inv)
  const b = db.business
  const isSale = inv.kind === 'sale'
  const inter = s.igst > 0 || (!!s.party && s.party.state !== b.state)
  const payments = db.payments.filter((p) => p.invoiceId === inv.id)
  const listPath = isSale ? '/app/sales' : '/app/purchases'

  const share = () => {
    const text = `Hello ${s.party?.name ?? ''},\n\nInvoice ${inv.number} dated ${fmtDate(inv.date)} for ${money(s.total)} from ${b.name}.${s.due > 0 ? `\nBalance due: ${money(s.due)} by ${fmtDate(inv.dueDate)}.` : '\nFully paid — thank you!'}${b.upiId && s.due > 0 ? `\n\nPay via UPI: upi://pay?pa=${b.upiId}&pn=${encodeURIComponent(b.name)}&am=${s.due}&cu=INR` : ''}\n\nThank you for your business!`
    const phone = (s.party?.phone ?? '').replace(/\D/g, '')
    window.open(`https://wa.me/${phone ? (phone.length === 10 ? '91' + phone : phone) : ''}?text=${encodeURIComponent(text)}`, '_blank')
  }
  const duplicate = () => {
    const copy = saveInvoice({ ...inv, id: uid(), number: nextInvoiceNumber(db, inv.kind), date: today(), dueDate: addDays(today(), 15), createdAt: today() })
    navigate(`/app/invoice/${copy.id}/edit`)
  }

  return (
    <div>
      <div className="no-print mb-5 flex flex-wrap items-center justify-between gap-3 sm:mb-6">
        <div className="flex items-center gap-3">
          <Link to={listPath} className="grid h-10 w-10 place-items-center rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"><ArrowLeft size={18} /></Link>
          <div>
            <div className="flex items-center gap-2"><h1 className="font-mono text-xl font-bold">{inv.number}</h1><Badge tone={statusTone(s.status)}>{s.status}</Badge></div>
            <p className="text-sm text-slate-500">{s.party?.name} · {money(s.total)}</p>
          </div>
        </div>
        <div className="flex w-full flex-wrap gap-2 sm:w-auto">
          {s.due > 0 && <Button variant="gold" icon={IndianRupee} className="flex-1 sm:flex-none" onClick={() => setPayOpen(true)}>Record payment</Button>}
          {isSale && <Button variant="secondary" icon={MessageCircle} onClick={share} title="Share on WhatsApp"><span className="hidden sm:inline">WhatsApp</span></Button>}
          <Button variant="secondary" icon={Printer} onClick={() => window.print()} title="Print / PDF"><span className="hidden sm:inline">Print / PDF</span></Button>
          <Button variant="secondary" icon={Pencil} onClick={() => navigate(`/app/invoice/${inv.id}/edit`)} title="Edit"><span className="hidden sm:inline">Edit</span></Button>
          <Button variant="ghost" icon={Copy} onClick={duplicate} title="Duplicate" />
          <Button variant="ghost" icon={Trash2} onClick={() => setConfirm(true)} className="hover:!text-rose-600" title="Delete" />
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_300px]">
        {/* Printable invoice */}
        <div className="print-area card mx-auto w-full max-w-[860px] overflow-hidden">
          <div className="h-2 bg-gradient-to-r from-brand-800 via-brand-700 to-brand-500" />
          <div className="p-4 sm:p-10">
            <div className="flex flex-wrap items-start justify-between gap-6">
              <div className="flex gap-4">
                <div className="grid h-14 w-14 shrink-0 place-items-center self-start rounded-2xl bg-gradient-to-br from-brand-700 to-brand-900 text-lg font-extrabold text-white shadow-md">
                  {b.name.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]).join('').toUpperCase()}
                </div>
                <div>
                  <div className="text-xl font-extrabold">{b.name}</div>
                  <div className="mt-1 max-w-xs text-xs leading-relaxed text-slate-500">{b.address}</div>
                  <div className="text-xs text-slate-500">{[b.phone, b.email].filter(Boolean).join(' · ')}</div>
                  {b.gstin && <div className="mt-1 font-mono text-xs font-semibold">GSTIN: {b.gstin}</div>}
                </div>
              </div>
              <div className="text-right">
                <div className="text-2xl font-extrabold uppercase tracking-wide text-brand-700">{isSale ? 'Tax Invoice' : 'Purchase Bill'}</div>
                <div className="mt-2 grid grid-cols-[auto_auto] justify-end gap-x-4 gap-y-0.5 text-xs">
                  <span className="text-slate-500">Number</span><span className="font-mono font-semibold">{inv.number}</span>
                  <span className="text-slate-500">Date</span><span className="font-semibold">{fmtDate(inv.date)}</span>
                  <span className="text-slate-500">Due date</span><span className="font-semibold">{fmtDate(inv.dueDate)}</span>
                  <span className="text-slate-500">Place of supply</span><span className="font-semibold">{s.party?.state || b.state}</span>
                </div>
              </div>
            </div>

            <div className="mt-8 rounded-2xl bg-slate-50 p-4">
              <div className="text-[10px] font-bold uppercase tracking-widest text-slate-400">{isSale ? 'Bill to' : 'Supplier'}</div>
              <div className="mt-1 font-bold">{s.party?.name}</div>
              {s.party?.address && <div className="text-xs text-slate-600">{s.party.address}</div>}
              <div className="text-xs text-slate-600">{[s.party?.phone, s.party?.state].filter(Boolean).join(' · ')}</div>
              {s.party?.gstin && <div className="mt-1 font-mono text-xs font-semibold">GSTIN: {s.party.gstin}</div>}
            </div>

            <div className="mt-6 overflow-x-auto">
              <table className="w-full min-w-[600px] text-sm">
                <thead><tr className="border-b-2 border-ink text-[10px] uppercase tracking-wider text-slate-500">
                  <th className="py-2 text-left">#</th><th className="py-2 text-left">Item</th><th className="py-2 text-left">HSN</th>
                  <th className="py-2 text-right">Qty</th><th className="py-2 text-right">Rate</th><th className="py-2 text-right">Disc</th>
                  <th className="py-2 text-right">GST</th><th className="py-2 text-right">Amount</th>
                </tr></thead>
                <tbody>
                  {inv.lines.map((l, i) => {
                    const c = lineCalc(l)
                    return (
                      <tr key={i} className="border-b border-slate-100">
                        <td className="py-2.5 text-slate-400">{i + 1}</td>
                        <td className="py-2.5 font-medium">{l.name}</td>
                        <td className="py-2.5 font-mono text-xs text-slate-500">{l.hsn}</td>
                        <td className="num py-2.5 text-right">{l.qty} <span className="text-[10px] text-slate-400">{l.unit}</span></td>
                        <td className="num py-2.5 text-right">{money(l.rate)}</td>
                        <td className="num py-2.5 text-right text-slate-500">{l.discount ? `${l.discount}%` : '—'}</td>
                        <td className="num py-2.5 text-right text-slate-500">{l.gstRate}%</td>
                        <td className="num py-2.5 text-right font-semibold">{money(c.taxable)}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            <div className="mt-6 grid gap-6 sm:grid-cols-[1fr_280px]">
              <div className="space-y-4">
                <div>
                  <div className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Amount in words</div>
                  <div className="mt-1 text-sm font-semibold">{amountInWords(s.total)}</div>
                </div>
                <table className="w-full text-xs">
                  <thead><tr className="text-slate-500"><th className="py-1 text-left font-semibold">GST rate</th><th className="py-1 text-right font-semibold">Taxable</th>{inter ? <th className="py-1 text-right font-semibold">IGST</th> : <><th className="py-1 text-right font-semibold">CGST</th><th className="py-1 text-right font-semibold">SGST</th></>}</tr></thead>
                  <tbody>
                    {Object.entries(s.slabs).map(([r, v]) => (
                      <tr key={r} className="border-t border-slate-100">
                        <td className="py-1">{r}%</td><td className="num py-1 text-right">{money(v.taxable)}</td>
                        {inter ? <td className="num py-1 text-right">{money(v.tax)}</td> : <><td className="num py-1 text-right">{money(v.tax / 2)}</td><td className="num py-1 text-right">{money(v.tax / 2)}</td></>}
                      </tr>
                    ))}
                  </tbody>
                </table>
                {isSale && (b.bankName || b.upiId) && (
                  <div className="rounded-xl border border-slate-200 p-3 text-xs">
                    <div className="mb-1 font-bold">Bank details</div>
                    {b.bankName && <div className="text-slate-600">{b.bankName} · A/c {b.accountNo} · IFSC {b.ifsc}</div>}
                    {b.upiId && <div className="text-slate-600">UPI: <span className="font-mono font-semibold text-ink">{b.upiId}</span></div>}
                  </div>
                )}
              </div>
              <div>
                <dl className="space-y-1.5 text-sm">
                  <div className="flex justify-between text-slate-600"><dt>Taxable value</dt><dd className="num">{money(s.taxable)}</dd></div>
                  {inter ? <div className="flex justify-between text-slate-600"><dt>IGST</dt><dd className="num">{money(s.igst)}</dd></div> : <>
                    <div className="flex justify-between text-slate-600"><dt>CGST</dt><dd className="num">{money(s.cgst)}</dd></div>
                    <div className="flex justify-between text-slate-600"><dt>SGST</dt><dd className="num">{money(s.sgst)}</dd></div>
                  </>}
                  {s.roundOff !== 0 && <div className="flex justify-between text-slate-400"><dt>Round off</dt><dd className="num">{money(s.roundOff)}</dd></div>}
                </dl>
                <div className="mt-3 flex justify-between rounded-xl bg-brand-700 px-4 py-3 font-bold text-white"><span>Total</span><span className="num">{money(s.total)}</span></div>
                {s.paid > 0 && <div className="mt-2 flex justify-between px-1 text-sm text-emerald-700"><span>Paid</span><span className="num">− {money(s.paid)}</span></div>}
                {s.paid > 0 && <div className="flex justify-between px-1 text-sm font-bold"><span>Balance due</span><span className="num">{money(s.due)}</span></div>}
                <div className="mt-12 border-t border-slate-300 pt-2 text-center text-xs text-slate-500">For {b.name}<br />Authorised signatory</div>
              </div>
            </div>

            {(inv.notes || b.terms) && (
              <div className="mt-8 border-t border-slate-100 pt-4 text-xs text-slate-500">
                <span className="font-semibold text-slate-700">Terms: </span>{inv.notes || b.terms}
              </div>
            )}
            <div className="mt-6 flex items-center justify-center gap-1.5 text-[10px] text-slate-400">Generated with <img src="/brand/wordmark.png" alt="Taraju" className="h-3 w-auto opacity-70" /></div>
          </div>
        </div>

        {/* Side panel */}
        <div className="no-print space-y-4">
          <div className="card p-5">
            <div className="text-xs font-medium text-slate-500">Balance due</div>
            <div className={`num text-2xl font-extrabold ${s.due > 0 ? 'text-amber-600' : 'text-emerald-600'}`}>{money(s.due)}</div>
            <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-emerald-500" style={{ width: `${Math.min(100, (s.paid / (s.total || 1)) * 100)}%` }} /></div>
            <div className="mt-1.5 text-xs text-slate-500">{money(s.paid)} of {money(s.total)} {isSale ? 'received' : 'paid'}</div>
          </div>
          <div className="card p-5">
            <h3 className="mb-3 font-bold">Payment history</h3>
            {payments.length === 0 && <p className="text-sm text-slate-500">No payments recorded yet.</p>}
            <div className="space-y-2.5">
              {payments.map((p) => (
                <div key={p.id} className="group flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2.5">
                  <div><div className="num text-sm font-bold">{money(p.amount)}</div><div className="text-xs text-slate-500">{fmtDate(p.date)} · {p.mode}</div></div>
                  <button onClick={() => deletePayment(p.id)} className="rounded-lg p-1.5 text-slate-300 opacity-0 transition hover:text-rose-600 group-hover:opacity-100 cursor-pointer" title="Remove payment"><Trash2 size={14} /></button>
                </div>
              ))}
            </div>
            {s.due > 0 && <Button variant="secondary" className="mt-4 w-full" icon={IndianRupee} onClick={() => setPayOpen(true)}>Add payment</Button>}
          </div>
          {s.party && <Link to={`/app/parties/${s.party.id}`} className="card block p-5 hover:border-brand-200"><div className="text-xs text-slate-500">Party ledger</div><div className="font-bold text-brand-700">{s.party.name} →</div></Link>}
        </div>
      </div>

      <PaymentModal open={payOpen} onClose={() => setPayOpen(false)} kind={isSale ? 'in' : 'out'} partyId={inv.partyId} invoiceId={inv.id} />
      <Modal open={confirm} onClose={() => setConfirm(false)} title="Delete invoice?"
        footer={<><Button variant="secondary" onClick={() => setConfirm(false)}>Cancel</Button><Button variant="danger" onClick={() => { deleteInvoice(inv.id); toast(`${inv.number} deleted`); navigate(listPath) }}>Delete</Button></>}>
        <p className="text-sm text-slate-600">{inv.number} and its {payments.length} linked payment(s) will be removed. Stock and ledgers will be updated. This can’t be undone.</p>
      </Modal>
    </div>
  )
}
