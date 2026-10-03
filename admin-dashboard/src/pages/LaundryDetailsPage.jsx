import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import {
  ArrowLeft, Building2, Save, Loader2, MapPin, ShieldCheck,
  Phone, Mail, Calendar, CheckCircle, XCircle, Wallet,
  CreditCard, Banknote, Building, History, PlusCircle, ArrowUpRight,
  Receipt, User, AlertCircle
} from 'lucide-react'
import { useTheme } from '../App'
import api, { rechargesApi } from '../services/api'
import RechargeModal from '../components/RechargeModal'

const STATUS_MAP = {
  active: { labelAr: 'نشط', labelEn: 'Active' },
  trial: { labelAr: 'تجريبي', labelEn: 'Trial' },
  suspended: { labelAr: 'موقوف', labelEn: 'Suspended' },
  pending: { labelAr: 'بانتظار التفعيل', labelEn: 'Pending' },
  banned: { labelAr: 'محظور', labelEn: 'Banned' },
}

const BILLING_MAP = {
  subscription: { labelAr: 'اشتراك', labelEn: 'Subscription' },
  commission: { labelAr: 'عمولة', labelEn: 'Commission' },
}

const PAYMENT_METHOD_BADGES = {
  cash: { labelAr: 'نقدي (كاش)', labelEn: 'Cash', badge: 'success' },
  bank_transfer: { labelAr: 'تحويل بنكي', labelEn: 'Bank Transfer', badge: 'primary' },
  electronic: { labelAr: 'دفع إلكتروني', labelEn: 'Electronic', badge: 'info' },
  cheque: { labelAr: 'شيك', labelEn: 'Cheque', badge: 'gold' },
  other: { labelAr: 'أخرى', labelEn: 'Other', badge: 'neutral' },
}

