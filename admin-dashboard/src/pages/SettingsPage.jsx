import { useState, useEffect } from 'react'
import { useTheme, useAuth } from '../App'
import { profileApi, notificationsApi } from '../services/api'
import {
  Phone, Globe, Moon, Sun, Languages, Bell, Shield,
  Save, Plus, Trash2, Edit, MessageSquare, Smartphone,
  Mail, Lock, Eye, EyeOff, CheckCircle, AlertCircle, AlertTriangle, Loader2,
  Store, FileEdit, CreditCard, SlidersHorizontal
} from 'lucide-react'

const CONTACT_NUMBERS = [
  { id: 1, label: 'دعم فني عام', labelEn: 'General Support', number: '920000001', active: true },
  { id: 2, label: 'شكاوى المغاسل', labelEn: 'Laundry Complaints', number: '920000002', active: true },
  { id: 3, label: 'الفوترة والاشتراكات', labelEn: 'Billing & Subscriptions', number: '920000003', active: false },
]

export default function SettingsPage() {
  const { lang, toggleLang, theme, toggleTheme } = useTheme()
  const { user, updateUser } = useAuth()
  const label = (ar, en) => lang === 'ar' ? ar : en
  const [tab, setTab] = useState('general')
  const [contacts, setContacts] = useState(CONTACT_NUMBERS)
  const [editingContact, setEditingContact] = useState(null)

  // Security (Email & Password) State
  const [email, setEmail] = useState(user?.email || '')
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showCurrentPwd, setShowCurrentPwd] = useState(false)
  const [showNewPwd, setShowNewPwd] = useState(false)
  const [showConfirmPwd, setShowConfirmPwd] = useState(false)
  const [securityLoading, setSecurityLoading] = useState(false)
  const [securityStatus, setSecurityStatus] = useState(null)

  // Notification Settings State
  const DEFAULT_NOTIF = {
    notif_new_laundry      : true,
    notif_support_ticket   : true,
    notif_chat_message     : true,
    notif_data_update      : true,
    notif_debt_limit       : true,
    notif_expiring_sub     : true,
    notif_daily_summary    : false,
  }
  const [notifSettings, setNotifSettings] = useState(DEFAULT_NOTIF)
  const [notifLoading, setNotifLoading] = useState(false)
  const [notifSaving, setNotifSaving] = useState(false)
  const [notifStatus, setNotifStatus] = useState(null)

  // Sync email when user state updates
  useEffect(() => {
    if (user?.email) {
      setEmail(user.email)
    }
  }, [user?.email])

  // Load notification settings from backend (app_settings)
  useEffect(() => {
    if (tab !== 'notifications') return
    setNotifLoading(true)
    notificationsApi.getSettings()
      .then(res => {
        const data = res.data?.data || {}
        const merged = { ...DEFAULT_NOTIF }
        Object.keys(DEFAULT_NOTIF).forEach(key => {
          if (key in data) merged[key] = data[key]?.value === 'true' || data[key]?.value === true
        })
        setNotifSettings(merged)
      })
      .catch(() => {
        // fallback: load from localStorage
        try {
          const stored = JSON.parse(localStorage.getItem('adminNotifSettings') || '{}')
          if (Object.keys(stored).length) setNotifSettings(s => ({ ...s, ...stored }))
        } catch (_) {}
      })
      .finally(() => setNotifLoading(false))
  }, [tab])

  const handleToggleNotif = async (key) => {
    const newValue = !notifSettings[key]
    setNotifSettings(prev => ({ ...prev, [key]: newValue }))
    // حفظ في localStorage فوراً
    const updated = { ...notifSettings, [key]: newValue }
    localStorage.setItem('adminNotifSettings', JSON.stringify(updated))
    // حفظ في قاعدة البيانات
    try {
      await notificationsApi.updateSetting(key, String(newValue))
    } catch (_) {}
  }

  const handleSaveAllNotif = async () => {
    setNotifSaving(true)
    setNotifStatus(null)
    try {
      await Promise.all(
        Object.entries(notifSettings).map(([key, val]) =>
          notificationsApi.updateSetting(key, String(val))
        )
      )
      localStorage.setItem('adminNotifSettings', JSON.stringify(notifSettings))
      setNotifStatus({ type: 'success', message: label('تم حفظ إعدادات الإشعارات بنجاح', 'Notification settings saved successfully') })
    } catch (_) {
      setNotifStatus({ type: 'danger', message: label('حدث خطأ أثناء الحفظ', 'Error saving settings') })
    } finally {
      setNotifSaving(false)
      setTimeout(() => setNotifStatus(null), 3000)
    }
  }

  // Fetch latest profile info on mount
  useEffect(() => {
    let mounted = true
    profileApi.getProfile()
      .then(res => {
        const data = res.data?.data || res.data
        if (mounted && data?.email) {
          setEmail(data.email)
          updateUser(data)
        }
      })
      .catch(() => {})
    return () => { mounted = false }
  }, [])

  const handleSecuritySubmit = async (e) => {
    e.preventDefault()
    setSecurityStatus(null)

    const trimmedEmail = email.trim()
    const currentEmail = (user?.email || '').trim()
    const emailChanged = trimmedEmail.toLowerCase() !== currentEmail.toLowerCase()
    const passwordChanged = Boolean(newPassword)

    if (!emailChanged && !passwordChanged) {
      setSecurityStatus({
        type: 'warning',
        message: label('لم يتم إجراء أي تعديل على البريد أو كلمة المرور', 'No changes were made to email or password')
      })
      return
    }

    if (!currentPassword) {
      setSecurityStatus({
        type: 'danger',
        message: label('يرجى إدخال كلمة المرور الحالية لتأكيد التعديل', 'Please enter your current password to confirm changes')
      })
      return
    }

    if (emailChanged) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!trimmedEmail || !emailRegex.test(trimmedEmail)) {
        setSecurityStatus({
          type: 'danger',
          message: label('يرجى إدخال بريد إلكتروني صحيح', 'Please enter a valid email address')
        })
        return
      }
    }

    if (passwordChanged) {
      if (newPassword.length < 8) {
        setSecurityStatus({
          type: 'danger',
          message: label('كلمة المرور الجديدة يجب أن تكون 8 أحرف على الأقل', 'New password must be at least 8 characters')
        })
        return
      }
      const hasLetterAndNumber = /^(?=.*[A-Za-z])(?=.*\d)/.test(newPassword)
      if (!hasLetterAndNumber) {
        setSecurityStatus({
          type: 'danger',
          message: label('كلمة المرور يجب أن تحتوي على حروف وأرقام', 'Password must contain both letters and numbers')
        })
        return
      }
      if (newPassword !== confirmPassword) {
        setSecurityStatus({
          type: 'danger',
          message: label('كلمة المرور الجديدة وتأكيدها غير متطابقين', 'New password and confirmation do not match')
        })
        return
      }
    }

    setSecurityLoading(true)

    try {
      if (emailChanged) {
        await profileApi.updateEmail({
          newEmail: trimmedEmail,
          currentPassword,
        })
        updateUser({ email: trimmedEmail })
      }

      if (passwordChanged) {
        await profileApi.updatePassword({
          currentPassword,
          newPassword,
          confirmPassword,
        })
      }

      let successMsg = ''
      if (emailChanged && passwordChanged) {
        successMsg = label('تم تحديث البريد الإلكتروني وكلمة المرور بنجاح', 'Email and password updated successfully')
      } else if (emailChanged) {
        successMsg = label('تم تحديث البريد الإلكتروني بنجاح', 'Email updated successfully')
      } else {
        successMsg = label('تم تحديث كلمة المرور بنجاح', 'Password updated successfully')
      }

      setSecurityStatus({ type: 'success', message: successMsg })
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
    } catch (err) {
      const errorMsg =
        err.response?.data?.message ||
        err.response?.data?.error?.message ||
        label('حدث خطأ أثناء حفظ التعديلات', 'An error occurred while saving changes')
      setSecurityStatus({ type: 'danger', message: errorMsg })
    } finally {
      setSecurityLoading(false)
    }
  }

  return (
    <div className="animate-fade">
      <div className="page-header">
        <div>
          <h1 className="page-title">{label('الإعدادات', 'Settings')}</h1>
          <p className="page-subtitle">{label('إعدادات النظام والتخصيص', 'System configuration and customization')}</p>
        </div>
      </div>

      <div className="tabs">
        {[['general', 'عام', 'General'], ['contacts', 'أرقام التواصل', 'Contact Numbers'], ['notifications', 'الإشعارات', 'Notifications'], ['security', 'الأمان', 'Security']].map(([k, ar, en]) => (
          <button key={k} className={`tab-btn ${tab === k ? 'active' : ''}`} onClick={() => setTab(k)}>{label(ar, en)}</button>
        ))}
      </div>

      {tab === 'general' && (
        <div className="grid" style={{ gridTemplateColumns: '1fr 1fr', gap: 20 }}>
          {/* Appearance */}
          <div className="card">
            <div className="card-header"><h3 className="fw-bold">{label('المظهر والعرض', 'Appearance')}</h3></div>
            <div className="card-body flex flex-col gap-20">
              {/* Theme */}
              <div className="flex items-center justify-between">
                <div>
                  <p className="fw-semi fs-sm">{label('وضع العرض', 'Display Mode')}</p>
                  <p className="text-muted fs-xs">{label('اختر بين الوضع الفاتح والداكن', 'Choose between light and dark mode')}</p>
                </div>
                <div className="flex items-center gap-8">
                  <button className={`btn btn-sm ${theme === 'light' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => theme !== 'light' && toggleTheme()}>
                    <Sun size={14} /> {label('فاتح', 'Light')}
                  </button>
                  <button className={`btn btn-sm ${theme === 'dark' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => theme !== 'dark' && toggleTheme()}>
                    <Moon size={14} /> {label('داكن', 'Dark')}
                  </button>
                </div>
              </div>
              <hr className="divider" style={{ margin: 0 }} />
              {/* Language */}
              <div className="flex items-center justify-between">
                <div>
                  <p className="fw-semi fs-sm">{label('اللغة', 'Language')}</p>
                  <p className="text-muted fs-xs">{label('لغة واجهة لوحة الإدارة', 'Admin dashboard language')}</p>
                </div>
                <div className="flex items-center gap-8">
                  <button className={`btn btn-sm ${lang === 'ar' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => lang !== 'ar' && toggleLang()}>
                    🇸🇦 عربي
                  </button>
                  <button className={`btn btn-sm ${lang === 'en' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => lang !== 'en' && toggleLang()}>
                    🇬🇧 English
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* System Info */}
          <div className="card">
            <div className="card-header"><h3 className="fw-bold">{label('معلومات النظام', 'System Info')}</h3></div>
            <div className="card-body flex flex-col gap-16">
              {[
                [label('اسم النظام', 'System Name'), 'مغسلتي بلس'],
                [label('الإصدار', 'Version'), 'v1.0.0'],
                [label('البيئة', 'Environment'), 'Production'],
                [label('قاعدة البيانات', 'Database'), 'PostgreSQL 16'],
                [label('خادم الإشعارات', 'Notifications'), 'Firebase FCM'],
                [label('السوق المستهدف', 'Target Market'), label('الخليج العربي + اليمن', 'Gulf + Yemen')],
              ].map(([k, v], i) => (
                <div key={i} className="flex items-center justify-between">
                  <span className="text-muted fs-sm">{k}</span>
                  <span className="fw-semi fs-sm">{v}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {tab === 'contacts' && (
        <div className="card">
          <div className="card-header">
            <div>
              <h3 className="fw-bold">{label('أرقام التواصل', 'Contact Numbers')}</h3>
              <p className="text-muted fs-sm mt-4">{label('تظهر هذه الأرقام للمستخدمين في التطبيقات عند الحاجة لتواصل مع الإدارة', 'These numbers appear to users in the apps when contacting support')}</p>
            </div>
            <button className="btn btn-primary btn-sm"><Plus size={14} /> {label('إضافة رقم', 'Add Number')}</button>
          </div>
          <div className="card-body flex flex-col gap-12">
            {contacts.map(c => (
              <div key={c.id} className="card" style={{ boxShadow: 'none', border: '1.5px solid var(--border)' }}>
                <div className="card-body" style={{ padding: '14px 16px' }}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-12">
                      <div style={{ width: 44, height: 44, borderRadius: 10, background: 'var(--primary-50)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary-500)' }}>
                        <Phone size={20} />
                      </div>
                      <div>
                        <div className="fw-semi fs-sm">{lang === 'ar' ? c.label : c.labelEn}</div>
                        <div className="fs-md fw-black ltr" dir="ltr" style={{ color: 'var(--primary-500)', letterSpacing: '0.05em' }}>+966-{c.number}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-8">
                      <span className={`badge badge-${c.active ? 'success' : 'neutral'}`}>
                        {c.active ? label('ظاهر للمستخدمين', 'Visible to users') : label('مخفي', 'Hidden')}
                      </span>
                      <button className="btn btn-ghost btn-icon btn-sm"><Edit size={14} /></button>
                      <button className="btn btn-ghost btn-icon btn-sm" style={{ color: 'var(--danger)' }}><Trash2 size={14} /></button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
            <div className="alert alert-info">
              <Bell size={16} />
              {label('أي تغيير في الأرقام ينعكس فوراً على تطبيقات العميل والمغسلة دون الحاجة لتحديث', 'Any change in numbers reflects immediately in customer and laundry apps without an update')}
            </div>
          </div>
        </div>
      )}

      {tab === 'notifications' && (
        <div className="flex flex-col gap-20">
          {/* القسم الأول: إشعارات العمليات */}
          <div className="card">
            <div className="card-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: 'var(--primary-50)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary-500)' }}>
                  <SlidersHorizontal size={18} />
                </div>
                <div>
                  <h3 className="fw-bold fs-sm" style={{ marginBottom: 2 }}>{label('إشعارات العمليات', 'Operational Notifications')}</h3>
                  <p className="text-muted fs-xs">{label('تنبيهات فورية عند وقوع أحداث تستلزم تدخل الإدارة', 'Instant alerts for events requiring admin action')}</p>
                </div>
              </div>
            </div>
            <div className="card-body flex flex-col gap-0">
              {notifLoading ? (
                <div style={{ padding: 24, textAlign: 'center' }}>
                  <Loader2 size={20} className="animate-spin" style={{ color: 'var(--primary-500)', margin: '0 auto' }} />
                </div>
              ) : (
                [
                  {
                    key: 'notif_new_laundry',
                    icon: <Store size={18} />,
                    iconBg: 'var(--primary-50)',
                    iconColor: 'var(--primary-500)',
                    ar: 'تسجيل مغسلة جديدة',
                    en: 'New laundry registration',
                    descAr: 'تنبيه فوري عند تسجيل مغسلة جديدة تنتظر مراجعة الإدارة والموافقة',
                    descEn: 'Instant alert when a new laundry registers and awaits admin approval',
                  },
                  {
                    key: 'notif_support_ticket',
                    icon: <Bell size={18} />,
                    iconBg: '#eff6ff',
                    iconColor: '#3b82f6',
                    ar: 'تذكرة دعم فني جديدة',
                    en: 'New support ticket',
                    descAr: 'تنبيه عند فتح تذكرة دعم جديدة من عميل أو مغسلة',
                    descEn: 'Alert when a customer or laundry opens a new support ticket',
                  },
                  {
                    key: 'notif_chat_message',
                    icon: <MessageSquare size={18} />,
                    iconBg: '#f0fdf4',
                    iconColor: '#22c55e',
                    ar: 'رسالة دردشة جديدة',
                    en: 'New chat message',
                    descAr: 'تنبيه عند وصول رسالة جديدة في نافذة الدردشة مع الدعم الفني',
                    descEn: 'Alert when a new message arrives in the support chat window',
                  },
                  {
                    key: 'notif_data_update',
                    icon: <FileEdit size={18} />,
                    iconBg: '#fffbeb',
                    iconColor: '#f59e0b',
                    ar: 'طلب تعديل بيانات حساسة',
                    en: 'Sensitive data update request',
                    descAr: 'تنبيه عند قيام مغسلة بتحديث بيانات السجل التجاري أو الحساب البنكي',
                    descEn: 'Alert when a laundry updates commercial registration or bank account details',
                  },
                  {
                    key: 'notif_debt_limit',
                    icon: <CreditCard size={18} />,
                    iconBg: '#fef2f2',
                    iconColor: 'var(--danger)',
                    ar: 'بلوغ سقف المديونية',
                    en: 'Debt limit reached',
                    descAr: 'تنبيه فوري عندما يبلغ رصيد أي مغسلة الحد الأقصى للمديونية (debt_limit)',
                    descEn: 'Instant alert when any laundry\'s balance reaches the configured debt limit',
                  },
                  {
                    key: 'notif_expiring_sub',
                    icon: <Shield size={18} />,
                    iconBg: '#f5f3ff',
                    iconColor: '#7c3aed',
                    ar: 'اشتراك ينتهي قريباً',
                    en: 'Subscription expiring soon',
                    descAr: 'تنبيه عند قرب انتهاء اشتراك مغسلة خلال 7 أيام',
                    descEn: 'Alert when a laundry subscription expires within 7 days',
                  },
                  {
                    key: 'notif_daily_summary',
                    icon: <Globe size={18} />,
                    iconBg: 'var(--bg-2)',
                    iconColor: 'var(--text-muted)',
                    ar: 'ملخص يومي للنظام',
                    en: 'Daily system summary',
                    descAr: 'تقرير يومي بإجمالي النشاط والإيرادات والإشعارات المهمة',
                    descEn: 'Daily digest of system activity, revenue, and important alerts',
                  },
                ].map(({ key, icon, iconBg, iconColor, ar, en, descAr, descEn }) => (
                  <div
                    key={key}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: 12,
                      padding: '14px 0',
                      borderBottom: '1px solid var(--border)',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, flex: 1, minWidth: 0 }}>
                      <div style={{ width: 38, height: 38, borderRadius: 10, background: iconBg, display: 'flex', alignItems: 'center', justifyContent: 'center', color: iconColor, flexShrink: 0 }}>
                        {icon}
                      </div>
                      <div style={{ minWidth: 0 }}>
                        <p className="fw-semi fs-sm" style={{ marginBottom: 2 }}>{label(ar, en)}</p>
                        <p className="text-muted fs-xs" style={{ lineHeight: 1.4 }}>{label(descAr, descEn)}</p>
                      </div>
                    </div>
                    {/* Toggle Switch */}
                    <button
                      id={`toggle-${key}`}
                      role="switch"
                      aria-checked={notifSettings[key]}
                      onClick={() => handleToggleNotif(key)}
                      style={{
                        width: 48,
                        height: 26,
                        borderRadius: 13,
                        background: notifSettings[key] ? 'var(--primary-500)' : 'var(--gray-300)',
                        border: 'none',
                        cursor: 'pointer',
                        position: 'relative',
                        transition: 'background 0.25s',
                        flexShrink: 0,
                        padding: 0,
                        outline: 'none',
                      }}
                    >
                      <div
                        style={{
                          position: 'absolute',
                          width: 20,
                          height: 20,
                          borderRadius: '50%',
                          background: 'white',
                          top: 3,
                          transition: 'transform 0.25s',
                          transform: notifSettings[key] ? 'translateX(24px)' : 'translateX(3px)',
                          boxShadow: '0 1px 4px rgba(0,0,0,0.25)',
                        }}
                      />
                    </button>
                  </div>
                ))
              )}
            </div>

            {/* Footer: Save all + status */}
            <div className="card-body" style={{ borderTop: '1px solid var(--border)', paddingTop: 14 }}>
              {notifStatus && (
                <div className={`alert alert-${notifStatus.type} animate-fade flex items-center gap-8`} style={{ marginBottom: 12 }}>
                  {notifStatus.type === 'success' ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
                  <span>{notifStatus.message}</span>
                </div>
              )}
              <button
                id="save-notif-settings-btn"
                className="btn btn-primary"
                onClick={handleSaveAllNotif}
                disabled={notifSaving}
              >
                {notifSaving ? (
                  <><Loader2 size={16} className="animate-spin" /><span>{label('جاري الحفظ...', 'Saving...')}</span></>
                ) : (
                  <><Save size={16} /><span>{label('حفظ إعدادات الإشعارات', 'Save notification settings')}</span></>
                )}
              </button>
            </div>
          </div>

          {/* Info card */}
          <div className="alert alert-info" style={{ margin: 0 }}>
            <Bell size={16} />
            {label(
              'هذه الإعدادات تتحكم في الإشعارات التي تصلك داخل لوحة الإدارة. يمكن ربط النظام بـ Firebase FCM لإشعارات الجوال.',
              'These settings control which notifications appear in the admin panel. Firebase FCM can be configured for mobile push notifications.',
            )}
          </div>
        </div>
      )}

      {tab === 'security' && (
        <div className="grid" style={{ gridTemplateColumns: '1fr 1fr', gap: 20 }}>
          <div className="card">
            <div className="card-header">
              <h3 className="fw-bold">{label('البريد الإلكتروني وكلمة المرور', 'Email & Password')}</h3>
            </div>
            <form onSubmit={handleSecuritySubmit} className="card-body flex flex-col gap-16">
              {securityStatus && (
                <div className={`alert alert-${securityStatus.type} animate-fade flex items-center gap-8`}>
                  {securityStatus.type === 'success' && <CheckCircle size={18} style={{ flexShrink: 0 }} />}
                  {securityStatus.type === 'danger' && <AlertCircle size={18} style={{ flexShrink: 0 }} />}
                  {securityStatus.type === 'warning' && <AlertTriangle size={18} style={{ flexShrink: 0 }} />}
                  <span>{securityStatus.message}</span>
                </div>
              )}

              {/* 1) البريد الإلكتروني (قبل كلمة المرور القديمة) */}
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label flex items-center gap-6">
                  <Mail size={15} className="text-muted" />
                  <span>{label('البريد الإلكتروني لتسجيل الدخول', 'Login Email')}</span>
                </label>
                <input
                  type="email"
                  className="form-control ltr"
                  dir="ltr"
                  placeholder="admin@mgsity.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                />
                <p className="form-hint">
                  {label('البريد المستخدم للدخول إلى لوحة تحكم الإدارة', 'Email used to log into admin dashboard')}
                </p>
              </div>

              {/* 2) كلمة المرور الحالية (القديمة) */}
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label flex items-center gap-6">
                  <Lock size={15} className="text-muted" />
                  <span>{label('كلمة المرور الحالية', 'Current Password')}</span>
                  <span className="text-danger">*</span>
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    type={showCurrentPwd ? 'text' : 'password'}
                    className="form-control ltr"
                    dir="ltr"
                    placeholder="••••••••"
                    value={currentPassword}
                    onChange={e => setCurrentPassword(e.target.value)}
                    autoComplete="current-password"
                    style={{ paddingInlineEnd: 40 }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPwd(!showCurrentPwd)}
                    style={{
                      position: 'absolute',
                      [lang === 'ar' ? 'left' : 'right']: 10,
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      color: 'var(--text-muted)',
                      display: 'flex',
                      alignItems: 'center',
                      padding: 4
                    }}
                    title={showCurrentPwd ? label('إخفاء', 'Hide') : label('عرض', 'Show')}
                  >
                    {showCurrentPwd ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                <p className="form-hint">
                  {label('مطلوبة لتأكيد هويتك لحفظ أي تعديل في البريد أو كلمة المرور', 'Required to verify your identity to save changes')}
                </p>
              </div>

              {/* 3) كلمة المرور الجديدة */}
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label flex items-center gap-6">
                  <Lock size={15} className="text-muted" />
                  <span>{label('كلمة المرور الجديدة', 'New Password')}</span>
                  <span className="text-muted fs-xs">({label('اختياري', 'Optional')})</span>
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    type={showNewPwd ? 'text' : 'password'}
                    className="form-control ltr"
                    dir="ltr"
                    placeholder="••••••••"
                    value={newPassword}
                    onChange={e => setNewPassword(e.target.value)}
                    autoComplete="new-password"
                    style={{ paddingInlineEnd: 40 }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPwd(!showNewPwd)}
                    style={{
                      position: 'absolute',
                      [lang === 'ar' ? 'left' : 'right']: 10,
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      color: 'var(--text-muted)',
                      display: 'flex',
                      alignItems: 'center',
                      padding: 4
                    }}
                    title={showNewPwd ? label('إخفاء', 'Hide') : label('عرض', 'Show')}
                  >
                    {showNewPwd ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                <p className="form-hint">
                  {label('اتركها فارغة إذا أردت تعديل البريد فقط (8 أحرف على الأقل تحتوي على حروف وأرقام)', 'Leave empty if only changing email (at least 8 chars with letters & numbers)')}
                </p>
              </div>

              {/* 4) تأكيد كلمة المرور */}
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label flex items-center gap-6">
                  <Lock size={15} className="text-muted" />
                  <span>{label('تأكيد كلمة المرور', 'Confirm Password')}</span>
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    type={showConfirmPwd ? 'text' : 'password'}
                    className="form-control ltr"
                    dir="ltr"
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                    autoComplete="new-password"
                    style={{ paddingInlineEnd: 40 }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPwd(!showConfirmPwd)}
                    style={{
                      position: 'absolute',
                      [lang === 'ar' ? 'left' : 'right']: 10,
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      color: 'var(--text-muted)',
                      display: 'flex',
                      alignItems: 'center',
                      padding: 4
                    }}
                    title={showConfirmPwd ? label('إخفاء', 'Hide') : label('عرض', 'Show')}
                  >
                    {showConfirmPwd ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                className="btn btn-primary"
                disabled={securityLoading}
                style={{ marginTop: 8 }}
              >
                {securityLoading ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    <span>{label('جاري الحفظ...', 'Saving...')}</span>
                  </>
                ) : (
                  <>
                    <Save size={16} />
                    <span>{label('حفظ التعديلات', 'Save Changes')}</span>
                  </>
                )}
              </button>
            </form>
          </div>

          <div className="card">
            <div className="card-header"><h3 className="fw-bold">{label('إعدادات الأمان', 'Security Settings')}</h3></div>
            <div className="card-body flex flex-col gap-16">
              {[
                [label('الحد الأقصى لمحاولات الدخول', 'Max login attempts'), '5 ' + label('محاولات', 'attempts')],
                [label('مدة انتهاء الجلسة', 'Session expiry'), '24 ' + label('ساعة', 'hours')],
                [label('تشفير كلمات المرور', 'Password encryption'), 'bcrypt'],
                [label('بروتوكول الاتصال', 'Connection protocol'), 'HTTPS/TLS 1.3'],
              ].map(([k, v], i) => (
                <div key={i} className="flex items-center justify-between">
                  <span className="text-muted fs-sm">{k}</span>
                  <span className="fw-bold badge badge-success">{v}</span>
                </div>
              ))}
              <div className="alert alert-info">
                <Shield size={16} />
                {label('جميع البيانات مشفرة ومحمية بأعلى معايير الأمان', 'All data is encrypted with highest security standards')}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

