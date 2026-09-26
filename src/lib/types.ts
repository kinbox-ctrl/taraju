export type PartyType = 'customer' | 'supplier'
export type InvoiceKind = 'sale' | 'purchase'
export type PayMode = 'Cash' | 'UPI' | 'Bank' | 'Card' | 'Cheque'

export interface Business {
  name: string
  gstin: string
  state: string
  address: string
  phone: string
  email: string
  invoicePrefix: string
  bankName: string
  accountNo: string
  ifsc: string
  upiId: string
  terms: string
}

export interface Party {
  id: string
  type: PartyType
  name: string
  gstin: string
  phone: string
  email: string
  state: string
  address: string
  openingBalance: number
  createdAt: string
}

export interface Item {
  id: string
  name: string
  sku: string
  hsn: string
  category: string
  unit: string
  salePrice: number
  purchasePrice: number
  gstRate: number
  openingStock: number
  lowStockAt: number
}

export interface InvoiceLine {
  itemId: string
  name: string
  hsn: string
  unit: string
  qty: number
  rate: number
  discount: number
  gstRate: number
}

export interface Invoice {
  id: string
  kind: InvoiceKind
  number: string
  date: string
  dueDate: string
  partyId: string
  lines: InvoiceLine[]
  notes: string
  createdAt: string
}

export interface Payment {
  id: string
  kind: 'in' | 'out'
  partyId: string
  invoiceId?: string
  amount: number
  date: string
  mode: PayMode
  note: string
}

export interface Expense {
  id: string
  date: string
  category: string
  amount: number
  mode: PayMode
  note: string
}

export interface DB {
  business: Business
  parties: Party[]
  items: Item[]
  invoices: Invoice[]
  payments: Payment[]
  expenses: Expense[]
}
