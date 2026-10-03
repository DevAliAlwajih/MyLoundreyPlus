import { useState, useEffect } from 'react'
import {
  Wallet,
  X,
  CreditCard,
  Banknote,
  Building,
  FileText,
  HelpCircle,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ArrowRight,
  TrendingUp,
  Sparkles,
  Phone,
  MapPin,
  RefreshCw,
  Coins
} from 'lucide-react'
import { useTheme } from '../App'
import { rechargesApi } from '../services/api'

const PAYMENT_METHODS = [
  { id: 'cash', labelAr: 'نقدي (كاش)', labelEn: 'Cash', icon: Banknote, descAr: 'سند قبض نقدي', descEn: 'Cash receipt' },
  { id: 'bank_transfer', labelAr: 'تحويل بنكي', labelEn: 'Bank Transfer', icon: Building, descAr: 'إيداع أو حوالة مصرفية', descEn: 'Bank transfer / deposit' },
  { id: 'electronic', labelAr: 'دفع إلكتروني', labelEn: 'Electronic', icon: CreditCard, descAr: 'مدى / فيزا / بوابة دفع', descEn: 'Mada / Card / Gateway' },
  { id: 'cheque', labelAr: 'شيك بنكي', labelEn: 'Cheque', icon: FileText, descAr: 'شيك مصدق أو عادي', descEn: 'Certified cheque' },
  { id: 'other', labelAr: 'أخرى / تسوية', labelEn: 'Other / Settlement', icon: HelpCircle, descAr: 'تسوية حسابية أو مقاصة', descEn: 'Accounting settlement' },
]

const QUICK_AMOUNTS = [100, 250, 500, 1000, 2500]

