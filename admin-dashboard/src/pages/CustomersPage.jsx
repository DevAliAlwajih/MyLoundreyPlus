import { useState } from 'react'
import { useTheme } from '../App'
import {
  Search, Plus, Users, QrCode, Smartphone, Tablet, Phone,
  CheckCircle, XCircle, Eye, Edit, Trash2, ShieldOff, Shield,
  AlertTriangle, Lock, UserCheck
} from 'lucide-react'

const CUSTOMERS = [
  { id: 1, name: 'أحمد محمد السالم', phone: '+966511111111', uniqueId: 'CUS0000001', country: 'SA', currency: 'SAR', joined: '2024-08-15', invoices: 24, debt: 0, active: true,
    devices: [
      { type: 'phone', os: 'iOS 17', model: 'iPhone 15', lastLogin: 'منذ ساعة', active: true, isPrimary: true },
      { type: 'tablet', os: 'iPadOS 17', model: 'iPad Pro', lastLogin: 'منذ يومين', active: true, isPrimary: false },
    ]
  },
  { id: 2, name: 'فاطمة عبدالله الزهراني', phone: '+966522222222', uniqueId: 'CUS0000002', country: 'SA', currency: 'SAR', joined: '2024-09-01', invoices: 18, debt: 75, active: true,
    devices: [
      { type: 'phone', os: 'Android 14', model: 'Samsung S24', lastLogin: 'منذ 30 دقيقة', active: true, isPrimary: true },
    ]
  },
  { id: 3, name: 'محمد خالد العتيبي', phone: '+966533333333', uniqueId: 'CUS0000003', country: 'SA', currency: 'SAR', joined: '2024-10-12', invoices: 9, debt: 150, active: true,
    devices: [
      { type: 'phone', os: 'Android 13', model: 'Pixel 8', lastLogin: 'منذ 3 أيام', active: true, isPrimary: true },
      { type: 'phone', os: 'iOS 16', model: 'iPhone 13', lastLogin: 'منذ أسبوع', active: false, isPrimary: false },
    ]
  },
  { id: 4, name: 'سارة نايف القحطاني', phone: '+966544444444', uniqueId: 'CUS0000004', country: 'YE', currency: 'YER', joined: '2024-11-05', invoices: 5, debt: 0, active: false,
    devices: []
  },
]

