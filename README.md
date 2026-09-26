# Taraju — GST Billing & Accounting (MVP)

**Taraju** — *GST | Billing | Accounting* — is a billing, inventory and accounting portal for Indian small businesses.

**Brand:** navy `#062C60` + growth green `#0EA673` (the arrow-j), gold as a minor accent, Outfit for headings.
Master artwork is `public/logo.png`; `public/brand/` holds the transparent wordmark (navy + white), full lockup and app icon extracted from it.

## Run

```bash
npm install
npm run dev      # http://localhost:5180
npm run build    # production build in dist/
```

Click **Try the live demo** on the landing page to explore a pre-filled shop.

## What's in the MVP

| Area | Features |
|---|---|
| Landing | Hero with mobile-number trial CTA, features, GST section, pricing, testimonials, FAQ |
| Auth | Login / signup / one-click demo (mock auth, local only) |
| Dashboard | Monthly sales & purchases, receivables/payables, 6-month chart, cash flow, top dues, low stock, overdue alerts |
| Sales & Purchases | GST invoice editor (item search, HSN, discount, auto CGST+SGST vs IGST by state, round-off, amount in words), payment at billing, Save & New, ⌘S / Alt+N |
| Invoice view | Printable A4 tax invoice / PDF, WhatsApp share with UPI link, record payments, duplicate, edit, delete |
| Parties | Customers & suppliers, GSTIN validation with state auto-detect, running ledger statement, CSV export |
| Items & Stock | Live stock from purchases/sales, low-stock alerts, margin, stock value |
| Payments & Expenses | Payment in/out against invoices or on account; categorised expenses |
| Reports | Profit & Loss, GSTR-1 (B2B + HSN summary), GSTR-3B (output tax − ITC), sales register, stock summary — all exportable to CSV |
| Settings | Business profile, GSTIN, bank/UPI, invoice prefix, backup/restore JSON |

## Stack

React 19 + TypeScript + Vite, Tailwind CSS v4, React Router, Recharts, Lucide icons.
Data is stored in the browser (`localStorage`) — swap `src/lib/store.tsx` for an API/Supabase backend to go multi-device.

## Structure

```
src/
  lib/        types, GST calculations, seed data, store
  components/ Logo, UI kit, AppLayout (sidebar/topbar), party/item/payment forms
  pages/      Landing, Login, Dashboard, Invoices, InvoiceEditor, InvoiceView,
              Parties, PartyLedger, Items, Payments, Expenses, Reports, Settings
public/       favicon.svg / taraju-logo-mark.svg
```
"# taraju" 
