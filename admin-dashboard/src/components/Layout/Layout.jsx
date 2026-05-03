import './Layout.css'
import { useState } from 'react'
import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useTheme, useAuth } from '../../App'
import {
  LayoutDashboard, Store, Users, CreditCard, Megaphone,
  HeadphonesIcon, Settings, LogOut, Menu, X, Sun, Moon,
  Languages, Bell, ChevronDown, Droplets, Shield
} from 'lucide-react'

const NAV_ITEMS = [
  { to: '/',             icon: LayoutDashboard, labelAr: 'لوحة المؤشرات',    labelEn: 'Dashboard' },
  { to: '/laundries',   icon: Store,            labelAr: 'المغاسل',           labelEn: 'Laundries' },
  { to: '/customers',   icon: Users,            labelAr: 'العملاء',           labelEn: 'Customers' },
  { to: '/subscriptions',icon: CreditCard,      labelAr: 'الاشتراكات',        labelEn: 'Subscriptions' },
  { to: '/ads',         icon: Megaphone,        labelAr: 'الإعلانات',         labelEn: 'Ads' },
  { to: '/support',     icon: HeadphonesIcon,   labelAr: 'الدعم الفني',       labelEn: 'Support' },
  { to: '/settings',    icon: Settings,         labelAr: 'الإعدادات',         labelEn: 'Settings' },
]

export default function Layout() {
  const { theme, toggleTheme, lang, toggleLang } = useTheme()
  const { logout } = useAuth()
  const navigate = useNavigate()
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [notifOpen, setNotifOpen] = useState(false)

  const label = (ar, en) => lang === 'ar' ? ar : en

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <div className={`layout ${sidebarOpen ? 'sidebar-open' : 'sidebar-collapsed'}`}>
      {/* ---- Sidebar ---- */}
      <aside className="sidebar">
        <div className="sidebar-logo">
          <div className="logo-icon">
            <Droplets size={22} />
          </div>
          {sidebarOpen && (
            <div className="logo-text">
              <span className="logo-title">{label('مغسلتي', 'Maghsalati')}</span>
              <span className="logo-sub">{label('بلس', 'Plus')}</span>
            </div>
          )}
          <button className="sidebar-toggle btn btn-ghost" onClick={() => setSidebarOpen(o => !o)}>
            {sidebarOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>

        <nav className="sidebar-nav">
          {NAV_ITEMS.map(({ to, icon: Icon, labelAr, labelEn }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
              data-tooltip={!sidebarOpen ? label(labelAr, labelEn) : undefined}
            >
              <span className="nav-icon"><Icon size={20} /></span>
              {sidebarOpen && <span className="nav-label">{label(labelAr, labelEn)}</span>}
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-footer">
          <button className="nav-item logout-btn" onClick={handleLogout}>
            <span className="nav-icon"><LogOut size={20} /></span>
            {sidebarOpen && <span className="nav-label">{label('تسجيل الخروج', 'Logout')}</span>}
          </button>
        </div>
      </aside>

      {/* ---- Main ---- */}
      <div className="main-wrapper">
        {/* Header */}
        <header className="topbar">
          <div className="topbar-right">
            <button className="btn btn-ghost btn-icon" onClick={() => setSidebarOpen(o => !o)}>
              <Menu size={20} />
            </button>
          </div>
          <div className="topbar-left">
            {/* Notifications */}
            <div className="dropdown">
              <button className="btn btn-ghost btn-icon notif-btn" onClick={() => setNotifOpen(o => !o)}>
                <Bell size={20} />
                <span className="notif-badge">3</span>
              </button>
              {notifOpen && (
                <div className="dropdown-menu notif-menu" style={{ minWidth: 320 }}>
                  <div className="notif-header">
                    <span className="fw-bold">{label('الإشعارات', 'Notifications')}</span>
                    <button className="btn btn-ghost fs-xs text-primary">{label('تحديد كمقروء', 'Mark all read')}</button>
                  </div>
                  {[
                    { title: label('مغسلة جديدة بانتظار التفعيل', 'New laundry awaiting activation'), time: label('منذ 5 دقائق', '5m ago'), type: 'info' },
                    { title: label('اشتراك مغسلة النور ينتهي قريباً', 'Al-Noor laundry subscription expiring'), time: label('منذ 20 دقيقة', '20m ago'), type: 'warning' },
                    { title: label('تذكرة دعم جديدة من عميل', 'New support ticket from customer'), time: label('منذ ساعة', '1h ago'), type: 'primary' },
                  ].map((n, i) => (
                    <div key={i} className="notif-item">
                      <div className={`status-dot ${n.type === 'info' ? 'active' : n.type === 'warning' ? 'warning' : 'danger'}`} />
                      <div className="flex-1">
                        <div className="fs-sm fw-medium">{n.title}</div>
                        <div className="fs-xs text-muted mt-4">{n.time}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Language toggle */}
            <button className="btn btn-ghost btn-icon" onClick={toggleLang} data-tooltip={label('English', 'عربي')}>
              <Languages size={20} />
            </button>

            {/* Theme toggle */}
            <button className="btn btn-ghost btn-icon" onClick={toggleTheme}>
              {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
            </button>

            {/* Admin Avatar */}
            <div className="admin-profile">
              <div className="avatar-placeholder avatar-sm" style={{ fontSize: '0.8rem' }}>م</div>
              {sidebarOpen && (
                <div className="admin-info">
                  <span className="fs-sm fw-semi">{label('مدير النظام', 'System Admin')}</span>
                  <span className="fs-xs text-muted">{label('مدير', 'Admin')}</span>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="page-content">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
