import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Building2, Save, Loader2, MapPin, ShieldCheck, Phone, Mail, Calendar, CheckCircle, XCircle } from 'lucide-react'
import { useTheme } from '../App'
import api from '../services/api'

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

export default function LaundryDetailsPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { lang } = useTheme()
  const label = (ar, en) => lang === 'ar' ? ar : en

  const [laundry, setLaundry] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({})

  useEffect(() => {
    fetchLaundry()
  }, [id])

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
    </div>
  )
}
