import { useState, useEffect, useRef } from 'react'
import { useTheme } from '../App'
import {
  MessageSquare, Phone, PhoneCall, PhoneIncoming, PhoneOutgoing,
  Clock, CheckCircle, AlertCircle, User, Store, Send,
  ChevronLeft, Plus, FileText, Image as ImageIcon,
  Paperclip, Loader2, Download, X, ZoomIn, ExternalLink
} from 'lucide-react'
import { chatSupportApi } from '../services/api'
import { toast } from 'react-toastify'

const CALLS = [
  { id: 1, from: 'علي الوجيه', type: 'customer', phone: '+967733322052', direction: 'incoming', duration: '4:32', time: 'منذ ساعتين', note: 'استفسار عن حالة الطلب' },
  { id: 2, from: 'مغسلة النور', type: 'laundry', phone: '+966501234567', direction: 'outgoing', duration: '2:15', time: 'منذ 4 ساعات', note: 'متابعة تجديد الاشتراك' },
]

const formatTime = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export default function SupportPage() {
  const { lang } = useTheme()
  const label = (ar, en) => lang === 'ar' ? ar : en
  const [tab, setTab] = useState('tickets')

  const [conversations, setConversations] = useState([])
  const [loadingConv, setLoadingConv] = useState(false)

  const [selectedConv, setSelectedConv] = useState(null)
  const [messages, setMessages] = useState([])
  const [loadingMessages, setLoadingMessages] = useState(false)
  const [reply, setReply] = useState('')
  const [attachment, setAttachment] = useState(null)
  const [sending, setSending] = useState(false)
  const messagesEndRef = useRef(null)
  const fileInputRef = useRef(null)
  const [lightboxUrl, setLightboxUrl] = useState(null)

  const fetchConversations = async () => {
    try {
      setLoadingConv(true)
      const res = await chatSupportApi.getConversations()
      if (res.data?.success) {
        setConversations(res.data.data)
      }
    } catch (err) {
      console.error('Failed to fetch conversations', err)
      toast.error(label('حدث خطأ في تحميل المحادثات', 'Failed to load conversations'))
    } finally {
      setLoadingConv(false)
    }
  }

  const fetchMessages = async (conv) => {
    try {
      setLoadingMessages(true)
      const res = await chatSupportApi.getMessages(conv.type, conv.targetId, {})
      if (res.data?.success) {
        setMessages(res.data.data)
        // Mark as read
        if (conv.unreadCount > 0) {
          await chatSupportApi.markAsRead(conv.type, conv.targetId)
          fetchConversations()
        }
      }
    } catch (err) {
      console.error('Failed to fetch messages', err)
    } finally {
      setLoadingMessages(false)
    }
  }

  useEffect(() => {
    if (tab === 'tickets') {
      fetchConversations()
      const interval = setInterval(fetchConversations, 30000) // Poll every 30s
      return () => clearInterval(interval)
    }
  }, [tab])

  useEffect(() => {
    if (selectedConv) {
      fetchMessages(selectedConv)
      const interval = setInterval(() => fetchMessages(selectedConv), 15000) // Poll messages
      return () => clearInterval(interval)
    }
  }, [selectedConv])

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages])

  const handleSend = async (e) => {
    e?.preventDefault();
    if (!reply.trim() && !attachment) return;
    if (!selectedConv) return;

    try {
      setSending(true)
      let attachmentUrl = undefined;
      let attachmentType = undefined;

      if (attachment) {
        const uploadRes = await chatSupportApi.uploadAttachment(attachment);
        if (uploadRes.data?.success) {
          attachmentUrl = uploadRes.data.data.url;
          attachmentType = uploadRes.data.data.type;
        } else {
          toast.error(label('فشل رفع الملف', 'Failed to upload attachment'));
          setSending(false);
          return;
        }
      }

      const payload = {};
      if (reply.trim()) payload.message = reply.trim();
      if (attachmentUrl) {
        payload.attachmentUrl = attachmentUrl;
        payload.attachmentType = attachmentType;
      }

      const res = await chatSupportApi.sendMessage(selectedConv.type, selectedConv.targetId, payload)
      if (res.data?.success) {
        setReply('')
        setAttachment(null)
        if (fileInputRef.current) fileInputRef.current.value = '';
        fetchMessages(selectedConv)
        fetchConversations()
      }
    } catch (err) {
      console.error('Failed to send message', err)
      toast.error(label('فشل إرسال الرسالة', 'Failed to send message'))
    } finally {
      setSending(false)
    }
  }

  const unreadTotal = conversations.reduce((sum, c) => sum + (c.unreadCount || 0), 0)

  return (
    <div className="animate-fade" style={{ display: selectedConv ? 'grid' : 'block', gridTemplateColumns: selectedConv ? '1fr 380px' : undefined, gap: 20, alignItems: 'start' }}>
      <div>
        <div className="page-header">
          <div>
            <h1 className="page-title">{label('الدعم الفني', 'Support Center')}</h1>
            <p className="page-subtitle">{label('المحادثات والمكالمات الهاتفية', 'Conversations and phone calls')}</p>
          </div>
        </div>

        <div className="tabs">
          {[['tickets', 'المحادثات', 'Conversations', unreadTotal], ['calls', 'المكالمات', 'Calls', null]].map(([k, ar, en, count]) => (
            <button key={k} className={`tab-btn ${tab === k ? 'active' : ''}`} onClick={() => { setTab(k); setSelectedConv(null); }}>
              {label(ar, en)}
              {count > 0 && <span className="badge badge-danger" style={{ marginRight: 6, fontSize: '0.65rem', padding: '1px 6px' }}>{count}</span>}
            </button>
          ))}
        </div>

        {tab === 'tickets' && (
          <div className="flex flex-col gap-12">
            {loadingConv && conversations.length === 0 ? (
              <div className="flex-center p-20"><Loader2 className="spinner text-primary-500" /></div>
            ) : conversations.length === 0 ? (
              <div className="card p-20 text-center text-muted">{label('لا توجد محادثات', 'No conversations found')}</div>
            ) : (
              conversations.map(c => (
                <div
                  key={c.id}
                  className="card"
                  style={{ cursor: 'pointer', borderRight: selectedConv?.id === c.id ? `3px solid var(--primary-500)` : '' }}
                  onClick={() => setSelectedConv(c)}
                >
                  <div className="card-body" style={{ padding: '16px 20px' }}>
                    <div className="flex items-start justify-between gap-12">
                      <div className="flex items-center gap-12">
                        <div style={{ width: 48, height: 48, borderRadius: 12, background: c.type === 'customer' ? 'var(--primary-50)' : 'var(--success-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, overflow: 'hidden' }}>
                          {c.avatar ? <img src={c.avatar} alt={c.from} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            : c.type === 'customer' ? <User size={20} color="var(--primary-500)" /> : <Store size={20} color="var(--success)" />}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-8 mb-4">
                            <span className="fw-bold fs-md">{c.from}</span>
                            <span className={`badge badge-${c.type === 'customer' ? 'primary' : 'success'}`} style={{ fontSize: '0.65rem' }}>
                              {c.type === 'customer' ? label('عميل', 'Customer') : label('مغسلة', 'Laundry')}
                            </span>
                            {c.unreadCount > 0 && (
                              <span className="badge badge-danger" style={{ fontSize: '0.65rem', borderRadius: '50%', padding: '2px 6px' }}>{c.unreadCount}</span>
                            )}
                          </div>
                          <p className="text-muted fs-sm truncate" style={{ maxWidth: 500 }}>
                            {c.lastMessage?.message || label('مرفق', 'Attachment')}
                          </p>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-8">
                        <span className="text-muted fs-xs">{formatTime(c.lastMessage?.sentAt)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
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
      {selectedConv && (
        <div className="card animate-slide" style={{ position: 'sticky', top: 88, height: 'calc(100vh - 120px)', display: 'flex', flexDirection: 'column' }}>
          <div className="card-header border-bottom">
            <div className="flex items-center gap-10">
              <div style={{ width: 40, height: 40, borderRadius: 10, background: selectedConv.type === 'customer' ? 'var(--primary-50)' : 'var(--success-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                {selectedConv.avatar ? <img src={selectedConv.avatar} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  : selectedConv.type === 'customer' ? <User size={18} color="var(--primary-500)" /> : <Store size={18} color="var(--success)" />}
              </div>
              <div>
                <div className="fw-bold fs-sm">{selectedConv.from}</div>
                <div className="text-muted fs-xs">{selectedConv.type === 'customer' ? label('عميل', 'Customer') : label('مغسلة', 'Laundry')}</div>
              </div>
            </div>
            <button className="btn btn-ghost btn-icon btn-sm" onClick={() => setSelectedConv(null)}>✕</button>
          </div>

          <div style={{ flex: 1, padding: 16, display: 'flex', flexDirection: 'column', gap: 12, overflowY: 'auto', background: 'var(--bg-page)' }}>
            {loadingMessages && messages.length === 0 ? (
              <div className="flex-center h-full"><Loader2 className="spinner text-primary-500" /></div>
            ) : (
              messages.map(msg => {
                const isAdmin = msg.users_chat_messages_sender_idTousers?.role === 'admin'
                return (
                  <div key={msg.id} style={{ display: 'flex', gap: 8, justifyContent: isAdmin ? 'flex-end' : 'flex-start' }}>
                    {!isAdmin && (
                      <div className="avatar-placeholder" style={{ width: 32, height: 32, borderRadius: '50%', fontSize: '0.75rem', flexShrink: 0, background: 'var(--bg-card)', color: 'var(--text-main)', border: '1px solid var(--border)' }}>
                        {selectedConv.from?.[0]}
                      </div>
                    )}
                    <div style={{
                      background: isAdmin ? 'var(--primary-500)' : 'var(--bg-card)',
                      borderRadius: isAdmin ? 'var(--radius-md) 0 var(--radius-md) var(--radius-md)' : '0 var(--radius-md) var(--radius-md) var(--radius-md)',
                      padding: '10px 14px',
                      maxWidth: '80%',
                      border: isAdmin ? 'none' : '1px solid var(--border)',
                      color: isAdmin ? 'white' : 'var(--text-main)'
                    }}>
                      {msg.attachment_url && (
                        <div className="mb-8">
                          {msg.attachment_type === 'image' ? (
                            <div style={{ position: 'relative', cursor: 'pointer', display: 'inline-block' }} onClick={() => setLightboxUrl(msg.attachment_url)}>
                              <img src={msg.attachment_url} alt="Attachment" style={{ maxWidth: '100%', borderRadius: 8, display: 'block' }} />
                              <div style={{
                                position: 'absolute', bottom: 6, right: 6,
                                background: 'rgba(0,0,0,0.55)', borderRadius: 6,
                                width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center'
                              }}>
                                <ZoomIn size={14} color="#fff" />
                              </div>
                            </div>
                          ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                              <a href={msg.attachment_url} target="_blank" rel="noreferrer" style={{ color: isAdmin ? 'white' : 'var(--primary-500)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', borderRadius: 8, background: isAdmin ? 'rgba(255,255,255,0.12)' : 'var(--bg-page)', border: isAdmin ? 'none' : '1px solid var(--border)' }}>
                                <FileText size={20} />
                                <span style={{ flex: 1, fontSize: '0.85rem', fontWeight: 500 }}>{label('ملف PDF', 'PDF File')}</span>
                                <ExternalLink size={14} style={{ opacity: 0.7 }} />
                              </a>
                              <a href={msg.attachment_url} download style={{ color: isAdmin ? 'rgba(255,255,255,0.7)' : 'var(--text-muted)', fontSize: '0.7rem', display: 'flex', alignItems: 'center', gap: 4, textDecoration: 'none' }}>
                                <Download size={12} /> {label('تحميل', 'Download')}
                              </a>
                            </div>
                          )}
                        </div>
                      )}
                      {msg.message && <p className="fs-sm" style={{ whiteSpace: 'pre-wrap' }}>{msg.message}</p>}
                      <p className="fs-xs mt-4" style={{ color: isAdmin ? 'rgba(255,255,255,0.7)' : 'var(--text-muted)' }}>
                        {formatTime(msg.sent_at)} {isAdmin && (msg.is_read ? '✓✓' : '✓')}
                      </p>
                    </div>
                  </div>
                )
              })
            )}
            <div ref={messagesEndRef} />
          </div>

          <div className="card-footer border-top" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {attachment && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', background: 'var(--bg-page)', borderRadius: 8, border: '1px solid var(--border)', width: 'fit-content' }}>
                <Paperclip size={14} className="text-muted" />
                <span className="fs-sm truncate" style={{ maxWidth: 200, direction: 'ltr' }}>{attachment.name}</span>
                <button type="button" className="btn btn-ghost btn-icon btn-sm text-danger" onClick={() => { setAttachment(null); if (fileInputRef.current) fileInputRef.current.value = ''; }} style={{ width: 24, height: 24, minHeight: 24 }}>✕</button>
              </div>
            )}
            <form onSubmit={handleSend} className="flex gap-8 w-full">
              <button 
                type="button" 
                className="btn btn-ghost btn-icon" 
                onClick={() => fileInputRef.current?.click()}
                disabled={sending}
                title={label('إرفاق ملف', 'Attach file')}
              >
                <Paperclip size={20} />
              </button>
              <input 
                type="file" 
                ref={fileInputRef} 
                style={{ display: 'none' }} 
                onChange={(e) => {
                  if (e.target.files?.[0]) setAttachment(e.target.files[0])
                }}
                accept="image/*,application/pdf"
              />
              <input
                className="form-control"
                placeholder={label('اكتب ردك...', 'Write your reply...')}
                value={reply}
                onChange={e => setReply(e.target.value)}
                style={{ flex: 1 }}
                disabled={sending}
              />
              <button type="submit" className="btn btn-primary btn-icon" disabled={(!reply.trim() && !attachment) || sending}>
                {sending ? <Loader2 size={16} className="spinner" /> : <Send size={16} />}
              </button>
            </form>
          </div>
        </div>
      )}
      {/* Image Lightbox Modal */}
      {lightboxUrl && (
        <div
          style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(0,0,0,0.9)', zIndex: 9999,
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          }}
          onClick={() => setLightboxUrl(null)}
        >
          {/* Top bar */}
          <div style={{
            position: 'absolute', top: 0, left: 0, right: 0,
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            padding: '16px 24px', zIndex: 10
          }}>
            <button
              onClick={(e) => { e.stopPropagation(); setLightboxUrl(null); }}
              style={{
                background: 'rgba(255,255,255,0.15)', border: 'none', borderRadius: '50%',
                width: 42, height: 42, display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer', color: '#fff', backdropFilter: 'blur(8px)'
              }}
            >
              <X size={22} />
            </button>
            <a
              href={lightboxUrl}
              download
              onClick={(e) => e.stopPropagation()}
              style={{
                background: 'rgba(255,255,255,0.15)', border: 'none', borderRadius: 12,
                padding: '10px 20px', display: 'flex', alignItems: 'center', gap: 8,
                cursor: 'pointer', color: '#fff', textDecoration: 'none',
                fontSize: '0.85rem', backdropFilter: 'blur(8px)'
              }}
            >
              <Download size={16} /> {label('تحميل الصورة', 'Download Image')}
            </a>
          </div>
          {/* Image */}
          <img
            src={lightboxUrl}
            alt="Preview"
            onClick={(e) => e.stopPropagation()}
            style={{
              maxWidth: '90vw', maxHeight: '85vh',
              objectFit: 'contain', borderRadius: 8,
              boxShadow: '0 8px 40px rgba(0,0,0,0.5)'
            }}
          />
        </div>
      )}
    </div>
  )
}
