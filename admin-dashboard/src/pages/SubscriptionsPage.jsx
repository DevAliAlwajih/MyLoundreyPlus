import { useState } from 'react'
import { useTheme } from '../App'
import { CreditCard, Plus, Tag, Calendar, CheckCircle, XCircle, Percent, DollarSign, Trash2, Edit } from 'lucide-react'

const PLANS = [
  { id: 1, name: 'تجريبي', nameEn: 'Trial', duration: '14 يوم', durationEn: '14 days', price: 0, features: ['حتى 50 فاتورة', 'دعم أساسي'], active: true },
  { id: 2, name: 'شهري', nameEn: 'Monthly', duration: 'شهر', durationEn: '1 Month', price: 149, features: ['فواتير غير محدودة', 'دعم متقدم', 'تقارير يومية'], active: true },
  { id: 3, name: 'سنوي', nameEn: 'Yearly', duration: 'سنة', durationEn: '1 Year', price: 1299, features: ['فواتير غير محدودة', 'دعم مميز 24/7', 'تقارير متقدمة', 'خصم 27%'], active: true },
]

const PROMO_CODES = [
  { id: 1, code: 'LAUNCH25', type: 'percent', value: 25, uses: 12, maxUses: 50, expiry: '2025-06-30', active: true },
  { id: 2, code: 'RAMADAN50', type: 'fixed', value: 50, uses: 35, maxUses: 100, expiry: '2025-04-10', active: false },
  { id: 3, code: 'GULF2025', type: 'percent', value: 15, uses: 8, maxUses: null, expiry: '2025-12-31', active: true },
]

const SUBS = [
  { id: 1, laundry: 'مغسلة النور', plan: 'yearly', start: '2024-01-01', end: '2024-12-31', price: 1299, status: 'active' },
  { id: 2, laundry: 'مغسلة الربيع', plan: 'monthly', start: '2025-01-15', end: '2025-02-15', price: 149, status: 'expiring' },
  { id: 3, laundry: 'مغسلة البدر', plan: 'trial', start: '2025-01-18', end: '2025-02-01', price: 0, status: 'active' },
]

