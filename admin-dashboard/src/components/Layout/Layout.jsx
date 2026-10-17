import './Layout.css'
import { useState, useEffect, useRef, useCallback } from 'react'
import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useTheme, useAuth } from '../../App'
import { notificationsApi } from '../../services/api'
import {
  LayoutDashboard, Store, Users, CreditCard, Megaphone,
  HeadphonesIcon, Settings, LogOut, Menu, X, Sun, Moon,
  Languages, Bell, Droplets, CheckCheck, Store as StoreIcon,
  MessageSquare, AlertTriangle, CreditCard as DebtIcon,
  FileEdit, ArrowRight, Loader2, RefreshCw
} from 'lucide-react'

const NAV_ITEMS = [
  { to: '/dashboard',             icon: LayoutDashboard, labelAr: 'لوحة المؤشرات',    labelEn: 'Dashboard' },
  { to: '/dashboard/laundries',   icon: Store,            labelAr: 'المغاسل',           labelEn: 'Laundries' },
  { to: '/dashboard/customers',   icon: Users,            labelAr: 'العملاء',           labelEn: 'Customers' },
  { to: '/dashboard/subscriptions',icon: CreditCard,      labelAr: 'الباقات والعمولات', labelEn: 'Packages & Commissions' },
  { to: '/dashboard/ads',         icon: Megaphone,        labelAr: 'الإعلانات',         labelEn: 'Ads' },
  { to: '/dashboard/support',     icon: HeadphonesIcon,   labelAr: 'الدعم الفني',       labelEn: 'Support' },
  { to: '/dashboard/settings',    icon: Settings,         labelAr: 'الإعدادات',         labelEn: 'Settings' },
]

// أيقونة لكل نوع إشعار
function NotifIcon({ type }) {
  const style = { flexShrink: 0, width: 36, height: 36, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }
  switch (type) {
    case 'new_laundry_registered':
      return <div style={{ ...style, background: 'var(--primary-50)', color: 'var(--primary-500)' }}><StoreIcon size={18} /></div>
    case 'new_support_ticket':
    case 'new_chat_message':
      return <div style={{ ...style, background: '#eff6ff', color: '#3b82f6' }}><MessageSquare size={18} /></div>
    case 'debt_limit_reached':
      return <div style={{ ...style, background: '#fef2f2', color: 'var(--danger)' }}><DebtIcon size={18} /></div>
    case 'data_update_request':
      return <div style={{ ...style, background: '#fffbeb', color: '#f59e0b' }}><FileEdit size={18} /></div>
    default:
      return <div style={{ ...style, background: 'var(--bg-2)', color: 'var(--text-muted)' }}><Bell size={18} /></div>
  }
}

function timeAgo(dateStr, lang) {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  const hrs  = Math.floor(mins / 60)
  const days = Math.floor(hrs / 24)
  if (lang === 'ar') {
    if (mins < 1)  return 'الآن'
    if (mins < 60) return `منذ ${mins} دقيقة`
    if (hrs < 24)  return `منذ ${hrs} ساعة`
    return `منذ ${days} يوم`
  } else {
    if (mins < 1)  return 'just now'
    if (mins < 60) return `${mins}m ago`
    if (hrs < 24)  return `${hrs}h ago`
    return `${days}d ago`
  }
}

import { playNotificationSound } from '../../utils/sound'

