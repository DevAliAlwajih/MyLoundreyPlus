import { useState, useEffect } from 'react'
import { useTheme } from '../App'
import { Plus, Eye, Edit, Trash2, Image, Video, Users, Store, Calendar, ToggleLeft, ToggleRight, Loader } from 'lucide-react'
import { adsApi } from '../services/api'

const TARGET_MAP = {
  customers: { labelAr: 'للعملاء', labelEn: 'Customers', icon: Users, badge: 'primary' },
  laundries: { labelAr: 'للمغاسل', labelEn: 'Laundries', icon: Store, badge: 'info' },
  all:       { labelAr: 'للجميع', labelEn: 'All', badge: 'success' },
}

export default function AdsPage() {
  const { lang } = useTheme()
  const label = (ar, en) => lang === 'ar' ? ar : en
  const [ads, setAds] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [selectedAd, setSelectedAd] = useState(null)
  
  // form state
  const [formData, setFormData] = useState({
    title: '',
    bodyText: '',
    targetAudience: 'all',
    startDate: '',
    endDate: '',
    adFee: '',
    linkUrl: '',
    mediaUrls: []
  })
  const [isSaving, setIsSaving] = useState(false)
  const [uploadingMedia, setUploadingMedia] = useState(false)

  const fetchAds = async () => {
    try {
      setLoading(true)
      const res = await adsApi.getAll()
      setAds(res.data?.data || [])
    } catch (err) {
      console.error('Error fetching ads', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAds()
  }, [])

  const openAdd = () => { 
    setSelectedAd(null)
    setFormData({
      title: '',
      bodyText: '',
      targetAudience: 'all',
      startDate: '',
      endDate: '',
      adFee: '',
      linkUrl: '',
      mediaUrls: []
    })
    setShowModal(true) 
  }
  
  const openEdit = (ad) => { 
    setSelectedAd(ad)
    setFormData({
      title: ad.title || '',
      bodyText: ad.bodyText || '',
      targetAudience: ad.targetAudience || 'all',
      startDate: ad.startDate ? ad.startDate.split('T')[0] : '',
      endDate: ad.endDate ? ad.endDate.split('T')[0] : '',
      adFee: ad.adFee || '',
      linkUrl: ad.linkUrl || '',
      mediaUrls: Array.isArray(ad.mediaUrls) ? ad.mediaUrls : []
    })
    setShowModal(true) 
  }

  const handleToggle = async (ad) => {
    try {
      await adsApi.toggleStatus(ad.id)
      fetchAds()
    } catch (err) {
      console.error(err)
      alert(label('حدث خطأ أثناء تغيير الحالة', 'Error toggling status'))
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm(label('هل أنت متأكد من الحذف؟', 'Are you sure you want to delete?'))) return
    try {
      await adsApi.delete(id)
      fetchAds()
    } catch (err) {
      console.error(err)
      alert(label('حدث خطأ أثناء الحذف', 'Error deleting ad'))
    }
  }

  const handleFileUpload = async (e) => {
    const files = Array.from(e.target.files)
    if (files.length === 0) return

    setUploadingMedia(true)
    try {
      const newUrls = []
      for (const file of files) {
        const res = await adsApi.uploadMedia(file)
        if (res.data?.success && res.data?.data?.url) {
          newUrls.push(res.data.data.url)
        }
      }
      setFormData(prev => ({
        ...prev,
        mediaUrls: [...prev.mediaUrls, ...newUrls]
      }))
    } catch (err) {
      console.error('Error uploading media', err)
      alert(label('فشل رفع بعض الوسائط', 'Failed to upload some media'))
    } finally {
      setUploadingMedia(false)
    }
  }

  const removeMedia = (index) => {
    setFormData(prev => ({
      ...prev,
      mediaUrls: prev.mediaUrls.filter((_, i) => i !== index)
    }))
  }

  const handleSave = async () => {
    if (!formData.title) {
      alert(label('يرجى إدخال عنوان الإعلان', 'Please enter ad title'))
      return
    }

    try {
      setIsSaving(true)
      const payload = {
        title: formData.title,
        bodyText: formData.bodyText || null,
        targetAudience: formData.targetAudience,
        linkUrl: formData.linkUrl || null,
        mediaUrls: formData.mediaUrls,
        adFee: formData.adFee ? parseFloat(formData.adFee) : 0,
      }
      if (formData.startDate) payload.startDate = formData.startDate
      if (formData.endDate) payload.endDate = formData.endDate

      if (selectedAd) {
        await adsApi.update(selectedAd.id, payload)
      } else {
        await adsApi.create(payload)
      }

      setShowModal(false)
      fetchAds()
    } catch (err) {
      console.error(err)
      alert(label('حدث خطأ أثناء الحفظ', 'Error saving ad'))
    } finally {
      setIsSaving(false)
    }
  }

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

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '48px 0' }}>
          <Loader className="spinner" size={32} color="var(--primary-500)" />
        </div>
      ) : (
        <div className="grid grid-3">
          {ads.map(ad => {
            const t = TARGET_MAP[ad.targetAudience] || TARGET_MAP.all
            const mediaList = Array.isArray(ad.mediaUrls) ? ad.mediaUrls : []
            const firstMedia = mediaList.length > 0 ? mediaList[0] : null
            const isVideo = firstMedia && typeof firstMedia === 'string' && firstMedia.match(/\.(mp4|webm|ogg)$/i)
            
            return (
              <div key={ad.id} className="card" style={{ opacity: ad.isActive ? 1 : 0.7 }}>
                {/* Media Preview */}
                <div style={{ height: 160, background: 'linear-gradient(135deg, var(--primary-50), var(--primary-100))', borderRadius: 'var(--radius-lg) var(--radius-lg) 0 0', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', overflow: 'hidden' }}>
                  {firstMedia ? (
                    isVideo ? (
                      <video src={firstMedia} style={{ width: '100%', height: '100%', objectFit: 'cover' }} muted loop autoPlay />
                    ) : (
                      <img src={firstMedia} alt={ad.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    )
                  ) : (
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                      <div style={{ width: 48, height: 48, borderRadius: 10, background: 'var(--bg-card)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: 'var(--shadow-sm)' }}>
                        <Image size={20} color="var(--primary-400)" />
                      </div>
                    </div>
                  )}

                  <div style={{ position: 'absolute', top: 12, right: 12 }}>
                    <span className={`badge badge-${t.badge}`}>{label(t.labelAr, t.labelEn)}</span>
                  </div>
                  <div style={{ position: 'absolute', top: 12, left: 12 }}>
                    <span className="badge badge-neutral fs-xs">{mediaList.length} {label('وسائط', 'media')}</span>
                  </div>
                </div>

                <div className="card-body">
                  <div className="flex items-start justify-between mb-8">
                    <h3 className="fw-bold fs-md">{ad.title}</h3>
                    <span className={`badge badge-${ad.isActive ? 'success' : 'neutral'}`}>
                      {ad.isActive ? label('نشط', 'Active') : label('موقوف', 'Inactive')}
                    </span>
                  </div>

                  <p className="fs-sm text-muted mb-16" style={{ lineHeight: 1.5, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                    {ad.bodyText || label('لا يوجد نص تفصيلي', 'No description provided')}
                  </p>

                  <div className="flex items-center gap-16 mb-16 fs-xs text-muted">
                    {ad.startDate && (
                      <div className="flex items-center gap-4">
                        <Calendar size={12} />
                        <span>{new Date(ad.startDate).toLocaleDateString()} — {ad.endDate ? new Date(ad.endDate).toLocaleDateString() : 'مستمر'}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-4">
                      <Eye size={12} />
                      <span>{ad.viewsCount?.toLocaleString() || 0}</span>
                    </div>
                  </div>

                  <div className="flex gap-8">
                    <button className="btn btn-secondary btn-sm flex-1" onClick={() => openEdit(ad)}>
                      <Edit size={14} /> {label('تعديل', 'Edit')}
                    </button>
                    <button className="btn btn-ghost btn-sm" style={{ color: ad.isActive ? 'var(--warning)' : 'var(--success)' }} onClick={() => handleToggle(ad)}>
                      {ad.isActive ? <ToggleLeft size={16} /> : <ToggleRight size={16} />}
                    </button>
                    <button className="btn btn-ghost btn-sm" style={{ color: 'var(--danger)' }} onClick={() => handleDelete(ad.id)}>
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
      )}

      {/* Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" style={{ maxWidth: 600, maxHeight: '90vh', overflowY: 'auto' }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="fw-bold">{selectedAd ? label('تعديل الإعلان', 'Edit Ad') : label('إعلان جديد', 'New Ad')}</h3>
              <button className="btn btn-ghost btn-icon" onClick={() => setShowModal(false)} disabled={isSaving}>✕</button>
            </div>
            
            <div className="modal-body flex flex-col gap-4">
              <div className="form-group">
                <label className="form-label">{label('عنوان الإعلان', 'Ad Title')} <span className="required">*</span></label>
                <input 
                  className="form-control" 
                  value={formData.title} 
                  onChange={e => setFormData({...formData, title: e.target.value})} 
                  placeholder={label('مثال: عروض نهاية الموسم', 'e.g. End of season offers')} 
                />
              </div>

              <div className="grid grid-2">
                <div className="form-group">
                  <label className="form-label">{label('الجمهور المستهدف', 'Target Audience')} <span className="required">*</span></label>
                  <select 
                    className="form-control" 
                    value={formData.targetAudience} 
                    onChange={e => setFormData({...formData, targetAudience: e.target.value})}
                  >
                    <option value="all">{label('الجميع (عملاء + مغاسل)', 'All (customers + laundries)')}</option>
                    <option value="customers">{label('العملاء فقط', 'Customers only')}</option>
                    <option value="laundries">{label('المغاسل فقط', 'Laundries only')}</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">{label('رسوم الإعلان', 'Ad Fee')} (SAR)</label>
                  <input 
                    type="number"
                    className="form-control ltr" 
                    value={formData.adFee} 
                    onChange={e => setFormData({...formData, adFee: e.target.value})} 
                    placeholder="0.00" 
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">{label('النص التفصيلي', 'Description')}</label>
                <textarea 
                  className="form-control" 
                  rows={3} 
                  value={formData.bodyText} 
                  onChange={e => setFormData({...formData, bodyText: e.target.value})} 
                  style={{ resize: 'vertical' }} 
                />
              </div>

              <div className="form-group">
                <label className="form-label">{label('رابط الإعلان (اختياري)', 'Ad Link (Optional)')}</label>
                <input 
                  type="url"
                  className="form-control ltr" 
                  value={formData.linkUrl} 
                  onChange={e => setFormData({...formData, linkUrl: e.target.value})} 
                  placeholder="https://example.com" 
                />
              </div>

              {/* Media Upload */}
              <div className="form-group">
                <label className="form-label">{label('الوسائط (صور + فيديو)', 'Media (images + video)')}</label>
                <div style={{ border: '2px dashed var(--border)', borderRadius: 'var(--radius-md)', padding: 24, textAlign: 'center', cursor: 'pointer', background: 'var(--gray-50)', position: 'relative' }}>
                  {uploadingMedia ? (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
                      <Loader className="spinner" size={24} color="var(--primary-500)" />
                      <span className="fs-sm">{label('جاري الرفع...', 'Uploading...')}</span>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center justify-center gap-12 mb-8">
                        <Image size={24} color="var(--text-muted)" />
                        <Video size={24} color="var(--text-muted)" />
                      </div>
                      <p className="fs-sm text-muted">{label('انقر هنا لاختيار الصور والفيديو', 'Click here to select images/videos')}</p>
                      <p className="fs-xs text-muted mt-4">{label('JPG, PNG, GIF, WEBP — حتى 10MB لكل ملف', 'JPG, PNG, GIF, WEBP — up to 10MB per file')}</p>
                      <input 
                        type="file" 
                        multiple 
                        accept="image/*,video/*" 
                        style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', opacity: 0, cursor: 'pointer' }} 
                        onChange={handleFileUpload} 
                      />
                    </>
                  )}
                </div>

                {formData.mediaUrls.length > 0 && (
                  <div className="flex gap-8 mt-12 flex-wrap">
                    {formData.mediaUrls.map((url, i) => {
                      const isVid = typeof url === 'string' && url.match(/\.(mp4|webm|ogg)$/i)
                      return (
                        <div key={i} style={{ width: 60, height: 60, borderRadius: 8, background: 'var(--primary-50)', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', overflow: 'hidden' }}>
                          {isVid ? (
                            <video src={url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} muted />
                          ) : (
                            <img src={url} alt="media" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          )}
                          <button 
                            style={{ position: 'absolute', top: 2, right: 2, width: 20, height: 20, borderRadius: '50%', background: 'var(--danger)', color: 'white', border: 'none', cursor: 'pointer', fontSize: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                            onClick={() => removeMedia(i)}
                          >✕</button>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>

              <div className="grid grid-2">
                <div className="form-group">
                  <label className="form-label">{label('تاريخ البداية', 'Start Date')}</label>
                  <input 
                    type="date" 
                    className="form-control ltr" 
                    value={formData.startDate} 
                    onChange={e => setFormData({...formData, startDate: e.target.value})} 
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">{label('تاريخ الانتهاء', 'End Date')}</label>
                  <input 
                    type="date" 
                    className="form-control ltr" 
                    value={formData.endDate} 
                    onChange={e => setFormData({...formData, endDate: e.target.value})} 
                  />
                </div>
              </div>
            </div>

            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowModal(false)} disabled={isSaving}>{label('إلغاء', 'Cancel')}</button>
              <button className="btn btn-primary" onClick={handleSave} disabled={isSaving || uploadingMedia}>
                {isSaving ? <Loader className="spinner" size={16} /> : label('حفظ الإعلان', 'Save Ad')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

