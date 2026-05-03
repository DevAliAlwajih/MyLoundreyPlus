import { useState } from 'react'
import { useTheme } from '../App'
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
  const label = (ar, en) => lang === 'ar' ? ar : en

  return (
    <div className="animate-fade">
      {/* Page Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">{label('لوحة المؤشرات', 'Dashboard')}</h1>
          <p className="page-subtitle">{label('نظرة عامة على أداء النظام', 'System performance overview')}</p>
        </div>
        <div className="flex gap-8">
          <div className="flex items-center gap-4 fs-sm text-muted">
            <Calendar size={16} />
            <span>{label('آخر تحديث: الآن', 'Last updated: now')}</span>
          </div>
          <button className="btn btn-secondary btn-sm">
            <RefreshCw size={15} />
            {label('تحديث', 'Refresh')}
          </button>
          <button className="btn btn-primary btn-sm">
            <Download size={15} />
            {label('تصدير', 'Export')}
          </button>
        </div>
      </div>

      {/* Alerts */}
      <div className="flex flex-col gap-8 mb-24">
        {ALERTS.map((a, i) => (
          <div key={i} className={`alert alert-${a.type}`}>
            <AlertTriangle size={16} />
            {label(a.msgAr, a.msgEn)}
          </div>
        ))}
      </div>

      {/* KPI Cards */}
      <div className="grid grid-4 mb-24">
        {KPIS.map(kpi => {
          const Icon = kpi.icon
          return (
            <div key={kpi.id} className="card">
              <div className="card-body" style={{ padding: '20px' }}>
                <div className="flex items-start justify-between mb-16">
                  <div style={{ width: 48, height: 48, borderRadius: 12, background: kpi.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', color: kpi.color }}>
                    <Icon size={22} />
                  </div>
                  <span className={`badge ${kpi.up ? 'badge-success' : 'badge-danger'}`}>
                    {kpi.up ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
                    {kpi.up ? '+' : ''}{label(kpi.changeAr, kpi.changeEn).split(' ')[0]}
                  </span>
                </div>
                <div className="fs-2xl fw-black mb-4" style={{ color: 'var(--text-primary)' }}>
                  {label(kpi.valueAr, kpi.valueEn)}
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
              <AreaChart data={REVENUE_DATA}>
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
                <Pie data={STATUS_DATA} cx="50%" cy="50%" innerRadius={55} outerRadius={80} paddingAngle={3} dataKey="value">
                  {STATUS_DATA.map((entry, index) => (
                    <Cell key={index} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(v, n) => [v, n]} />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex flex-col gap-8" style={{ width: '100%', marginTop: 8 }}>
              {STATUS_DATA.map((s, i) => (
                <div key={i} className="flex items-center justify-between">
                  <div className="flex items-center gap-8">
                    <div style={{ width: 10, height: 10, borderRadius: '50%', background: s.color, flexShrink: 0 }} />
                    <span className="fs-sm">{label(s.name, s.name)}</span>
                  </div>
                  <span className="fw-bold fs-sm">{s.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Row */}
      <div className="grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
        {/* Top Laundries */}
        <div className="card">
          <div className="card-header">
            <h3 className="fs-lg fw-bold">{label('أكثر المغاسل نشاطاً', 'Most Active Laundries')}</h3>
            <span className="badge badge-primary">{label('هذا الشهر', 'This Month')}</span>
          </div>
          <div className="table-wrapper" style={{ border: 'none', borderRadius: 0 }}>
            <table>
              <thead>
                <tr>
                  <th>#</th>
                  <th>{label('المغسلة', 'Laundry')}</th>
                  <th>{label('الطلبات', 'Orders')}</th>
                  <th>{label('الإيراد', 'Revenue')}</th>
                  <th>{label('التقييم', 'Rating')}</th>
                </tr>
              </thead>
              <tbody>
                {TOP_LAUNDRIES.map((l, i) => (
                  <tr key={i}>
                    <td className="text-muted fw-bold">{i + 1}</td>
                    <td>
                      <div className="flex items-center gap-8">
                        <div className="avatar-placeholder" style={{ width: 32, height: 32, fontSize: '0.75rem', borderRadius: 8 }}>
                          {l.name[7]}
                        </div>
                        <div>
                          <div className="fw-semi fs-sm">{l.name}</div>
                          <span className={`badge badge-${l.status === 'active' ? 'success' : 'warning'}`} style={{ fontSize: '0.65rem', padding: '1px 6px' }}>
                            {label(l.status === 'active' ? 'نشط' : 'تجريبي', l.status)}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="fw-semi">{l.orders}</td>
                    <td className="fw-semi text-success">{l.revenue.toLocaleString()}</td>
                    <td>
                      <div className="flex items-center gap-4">
                        <Star size={13} fill="var(--gold)" color="var(--gold)" />
                        <span className="fw-bold fs-sm">{l.rating}</span>
                      </div>
                    </td>
                  </tr>
                ))}
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
              <BarChart data={REVENUE_DATA} barSize={28}>
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
