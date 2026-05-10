import { useState, useEffect } from 'react'
import { useTheme } from '../App'
import api from '../services/api'
import {
  TrendingUp, Store, Users, FileText, ArrowUpRight,
  ArrowDownRight, Calendar, Download, RefreshCw,
  DollarSign, Activity, Star, AlertTriangle
} from 'lucide-react'
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend
} from 'recharts'

// ---- Mock Data ----
const REVENUE_DATA = [
  { month: 'يناير', revenue: 48000, subscriptions: 32 },
  { month: 'فبراير', revenue: 52000, subscriptions: 38 },
  { month: 'مارس', revenue: 61000, subscriptions: 45 },
  { month: 'أبريل', revenue: 55000, subscriptions: 41 },
  { month: 'مايو', revenue: 73000, subscriptions: 56 },
  { month: 'يونيو', revenue: 85000, subscriptions: 63 },
  { month: 'يوليو', revenue: 91000, subscriptions: 70 },
]

const TOP_LAUNDRIES = [
  { name: 'مغسلة النور', orders: 342, revenue: 12400, rating: 4.8, status: 'active' },
  { name: 'مغسلة الربيع', orders: 298, revenue: 10200, rating: 4.6, status: 'active' },
  { name: 'مغسلة السلام', orders: 256, revenue: 9800, rating: 4.5, status: 'active' },
  { name: 'مغسلة المدينة', orders: 201, revenue: 7600, rating: 4.2, status: 'trial' },
  { name: 'مغسلة الأمل', orders: 178, revenue: 6900, rating: 4.0, status: 'active' },
]

const STATUS_DATA = [
  { name: 'نشط', value: 142, color: '#10B981' },
  { name: 'تجريبي', value: 28,  color: '#F59E0B' },
  { name: 'منتهي', value: 15,  color: '#EF4444' },
  { name: 'بانتظار', value: 9,  color: '#3B82F6' },
]

const KPIS = [
  {
    id: 'revenue',
    labelAr: 'إجمالي الإيرادات',
    labelEn: 'Total Revenue',
    valueAr: '91,500 ريال',
    valueEn: 'SAR 91,500',
    changeAr: '+18.4% هذا الشهر',
    changeEn: '+18.4% this month',
    icon: DollarSign,
    color: 'var(--primary-500)',
    bg: 'var(--primary-50)',
    up: true,
  },
  {
    id: 'laundries',
    labelAr: 'المغاسل النشطة',
    labelEn: 'Active Laundries',
    valueAr: '142',
    valueEn: '142',
    changeAr: '+12 هذا الشهر',
    changeEn: '+12 this month',
    icon: Store,
    color: 'var(--success)',
    bg: 'var(--success-bg)',
    up: true,
  },
  {
    id: 'customers',
    labelAr: 'إجمالي العملاء',
    labelEn: 'Total Customers',
    valueAr: '8,432',
    valueEn: '8,432',
    changeAr: '+234 هذا الأسبوع',
    changeEn: '+234 this week',
    icon: Users,
    color: 'var(--gold)',
    bg: 'var(--gold-light)',
    up: true,
  },
  {
    id: 'invoices',
    labelAr: 'الفواتير اليوم',
    labelEn: 'Today\'s Invoices',
    valueAr: '1,284',
    valueEn: '1,284',
    changeAr: '-3.2% مقارنة بالأمس',
    changeEn: '-3.2% vs yesterday',
    icon: FileText,
    color: 'var(--info)',
    bg: 'var(--info-bg)',
    up: false,
  },
]

const ALERTS = [
  { type: 'warning', msgAr: '15 مغسلة ستنتهي اشتراكاتها خلال 7 أيام', msgEn: '15 laundries expiring in 7 days' },
  { type: 'info',    msgAr: '9 مغاسل بانتظار التفعيل', msgEn: '9 laundries awaiting activation' },
  { type: 'danger',  msgAr: '3 تذاكر دعم فني عاجلة', msgEn: '3 urgent support tickets' },
]

// Custom Tooltip
const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload?.length) {
    return (
      <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 10, padding: '10px 14px', fontSize: 13 }}>
        <p style={{ fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4 }}>{label}</p>
        {payload.map((p, i) => (
          <p key={i} style={{ color: p.color }}>
            {p.name}: <strong>{typeof p.value === 'number' && p.value > 1000 ? p.value.toLocaleString() + ' ريال' : p.value}</strong>
          </p>
        ))}
      </div>
    )
  }
  return null
}

