import { useState } from 'react'
import { useTheme } from '../App'
import { Plus, Eye, Edit, Trash2, Image, Video, Users, Store, Calendar, ToggleLeft, ToggleRight } from 'lucide-react'

const ADS = [
  { id: 1, title: 'عروض نهاية الموسم', target: 'customers', media: [{ type: 'image' }, { type: 'image' }], text: 'استمتع بخصومات حتى 40% على جميع خدمات الغسيل والكوي', startDate: '2025-01-15', endDate: '2025-02-15', active: true, views: 1240 },
  { id: 2, title: 'معدات غسيل احترافية', target: 'laundries', media: [{ type: 'image' }, { type: 'video' }], text: 'أحدث معدات الغسيل الصناعي بأسعار مميزة لأصحاب المغاسل', startDate: '2025-01-10', endDate: '2025-03-10', active: true, views: 382 },
  { id: 3, title: 'رمضان كريم', target: 'all', media: [{ type: 'image' }], text: 'بمناسبة شهر رمضان المبارك تمتع بعروض خاصة', startDate: '2025-02-28', endDate: '2025-04-01', active: false, views: 0 },
]

const TARGET_MAP = {
  customers: { labelAr: 'للعملاء', labelEn: 'Customers', icon: Users, badge: 'primary' },
  laundries: { labelAr: 'للمغاسل', labelEn: 'Laundries', icon: Store, badge: 'info' },
  all:       { labelAr: 'للجميع', labelEn: 'All', badge: 'success' },
}

