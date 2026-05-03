import { useState } from 'react'
import { useTheme } from '../App'
import {
  MessageSquare, Phone, PhoneCall, PhoneIncoming, PhoneOutgoing,
  Clock, CheckCircle, AlertCircle, User, Store, Send,
  ChevronLeft, Plus, FileText
} from 'lucide-react'

const TICKETS = [
  { id: 'TKT-001', from: 'أحمد السالم', type: 'customer', subject: 'فاتورة بها خطأ في المبلغ', status: 'open', priority: 'high', time: 'منذ 15 دقيقة', lastMsg: 'الفاتورة رقم LAU-2025-001234 تحتوي على مبلغ خاطئ' },
  { id: 'TKT-002', from: 'مغسلة النور', type: 'laundry', subject: 'مشكلة في الطباعة الحرارية', status: 'in_progress', priority: 'medium', time: 'منذ ساعة', lastMsg: 'الطابعة لا تستجيب عبر البلوتوث' },
  { id: 'TKT-003', from: 'فاطمة الزهراني', type: 'customer', subject: 'استفسار عن التقييم', status: 'open', priority: 'low', time: 'منذ 3 ساعات', lastMsg: 'لماذا لا يمكنني تقييم الطلب؟' },
  { id: 'TKT-004', from: 'مغسلة الربيع', type: 'laundry', subject: 'طلب تمديد الاشتراك', status: 'resolved', priority: 'medium', time: 'منذ يوم', lastMsg: 'تم تمديد الاشتراك بنجاح' },
]

const CALLS = [
  { id: 1, from: 'أحمد السالم', type: 'customer', phone: '+966511111111', direction: 'incoming', duration: '4:32', time: 'منذ ساعتين', note: 'استفسار عن حالة الطلب' },
  { id: 2, from: 'مغسلة النور', type: 'laundry', phone: '+966501234567', direction: 'outgoing', duration: '2:15', time: 'منذ 4 ساعات', note: 'متابعة تجديد الاشتراك' },
  { id: 3, from: 'محمد العتيبي', type: 'customer', phone: '+966533333333', direction: 'incoming', duration: '1:48', time: 'أمس', note: 'شكوى من تأخر الطلب' },
]

const STATUS_COLORS = { open: 'danger', in_progress: 'warning', resolved: 'success', closed: 'neutral' }
const STATUS_LABELS = { open: ['مفتوح', 'Open'], in_progress: ['قيد المعالجة', 'In Progress'], resolved: ['تم الحل', 'Resolved'], closed: ['مغلق', 'Closed'] }
const PRIORITY_COLORS = { high: 'danger', medium: 'warning', low: 'neutral' }
const PRIORITY_LABELS = { high: ['عاجل', 'High'], medium: ['متوسط', 'Medium'], low: ['منخفض', 'Low'] }