export default function SubscriptionsPage() {
  const { lang } = useTheme()
  const label = (ar, en) => lang === 'ar' ? ar : en
  const [tab, setTab] = useState('plans')

  return (
    <div className="animate-fade">
      <div className="page-header">
        <div>
          <h1 className="page-title">{label('الاشتراكات', 'Subscriptions')}</h1>
          <p className="page-subtitle">{label('إدارة خطط الاشتراك وأكواد الخصم', 'Manage subscription plans and promo codes')}</p>
        </div>
        <button className="btn btn-primary"><Plus size={16} /> {label('إضافة', 'Add New')}</button>
      </div>

      <div className="tabs">
        {[['plans', 'خطط الاشتراك', 'Subscription Plans'], ['promos', 'أكواد الخصم', 'Promo Codes'], ['active', 'الاشتراكات النشطة', 'Active Subscriptions']].map(([k, ar, en]) => (
          <button key={k} className={`tab-btn ${tab === k ? 'active' : ''}`} onClick={() => setTab(k)}>
            {label(ar, en)}
          </button>
        ))}
      </div>

      {tab === 'plans' && (
        <div className="grid grid-3">
          {PLANS.map(p => (
            <div key={p.id} className="card" style={{ borderTop: `3px solid var(--primary-500)` }}>
              <div className="card-body">
                <div className="flex items-start justify-between mb-16">
                  <div>
                    <h3 className="fs-xl fw-black">{label(p.name, p.nameEn)}</h3>
                    <p className="text-muted fs-sm">{label(p.duration, p.durationEn)}</p>
                  </div>
                  <span className={`badge badge-${p.active ? 'success' : 'neutral'}`}>{p.active ? label('نشط', 'Active') : label('موقوف', 'Inactive')}</span>
                </div>
                <div className="fs-3xl fw-black mb-4" style={{ color: 'var(--primary-500)' }}>
                  {p.price === 0 ? label('مجاني', 'Free') : `${p.price} ${label('ريال', 'SAR')}`}
                </div>
                <hr className="divider" />
                <div className="flex flex-col gap-8 mb-20">
                  {p.features.map((f, i) => (
                    <div key={i} className="flex items-center gap-8 fs-sm">
                      <CheckCircle size={14} color="var(--success)" />
                      <span>{f}</span>
                    </div>
                  ))}
                </div>
                <div className="flex gap-8">
                  <button className="btn btn-secondary btn-sm flex-1"><Edit size={14} /> {label('تعديل', 'Edit')}</button>
                  <button className="btn btn-ghost btn-sm" style={{ color: 'var(--danger)' }}><Trash2 size={14} /></button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === 'promos' && (
        <div className="card">
          <div className="table-wrapper" style={{ border: 'none' }}>
            <table>
              <thead>
                <tr>
                  <th>{label('الكود', 'Code')}</th>
                  <th>{label('النوع', 'Type')}</th>
                  <th>{label('القيمة', 'Value')}</th>
                  <th>{label('الاستخدام', 'Usage')}</th>
                  <th>{label('الانتهاء', 'Expiry')}</th>
                  <th>{label('الحالة', 'Status')}</th>
                  <th>{label('الإجراءات', 'Actions')}</th>
                </tr>
              </thead>
              <tbody>
                {PROMO_CODES.map(p => (
                  <tr key={p.id}>
                    <td><code style={{ background: 'var(--primary-50)', color: 'var(--primary-600)', padding: '3px 10px', borderRadius: 6, fontWeight: 700 }}>{p.code}</code></td>
                    <td>
                      <div className="flex items-center gap-6">
                        {p.type === 'percent' ? <Percent size={14} color="var(--primary-500)" /> : <DollarSign size={14} color="var(--gold)" />}
                        <span className="fs-sm">{p.type === 'percent' ? label('نسبة مئوية', 'Percentage') : label('مبلغ ثابت', 'Fixed Amount')}</span>
                      </div>
                    </td>
                    <td className="fw-bold text-primary">{p.value}{p.type === 'percent' ? '%' : ` ${label('ريال', 'SAR')}`}</td>
                    <td>
                      <div>
                        <span className="fw-bold">{p.uses}</span>
                        <span className="text-muted"> / {p.maxUses ?? '∞'}</span>
                      </div>
                      {p.maxUses && (
                        <div className="progress mt-4" style={{ height: 4 }}>
                          <div className="progress-bar" style={{ width: `${(p.uses / p.maxUses) * 100}%` }} />
                        </div>
                      )}
                    </td>
                    <td>
                      <div className="flex items-center gap-6 fs-sm">
                        <Calendar size={13} className="text-muted" />
                        <span className={new Date(p.expiry) < new Date() ? 'text-danger' : 'text-muted'}>{p.expiry}</span>
                      </div>
                    </td>
                    <td><span className={`badge badge-${p.active ? 'success' : 'neutral'}`}>{p.active ? label('نشط', 'Active') : label('منتهي', 'Expired')}</span></td>
                    <td>
                      <div className="flex gap-4">
                        <button className="btn btn-ghost btn-icon btn-sm"><Edit size={14} /></button>
                        <button className="btn btn-ghost btn-icon btn-sm" style={{ color: 'var(--danger)' }}><Trash2 size={14} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === 'active' && (
        <div className="card">
          <div className="table-wrapper" style={{ border: 'none' }}>
            <table>
              <thead>
                <tr>
                  <th>{label('المغسلة', 'Laundry')}</th>
                  <th>{label('الخطة', 'Plan')}</th>
                  <th>{label('البداية', 'Start')}</th>
                  <th>{label('الانتهاء', 'End')}</th>
                  <th>{label('السعر', 'Price')}</th>
                  <th>{label('الحالة', 'Status')}</th>
                </tr>
              </thead>
              <tbody>
                {SUBS.map(s => (
                  <tr key={s.id}>
                    <td className="fw-semi">{s.laundry}</td>
                    <td><span className={`badge badge-${s.plan === 'yearly' ? 'gold' : s.plan === 'monthly' ? 'primary' : 'info'}`}>{s.plan === 'yearly' ? label('سنوي', 'Yearly') : s.plan === 'monthly' ? label('شهري', 'Monthly') : label('تجريبي', 'Trial')}</span></td>
                    <td className="fs-sm text-muted">{s.start}</td>
                    <td><span className={s.status === 'expiring' ? 'text-danger fw-bold' : 'text-muted fs-sm'}>{s.end}</span></td>
                    <td className="fw-bold">{s.price === 0 ? label('مجاني', 'Free') : `${s.price} ${label('ريال', 'SAR')}`}</td>
                    <td><span className={`badge badge-${s.status === 'active' ? 'success' : 'warning'}`}>{s.status === 'active' ? label('نشط', 'Active') : label('ينتهي قريباً', 'Expiring Soon')}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