export default function Layout() {
  const { theme, toggleTheme, lang, toggleLang } = useTheme()
  const { logout, user } = useAuth()
  const navigate = useNavigate()
  const [sidebarOpen, setSidebarOpen]   = useState(true)
  const [notifOpen, setNotifOpen]       = useState(false)
  const [notifications, setNotifications] = useState([])
  const [unreadCount, setUnreadCount]   = useState(0)
  const [loadingNotifs, setLoadingNotifs] = useState(false)
  const [markingAll, setMarkingAll]     = useState(false)
  const dropdownRef    = useRef(null)
  const prevUnreadRef  = useRef(-1)    // -1 = لم يُحمَّل بعد
  const prevLatestIdRef = useRef(null)

  const label = (ar, en) => lang === 'ar' ? ar : en

  // ── طلب إذن Browser Notifications ─────────────────
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission()
    }
  }, [])

  // ── إشعار Browser Desktop ──────────────────────────
  const showBrowserNotif = useCallback((title, body) => {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(title, { body, icon: '/favicon.ico' })
    }
  }, [])

  // ── جلب الإشعارات من /admin/notifications ──────────
  const fetchNotifications = useCallback(async () => {
    setLoadingNotifs(true)
    try {
      const res = await notificationsApi.getAll({ limit: 25 })
      const data = res.data?.data || []
      const meta = res.data?.meta || {}
      const newUnread = meta.unreadCount ?? data.filter(n => !n.isRead).length
      const latestId = data[0]?.id

      // اكتشاف إشعارات جديدة — تشغيل الصوت وإشعار المتصفح فوراً
      const hasNewIncoming =
        prevUnreadRef.current >= 0 &&
        (newUnread > prevUnreadRef.current || (latestId && latestId !== prevLatestIdRef.current && !data[0]?.isRead))

      if (hasNewIncoming) {
        playNotificationSound()
        const latestNew = data.find(n => !n.isRead) || data[0]
        if (latestNew) {
          showBrowserNotif(latestNew.title, latestNew.body)
        }
      }

      prevUnreadRef.current = newUnread
      prevLatestIdRef.current = latestId
      setNotifications(data)
      setUnreadCount(newUnread)
    } catch (err) {
      console.error('Failed to fetch notifications', err)
    } finally {
      setLoadingNotifs(false)
    }
  }, [showBrowserNotif])

  // جلب الإشعارات عند التحميل ثم كل 4 ثوانٍ للاستجابة السريعة
  useEffect(() => {
    fetchNotifications()
    const interval = setInterval(fetchNotifications, 4000)
    return () => clearInterval(interval)
  }, [fetchNotifications])

  // فتح القائمة يعيد جلب الإشعارات
  useEffect(() => {
    if (notifOpen) fetchNotifications()
  }, [notifOpen, fetchNotifications])

  // إغلاق القائمة عند النقر خارجها
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setNotifOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // ── تحديد إشعار واحد كمقروء والانتقال لوجهته ──────
  const handleNotifClick = async (notif) => {
    try {
      if (!notif.isRead) {
        await notificationsApi.markRead(notif.id)
        setNotifications(prev => prev.map(n => n.id === notif.id ? { ...n, isRead: true } : n))
        setUnreadCount(c => Math.max(0, c - 1))
      }
    } catch (_) {}
    setNotifOpen(false)
    if (notif.actionUrl) navigate(notif.actionUrl)
  }

  // ── تحديد الكل كمقروء ─────────────────────────────
  const handleMarkAllRead = async () => {
    setMarkingAll(true)
    try {
      await notificationsApi.markAllRead()
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })))
      setUnreadCount(0)
    } catch (_) {} finally {
      setMarkingAll(false)
    }
  }

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
              end={to === '/dashboard'}
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

            {/* ── Notifications Bell ── */}
            <div className="dropdown" ref={dropdownRef} style={{ position: 'relative' }}>
              <button
                id="notif-bell-btn"
                className="btn btn-ghost btn-icon notif-btn"
                onClick={() => setNotifOpen(o => !o)}
                aria-label={label('الإشعارات', 'Notifications')}
              >
                <Bell size={20} />
                {unreadCount > 0 && (
                  <span className="notif-badge">{unreadCount > 99 ? '99+' : unreadCount}</span>
                )}
              </button>

              {notifOpen && (
                <div
                  id="notif-dropdown"
                  className="dropdown-menu notif-menu"
                  style={{ minWidth: 360, maxWidth: 400 }}
                >
                  {/* Header */}
                  <div className="notif-header" style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span className="fw-bold fs-sm">{label('الإشعارات', 'Notifications')}</span>
                      {unreadCount > 0 && (
                        <span style={{ background: 'var(--primary-500)', color: 'white', borderRadius: 20, padding: '1px 8px', fontSize: 11, fontWeight: 700 }}>
                          {unreadCount}
                        </span>
                      )}
                    </div>
                    <div style={{ display: 'flex', gap: 4 }}>
                      <button
                        className="btn btn-ghost btn-icon btn-sm"
                        onClick={fetchNotifications}
                        title={label('تحديث', 'Refresh')}
                        disabled={loadingNotifs}
                      >
                        <RefreshCw size={14} className={loadingNotifs ? 'animate-spin' : ''} />
                      </button>
                      {unreadCount > 0 && (
                        <button
                          id="mark-all-read-btn"
                          className="btn btn-ghost btn-sm"
                          style={{ fontSize: 12, color: 'var(--primary-500)', display: 'flex', alignItems: 'center', gap: 4 }}
                          onClick={handleMarkAllRead}
                          disabled={markingAll}
                        >
                          {markingAll ? <Loader2 size={12} className="animate-spin" /> : <CheckCheck size={13} />}
                          {label('تحديد الكل كمقروء', 'Mark all read')}
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Body */}
                  <div style={{ maxHeight: 420, overflowY: 'auto' }}>
                    {loadingNotifs && notifications.length === 0 ? (
                      <div style={{ padding: 32, textAlign: 'center' }}>
                        <Loader2 size={22} className="animate-spin" style={{ color: 'var(--primary-500)', margin: '0 auto 8px' }} />
                        <p className="fs-xs text-muted">{label('جاري التحميل...', 'Loading...')}</p>
                      </div>
                    ) : notifications.length > 0 ? (
                      notifications.map((n) => (
                        <div
                          key={n.id}
                          id={`notif-item-${n.id}`}
                          onClick={() => handleNotifClick(n)}
                          style={{
                            display: 'flex',
                            gap: 12,
                            padding: '12px 16px',
                            cursor: 'pointer',
                            background: n.isRead ? 'transparent' : 'var(--primary-50)',
                            borderBottom: '1px solid var(--border)',
                            transition: 'background 0.15s',
                            alignItems: 'flex-start',
                          }}
                          onMouseEnter={e => e.currentTarget.style.background = n.isRead ? 'var(--bg-2)' : 'var(--primary-100)'}
                          onMouseLeave={e => e.currentTarget.style.background = n.isRead ? 'transparent' : 'var(--primary-50)'}
                        >
                          <NotifIcon type={n.type} />
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
                              <span
                                className="fs-sm fw-semi"
                                style={{
                                  fontWeight: n.isRead ? 500 : 700,
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis',
                                  whiteSpace: 'nowrap',
                                  maxWidth: 200,
                                }}
                              >
                                {n.title}
                              </span>
                              <span className="fs-xs text-muted" style={{ flexShrink: 0 }}>
                                {timeAgo(n.createdAt, lang)}
                              </span>
                            </div>
                            <p
                              className="fs-xs text-muted"
                              style={{ marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                            >
                              {n.body}
                            </p>
                            {n.actionUrl && (
                              <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 4, color: 'var(--primary-500)', fontSize: 11, fontWeight: 600 }}>
                                <ArrowRight size={11} />
                                <span>{label('انتقل للصفحة', 'Go to page')}</span>
                              </div>
                            )}
                          </div>
                          {!n.isRead && (
                            <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--primary-500)', flexShrink: 0, marginTop: 4 }} />
                          )}
                        </div>
                      ))
                    ) : (
                      <div style={{ padding: '40px 16px', textAlign: 'center' }}>
                        <Bell size={32} style={{ color: 'var(--border)', margin: '0 auto 12px', display: 'block' }} />
                        <p className="fs-sm text-muted">{label('لا توجد إشعارات حالياً', 'No notifications yet')}</p>
                      </div>
                    )}
                  </div>

                  {/* Footer */}
                  {notifications.length > 0 && (
                    <div style={{ padding: '10px 16px', borderTop: '1px solid var(--border)', textAlign: 'center' }}>
                      <button
                        className="btn btn-ghost btn-sm"
                        style={{ fontSize: 12, color: 'var(--text-muted)', width: '100%' }}
                        onClick={() => { setNotifOpen(false); navigate('/dashboard/settings?tab=notifications') }}
                      >
                        {label('إعدادات الإشعارات', 'Notification settings')}
                      </button>
                    </div>
                  )}
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
              <div className="avatar-placeholder avatar-sm" style={{ fontSize: '0.8rem' }}>
                {user?.name ? user.name.charAt(0).toUpperCase() : 'م'}
              </div>
              {sidebarOpen && (
                <div className="admin-info">
                  <span className="fs-sm fw-semi">{user?.name || label('مدير النظام', 'System Admin')}</span>
                  <span className="fs-xs text-muted">{user?.email || (user?.role === 'admin' ? label('مدير النظام', 'System Admin') : label('مدير', 'Admin'))}</span>
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