export default function RechargeModal({
  isOpen,
  onClose,
  laundry,
  onSuccess,
}) {
  const { lang } = useTheme()
  const label = (ar, en) => (lang === 'ar' ? ar : en)

  const [amount, setAmount] = useState('')
  const [paymentMethod, setPaymentMethod] = useState('bank_transfer')
  const [referenceNumber, setReferenceNumber] = useState('')
  const [notes, setNotes] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')
  const [successData, setSuccessData] = useState(null)

  // Reset form when modal opens or laundry changes
  useEffect(() => {
    if (isOpen) {
      setAmount('')
      setPaymentMethod('bank_transfer')
      setReferenceNumber('')
      setNotes('')
      setErrorMsg('')
      setSuccessData(null)
    }
  }, [isOpen, laundry?.id])

  if (!isOpen || !laundry) return null

  const currentBalance = Number(laundry.balance ?? 0)
  const parsedAmount = parseFloat(amount) || 0
  const expectedBalance = currentBalance + parsedAmount

  // If the laundry owes debt (negative balance), calculate the exact debt clearance amount
  const debtAmount = currentBalance < 0 ? Math.abs(currentBalance) : 0

  const handleQuickAdd = (val) => {
    setAmount(val.toString())
    setErrorMsg('')
  }

  const handlePayFullDebt = () => {
    if (debtAmount > 0) {
      setAmount(debtAmount.toString())
      setNotes(label('سداد كامل المديونية المستحقة', 'Full debt clearance'))
      setErrorMsg('')
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setErrorMsg('')

    if (parsedAmount <= 0) {
      setErrorMsg(label('يرجى إدخال مبلغ صحيح أكبر من صفر', 'Please enter a valid amount greater than 0'))
      return
    }

    setSubmitting(true)
    try {
      const payload = {
        amount: parsedAmount,
        payment_method: paymentMethod,
        reference_number: referenceNumber.trim() || undefined,
        notes: notes.trim() || undefined,
      }

      const res = await rechargesApi.recharge(laundry.id, payload)

      if (res.data?.success) {
        setSuccessData(res.data.data)
        if (onSuccess) {
          onSuccess(res.data.data)
        }
        // Auto close after brief display of success, or allow manual close
        setTimeout(() => {
          onClose()
        }, 1400)
      } else {
        setErrorMsg(res.data?.error?.message || label('فشلت عملية شحن الرصيد', 'Recharge failed'))
      }
    } catch (err) {
      console.error('Recharge error:', err)
      const msg = err.response?.data?.error?.message || 
                  err.response?.data?.message || 
                  label('تعذر تنفيذ العملية. يرجى التحقق من الاتصال بالخادم.', 'Failed to execute recharge. Please check server.')
      setErrorMsg(msg)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose} style={{ zIndex: 1100 }}>
      <div
        className="modal"
        style={{
          maxWidth: 620,
          width: '100%',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          borderRadius: 20,
          border: '1px solid var(--border)',
          overflow: 'hidden',
          boxShadow: '0 25px 50px -12px rgba(10, 30, 80, 0.25)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div
          style={{
            flexShrink: 0,
            background: 'linear-gradient(135deg, var(--bg-card) 0%, var(--bg-page) 100%)',
            borderBottom: '1px solid var(--border)',
            padding: '16px 22px',
            position: 'relative',
          }}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-12">
              <div
                style={{
                  width: 46,
                  height: 46,
                  borderRadius: 14,
                  background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
                  color: '#fff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 8px 16px -4px rgba(16, 185, 129, 0.35)',
                }}
              >
                <Wallet size={24} />
              </div>
              <div>
                <h3 className="fw-bold" style={{ fontSize: '1.2rem', margin: 0 }}>
                  {label('تسجيل دفعة / شحن رصيد المغسلة', 'Record Payment / Recharge Balance')}
                </h3>
                <p className="text-muted fs-xs mt-2 flex items-center gap-6">
                  <span className="fw-semi" style={{ color: 'var(--text-primary)' }}>
                    {laundry.nameAr || laundry.name}
                  </span>
                  {(laundry.phoneNumber || laundry.phone_number) && (
                    <>
                      <span>•</span>
                      <span className="flex items-center gap-2">
                        <Phone size={10} /> {laundry.phoneNumber || laundry.phone_number}
                      </span>
                    </>
                  )}
                  {laundry.city && (
                    <>
                      <span>•</span>
                      <span className="flex items-center gap-2">
                        <MapPin size={10} /> {laundry.city}
                      </span>
                    </>
                  )}
                </p>
              </div>
            </div>

            <button
              type="button"
              className="btn btn-ghost btn-icon"
              onClick={onClose}
              disabled={submitting}
              style={{
                width: 36,
                height: 36,
                borderRadius: 10,
                color: 'var(--text-muted)',
              }}
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Success Overlay Feedback */}
        {successData ? (
          <div className="modal-body text-center py-40" style={{ padding: '40px 24px' }}>
            <div
              style={{
                width: 72,
                height: 72,
                borderRadius: '50%',
                background: 'var(--success-bg)',
                color: 'var(--success)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 16px auto',
                boxShadow: '0 0 0 10px rgba(16, 185, 129, 0.1)',
              }}
            >
              <CheckCircle2 size={40} />
            </div>
            <h3 className="fw-bold text-success fs-xl mb-8">
              {label('تمت إضافة الدفعة وتحديث الرصيد بنجاح!', 'Payment recorded & balance updated successfully!')}
            </h3>
            <p className="text-muted fs-sm mb-20">
              {label(
                `تم إيداع ${successData.amount.toLocaleString()} ر.س في محفظة المغسلة`,
                `Deposited ${successData.amount.toLocaleString()} SAR into the laundry balance`
              )}
            </p>
            <div
              className="flex items-center justify-center gap-24 p-16"
              style={{
                background: 'var(--bg-page)',
                borderRadius: 14,
                border: '1px solid var(--border)',
                maxWidth: 420,
                margin: '0 auto',
              }}
            >
              <div>
                <span className="fs-xs text-muted block">{label('الرصيد السابق', 'Previous')}</span>
                <span className="fw-bold fs-md">{successData.balanceBefore.toLocaleString()} ر.س</span>
              </div>
              <ArrowRight size={18} className="text-muted" style={{ transform: lang === 'ar' ? 'rotate(180deg)' : 'none' }} />
              <div>
                <span className="fs-xs text-muted block">{label('الرصيد الجديد الحالي', 'New Balance')}</span>
                <span className="fw-black fs-lg text-success">+{successData.balanceAfter.toLocaleString()} ر.س</span>
              </div>
            </div>
          </div>
        ) : (
          <form
            onSubmit={handleSubmit}
            style={{
              display: 'flex',
              flexDirection: 'column',
              flex: 1,
              minHeight: 0,
              overflow: 'hidden',
            }}
          >
            <div
              className="modal-body"
              style={{
                padding: '20px 24px',
                overflowY: 'auto',
                flex: 1,
              }}
            >
              {/* Error Banner */}
              {errorMsg && (
                <div
                  className="flex items-center gap-10 mb-16 p-12"
                  style={{
                    background: 'var(--danger-bg)',
                    color: 'var(--danger)',
                    borderRadius: 12,
                    fontSize: '0.85rem',
                    border: '1px solid rgba(239, 68, 68, 0.2)',
                  }}
                >
                  <AlertCircle size={18} style={{ flexShrink: 0 }} />
                  <span>{errorMsg}</span>
                </div>
              )}

              {/* Dynamic Balance Preview Card */}
              <div
                className="mb-20 p-16"
                style={{
                  background: 'linear-gradient(135deg, rgba(30, 111, 255, 0.05) 0%, rgba(16, 185, 129, 0.07) 100%)',
                  borderRadius: 16,
                  border: '1px solid var(--border)',
                }}
              >
                <div className="grid grid-3 gap-12 text-center items-center">
                  {/* Current Balance */}
                  <div
                    style={{
                      background: 'var(--bg-card)',
                      padding: '12px 10px',
                      borderRadius: 12,
                      boxShadow: 'var(--shadow-sm)',
                    }}
                  >
                    <span className="fs-xs text-muted fw-semi block mb-4">
                      {label('الرصيد الحالي', 'Current Balance')}
                    </span>
                    <span
                      className={`fw-black fs-md ${
                        currentBalance > 0
                          ? 'text-success'
                          : currentBalance < 0
                          ? 'text-danger'
                          : 'text-muted'
                      }`}
                    >
                      {currentBalance > 0 ? `+${currentBalance.toLocaleString()}` : currentBalance.toLocaleString()}{' '}
                      <small className="fs-xs font-normal">ر.س</small>
                    </span>
                    <div className="mt-4">
                      <span
                        className="badge"
                        style={{
                          fontSize: '0.65rem',
                          padding: '2px 6px',
                          background: currentBalance >= 0 ? 'var(--success-bg)' : 'var(--danger-bg)',
                          color: currentBalance >= 0 ? 'var(--success)' : 'var(--danger)',
                        }}
                      >
                        {currentBalance > 0
                          ? label('رصيد دائن', 'Credit')
                          : currentBalance < 0
                          ? label('مديونية مستحقة', 'Debt')
                          : label('رصيد صفري', 'Zero')}
                      </span>
                    </div>
                  </div>

                  {/* Added Amount */}
                  <div
                    style={{
                      background: 'var(--bg-card)',
                      padding: '12px 10px',
                      borderRadius: 12,
                      boxShadow: 'var(--shadow-sm)',
                      border: parsedAmount > 0 ? '1px solid rgba(16, 185, 129, 0.4)' : '1px solid transparent',
                    }}
                  >
                    <span className="fs-xs text-muted fw-semi block mb-4">
                      {label('المبلغ المسدد', 'Payment Amount')}
                    </span>
                    <span className="fw-black fs-md" style={{ color: 'var(--primary-600)' }}>
                      +{parsedAmount.toLocaleString()}{' '}
                      <small className="fs-xs font-normal">ر.س</small>
                    </span>
                    <div className="mt-4">
                      <span
                        className="badge"
                        style={{
                          fontSize: '0.65rem',
                          padding: '2px 6px',
                          background: 'var(--primary-50)',
                          color: 'var(--primary-600)',
                        }}
                      >
                        {label('إيداع محفظة', 'Wallet Top-up')}
                      </span>
                    </div>
                  </div>

                  {/* New Balance Preview */}
                  <div
                    style={{
                      background: 'var(--bg-card)',
                      padding: '12px 10px',
                      borderRadius: 12,
                      boxShadow: 'var(--shadow-sm)',
                      border: '1px solid rgba(16, 185, 129, 0.3)',
                    }}
                  >
                    <span className="fs-xs text-muted fw-semi block mb-4">
                      {label('الرصيد بعد السداد', 'Projected Balance')}
                    </span>
                    <span
                      className={`fw-black fs-md ${
                        expectedBalance > 0
                          ? 'text-success'
                          : expectedBalance < 0
                          ? 'text-danger'
                          : 'text-muted'
                      }`}
                    >
                      {expectedBalance > 0 ? `+${expectedBalance.toLocaleString()}` : expectedBalance.toLocaleString()}{' '}
                      <small className="fs-xs font-normal">ر.س</small>
                    </span>
                    <div className="mt-4">
                      <span
                        className="badge"
                        style={{
                          fontSize: '0.65rem',
                          padding: '2px 6px',
                          background: expectedBalance >= 0 ? 'var(--success-bg)' : 'var(--warning-bg)',
                          color: expectedBalance >= 0 ? 'var(--success)' : 'var(--warning)',
                        }}
                      >
                        {expectedBalance >= 0 ? label('حساب إيجابي', 'In Good Standing') : label('متبقي دين', 'Partial Debt')}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Amount Field */}
              <div className="form-group mb-16">
                <div className="flex items-center justify-between mb-6">
                  <label className="form-label mb-0" style={{ fontWeight: 700 }}>
                    {label('مبلغ الدفعة / الشحن', 'Recharge Amount')} <span className="text-danger">*</span>
                  </label>
                  {debtAmount > 0 && (
                    <button
                      type="button"
                      onClick={handlePayFullDebt}
                      className="btn btn-ghost btn-sm"
                      style={{
                        padding: '2px 8px',
                        fontSize: '0.75rem',
                        color: 'var(--danger)',
                        background: 'var(--danger-bg)',
                        borderRadius: 6,
                        height: 'auto',
                      }}
                    >
                      ⚡ {label(`سداد كامل المديونية (${debtAmount} ر.س)`, `Clear full debt (${debtAmount} SAR)`)}
                    </button>
                  )}
                </div>

                <div className="relative" style={{ position: 'relative' }}>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    className="form-control"
                    placeholder="0.00"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    autoFocus
                    required
                    style={{
                      fontSize: '1.25rem',
                      fontWeight: 800,
                      paddingInlineEnd: 70,
                      height: 48,
                      borderRadius: 12,
                      borderColor: parsedAmount > 0 ? 'var(--primary-500)' : undefined,
                    }}
                  />
                  <div
                    style={{
                      position: 'absolute',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      insetInlineEnd: 14,
                      fontWeight: 700,
                      fontSize: '0.85rem',
                      color: 'var(--text-muted)',
                      pointerEvents: 'none',
                    }}
                  >
                    ر.س / SAR
                  </div>
                </div>

                {/* Quick Amount Preset Chips */}
                <div className="flex items-center gap-6 mt-8 flex-wrap">
                  <span className="fs-xs text-muted fw-semi">{label('مبالغ سريعة:', 'Quick amounts:')}</span>
                  {QUICK_AMOUNTS.map((val) => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => handleQuickAdd(val)}
                      className="btn btn-secondary btn-sm"
                      style={{
                        padding: '4px 10px',
                        fontSize: '0.75rem',
                        borderRadius: 8,
                        background: parsedAmount === val ? 'var(--primary-500)' : undefined,
                        color: parsedAmount === val ? '#fff' : undefined,
                        borderColor: parsedAmount === val ? 'var(--primary-500)' : undefined,
                      }}
                    >
                      +{val} ر.س
                    </button>
                  ))}
                </div>
              </div>

              {/* Payment Method Selection */}
              <div className="form-group mb-16">
                <label className="form-label mb-8" style={{ fontWeight: 700 }}>
                  {label('طريقة الدفع / التحصيل', 'Payment Method')} <span className="text-danger">*</span>
                </label>
                <div className="grid grid-2 gap-8" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))' }}>
                  {PAYMENT_METHODS.map((pm) => {
                    const Icon = pm.icon
                    const isSelected = paymentMethod === pm.id
                    return (
                      <div
                        key={pm.id}
                        onClick={() => setPaymentMethod(pm.id)}
                        style={{
                          border: isSelected ? '2px solid var(--primary-500)' : '1px solid var(--border)',
                          background: isSelected ? 'var(--primary-50)' : 'var(--bg-card)',
                          borderRadius: 12,
                          padding: '10px 12px',
                          cursor: 'pointer',
                          transition: 'all 0.15s ease',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 10,
                        }}
                      >
                        <div
                          style={{
                            width: 32,
                            height: 32,
                            borderRadius: 8,
                            background: isSelected ? 'var(--primary-500)' : 'var(--bg-page)',
                            color: isSelected ? '#fff' : 'var(--text-secondary)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0,
                          }}
                        >
                          <Icon size={16} />
                        </div>
                        <div style={{ overflow: 'hidden' }}>
                          <span
                            className="fs-xs fw-bold block"
                            style={{
                              color: isSelected ? 'var(--primary-700)' : 'var(--text-primary)',
                              whiteSpace: 'nowrap',
                              textOverflow: 'ellipsis',
                              overflow: 'hidden',
                            }}
                          >
                            {label(pm.labelAr, pm.labelEn)}
                          </span>
                          <span className="fs-xs text-muted block" style={{ fontSize: '0.65rem' }}>
                            {label(pm.descAr, pm.descEn)}
                          </span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Reference Number & Notes */}
              <div className="grid grid-2 gap-12 mb-8">
                <div className="form-group mb-0">
                  <label className="form-label mb-4 fs-xs fw-semi">
                    {label('رقم الحوالة / السند المرجعي (اختياري)', 'Reference / Receipt No (Optional)')}
                  </label>
                  <input
                    type="text"
                    className="form-control form-control-sm"
                    placeholder={label('مثال: TRX-98214 أو سند #45', 'e.g. TRX-98214 or receipt #45')}
                    value={referenceNumber}
                    onChange={(e) => setReferenceNumber(e.target.value)}
                    style={{ borderRadius: 10 }}
                  />
                </div>

                <div className="form-group mb-0">
                  <label className="form-label mb-4 fs-xs fw-semi">
                    {label('البيان / ملاحظات العملية (اختياري)', 'Statement / Notes (Optional)')}
                  </label>
                  <input
                    type="text"
                    className="form-control form-control-sm"
                    placeholder={label('مثال: سداد عبر بنك الراجحي', 'e.g. Paid via Al Rajhi Bank')}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    style={{ borderRadius: 10 }}
                  />
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div
              className="modal-footer"
              style={{
                flexShrink: 0,
                borderTop: '1px solid var(--border)',
                background: 'var(--bg-page)',
                padding: '14px 24px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'flex-end',
                gap: 12,
              }}
            >
              <button
                type="button"
                className="btn btn-secondary"
                onClick={onClose}
                disabled={submitting}
                style={{ borderRadius: 10 }}
              >
                {label('إلغاء', 'Cancel')}
              </button>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={submitting || parsedAmount <= 0}
                style={{
                  borderRadius: 10,
                  background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
                  border: 'none',
                  boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)',
                  padding: '10px 24px',
                }}
              >
                {submitting ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    <span>{label('جاري التسجيل...', 'Processing...')}</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 size={16} />
                    <span>{label('تأكيد وإيداع الدفعة', 'Confirm & Credit Payment')}</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
