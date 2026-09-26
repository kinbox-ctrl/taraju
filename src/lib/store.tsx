import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import type { DB, Expense, Invoice, Item, Party, Payment, Business } from './types'
import { demoDB, emptyDB } from './seed'
import { uid } from './utils'

const DB_KEY = 'taraju.db.v1'
const USER_KEY = 'taraju.user.v1'

export interface User { name: string; email: string }

function load<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key)
    return raw ? (JSON.parse(raw) as T) : null
  } catch {
    return null
  }
}
function save(key: string, value: unknown) {
  try {
    if (value === null) localStorage.removeItem(key)
    else localStorage.setItem(key, JSON.stringify(value))
  } catch { /* storage unavailable */ }
}

function makeStore(db: DB, setDb: (fn: (d: DB) => DB) => void) {
  const upsert = <K extends 'parties' | 'items' | 'invoices' | 'payments' | 'expenses'>(key: K) =>
    (rec: DB[K][number]) => {
      const withId = { ...rec, id: rec.id || uid() } as DB[K][number]
      setDb((d) => {
        const list = d[key] as DB[K][number][]
        const exists = list.some((x) => x.id === withId.id)
        return { ...d, [key]: exists ? list.map((x) => (x.id === withId.id ? withId : x)) : [withId, ...list] }
      })
      return withId
    }
  const remove = (key: 'parties' | 'items' | 'invoices' | 'payments' | 'expenses') => (id: string) =>
    setDb((d) => {
      const next = { ...d, [key]: (d[key] as { id: string }[]).filter((x) => x.id !== id) } as DB
      if (key === 'invoices') next.payments = next.payments.filter((p) => p.invoiceId !== id)
      return next
    })
  return {
    db,
    saveParty: upsert('parties') as (p: Party) => Party,
    saveItem: upsert('items') as (i: Item) => Item,
    saveInvoice: upsert('invoices') as (i: Invoice) => Invoice,
    savePayment: upsert('payments') as (p: Payment) => Payment,
    saveExpense: upsert('expenses') as (e: Expense) => Expense,
    deleteParty: remove('parties'),
    deleteItem: remove('items'),
    deleteInvoice: remove('invoices'),
    deletePayment: remove('payments'),
    deleteExpense: remove('expenses'),
    saveBusiness: (b: Business) => setDb((d) => ({ ...d, business: b })),
    replaceDb: (next: DB) => setDb(() => next),
  }
}

type Store = ReturnType<typeof makeStore> & {
  user: User | null
  login: (u: User, opts?: { demo?: boolean; businessName?: string }) => void
  logout: () => void
}

const Ctx = createContext<Store | null>(null)

export function StoreProvider({ children }: { children: ReactNode }) {
  const [db, setDbState] = useState<DB>(() => load<DB>(DB_KEY) ?? demoDB())
  const [user, setUser] = useState<User | null>(() => load<User>(USER_KEY))

  useEffect(() => save(DB_KEY, db), [db])
  useEffect(() => save(USER_KEY, user), [user])

  const value = useMemo<Store>(() => ({
    ...makeStore(db, (fn) => setDbState(fn)),
    user,
    login: (u, opts) => {
      if (opts?.demo) setDbState(demoDB())
      else if (opts?.businessName) setDbState(emptyDB(opts.businessName))
      setUser(u)
    },
    logout: () => setUser(null),
  }), [db, user])

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export function useStore() {
  const s = useContext(Ctx)
  if (!s) throw new Error('useStore outside provider')
  return s
}
