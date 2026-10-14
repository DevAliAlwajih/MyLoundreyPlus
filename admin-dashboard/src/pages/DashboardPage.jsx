import { useState, useEffect, useMemo } from 'react'
import { useTheme } from '../App'
import { dashboardApi } from '../services/api'
import CurrencyPicker from '../components/CurrencyPicker'
import {
  SUPPORTED_CURRENCIES,
  getCurrencyMeta,
  formatAmount,
} from '../constants/currencies'
import {
  TrendingUp,
  Store,
  Users,
  FileText,
  ArrowUpRight,
  ArrowDownRight,
  RefreshCw,
  DollarSign,
  AlertTriangle,
  Globe,
  CheckCircle2,
  Clock,
  Sparkles,
  Database,
  Layers,
} from 'lucide-react'
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts'

export default function DashboardPage() {
  const { lang, currency: globalCurrency, setCurrency: setGlobalCurrency } = useTheme()
  const [period, setPeriod] = useState('month')
  const [selectedCurrency, setSelectedCurrency] = useState(() => {
    return globalCurrency?.code || 'all'
  })
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const isRTL = lang === 'ar'
  const label = (ar, en) => (isRTL ? ar : en)

  // Sync with global theme currency when it changes
  useEffect(() => {
    if (globalCurrency?.code && globalCurrency.code !== selectedCurrency && selectedCurrency !== 'all') {
      setSelectedCurrency(globalCurrency.code)
    }
  }, [globalCurrency])

  // Fetch stats whenever selected currency changes
  useEffect(() => {
    fetchStats(selectedCurrency)
  }, [selectedCurrency])

  const fetchStats = async (currencyCode = selectedCurrency) => {
    setLoading(true)
    setError(null)
    try {
      const params = currencyCode && currencyCode !== 'all' ? { currency: currencyCode } : {}
      const res = await dashboardApi.getStats(params)
      if (res?.data?.data) {
        setStats(res.data.data)
      } else {
        setStats(null)
      }
    } catch (err) {
      console.error('Failed to fetch dashboard stats from backend:', err)
      setError(err?.response?.data?.message || err.message || label('تعذر جلب البيانات من الخادم', 'Failed to fetch server data'))
      setStats(null)
    } finally {
      setLoading(false)
    }
  }

  const handleCurrencyChange = (code) => {
    setSelectedCurrency(code)
    if (code !== 'all' && setGlobalCurrency) {
      const meta = getCurrencyMeta(code)
      setGlobalCurrency(meta)
    }
  }

  // Active currency metadata
  const activeCurrencyCode = selectedCurrency === 'all' ? 'SAR' : selectedCurrency
  const activeCurrencyMeta = getCurrencyMeta(activeCurrencyCode)

  // Real System Revenue from Laundries (commissions + subscriptions)
  const systemRevenue = useMemo(() => {
    if (!stats?.revenue) return 0
    return Number(stats.revenue) || 0
  }, [stats])

  // Real Chart Data
  const chartData = useMemo(() => {
    if (stats?.chartData && Array.isArray(stats.chartData)) {
      return stats.chartData.map((c) => ({
        month: label(c.month, c.month),
        revenue: parseFloat(c.revenue) || 0,
        subscriptions: parseInt(c.subscriptions) || 0,
      }))
    }
    return []
  }, [stats, lang])

  // Real Status Distribution
  const statusDistribution = useMemo(() => {
    if (stats?.laundryStatusDistribution && stats.laundryStatusDistribution.length > 0) {
      return stats.laundryStatusDistribution.map((s) => ({
        name: label(
          s.status === 'active'
            ? 'نشطة'
            : s.status === 'trial'
            ? 'تجريبية'
            : s.status === 'pending'
            ? 'بانتظار التفعيل'
            : s.status === 'suspended'
            ? 'معلقة'
            : 'منتهية',
          s.status
        ),
        value: parseInt(s.count) || 0,
        color:
          s.status === 'active'
            ? '#10B981'
            : s.status === 'trial'
            ? '#F59E0B'
            : s.status === 'pending'
            ? '#3B82F6'
            : '#EF4444',
      }))
    }
    return []
  }, [stats, lang])

  // Real Recent Invoices
  const recentInvoices = useMemo(() => {
    if (stats?.recentInvoices && Array.isArray(stats.recentInvoices)) {
      return stats.recentInvoices.map((inv) => ({
        invoice_number: inv.invoice_number,
        laundry_name: inv.laundry_name,
        currency: inv.currency || activeCurrencyCode,
        amountFormatted: formatAmount(inv.total_amount, inv.currency || activeCurrencyCode, lang),
        status: inv.status,
      }))
    }
    return []
  }, [stats, activeCurrencyCode, lang])

  // Dynamic Alerts
  const alerts = useMemo(() => {
    const rawAlerts = [
      {
        type: 'warning',
        count: stats?.alerts?.expiring_soon ?? 0,
        ar: 'مغسلة ستنتهي باقاتها خلال 7 أيام',
        en: 'laundries expiring in 7 days',
      },
      {
        type: 'info',
        count: stats?.alerts?.pending_laundries ?? 0,
        ar: 'مغاسل جديدة بانتظار المراجعة والتفعيل',
        en: 'new laundries awaiting review & activation',
      },
      {
        type: 'danger',
        count: stats?.alerts?.open_tickets ?? 0,
        ar: 'تذاكر دعم فني مفتوحة تتطلب المتابعة',
        en: 'open support tickets requiring action',
      },
    ]
    return rawAlerts.filter((a) => a.count > 0)
  }, [stats])

  // KPI Cards - Real Metrics
  const kpis = [
    {
      id: 'revenue',
      labelAr: 'عائدات النظام من المغاسل',
      labelEn: 'System Revenue from Laundries',
      sublabelAr: 'عمولات الفواتير واشتراكات الباقات',
      sublabelEn: 'Order commissions & subscriptions',
      value: formatAmount(systemRevenue, activeCurrencyCode, lang),
      badgeText: selectedCurrency === 'all' ? label('جميع العملات', 'All Currencies') : `${activeCurrencyMeta.flag} ${activeCurrencyMeta.code}`,
      icon: DollarSign,
      color: 'var(--primary-500, #4f46e5)',
      bg: 'rgba(99, 102, 241, 0.1)',
    },
    {
      id: 'laundries',
      labelAr: 'المغاسل المسجلة والنشطة',
      labelEn: 'Active Laundries',
      sublabelAr: `${stats?.counts?.total_laundries ?? 0} إجمالي المغاسل في النظام`,
      sublabelEn: `${stats?.counts?.total_laundries ?? 0} total registered laundries`,
      value: (stats?.counts?.active_laundries ?? 0).toLocaleString(),
      badgeText: label('مغسلة نشطة', 'active'),
      icon: Store,
      color: '#10B981',
      bg: 'rgba(16, 185, 129, 0.1)',
    },
    {
      id: 'customers',
      labelAr: 'إجمالي عملاء النظام',
      labelEn: 'Total Registered Customers',
      sublabelAr: 'عملاء التطبيق وملفات عملاء المغاسل',
      sublabelEn: 'App users & laundry client profiles',
      value: (stats?.counts?.total_customers ?? 0).toLocaleString(),
      badgeText: label('عميل مسجل', 'customers'),
      icon: Users,
      color: '#F59E0B',
      bg: 'rgba(245, 158, 11, 0.1)',
    },
    {
      id: 'invoices',
      labelAr: 'فواتير المغاسل اليوم',
      labelEn: "Today's Laundry Invoices",
      sublabelAr: `${stats?.counts?.total_invoices ?? 0} إجمالي كافة الفواتير في النظام`,
      sublabelEn: `${stats?.counts?.total_invoices ?? 0} total invoices recorded`,
      value: (stats?.counts?.today_invoices ?? 0).toLocaleString(),
      badgeText: label('فاتورة اليوم', 'today'),
      icon: FileText,
      color: '#3B82F6',
      bg: 'rgba(59, 130, 246, 0.1)',
    },
  ]

  // Custom Chart Tooltip
  const CustomTooltip = ({ active, payload, label: xLabel }) => {
    if (active && payload?.length) {
      return (
        <div
          style={{
            background: 'var(--bg-card, #ffffff)',
            border: '1px solid var(--border, #e2e8f0)',
            borderRadius: 10,
            padding: '10px 14px',
            fontSize: 13,
            boxShadow: '0 8px 18px rgba(0,0,0,0.1)',
          }}
        >
          <p style={{ fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4 }}>{xLabel}</p>
          {payload.map((p, i) => (
            <p key={i} style={{ color: p.color, margin: '2px 0' }}>
              {p.name}:{' '}
              <strong>
                {p.dataKey === 'revenue'
                  ? formatAmount(p.value, activeCurrencyCode, lang)
                  : p.value}
              </strong>
            </p>
          ))}
        </div>
      )
    }
    return null
  }

  return (
    <div className="animate-fade">
      {/* ─── Page Header ────────────────────────────────────────────── */}
      <div className="page-header" style={{ marginBottom: 20 }}>
        <div>
          <div className="flex items-center gap-8">
            <h1 className="page-title">{label('لوحة المؤشرات', 'Dashboard')}</h1>
            <span
              className="badge"
              style={{
                backgroundColor: error ? 'rgba(239, 68, 68, 0.1)' : 'rgba(16, 185, 129, 0.1)',
                color: error ? '#EF4444' : '#10B981',
                fontWeight: 700,
                fontSize: '0.78rem',
                borderRadius: '8px',
                padding: '4px 10px',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
              }}
            >
              <Database size={13} />
              {error
                ? label('تعذر الاتصال بقاعدة البيانات', 'DB Connection Error')
                : label('بيانات حقيقية متصلة بالخادم', 'Live Backend Connected')}
            </span>
          </div>
          <p className="page-subtitle">
            {label(
              'متابعة عائدات المنصة وأداء المغاسل والفواتير المباشرة من قاعدة البيانات',
              'Real-time platform revenue, laundries performance, and live orders'
            )}
          </p>
        </div>

        {/* Header Controls (Currency Picker + Refresh) */}
        <div className="flex items-center gap-8">
          {/* Main Currency Selector */}
          <CurrencyPicker
            selectedCurrency={selectedCurrency}
            onSelect={handleCurrencyChange}
            showAllOption={true}
          />

          {/* Refresh Button */}
          <button
            className="btn btn-secondary btn-sm"
            onClick={() => fetchStats(selectedCurrency)}
            disabled={loading}
            style={{ borderRadius: '10px', padding: '7px 14px' }}
          >
            <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
            {label('تحديث', 'Refresh')}
          </button>
        </div>
      </div>

      {/* ─── Quick Currency Filter Strip ───────────────────────────── */}
      <div
        className="card mb-20"
        style={{
          padding: '10px 16px',
          borderRadius: '12px',
          backgroundColor: 'var(--bg-card)',
          border: '1px solid var(--border)',
        }}
      >
        <div className="flex items-center gap-8 flex-wrap">
          <span className="fs-xs fw-bold text-muted ml-4" style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
            <Globe size={14} />
            {label('تصنيف العملات:', 'Currency Filter:')}
          </span>

          {/* "All" Button */}
          <button
            className={`btn btn-sm ${selectedCurrency === 'all' ? 'btn-primary' : 'btn-ghost'}`}
            style={{ borderRadius: '20px', padding: '4px 12px', fontSize: '0.8rem' }}
            onClick={() => handleCurrencyChange('all')}
          >
            {label('جميع العملات', 'All')}
          </button>

          {/* Supported Currencies */}
          {SUPPORTED_CURRENCIES.map((c) => {
            const isSelected = selectedCurrency === c.code
            return (
              <button
                key={c.code}
                className={`btn btn-sm ${isSelected ? 'btn-primary' : 'btn-ghost'}`}
                style={{
                  borderRadius: '20px',
                  padding: '4px 12px',
                  fontSize: '0.8rem',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  fontWeight: isSelected ? 700 : 500,
                  boxShadow: isSelected ? '0 2px 6px rgba(99, 102, 241, 0.25)' : 'none',
                }}
                onClick={() => handleCurrencyChange(c.code)}
              >
                <span>{c.flag}</span>
                <span>{c.code}</span>
                <span style={{ opacity: 0.75, fontSize: '0.74rem' }}>({c.symbolAr})</span>
              </button>
            )
          })}
        </div>
      </div>

      {/* ─── Error Alert if Backend Fails ───────────────────────────── */}
      {error && (
        <div className="alert alert-danger mb-20" style={{ borderRadius: '10px' }}>
          <AlertTriangle size={18} />
          <div className="flex-1">
            <strong>{label('خطأ في الاتصال بالـ Backend:', 'Backend Connection Error:')}</strong> {error}
          </div>
          <button className="btn btn-secondary btn-sm" onClick={() => fetchStats(selectedCurrency)}>
            {label('إعادة المحاولة', 'Retry')}
          </button>
        </div>
      )}

      {/* ─── Alerts Banner ──────────────────────────────────────────── */}
      {alerts.length > 0 && (
        <div className="flex flex-col gap-8 mb-20">
          {alerts.map((a, i) => (
            <div key={i} className={`alert alert-${a.type}`} style={{ borderRadius: '10px' }}>
              <AlertTriangle size={16} />
              <span>
                <strong>{a.count}</strong> {label(a.ar, a.en)}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* ─── KPI Cards ──────────────────────────────────────────────── */}
      <div className="grid grid-4 mb-24">
        {kpis.map((kpi) => {
          const Icon = kpi.icon
          return (
            <div key={kpi.id} className="card" style={{ borderRadius: '14px', position: 'relative', overflow: 'hidden' }}>
              <div className="card-body" style={{ padding: '20px' }}>
                <div className="flex items-start justify-between mb-16">
                  <div
                    style={{
                      width: 46,
                      height: 46,
                      borderRadius: 12,
                      background: kpi.bg,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: kpi.color,
                    }}
                  >
                    <Icon size={22} />
                  </div>
                  <span
                    className="badge"
                    style={{
                      fontSize: '0.72rem',
                      fontWeight: 700,
                      backgroundColor: 'var(--bg-secondary)',
                      color: 'var(--text-muted)',
                      borderRadius: '6px',
                      padding: '2px 8px',
                    }}
                  >
                    {kpi.badgeText}
                  </span>
                </div>
                <div
                  className="fs-2xl fw-black mb-4"
                  style={{ color: 'var(--text-primary)', wordBreak: 'break-word', letterSpacing: '-0.3px' }}
                >
                  {loading ? '...' : kpi.value}
                </div>
                <div className="flex flex-col gap-2 mt-8">
                  <div className="fs-sm fw-bold" style={{ color: 'var(--text-primary)' }}>
                    {label(kpi.labelAr, kpi.labelEn)}
                  </div>
                  <div className="fs-xs text-muted">
                    {label(kpi.sublabelAr, kpi.sublabelEn)}
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* ─── Charts Row ─────────────────────────────────────────────── */}
      <div className="grid" style={{ gridTemplateColumns: '2fr 1fr', gap: '20px', marginBottom: 24 }}>
        {/* System Revenue Area Chart */}
        <div className="card" style={{ borderRadius: '14px' }}>
          <div className="card-header flex items-center justify-between">
            <div>
              <h3 className="fs-lg fw-bold flex items-center gap-8">
                {label('عائدات النظام الشهرية من المغاسل', 'Monthly System Revenue from Laundries')}
                <span
                  style={{
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    color: 'var(--primary-500)',
                    background: 'rgba(99, 102, 241, 0.08)',
                    padding: '2px 8px',
                    borderRadius: 6,
                  }}
                >
                  {activeCurrencyMeta.nameAr} ({activeCurrencyMeta.symbolAr})
                </span>
              </h3>
              <p className="fs-xs text-muted mt-4">
                {label(
                  'مجموع العمولات المحصلة من فواتير المغاسل ورسوم الاشتراكات عبر الأشهر',
                  'Total commissions charged from laundry orders plus subscriptions'
                )}
              </p>
            </div>
            <div className="flex gap-6">
              {['month'].map((p) => (
                <button
                  key={p}
                  className="btn btn-sm btn-primary"
                  style={{ borderRadius: '8px', padding: '4px 10px', fontSize: '0.8rem' }}
                >
                  {label('الأشهر الأخيرة', 'Recent Months')}
                </button>
              ))}
            </div>
          </div>
          <div className="card-body">
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={270}>
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--primary-500, #4f46e5)" stopOpacity={0.35} />
                      <stop offset="95%" stopColor="var(--primary-500, #4f46e5)" stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                  <XAxis
                    dataKey="month"
                    tick={{ fontSize: 12, fill: 'var(--text-muted)', fontFamily: 'Cairo' }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 11, fill: 'var(--text-muted)' }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(v) => {
                      if (v >= 1000000) return `${(v / 1000000).toFixed(1)}M`
                      if (v >= 1000) return `${(v / 1000).toFixed(0)}k`
                      return v
                    }}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Area
                    type="monotone"
                    dataKey="revenue"
                    name={label('عائدات النظام', 'System Revenue')}
                    stroke="var(--primary-500, #4f46e5)"
                    strokeWidth={2.5}
                    fill="url(#revGrad)"
                    dot={{ fill: 'var(--primary-500, #4f46e5)', r: 4 }}
                    activeDot={{ r: 6, fill: 'var(--primary-400, #818cf8)' }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="p-32 text-center text-muted fs-sm">
                {loading ? label('جاري تحميل الإحصاءات...', 'Loading stats...') : label('لا توجد بيانات عائدات مسجلة بعد', 'No revenue data recorded yet')}
              </div>
            )}
          </div>
        </div>

        {/* Laundry Status Pie Chart */}
        <div className="card" style={{ borderRadius: '14px' }}>
          <div className="card-header">
            <h3 className="fs-lg fw-bold">{label('حالات المغاسل الفعلية', 'Laundry Status Breakdown')}</h3>
          </div>
          <div className="card-body" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            {statusDistribution.length > 0 ? (
              <>
                <ResponsiveContainer width="100%" height={180}>
                  <PieChart>
                    <Pie
                      data={statusDistribution}
                      cx="50%"
                      cy="50%"
                      innerRadius={55}
                      outerRadius={80}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {statusDistribution.map((entry, index) => (
                        <Cell key={index} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(v, n) => [v, n]} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex flex-col gap-8" style={{ width: '100%', marginTop: 8 }}>
                  {statusDistribution.map((s, i) => (
                    <div key={i} className="flex items-center justify-between">
                      <div className="flex items-center gap-8">
                        <div
                          style={{
                            width: 10,
                            height: 10,
                            borderRadius: '50%',
                            background: s.color,
                            flexShrink: 0,
                          }}
                        />
                        <span className="fs-sm">{s.name}</span>
                      </div>
                      <span className="fw-bold fs-sm">{s.value}</span>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="p-32 text-center text-muted fs-sm">
                {label('لا توجد مغاسل مسجلة بعد', 'No laundries found')}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ─── Bottom Row: Recent Invoices & Subscriptions ───────────── */}
      <div className="grid" style={{ gridTemplateColumns: '2fr 1fr', gap: '20px' }}>
        {/* Recent Invoices */}
        <div className="card" style={{ borderRadius: '14px' }}>
          <div className="card-header flex items-center justify-between">
            <h3 className="fs-lg fw-bold">{label('آخر فواتير المغاسل في النظام', 'Recent Laundry Invoices')}</h3>
            <span className="fs-xs text-muted">
              {label('بيانات مباشرة من سجلات الفواتير', 'Live invoice database')}
            </span>
          </div>
          <div className="table-wrapper" style={{ border: 'none', borderRadius: 0 }}>
            <table>
              <thead>
                <tr>
                  <th>{label('رقم الفاتورة', 'Invoice #')}</th>
                  <th>{label('المغسلة', 'Laundry')}</th>
                  <th>{label('المبلغ', 'Amount')}</th>
                  <th>{label('الحالة', 'Status')}</th>
                </tr>
              </thead>
              <tbody>
                {recentInvoices.map((inv, i) => (
                  <tr key={i}>
                    <td className="fw-bold">#{inv.invoice_number}</td>
                    <td>{inv.laundry_name}</td>
                    <td className="fw-bold" style={{ color: '#10B981' }}>
                      {inv.amountFormatted}
                    </td>
                    <td>
                      <span
                        className={`badge ${
                          inv.status === 'completed'
                            ? 'badge-success'
                            : inv.status === 'pending'
                            ? 'badge-warning'
                            : 'badge-neutral'
                        }`}
                        style={{ borderRadius: '6px', fontSize: '0.74rem' }}
                      >
                        {inv.status === 'completed'
                          ? label('مكتملة', 'Completed')
                          : inv.status === 'pending'
                          ? label('معلقة', 'Pending')
                          : label('قيد التنفيذ', 'In Progress')}
                      </span>
                    </td>
                  </tr>
                ))}
                {recentInvoices.length === 0 && !loading && (
                  <tr>
                    <td colSpan="4" className="text-center py-24 text-muted">
                      {label('لا توجد فواتير مسجلة في النظام حالياً', 'No invoices found in database')}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Subscriptions Bar Chart */}
        <div className="card" style={{ borderRadius: '14px' }}>
          <div className="card-header">
            <h3 className="fs-lg fw-bold">{label('اشتراكات المغاسل بالباقات', 'Laundry Subscriptions')}</h3>
          </div>
          <div className="card-body">
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={chartData} barSize={26}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                  <XAxis
                    dataKey="month"
                    tick={{ fontSize: 11, fill: 'var(--text-muted)', fontFamily: 'Cairo' }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis tick={{ fontSize: 11, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar
                    dataKey="subscriptions"
                    name={label('الاشتراكات النشطة', 'Subscriptions')}
                    fill="var(--primary-500, #4f46e5)"
                    radius={[6, 6, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="p-32 text-center text-muted fs-sm">
                {label('لا توجد اشتراكات مسجلة بعد', 'No subscriptions recorded')}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
