import type { DB, Invoice, InvoiceLine, Item, Party } from './types'

export const uid = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4)

export const today = () => new Date().toISOString().slice(0, 10)
export const addDays = (d: string, n: number) => {
  const x = new Date(d)
  x.setDate(x.getDate() + n)
  return x.toISOString().slice(0, 10)
}

const inr = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2 })
const inr0 = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 })
export const money = (n: number) => inr.format(round2(n))
export const money0 = (n: number) => inr0.format(Math.round(n))
export const compact = (n: number) => {
  const a = Math.abs(n)
  const s = n < 0 ? '-' : ''
  if (a >= 1e7) return `${s}₹${(a / 1e7).toFixed(2)}Cr`
  if (a >= 1e5) return `${s}₹${(a / 1e5).toFixed(2)}L`
  if (a >= 1e3) return `${s}₹${(a / 1e3).toFixed(1)}K`
  return `${s}₹${a.toFixed(0)}`
}
export const round2 = (n: number) => Math.round((n + Number.EPSILON) * 100) / 100
export const fmtDate = (d: string) =>
  new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })

export const STATES = [
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh', 'Delhi', 'Goa', 'Gujarat', 'Haryana',
  'Himachal Pradesh', 'Jammu and Kashmir', 'Jharkhand', 'Karnataka', 'Kerala', 'Ladakh', 'Madhya Pradesh',
  'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram', 'Nagaland', 'Odisha', 'Puducherry', 'Punjab', 'Rajasthan',
  'Sikkim', 'Tamil Nadu', 'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal',
]
export const GST_RATES = [0, 5, 12, 18, 28]
export const UNITS = ['PCS', 'BOX', 'KG', 'GM', 'LTR', 'MTR', 'DOZ', 'PKT', 'SET', 'NOS']
export const EXPENSE_CATEGORIES = ['Rent', 'Salary', 'Electricity', 'Transport', 'Internet & Phone', 'Office Supplies', 'Marketing', 'Repairs', 'Other']

export function lineCalc(l: InvoiceLine) {
  const gross = l.qty * l.rate
  const taxable = gross - (gross * (l.discount || 0)) / 100
  const tax = (taxable * l.gstRate) / 100
  return { gross, taxable, tax, total: taxable + tax }
}

export function isInterState(db: DB, party?: Party) {
  return !!party && !!party.state && party.state !== db.business.state
}

export function invoiceTotals(inv: Pick<Invoice, 'lines'>, inter: boolean) {
  let taxable = 0
  let tax = 0
  let discount = 0
  const slabs: Record<number, { taxable: number; tax: number }> = {}
  for (const l of inv.lines) {
    const c = lineCalc(l)
    taxable += c.taxable
    tax += c.tax
    discount += c.gross - c.taxable
    slabs[l.gstRate] ??= { taxable: 0, tax: 0 }
    slabs[l.gstRate].taxable += c.taxable
    slabs[l.gstRate].tax += c.tax
  }
  const raw = taxable + tax
  const total = Math.round(raw)
  return {
    taxable: round2(taxable),
    discount: round2(discount),
    tax: round2(tax),
    cgst: inter ? 0 : round2(tax / 2),
    sgst: inter ? 0 : round2(tax / 2),
    igst: inter ? round2(tax) : 0,
    roundOff: round2(total - raw),
    total,
    slabs,
  }
}

export function invoiceSummary(db: DB, inv: Invoice) {
  const party = db.parties.find((p) => p.id === inv.partyId)
  const t = invoiceTotals(inv, isInterState(db, party))
  const paid = db.payments.filter((p) => p.invoiceId === inv.id).reduce((s, p) => s + p.amount, 0)
  const due = Math.max(0, round2(t.total - paid))
  const overdue = due > 0 && inv.dueDate < today()
  const status: 'Paid' | 'Partial' | 'Unpaid' | 'Overdue' =
    due <= 0 ? 'Paid' : overdue ? 'Overdue' : paid > 0 ? 'Partial' : 'Unpaid'
  return { ...t, party, paid, due, status }
}

export function itemStock(db: DB, item: Item) {
  let s = item.openingStock
  for (const inv of db.invoices)
    for (const l of inv.lines) if (l.itemId === item.id) s += inv.kind === 'purchase' ? l.qty : -l.qty
  return s
}

/** Positive = party owes us (receivable), negative = we owe party (payable). */
export function partyBalance(db: DB, party: Party) {
  let bal = party.type === 'customer' ? party.openingBalance : -party.openingBalance
  for (const inv of db.invoices) {
    if (inv.partyId !== party.id) continue
    const t = invoiceTotals(inv, isInterState(db, party)).total
    bal += inv.kind === 'sale' ? t : -t
  }
  for (const p of db.payments) {
    if (p.partyId !== party.id) continue
    bal += p.kind === 'in' ? -p.amount : p.amount
  }
  return round2(bal)
}

export function nextInvoiceNumber(db: DB, kind: 'sale' | 'purchase') {
  const prefix = kind === 'sale' ? db.business.invoicePrefix || 'INV' : 'PUR'
  const nums = db.invoices
    .filter((i) => i.kind === kind)
    .map((i) => parseInt(i.number.replace(/\D/g, '').slice(-4)) || 0)
  const n = (nums.length ? Math.max(...nums) : 0) + 1
  return `${prefix}-${String(n).padStart(4, '0')}`
}

const ONES = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 'Eleven', 'Twelve',
  'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen']
const TENS = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety']
function two(n: number) { return n < 20 ? ONES[n] : `${TENS[Math.floor(n / 10)]} ${ONES[n % 10]}`.trim() }
function three(n: number) {
  const h = Math.floor(n / 100)
  const r = n % 100
  return [h ? `${ONES[h]} Hundred` : '', r ? two(r) : ''].filter(Boolean).join(' ')
}
export function amountInWords(amount: number) {
  let n = Math.floor(amount)
  if (n === 0) return 'Zero Rupees Only'
  const parts: string[] = []
  const cr = Math.floor(n / 1e7); n %= 1e7
  const lk = Math.floor(n / 1e5); n %= 1e5
  const th = Math.floor(n / 1e3); n %= 1e3
  if (cr) parts.push(`${three(cr)} Crore`)
  if (lk) parts.push(`${two(lk)} Lakh`)
  if (th) parts.push(`${two(th)} Thousand`)
  if (n) parts.push(three(n))
  return `${parts.join(' ')} Rupees Only`
}

export function downloadCSV(filename: string, rows: (string | number)[][]) {
  const csv = rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n')
  const a = document.createElement('a')
  a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }))
  a.download = filename
  a.click()
  URL.revokeObjectURL(a.href)
}
