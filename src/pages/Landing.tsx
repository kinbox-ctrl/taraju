import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  ArrowRight, BadgeCheck, BarChart3, Boxes, CheckCircle2, ChevronDown, FileText, Globe2, IndianRupee, Languages,
  Lock, Menu, MessageCircle, Phone, Play, QrCode, ReceiptText, Rocket, ShieldCheck, Smartphone, Star, UserPlus, Users,
  Wallet, X, Zap,
} from 'lucide-react'
import { Logo, LogoMark } from '../components/Logo'
import { DemoModal, DemoPlayer } from '../components/DemoPlayer'
import { useStore } from '../lib/store'

const FEATURES = [
  { icon: FileText, title: 'GST Billing in 10 seconds', text: 'Create GST-compliant tax invoices with auto CGST/SGST/IGST, HSN codes and amount in words.', tone: 'from-brand-400 to-brand-700' },
  { icon: Boxes, title: 'Inventory that updates itself', text: 'Every sale and purchase adjusts stock instantly. Get low-stock alerts before you run out.', tone: 'from-sky-400 to-indigo-600' },
  { icon: Users, title: 'Party ledgers & reminders', text: 'Know exactly who owes you and whom you owe, with a clean ledger for every customer and supplier.', tone: 'from-violet-400 to-purple-600' },
  { icon: BarChart3, title: 'GSTR-ready reports', text: 'GSTR-1 & GSTR-3B summaries, HSN-wise sales, P&L and stock reports — export to Excel in one click.', tone: 'from-amber-300 to-orange-500' },
  { icon: Wallet, title: 'Payments & expenses', text: 'Record Cash, UPI, Bank and Cheque payments against invoices. Track every rupee of expense.', tone: 'from-emerald-400 to-teal-600' },
  { icon: QrCode, title: 'UPI on every invoice', text: 'Print or share invoices with your bank details and UPI ID so customers pay faster.', tone: 'from-rose-400 to-pink-600' },
]

const PLANS = [
  { name: 'Basic', price: 0, per: 'forever', desc: 'For new & small shops', features: ['Unlimited GST invoices', '1 business, 1 user', 'Inventory & parties', 'Basic reports'], cta: 'Start free' },
  { name: 'Silver', price: 399, per: '/month', desc: 'For growing businesses', features: ['Everything in Basic', 'GSTR-1 & 3B reports', 'Payment reminders', '3 users', 'Excel export'], cta: 'Start 14-day trial', popular: true },
  { name: 'Gold', price: 799, per: '/month', desc: 'For distributors & multi-branch', features: ['Everything in Silver', 'E-invoice & E-way bill', 'Multi-godown stock', 'Unlimited users', 'Priority support'], cta: 'Talk to sales' },
]

const FAQ = [
  ['Is Taraju GST compliant?', 'Yes. Invoices include GSTIN, HSN/SAC, place of supply, and split CGST/SGST or IGST automatically based on the party’s state.'],
  ['Can I use it on mobile?', 'Taraju runs in any browser — phone, tablet or desktop — with a layout designed for each.'],
  ['Is my data safe?', 'Your books are encrypted in transit and at rest, with daily backups. Only you and people you invite can see them.'],
  ['Can I move from another software?', 'Yes. Import your items and parties from Excel, and our team will help you migrate opening balances.'],
]

const WORDS = ['Kirana stores', 'Distributors', 'Pharmacies', 'Wholesalers', 'Retailers', 'Hardware shops']
const TICKER = ['🛒 Kirana & Grocery', '💊 Pharma & Medical', '🚚 FMCG Distribution', '🔌 Electricals', '👗 Garments & Textiles', '🔩 Hardware', '📱 Mobile & Electronics', '🍬 Sweets & Bakery', '🧱 Building Material', '📚 Stationery']

/** Adds the `in` class to `.reveal` children once they scroll into view. */
function useReveal() {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const els = ref.current?.querySelectorAll('.reveal') ?? []
    const io = new IntersectionObserver((entries) => entries.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target) } }), { threshold: 0.12 })
    els.forEach((el) => io.observe(el))
    return () => io.disconnect()
  }, [])
  return ref
}

