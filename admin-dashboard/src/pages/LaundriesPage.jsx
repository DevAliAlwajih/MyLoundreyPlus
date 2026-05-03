import { useState } from 'react'
import { useTheme } from '../App'
import {
  Search, Plus, Filter, MoreVertical, Store, MapPin, Star,
  CheckCircle, XCircle, Clock, Ban, Eye, Edit, Trash2,
  Smartphone, Tablet, Shield, Phone, Calendar
} from 'lucide-react'

const LAUNDRIES = [
  { id: 1, name: 'مغسلة النور', owner: 'أحمد العتيبي', phone: '+966501234567', city: 'الرياض', status: 'active', plan: 'yearly', rating: 4.8, orders: 342, expiry: '2025-12-31', devices: [{ type: 'phone', os: 'iOS 17', last: 'منذ ساعة', active: true }, { type: 'tablet', os: 'iPadOS 17', last: 'منذ يوم', active: true }] },
  { id: 2, name: 'مغسلة الربيع', owner: 'سالم القحطاني', phone: '+966507654321', city: 'جدة', status: 'active', plan: 'monthly', rating: 4.6, orders: 298, expiry: '2025-02-15', devices: [{ type: 'phone', os: 'Android 14', last: 'منذ 3 ساعات', active: true }] },
  { id: 3, name: 'مغسلة البدر', owner: 'محمد الزهراني', phone: '+966509876543', city: 'الدمام', status: 'trial', plan: 'trial', rating: 4.1, orders: 67, expiry: '2025-02-01', devices: [{ type: 'phone', os: 'Android 13', last: 'منذ 5 دقائق', active: true }] },
  { id: 4, name: 'مغسلة الأمين', owner: 'خالد السهلي', phone: '+966502345678', city: 'مكة', status: 'suspended', plan: 'monthly', rating: 3.9, orders: 156, expiry: '2025-01-01', devices: [] },
  { id: 5, name: 'مغسلة الفجر', owner: 'عمر الغامدي', phone: '+966508765432', city: 'المدينة', status: 'pending', plan: 'trial', rating: 0, orders: 0, expiry: '2025-01-28', devices: [{ type: 'phone', os: 'iOS 16', last: 'منذ 10 دقائق', active: false }] },
  { id: 6, name: 'مغسلة الوفاء', owner: 'فهد الشمري', phone: '+966503456789', city: 'تبوك', status: 'banned', plan: 'monthly', rating: 2.1, orders: 45, expiry: '2024-12-01', devices: [] },
]

const STATUS_MAP = {
  active:    { labelAr: 'نشط',          labelEn: 'Active',    badge: 'success' },
  trial:     { labelAr: 'تجريبي',       labelEn: 'Trial',     badge: 'info' },
  suspended: { labelAr: 'موقوف',        labelEn: 'Suspended', badge: 'warning' },
  pending:   { labelAr: 'بانتظار التفعيل', labelEn: 'Pending', badge: 'neutral' },
  banned:    { labelAr: 'محظور',        labelEn: 'Banned',    badge: 'danger' },
}

const PLAN_MAP = {
  trial:   { labelAr: 'تجريبي', labelEn: 'Trial',   badge: 'info' },
  monthly: { labelAr: 'شهري',   labelEn: 'Monthly', badge: 'primary' },
  yearly:  { labelAr: 'سنوي',   labelEn: 'Yearly',  badge: 'gold' },
}