export default function SupportPage() {
  const { lang } = useTheme()
  const label = (ar, en) => lang === 'ar' ? ar : en
  const [tab, setTab] = useState('tickets')
  const [selectedTicket, setSelectedTicket] = useState(null)
  const [reply, setReply] = useState('')

  return (
    <div className="animate-fade" style={{ display: selectedTicket ? 'grid' : 'block', gridTemplateColumns: selectedTicket ? '1fr 380px' : undefined, gap: 20, alignItems: 'start' }}>
      <div>
        <div className="page-header">
          <div>
            <h1 className="page-title">{label('الدعم الفني', 'Support Center')}</h1>
            <p className="page-subtitle">{label('تذاكر الدعم والمكالمات الهاتفية', 'Support tickets and phone calls')}</p>
          </div>
          <button className="btn btn-primary"><Plus size={16} /> {label('تذكرة جديدة', 'New Ticket')}</button>
        </div>

        <div className="tabs">
          {[['tickets', 'التذاكر', 'Tickets', TICKETS.filter(t => t.status !== 'resolved').length], ['calls', 'المكالمات', 'Calls', null]].map(([k, ar, en, count]) => (
            <button key={k} className={`tab-btn ${tab === k ? 'active' : ''}`} onClick={() => setTab(k)}>
              {label(ar, en)}
              {count > 0 && <span className="badge badge-danger" style={{ marginRight: 6, fontSize: '0.65rem', padding: '1px 6px' }}>{count}</span>}
            </button>
          ))}
        </div>

        {tab === 'tickets' && (
          <div className="flex flex-col gap-12">
            {TICKETS.map(t => (
              <div
                key={t.id}
                className="card"
                style={{ cursor: 'pointer', borderRight: selectedTicket?.id === t.id ? `3px solid var(--primary-500)` : '' }}
                onClick={() => setSelectedTicket(t)}
              >
                <div className="card-body" style={{ padding: '16px 20px' }}>
                  <div className="flex items-start justify-between gap-12">
                    <div className="flex items-start gap-12">
                      <div style={{ width: 40, height: 40, borderRadius: 10, background: t.type === 'customer' ? 'var(--primary-50)' : 'var(--success-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        {t.type === 'customer' ? <User size={18} color="var(--primary-500)" /> : <Store size={18} color="var(--success)" />}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-8 mb-4">
                          <span className="fw-bold fs-sm">{t.from}</span>
                          <span className="text-muted fs-xs">• {t.id}</span>
                          <span className={`badge badge-${t.type === 'customer' ? 'primary' : 'success'}`} style={{ fontSize: '0.65rem' }}>
                            {t.type === 'customer' ? label('عميل', 'Customer') : label('مغسلة', 'Laundry')}
                          </span>
                        </div>
                        <p className="fw-semi fs-sm mb-4">{t.subject}</p>
                        <p className="text-muted fs-xs truncate" style={{ maxWidth: 500 }}>{t.lastMsg}</p>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-8">
                      <div className="flex items-center gap-6">
                        <span className={`badge badge-${STATUS_COLORS[t.status]}`}>{label(...STATUS_LABELS[t.status])}</span>
                        <span className={`badge badge-${PRIORITY_COLORS[t.priority]}`}>{label(...PRIORITY_LABELS[t.priority])}</span>
                      </div>
                      <span className="text-muted fs-xs">{t.time}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {tab === 'calls' && (
          <div className="card">
            <div className="table-wrapper" style={{ border: 'none' }}>
              <table>
                <thead>
                  <tr>
                    <th>{label('المتصل', 'Caller')}</th>
                    <th>{label('الاتجاه', 'Direction')}</th>
                    <th>{label('المدة', 'Duration')}</th>
                    <th>{label('الوقت', 'Time')}</th>
                    <th>{label('ملاحظة', 'Note')}</th>
                    <th>{label('الإجراءات', 'Actions')}</th>
                  </tr>
                </thead>
                <tbody>
                  {CALLS.map(c => (
                    <tr key={c.id}>
                      <td>
                        <div className="flex items-center gap-10">
                          <div style={{ width: 36, height: 36, borderRadius: 8, background: c.type === 'customer' ? 'var(--primary-50)' : 'var(--success-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            {c.type === 'customer' ? <User size={16} color="var(--primary-500)" /> : <Store size={16} color="var(--success)" />}
                          </div>
                          <div>
                            <div className="fw-semi fs-sm">{c.from}</div>
                            <div className="fs-xs text-muted ltr" dir="ltr">{c.phone}</div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <div className="flex items-center gap-6">
                          {c.direction === 'incoming'
                            ? <PhoneIncoming size={14} color="var(--success)" />
                            : <PhoneOutgoing size={14} color="var(--primary-500)" />}
                          <span className="fs-sm">{c.direction === 'incoming' ? label('واردة', 'Incoming') : label('صادرة', 'Outgoing')}</span>
                        </div>
                      </td>
                      <td className="fw-bold fs-sm ltr" dir="ltr">{c.duration}</td>
                      <td className="text-muted fs-sm">{c.time}</td>
                      <td className="fs-sm text-muted" style={{ maxWidth: 200 }}><span className="truncate">{c.note}</span></td>
                      <td>
                        <a href={`tel:${c.phone}`} className="btn btn-success btn-sm">
                          <PhoneCall size={14} /> {label('اتصال', 'Call')}
                        </a>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Ticket Chat Panel */}
      {selectedTicket && (
        <div className="card animate-slide" style={{ position: 'sticky', top: 88 }}>
          <div className="card-header">
            <div>
              <div className="fw-bold fs-sm">{selectedTicket.subject}</div>
              <div className="text-muted fs-xs">{selectedTicket.from} • {selectedTicket.id}</div>
            </div>
            <button className="btn btn-ghost btn-icon btn-sm" onClick={() => setSelectedTicket(null)}>✕</button>
          </div>
          <div style={{ height: 300, padding: 16, display: 'flex', flexDirection: 'column', gap: 12, overflowY: 'auto', background: 'var(--bg-page)' }}>
            {/* Customer message */}
            <div style={{ display: 'flex', gap: 8 }}>
              <div className="avatar-placeholder" style={{ width: 32, height: 32, borderRadius: '50%', fontSize: '0.75rem', flexShrink: 0 }}>{selectedTicket.from[0]}</div>
              <div style={{ background: 'var(--bg-card)', borderRadius: '0 var(--radius-md) var(--radius-md) var(--radius-md)', padding: '10px 14px', maxWidth: '80%', border: '1px solid var(--border)' }}>
                <p className="fs-sm">{selectedTicket.lastMsg}</p>
                <p className="fs-xs text-muted mt-4">{selectedTicket.time}</p>
              </div>
            </div>
            {selectedTicket.status === 'resolved' && (
              <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                <div style={{ background: 'var(--primary-500)', borderRadius: 'var(--radius-md) 0 var(--radius-md) var(--radius-md)', padding: '10px 14px', maxWidth: '80%' }}>
                  <p className="fs-sm" style={{ color: 'white' }}>تم معالجة طلبك بنجاح. شكراً لتواصلك معنا.</p>
                  <p className="fs-xs mt-4" style={{ color: 'rgba(255,255,255,0.7)' }}>{label('الفريق', 'Team')} • أمس</p>
                </div>
              </div>
            )}
          </div>
          <div className="card-footer">
            <div className="flex gap-8">
              <input
                className="form-control"
                placeholder={label('اكتب ردك...', 'Write your reply...')}
                value={reply}
                onChange={e => setReply(e.target.value)}
                style={{ flex: 1 }}
              />
              <button className="btn btn-primary btn-icon">
                <Send size={16} />
              </button>
            </div>
            <div className="flex gap-8 mt-12">
              <button className="btn btn-success btn-sm flex-1">
                <CheckCircle size={14} /> {label('إغلاق التذكرة', 'Close Ticket')}
              </button>
              <a href="tel:+966511111111" className="btn btn-secondary btn-sm">
                <PhoneCall size={14} /> {label('اتصال', 'Call')}
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