function CountUp({ to, prefix = '', suffix = '', decimals = 0 }: { to: number; prefix?: string; suffix?: string; decimals?: number }) {
  const [v, setV] = useState(0)
  const ref = useRef<HTMLSpanElement>(null)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const io = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting) return
      io.disconnect()
      const start = performance.now()
      const tick = (t: number) => {
        const p = Math.min(1, (t - start) / 1400)
        setV(to * (1 - Math.pow(1 - p, 3)))
        if (p < 1) requestAnimationFrame(tick)
      }
      requestAnimationFrame(tick)
    })
    io.observe(el)
    return () => io.disconnect()
  }, [to])
  return <span ref={ref}>{prefix}{v.toFixed(decimals)}{suffix}</span>
}

function RotatingWord() {
  const [i, setI] = useState(0)
  useEffect(() => { const t = setInterval(() => setI((x) => (x + 1) % WORDS.length), 2200); return () => clearInterval(t) }, [])
  return <span key={i} className="animate-word inline-block font-bold text-brand-700">{WORDS[i]}</span>
}

function HeroVideo({ onExpand }: { onExpand: () => void }) {
  // `?tour=12` deep-links the hero tour to a given second
  const startAt = Number(new URLSearchParams(window.location.search).get('tour')) || 0
  return (
    <div className="relative mx-auto w-full min-w-0 max-w-xl lg:max-w-none">
      <div className="absolute -inset-6 -z-10 rounded-[40px] bg-gradient-to-tr from-brand-300/50 via-transparent to-brand-700/25 blur-2xl" />
      <DemoPlayer onExpand={onExpand} startAt={startAt} />
      <div className="animate-float absolute -right-2 -top-5 hidden rounded-2xl bg-ink px-3.5 py-2.5 text-white shadow-xl sm:-right-5 sm:block" style={{ animationDelay: '1.5s' }}>
        <div className="text-[9px] uppercase tracking-wider text-brand-300 sm:text-[10px]">GSTR-1 ready</div>
        <div className="mt-0.5 flex items-center gap-1.5 text-xs font-bold sm:text-sm"><BadgeCheck size={16} className="text-brand-400" /> Filed on time</div>
      </div>
    </div>
  )
}