export default function LaundriesPage() {
  const { lang } = useTheme()
  const label = (ar, en) => lang === 'ar' ? ar : en

  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [selectedLaundry, setSelectedLaundry] = useState(null)
  const [showModal, setShowModal] = useState(false)
  const [showDevicesModal, setShowDevicesModal] = useState(false)
  const [activeMenu, setActiveMenu] = useState(null)

  const filtered = LAUNDRIES.filter(l => {
    const matchSearch = l.name.includes(search) || l.owner.includes(search) || l.city.includes(search)
    const matchStatus = filterStatus === 'all' || l.status === filterStatus
    return matchSearch && matchStatus
  })

  const openDetails = (l) => { setSelectedLaundry(l); setShowModal(true) }
  const openDevices = (l) => { setSelectedLaundry(l); setShowDevicesModal(true) }

  return (
    <div className="animate-fade">
      {/* Page Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">{label('إدارة المغاسل', 'Laundries Management')}</h1>
          <p className="page-subtitle">{label(`${LAUNDRIES.length} مغسلة مسجلة في النظام`, `${LAUNDRIES.length} registered laundries`)}</p>
        </div>
        <div className="flex gap-8">
          <button className="btn btn-primary" onClick={() => { setSelectedLaundry(null); setShowModal(true) }}>
            <Plus size={16} />
            {label('إضافة مغسلة', 'Add Laundry')}
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="card mb-20">
        <div className="card-body" style={{ padding: '16px 20px' }}>
          <div className="flex items-center gap-12 flex-wrap">
            <div className="search-bar flex-1" style={{ minWidth: 240 }}>
              <Search size={16} className="search-icon" />
              <input
                placeholder={label('بحث بالاسم أو المالك أو المدينة...', 'Search by name, owner or city...')}
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
            <div className="flex gap-4">
              {['all', 'active', 'trial', 'pending', 'suspended', 'banned'].map(s => (
                <button
                  key={s}
                  className={`btn btn-sm ${filterStatus === s ? 'btn-primary' : 'btn-secondary'}`}
                  onClick={() => setFilterStatus(s)}
                >
                  {s === 'all' ? label('الكل', 'All') : label(STATUS_MAP[s]?.labelAr, STATUS_MAP[s]?.labelEn)}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="card">
        <div className="table-wrapper" style={{ border: 'none', borderRadius: 'var(--radius-lg)' }}>
          <table>
            <thead>
              <tr>
                <th>{label('المغسلة', 'Laundry')}</th>
                <th>{label('المالك', 'Owner')}</th>
                <th>{label('المدينة', 'City')}</th>
                <th>{label('الحالة', 'Status')}</th>
                <th>{label('الخطة', 'Plan')}</th>
                <th>{label('التقييم', 'Rating')}</th>
                <th>{label('الطلبات', 'Orders')}</th>
                <th>{label('الأجهزة', 'Devices')}</th>
                <th>{label('انتهاء الاشتراك', 'Expiry')}</th>
                <th>{label('الإجراءات', 'Actions')}</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(l => (
                <tr key={l.id}>
                  <td>
                    <div className="flex items-center gap-10">
                      <div className="avatar-placeholder" style={{ width: 38, height: 38, borderRadius: 10, fontSize: '0.85rem' }}>
                        {l.name[4]}
                      </div>
                      <div>
                        <div className="fw-semi">{l.name}</div>
                        <div className="fs-xs text-muted flex items-center gap-4">
                          <Phone size={11} /> {l.phone}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="fs-sm">{l.owner}</td>
                  <td>
                    <div className="flex items-center gap-4 fs-sm text-muted">
                      <MapPin size={13} /> {l.city}
                    </div>
                  </td>
                  <td>
                    <span className={`badge badge-${STATUS_MAP[l.status].badge}`}>
                      {label(STATUS_MAP[l.status].labelAr, STATUS_MAP[l.status].labelEn)}
                    </span>
                  </td>
                  <td>
                    <span className={`badge badge-${PLAN_MAP[l.plan].badge}`}>
                      {label(PLAN_MAP[l.plan].labelAr, PLAN_MAP[l.plan].labelEn)}
                    </span>
                  </td>
                  <td>
                    {l.rating > 0 ? (
                      <div className="flex items-center gap-4">
                        <Star size={13} fill="var(--gold)" color="var(--gold)" />
                        <span className="fw-bold fs-sm">{l.rating}</span>
                      </div>
                    ) : <span className="text-muted fs-sm">—</span>}
                  </td>
                  <td className="fw-semi">{l.orders}</td>
                  <td>
                    <button
                      className="btn btn-ghost btn-sm flex items-center gap-4"
                      onClick={() => openDevices(l)}
                    >
                      <Smartphone size={14} />
                      <span className="fw-bold">{l.devices.length}</span>
                    </button>
                  </td>
                  <td>
                    <div className="flex items-center gap-4 fs-sm">
                      <Calendar size={13} className="text-muted" />
                      <span className={new Date(l.expiry) < new Date() ? 'text-danger' : 'text-muted'}>
                        {l.expiry}
                      </span>
                    </div>
                  </td>
                  <td>
                    <div className="flex items-center gap-4">
                      <button className="btn btn-ghost btn-icon btn-sm" onClick={() => openDetails(l)} data-tooltip={label('عرض', 'View')}>
                        <Eye size={15} />
                      </button>
                      <button className="btn btn-ghost btn-icon btn-sm" data-tooltip={label('تعديل', 'Edit')}>
                        <Edit size={15} />
                      </button>
                      {l.status === 'active' ? (
                        <button className="btn btn-ghost btn-icon btn-sm" style={{ color: 'var(--warning)' }} data-tooltip={label('تعطيل', 'Suspend')}>
                          <XCircle size={15} />
                        </button>
                      ) : l.status === 'suspended' || l.status === 'pending' ? (
                        <button className="btn btn-ghost btn-icon btn-sm" style={{ color: 'var(--success)' }} data-tooltip={label('تفعيل', 'Activate')}>
                          <CheckCircle size={15} />
                        </button>
                      ) : null}
                      <button className="btn btn-ghost btn-icon btn-sm" style={{ color: 'var(--danger)' }} data-tooltip={label('حذف', 'Delete')}>
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <div className="empty-state">
              <div className="empty-state-icon"><Store size={32} /></div>
              <p className="fw-semi">{label('لا توجد نتائج', 'No results found')}</p>
              <p className="text-muted fs-sm">{label('جرب تغيير مصطلح البحث أو الفلتر', 'Try changing your search or filter')}</p>
            </div>
          )}
        </div>
        <div className="card-footer flex items-center justify-between">
          <span className="fs-sm text-muted">{label(`عرض ${filtered.length} من ${LAUNDRIES.length}`, `Showing ${filtered.length} of ${LAUNDRIES.length}`)}</span>
          <div className="pagination">
            <button className="page-btn" disabled>‹</button>
            <button className="page-btn active">1</button>
            <button className="page-btn">2</button>
            <button className="page-btn">›</button>
          </div>
        </div>
      </div>

      {/* Devices Modal */}
      {showDevicesModal && selectedLaundry && (
        <div className="modal-overlay" onClick={() => setShowDevicesModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <h3 className="fw-bold">{label('إدارة الأجهزة', 'Device Management')}</h3>
                <p className="fs-sm text-muted mt-4">{selectedLaundry.name}</p>
              </div>
              <button className="btn btn-ghost btn-icon" onClick={() => setShowDevicesModal(false)}>✕</button>
            </div>
            <div className="modal-body">
              {selectedLaundry.devices.length === 0 ? (
                <div className="empty-state" style={{ padding: 32 }}>
                  <Smartphone size={32} color="var(--text-muted)" />
                  <p className="text-muted">{label('لا توجد أجهزة مسجلة', 'No devices registered')}</p>
                </div>
              ) : (
                <div className="flex flex-col gap-12">
                  {selectedLaundry.devices.map((d, i) => (
                    <div key={i} className="card" style={{ boxShadow: 'none', border: '1.5px solid var(--border)' }}>
                      <div className="card-body" style={{ padding: '14px 16px' }}>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-12">
                            <div style={{ width: 42, height: 42, borderRadius: 10, background: 'var(--primary-50)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary-500)' }}>
                              {d.type === 'tablet' ? <Tablet size={20} /> : <Smartphone size={20} />}
                            </div>
                            <div>
                              <div className="fw-semi fs-sm">{d.type === 'tablet' ? label('تابلت', 'Tablet') : label('هاتف', 'Phone')}</div>
                              <div className="fs-xs text-muted">{d.os}</div>
                              <div className="fs-xs text-muted">{label(`آخر دخول: ${d.last}`, `Last login: ${d.last}`)}</div>
                            </div>
                          </div>
                          <div className="flex items-center gap-8">
                            <span className={`badge badge-${d.active ? 'success' : 'neutral'}`}>
                              {d.active ? label('نشط', 'Active') : label('غير نشط', 'Inactive')}
                            </span>
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
              <button className="btn btn-secondary" onClick={() => setShowDevicesModal(false)}>
                {label('إغلاق', 'Close')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Detail/Add Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" style={{ maxWidth: 640 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="fw-bold">
                {selectedLaundry ? label('تفاصيل المغسلة', 'Laundry Details') : label('إضافة مغسلة', 'Add Laundry')}
              </h3>
              <button className="btn btn-ghost btn-icon" onClick={() => setShowModal(false)}>✕</button>
            </div>
            <div className="modal-body">
              <div className="grid grid-2">
                <div className="form-group">
                  <label className="form-label">{label('اسم المغسلة', 'Laundry Name')} <span className="required">*</span></label>
                  <input className="form-control" defaultValue={selectedLaundry?.name} />
                </div>
                <div className="form-group">
                  <label className="form-label">{label('اسم المالك', 'Owner Name')} <span className="required">*</span></label>
                  <input className="form-control" defaultValue={selectedLaundry?.owner} />
                </div>
                <div className="form-group">
                  <label className="form-label">{label('رقم الهاتف', 'Phone Number')}</label>
                  <input className="form-control ltr" defaultValue={selectedLaundry?.phone} dir="ltr" />
                </div>
                <div className="form-group">
                  <label className="form-label">{label('المدينة', 'City')}</label>
                  <input className="form-control" defaultValue={selectedLaundry?.city} />
                </div>
                <div className="form-group">
                  <label className="form-label">{label('الحالة', 'Status')}</label>
                  <select className="form-control" defaultValue={selectedLaundry?.status}>
                    {Object.entries(STATUS_MAP).map(([k, v]) => (
                      <option key={k} value={k}>{label(v.labelAr, v.labelEn)}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">{label('خطة الاشتراك', 'Subscription Plan')}</label>
                  <select className="form-control" defaultValue={selectedLaundry?.plan}>
                    {Object.entries(PLAN_MAP).map(([k, v]) => (
                      <option key={k} value={k}>{label(v.labelAr, v.labelEn)}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowModal(false)}>{label('إلغاء', 'Cancel')}</button>
              <button className="btn btn-primary">{label('حفظ', 'Save')}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
