import type { DB, Invoice, InvoiceLine, Item, Payment } from './types'
import { addDays, today } from './utils'

const d = (n: number) => addDays(today(), -n)

export function emptyDB(businessName = 'My Business'): DB {
  return {
    business: {
      name: businessName, gstin: '', state: 'Delhi', address: '', phone: '', email: '',
      invoicePrefix: 'INV', bankName: '', accountNo: '', ifsc: '', upiId: '',
      terms: 'Goods once sold will not be taken back. Subject to local jurisdiction.',
    },
    parties: [], items: [], invoices: [], payments: [], expenses: [],
  }
}

export function demoDB(): DB {
  const items: Item[] = [
    { id: 'i1', name: 'Basmati Rice Premium 5kg', sku: 'RICE-5', hsn: '1006', category: 'Grocery', unit: 'PKT', salePrice: 640, purchasePrice: 470, gstRate: 5, openingStock: 240, lowStockAt: 20 },
    { id: 'i2', name: 'Refined Sunflower Oil 1L', sku: 'OIL-1', hsn: '1512', category: 'Grocery', unit: 'LTR', salePrice: 165, purchasePrice: 124, gstRate: 5, openingStock: 400, lowStockAt: 40 },
    { id: 'i3', name: 'Detergent Powder 1kg', sku: 'DET-1', hsn: '3402', category: 'Home Care', unit: 'PKT', salePrice: 120, purchasePrice: 82, gstRate: 18, openingStock: 160, lowStockAt: 25 },
    { id: 'i4', name: 'Toothpaste 150g', sku: 'TP-150', hsn: '3306', category: 'Personal Care', unit: 'PCS', salePrice: 95, purchasePrice: 64, gstRate: 18, openingStock: 300, lowStockAt: 30 },
    { id: 'i5', name: 'Green Tea 100 bags', sku: 'TEA-100', hsn: '0902', category: 'Beverages', unit: 'BOX', salePrice: 399, purchasePrice: 280, gstRate: 5, openingStock: 28, lowStockAt: 15 },
    { id: 'i6', name: 'LED Bulb 9W', sku: 'LED-9', hsn: '8539', category: 'Electricals', unit: 'PCS', salePrice: 110, purchasePrice: 72, gstRate: 12, openingStock: 120, lowStockAt: 20 },
    { id: 'i7', name: 'Dark Chocolate 100g', sku: 'CHOC-100', hsn: '1806', category: 'Snacks', unit: 'PCS', salePrice: 180, purchasePrice: 118, gstRate: 18, openingStock: 16, lowStockAt: 12 },
    { id: 'i8', name: 'Aerated Drink 2L', sku: 'SODA-2', hsn: '2202', category: 'Beverages', unit: 'PCS', salePrice: 99, purchasePrice: 64, gstRate: 28, openingStock: 180, lowStockAt: 24 },
  ]
  const parties: DB['parties'] = [
    { id: 'c1', type: 'customer', name: 'Sharma General Store', gstin: '07AAKCS1234F1Z5', phone: '9811122233', email: 'sharma.store@example.com', state: 'Delhi', address: 'Shop 14, Lajpat Nagar Market, New Delhi', openingBalance: 2500, createdAt: d(90) },
    { id: 'c2', type: 'customer', name: 'Gupta Traders', gstin: '09AAGFG5678K1Z2', phone: '9899001122', email: 'gupta.traders@example.com', state: 'Uttar Pradesh', address: 'Sector 18, Noida', openingBalance: 0, createdAt: d(80) },
    { id: 'c3', type: 'customer', name: 'Anand Supermart', gstin: '07AADCA9988M1Z9', phone: '9717654321', email: 'accounts@anandmart.example.com', state: 'Delhi', address: 'Rohini Sector 7, Delhi', openingBalance: 0, createdAt: d(60) },
    { id: 'c4', type: 'customer', name: 'Walk-in Customer', gstin: '', phone: '', email: '', state: 'Delhi', address: '', openingBalance: 0, createdAt: d(90) },
    { id: 's1', type: 'supplier', name: 'Metro Wholesale Distributors', gstin: '07AAECM4455P1Z1', phone: '9810098100', email: 'sales@metrowd.example.com', state: 'Delhi', address: 'Naya Bazar, Delhi', openingBalance: 12000, createdAt: d(90) },
    { id: 's2', type: 'supplier', name: 'Haryana Agro Foods', gstin: '06AAHFH2233Q1Z7', phone: '9812345678', email: 'orders@haryanaagro.example.com', state: 'Haryana', address: 'Industrial Area, Karnal', openingBalance: 0, createdAt: d(70) },
  ]
  const L = (id: string, qty: number, discount = 0): InvoiceLine => {
    const it = items.find((i) => i.id === id)!
    return { itemId: id, name: it.name, hsn: it.hsn, unit: it.unit, qty: qty * 2, rate: it.salePrice, discount, gstRate: it.gstRate }
  }
  const P = (id: string, qty: number): InvoiceLine => ({ ...L(id, qty / 2), rate: items.find((i) => i.id === id)!.purchasePrice })

  const sales: [string, number, InvoiceLine[], number][] = [
    ['c1', 58, [L('i1', 10), L('i2', 24)], 1],
    ['c3', 50, [L('i3', 12), L('i4', 20, 5)], 1],
    ['c2', 44, [L('i1', 15), L('i5', 6), L('i6', 20)], 1],
    ['c4', 38, [L('i7', 3), L('i8', 6)], 1],
    ['c1', 31, [L('i2', 30), L('i4', 12)], 0.5],
    ['c3', 26, [L('i1', 8), L('i3', 10), L('i8', 12)], 1],
    ['c2', 20, [L('i6', 40, 10), L('i4', 24)], 0],
    ['c4', 15, [L('i5', 2), L('i7', 4)], 1],
    ['c3', 10, [L('i1', 20), L('i2', 36)], 0.4],
    ['c1', 6, [L('i3', 15), L('i8', 24)], 0],
    ['c2', 3, [L('i1', 12), L('i5', 4)], 0],
    ['c4', 1, [L('i4', 5), L('i8', 3)], 1],
  ]
  const invoices: Invoice[] = []
  const payments: Payment[] = []
  const lineTotal = (ls: InvoiceLine[], _inter: boolean) =>
    Math.round(ls.reduce((s, l) => { const t = l.qty * l.rate * (1 - l.discount / 100); return s + t + (t * l.gstRate) / 100 }, 0))
  sales.forEach(([pid, ago, lines, paidFrac], i) => {
    const id = `sv${i + 1}`
    invoices.push({ id, kind: 'sale', number: `INV-${String(i + 1).padStart(4, '0')}`, date: d(ago), dueDate: addDays(d(ago), 15), partyId: pid, lines, notes: '', createdAt: d(ago) })
    if (paidFrac > 0) payments.push({ id: `pi${i}`, kind: 'in', partyId: pid, invoiceId: id, amount: Math.round(lineTotal(lines, false) * paidFrac), date: addDays(d(ago), paidFrac === 1 ? 0 : 3), mode: i % 3 === 0 ? 'Cash' : i % 3 === 1 ? 'UPI' : 'Bank', note: '' })
  })
  const purchases: [string, number, InvoiceLine[], number][] = [
    ['s1', 55, [P('i1', 40), P('i2', 60), P('i3', 30)], 1],
    ['s2', 35, [P('i1', 30), P('i5', 10)], 1],
    ['s1', 18, [P('i4', 40), P('i6', 50), P('i8', 36)], 0.5],
    ['s2', 5, [P('i2', 50), P('i7', 12)], 0],
  ]
  purchases.forEach(([pid, ago, lines, paidFrac], i) => {
    const id = `pv${i + 1}`
    invoices.push({ id, kind: 'purchase', number: `PUR-${String(i + 1).padStart(4, '0')}`, date: d(ago), dueDate: addDays(d(ago), 30), partyId: pid, lines, notes: '', createdAt: d(ago) })
    if (paidFrac > 0) payments.push({ id: `po${i}`, kind: 'out', partyId: pid, invoiceId: id, amount: Math.round(lineTotal(lines, false) * paidFrac), date: d(ago), mode: 'Bank', note: '' })
  })
  return {
    business: {
      name: 'Kartik Enterprises', gstin: '07ABCDE1234F1Z5', state: 'Delhi',
      address: '21, Chandni Chowk, New Delhi – 110006', phone: '+91 98100 00000', email: 'billing@kartikenterprises.in',
      invoicePrefix: 'INV', bankName: 'HDFC Bank', accountNo: '50100123456789', ifsc: 'HDFC0001234', upiId: 'kartik@hdfcbank',
      terms: 'Goods once sold will not be taken back. Interest @18% p.a. on overdue bills. Subject to Delhi jurisdiction.',
    },
    parties, items, invoices, payments,
    expenses: [
      { id: 'e1', date: d(45), category: 'Rent', amount: 9000, mode: 'Bank', note: 'Shop rent' },
      { id: 'e2', date: d(40), category: 'Electricity', amount: 1850, mode: 'UPI', note: '' },
      { id: 'e3', date: d(28), category: 'Salary', amount: 12000, mode: 'Bank', note: 'Staff salary' },
      { id: 'e4', date: d(15), category: 'Rent', amount: 9000, mode: 'Bank', note: 'Shop rent' },
      { id: 'e5', date: d(8), category: 'Transport', amount: 650, mode: 'Cash', note: 'Delivery tempo' },
      { id: 'e6', date: d(2), category: 'Internet & Phone', amount: 599, mode: 'UPI', note: '' },
    ],
  }
}