export default function CustomersPage() {
  const { lang } = useTheme()
  const label = (ar, en) => lang === 'ar' ? ar : en

  const [search, setSearch] = useState('')
  const [selectedCustomer, setSelectedCustomer] = useState(null)
  const [showDevicesModal, setShowDevicesModal] = useState(false)
  const [showDetailModal, setShowDetailModal] = useState(false)

  const filtered = CUSTOMERS.filter(c =>
    c.name.includes(search) || c.phone.includes(search) || c.uniqueId.includes(search)
  )

  return (
    <div className="animate-fade">
      <div className="page-header">
        <div>
          <h1 className="page-title">{label('إدارة العملاء', 'Customers Management')}</h1>
          <p className="page-subtitle">{label(`${CUSTOMERS.length} عميل مسجل`, `${CUSTOMERS.length} registered customers`)}</p>
        </div>
        <button className="btn btn-primary">
          <Plus size={16} /> {label('إضافة عميل', 'Add Customer')}
        </button>
      </div>

      {/* Search */}
      <div className="card mb-20">
        <div className="card-body" style={{ padding: '16px 20px' }}>
          <div className="search-bar" style={{ maxWidth: 400 }}>
            <Search size={16} className="search-icon" />
            <input
              placeholder={label('بحث بالاسم أو الهاتف أو المعرف...', 'Search by name, phone or ID...')}
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="card">
        <div className="table-wrapper" style={{ border: 'none', borderRadius: 'var(--radius-lg)' }}>
          <table>
            <thead>
              <tr>
                <th>{label('العميل', 'Customer')}</th>
                <th>{label('المعرف الفريد', 'Unique ID')}</th>
                <th>{label('البلد', 'Country')}</th>
                <th>{label('الفواتير', 'Invoices')}</th>
                <th>{label('الديون', 'Debt')}</th>
                <th>{label('الأجهزة', 'Devices')}</th>
                <th>{label('الحالة', 'Status')}</th>
                <th>{label('الإجراءات', 'Actions')}</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(c => (
                <tr key={c.id}>
                  <td>
                    <div className="flex items-center gap-10">
                      <div className="avatar-placeholder" style={{ width: 38, height: 38, borderRadius: 10, fontSize: '0.85rem' }}>
                        {c.name[0]}
                      </div>
                      <div>
                        <div className="fw-semi">{c.name}</div>
                        <div className="fs-xs text-muted flex items-center gap-4">
                          <Phone size={11} /> {c.phone}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <div className="flex items-center gap-6">
                      <code style={{ fontSize: '0.8rem', background: 'var(--gray-100)', padding: '2px 8px', borderRadius: 6 }}>{c.uniqueId}</code>
                      <QrCode size={14} className="text-muted" style={{ cursor: 'pointer' }} />
                    </div>
                  </td>
                  <td>
                    <div className="flex items-center gap-6">
                      <span className="fw-semi fs-sm">{c.country}</span>
                      <span className="badge badge-neutral fs-xs">{c.currency}</span>
                    </div>
                  </td>
                  <td className="fw-bold">{c.invoices}</td>
                  <td>
                    {c.debt > 0
                      ? <span className="badge badge-danger">{c.debt} {c.currency}</span>
                      : <span className="badge badge-success">{label('لا ديون', 'No debt')}</span>
                    }
                  </td>
                  <td>
                    <button
                      className="btn btn-ghost btn-sm flex items-center gap-4"
                      onClick={() => { setSelectedCustomer(c); setShowDevicesModal(true) }}
                    >
                      <Smartphone size={14} />
                      <span className="fw-bold">{c.devices.length}</span>
                    </button>
                  </td>
                  <td>
                    <div className="flex items-center gap-6">
                      <span className={`status-dot ${c.active ? 'active' : 'inactive'}`} />
                      <span className="fs-sm">{c.active ? label('نشط', 'Active') : label('موقوف', 'Suspended')}</span>
                    </div>
                  </td>
                  <td>
                    <div className="flex items-center gap-4">
                      <button className="btn btn-ghost btn-icon btn-sm" onClick={() => { setSelectedCustomer(c); setShowDetailModal(true) }}>
                        <Eye size={15} />
                      </button>
                      <button className="btn btn-ghost btn-icon btn-sm"><Edit size={15} /></button>
                      <button className="btn btn-ghost btn-icon btn-sm" style={{ color: c.active ? 'var(--warning)' : 'var(--success)' }}>
                        {c.active ? <ShieldOff size={15} /> : <Shield size={15} />}
                      </button>
                      <button className="btn btn-ghost btn-icon btn-sm" style={{ color: 'var(--danger)' }}>
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Devices Modal */}
      {showDevicesModal && selectedCustomer && (
        <div className="modal-overlay" onClick={() => setShowDevicesModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <h3 className="fw-bold">{label('إدارة الأجهزة', 'Device Management')}</h3>
                <p className="fs-sm text-muted">{selectedCustomer.name}</p>
              </div>
              <button className="btn btn-ghost btn-icon" onClick={() => setShowDevicesModal(false)}>✕</button>
            </div>
            <div className="modal-body">
              {selectedCustomer.devices.length === 0 ? (
                <div className="empty-state" style={{ padding: 32 }}>
                  <Smartphone size={32} color="var(--text-muted)" />
                  <p className="text-muted">{label('لا توجد أجهزة مسجلة', 'No registered devices')}</p>
                </div>
              ) : (
                <div className="flex flex-col gap-12">
                  {selectedCustomer.devices.map((d, i) => (
                    <div key={i} className="card" style={{ boxShadow: 'none', border: '1.5px solid var(--border)' }}>
                      <div className="card-body" style={{ padding: '14px 16px' }}>
                        <div className="flex items-center justify-between flex-wrap gap-12">
                          <div className="flex items-center gap-12">
                            <div style={{ width: 44, height: 44, borderRadius: 10, background: 'var(--primary-50)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary-500)', position: 'relative' }}>
                              {d.type === 'tablet' ? <Tablet size={20} /> : <Smartphone size={20} />}
                              {d.isPrimary && (
                                <div style={{ position: 'absolute', top: -4, right: -4, width: 16, height: 16, borderRadius: '50%', background: 'var(--gold)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                  <span style={{ fontSize: '0.5rem', color: 'white', fontWeight: 900 }}>★</span>
                                </div>
                              )}
                            </div>
                            <div>
                              <div className="flex items-center gap-6">
                                <span className="fw-semi fs-sm">{d.model}</span>
                                {d.isPrimary && <span className="badge badge-gold" style={{ fontSize: '0.65rem' }}>{label('افتراضي', 'Primary')}</span>}
                              </div>
                              <div className="fs-xs text-muted">{d.os}</div>
                              <div className="fs-xs text-muted">{label(`آخر دخول: ${d.lastLogin}`, `Last login: ${d.lastLogin}`)}</div>
                            </div>
                          </div>
                          <div className="flex items-center gap-8 flex-wrap">
                            {!d.isPrimary && (
                              <button className="btn btn-secondary btn-sm">
                                {label('تعيين افتراضي', 'Set as Primary')}
                              </button>
                            )}
                            <button className={`btn btn-sm ${d.active ? 'btn-danger' : 'btn-success'}`}>
                              {d.active ? label('إلغاء التفعيل', 'Deactivate') : label('تفعيل', 'Activate')}
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowDevicesModal(false)}>{label('إغلاق', 'Close')}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
