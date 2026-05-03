import { useState } from 'react'
import { useTheme } from '../App'
import {
  Phone, Globe, Moon, Sun, Languages, Bell, Shield,
  Save, Plus, Trash2, Edit, MessageSquare, Smartphone
} from 'lucide-react'

const CONTACT_NUMBERS = [
  { id: 1, label: 'دعم فني عام', labelEn: 'General Support', number: '920000001', active: true },
  { id: 2, label: 'شكاوى المغاسل', labelEn: 'Laundry Complaints', number: '920000002', active: true },
  { id: 3, label: 'الفوترة والاشتراكات', labelEn: 'Billing & Subscriptions', number: '920000003', active: false },
]

export default function SettingsPage() {
  const { lang, toggleLang, theme, toggleTheme } = useTheme()
  const label = (ar, en) => lang === 'ar' ? ar : en
  const [tab, setTab] = useState('general')
  const [contacts, setContacts] = useState(CONTACT_NUMBERS)
  const [editingContact, setEditingContact] = useState(null)

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
        <div className="card">
          <div className="card-header"><h3 className="fw-bold">{label('إعدادات الإشعارات', 'Notification Settings')}</h3></div>
          <div className="card-body flex flex-col gap-16">
            {[
              [label('إشعار عند مغسلة جديدة بانتظار التفعيل', 'Alert when new laundry awaits activation'), true],
              [label('إشعار عند انتهاء اشتراك خلال 7 أيام', 'Alert when subscription expires in 7 days'), true],
              [label('إشعار عند تذكرة دعم جديدة', 'Alert on new support ticket'), true],
              [label('إشعار عند تذكرة عاجلة', 'Alert on urgent ticket'), true],
              [label('ملخص يومي للنظام', 'Daily system summary'), false],
            ].map(([text, enabled], i) => (
              <div key={i} className="flex items-center justify-between">
                <span className="fs-sm">{text}</span>
                <div
                  style={{ width: 44, height: 24, borderRadius: 12, background: enabled ? 'var(--primary-500)' : 'var(--gray-300)', cursor: 'pointer', position: 'relative', transition: 'background 0.2s', flexShrink: 0 }}
                >
                  <div style={{ position: 'absolute', width: 18, height: 18, borderRadius: '50%', background: 'white', top: 3, transition: 'right 0.2s', right: enabled ? 23 : 3, boxShadow: '0 1px 4px rgba(0,0,0,0.2)' }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === 'security' && (
        <div className="grid" style={{ gridTemplateColumns: '1fr 1fr', gap: 20 }}>
          <div className="card">
            <div className="card-header"><h3 className="fw-bold">{label('كلمة المرور', 'Password')}</h3></div>
            <div className="card-body flex flex-col gap-4">
              <div className="form-group">
                <label className="form-label">{label('كلمة المرور الحالية', 'Current Password')}</label>
                <input type="password" className="form-control ltr" dir="ltr" placeholder="••••••••" />
              </div>
              <div className="form-group">
                <label className="form-label">{label('كلمة المرور الجديدة', 'New Password')}</label>
                <input type="password" className="form-control ltr" dir="ltr" placeholder="••••••••" />
                <p className="form-hint">{label('8 أحرف على الأقل، تحتوي على أرقام وحروف', 'At least 8 chars with numbers and letters')}</p>
              </div>
              <div className="form-group">
                <label className="form-label">{label('تأكيد كلمة المرور', 'Confirm Password')}</label>
                <input type="password" className="form-control ltr" dir="ltr" placeholder="••••••••" />
              </div>
              <button className="btn btn-primary"><Save size={15} /> {label('حفظ', 'Save')}</button>
            </div>
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
