import {
  BarChart3, FileText, LayoutDashboard, Package, Receipt, Settings, ShoppingCart, Users, Wallet,
} from 'lucide-react'

export const NAV = [
  { to: '/app', label: 'Dashboard', icon: LayoutDashboard, end: true, group: 'Overview' },
  { to: '/app/sales', label: 'Sales & Invoices', icon: FileText, group: 'Billing' },
  { to: '/app/purchases', label: 'Purchases', icon: ShoppingCart, group: 'Billing' },
  { to: '/app/payments', label: 'Payments', icon: Wallet, group: 'Billing' },
  { to: '/app/expenses', label: 'Expenses', icon: Receipt, group: 'Billing' },
  { to: '/app/parties', label: 'Parties', icon: Users, group: 'Manage' },
  { to: '/app/items', label: 'Items & Stock', icon: Package, group: 'Manage' },
  { to: '/app/reports', label: 'Reports & GST', icon: BarChart3, group: 'Manage' },
  { to: '/app/settings', label: 'Settings', icon: Settings, group: 'Manage' },
]
