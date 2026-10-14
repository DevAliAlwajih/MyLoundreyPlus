import { useState, useEffect } from 'react'
import { useTheme } from '../App'
import api from '../services/api'
import {
  Search, Plus, Users, QrCode, Smartphone, Tablet, Phone,
  CheckCircle, XCircle, Eye, Edit, Trash2, ShieldOff, Shield,
  AlertTriangle, Lock, UserCheck, RefreshCw, Mail, Calendar
} from 'lucide-react'

import { io } from 'socket.io-client'

export default function CustomersPage() {
  const { lang } = useTheme()
  const label = (ar, en) => lang === 'ar' ? ar : en

  const [customers, setCustomers] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [selectedCustomer, setSelectedCustomer] = useState(null)
  const [showDevicesModal, setShowDevicesModal] = useState(false)
  const [showDetailModal, setShowDetailModal] = useState(false)

  useEffect(() => {
    fetchCustomers()

    // ─── Real-time Updates Setup ─────────────────────────
    let socket = null
    try {
      socket = io('http://localhost:5000')
      socket.on('admin_update', (data) => {
        if (data.type === 'NEW_USER' || data.type === 'USER_STATUS_CHANGE') {
          fetchCustomers()
        }
      })
    } catch (e) {
      console.warn('Realtime socket not connected', e)
    }

    return () => {
      if (socket) socket.disconnect()
    }
  }, [])

  const fetchCustomers = async () => {
    setLoading(true)
    try {
      const res = await api.get('/admin/users', { params: { role: 'customer' } })
      const data = res.data?.data || res.data || []
      setCustomers(Array.isArray(data) ? data : [])
    } catch (err) {
      console.error('Failed to fetch customers', err)
      try {
        const fallbackRes = await api.get('/admin/customers')
        const fallbackData = fallbackRes.data?.data || fallbackRes.data || []
        setCustomers(Array.isArray(fallbackData) ? fallbackData : [])
      } catch (e) {
        setCustomers([])
      }
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateStatus = async (id, isActive) => {
    try {
      await api.patch(`/admin/users/${id}/status`, { isActive })
      fetchCustomers()
    } catch (err) {
      alert(label('فشل تحديث الحالة', 'Failed to update status'))
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm(label('هل أنت متأكد من حذف هذا المستخدم؟', 'Are you sure you want to delete this customer?'))) return
    try {
      await api.delete(`/admin/users/${id}`)
      fetchCustomers()
    } catch (err) {
      alert(label('فشل الحذف', 'Failed to delete customer'))
    }
  }

  const customerList = Array.isArray(customers) ? customers : []
  const filtered = customerList.filter(c => {
    const s = search.toLowerCase()
    const name = (c.fullName || c.full_name || '').toLowerCase()
    const phone = (c.phoneNumber || c.phone_number || '')
    const uid = (c.uniqueId || c.unique_id || '').toLowerCase()
    return name.includes(s) || phone.includes(s) || uid.includes(s)
  })

  return (
    <div className="animate-fade">
      <div className="page-header">
        <div>
          <h1 className="page-title">{label('إدارة العملاء', 'Customers Management')}</h1>
          <p className="page-subtitle">{label(`${customerList.length} عميل مسجل`, `${customerList.length} registered customers`)}</p>
        </div>
        <div className="flex items-center gap-10">
          <button className="btn btn-secondary" onClick={fetchCustomers} title={label('تحديث', 'Refresh')}>
            <RefreshCw size={16} />
          </button>
        </div>
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
                <th>{label('البلد والعملة', 'Country & Currency')}</th>
                <th>{label('الفواتير', 'Invoices')}</th>
                <th>{label('الأجهزة', 'Devices')}</th>
                <th>{label('الحالة', 'Status')}</th>
                <th>{label('الإجراءات', 'Actions')}</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="7" className="text-center py-20">
                    <div className="flex items-center justify-center gap-8 py-20 text-muted">
                      <RefreshCw size={18} className="animate-spin" />
                      <span>{label('جاري التحميل...', 'Loading...')}</span>
                    </div>
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan="7" className="text-center py-20 text-muted">
                    {label('لا يوجد عملاء مطابقون للبحث', 'No customers found')}
                  </td>
                </tr>
              ) : filtered.map(c => {
                const name = c.fullName || c.full_name || 'بدون اسم'
                const phone = c.phoneNumber || c.phone_number || '—'
                const uniqueId = c.uniqueId || c.unique_id || '—'
                const country = c.country || 'SA'
                const currency = c.currency || 'SAR'
                const isActive = c.isActive ?? c.is_active ?? true
                const invoicesCount = c._count?.invoices ?? c.invoices_count ?? 0
                const devicesList = c.userDevices || c.devices || []
                const devicesCount = devicesList.length || c._count?.userDevices || 0

                return (
                  <tr key={c.id}>
                    <td>
                      <div className="flex items-center gap-10">
                        <div className="avatar-placeholder" style={{ width: 38, height: 38, borderRadius: 10, fontSize: '0.85rem' }}>
                          {name[0] || 'U'}
                        </div>
                        <div>
                          <div className="fw-semi">{name}</div>
                          <div className="fs-xs text-muted flex items-center gap-4">
                            <Phone size={11} /> {phone}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div className="flex items-center gap-6">
                        <code style={{ fontSize: '0.8rem', background: 'var(--gray-100)', padding: '2px 8px', borderRadius: 6 }}>
                          {uniqueId}
                        </code>
                      </div>
                    </td>
                    <td>
                      <div className="flex items-center gap-6">
                        <span className="fw-semi fs-sm">{country}</span>
                        <span className="badge badge-neutral fs-xs">{currency}</span>
                      </div>
                    </td>
                    <td className="fw-bold">{invoicesCount}</td>
                    <td>
                      <button
                        className="btn btn-ghost btn-sm flex items-center gap-4"
                        onClick={() => { setSelectedCustomer(c); setShowDevicesModal(true) }}
                        title={label('عرض الأجهزة', 'View devices')}
                      >
                        <Smartphone size={14} />
                        <span className="fw-bold">{devicesCount}</span>
                      </button>
                    </td>
                    <td>
                      <div className="flex items-center gap-6">
                        <span className={`status-dot ${isActive ? 'active' : 'inactive'}`} />
                        <span className="fs-sm">{isActive ? label('نشط', 'Active') : label('موقوف', 'Suspended')}</span>
                      </div>
                    </td>
                    <td>
                      <div className="flex items-center gap-4">
                        <button
                          className="btn btn-ghost btn-icon btn-sm"
                          onClick={() => { setSelectedCustomer(c); setShowDetailModal(true) }}
                          title={label('تفاصيل', 'Details')}
                        >
                          <Eye size={15} />
                        </button>
                        <button
                          className="btn btn-ghost btn-icon btn-sm"
                          onClick={() => handleUpdateStatus(c.id, !isActive)}
                          style={{ color: isActive ? 'var(--warning)' : 'var(--success)' }}
                          title={isActive ? label('تعطيل', 'Suspend') : label('تفعيل', 'Activate')}
                        >
                          {isActive ? <ShieldOff size={15} /> : <Shield size={15} />}
                        </button>
                        <button
                          className="btn btn-ghost btn-icon btn-sm"
                          onClick={() => handleDelete(c.id)}
                          style={{ color: 'var(--danger)' }}
                          title={label('حذف', 'Delete')}
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detail Modal */}
      {showDetailModal && selectedCustomer && (
        <div className="modal-overlay" onClick={() => setShowDetailModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 500 }}>
            <div className="modal-header">
              <h3 className="fw-bold">{label('بيانات العميل', 'Customer Details')}</h3>
              <button className="btn btn-ghost btn-icon" onClick={() => setShowDetailModal(false)}>✕</button>
            </div>
            <div className="modal-body">
              <div className="flex flex-col gap-16">
                <div className="flex items-center gap-12">
                  <div className="avatar-placeholder" style={{ width: 50, height: 50, borderRadius: 12, fontSize: '1.2rem' }}>
                    {(selectedCustomer.fullName || selectedCustomer.full_name || 'U')[0]}
                  </div>
                  <div>
                    <h4 className="fw-bold fs-lg">{selectedCustomer.fullName || selectedCustomer.full_name || '—'}</h4>
                    <p className="fs-sm text-muted">{selectedCustomer.phoneNumber || selectedCustomer.phone_number || '—'}</p>
                  </div>
                </div>

                <div className="card" style={{ boxShadow: 'none', border: '1px solid var(--border)' }}>
                  <div className="card-body" style={{ padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {selectedCustomer.email && (
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-muted flex items-center gap-6"><Mail size={14} /> {label('البريد', 'Email')}</span>
                        <span className="fw-semi">{selectedCustomer.email}</span>
                      </div>
                    )}
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-muted flex items-center gap-6"><QrCode size={14} /> {label('المعرف الفريد', 'Unique ID')}</span>
                      <code>{selectedCustomer.uniqueId || selectedCustomer.unique_id || '—'}</code>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-muted">{label('البلد', 'Country')}</span>
                      <span className="fw-semi">{selectedCustomer.country || 'SA'}</span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-muted">{label('العملة', 'Currency')}</span>
                      <span className="badge badge-neutral fs-xs">{selectedCustomer.currency || 'SAR'}</span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-muted flex items-center gap-6"><Calendar size={14} /> {label('تاريخ التسجيل', 'Registered At')}</span>
                      <span className="fs-xs text-muted">
                        {selectedCustomer.createdAt ? new Date(selectedCustomer.createdAt).toLocaleDateString() : '—'}
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-muted">{label('الحالة', 'Status')}</span>
                      <span className={`badge ${selectedCustomer.isActive ?? selectedCustomer.is_active ? 'badge-success' : 'badge-danger'}`}>
                        {selectedCustomer.isActive ?? selectedCustomer.is_active ? label('نشط', 'Active') : label('موقوف', 'Suspended')}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowDetailModal(false)}>{label('إغلاق', 'Close')}</button>
            </div>
          </div>
        </div>
      )}

      {/* Devices Modal */}
      {showDevicesModal && selectedCustomer && (
        <div className="modal-overlay" onClick={() => setShowDevicesModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <h3 className="fw-bold">{label('إدارة الأجهزة', 'Device Management')}</h3>
                <p className="fs-sm text-muted">{selectedCustomer.fullName || selectedCustomer.full_name || '—'}</p>
              </div>
              <button className="btn btn-ghost btn-icon" onClick={() => setShowDevicesModal(false)}>✕</button>
            </div>
            <div className="modal-body">
              {(!selectedCustomer.userDevices || selectedCustomer.userDevices.length === 0) && (!selectedCustomer.devices || selectedCustomer.devices.length === 0) ? (
                <div className="empty-state" style={{ padding: 32, textAlign: 'center' }}>
                  <Smartphone size={32} color="var(--text-muted)" style={{ margin: '0 auto 8px' }} />
                  <p className="text-muted">{label('لا توجد أجهزة مسجلة', 'No registered devices')}</p>
                </div>
              ) : (
                <div className="flex flex-col gap-12">
                  {(selectedCustomer.userDevices || selectedCustomer.devices || []).map((d, i) => {
                    const isTablet = d.deviceType === 'tablet' || d.type === 'tablet'
                    const model = d.deviceModel || d.model || 'Unknown Device'
                    const os = d.deviceOs || d.os || ''
                    const isPrimary = d.isPrimary ?? false
                    const active = d.isActive ?? d.active ?? true
                    const lastLogin = d.lastLoginAt ? new Date(d.lastLoginAt).toLocaleDateString() : (d.lastLogin || '—')

                    return (
                      <div key={d.id || i} className="card" style={{ boxShadow: 'none', border: '1.5px solid var(--border)' }}>
                        <div className="card-body" style={{ padding: '14px 16px' }}>
                          <div className="flex items-center justify-between flex-wrap gap-12">
                            <div className="flex items-center gap-12">
                              <div style={{ width: 44, height: 44, borderRadius: 10, background: 'var(--primary-50)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary-500)', position: 'relative' }}>
                                {isTablet ? <Tablet size={20} /> : <Smartphone size={20} />}
                                {isPrimary && (
                                  <div style={{ position: 'absolute', top: -4, right: -4, width: 16, height: 16, borderRadius: '50%', background: 'var(--gold)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <span style={{ fontSize: '0.5rem', color: 'white', fontWeight: 900 }}>★</span>
                                  </div>
                                )}
                              </div>
                              <div>
                                <div className="flex items-center gap-6">
                                  <span className="fw-semi fs-sm">{model}</span>
                                  {isPrimary && <span className="badge badge-gold" style={{ fontSize: '0.65rem' }}>{label('افتراضي', 'Primary')}</span>}
                                </div>
                                {os && <div className="fs-xs text-muted">{os}</div>}
                                <div className="fs-xs text-muted">{label(`آخر دخول: ${lastLogin}`, `Last login: ${lastLogin}`)}</div>
                              </div>
                            </div>
                            <div className="flex items-center gap-8 flex-wrap">
                              <span className={`badge ${active ? 'badge-success' : 'badge-danger'}`}>
                                {active ? label('نشط', 'Active') : label('معطل', 'Inactive')}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    )
                  })}
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
