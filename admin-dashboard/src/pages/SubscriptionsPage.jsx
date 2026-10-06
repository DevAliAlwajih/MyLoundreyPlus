import { useState, useEffect, useRef } from 'react'
import { useTheme } from '../App'
import { packagesApi, promoCodesApi, commissionsApi, rechargesApi } from '../services/api'
import {
  CreditCard, Plus, Tag, Calendar, CheckCircle, XCircle, Percent,
  DollarSign, Trash2, Edit, Coins, Sparkles, Clock, AlertCircle,
  Save, RefreshCw, Check, ShieldAlert, Layers, TrendingUp, Info,
  Wallet, Search, Banknote, User, ChevronDown
} from 'lucide-react'

// ─── Currency Data ────────────────────────────────────────────────────────────
const CURRENCIES = [
  { code: 'SAR', flag: '🇸🇦', nameAr: 'ريال سعودي',    nameEn: 'Saudi Riyal',    symbolAr: 'ر.س', symbolEn: 'SAR' },
  { code: 'AED', flag: '🇦🇪', nameAr: 'درهم إماراتي',  nameEn: 'UAE Dirham',     symbolAr: 'د.إ', symbolEn: 'AED' },
  { code: 'QAR', flag: '🇶🇦', nameAr: 'ريال قطري',     nameEn: 'Qatari Riyal',   symbolAr: 'ر.ق', symbolEn: 'QAR' },
  { code: 'KWD', flag: '🇰🇼', nameAr: 'دينار كويتي',   nameEn: 'Kuwaiti Dinar',  symbolAr: 'د.ك', symbolEn: 'KWD' },
  { code: 'OMR', flag: '🇴🇲', nameAr: 'ريال عُماني',   nameEn: 'Omani Rial',     symbolAr: 'ر.ع', symbolEn: 'OMR' },
  { code: 'BHD', flag: '🇧🇭', nameAr: 'دينار بحريني',  nameEn: 'Bahraini Dinar', symbolAr: 'د.ب', symbolEn: 'BHD' },
  { code: 'YER', flag: '🇾🇪', nameAr: 'ريال يمني',     nameEn: 'Yemeni Rial',    symbolAr: 'ر.ي', symbolEn: 'YER' },
]