export default function Landing() {
  const navigate = useNavigate()
  const { user } = useStore()
  const [phone, setPhone] = useState('')
  const [faq, setFaq] = useState<number | null>(0)
  const [yearly, setYearly] = useState(true)
  const [menu, setMenu] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const [demo, setDemo] = useState(false)
  const root = useReveal()

  useEffect(() => {
    const h = () => setScrolled(window.scrollY > 10)
    window.addEventListener('scroll', h, { passive: true })
    return () => window.removeEventListener('scroll', h)
  }, [])

  const startTrial = (e?: React.FormEvent) => {
    e?.preventDefault()
    navigate(`/login?mode=signup${phone ? `&phone=${encodeURIComponent(phone)}` : ''}`)
  }
  const links = [['#features', 'Features'], ['#how', 'How it works'], ['#pricing', 'Pricing'], ['#faq', 'FAQ']]

  return (
    <div ref={root} className="overflow-x-clip bg-white">
      <div className="bg-brand-950 px-4 py-2 text-center text-[11px] font-medium text-brand-100 sm:text-xs">
        🎉 New: Share invoices on WhatsApp with a UPI pay link — <button onClick={() => startTrial()} className="font-bold text-gold-400 underline-offset-2 hover:underline cursor-pointer">try it free</button>
      </div>

      {/* Nav */}
      <header className={`sticky top-0 z-40 border-b transition-all duration-300 ${scrolled || menu ? 'border-slate-200/70 bg-white/85 shadow-[0_8px_30px_-16px_rgba(15,23,42,.2)] backdrop-blur-xl' : 'border-transparent bg-white/0'}`}>
        <div className="mx-auto flex max-w-7xl items-center gap-4 px-4 py-3 sm:px-6 lg:gap-6">
          <Link to="/" className="shrink-0"><Logo size={40} tagline /></Link>
          <a href="tel:+911800000000" className="hidden items-center gap-2 border-l border-slate-200 pl-6 text-sm font-semibold text-slate-700 xl:flex">
            <Phone size={16} className="text-brand-600" /> 1800-000-000
          </a>
          <nav className="ml-auto hidden items-center gap-1 text-sm font-semibold text-slate-600 md:flex">
            {links.map(([h, l]) => <a key={h} href={h} className="rounded-lg px-3 py-2 transition hover:bg-brand-50 hover:text-brand-700">{l}</a>)}
          </nav>
          <div className="ml-auto flex items-center gap-2 md:ml-0">
            {user ? (
              <Link to="/app" className="inline-flex h-10 items-center gap-1.5 rounded-xl bg-brand-700 px-4 text-sm font-semibold text-white hover:bg-brand-800"><span className="hidden sm:inline">Open dashboard</span><span className="sm:hidden">Open</span> <ArrowRight size={16} /></Link>
            ) : (
              <>
                <Link to="/login" className="hidden h-10 items-center rounded-xl px-4 text-sm font-semibold text-brand-800 ring-1 ring-brand-200 transition hover:bg-brand-50 sm:inline-flex">Login</Link>
                <Link to="/login?mode=signup" className="inline-flex h-10 items-center rounded-xl bg-brand-500 px-3.5 text-sm font-bold text-white shadow-sm shadow-brand-900/20 transition hover:-translate-y-0.5 hover:bg-brand-600 sm:px-4">Start Free</Link>
              </>
            )}
            <button onClick={() => setMenu(!menu)} className="grid h-10 w-10 place-items-center rounded-xl text-slate-700 hover:bg-slate-100 md:hidden" aria-label="Menu">{menu ? <X size={20} /> : <Menu size={20} />}</button>
          </div>
        </div>
        <div className={`grid overflow-hidden transition-all duration-300 md:hidden ${menu ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}>
          <div className="min-h-0">
            <div className="space-y-1 border-t border-slate-100 px-4 pb-4 pt-2">
              {links.map(([h, l]) => <a key={h} href={h} onClick={() => setMenu(false)} className="block rounded-xl px-3 py-3 text-[15px] font-semibold text-slate-700 active:bg-slate-50">{l}</a>)}
              <div className="grid grid-cols-2 gap-2 pt-2">
                <Link to="/login" className="grid h-11 place-items-center rounded-xl text-sm font-semibold text-brand-800 ring-1 ring-brand-200">Login</Link>
                <a href="tel:+911800000000" className="flex h-11 items-center justify-center gap-2 rounded-xl bg-slate-50 text-sm font-semibold"><Phone size={15} /> Call us</a>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative -mt-[65px] overflow-hidden pt-[65px]">
        <div className="hero-grid absolute inset-0 [mask-image:radial-gradient(ellipse_at_top,black,transparent_75%)]" />
        <div className="animate-blob absolute -left-32 top-10 h-96 w-96 rounded-full bg-brand-300/40 blur-3xl" />
        <div className="animate-blob absolute right-0 top-40 h-80 w-80 rounded-full bg-gold-400/25 blur-3xl" style={{ animationDelay: '-5s' }} />
        <div className="animate-blob absolute bottom-0 left-1/3 h-72 w-72 rounded-full bg-sky-300/25 blur-3xl" style={{ animationDelay: '-9s' }} />
        <div className="relative mx-auto grid max-w-7xl items-center gap-16 px-4 pb-24 pt-10 sm:px-6 sm:pt-14 lg:grid-cols-[1.05fr_1fr] lg:gap-12 lg:pt-20">
          <div className="animate-rise min-w-0 text-center lg:text-left">
            <div className="inline-flex items-center gap-2 rounded-full border border-brand-200 bg-white/80 px-3.5 py-1.5 text-xs font-semibold text-slate-700 shadow-sm backdrop-blur">
              <ShieldCheck size={14} className="text-brand-600" /> Made for <RotatingWord />
            </div>
            <h1 className="mt-6 text-[2.35rem] font-extrabold leading-[1.05] tracking-tight text-ink sm:text-6xl xl:text-[4.1rem]">
              <span className="text-shine">Grow your business.</span><br />
              GST Billing &amp; Accounting, <span className="relative whitespace-nowrap">made simple<svg className="absolute -bottom-2 left-0 w-full text-gold-400" viewBox="0 0 200 12" preserveAspectRatio="none" aria-hidden><path d="M2 9c40-6 110-8 196-3" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" /></svg></span>.
            </h1>
            <p className="mx-auto mt-6 max-w-xl text-base leading-relaxed text-slate-600 sm:text-lg lg:mx-0">
              Taraju helps your business grow — create GST invoices, manage stock, track payments and file returns from one beautiful dashboard. All for just <span className="font-bold text-brand-700">₹13/day</span>.
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-2 lg:justify-start">
              {([[ReceiptText, 'GST & E-Invoice Ready'], [Smartphone, 'Mobile + Desktop'], [Languages, 'Hindi + English']] as const).map(([Icon, t]) => (
                <span key={t} className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white/80 px-3 py-1.5 text-xs font-semibold text-slate-700 backdrop-blur"><Icon size={14} className="text-brand-600" />{t}</span>
              ))}
            </div>

            <form onSubmit={startTrial} className="mx-auto mt-8 max-w-lg rounded-2xl border border-slate-200 bg-white/90 p-2 shadow-2xl shadow-brand-900/10 backdrop-blur lg:mx-0">
              <div className="flex flex-col gap-2 sm:flex-row">
                <div className="flex flex-1 items-center rounded-xl bg-slate-50 px-3 ring-brand-500/20 transition focus-within:bg-white focus-within:ring-4">
                  <span className="whitespace-nowrap border-r border-slate-200 pr-3 text-sm font-semibold text-slate-600">🇮🇳 +91</span>
                  <input value={phone} onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))} inputMode="numeric" placeholder="Enter mobile number" className="h-12 w-full min-w-0 bg-transparent px-3 text-sm outline-none" />
                </div>
                <button className="btn-shimmer group inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-gradient-to-b from-brand-400 to-brand-600 px-6 text-sm font-bold text-white shadow-lg shadow-brand-900/25 transition hover:brightness-110 cursor-pointer">
                  Start Free Trial <ArrowRight size={16} className="transition group-hover:translate-x-1" />
                </button>
              </div>
              <div className="px-2 pb-1 pt-2.5 text-left text-xs text-slate-500">⏱ No credit card needed · Setup in 2 minutes</div>
            </form>
            <div className="mt-5 flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-sm lg:justify-start">
              <button onClick={() => setDemo(true)} className="group inline-flex items-center gap-2 font-semibold text-ink cursor-pointer">
                <span className="relative grid h-9 w-9 place-items-center rounded-full bg-white text-brand-600 shadow-md ring-1 ring-slate-200 transition group-hover:scale-110">
                  <span className="absolute inset-0 animate-ping rounded-full bg-brand-400/30" />
                  <Play size={14} fill="currentColor" className="relative ml-0.5" />
                </span>
                Watch 23-sec demo
              </button>
              <span className="text-slate-300">·</span>
              <Link to="/login?demo=1" className="inline-flex items-center gap-1 font-semibold text-brand-700 transition-all hover:gap-2">Try the live demo <ArrowRight size={14} /></Link>
            </div>

            <div className="mt-10 flex flex-wrap items-center justify-center gap-x-8 gap-y-4 border-t border-slate-200/80 pt-6 lg:justify-start">
              <div><div className="num text-2xl font-extrabold text-brand-800"><CountUp to={50} suffix="K+" /></div><div className="text-xs text-slate-500">Businesses</div></div>
              <div><div className="num text-2xl font-extrabold text-brand-800"><CountUp to={4.8} decimals={1} suffix="★" /></div><div className="text-xs text-slate-500">User rating</div></div>
              <div><div className="num text-2xl font-extrabold text-brand-800"><CountUp to={900} prefix="₹" suffix="Cr+" /></div><div className="text-xs text-slate-500">Invoiced monthly</div></div>
              <div className="flex gap-2">
                <span className="inline-flex items-center gap-1 rounded-full bg-white px-3 py-1.5 text-xs font-semibold shadow-sm ring-1 ring-slate-200"><Lock size={12} /> ISO 27001</span>
                <span className="inline-flex items-center gap-1 rounded-full bg-white px-3 py-1.5 text-xs font-semibold shadow-sm ring-1 ring-slate-200"><Lock size={12} /> GST Compliant</span>
              </div>
            </div>
          </div>
          <div className="animate-rise px-1 sm:px-6 lg:px-0" style={{ animationDelay: '.15s' }}><HeroVideo onExpand={() => setDemo(true)} /></div>
        </div>
      </section>

      {/* Ticker */}
      <section className="relative bg-brand-950 py-5 text-brand-100">
        <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-16 bg-gradient-to-r from-brand-950 to-transparent sm:w-32" />
        <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-16 bg-gradient-to-l from-brand-950 to-transparent sm:w-32" />
        <div className="animate-marquee flex w-max gap-10 whitespace-nowrap text-sm font-semibold sm:text-base">
          {[...TICKER, ...TICKER].map((t, i) => <span key={i} className="flex items-center gap-10">{t}<span className="text-brand-400">✦</span></span>)}
        </div>
      </section>

      {/* Features */}
      <section id="features" className="mx-auto max-w-7xl scroll-mt-20 px-4 py-20 sm:px-6 sm:py-28">
        <div className="reveal mx-auto max-w-2xl text-center">
          <div className="text-xs font-bold uppercase tracking-[0.2em] text-brand-600 sm:text-sm">Everything you need</div>
          <h2 className="mt-3 text-3xl font-extrabold tracking-tight sm:text-5xl">One app to run your <span className="text-shine">whole business</span></h2>
          <p className="mt-4 text-slate-600">Stop juggling notebooks, Excel and three different apps. Taraju keeps billing, stock and accounts in perfect balance.</p>
        </div>
        <div className="mt-12 grid gap-4 sm:mt-16 sm:grid-cols-2 sm:gap-5 lg:grid-cols-3">
          {FEATURES.map(({ icon: Icon, title, text, tone }, i) => (
            <div key={title} className="reveal group relative overflow-hidden rounded-3xl border border-slate-200 bg-white p-6 transition duration-300 hover:-translate-y-1.5 hover:border-transparent hover:shadow-2xl hover:shadow-brand-900/10 sm:p-7" style={{ transitionDelay: `${i * 60}ms` }}>
              <div className={`absolute -right-12 -top-12 h-32 w-32 rounded-full bg-gradient-to-br opacity-0 blur-2xl transition duration-500 group-hover:opacity-30 ${tone}`} />
              <div className={`relative grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br text-white shadow-lg transition duration-300 group-hover:scale-110 group-hover:rotate-3 ${tone}`}><Icon size={22} /></div>
              <h3 className="relative mt-5 text-lg font-bold">{title}</h3>
              <p className="relative mt-2 text-sm leading-relaxed text-slate-600">{text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section id="how" className="relative scroll-mt-20 overflow-hidden bg-gradient-to-b from-brand-50/70 to-white py-20 sm:py-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="reveal mx-auto max-w-2xl text-center">
            <div className="text-xs font-bold uppercase tracking-[0.2em] text-brand-600 sm:text-sm">How it works</div>
            <h2 className="mt-3 text-3xl font-extrabold tracking-tight sm:text-5xl">From sign-up to first bill in 2 minutes</h2>
          </div>
          <div className="relative mt-14 grid gap-10 md:grid-cols-3 md:gap-6">
            <div className="absolute left-[16%] right-[16%] top-8 hidden h-0.5 bg-gradient-to-r from-brand-200 via-brand-500 to-brand-200 md:block" />
            {[
              { i: UserPlus, t: 'Create your account', d: 'Enter your mobile number and business name. No card, no installation.' },
              { i: Boxes, t: 'Add items & parties', d: 'Import from Excel or add them while billing — GSTIN auto-detects the state.' },
              { i: Rocket, t: 'Bill & get paid', d: 'Share GST invoices on WhatsApp with a UPI link and watch payments come in.' },
            ].map(({ i: Icon, t, d }, n) => (
              <div key={t} className="reveal relative text-center" style={{ transitionDelay: `${n * 120}ms` }}>
                <div className="relative mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-white text-brand-700 shadow-xl shadow-brand-900/10 ring-1 ring-brand-100">
                  <Icon size={26} />
                  <span className="absolute -right-2 -top-2 grid h-6 w-6 place-items-center rounded-full bg-gold-400 text-xs font-extrabold text-ink ring-4 ring-white">{n + 1}</span>
                </div>
                <h3 className="mt-5 text-lg font-bold">{t}</h3>
                <p className="mx-auto mt-2 max-w-xs text-sm leading-relaxed text-slate-600">{d}</p>
              </div>
            ))}
          </div>
          <div className="reveal mt-12 text-center">
            <button onClick={() => setDemo(true)} className="group inline-flex h-12 items-center gap-2.5 rounded-full bg-ink pl-2 pr-5 text-sm font-semibold text-white shadow-xl shadow-ink/20 transition hover:-translate-y-0.5 cursor-pointer">
              <span className="grid h-8 w-8 place-items-center rounded-full bg-brand-500 transition group-hover:scale-110"><Play size={14} fill="currentColor" className="ml-0.5" /></span>
              See it in action
            </button>
          </div>
        </div>
      </section>

      {/* GST section */}
      <section id="gst" className="py-20 sm:py-28">
        <div className="mx-auto grid max-w-7xl items-center gap-12 px-4 sm:px-6 lg:grid-cols-2 lg:gap-16">
          <div className="reveal relative order-2 mx-auto w-full max-w-md lg:order-1">
            <div className="absolute -inset-4 -z-10 rounded-[32px] bg-gradient-to-br from-brand-200/60 to-gold-400/30 blur-2xl" />
            <div className="card overflow-hidden p-0 shadow-2xl">
              <div className="h-1.5 bg-gradient-to-r from-brand-600 via-brand-800 to-gold-400" />
              <div className="p-6">
                <div className="flex items-start justify-between">
                  <div><div className="text-xs font-semibold uppercase tracking-wider text-slate-400">Tax Invoice</div><div className="font-mono text-sm font-semibold">INV-0142</div></div>
                  <LogoMark size={32} />
                </div>
                <div className="mt-5 space-y-2 text-sm">
                  {[['Basmati Rice 5kg × 10', '₹6,400.00'], ['Sunflower Oil 1L × 24', '₹3,960.00']].map(([a, b]) => (
                    <div key={a} className="flex justify-between gap-2"><span className="text-slate-600">{a}</span><span className="num">{b}</span></div>
                  ))}
                  <div className="border-t border-dashed border-slate-200 pt-2" />
                  {[['Taxable value', '₹10,360.00'], ['CGST @ 2.5%', '₹259.00'], ['SGST @ 2.5%', '₹259.00']].map(([a, b]) => (
                    <div key={a} className="flex justify-between text-slate-500"><span>{a}</span><span className="num">{b}</span></div>
                  ))}
                  <div className="flex justify-between rounded-xl bg-brand-700 px-3 py-2.5 font-bold text-white"><span>Total</span><span className="num">₹10,878.00</span></div>
                </div>
              </div>
            </div>
          </div>
          <div className="reveal order-1 lg:order-2">
            <div className="text-xs font-bold uppercase tracking-[0.2em] text-brand-600 sm:text-sm">GST, done right</div>
            <h2 className="mt-3 text-3xl font-extrabold tracking-tight sm:text-5xl">Tax calculated to the paisa. Every single time.</h2>
            <ul className="mt-8 space-y-4">
              {['Auto CGST + SGST for intra-state and IGST for inter-state supplies', 'HSN-wise summary and rate-wise tax breakup on every bill', 'GSTR-1 and GSTR-3B summaries ready to hand to your CA', 'Amount in words, bank details and UPI printed on the invoice'].map((t) => (
                <li key={t} className="flex gap-3"><span className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full bg-brand-100 text-brand-700"><CheckCircle2 size={15} /></span><span className="text-slate-700">{t}</span></li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="scroll-mt-20 bg-slate-50/70 py-20 sm:py-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="reveal mx-auto max-w-2xl text-center">
            <div className="text-xs font-bold uppercase tracking-[0.2em] text-brand-600 sm:text-sm">Pricing</div>
            <h2 className="mt-3 text-3xl font-extrabold tracking-tight sm:text-5xl">Simple pricing. No hidden charges.</h2>
            <div className="mt-6 inline-flex rounded-xl bg-white p-1 text-sm font-semibold shadow-sm ring-1 ring-slate-200">
              <button onClick={() => setYearly(false)} className={`rounded-lg px-4 py-1.5 transition cursor-pointer ${!yearly ? 'bg-brand-700 text-white shadow-sm' : 'text-slate-500'}`}>Monthly</button>
              <button onClick={() => setYearly(true)} className={`rounded-lg px-4 py-1.5 transition cursor-pointer ${yearly ? 'bg-brand-700 text-white shadow-sm' : 'text-slate-500'}`}>Yearly <span className={yearly ? 'text-gold-400' : 'text-emerald-600'}>−20%</span></button>
            </div>
          </div>
          <div className="mt-12 grid gap-6 lg:grid-cols-3 lg:items-center">
            {PLANS.map((p, i) => {
              const price = yearly ? Math.round(p.price * 0.8) : p.price
              return (
                <div key={p.name} className={`reveal relative rounded-3xl p-7 transition duration-300 hover:-translate-y-1 sm:p-8 ${p.popular ? 'bg-gradient-to-b from-brand-800 to-brand-950 text-white shadow-2xl shadow-brand-900/30 ring-1 ring-brand-700 lg:py-12' : 'bg-white ring-1 ring-slate-200 hover:shadow-xl'}`} style={{ transitionDelay: `${i * 80}ms` }}>
                  {p.popular && <div className="absolute -top-3 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-gold-400 px-3 py-1 text-xs font-bold text-ink shadow-md">⭐ Most popular</div>}
                  <div className="text-lg font-bold">{p.name}</div>
                  <div className={`text-sm ${p.popular ? 'text-brand-200' : 'text-slate-500'}`}>{p.desc}</div>
                  <div className="mt-6 flex items-baseline gap-1">
                    <IndianRupee size={26} className="self-center" />
                    <span className="num text-5xl font-extrabold">{price}</span>
                    <span className={`text-sm ${p.popular ? 'text-brand-200' : 'text-slate-500'}`}>{p.per}</span>
                  </div>
                  <ul className="mt-8 space-y-3 text-sm">
                    {p.features.map((f) => <li key={f} className="flex gap-2.5"><CheckCircle2 size={18} className={`shrink-0 ${p.popular ? 'text-brand-400' : 'text-brand-500'}`} />{f}</li>)}
                  </ul>
                  <button onClick={() => startTrial()} className={`mt-8 h-12 w-full rounded-xl text-sm font-bold transition cursor-pointer ${p.popular ? 'bg-brand-500 text-white hover:bg-brand-400' : 'bg-brand-50 text-brand-800 hover:bg-brand-100'}`}>{p.cta}</button>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 sm:py-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="reveal mx-auto mb-12 max-w-2xl text-center">
            <h2 className="text-3xl font-extrabold tracking-tight sm:text-5xl">Loved by shop owners</h2>
          </div>
          <div className="-mx-4 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-4 [scrollbar-width:none] md:mx-0 md:grid md:grid-cols-3 md:gap-6 md:overflow-visible md:px-0">
            {[
              ['“Month-end used to take me 3 days with my CA. Now the GSTR summary is ready before I ask.”', 'Rakesh M.', 'Wholesale grocer, Delhi'],
              ['“Billing at the counter is so fast that the queue never builds up, even on Diwali.”', 'Priya S.', 'Kirana store, Pune'],
              ['“I finally know which customer owes how much. Collections went up in the first month.”', 'Imran K.', 'FMCG distributor, Lucknow'],
            ].map(([q, n, r], i) => (
              <figure key={n} className="reveal card w-[85%] shrink-0 snap-center p-7 transition hover:-translate-y-1 hover:shadow-xl md:w-auto" style={{ transitionDelay: `${i * 80}ms` }}>
                <div className="flex gap-0.5 text-gold-500">{Array.from({ length: 5 }).map((_, k) => <Star key={k} size={16} fill="currentColor" />)}</div>
                <blockquote className="mt-4 leading-relaxed text-slate-700">{q}</blockquote>
                <figcaption className="mt-6 flex items-center gap-3 text-sm">
                  <div className="grid h-10 w-10 place-items-center rounded-full bg-gradient-to-br from-brand-400 to-brand-700 font-bold text-white">{n[0]}</div>
                  <div><div className="font-bold">{n}</div><div className="text-slate-500">{r}</div></div>
                </figcaption>
              </figure>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="mx-auto max-w-3xl scroll-mt-20 px-4 pb-20 sm:px-6 sm:pb-28">
        <h2 className="reveal text-center text-3xl font-extrabold tracking-tight sm:text-4xl">Frequently asked questions</h2>
        <div className="reveal mt-10 space-y-3">
          {FAQ.map(([q, a], i) => (
            <div key={q} className={`rounded-2xl border transition ${faq === i ? 'border-brand-200 bg-brand-50/40 shadow-sm' : 'border-slate-200 bg-white'}`}>
              <button onClick={() => setFaq(faq === i ? null : i)} className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left font-semibold sm:px-6 sm:py-5 cursor-pointer">
                {q}<span className={`grid h-7 w-7 shrink-0 place-items-center rounded-full transition ${faq === i ? 'rotate-180 bg-brand-700 text-white' : 'bg-slate-100'}`}><ChevronDown size={16} /></span>
              </button>
              <div className={`grid transition-all duration-300 ${faq === i ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'}`}>
                <div className="min-h-0 overflow-hidden"><p className="px-5 pb-5 text-sm leading-relaxed text-slate-600 sm:px-6">{a}</p></div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="px-4 pb-20 sm:px-6 sm:pb-28">
        <div className="reveal relative mx-auto max-w-6xl overflow-hidden rounded-[32px] bg-gradient-to-br from-brand-700 via-brand-800 to-brand-950 px-6 py-14 text-center text-white sm:px-8 sm:py-20">
          <div className="hero-grid absolute inset-0 opacity-20" />
          <div className="animate-blob absolute -left-20 -top-20 h-72 w-72 rounded-full bg-brand-400/30 blur-3xl" />
          <div className="animate-blob absolute -bottom-24 -right-10 h-72 w-72 rounded-full bg-gold-400/25 blur-3xl" style={{ animationDelay: '-6s' }} />
          <div className="absolute -right-10 -top-10 opacity-10"><LogoMark size={260} /></div>
          <Zap className="relative mx-auto text-brand-400" size={32} />
          <h2 className="relative mt-4 text-3xl font-extrabold sm:text-5xl">Start billing in the next 2 minutes</h2>
          <p className="relative mx-auto mt-3 max-w-xl text-brand-100">Free forever plan. No credit card. Bring your team when you’re ready.</p>
          <div className="relative mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <button onClick={() => startTrial()} className="group inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-brand-500 px-6 font-bold text-white shadow-xl shadow-black/20 transition hover:bg-brand-400 cursor-pointer">Start Free Trial <ArrowRight size={18} className="transition group-hover:translate-x-1" /></button>
            <Link to="/login?demo=1" className="inline-flex h-12 items-center justify-center rounded-xl px-6 font-semibold ring-1 ring-white/30 backdrop-blur transition hover:bg-white/10">Explore live demo</Link>
          </div>
        </div>
      </section>

      <footer className="border-t border-slate-200 bg-white">
        <div className="mx-auto grid max-w-7xl gap-8 px-4 py-12 sm:grid-cols-2 sm:px-6 lg:grid-cols-4">
          <div className="sm:col-span-2 lg:col-span-1">
            <Logo size={40} tagline />
            <p className="mt-4 max-w-xs text-sm text-slate-500">GST billing, inventory and accounting for Bharat’s businesses.</p>
          </div>
          {[
            ['Product', ['Features', 'Pricing', 'Live demo', 'What’s new']],
            ['Solutions', ['Retail & Kirana', 'Distributors', 'Pharmacies', 'Wholesalers']],
            ['Company', ['About', 'Contact', 'Privacy', 'Terms']],
          ].map(([h, ls]) => (
            <div key={h as string}>
              <div className="text-sm font-bold">{h as string}</div>
              <ul className="mt-3 space-y-2 text-sm text-slate-500">{(ls as string[]).map((l) => <li key={l}><a href="#" className="transition hover:text-brand-700">{l}</a></li>)}</ul>
            </div>
          ))}
        </div>
        <div className="border-t border-slate-100">
          <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-2 px-4 py-5 text-xs text-slate-500 sm:flex-row sm:px-6">
            <div className="flex items-center gap-2"><Globe2 size={14} /> Made in India 🇮🇳</div>
            <div>© {new Date().getFullYear()} Taraju. All rights reserved.</div>
          </div>
        </div>
      </footer>

      <DemoModal open={demo} onClose={() => setDemo(false)} />

      <a href="#" onClick={(e) => { e.preventDefault(); startTrial() }} className="fixed bottom-5 right-5 z-40 grid h-14 w-14 place-items-center rounded-full bg-emerald-500 text-white shadow-xl shadow-emerald-900/30 transition hover:scale-110" title="Chat with us">
        <span className="absolute inset-0 animate-ping rounded-full bg-emerald-400 opacity-30" />
        <MessageCircle size={26} className="relative" />
      </a>
    </div>
  )
}
