import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Building2, CheckCircle2, Database, Landmark, PartyPopper, RotateCcw, Save } from 'lucide-react'
import { useStore } from '../lib/store'
import type { Business } from '../lib/types'
import { Button, Field, Modal, PageHeader, useToast } from '../components/ui'
import { STATES } from '../lib/utils'
import { demoDB, emptyDB } from '../lib/seed'

export default function Settings() {
  const { db, saveBusiness, replaceDb } = useStore()
  const toast = useToast()
  const [params] = useSearchParams()
  const [b, setB] = useState<Business>(db.business)
  const [saved, setSaved] = useState(false)
  const [reset, setReset] = useState<'demo' | 'empty' | null>(null)
  const set = (k: keyof Business) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => { setB({ ...b, [k]: e.target.value }); setSaved(false) }

  const save = () => { saveBusiness(b); toast('Settings saved'); setSaved(true); setTimeout(() => setSaved(false), 2500) }
  const exportJson = () => {
    const a = document.createElement('a')
    a.href = URL.createObjectURL(new Blob([JSON.stringify(db, null, 2)], { type: 'application/json' }))
    a.download = `taraju-backup-${new Date().toISOString().slice(0, 10)}.json`
    a.click()
  }
  const importJson = (f: File) => f.text().then((t) => { try { const d = JSON.parse(t); if (d.business && d.invoices) { replaceDb(d); setB(d.business) } } catch { /* invalid file */ } })

  return (
    <div className="max-w-4xl">
      {params.get('welcome') && (
        <div className="mb-6 flex items-start gap-3 rounded-2xl bg-gradient-to-r from-brand-700 to-brand-900 p-5 text-white">
          <PartyPopper className="shrink-0 text-gold-400" />
          <div><div className="font-bold">Welcome to Taraju!</div><div className="text-sm text-brand-100">Add your GSTIN, state and bank details below — they’ll appear on every invoice you create.</div></div>
        </div>
      )}
      <PageHeader title="Settings" subtitle="Business profile, invoice defaults and data"
        actions={<Button icon={saved ? CheckCircle2 : Save} onClick={save}>{saved ? 'Saved' : 'Save changes'}</Button>} />

      <div className="space-y-6">
        <section className="card p-6">
          <h2 className="mb-5 flex items-center gap-2 font-bold"><Building2 size={18} className="text-brand-600" /> Business profile</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Business name"><input className="input" value={b.name} onChange={set('name')} /></Field>
            <Field label="GSTIN"><input className="input font-mono uppercase" value={b.gstin} onChange={(e) => setB({ ...b, gstin: e.target.value.toUpperCase().slice(0, 15) })} placeholder="07ABCDE1234F1Z5" /></Field>
            <Field label="State"><select className="input" value={b.state} onChange={set('state')}>{STATES.map((s) => <option key={s}>{s}</option>)}</select></Field>
            <Field label="Phone"><input className="input" value={b.phone} onChange={set('phone')} /></Field>
            <Field label="Email"><input className="input" value={b.email} onChange={set('email')} /></Field>
            <Field label="Invoice prefix"><input className="input font-mono uppercase" value={b.invoicePrefix} onChange={set('invoicePrefix')} /></Field>
            <Field label="Address" className="sm:col-span-2"><textarea rows={2} className="input" value={b.address} onChange={set('address')} /></Field>
          </div>
        </section>

        <section className="card p-6">
          <h2 className="mb-5 flex items-center gap-2 font-bold"><Landmark size={18} className="text-brand-600" /> Bank & payment details</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Bank name"><input className="input" value={b.bankName} onChange={set('bankName')} /></Field>
            <Field label="Account number"><input className="input font-mono" value={b.accountNo} onChange={set('accountNo')} /></Field>
            <Field label="IFSC"><input className="input font-mono uppercase" value={b.ifsc} onChange={set('ifsc')} /></Field>
            <Field label="UPI ID"><input className="input font-mono" value={b.upiId} onChange={set('upiId')} placeholder="name@bank" /></Field>
            <Field label="Default terms on invoice" className="sm:col-span-2"><textarea rows={2} className="input" value={b.terms} onChange={set('terms')} /></Field>
          </div>
        </section>

        <section className="card p-6">
          <h2 className="mb-2 flex items-center gap-2 font-bold"><Database size={18} className="text-brand-600" /> Data</h2>
          <p className="mb-5 text-sm text-slate-500">This MVP stores your books in this browser. Download a backup regularly.</p>
          <div className="flex flex-wrap gap-2">
            <Button variant="secondary" onClick={exportJson}>Download backup</Button>
            <label className="inline-flex h-10 cursor-pointer items-center rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold hover:bg-slate-50">
              Restore backup<input type="file" accept="application/json" className="hidden" onChange={(e) => e.target.files?.[0] && importJson(e.target.files[0])} />
            </label>
            <Button variant="secondary" icon={RotateCcw} onClick={() => setReset('demo')}>Load demo data</Button>
            <Button variant="ghost" className="text-rose-600" onClick={() => setReset('empty')}>Start fresh</Button>
          </div>
        </section>
      </div>

      <Modal open={!!reset} onClose={() => setReset(null)} title={reset === 'demo' ? 'Load demo data?' : 'Erase all data?'}
        footer={<><Button variant="secondary" onClick={() => setReset(null)}>Cancel</Button><Button variant="danger" onClick={() => { const d = reset === 'demo' ? demoDB() : emptyDB(db.business.name); replaceDb(d); setB(d.business); setReset(null) }}>Yes, replace</Button></>}>
        <p className="text-sm text-slate-600">All current invoices, parties, items, payments and expenses will be replaced. Download a backup first if you need them.</p>
      </Modal>
    </div>
  )
}