// ─── CurrencySelector Component ───────────────────────────────────────────────
function CurrencySelector({ currency, setCurrency, lang }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)
  const label = (ar, en) => (lang === 'ar' ? ar : en)

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const selected = CURRENCIES.find((c) => c.code === currency) || CURRENCIES[0]

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        style={{
          display: 'flex', alignItems: 'center', gap: 8,
          padding: '8px 14px', borderRadius: 10,
          border: '1.5px solid var(--border-color, #e5e7eb)',
          background: 'var(--card-bg, #fff)', cursor: 'pointer',
          fontWeight: 700, fontSize: 13, color: 'var(--text-primary)',
          transition: 'all 0.18s',
          boxShadow: open ? '0 0 0 3px rgba(99,102,241,0.15)' : 'none',
          outline: 'none', whiteSpace: 'nowrap',
        }}
      >
        <span style={{ fontSize: 18, lineHeight: 1 }}>{selected.flag}</span>
        <span>{label(selected.symbolAr, selected.symbolEn)}</span>
        <span style={{ color: 'var(--text-muted)', fontWeight: 400, fontSize: 11 }}>{selected.code}</span>
        <ChevronDown
          size={14}
          style={{
            marginInlineStart: 2, transition: 'transform 0.2s',
            transform: open ? 'rotate(180deg)' : 'rotate(0deg)',
            color: 'var(--text-muted)',
          }}
        />
      </button>

      {open && (
        <div
          style={{
            position: 'absolute', top: 'calc(100% + 6px)', insetInlineEnd: 0,
            minWidth: 230, background: 'var(--card-bg, #fff)',
            border: '1.5px solid var(--border-color, #e5e7eb)',
            borderRadius: 12, boxShadow: '0 8px 32px rgba(0,0,0,0.14)',
            zIndex: 999, overflow: 'hidden',
          }}
        >
          <div style={{ padding: '8px 12px 6px', borderBottom: '1px solid var(--border-color, #e5e7eb)' }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.5 }}>
              {label('اختر العملة', 'Select Currency')}
            </span>
          </div>
          {CURRENCIES.map((c) => (
            <button
              key={c.code}
              type="button"
              onClick={() => { setCurrency(c.code); setOpen(false) }}
              style={{
                display: 'flex', alignItems: 'center', gap: 10,
                width: '100%', padding: '10px 14px', border: 'none',
                background: c.code === currency ? 'rgba(99,102,241,0.08)' : 'transparent',
                cursor: 'pointer', textAlign: 'start', transition: 'background 0.12s',
                borderInlineStart: c.code === currency ? '3px solid #6366f1' : '3px solid transparent',
              }}
              onMouseEnter={(e) => { if (c.code !== currency) e.currentTarget.style.background = 'var(--bg-subtle, rgba(0,0,0,0.04))' }}
              onMouseLeave={(e) => { if (c.code !== currency) e.currentTarget.style.background = 'transparent' }}
            >
              <span style={{ fontSize: 20 }}>{c.flag}</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>{label(c.nameAr, c.nameEn)}</div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{c.symbolAr} · {c.symbolEn} · {c.code}</div>
              </div>
              {c.code === currency && <Check size={14} color="#6366f1" />}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

export default function SubscriptionsPage() {
  const { lang } = useTheme()
  const label = (ar, en) => (lang === 'ar' ? ar : en)

  // Currency state – persisted in localStorage
  const [currency, setCurrencyState] = useState(
    () => localStorage.getItem('admin_currency') || 'SAR'
  )
  const setCurrency = (code) => {
    setCurrencyState(code)
    localStorage.setItem('admin_currency', code)
  }
  const currencyInfo = CURRENCIES.find((c) => c.code === currency) || CURRENCIES[0]
  const currSymbol = label(currencyInfo.symbolAr, currencyInfo.symbolEn)
  const currCode   = currencyInfo.code

  const [tab, setTab] = useState('plans') // 'plans' | 'promos' | 'settings' | 'transactions' | 'recharges'
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [successMsg, setSuccessMsg] = useState('')
  const [errorMsg, setErrorMsg] = useState('')

  // Data States
  const [plans, setPlans] = useState([])
  const [promoCodes, setPromoCodes] = useState([])
  const [transactions, setTransactions] = useState([])
  const [txStats, setTxStats] = useState({ totalCommission: 0, totalInvoices: 0 })
  const [recharges, setRecharges] = useState([])
  const [loadingRecharges, setLoadingRecharges] = useState(false)
  const [rechargeSearch, setRechargeSearch] = useState('')
  const [rechargeStats, setRechargeStats] = useState({ totalRecharged: 0, total: 0 })
  const [commissionSettings, setCommissionSettings] = useState({
    defaultCommissionRate: 1,
    defaultTrialDays: 30,
    defaultInitialBalance: 2000,
    defaultDebtLimit: 500,
    minRechargeAmount: 100,
  })

  // Filter for plans: 'all' | 'trial' | 'recharge'
  const [planFilter, setPlanFilter] = useState('all')

  // Modals state
  const [planModalOpen, setPlanModalOpen] = useState(false)
  const [editingPlan, setEditingPlan] = useState(null)
  const [planForm, setPlanForm] = useState({
    planType: 'trial', // 'trial' | 'recharge'
    nameAr: '',
    nameEn: '',
    durationDays: 30,
    priceSar: 0,
    features: [''],
    isActive: true,
    isSeasonal: false,
    occasionName: '',
    discountPercent: 0,
    offerValidFrom: '',
    offerValidUntil: '',
  })

  const [promoModalOpen, setPromoModalOpen] = useState(false)
  const [editingPromo, setEditingPromo] = useState(null)
  const [promoForm, setPromoForm] = useState({
    code: '',
    description: '',
    discountType: 'percent', // 'percent' | 'fixed'
    discountValue: 15,
    maxUses: '',
    validFrom: '',
    validUntil: '',
    isActive: true,
  })

  // Fetch initial data
  useEffect(() => {
    loadAllData()
  }, [])

  const showNotification = (msg, isError = false) => {
    if (isError) {
      setErrorMsg(msg)
      setTimeout(() => setErrorMsg(''), 4000)
    } else {
      setSuccessMsg(msg)
      setTimeout(() => setSuccessMsg(''), 3000)
    }
  }

  const loadRecharges = async (searchVal = rechargeSearch) => {
    setLoadingRecharges(true)
    try {
      const res = await rechargesApi.getAll({ search: searchVal || undefined, limit: 100 })
      if (res.data?.success) {
        setRecharges(res.data.data.records || [])
        setRechargeStats({
          totalRecharged: res.data.data.totalRecharged || 0,
          total: res.data.data.total || 0,
        })
      }
    } catch (err) {
      console.error('Failed to load recharges log', err)
    } finally {
      setLoadingRecharges(false)
    }
  }

  const loadAllData = async () => {
    setLoading(true)
    try {
      const [plansRes, promosRes, settingsRes, txRes] = await Promise.allSettled([
        packagesApi.getAll(),
        promoCodesApi.getAll(),
        commissionsApi.getSettings(),
        commissionsApi.getTransactions({ limit: 50 }),
      ])

      if (plansRes.status === 'fulfilled' && plansRes.value.data.success) {
        setPlans(plansRes.value.data.data)
      }
      if (promosRes.status === 'fulfilled' && promosRes.value.data.success) {
        setPromoCodes(promosRes.value.data.data)
      }
      if (settingsRes.status === 'fulfilled' && settingsRes.value.data.success) {
        setCommissionSettings(settingsRes.value.data.data)
      }
      if (txRes.status === 'fulfilled' && txRes.value.data.success) {
        setTransactions(txRes.value.data.data.transactions || [])
        setTxStats({
          totalCommission: txRes.value.data.data.totalCommissionSum || 0,
          totalInvoices: txRes.value.data.data.totalInvoicesSum || 0,
        })
      }

      await loadRecharges()
    } catch (err) {
      console.error('Error fetching data', err)
      showNotification(label('فشل تحميل بعض البيانات', 'Failed to load data'), true)
    } finally {
      setLoading(false)
    }
  }

  // --- Plan CRUD Handlers ---
  const handleOpenCreatePlan = () => {
    setEditingPlan(null)
    setPlanForm({
      planType: 'trial',
      nameAr: 'باقة تجريبية 30 يوم',
      nameEn: 'Trial Package 30 Days',
      durationDays: 30,
      priceSar: 0,
      features: ['بدون عمولة خلال الفترة التجريبية', 'تجربة كامل الميزات', 'دعم فني متاح'],
      isActive: true,
      isSeasonal: false,
      occasionName: '',
      discountPercent: 0,
      offerValidFrom: '',
      offerValidUntil: '',
    })
    setPlanModalOpen(true)
  }

  const handleOpenEditPlan = (p) => {
    setEditingPlan(p)
    const isTrial = Number(p.priceSar) === 0 || p.durationDays > 0 && Number(p.priceSar) === 0
    setPlanForm({
      planType: isTrial ? 'trial' : 'recharge',
      nameAr: p.nameAr,
      nameEn: p.nameEn,
      durationDays: p.durationDays,
      priceSar: p.priceSar,
      features: Array.isArray(p.features) && p.features.length > 0 ? p.features : [''],
      isActive: p.isActive,
      isSeasonal: p.isSeasonal || false,
      occasionName: p.occasionName || '',
      discountPercent: p.discountPercent || 0,
      offerValidFrom: p.offerValidFrom || '',
      offerValidUntil: p.offerValidUntil || '',
    })
    setPlanModalOpen(true)
  }

  const handleSavePlan = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      const payload = {
        nameAr: planForm.nameAr,
        nameEn: planForm.nameEn,
        durationDays: Number(planForm.durationDays) || 0,
        priceSar: planForm.planType === 'trial' ? 0 : Number(planForm.priceSar) || 0,
        features: planForm.features.filter((f) => f && f.trim() !== ''),
        isActive: planForm.isActive,
        isSeasonal: planForm.isSeasonal,
        occasionName: planForm.isSeasonal ? planForm.occasionName : null,
        discountPercent: planForm.isSeasonal ? Number(planForm.discountPercent) || 0 : 0,
        offerValidFrom: planForm.isSeasonal && planForm.offerValidFrom ? planForm.offerValidFrom : null,
        offerValidUntil: planForm.isSeasonal && planForm.offerValidUntil ? planForm.offerValidUntil : null,
      }

      if (editingPlan) {
        await packagesApi.update(editingPlan.id, payload)
        showNotification(label('تم تحديث الباقة بنجاح', 'Package updated successfully'))
      } else {
        await packagesApi.create(payload)
        showNotification(label('تم إنشاء الباقة بنجاح', 'Package created successfully'))
      }

      setPlanModalOpen(false)
      loadAllData()
    } catch (err) {
      console.error(err)
      showNotification(label('حدث خطأ أثناء حفظ الباقة', 'Error saving package'), true)
    } finally {
      setSaving(false)
    }
  }

  const handleDeletePlan = async (id) => {
    if (!window.confirm(label('هل أنت متأكد من حذف/تعطيل هذه الباقة؟', 'Are you sure you want to delete/deactivate this package?'))) {
      return
    }
    try {
      await packagesApi.delete(id)
      showNotification(label('تم تحديث حالة الباقة', 'Package status updated'))
      loadAllData()
    } catch (err) {
      console.error(err)
      showNotification(label('فشل حذف الباقة', 'Failed to delete package'), true)
    }
  }

  const handleTogglePlanActive = async (p) => {
    try {
      await packagesApi.update(p.id, { isActive: !p.isActive })
      showNotification(label('تم تغيير حالة الباقة', 'Package status toggled'))
      loadAllData()
    } catch (err) {
      console.error(err)
      showNotification(label('فشل تغيير الحالة', 'Failed to change status'), true)
    }
  }

  // --- Promo Code CRUD Handlers ---
  const handleOpenCreatePromo = () => {
    setEditingPromo(null)
    setPromoForm({
      code: '',
      description: '',
      discountType: 'percent',
      discountValue: 15,
      maxUses: '',
      validFrom: new Date().toISOString().split('T')[0],
      validUntil: '',
      isActive: true,
    })
    setPromoModalOpen(true)
  }

  const handleOpenEditPromo = (pr) => {
    setEditingPromo(pr)
    setPromoForm({
      code: pr.code,
      description: pr.description || '',
      discountType: pr.discountType || 'percent',
      discountValue: pr.discountValue || 0,
      maxUses: pr.maxUses !== null ? pr.maxUses : '',
      validFrom: pr.validFrom || '',
      validUntil: pr.validUntil || '',
      isActive: pr.isActive,
    })
    setPromoModalOpen(true)
  }

  const handleSavePromo = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      const payload = {
        code: promoForm.code.trim().toUpperCase(),
        description: promoForm.description,
        discountType: promoForm.discountType,
        discountValue: Number(promoForm.discountValue) || 0,
        maxUses: promoForm.maxUses ? Number(promoForm.maxUses) : null,
        validFrom: promoForm.validFrom || null,
        validUntil: promoForm.validUntil || null,
        isActive: promoForm.isActive,
      }

      if (editingPromo) {
        await promoCodesApi.update(editingPromo.id, payload)
        showNotification(label('تم تحديث كود الخصم بنجاح', 'Promo code updated successfully'))
      } else {
        await promoCodesApi.create(payload)
        showNotification(label('تم إنشاء كود الخصم بنجاح', 'Promo code created successfully'))
      }

      setPromoModalOpen(false)
      loadAllData()
    } catch (err) {
      console.error(err)
      showNotification(err.response?.data?.error?.message || label('حدث خطأ أثناء حفظ كود الخصم', 'Error saving promo code'), true)
    } finally {
      setSaving(false)
    }
  }

  const handleDeletePromo = async (id) => {
    if (!window.confirm(label('هل أنت متأكد من حذف كود الخصم؟', 'Are you sure you want to delete this promo code?'))) {
      return
    }
    try {
      await promoCodesApi.delete(id)
      showNotification(label('تم حذف كود الخصم', 'Promo code deleted'))
      loadAllData()
    } catch (err) {
      console.error(err)
      showNotification(label('فشل حذف كود الخصم', 'Failed to delete promo code'), true)
    }
  }

  // --- Commission Settings Handler ---
  const handleSaveCommissionSettings = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      await commissionsApi.updateSettings({
        defaultCommissionRate: Number(commissionSettings.defaultCommissionRate),
        defaultTrialDays: Number(commissionSettings.defaultTrialDays),
        defaultInitialBalance: Number(commissionSettings.defaultInitialBalance),
        defaultDebtLimit: Number(commissionSettings.defaultDebtLimit),
        minRechargeAmount: Number(commissionSettings.minRechargeAmount),
      })
      showNotification(label('تم حفظ إعدادات العمولات بنجاح', 'Commission settings saved successfully'))
    } catch (err) {
      console.error(err)
      showNotification(label('فشل حفظ إعدادات العمولات', 'Failed to save commission settings'), true)
    } finally {
      setSaving(false)
    }
  }

  // Filtered plans list
  const filteredPlans = plans.filter((p) => {
    const isTrial = Number(p.priceSar) === 0
    if (planFilter === 'trial') return isTrial
    if (planFilter === 'recharge') return !isTrial
    return true
  })

  return (
    <div className="animate-fade">
      {/* Toast Messages */}
      {successMsg && (
        <div
          className="card mb-16 p-12 flex items-center gap-12"
          style={{ background: 'rgba(16, 185, 129, 0.12)', border: '1px solid #10b981', color: '#10b981' }}
        >
          <CheckCircle size={18} />
          <span className="fw-bold fs-sm">{successMsg}</span>
        </div>
      )}
      {errorMsg && (
        <div
          className="card mb-16 p-12 flex items-center gap-12"
          style={{ background: 'rgba(239, 68, 68, 0.12)', border: '1px solid #ef4444', color: '#ef4444' }}
        >
          <AlertCircle size={18} />
          <span className="fw-bold fs-sm">{errorMsg}</span>
        </div>
      )}

      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">{label('الباقات ونظام العمولات', 'Packages & Commission System')}</h1>
          <p className="page-subtitle">
            {label(
              `إدارة الباقات التجريبية (بالأيام)، باقات شحن وتفعيل الرصيد (بـ${currSymbol})، العروض الترويجية، وإعدادات العمولات`,
              `Manage trial packages (days), recharge packages (${currCode}), promotional offers, and commission rates`
            )}
          </p>
        </div>
        <div className="flex gap-8 items-center flex-wrap">
          {/* Currency Selector */}
          <CurrencySelector currency={currency} setCurrency={setCurrency} lang={lang} />
          <button className="btn btn-secondary" onClick={loadAllData} disabled={loading}>
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
            {label('تحديث', 'Refresh')}
          </button>
          {tab === 'plans' && (
            <button className="btn btn-primary" onClick={handleOpenCreatePlan}>
              <Plus size={16} /> {label('إنشاء باقة جديدة', 'New Package')}
            </button>
          )}
          {tab === 'promos' && (
            <button className="btn btn-primary" onClick={handleOpenCreatePromo}>
              <Plus size={16} /> {label('إنشاء كود خصم', 'New Promo Code')}
            </button>
          )}
        </div>
      </div>

      {/* Quick KPI Overview Cards */}
      <div className="grid grid-4 mb-20">
        <div className="card stat-card">
          <div className="card-body">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted fs-xs fw-bold text-uppercase">{label('الباقات النشطة', 'Active Packages')}</p>
                <h3 className="fs-2xl fw-black mt-4">{plans.filter((p) => p.isActive).length}</h3>
              </div>
              <div className="stat-icon" style={{ background: 'rgba(59, 130, 246, 0.12)', color: '#3b82f6', padding: 12, borderRadius: 12 }}>
                <Layers size={22} />
              </div>
            </div>
            <p className="fs-xs text-muted mt-8">
              {plans.filter((p) => Number(p.priceSar) === 0).length} {label('تجريبية', 'Trial')} |{' '}
              {plans.filter((p) => Number(p.priceSar) > 0).length} {label('شحن رصيد', 'Recharge')}
            </p>
          </div>
        </div>

        <div className="card stat-card">
          <div className="card-body">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted fs-xs fw-bold text-uppercase">{label('نسبة العمولة العامة', 'Default Commission')}</p>
                <h3 className="fs-2xl fw-black mt-4" style={{ color: 'var(--primary-600)' }}>
                  {commissionSettings.defaultCommissionRate}%
                </h3>
              </div>
              <div className="stat-icon" style={{ background: 'rgba(99, 102, 241, 0.12)', color: '#6366f1', padding: 12, borderRadius: 12 }}>
                <Percent size={22} />
              </div>
            </div>
            <p className="fs-xs text-muted mt-8">
              {label('تجريبي:', 'Trial:')} {commissionSettings.defaultTrialDays} {label('يوم', 'days')} | {label('هدية التفعيل:', 'Welcome:')} {Number(commissionSettings.defaultInitialBalance ?? 2000).toLocaleString()} {currSymbol}
            </p>
          </div>
        </div>

        <div className="card stat-card">
          <div className="card-body">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted fs-xs fw-bold text-uppercase">{label('أكواد الخصم والعروض', 'Active Offers')}</p>
                <h3 className="fs-2xl fw-black mt-4" style={{ color: '#10b981' }}>
                  {promoCodes.filter((c) => c.isActive).length}
                </h3>
              </div>
              <div className="stat-icon" style={{ background: 'rgba(16, 185, 129, 0.12)', color: '#10b981', padding: 12, borderRadius: 12 }}>
                <Tag size={22} />
              </div>
            </div>
            <p className="fs-xs text-muted mt-8">
              {plans.filter((p) => p.isSeasonal).length} {label('عروض باقات موسمية', 'Seasonal Plans')}
            </p>
          </div>
        </div>

        <div className="card stat-card">
          <div className="card-body">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted fs-xs fw-bold text-uppercase">{label('إجمالي العمولات المحصلة', 'Commission Collected')}</p>
                <h3 className="fs-2xl fw-black mt-4" style={{ color: '#f59e0b' }}>
                  {Number(txStats.totalCommission).toLocaleString()} {currSymbol}
                </h3>
              </div>
              <div className="stat-icon" style={{ background: 'rgba(245, 158, 11, 0.12)', color: '#f59e0b', padding: 12, borderRadius: 12 }}>
                <TrendingUp size={22} />
              </div>
            </div>
            <p className="fs-xs text-muted mt-8">
              {transactions.length} {label('حركة مالية مسجلة', 'Transactions')}
            </p>
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="tabs mb-20">
        {[
          ['plans', label('باقات النظام (تجريبية وشحن)', 'System Packages'), Layers],
          ['promos', label('العروض وأكواد الخصم', 'Offers & Promo Codes'), Tag],
          ['settings', label('إعدادات العمولات والحدود', 'Commission Settings'), Coins],
          ['transactions', label('سجل حركات العمولات', 'Commission Transactions'), TrendingUp],
          ['recharges', label('سجل التسديدات وشحن المحافظ', 'Recharges & Payments Log'), Wallet],
        ].map(([k, title, Icon]) => (
          <button key={k} className={`tab-btn flex items-center gap-8 ${tab === k ? 'active' : ''}`} onClick={() => setTab(k)}>
            <Icon size={16} />
            <span>{title}</span>
          </button>
        ))}
      </div>

      {/* ────────────────────────────────────────────────────────────────────────── */}
      {/* 📦 TAB 1: PLANS / PACKAGES */}
      {/* ────────────────────────────────────────────────────────────────────────── */}
      {tab === 'plans' && (
        <div>
          {/* Sub filter */}
          <div className="flex items-center justify-between mb-16">
            <div className="flex gap-8">
              <button
                className={`btn btn-sm ${planFilter === 'all' ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => setPlanFilter('all')}
              >
                {label('جميع الباقات', 'All Packages')} ({plans.length})
              </button>
              <button
                className={`btn btn-sm ${planFilter === 'trial' ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => setPlanFilter('trial')}
              >
                {label('الباقات التجريبية (بالأيام)', 'Trial Packages')} ({plans.filter((p) => Number(p.priceSar) === 0).length})
              </button>
              <button
                className={`btn btn-sm ${planFilter === 'recharge' ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => setPlanFilter('recharge')}
              >
                {label('باقات شحن وتفعيل الرصيد (بالريال)', 'Recharge Packages')} ({plans.filter((p) => Number(p.priceSar) > 0).length})
              </button>
            </div>
          </div>

          {filteredPlans.length === 0 ? (
            <div className="card p-40 text-center">
              <p className="text-muted fs-lg mb-16">{label('لا توجد باقات تطابق الفلتر الحالي', 'No packages found')}</p>
              <button className="btn btn-primary" onClick={handleOpenCreatePlan}>
                <Plus size={16} /> {label('إنشاء باقة جديدة الآن', 'Create New Package')}
              </button>
            </div>
          ) : (
            <div className="grid grid-3">
              {filteredPlans.map((p) => {
                const isTrial = Number(p.priceSar) === 0
                const hasDiscount = p.isSeasonal && Number(p.discountPercent) > 0
                const finalPrice = hasDiscount ? p.priceSar * (1 - p.discountPercent / 100) : p.priceSar

                return (
                  <div
                    key={p.id}
                    className="card"
                    style={{
                      borderTop: `4px solid ${isTrial ? '#3b82f6' : '#10b981'}`,
                      position: 'relative',
                      opacity: p.isActive ? 1 : 0.65,
                    }}
                  >
                    <div className="card-body">
                      {/* Seasonal Offer Banner if active */}
                      {hasDiscount && (
                        <div
                          className="flex items-center justify-between p-6 mb-12 rounded"
                          style={{ background: 'rgba(245, 158, 11, 0.15)', color: '#d97706', fontSize: 12, fontWeight: 700 }}
                        >
                          <span className="flex items-center gap-4">
                            <Sparkles size={14} /> {p.occasionName || label('عرض خاص', 'Special Offer')}
                          </span>
                          <span>خصم {p.discountPercent}%</span>
                        </div>
                      )}

                      {/* Header */}
                      <div className="flex items-start justify-between mb-12">
                        <div>
                          <div className="flex items-center gap-6">
                            <span
                              className={`badge ${isTrial ? 'badge-info' : 'badge-success'}`}
                              style={{ fontSize: 11 }}
                            >
                              {isTrial ? label('باقة تجريبية (أيام)', 'Trial Package') : label('باقة شحن وتفعيل', 'Recharge Package')}
                            </span>
                            {!p.isActive && <span className="badge badge-neutral">{label('معطلة', 'Inactive')}</span>}
                          </div>
                          <h3 className="fs-lg fw-black mt-6">{label(p.nameAr, p.nameEn || p.nameAr)}</h3>
                        </div>
                      </div>

                      {/* Main Price / Metric */}
                      <div className="mb-16 p-12 rounded" style={{ background: 'var(--bg-subtle, rgba(0,0,0,0.03))' }}>
                        {isTrial ? (
                          <div>
                            <div className="flex items-baseline gap-6">
                              <span className="fs-3xl fw-black" style={{ color: '#3b82f6' }}>
                                {p.durationDays}
                              </span>
                              <span className="fs-sm fw-bold text-muted">{label('يوماً مجانياً', 'Days Free')}</span>
                            </div>
                            <p className="fs-xs text-muted mt-2">
                              {label('بدون أي عمولة مقتطعة خلال كامل الفترة التجريبية', 'Zero commission during the trial period')}
                            </p>
                          </div>
                        ) : (
                          <div>
                            <div className="flex items-baseline gap-6">
                              <span className="fs-3xl fw-black" style={{ color: '#10b981' }}>
                                {Number(finalPrice).toLocaleString()}
                              </span>
                              <span className="fs-sm fw-bold text-muted">{currSymbol} {label('رصيد', 'Balance')}</span>
                              {hasDiscount && (
                                <span className="fs-sm text-muted text-line-through">
                                  {Number(p.priceSar).toLocaleString()}
                                </span>
                              )}
                            </div>
                            <p className="fs-xs text-muted mt-2">
                              {label(`يضاف لرصيد المحفظة ويخصم منه العمولات (صالح ${p.durationDays > 0 ? `${p.durationDays} يوم` : 'دائم'})`, `Added to laundry wallet balance`)}
                            </p>
                          </div>
                        )}
                      </div>

                      <hr className="divider" />

                      {/* Features List */}
                      <div className="flex flex-col gap-8 mb-20" style={{ minHeight: 80 }}>
                        {Array.isArray(p.features) && p.features.length > 0 ? (
                          p.features.map((f, idx) => (
                            <div key={idx} className="flex items-center gap-8 fs-sm">
                              <CheckCircle size={14} color="#10b981" />
                              <span>{typeof f === 'string' ? f : JSON.stringify(f)}</span>
                            </div>
                          ))
                        ) : (
                          <span className="fs-xs text-muted">{label('لا توجد ميزات إضافية مسجلة', 'No custom features')}</span>
                        )}
                      </div>

                      {/* Action Buttons */}
                      <div className="flex gap-8 pt-8" style={{ borderTop: '1px solid var(--border-color)' }}>
                        <button className="btn btn-secondary btn-sm flex-1" onClick={() => handleOpenEditPlan(p)}>
                          <Edit size={14} /> {label('تعديل', 'Edit')}
                        </button>
                        <button
                          className={`btn btn-sm ${p.isActive ? 'btn-ghost' : 'btn-primary'}`}
                          title={p.isActive ? label('إيقاف', 'Deactivate') : label('تفعيل', 'Activate')}
                          onClick={() => handleTogglePlanActive(p)}
                        >
                          {p.isActive ? <XCircle size={16} /> : <Check size={16} />}
                        </button>
                        <button
                          className="btn btn-ghost btn-sm"
                          style={{ color: 'var(--danger)' }}
                          title={label('حذف', 'Delete')}
                          onClick={() => handleDeletePlan(p.id)}
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* ────────────────────────────────────────────────────────────────────────── */}
      {/* 🏷️ TAB 2: PROMO CODES & OFFERS */}
      {/* ────────────────────────────────────────────────────────────────────────── */}
      {tab === 'promos' && (
        <div className="flex flex-col gap-20">
          {/* Active Promo Codes Table */}
          <div className="card">
            <div className="card-header flex items-center justify-between p-16">
              <div>
                <h3 className="fs-lg fw-bold">{label('أكواد الخصم الترويجية', 'Promotional Codes')}</h3>
                <p className="fs-xs text-muted">{label('إنشاء وإدارة أكواد الخصم ونسب التخفيض المتاحة للمغاسل', 'Manage promo discount codes for laundries')}</p>
              </div>
              <button className="btn btn-primary btn-sm" onClick={handleOpenCreatePromo}>
                <Plus size={14} /> {label('إضافة كود جديد', 'Add Code')}
              </button>
            </div>

            <div className="table-wrapper" style={{ border: 'none' }}>
              <table>
                <thead>
                  <tr>
                    <th>{label('الكود', 'Code')}</th>
                    <th>{label('الوصف', 'Description')}</th>
                    <th>{label('النوع', 'Type')}</th>
                    <th>{label('قيمة الخصم', 'Discount Value')}</th>
                    <th>{label('الاستخدام', 'Usage')}</th>
                    <th>{label('فترة الصلاحية', 'Validity Period')}</th>
                    <th>{label('الحالة', 'Status')}</th>
                    <th>{label('الإجراءات', 'Actions')}</th>
                  </tr>
                </thead>
                <tbody>
                  {promoCodes.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="text-center p-20 text-muted">
                        {label('لا توجد أكواد خصم مسجلة حالياً', 'No promo codes yet')}
                      </td>
                    </tr>
                  ) : (
                    promoCodes.map((pr) => (
                      <tr key={pr.id}>
                        <td>
                          <code
                            style={{
                              background: 'var(--primary-50, rgba(59,130,246,0.1))',
                              color: 'var(--primary-600, #3b82f6)',
                              padding: '4px 10px',
                              borderRadius: 6,
                              fontWeight: 800,
                              fontSize: 13,
                              letterSpacing: 1,
                            }}
                          >
                            {pr.code}
                          </code>
                        </td>
                        <td className="fs-sm">{pr.description || '-'}</td>
                        <td>
                          <div className="flex items-center gap-6">
                            {pr.discountType === 'percent' ? (
                              <Percent size={14} color="#3b82f6" />
                            ) : (
                              <DollarSign size={14} color="#f59e0b" />
                            )}
                            <span className="fs-sm">
                              {pr.discountType === 'percent' ? label('نسبة مئوية', 'Percentage') : label('مبلغ ثابت', 'Fixed Amount')}
                            </span>
                          </div>
                        </td>
                        <td className="fw-bold text-primary">
                          {pr.discountValue}
                          {pr.discountType === 'percent' ? '%' : ` ${currSymbol}`}
                        </td>
                        <td>
                          <div>
                            <span className="fw-bold">{pr.usedCount}</span>
                            <span className="text-muted"> / {pr.maxUses ?? '∞'}</span>
                          </div>
                          {pr.maxUses && (
                            <div className="progress mt-4" style={{ height: 5 }}>
                              <div
                                className="progress-bar"
                                style={{ width: `${Math.min(100, (pr.usedCount / pr.maxUses) * 100)}%` }}
                              />
                            </div>
                          )}
                        </td>
                        <td className="fs-xs text-muted">
                          {pr.validFrom || pr.validUntil ? (
                            <div className="flex items-center gap-4">
                              <Calendar size={13} />
                              <span>
                                {pr.validFrom || '...'} إلى {pr.validUntil || '...'}
                              </span>
                            </div>
                          ) : (
                            <span>{label('دائم', 'No Expiry')}</span>
                          )}
                        </td>
                        <td>
                          <span className={`badge badge-${pr.isActive ? 'success' : 'neutral'}`}>
                            {pr.isActive ? label('نشط', 'Active') : label('موقوف', 'Inactive')}
                          </span>
                        </td>
                        <td>
                          <div className="flex gap-4">
                            <button className="btn btn-ghost btn-icon btn-sm" onClick={() => handleOpenEditPromo(pr)}>
                              <Edit size={14} />
                            </button>
                            <button
                              className="btn btn-ghost btn-icon btn-sm"
                              style={{ color: 'var(--danger)' }}
                              onClick={() => handleDeletePromo(pr.id)}
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ────────────────────────────────────────────────────────────────────────── */}
      {/* ⚙️ TAB 3: COMMISSION SETTINGS */}
      {/* ────────────────────────────────────────────────────────────────────────── */}
      {tab === 'settings' && (
        <div className="grid grid-2 gap-20">
          {/* Main Settings Card */}
          <div className="card">
            <div className="card-header p-16">
              <h3 className="fs-lg fw-bold flex items-center gap-8">
                <Coins size={18} color="var(--primary-500)" />
                {label('إعدادات العمولات الافتراضية والحدود', 'Default Commission & Debt Settings')}
              </h3>
              <p className="fs-xs text-muted mt-4">
                {label(
                  'تحدد هذه الإعدادات النسبة التلقائية المقتطعة من فواتير المغاسل والأيام التجريبية الممنوحة تلقائياً',
                  'Configure default commission rate, automatic trial days, and debt limit for all laundries'
                )}
              </p>
            </div>

            <form onSubmit={handleSaveCommissionSettings} className="card-body flex flex-col gap-16">
              <div className="form-group">
                <label className="form-label fw-bold">
                  {label('نسبة العمولة الافتراضية (%)', 'Default Commission Rate (%)')}
                </label>
                <div className="flex items-center gap-8">
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max="100"
                    className="form-control"
                    value={commissionSettings.defaultCommissionRate}
                    onChange={(e) =>
                      setCommissionSettings({ ...commissionSettings, defaultCommissionRate: e.target.value })
                    }
                    required
                  />
                  <span className="fs-sm fw-bold text-muted">%</span>
                </div>
                <span className="fs-xs text-muted mt-4">
                  {label('النسبة المئوية التي يتم خصمها من رصيد محفظة المغسلة عن كل فاتورة مكتملة.', 'Rate deducted from laundry wallet upon invoice completion.')}
                </span>
              </div>

              <div className="form-group">
                <label className="form-label fw-bold">
                  {label('الأيام التجريبية الافتراضية عند التسجيل (يوم)', 'Default Trial Period (Days)')}
                </label>
                <div className="flex items-center gap-8">
                  <input
                    type="number"
                    min="0"
                    max="365"
                    className="form-control"
                    value={commissionSettings.defaultTrialDays}
                    onChange={(e) =>
                      setCommissionSettings({ ...commissionSettings, defaultTrialDays: e.target.value })
                    }
                    required
                  />
                  <span className="fs-sm fw-bold text-muted">{label('يوم', 'Days')}</span>
                </div>
                <span className="fs-xs text-muted mt-4">
                  {label('المدة المجانية التي تُعطى لأي مغسلة جديدة تنضم للمنصة، وبدون خصم أي عمولة خلالها.', 'Free period given automatically to newly registered laundries.')}
                </span>
              </div>

              <div className="form-group">
                <label className="form-label fw-bold">
                  {label(`رصيد هدية التفعيل الافتراضي (${currSymbol})`, `Default Initial Welcome Balance (${currCode})`)}
                </label>
                <div className="flex items-center gap-8">
                  <input
                    type="number"
                    min="0"
                    className="form-control"
                    value={commissionSettings.defaultInitialBalance ?? 2000}
                    onChange={(e) =>
                      setCommissionSettings({ ...commissionSettings, defaultInitialBalance: e.target.value })
                    }
                    required
                  />
                  <span className="fs-sm fw-bold text-muted">{currSymbol}</span>
                </div>
                <span className="fs-xs text-muted mt-4">
                  {label('الرصيد الترحيبي المجاني الذي يضاف تلقائياً لمحفظة أي مغسلة جديدة عند التسجيل ليظل رصيداً لها.', 'Free welcome credit granted automatically to new laundries upon registration.')}
                </span>
              </div>

              <div className="form-group">
                <label className="form-label fw-bold">
                  {label(`الحد الائتماني للمديونية (${currSymbol})`, `Debt Limit (${currCode})`)}
                </label>
                <div className="flex items-center gap-8">
                  <input
                    type="number"
                    min="0"
                    className="form-control"
                    value={commissionSettings.defaultDebtLimit}
                    onChange={(e) =>
                      setCommissionSettings({ ...commissionSettings, defaultDebtLimit: e.target.value })
                    }
                    required
                  />
                  <span className="fs-sm fw-bold text-muted">{currSymbol}</span>
                </div>
                <span className="fs-xs text-muted mt-4">
                  {label('الحد الأقصى المسموح للمغسلة بالعمل فيه برصيد سالب قبل إيقاف إصدار الفواتير لحين الشحن.', 'Max negative balance before requiring a recharge.')}
                </span>
              </div>

              <div className="form-group">
                <label className="form-label fw-bold">
                  {label(`الحد الأدنى لمبلغ شحن الرصيد (${currSymbol})`, `Minimum Recharge Amount (${currCode})`)}
                </label>
                <div className="flex items-center gap-8">
                  <input
                    type="number"
                    min="1"
                    className="form-control"
                    value={commissionSettings.minRechargeAmount}
                    onChange={(e) =>
                      setCommissionSettings({ ...commissionSettings, minRechargeAmount: e.target.value })
                    }
                    required
                  />
                  <span className="fs-sm fw-bold text-muted">{currSymbol}</span>
                </div>
                <span className="fs-xs text-muted mt-4">
                  {label('أقل مبلغ يمكن للمغسلة إيداعه لشحن رصيدها في محفظتها.', 'Minimum amount a laundry can deposit to recharge its wallet balance.')}
                </span>
              </div>

              <div className="pt-12">
                <button type="submit" className="btn btn-primary w-full flex items-center justify-center gap-8" disabled={saving}>
                  <Save size={16} />
                  {saving ? label('جاري الحفظ...', 'Saving...') : label('حفظ الإعدادات', 'Save Settings')}
                </button>
              </div>
            </form>
          </div>

          {/* Commission System Explanation & Info Card */}
          <div className="card" style={{ background: 'var(--bg-subtle, rgba(243, 244, 246, 0.5))' }}>
            <div className="card-body flex flex-col gap-16">
              <h4 className="fs-md fw-black flex items-center gap-8" style={{ color: 'var(--primary-600)' }}>
                <Info size={20} />
                {label('كيف يعمل نظام العمولات والباقات؟', 'How Commission System Works')}
              </h4>

              <div className="flex flex-col gap-12 fs-sm">
                <div className="p-12 rounded bg-white" style={{ border: '1px solid var(--border-color)' }}>
                  <span className="fw-bold block mb-4">1. {label('الفترة التجريبية المجانية', 'Free Trial Period')}:</span>
                  <p className="text-muted fs-xs">
                    {label(
                      'تبدأ من تاريخ قبول المغسلة ولمدة الأيام المحددة (مثلاً 30 أو 40 يوماً). خلال هذه الفترة، كل فواتير المغسلة معفاة تماماً من العمولات.',
                      'Starts immediately upon approval. Zero commission is charged during the trial days.'
                    )}
                  </p>
                </div>

                <div className="p-12 rounded bg-white" style={{ border: '1px solid var(--border-color)' }}>
                  <span className="fw-bold block mb-4">2. {label('باقات شحن وتفعيل الرصيد', 'Recharge & Activation')}:</span>
                  <p className="text-muted fs-xs">
                    {label(
                      'تقوم المغسلة بشحن رصيدها المالي (مثلاً 1000 أو 2000 ريال) ليضاف إلى محفظتها. عند إتمام كل فاتورة، يقتطع النظام العمولة (مثلاً 10%) تلقائياً ويسجل حركة مالية شفافة.',
                      'Laundries buy balance packages. When invoices complete, the commission is deducted automatically.'
                    )}
                  </p>
                </div>

                <div className="p-12 rounded bg-white" style={{ border: '1px solid var(--border-color)' }}>
                  <span className="fw-bold block mb-4">3. {label('التحكم الفردي لكل مغسلة', 'Per-Laundry Customization')}:</span>
                  <p className="text-muted fs-xs">
                    {label(
                      'يمكن لمدير النظام الدخول إلى تفاصيل أي مغسلة وتعديل نسبة عمولتها الخاصة أو تمديد فترتها التجريبية أو شحن رصيدها يدوياً.',
                      'Admin can override commission rate or extend trial for individual laundries in the laundry details page.'
                    )}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ────────────────────────────────────────────────────────────────────────── */}
      {/* 📊 TAB 4: COMMISSION TRANSACTIONS */}
      {/* ────────────────────────────────────────────────────────────────────────── */}
      {tab === 'transactions' && (
        <div className="card">
          <div className="card-header p-16 flex items-center justify-between">
            <div>
              <h3 className="fs-lg fw-bold">{label('سجل حركات العمولات وشحن الأرصدة', 'Commission & Transaction Logs')}</h3>
              <p className="fs-xs text-muted">{label('متابعة الاقتطاعات من الفواتير المكتملة وشحن المحافظ للمغاسل', 'Logs of commission charges and wallet movements')}</p>
            </div>
          </div>

          <div className="table-wrapper" style={{ border: 'none' }}>
            <table>
              <thead>
                <tr>
                  <th>{label('المغسلة', 'Laundry')}</th>
                  <th>{label('رقم الفاتورة', 'Invoice #')}</th>
                  <th>{label('مبلغ الفاتورة', 'Invoice Total')}</th>
                  <th>{label('النسبة', 'Rate')}</th>
                  <th>{label('مبلغ العمولة', 'Commission')}</th>
                  <th>{label('الرصيد بعد الحركة', 'Balance After')}</th>
                  <th>{label('النوع', 'Type')}</th>
                  <th>{label('التاريخ والوقت', 'Date & Time')}</th>
                </tr>
              </thead>
              <tbody>
                {transactions.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="text-center p-30 text-muted">
                      {label('لا توجد حركات عمولات مسجلة بعد', 'No commission transactions found')}
                    </td>
                  </tr>
                ) : (
                  transactions.map((tx) => (
                    <tr key={tx.id}>
                      <td>
                        <div className="fw-bold">{tx.laundryName}</div>
                        <div className="fs-xs text-muted">{tx.laundryPhone}</div>
                      </td>
                      <td>
                        <span className="badge badge-neutral fs-xs fw-bold">
                          {tx.invoiceNumber || tx.invoiceId?.substring(0, 8) || '-'}
                        </span>
                      </td>
                      <td className="fw-semi">{Number(tx.invoiceTotal).toLocaleString()} {currSymbol}</td>
                      <td>{tx.commissionRate}%</td>
                      <td className="fw-bold" style={{ color: tx.commissionAmount > 0 ? 'var(--danger)' : '#10b981' }}>
                        {tx.commissionAmount > 0 ? `-${tx.commissionAmount}` : tx.commissionAmount} {currSymbol}
                      </td>
                      <td className="fw-semi">
                        <span style={{ color: tx.balanceAfter < 0 ? 'var(--danger)' : '#10b981' }}>
                          {Number(tx.balanceAfter).toLocaleString()} {currSymbol}
                        </span>
                      </td>
                      <td>
                        <span className={`badge badge-${tx.type === 'charge' ? 'warning' : 'info'}`}>
                          {tx.type === 'charge' ? label('خصم عمولة', 'Commission Charge') : label('استرجاع', 'Refund')}
                        </span>
                      </td>
                      <td className="fs-xs text-muted">{new Date(tx.createdAt).toLocaleString(lang === 'ar' ? 'ar-SA' : 'en-US')}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ────────────────────────────────────────────────────────────────────────── */}
      {/* 💳 TAB 5: WALLET RECHARGES & PAYMENTS LOG */}
      {/* ────────────────────────────────────────────────────────────────────────── */}
      {tab === 'recharges' && (
        <div className="card">
          <div className="card-header flex items-center justify-between p-16 flex-wrap gap-12">
            <div>
              <h3 className="fs-lg fw-bold flex items-center gap-8">
                <Wallet size={20} color="#10b981" />
                {label('سجل تسديدات وشحن محافظ المغاسل', 'Wallet Recharges & Payments Log')}
              </h3>
              <p className="fs-xs text-muted mt-4">
                {label(
                  'توثيق ومتابعة كافة سندات القبض والدفعات المودعة في أرصدة المغاسل لجميع الفروع',
                  'Comprehensive audit log of all balance top-ups and cash/transfer receipts across all laundries'
                )}
              </p>
            </div>

            <div className="flex items-center gap-10 flex-wrap">
              <div className="search-box" style={{ maxWidth: 260 }}>
                <Search size={16} />
                <input
                  type="text"
                  placeholder={label('بحث بالمغسلة، السند، الملاحظات...', 'Search laundry, receipt, notes...')}
                  value={rechargeSearch}
                  onChange={(e) => {
                    setRechargeSearch(e.target.value)
                    loadRecharges(e.target.value)
                  }}
                />
              </div>

              <button
                className="btn btn-secondary btn-sm flex items-center gap-6"
                onClick={() => loadRecharges(rechargeSearch)}
                disabled={loadingRecharges}
              >
                <RefreshCw size={14} className={loadingRecharges ? 'animate-spin' : ''} />
                <span>{label('تحديث', 'Refresh')}</span>
              </button>
            </div>
          </div>

          {/* Quick Metrics Bar */}
          <div
            className="flex items-center gap-20 p-16 flex-wrap"
            style={{
              background: 'var(--bg-page)',
              borderBottom: '1px solid var(--border)',
            }}
          >
            <div className="flex items-center gap-10">
              <div
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 10,
                  background: 'rgba(16, 185, 129, 0.12)',
                  color: '#10b981',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Banknote size={18} />
              </div>
              <div>
                <span className="fs-xs text-muted block">{label('إجمالي المبالغ المسددة', 'Total Recharged')}</span>
                <span className="fw-black fs-md text-success">
                  +{Number(rechargeStats.totalRecharged || 0).toLocaleString()} <small className="fs-xs font-normal">{currSymbol}</small>
                </span>
              </div>
            </div>

            <div style={{ height: 28, width: 1, background: 'var(--border)' }} />

            <div className="flex items-center gap-10">
              <div
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 10,
                  background: 'rgba(59, 130, 246, 0.12)',
                  color: '#3b82f6',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Wallet size={18} />
              </div>
              <div>
                <span className="fs-xs text-muted block">{label('عدد العمليات المسجلة', 'Recorded Operations')}</span>
                <span className="fw-black fs-md">
                  {rechargeStats.total || recharges.length} <small className="fs-xs font-normal text-muted">{label('عملية', 'ops')}</small>
                </span>
              </div>
            </div>
          </div>

          <div className="table-wrapper" style={{ border: 'none' }}>
            <table>
              <thead>
                <tr>
                  <th>{label('المغسلة', 'Laundry')}</th>
                  <th>{label('المبلغ المودع', 'Amount Credited')}</th>
                  <th>{label('طريقة التحصيل', 'Payment Method')}</th>
                  <th>{label('رقم السند / المرجع', 'Receipt / Ref #')}</th>
                  <th>{label('الرصيد قبل / بعد', 'Balance Change')}</th>
                  <th>{label('المسؤول المنفذ', 'Processed By')}</th>
                  <th>{label('التاريخ والوقت', 'Date & Time')}</th>
                  <th>{label('البيان / الملاحظات', 'Notes')}</th>
                </tr>
              </thead>
              <tbody>
                {loadingRecharges ? (
                  <tr>
                    <td colSpan={8} className="text-center p-30 text-muted">
                      <RefreshCw size={20} className="animate-spin inline mr-8" />
                      <span>{label('جاري تحميل سجل التسديدات...', 'Loading payments log...')}</span>
                    </td>
                  </tr>
                ) : recharges.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="text-center p-30 text-muted">
                      {label('لا توجد عمليات تسديد أو شحن مسجلة بعد', 'No recharge operations found')}
                    </td>
                  </tr>
                ) : (
                  recharges.map((rc) => {
                    const methodLabels = {
                      cash: { ar: 'نقدي (كاش)', en: 'Cash', badge: 'success' },
                      bank_transfer: { ar: 'تحويل بنكي', en: 'Bank Transfer', badge: 'primary' },
                      electronic: { ar: 'دفع إلكتروني', en: 'Electronic', badge: 'info' },
                      cheque: { ar: 'شيك بنكي', en: 'Cheque', badge: 'gold' },
                      other: { ar: 'أخرى / تسوية', en: 'Other', badge: 'neutral' },
                    }
                    const mInfo = methodLabels[rc.payment_method || rc.paymentMethod] || {
                      ar: rc.payment_method || rc.paymentMethod || 'أخرى',
                      en: rc.payment_method || rc.paymentMethod || 'Other',
                      badge: 'neutral',
                    }

                    return (
                      <tr key={rc.id}>
                        <td>
                          <div className="fw-bold">{rc.laundry_name_ar || rc.laundry_name || rc.laundryName}</div>
                          {(rc.laundry_phone || rc.laundryPhone) && (
                            <div className="fs-xs text-muted ltr" dir="ltr">{rc.laundry_phone || rc.laundryPhone}</div>
                          )}
                        </td>
                        <td>
                          <span className="fw-black fs-md text-success">
                            +{Number(rc.amount).toLocaleString()} <small className="fs-xs font-normal">{currSymbol}</small>
                          </span>
                        </td>
                        <td>
                          <span className={`badge badge-${mInfo.badge} fs-xs`}>
                            {label(mInfo.ar, mInfo.en)}
                          </span>
                        </td>
                        <td>
                          {rc.reference_number || rc.referenceNumber ? (
                            <span className="badge badge-neutral fs-xs fw-bold font-mono">
                              {rc.reference_number || rc.referenceNumber}
                            </span>
                          ) : (
                            <span className="text-muted fs-xs">—</span>
                          )}
                        </td>
                        <td>
                          <div className="flex items-center gap-6 fs-xs">
                            <span className="text-muted">
                              {Number(rc.balance_before ?? rc.balanceBefore ?? 0).toLocaleString()}
                            </span>
                            <span>→</span>
                            <span className="fw-bold text-success">
                              {Number(rc.balance_after ?? rc.balanceAfter ?? 0).toLocaleString()} {currSymbol}
                            </span>
                          </div>
                        </td>
                        <td>
                          <div className="flex items-center gap-6 fs-xs fw-semi">
                            <User size={12} className="text-muted" />
                            <span>{rc.admin_name || rc.adminName || label('مدير النظام', 'Admin')}</span>
                          </div>
                        </td>
                        <td className="fs-xs text-muted">
                          {rc.created_at || rc.createdAt
                            ? new Date(rc.created_at || rc.createdAt).toLocaleString(lang === 'ar' ? 'ar-SA' : 'en-US')
                            : '—'}
                        </td>
                        <td className="fs-xs text-muted" style={{ maxWidth: 200, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {rc.notes || '—'}
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ────────────────────────────────────────────────────────────────────────── */}
      {/* 🚀 MODAL: ADD / EDIT PACKAGE */}
      {/* ────────────────────────────────────────────────────────────────────────── */}
      {planModalOpen && (
        <div className="modal-overlay" onClick={() => setPlanModalOpen(false)}>
          <div className="modal-content" style={{ maxWidth: 600 }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header flex items-center justify-between">
              <h3 className="fs-lg fw-bold">
                {editingPlan ? label('تعديل الباقة', 'Edit Package') : label('إنشاء باقة جديدة', 'Create New Package')}
              </h3>
              <button className="btn btn-ghost btn-icon btn-sm" onClick={() => setPlanModalOpen(false)}>
                <XCircle size={18} />
              </button>
            </div>

            <form onSubmit={handleSavePlan}>
              <div className="modal-body flex flex-col gap-16">
                {/* Plan Type Selector */}
                <div className="form-group">
                  <label className="form-label fw-bold">{label('نوع الباقة', 'Package Type')}</label>
                  <div className="grid grid-2 gap-8">
                    <button
                      type="button"
                      className={`btn ${planForm.planType === 'trial' ? 'btn-primary' : 'btn-secondary'}`}
                      onClick={() =>
                        setPlanForm({
                          ...planForm,
                          planType: 'trial',
                          priceSar: 0,
                          nameAr: planForm.nameAr || 'باقة تجريبية 30 يوم',
                          nameEn: planForm.nameEn || 'Trial Package 30 Days',
                        })
                      }
                    >
                      <Clock size={16} />
                      {label('باقة تجريبية (بالأيام المجانية)', 'Trial Package (Free Days)')}
                    </button>
                    <button
                      type="button"
                      className={`btn ${planForm.planType === 'recharge' ? 'btn-primary' : 'btn-secondary'}`}
                      onClick={() =>
                        setPlanForm({
                          ...planForm,
                          planType: 'recharge',
                          priceSar: planForm.priceSar > 0 ? planForm.priceSar : 1000,
                          nameAr: planForm.nameAr || 'باقة تفعيل 1000 ريال',
                          nameEn: planForm.nameEn || 'Recharge Package 1000 SAR',
                        })
                      }
                    >
                      <DollarSign size={16} />
                      {label(`باقة شحن وتفعيل (مبلغ بـ${currSymbol})`, `Recharge Package (${currCode} Amount)`)}
                    </button>
                  </div>
                </div>

                {/* Names */}
                <div className="grid grid-2 gap-12">
                  <div className="form-group">
                    <label className="form-label">{label('اسم الباقة (عربي)', 'Name (Arabic)')}</label>
                    <input
                      type="text"
                      className="form-control"
                      value={planForm.nameAr}
                      onChange={(e) => setPlanForm({ ...planForm, nameAr: e.target.value })}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">{label('اسم الباقة (إنجليزي)', 'Name (English)')}</label>
                    <input
                      type="text"
                      className="form-control"
                      value={planForm.nameEn}
                      onChange={(e) => setPlanForm({ ...planForm, nameEn: e.target.value })}
                      required
                    />
                  </div>
                </div>

                {/* Duration & Price */}
                <div className="grid grid-2 gap-12">
                  <div className="form-group">
                    <label className="form-label">
                      {planForm.planType === 'trial'
                        ? label('المدة التجريبية (بالأيام)', 'Trial Duration (Days)')
                        : label('صلاحية الرصيد (بالأيام - 0 لغير محدود)', 'Validity Days (0 for lifetime)')}
                    </label>
                    <input
                      type="number"
                      min="1"
                      className="form-control"
                      value={planForm.durationDays}
                      onChange={(e) => setPlanForm({ ...planForm, durationDays: e.target.value })}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">
                      {planForm.planType === 'trial'
                        ? label(`السعر (0 ${currSymbol} - مجاني)`, `Price (0 ${currCode} - Free)`)
                        : label(`مبلغ الشحن والسعر (${currSymbol})`, `Recharge Amount / Price (${currCode})`)}
                    </label>
                    <input
                      type="number"
                      min="0"
                      className="form-control"
                      value={planForm.priceSar}
                      disabled={planForm.planType === 'trial'}
                      onChange={(e) => setPlanForm({ ...planForm, priceSar: e.target.value })}
                      required
                    />
                  </div>
                </div>

                {/* Seasonal Offer Settings */}
                <div className="card p-12 rounded" style={{ background: 'var(--bg-subtle, rgba(0,0,0,0.02))' }}>
                  <div className="flex items-center justify-between mb-8">
                    <label className="fw-bold fs-sm flex items-center gap-6">
                      <Sparkles size={16} color="#d97706" />
                      {label('تفعيل عرض موسمي / تخفيض على هذه الباقة', 'Enable Seasonal Discount Offer')}
                    </label>
                    <input
                      type="checkbox"
                      checked={planForm.isSeasonal}
                      onChange={(e) => setPlanForm({ ...planForm, isSeasonal: e.target.checked })}
                    />
                  </div>

                  {planForm.isSeasonal && (
                    <div className="grid grid-3 gap-8 mt-12 animate-fade">
                      <div className="form-group">
                        <label className="form-label fs-xs">{label('اسم المناسبة / العرض', 'Occasion Name')}</label>
                        <input
                          type="text"
                          placeholder="عرض رمضان / عرض التأسيس"
                          className="form-control"
                          value={planForm.occasionName}
                          onChange={(e) => setPlanForm({ ...planForm, occasionName: e.target.value })}
                        />
                      </div>
                      <div className="form-group">
                        <label className="form-label fs-xs">{label('نسبة الخصم %', 'Discount %')}</label>
                        <input
                          type="number"
                          min="1"
                          max="99"
                          className="form-control"
                          value={planForm.discountPercent}
                          onChange={(e) => setPlanForm({ ...planForm, discountPercent: e.target.value })}
                        />
                      </div>
                      <div className="form-group">
                        <label className="form-label fs-xs">{label('تاريخ انتهاء العرض', 'Offer Valid Until')}</label>
                        <input
                          type="date"
                          className="form-control"
                          value={planForm.offerValidUntil}
                          onChange={(e) => setPlanForm({ ...planForm, offerValidUntil: e.target.value })}
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Features list */}
                <div className="form-group">
                  <label className="form-label fw-bold">{label('الميزات والنقاط البارزة للباقة', 'Package Features')}</label>
                  {planForm.features.map((feat, i) => (
                    <div key={i} className="flex gap-8 mb-6">
                      <input
                        type="text"
                        className="form-control"
                        placeholder={label('مثلاً: بدون عمولة خلال الفترة', 'e.g. Zero commission')}
                        value={feat}
                        onChange={(e) => {
                          const updated = [...planForm.features]
                          updated[i] = e.target.value
                          setPlanForm({ ...planForm, features: updated })
                        }}
                      />
                      {planForm.features.length > 1 && (
                        <button
                          type="button"
                          className="btn btn-ghost btn-sm"
                          style={{ color: 'var(--danger)' }}
                          onClick={() => {
                            const updated = planForm.features.filter((_, idx) => idx !== i)
                            setPlanForm({ ...planForm, features: updated })
                          }}
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                  ))}
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm mt-4"
                    onClick={() => setPlanForm({ ...planForm, features: [...planForm.features, ''] })}
                  >
                    <Plus size={14} /> {label('إضافة ميزة أخرى', 'Add Feature')}
                  </button>
                </div>

                {/* Active switch */}
                <div className="flex items-center gap-8">
                  <input
                    type="checkbox"
                    id="isActivePlan"
                    checked={planForm.isActive}
                    onChange={(e) => setPlanForm({ ...planForm, isActive: e.target.checked })}
                  />
                  <label htmlFor="isActivePlan" className="fs-sm fw-bold cursor-pointer">
                    {label('الباقة نشطة ومتاحة للاختيار', 'Package is Active')}
                  </label>
                </div>
              </div>

              <div className="modal-footer flex gap-8 justify-end p-16">
                <button type="button" className="btn btn-secondary" onClick={() => setPlanModalOpen(false)}>
                  {label('إلغاء', 'Cancel')}
                </button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? label('جاري الحفظ...', 'Saving...') : label('حفظ الباقة', 'Save Package')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ────────────────────────────────────────────────────────────────────────── */}
      {/* 🏷️ MODAL: ADD / EDIT PROMO CODE */}
      {/* ────────────────────────────────────────────────────────────────────────── */}
      {promoModalOpen && (
        <div className="modal-overlay" onClick={() => setPromoModalOpen(false)}>
          <div className="modal-content" style={{ maxWidth: 500 }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header flex items-center justify-between">
              <h3 className="fs-lg fw-bold">
                {editingPromo ? label('تعديل كود الخصم', 'Edit Promo Code') : label('إنشاء كود خصم جديد', 'Create Promo Code')}
              </h3>
              <button className="btn btn-ghost btn-icon btn-sm" onClick={() => setPromoModalOpen(false)}>
                <XCircle size={18} />
              </button>
            </div>

            <form onSubmit={handleSavePromo}>
              <div className="modal-body flex flex-col gap-12">
                <div className="form-group">
                  <label className="form-label">{label('الكود الترويجي (أحرف وأرقام)', 'Code')}</label>
                  <input
                    type="text"
                    placeholder="e.g. LAUNCH2025"
                    className="form-control"
                    value={promoForm.code}
                    onChange={(e) => setPromoForm({ ...promoForm, code: e.target.value.toUpperCase() })}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">{label('الوصف أو الملاحظة', 'Description')}</label>
                  <input
                    type="text"
                    placeholder="خصم ترويجي للمغاسل الجديدة"
                    className="form-control"
                    value={promoForm.description}
                    onChange={(e) => setPromoForm({ ...promoForm, description: e.target.value })}
                  />
                </div>

                <div className="grid grid-2 gap-12">
                  <div className="form-group">
                    <label className="form-label">{label('نوع الخصم', 'Discount Type')}</label>
                    <select
                      className="form-control"
                      value={promoForm.discountType}
                      onChange={(e) => setPromoForm({ ...promoForm, discountType: e.target.value })}
                    >
                      <option value="percent">{label('نسبة مئوية (%)', 'Percentage (%)')}</option>
                      <option value="fixed">{label(`مبلغ ثابت (${currSymbol})`, `Fixed Amount (${currCode})`)}</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">{label('قيمة الخصم', 'Discount Value')}</label>
                    <input
                      type="number"
                      min="1"
                      className="form-control"
                      value={promoForm.discountValue}
                      onChange={(e) => setPromoForm({ ...promoForm, discountValue: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-2 gap-12">
                  <div className="form-group">
                    <label className="form-label">{label('الحد الأقصى لمرات الاستخدام', 'Max Uses (Optional)')}</label>
                    <input
                      type="number"
                      min="1"
                      placeholder={label('غير محدود', 'Unlimited')}
                      className="form-control"
                      value={promoForm.maxUses}
                      onChange={(e) => setPromoForm({ ...promoForm, maxUses: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">{label('تاريخ انتهاء الصلاحية', 'Expiry Date')}</label>
                    <input
                      type="date"
                      className="form-control"
                      value={promoForm.validUntil}
                      onChange={(e) => setPromoForm({ ...promoForm, validUntil: e.target.value })}
                    />
                  </div>
                </div>

                <div className="flex items-center gap-8 mt-8">
                  <input
                    type="checkbox"
                    id="isActivePromo"
                    checked={promoForm.isActive}
                    onChange={(e) => setPromoForm({ ...promoForm, isActive: e.target.checked })}
                  />
                  <label htmlFor="isActivePromo" className="fs-sm fw-bold cursor-pointer">
                    {label('الكود نشط وجاهز للاستخدام', 'Code is Active')}
                  </label>
                </div>
              </div>

              <div className="modal-footer flex gap-8 justify-end p-16">
                <button type="button" className="btn btn-secondary" onClick={() => setPromoModalOpen(false)}>
                  {label('إلغاء', 'Cancel')}
                </button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? label('جاري الحفظ...', 'Saving...') : label('حفظ الكود', 'Save Code')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
