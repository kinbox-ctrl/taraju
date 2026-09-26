import { useEffect, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { ArrowRight, CheckCircle2, Eye, EyeOff, PlayCircle } from 'lucide-react'
import { Logo } from '../components/Logo'
import { Button, Field } from '../components/ui'
import { useStore } from '../lib/store'

export default function Login() {
  const [params] = useSearchParams()
  const [mode, setMode] = useState<'login' | 'signup'>(params.get('mode') === 'signup' ? 'signup' : 'login')
  const [show, setShow] = useState(false)
  const [form, setForm] = useState({ name: '', business: '', email: '', phone: params.get('phone') ?? '', password: '' })
  const [error, setError] = useState('')
  const { login } = useStore()
  const navigate = useNavigate()
  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) => setForm({ ...form, [k]: e.target.value })

  const demo = () => {
    login({ name: 'Kartik', email: 'demo@taraju.in' }, { demo: true })
    navigate('/app')
  }

  useEffect(() => {
    if (params.get('demo')) demo()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (!/^\S+@\S+\.\S+$/.test(form.email)) return setError('Please enter a valid email address.')
    if (form.password.length < 6) return setError('Password must be at least 6 characters.')
    if (mode === 'signup') {
      if (!form.name.trim() || !form.business.trim()) return setError('Please enter your name and business name.')
      login({ name: form.name.trim(), email: form.email }, { businessName: form.business.trim() })
      navigate('/app/settings?welcome=1')
    } else {
      login({ name: form.email.split('@')[0].replace(/^\w/, (c) => c.toUpperCase()), email: form.email })
      navigate('/app')
    }
  }

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="relative hidden overflow-hidden bg-gradient-to-br from-white via-brand-50/60 to-brand-100/70 p-12 lg:flex lg:flex-col">
        <div className="hero-grid absolute inset-0 [mask-image:radial-gradient(ellipse_at_center,black,transparent_75%)]" />
        <div className="animate-blob absolute -bottom-40 -right-40 h-[480px] w-[480px] rounded-full bg-brand-300/30 blur-3xl" />
        <div className="relative my-auto py-8">
          <img src="/logo.png" alt="Taraju — GST, Billing and Accounting" className="mx-auto w-full max-w-xl mix-blend-multiply [mask-image:radial-gradient(ellipse_at_center,black_60%,transparent_100%)]" />
        </div>
        <div className="relative max-w-md">
          <h2 className="text-4xl font-extrabold leading-tight text-brand-800">Every rupee, <span className="text-brand-500">growing right.</span></h2>
          <p className="mt-3 text-slate-600">GST invoices, inventory, ledgers and reports — the whole shop’s accounts in one calm place.</p>
          <ul className="mt-6 space-y-2.5 text-sm text-slate-700">
            {['Create a GST invoice in under 10 seconds', 'Automatic stock & ledger updates', 'GSTR-1 / 3B summaries for your CA'].map((t) => (
              <li key={t} className="flex items-center gap-2.5"><CheckCircle2 size={18} className="text-brand-500" />{t}</li>
            ))}
          </ul>
        </div>
        <div className="relative mt-10 text-xs text-slate-500">© {new Date().getFullYear()} Taraju · Made in India</div>
      </div>

      <div className="flex items-center justify-center px-4 py-12 sm:px-8">
        <div className="animate-rise w-full max-w-md">
          <Link to="/" className="mb-10 inline-block"><Logo tagline size={34} /></Link>
          <h1 className="text-3xl font-extrabold tracking-tight">{mode === 'login' ? 'Welcome back' : 'Create your account'}</h1>
          <p className="mt-2 text-sm text-slate-500">
            {mode === 'login' ? 'Log in to manage your billing and accounts.' : 'Free forever for small businesses. No card required.'}
          </p>

          <button onClick={demo} className="mt-8 flex w-full items-center gap-3 rounded-2xl border border-brand-200 bg-brand-50 p-4 text-left transition hover:bg-brand-100 cursor-pointer">
            <PlayCircle className="shrink-0 text-brand-500" size={28} />
            <div className="flex-1">
              <div className="text-sm font-bold">Explore the live demo</div>
              <div className="text-xs text-slate-600">A sample shop with invoices, stock and reports already set up</div>
            </div>
            <ArrowRight size={18} className="text-brand-700" />
          </button>

          <div className="my-6 flex items-center gap-3 text-xs font-medium text-slate-400"><div className="h-px flex-1 bg-slate-200" />or continue with email<div className="h-px flex-1 bg-slate-200" /></div>

          <form onSubmit={submit} className="space-y-4">
            {mode === 'signup' && (
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Your name"><input className="input" value={form.name} onChange={set('name')} placeholder="Kartik Sharma" /></Field>
                <Field label="Business name"><input className="input" value={form.business} onChange={set('business')} placeholder="Sharma Traders" /></Field>
              </div>
            )}
            <Field label="Email"><input className="input" type="email" value={form.email} onChange={set('email')} placeholder="you@business.com" autoComplete="email" /></Field>
            {mode === 'signup' && (
              <Field label="Mobile"><input className="input" value={form.phone} onChange={set('phone')} placeholder="98XXXXXXXX" inputMode="numeric" /></Field>
            )}
            <Field label="Password">
              <div className="relative">
                <input className="input pr-10" type={show ? 'text' : 'password'} value={form.password} onChange={set('password')} placeholder="At least 6 characters" autoComplete={mode === 'login' ? 'current-password' : 'new-password'} />
                <button type="button" onClick={() => setShow(!show)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-ink cursor-pointer">{show ? <EyeOff size={16} /> : <Eye size={16} />}</button>
              </div>
            </Field>
            {error && <div className="rounded-xl bg-rose-50 px-3.5 py-2.5 text-sm text-rose-700">{error}</div>}
            <Button type="submit" size="lg" className="w-full">{mode === 'login' ? 'Log in' : 'Create free account'} <ArrowRight size={18} /></Button>
          </form>

          <p className="mt-6 text-center text-sm text-slate-500">
            {mode === 'login' ? 'New to Taraju? ' : 'Already have an account? '}
            <button onClick={() => { setMode(mode === 'login' ? 'signup' : 'login'); setError('') }} className="font-semibold text-brand-700 hover:underline cursor-pointer">
              {mode === 'login' ? 'Create an account' : 'Log in'}
            </button>
          </p>
        </div>
      </div>
    </div>
  )
}
