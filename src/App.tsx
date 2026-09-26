import { Navigate, Route, Routes } from 'react-router-dom'
import AppLayout from './components/AppLayout'
import Landing from './pages/Landing'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Invoices from './pages/Invoices'
import InvoiceEditor from './pages/InvoiceEditor'
import InvoiceView from './pages/InvoiceView'
import Parties from './pages/Parties'
import PartyLedger from './pages/PartyLedger'
import Items from './pages/Items'
import Payments from './pages/Payments'
import Expenses from './pages/Expenses'
import Reports from './pages/Reports'
import Settings from './pages/Settings'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={<Login />} />
      <Route path="/app" element={<AppLayout />}>
        <Route index element={<Dashboard />} />
        <Route path="sales" element={<Invoices kind="sale" />} />
        <Route path="sales/new" element={<InvoiceEditor kind="sale" />} />
        <Route path="purchases" element={<Invoices kind="purchase" />} />
        <Route path="purchases/new" element={<InvoiceEditor kind="purchase" />} />
        <Route path="invoice/:id" element={<InvoiceView />} />
        <Route path="invoice/:id/edit" element={<InvoiceEditor />} />
        <Route path="parties" element={<Parties />} />
        <Route path="parties/:id" element={<PartyLedger />} />
        <Route path="items" element={<Items />} />
        <Route path="payments" element={<Payments />} />
        <Route path="expenses" element={<Expenses />} />
        <Route path="reports" element={<Reports />} />
        <Route path="settings" element={<Settings />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