export default function LaundryDetailsPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { lang } = useTheme()
  const label = (ar, en) => lang === 'ar' ? ar : en

  const [laundry, setLaundry] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({})

  // 💳 Financial & Recharges State
  const [showRechargeModal, setShowRechargeModal] = useState(false)
  const [rechargeHistory, setRechargeHistory] = useState([])
  const [rechargeStats, setRechargeStats] = useState({ totalRecharged: 0, total: 0 })
  const [loadingHistory, setLoadingHistory] = useState(false)

  useEffect(() => {
    fetchLaundry()
    fetchRechargeHistory()
  }, [id])

  const fetchRechargeHistory = async () => {
    setLoadingHistory(true)
    try {
      const res = await rechargesApi.getLaundryHistory(id)
      if (res.data?.success) {
        setRechargeHistory(res.data.data.records || [])
        setRechargeStats({
          totalRecharged: res.data.data.totalRecharged || 0,
          total: res.data.data.total || 0,
        })
      }
    } catch (err) {
      console.error('Failed to load recharge history', err)
    } finally {
      setLoadingHistory(false)
    }
  }

  const fetchLaundry = async () => {
    setLoading(true)
    try {
      const res = await api.get(`/admin/laundries/${id}`)
      const data = res.data.data
      setLaundry(data)
      setForm({
        name: data.name || '',
        nameAr: data.nameAr || '',
        phoneNumber: data.phoneNumber || '',
        address: data.address || '',
        city: data.city || '',
        country: data.country || 'SA',
        status: data.status || 'pending',
        billing_type: data.billing_type || 'subscription',
        commission_rate: data.commission_rate ?? '',
        debt_limit: data.debt_limit ?? '',
        balance: data.balance ?? '',
        tax_enabled: !!data.tax_enabled,
        tax_rate: data.tax_rate ?? '',
        urgency_enabled: !!data.urgency_enabled,
        urgency_fee: data.urgency_fee ?? '',
        logoUrl: data.logoUrl || '',
        ownerEmail: data.owner?.email || '',
        newPassword: '',
        confirmPassword: '',
      })
    } catch (err) {
      console.error('Failed to fetch laundry details', err)
      alert(label('فشل تحميل بيانات المغسلة', 'Failed to load laundry details'))
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    setForm(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)

    try {
      if (form.newPassword || form.confirmPassword) {
        if (form.newPassword !== form.confirmPassword) {
          alert(label('كلمة المرور وتأكيدها غير متطابقتين', 'Password and confirmation do not match'))
          setSaving(false)
          return
        }
      }

      // ── 1) بيانات المغسلة الأساسية (UpdateLaundryDto)
      const detailsPayload = {
        name: form.name,
        nameAr: form.nameAr,
        phoneNumber: form.phoneNumber,
        address: form.address,
        city: form.city,
        country: form.country,
        logoUrl: form.logoUrl,
        tax_enabled: form.tax_enabled,
        tax_rate: form.tax_rate === '' ? undefined : Number(form.tax_rate),
        urgency_enabled: form.urgency_enabled,
        urgency_fee: form.urgency_fee === '' ? undefined : Number(form.urgency_fee),
      }
      await api.patch(`/admin/laundries/${id}`, detailsPayload)

      // ── 2) الحالة (UpdateLaundryStatusDto) — فقط إذا تغيرت
      if (form.status !== laundry.status) {
        await api.patch(`/admin/laundries/${id}/status`, {
          status: form.status,
        })
      }

      // ── 3) الفوترة (UpdateLaundryBillingDto)
      const billingPayload = {
        billing_type: form.billing_type,
        commission_rate: form.commission_rate === '' ? undefined : Number(form.commission_rate),
        debt_limit: form.debt_limit === '' ? undefined : Number(form.debt_limit),
        balance: form.balance === '' ? undefined : Number(form.balance),
      }
      await api.patch(`/admin/laundries/${id}/billing`, billingPayload)

      // ── 4) حساب المالك — فقط إذا تغير الإيميل أو كلمة المرور
      if (form.ownerEmail && (form.ownerEmail !== laundry.owner?.email || form.newPassword)) {
        await api.patch(`/admin/laundries/${id}/owner-account`, {
          email: form.ownerEmail,
          password: form.newPassword || undefined,
        })
      }

      alert(label('تم حفظ بيانات المغسلة بنجاح', 'Laundry details saved successfully'))
      fetchLaundry()
    } catch (err) {
      console.error('Failed to save laundry details', err)
      alert(err.response?.data?.message || err.response?.data?.error?.message || label('فشل حفظ البيانات', 'Failed to save changes'))
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="card" style={{ minHeight: 300 }}>
        <div className="card-body flex items-center justify-center gap-8" style={{ minHeight: 260 }}>
          <Loader2 className="animate-spin" size={20} />
          <span>{label('جاري تحميل البيانات...', 'Loading details...')}</span>
        </div>
      </div>
    )
  }

  if (!laundry) {
    return (
      <div className="card">
        <div className="card-body text-center py-30">
          <p className="fw-bold">{label('لم يتم العثور على المغسلة', 'Laundry not found')}</p>
          <Link to="/dashboard/laundries" className="btn btn-primary mt-12">
            {label('العودة إلى القائمة', 'Back to list')}
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="animate-fade">
      <div className="page-header">
        <div className="flex items-center gap-12">
          <button className="btn btn-ghost btn-icon" onClick={() => navigate('/dashboard/laundries')}>
            <ArrowLeft size={18} />
          </button>
          <div>
            <h1 className="page-title">{laundry.name}</h1>
            <p className="page-subtitle">{label('تفاصيل المغسلة وتعديلها', 'Laundry details and edit options')}</p>
          </div>
        </div>
        <div className="flex items-center gap-10">
          <button
            type="button"
            className="btn btn-primary flex items-center gap-8"
            onClick={() => setShowRechargeModal(true)}
            style={{
              background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
              border: 'none',
              boxShadow: '0 4px 14px rgba(16, 185, 129, 0.35)',
            }}
          >
            <Wallet size={16} />
            <span>{label('تسجيل دفعة / شحن رصيد', 'Record Payment / Recharge')}</span>
          </button>
        </div>
      </div>

      {/* 💳 Financial & Balance Overview Card */}
      <div className="grid grid-3 gap-16 mb-20">
        <div className="card stat-card" style={{ border: Number(laundry.balance ?? 0) < 0 ? '1px solid rgba(239, 68, 68, 0.3)' : '1px solid var(--border)' }}>
          <div className="card-body">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted fs-xs fw-bold text-uppercase">{label('الرصيد الحالي للمحفظة', 'Current Wallet Balance')}</p>
                <h3 className={`fs-2xl fw-black mt-4 ${Number(laundry.balance ?? 0) < 0 ? 'text-danger' : 'text-success'}`}>
                  {Number(laundry.balance ?? 0) > 0 ? `+${Number(laundry.balance ?? 0).toLocaleString()}` : Number(laundry.balance ?? 0).toLocaleString()} {label('ر.س', 'SAR')}
                </h3>
              </div>
              <div
                className="stat-icon"
                style={{
                  background: Number(laundry.balance ?? 0) < 0 ? 'var(--danger-bg)' : 'var(--success-bg)',
                  color: Number(laundry.balance ?? 0) < 0 ? 'var(--danger)' : 'var(--success)',
                  padding: 12,
                  borderRadius: 14,
                }}
              >
                <Wallet size={24} />
              </div>
            </div>
            <div className="mt-8 flex items-center justify-between">
              <span className={`badge ${Number(laundry.balance ?? 0) < 0 ? 'badge-danger' : 'badge-success'}`}>
                {Number(laundry.balance ?? 0) < 0 ? label('مديونية مستحقة', 'Outstanding Debt') : label('رصيد متاح', 'Available Balance')}
              </span>
              <button
                type="button"
                onClick={() => setShowRechargeModal(true)}
                className="btn btn-ghost btn-sm text-primary fw-bold"
                style={{ fontSize: '0.75rem', padding: '2px 6px' }}
              >
                + {label('شحن الآن', 'Recharge now')}
              </button>
            </div>
          </div>
        </div>

        <div className="card stat-card">
          <div className="card-body">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted fs-xs fw-bold text-uppercase">{label('حد الدين الائتماني', 'Credit Debt Limit')}</p>
                <h3 className="fs-2xl fw-black mt-4">
                  {Number(laundry.debt_limit ?? 500).toLocaleString()} {label('ر.س', 'SAR')}
                </h3>
              </div>
              <div className="stat-icon" style={{ background: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6', padding: 12, borderRadius: 14 }}>
                <ShieldCheck size={24} />
              </div>
            </div>
            <p className="fs-xs text-muted mt-8">
              {label('الحد الأقصى المسموح به للمديونية قبل الحظر', 'Max allowed negative debt before lock')}
            </p>
          </div>
        </div>

        <div className="card stat-card">
          <div className="card-body">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted fs-xs fw-bold text-uppercase">{label('إجمالي التسديدات السابقة', 'Total Recharged')}</p>
                <h3 className="fs-2xl fw-black mt-4" style={{ color: '#10b981' }}>
                  {Number(rechargeStats.totalRecharged ?? 0).toLocaleString()} {label('ر.س', 'SAR')}
                </h3>
              </div>
              <div className="stat-icon" style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', padding: 12, borderRadius: 14 }}>
                <Banknote size={24} />
              </div>
            </div>
            <p className="fs-xs text-muted mt-8">
              {rechargeStats.total ?? rechargeHistory.length} {label('عملية تسديد موثقة', 'Recorded payments')}
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid grid-2 gap-20 mb-20">
          <div className="card">
            <div className="card-header">
              <h3 className="fw-bold">{label('بيانات المغسلة', 'Laundry Information')}</h3>
            </div>
            <div className="card-body">
              <div className="grid grid-2 gap-12">
                <div className="form-group">
                  <label className="form-label">{label('اسم المغسلة', 'Laundry Name')}</label>
                  <input className="form-control" name="name" value={form.name || ''} onChange={handleChange} />
                </div>
                <div className="form-group">
                  <label className="form-label">{label('اسم المغسلة بالعربي', 'Arabic Name')}</label>
                  <input className="form-control" name="nameAr" value={form.nameAr || ''} onChange={handleChange} />
                </div>
                <div className="form-group">
                  <label className="form-label">{label('رقم الهاتف', 'Phone Number')}</label>
                  <input className="form-control ltr" dir="ltr" name="phoneNumber" value={form.phoneNumber || ''} onChange={handleChange} />
                </div>
                <div className="form-group">
                  <label className="form-label">{label('الدولة', 'Country')}</label>
                  <input className="form-control" name="country" value={form.country || ''} onChange={handleChange} />
                </div>
                <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                  <label className="form-label">{label('العنوان', 'Address')}</label>
                  <textarea className="form-control" rows="3" name="address" value={form.address || ''} onChange={handleChange} />
                </div>
                <div className="form-group">
                  <label className="form-label">{label('المدينة', 'City')}</label>
                  <input className="form-control" name="city" value={form.city || ''} onChange={handleChange} />
                </div>
                <div className="form-group">
                  <label className="form-label">{label('رابط الشعار', 'Logo URL')}</label>
                  <input className="form-control" name="logoUrl" value={form.logoUrl || ''} onChange={handleChange} />
                </div>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-header">
              <h3 className="fw-bold">{label('معلومات المالك والملف', 'Owner & Account')}</h3>
            </div>
            <div className="card-body">
              <div className="flex flex-col gap-12">
                <div className="d-flex align-items-center gap-10">
                  <div className="avatar-placeholder" style={{ width: 46, height: 46, borderRadius: 14 }}>{(laundry.owner?.fullName || 'م')[0]}</div>
                  <div>
                    <div className="fw-semi">{laundry.owner?.fullName || label('غير محدد', 'Not set')}</div>
                    <div className="fs-xs text-muted">{label('مالك المغسلة', 'Laundry owner')}</div>
                  </div>
                </div>

                <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                  <label className="form-label">{label('البريد الإلكتروني للمالك', 'Owner Email')}</label>
                  <input
                    className="form-control"
                    type="email"
                    name="ownerEmail"
                    value={form.ownerEmail || ''}
                    onChange={handleChange}
                  />
                </div>
                <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                  <label className="form-label">{label('كلمة المرور الجديدة', 'New Password')}</label>
                  <input
                    className="form-control"
                    type="password"
                    name="newPassword"
                    value={form.newPassword || ''}
                    onChange={handleChange}
                    placeholder={label('اتركها فارغة إذا لم ترغب بالتغيير', 'Leave empty to keep current password')}
                  />
                </div>
                <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                  <label className="form-label">{label('تأكيد كلمة المرور', 'Confirm Password')}</label>
                  <input
                    className="form-control"
                    type="password"
                    name="confirmPassword"
                    value={form.confirmPassword || ''}
                    onChange={handleChange}
                    placeholder={label('أعد إدخال كلمة المرور', 'Re-enter password')}
                  />
                </div>
                <div className="info-row">
                  <Mail size={15} />
                  <span>{laundry.owner?.email || '—'}</span>
                </div>
                <div className="info-row">
                  <Phone size={15} />
                  <span>{laundry.owner?.phoneNumber || '—'}</span>
                </div>
                <div className="info-row">
                  <Calendar size={15} />
                  <span>{new Date(laundry.createdAt).toLocaleDateString()}</span>
                </div>
                <div className="info-row">
                  <MapPin size={15} />
                  <span>{laundry.city || label('غير محدد', 'Not set')}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-2 gap-20 mb-20">
          <div className="card">
            <div className="card-header">
              <h3 className="fw-bold">{label('الحالة والفوترة', 'Status & Billing')}</h3>
            </div>
            <div className="card-body">
              <div className="grid grid-2 gap-12">
                <div className="form-group">
                  <label className="form-label">{label('الحالة', 'Status')}</label>
                  <select className="form-control" name="status" value={form.status || 'pending'} onChange={handleChange}>
                    {Object.entries(STATUS_MAP).map(([key, value]) => (
                      <option key={key} value={key}>{label(value.labelAr, value.labelEn)}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">{label('نوع الفوترة', 'Billing Type')}</label>
                  <select className="form-control" name="billing_type" value={form.billing_type || 'subscription'} onChange={handleChange}>
                    {Object.entries(BILLING_MAP).map(([key, value]) => (
                      <option key={key} value={key}>{label(value.labelAr, value.labelEn)}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">{label('نسبة العمولة %', 'Commission Rate %')}</label>
                  <input className="form-control" type="number" min="0" step="0.01" name="commission_rate" value={form.commission_rate ?? ''} onChange={handleChange} />
                </div>
                <div className="form-group">
                  <label className="form-label">{label('حد الدين', 'Debt Limit')}</label>
                  <input className="form-control" type="number" min="0" step="0.01" name="debt_limit" value={form.debt_limit ?? ''} onChange={handleChange} />
                </div>
                <div className="form-group">
                  <label className="form-label">{label('الرصيد الحالي', 'Current Balance')}</label>
                  <input className="form-control" type="number" min="0" step="0.01" name="balance" value={form.balance ?? ''} onChange={handleChange} />
                </div>
                <div className="form-group">
                  <label className="form-label">{label('تاريخ نهاية التجربة', 'Trial Ends At')}</label>
                  <input className="form-control" type="date" value={laundry.trial_commission_ends_at ? new Date(laundry.trial_commission_ends_at).toISOString().split('T')[0] : ''} readOnly />
                </div>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-header">
              <h3 className="fw-bold">{label('الإعدادات المتقدمة', 'Advanced Settings')}</h3>
            </div>
            <div className="card-body">
              <div className="grid grid-2 gap-12">
                <label className="toggle-row" style={{ gridColumn: '1 / -1' }}>
                  <input type="checkbox" name="tax_enabled" checked={!!form.tax_enabled} onChange={handleChange} />
                  <span>{label('تمكين الضريبة', 'Enable Tax')}</span>
                </label>
                <div className="form-group">
                  <label className="form-label">{label('نسبة الضريبة %', 'Tax Rate %')}</label>
                  <input className="form-control" type="number" min="0" step="0.01" name="tax_rate" value={form.tax_rate ?? ''} onChange={handleChange} disabled={!form.tax_enabled} />
                </div>

                <label className="toggle-row" style={{ gridColumn: '1 / -1' }}>
                  <input type="checkbox" name="urgency_enabled" checked={!!form.urgency_enabled} onChange={handleChange} />
                  <span>{label('تمكين الاستعجال', 'Enable Urgency')}</span>
                </label>
                <div className="form-group">
                  <label className="form-label">{label('رسوم الاستعجال', 'Urgency Fee')}</label>
                  <input className="form-control" type="number" min="0" step="0.01" name="urgency_fee" value={form.urgency_fee ?? ''} onChange={handleChange} disabled={!form.urgency_enabled} />
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-body flex items-center justify-between gap-12">
            <div className="flex items-center gap-8">
              <ShieldCheck size={16} className="text-success" />
              <span className="fs-sm text-muted">{label('إجمالي الإيرادات', 'Total Revenue')}: {Number(laundry.stats?.totalRevenue || 0).toLocaleString()} </span>
            </div>
            <div className="flex gap-8">
              <button type="button" className="btn btn-secondary" onClick={() => navigate('/dashboard/laundries')}>
                {label('إلغاء', 'Cancel')}
              </button>
              <button type="submit" className="btn btn-primary" disabled={saving}>
                {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                {label('حفظ التعديلات', 'Save Changes')}
              </button>
            </div>
          </div>
        </div>
      </form>

      {/* 📜 سجل التسديدات وشحن الرصيد */}
      <div className="card mt-24">
        <div className="card-header flex items-center justify-between p-16">
          <div className="flex items-center gap-10">
            <div
              style={{
                width: 38,
                height: 38,
                borderRadius: 10,
                background: 'rgba(16, 185, 129, 0.12)',
                color: '#10b981',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <History size={20} />
            </div>
            <div>
              <h3 className="fs-lg fw-bold mb-2">
                {label('سجل التسديدات وشحن الرصيد', 'Recharge & Payment History')}
              </h3>
              <p className="fs-xs text-muted mb-0">
                {label(
                  'سجل العمليات والدفعات المالية المودعة في محفظة هذه المغسلة مع أرقام السندات والبيانات',
                  'Log of payments and wallet top-ups with receipt & reference numbers'
                )}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-8">
            <button
              type="button"
              className="btn btn-secondary btn-sm flex items-center gap-6"
              onClick={fetchRechargeHistory}
              disabled={loadingHistory}
            >
              <History size={14} className={loadingHistory ? 'animate-spin' : ''} />
              <span>{label('تحديث السجل', 'Refresh')}</span>
            </button>
            <button
              type="button"
              className="btn btn-primary btn-sm flex items-center gap-6"
              onClick={() => setShowRechargeModal(true)}
              style={{
                background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
                border: 'none',
              }}
            >
              <PlusCircle size={14} />
              <span>{label('إضافة دفعة جديدة', 'New Payment')}</span>
            </button>
          </div>
        </div>

        <div className="table-wrapper" style={{ border: 'none' }}>
          <table>
            <thead>
              <tr>
                <th>{label('المبلغ المسدد', 'Amount')}</th>
                <th>{label('طريقة التحصيل', 'Payment Method')}</th>
                <th>{label('رقم السند / المرجع', 'Receipt / Ref #')}</th>
                <th>{label('الرصيد قبل / بعد', 'Balance Change')}</th>
                <th>{label('المسؤول المنفّذ', 'Processed By')}</th>
                <th>{label('التاريخ والوقت', 'Date & Time')}</th>
                <th>{label('البيان / الملاحظات', 'Notes')}</th>
              </tr>
            </thead>
            <tbody>
              {loadingHistory ? (
                <tr>
                  <td colSpan={7} className="text-center p-30 text-muted">
                    <Loader2 size={20} className="animate-spin inline mr-8" />
                    <span>{label('جاري تحميل سجل التسديدات...', 'Loading recharge history...')}</span>
                  </td>
                </tr>
              ) : rechargeHistory.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center p-40 text-muted">
                    <div className="flex flex-col items-center justify-center gap-10">
                      <div
                        style={{
                          width: 50,
                          height: 50,
                          borderRadius: '50%',
                          background: 'var(--bg-page)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: 'var(--text-muted)',
                        }}
                      >
                        <Wallet size={24} />
                      </div>
                      <span className="fw-semi">{label('لا يوجد أي سجل تسديدات سابقة لهذه المغسلة بعد', 'No payment history found for this laundry')}</span>
                      <button
                        type="button"
                        className="btn btn-primary btn-sm mt-4"
                        onClick={() => setShowRechargeModal(true)}
                        style={{ background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)', border: 'none' }}
                      >
                        + {label('تسجيل أول دفعة الآن', 'Record First Payment Now')}
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                rechargeHistory.map((item) => {
                  const methodKey = item.paymentMethod || item.payment_method || 'other'
                  const methodInfo = PAYMENT_METHOD_BADGES[methodKey] || {
                    labelAr: methodKey,
                    labelEn: methodKey,
                    badge: 'neutral',
                  }
                  return (
                    <tr key={item.id}>
                      <td>
                        <span className="fw-black fs-md text-success">
                          +{Number(item.amount).toLocaleString()} <small className="fs-xs font-normal">ر.س</small>
                        </span>
                      </td>
                      <td>
                        <span className={`badge badge-${methodInfo.badge} fs-xs`}>
                          {label(methodInfo.labelAr, methodInfo.labelEn)}
                        </span>
                      </td>
                      <td>
                        {item.referenceNumber || item.reference_number ? (
                          <span className="badge badge-neutral fs-xs fw-bold font-mono">
                            {item.referenceNumber || item.reference_number}
                          </span>
                        ) : (
                          <span className="text-muted fs-xs">—</span>
                        )}
                      </td>
                      <td>
                        <div className="flex items-center gap-6 fs-xs">
                          <span className="text-muted">
                            {Number(item.balanceBefore ?? item.balance_before ?? 0).toLocaleString()}
                          </span>
                          <span>→</span>
                          <span className="fw-bold text-success">
                            {Number(item.balanceAfter ?? item.balance_after ?? 0).toLocaleString()} ر.س
                          </span>
                        </div>
                      </td>
                      <td>
                        <div className="flex items-center gap-6 fs-xs fw-semi">
                          <User size={12} className="text-muted" />
                          <span>{item.adminName || item.admin_name || label('مدير النظام', 'Admin')}</span>
                        </div>
                      </td>
                      <td className="fs-xs text-muted">
                        {item.createdAt || item.created_at
                          ? new Date(item.createdAt || item.created_at).toLocaleString(lang === 'ar' ? 'ar-SA' : 'en-US')
                          : '—'}
                      </td>
                      <td className="fs-xs text-muted" style={{ maxWidth: 220, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {item.notes || '—'}
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 💳 Recharge Modal */}
      {laundry && (
        <RechargeModal
          isOpen={showRechargeModal}
          onClose={() => setShowRechargeModal(false)}
          laundry={laundry}
          onSuccess={() => {
            fetchLaundry()
            fetchRechargeHistory()
          }}
        />
      )}
    </div>
  )
}
