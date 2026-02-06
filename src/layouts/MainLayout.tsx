import { useState } from 'react';
import { Outlet, NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  BookOpen,
  CreditCard,
  Receipt,
  ShoppingCart,
  ChevronDown,
  ChevronRight,
  Users,
  FileText,
  Clock,
  Building2,
  Package,
  MessageSquare,
  Sparkles,
  Landmark,
  Scale
} from 'lucide-react';
import ChatPanel from '@/components/ChatPanel';

interface NavItem {
  label: string;
  path?: string;
  icon: React.ReactNode;
  children?: { label: string; path: string }[];
}

const navigation: NavItem[] = [
  { label: 'Dashboard', path: '/', icon: <LayoutDashboard size={20} /> },
  {
    label: 'General Ledger',
    icon: <BookOpen size={20} />,
    children: [
      { label: 'Journal Entries', path: '/gl' },
      { label: 'Chart of Accounts', path: '/gl/accounts' },
      { label: 'Trial Balance', path: '/gl/trial-balance' },
    ],
  },
  {
    label: 'Accounts Payable',
    icon: <CreditCard size={20} />,
    children: [
      { label: 'Overview', path: '/ap' },
      { label: 'Invoices', path: '/ap/invoices' },
      { label: 'Aging Report', path: '/ap/aging' },
      { label: 'Vendors', path: '/ap/vendors' },
    ],
  },
  {
    label: 'Accounts Receivable',
    icon: <Receipt size={20} />,
    children: [
      { label: 'Overview', path: '/ar' },
      { label: 'Invoices', path: '/ar/invoices' },
      { label: 'Aging Report', path: '/ar/aging' },
      { label: 'Customers', path: '/ar/customers' },
    ],
  },
  {
    label: 'Procure to Pay',
    icon: <ShoppingCart size={20} />,
    children: [
      { label: 'Overview', path: '/p2p' },
      { label: 'Purchase Orders', path: '/p2p/purchase-orders' },
      { label: 'Requisitions', path: '/p2p/requisitions' },
      { label: 'Goods Receipts', path: '/p2p/receipts' },
    ],
  },
  {
    label: 'Banking',
    icon: <Landmark size={20} />,
    children: [
      { label: 'Bank Accounts', path: '/banking' },
    ],
  },
];

function NavItemComponent({ item }: { item: NavItem }) {
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(
    item.children?.some((child) => location.pathname === child.path) || false
  );

  const isActive = item.path
    ? location.pathname === item.path
    : item.children?.some((child) => location.pathname === child.path);

  if (item.children) {
    return (
      <div>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={`w-full flex items-center justify-between px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
            isActive
              ? 'bg-sidebar-active text-white'
              : 'text-gray-300 hover:bg-sidebar-hover hover:text-white'
          }`}
        >
          <div className="flex items-center gap-3">
            {item.icon}
            {item.label}
          </div>
          {isOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
        </button>
        {isOpen && (
          <div className="mt-1 ml-4 space-y-1">
            {item.children.map((child) => (
              <NavLink
                key={child.path}
                to={child.path}
                className={({ isActive }) =>
                  `block px-4 py-2 text-sm rounded-lg transition-colors ${
                    isActive
                      ? 'bg-brand-600 text-white'
                      : 'text-gray-400 hover:bg-sidebar-hover hover:text-white'
                  }`
                }
              >
                {child.label}
              </NavLink>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <NavLink
      to={item.path!}
      className={({ isActive }) =>
        `flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
          isActive
            ? 'bg-brand-600 text-white'
            : 'text-gray-300 hover:bg-sidebar-hover hover:text-white'
        }`
      }
    >
      {item.icon}
      {item.label}
    </NavLink>
  );
}

export default function MainLayout() {
  const [chatOpen, setChatOpen] = useState(false);

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className="w-64 bg-sidebar flex flex-col">
        {/* Logo */}
        <div className="px-6 py-5 border-b border-gray-800">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-brand-500 rounded-lg flex items-center justify-center">
              <Sparkles size={18} className="text-white" />
            </div>
            <span className="text-xl font-bold text-white">NexusERP</span>
          </div>
          <p className="text-xs text-gray-500 mt-1">AI-Native Enterprise Platform</p>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {navigation.map((item) => (
            <NavItemComponent key={item.label} item={item} />
          ))}
        </nav>

        {/* Company info */}
        <div className="px-4 py-4 border-t border-gray-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gray-700 rounded-lg flex items-center justify-center">
              <Building2 size={20} className="text-gray-400" />
            </div>
            <div>
              <p className="text-sm font-medium text-white">Nexus Manufacturing</p>
              <p className="text-xs text-gray-500">FY 2025 - Q1</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6">
          <div>
            <h1 className="text-lg font-semibold text-gray-900">
              Nexus Manufacturing Co.
            </h1>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={() => setChatOpen(!chatOpen)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                chatOpen
                  ? 'bg-brand-600 text-white'
                  : 'bg-brand-50 text-brand-600 hover:bg-brand-100'
              }`}
            >
              <MessageSquare size={18} />
              <span className="font-medium">AI Assistant</span>
            </button>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-auto">
          <Outlet />
        </main>
      </div>

      {/* AI Chat Panel */}
      <ChatPanel isOpen={chatOpen} onClose={() => setChatOpen(false)} />
    </div>
  );
}