export default function DashboardPage() {
  const { lang } = useTheme()
  const [period, setPeriod] = useState('month')
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const label = (ar, en) => lang === 'ar' ? ar : en

  useEffect(() => {
    fetchStats()
  }, [])

  const fetchStats = async () => {
    setLoading(true)
    try {
      const res = await api.get('/admin/dashboard-stats')
      setStats(res.data.data)
    } catch (err) {
      console.error('Failed to fetch dashboard stats', err)
    } finally {
      setLoading(false)
    }
  }

  const kpis = [
    {
      id: 'revenue',
      labelAr: 'إجمالي الإيرادات',
      labelEn: 'Total Revenue',
      valueAr: `${stats?.revenue || 0} ريال`,
      valueEn: `SAR ${stats?.revenue || 0}`,
      icon: DollarSign,
      color: 'var(--primary-500)',
      bg: 'var(--primary-50)',
      up: true,
      change: '+0%'
    },
    {
      id: 'laundries',
      labelAr: 'المغاسل النشطة',
      labelEn: 'Active Laundries',
      valueAr: stats?.counts?.active_laundries || '0',
      valueEn: stats?.counts?.active_laundries || '0',
      icon: Store,
      color: 'var(--success)',
      bg: 'var(--success-bg)',
      up: true,
      change: '+0'
    },
    {
      id: 'customers',
      labelAr: 'إجمالي العملاء',
      labelEn: 'Total Customers',
      valueAr: stats?.counts?.total_customers || '0',
      valueEn: stats?.counts?.total_customers || '0',
      icon: Users,
      color: 'var(--gold)',
      bg: 'var(--gold-light)',
      up: true,
      change: '+0'
    },
    {
      id: 'invoices',
      labelAr: 'فواتير اليوم',
      labelEn: 'Today\'s Invoices',
      valueAr: stats?.counts?.today_invoices || '0',
      valueEn: stats?.counts?.today_invoices || '0',
      icon: FileText,
      color: 'var(--info)',
      bg: 'var(--info-bg)',
      up: false,
      change: '0'
    },
  ]

  const statusDistribution = stats?.laundryStatusDistribution?.map(s => ({
    name: label(
      s.status === 'active' ? 'نشط' : s.status === 'trial' ? 'تجريبي' : s.status === 'pending' ? 'بانتظار' : 'آخر',
      s.status
    ),
    value: parseInt(s.count),
    color: s.status === 'active' ? '#10B981' : s.status === 'trial' ? '#F59E0B' : '#3B82F6'
  })) || []

  const recentInvoices = stats?.recentInvoices || []

  // Dynamic Alerts
  const alerts = [
    { type: 'warning', count: stats?.alerts?.expiring_soon, ar: 'مغسلة ستنتهي اشتراكاتها خلال 7 أيام', en: 'laundries expiring in 7 days' },
    { type: 'info',    count: stats?.alerts?.pending_laundries, ar: 'مغاسل بانتظار التفعيل', en: 'laundries awaiting activation' },
    { type: 'danger',  count: stats?.alerts?.open_tickets, ar: 'تذاكر دعم فني عاجلة', en: 'urgent support tickets' },
  ].filter(a => a.count > 0)

  // Dynamic Chart Data
  const chartData = stats?.chartData?.map(c => ({
    month: label(c.month, c.month),
    revenue: parseFloat(c.revenue) || 0,
    subscriptions: parseInt(c.subscriptions) || 0
  })) || []

  return (
    <div className="animate-fade">
      {/* Page Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">{label('لوحة المؤشرات', 'Dashboard')}</h1>
          <p className="page-subtitle">{label('نظرة عامة على أداء النظام', 'System performance overview')}</p>
        </div>
        <div className="flex gap-8">
          <button className="btn btn-secondary btn-sm" onClick={fetchStats}>
            <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
            {label('تحديث', 'Refresh')}
          </button>
        </div>
      </div>

      {/* Alerts */}
      <div className="flex flex-col gap-8 mb-24">
        {alerts.map((a, i) => (
          <div key={i} className={`alert alert-${a.type}`}>
            <AlertTriangle size={16} />
            {a.count} {label(a.ar, a.en)}
          </div>
        ))}
      </div>

      {/* KPI Cards */}
      <div className="grid grid-4 mb-24">
        {kpis.map(kpi => {
          const Icon = kpi.icon
          return (
            <div key={kpi.id} className="card">
              <div className="card-body" style={{ padding: '20px' }}>
                <div className="flex items-start justify-between mb-16">
                  <div style={{ width: 48, height: 48, borderRadius: 12, background: kpi.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', color: kpi.color }}>
                    <Icon size={22} />
                  </div>
                </div>
                <div className="fs-2xl fw-black mb-4" style={{ color: 'var(--text-primary)' }}>
                  {loading ? '...' : label(kpi.valueAr, kpi.valueEn)}
                </div>
                <div className="fs-sm text-muted">{label(kpi.labelAr, kpi.labelEn)}</div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Charts Row */}
      <div className="grid" style={{ gridTemplateColumns: '2fr 1fr', marginBottom: 24 }}>
        {/* Revenue Chart */}
        <div className="card">
          <div className="card-header">
            <div>
              <h3 className="fs-lg fw-bold">{label('الإيرادات الشهرية', 'Monthly Revenue')}</h3>
              <p className="fs-xs text-muted mt-4">{label('إجمالي الإيرادات من اشتراكات المغاسل', 'Total revenue from laundry subscriptions')}</p>
            </div>
            <div className="flex gap-8">
              {['week', 'month', 'year'].map(p => (
                <button
                  key={p}
                  className={`btn btn-sm ${period === p ? 'btn-primary' : 'btn-secondary'}`}
                  onClick={() => setPeriod(p)}
                >
                  {p === 'week' ? label('أسبوع', 'Week') : p === 'month' ? label('شهر', 'Month') : label('سنة', 'Year')}
                </button>
              ))}
            </div>
          </div>
          <div className="card-body">
            <ResponsiveContainer width="100%" height={260}>
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="var(--primary-500)" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="var(--primary-500)" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis dataKey="month" tick={{ fontSize: 12, fill: 'var(--text-muted)', fontFamily: 'Cairo' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} tickFormatter={v => v >= 1000 ? `${v/1000}k` : v} />
                <Tooltip content={<CustomTooltip />} />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  name={label('الإيرادات', 'Revenue')}
                  stroke="var(--primary-500)"
                  strokeWidth={2.5}
                  fill="url(#revGrad)"
                  dot={{ fill: 'var(--primary-500)', r: 4 }}
                  activeDot={{ r: 6, fill: 'var(--primary-400)' }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Pie Chart */}
        <div className="card">
          <div className="card-header">
            <h3 className="fs-lg fw-bold">{label('حالات المغاسل', 'Laundry Status')}</h3>
          </div>
          <div className="card-body" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <ResponsiveContainer width="100%" height={180}>
              <PieChart>
                <Pie data={statusDistribution} cx="50%" cy="50%" innerRadius={55} outerRadius={80} paddingAngle={3} dataKey="value">
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
                    <div style={{ width: 10, height: 10, borderRadius: '50%', background: s.color, flexShrink: 0 }} />
                    <span className="fs-sm">{s.name}</span>
                  </div>
                  <span className="fw-bold fs-sm">{s.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Row */}
      <div className="grid" style={{ gridTemplateColumns: '2fr 1fr' }}>
        {/* Recent Invoices */}
        <div className="card">
          <div className="card-header">
            <h3 className="fs-lg fw-bold">{label('آخر الفواتير في النظام', 'Recent System Invoices')}</h3>
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
                    <td className="fw-semi text-success">{inv.total_amount} ريال</td>
                    <td>
                      <span className={`badge badge-neutral`}>{inv.status}</span>
                    </td>
                  </tr>
                ))}
                {recentInvoices.length === 0 && !loading && (
                  <tr><td colSpan="4" className="text-center py-20 text-muted">{label('لا توجد فواتير اليوم', 'No invoices today')}</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Subscriptions Bar */}
        <div className="card">
          <div className="card-header">
            <h3 className="fs-lg fw-bold">{label('الاشتراكات الجديدة', 'New Subscriptions')}</h3>
          </div>
          <div className="card-body">
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={chartData} barSize={28}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: 'var(--text-muted)', fontFamily: 'Cairo' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Bar
                  dataKey="subscriptions"
                  name={label('الاشتراكات', 'Subscriptions')}
                  fill="var(--primary-500)"
                  radius={[6, 6, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  )
}
