import { useEffect, useState } from 'react'
import { NavLink, Outlet, Route, Routes, useLocation, useNavigate } from 'react-router-dom'
import { api } from './api/client.js'
import farmMark from './assets/batloung-farm-mark.svg'
import AppIcon from './components/AppIcon.jsx'
import DashboardPage from './pages/DashboardPage.jsx'
import FruitsPage from './pages/FruitsPage.jsx'
import PaymentsPage from './pages/PaymentsPage.jsx'
import PurchasesPage from './pages/PurchasesPage.jsx'
import ReportsPage from './pages/ReportsPage.jsx'
import SalesPage from './pages/SalesPage.jsx'
import StockPage from './pages/StockPage.jsx'
import SuppliersPage from './pages/SuppliersPage.jsx'
import VendorsPage from './pages/VendorsPage.jsx'

const navigation = [
  { label: 'Overview', path: '/', icon: 'overview' },
  { label: 'Suppliers', path: '/suppliers', icon: 'suppliers' },
  { label: 'Fruits', path: '/fruits', icon: 'fruits' },
  { label: 'Stock levels', path: '/stock', icon: 'stock' },
  { label: 'Vendors', path: '/vendors', icon: 'vendors' },
  { label: 'Purchases', path: '/purchases', icon: 'purchases' },
  { label: 'Sales', path: '/sales', icon: 'sales' },
  { label: 'Payments', path: '/payments', icon: 'payments' },
  { label: 'Reports', path: '/reports', icon: 'reports' },
]

const pageTitles = Object.fromEntries(navigation.map((item) => [item.path, item.label]))

function AppLayout() {
  const location = useLocation()
  const navigate = useNavigate()
  const [connection, setConnection] = useState('checking')
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    let active = true
    api.health()
      .then(() => active && setConnection('online'))
      .catch(() => active && setConnection('offline'))
    return () => {
      active = false
    }
  }, [])

  const title = pageTitles[location.pathname] ?? 'Overview'

  return (
    <div className={`app-shell ${menuOpen ? 'menu-open' : ''}`}>
      <aside className="sidebar">
        <button
          className="brand-lockup"
          onClick={() => navigate('/')}
          type="button"
          aria-label="Batloung Farm home"
        >
          <span className="brand-mark"><img src={farmMark} alt="" /></span>
          <span className="brand-copy">
            <strong>Batloung Farm</strong>
            <small>Distribution system</small>
          </span>
        </button>

        <div className="sidebar-section-label">Workspace</div>
        <nav className="main-nav" aria-label="Main navigation">
          {navigation.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === '/'}
              onClick={() => setMenuOpen(false)}
              className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
            >
              <span className="nav-mark" data-icon={item.icon}><AppIcon name={item.icon} /></span>
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div className={`connection-indicator ${connection}`}>
            <span />
            {connection === 'online'
              ? 'API connected'
              : connection === 'offline'
                ? 'API unavailable'
                : 'Checking API'}
          </div>
          <p>Maseru, Lesotho</p>
        </div>
      </aside>

      <div className="main-column">
        <header className="topbar">
          <button
            type="button"
            className="mobile-menu-button"
            onClick={() => setMenuOpen((open) => !open)}
            aria-label="Toggle navigation"
          >
            <span />
            <span />
            <span />
          </button>
          <div className="breadcrumb">
            <span>Workspace</span>
            <span className="breadcrumb-separator">/</span>
            <strong>{title}</strong>
          </div>
          <div className="topbar-date">
            <span className="date-dot" />
            Fresh produce operations
          </div>
        </header>
        {menuOpen && <button className="mobile-scrim" onClick={() => setMenuOpen(false)} aria-label="Close navigation" />}
        <main className="page-content" data-page={location.pathname.split('/')[1] || 'overview'}>
          <Outlet />
        </main>
        <footer className="app-footer">
          <span>Batloung Farm Distribution System</span>
          <span>Lesotho district operations</span>
        </footer>
      </div>
    </div>
  )
}

function NotFoundPage() {
  return (
    <section className="not-found">
      <p className="eyebrow">404 · Page not found</p>
      <h1>This page is not in the workspace.</h1>
      <NavLink className="button button-primary" to="/">Return to overview</NavLink>
    </section>
  )
}

export default function App() {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route index element={<DashboardPage />} />
        <Route path="suppliers" element={<SuppliersPage />} />
        <Route path="fruits" element={<FruitsPage />} />
        <Route path="stock" element={<StockPage />} />
        <Route path="vendors" element={<VendorsPage />} />
        <Route path="purchases" element={<PurchasesPage />} />
        <Route path="sales" element={<SalesPage />} />
        <Route path="payments" element={<PaymentsPage />} />
        <Route path="reports" element={<ReportsPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  )
}