export default function AdsPage() {
  const { lang } = useTheme()
  const label = (ar, en) => lang === 'ar' ? ar : en
  const [showModal, setShowModal] = useState(false)
  const [selectedAd, setSelectedAd] = useState(null)
  const [mediaFiles, setMediaFiles] = useState([])

  const openAdd = () => { setSelectedAd(null); setMediaFiles([]); setShowModal(true) }
  const openEdit = (ad) => { setSelectedAd(ad); setShowModal(true) }

  return (
    <div className="animate-fade">
      <div className="page-header">
        <div>
          <h1 className="page-title">{label('إدارة الإعلانات', 'Ads Management')}</h1>
          <p className="page-subtitle">{label('إدارة الإعلانات والعروض الترويجية', 'Manage promotional banners and ads')}</p>
        </div>
        <button className="btn btn-primary" onClick={openAdd}>
          <Plus size={16} /> {label('إعلان جديد', 'New Ad')}
        </button>
      </div>

      <div className="grid grid-3">
        {ADS.map(ad => {
          const t = TARGET_MAP[ad.target]
          return (
            <div key={ad.id} className="card" style={{ opacity: ad.active ? 1 : 0.7 }}>
              {/* Media Preview */}
              <div style={{ height: 160, background: 'linear-gradient(135deg, var(--primary-50), var(--primary-100))', borderRadius: 'var(--radius-lg) var(--radius-lg) 0 0', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', overflow: 'hidden' }}>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  {ad.media.map((m, i) => (
                    <div key={i} style={{ width: 48, height: 48, borderRadius: 10, background: 'var(--bg-card)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: 'var(--shadow-sm)' }}>
                      {m.type === 'image' ? <Image size={20} color="var(--primary-400)" /> : <Video size={20} color="var(--primary-400)" />}
                    </div>
                  ))}
                </div>
                <div style={{ position: 'absolute', top: 12, right: 12 }}>
                  <span className={`badge badge-${t.badge}`}>{label(t.labelAr, t.labelEn)}</span>
                </div>
                <div style={{ position: 'absolute', top: 12, left: 12 }}>
                  <span className="badge badge-neutral fs-xs">{ad.media.length} {label('وسائط', 'media')}</span>
                </div>
              </div>

              <div className="card-body">
                <div className="flex items-start justify-between mb-8">
                  <h3 className="fw-bold fs-md">{ad.title}</h3>
                  <span className={`badge badge-${ad.active ? 'success' : 'neutral'}`}>
                    {ad.active ? label('نشط', 'Active') : label('موقوف', 'Inactive')}
                  </span>
                </div>

                <p className="fs-sm text-muted mb-16" style={{ lineHeight: 1.5, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                  {ad.text}
                </p>

                <div className="flex items-center gap-16 mb-16 fs-xs text-muted">
                  <div className="flex items-center gap-4">
                    <Calendar size={12} />
                    <span>{ad.startDate} — {ad.endDate}</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <Eye size={12} />
                    <span>{ad.views.toLocaleString()}</span>
                  </div>
                </div>

                <div className="flex gap-8">
                  <button className="btn btn-secondary btn-sm flex-1" onClick={() => openEdit(ad)}>
                    <Edit size={14} /> {label('تعديل', 'Edit')}
                  </button>
                  <button className="btn btn-ghost btn-sm" style={{ color: ad.active ? 'var(--warning)' : 'var(--success)' }}>
                    {ad.active ? <ToggleLeft size={16} /> : <ToggleRight size={16} />}
                  </button>
                  <button className="btn btn-ghost btn-sm" style={{ color: 'var(--danger)' }}>
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            </div>
          )
        })}

        {/* Add Card */}
        <div className="card" style={{ border: '2px dashed var(--border)', background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 280, boxShadow: 'none' }} onClick={openAdd}>
          <div className="empty-state" style={{ padding: 24 }}>
            <div className="empty-state-icon" style={{ background: 'var(--primary-50)', color: 'var(--primary-500)' }}>
              <Plus size={28} />
            </div>
            <p className="fw-semi text-primary">{label('إضافة إعلان جديد', 'Add New Ad')}</p>
          </div>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" style={{ maxWidth: 600 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="fw-bold">{selectedAd ? label('تعديل الإعلان', 'Edit Ad') : label('إعلان جديد', 'New Ad')}</h3>
              <button className="btn btn-ghost btn-icon" onClick={() => setShowModal(false)}>✕</button>
            </div>
            <div className="modal-body flex flex-col gap-4">
              <div className="form-group">
                <label className="form-label">{label('عنوان الإعلان', 'Ad Title')} <span className="required">*</span></label>
                <input className="form-control" defaultValue={selectedAd?.title} placeholder={label('مثال: عروض نهاية الموسم', 'e.g. End of season offers')} />
              </div>
              <div className="form-group">
                <label className="form-label">{label('الجمهور المستهدف', 'Target Audience')} <span className="required">*</span></label>
                <select className="form-control" defaultValue={selectedAd?.target ?? 'all'}>
                  <option value="all">{label('الجميع (عملاء + مغاسل)', 'All (customers + laundries)')}</option>
                  <option value="customers">{label('العملاء فقط', 'Customers only')}</option>
                  <option value="laundries">{label('المغاسل فقط', 'Laundries only')}</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">{label('النص التفصيلي', 'Description')}</label>
                <textarea className="form-control" rows={3} defaultValue={selectedAd?.text} style={{ resize: 'vertical' }} />
              </div>

              {/* Media Upload */}
              <div className="form-group">
                <label className="form-label">{label('الوسائط (صور + فيديو)', 'Media (images + video)')}</label>
                <div style={{ border: '2px dashed var(--border)', borderRadius: 'var(--radius-md)', padding: 24, textAlign: 'center', cursor: 'pointer', background: 'var(--gray-50)' }}>
                  <div className="flex items-center justify-center gap-12 mb-8">
                    <Image size={24} color="var(--text-muted)" />
                    <Video size={24} color="var(--text-muted)" />
                  </div>
                  <p className="fs-sm text-muted">{label('اسحب وأفلت الصور والفيديو هنا، أو انقر للتحميل', 'Drag & drop images/videos here or click to upload')}</p>
                  <p className="fs-xs text-muted mt-4">{label('JPG, PNG, MP4 — حتى 50MB لكل ملف', 'JPG, PNG, MP4 — up to 50MB per file')}</p>
                  <input type="file" multiple accept="image/*,video/*" style={{ display: 'none' }} />
                </div>
                {selectedAd?.media && (
                  <div className="flex gap-8 mt-12">
                    {selectedAd.media.map((m, i) => (
                      <div key={i} style={{ width: 60, height: 60, borderRadius: 8, background: 'var(--primary-50)', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
                        {m.type === 'image' ? <Image size={20} color="var(--primary-400)" /> : <Video size={20} color="var(--primary-400)" />}
                        <button style={{ position: 'absolute', top: -6, left: -6, width: 18, height: 18, borderRadius: '50%', background: 'var(--danger)', color: 'white', border: 'none', cursor: 'pointer', fontSize: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="grid grid-2">
                <div className="form-group">
                  <label className="form-label">{label('تاريخ البداية', 'Start Date')}</label>
                  <input type="date" className="form-control ltr" defaultValue={selectedAd?.startDate} />
                </div>
                <div className="form-group">
                  <label className="form-label">{label('تاريخ الانتهاء', 'End Date')}</label>
                  <input type="date" className="form-control ltr" defaultValue={selectedAd?.endDate} />
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowModal(false)}>{label('إلغاء', 'Cancel')}</button>
              <button className="btn btn-primary">{label('نشر الإعلان', 'Publish Ad')}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
