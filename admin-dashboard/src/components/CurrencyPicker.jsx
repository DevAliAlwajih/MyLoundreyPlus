import { useState, useRef, useEffect } from 'react'
import { Check, ChevronDown, Globe } from 'lucide-react'
import { SUPPORTED_CURRENCIES, getCurrencyMeta } from '../constants/currencies'
import { useTheme } from '../App'

export default function CurrencyPicker({
  selectedCurrency,
  onSelect,
  showAllOption = true,
  className = '',
  buttonStyle = {},
  variant = 'default'
}) {
  const { lang } = useTheme()
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef(null)

  const isRTL = lang === 'ar'
  const label = (ar, en) => (isRTL ? ar : en)

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const currentMeta = selectedCurrency && selectedCurrency !== 'all' ? getCurrencyMeta(selectedCurrency) : null

  return (
    <div
      className={`relative inline-block text-right ${className}`}
      ref={dropdownRef}
      style={{ position: 'relative', direction: isRTL ? 'rtl' : 'ltr' }}
    >
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="btn btn-secondary btn-sm"
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '8px',
          padding: '7px 14px',
          borderRadius: '10px',
          border: '1px solid var(--border)',
          backgroundColor: 'var(--bg-card)',
          color: 'var(--text-primary)',
          cursor: 'pointer',
          fontWeight: 600,
          boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)',
          transition: 'all 0.2s ease',
          ...buttonStyle,
        }}
        title={label('اختر العملة', 'Select Currency')}
      >
        {currentMeta ? (
          <>
            <span style={{ fontSize: '1.05rem', lineHeight: 1 }}>{currentMeta.flag}</span>
            <span style={{ fontWeight: 700 }}>{currentMeta.country}</span>
            <span className="text-muted fs-xs" style={{ opacity: 0.85 }}>({currentMeta.code})</span>
          </>
        ) : (
          <>
            <Globe size={16} style={{ color: 'var(--primary-500)' }} />
            <span>{label('جميع العملات', 'All Currencies')}</span>
          </>
        )}
        <ChevronDown
          size={14}
          className="text-muted"
          style={{
            transform: isOpen ? 'rotate(180deg)' : 'none',
            transition: 'transform 0.2s ease',
            marginRight: isRTL ? '2px' : 0,
            marginLeft: !isRTL ? '2px' : 0,
          }}
        />
      </button>

      {/* Popover / Dropdown Menu */}
      {isOpen && (
        <div
          style={{
            position: 'absolute',
            top: 'calc(100% + 8px)',
            [isRTL ? 'left' : 'right']: 0,
            width: '260px',
            backgroundColor: 'var(--bg-card, #ffffff)',
            border: '1px solid var(--border, #e2e8f0)',
            borderRadius: '14px',
            boxShadow: '0 12px 30px -4px rgba(0, 0, 0, 0.16), 0 4px 12px -2px rgba(0, 0, 0, 0.08)',
            zIndex: 1000,
            overflow: 'hidden',
            fontFamily: 'inherit',
            animation: 'fadeInScale 0.18s ease-out',
          }}
        >
          {/* Header */}
          <div
            style={{
              padding: '12px 16px',
              borderBottom: '1px solid var(--border, #f1f5f9)',
              fontSize: '0.86rem',
              fontWeight: 700,
              color: 'var(--primary-500, #3b82f6)',
              textAlign: isRTL ? 'right' : 'left',
              backgroundColor: 'var(--bg-secondary, #f8fafc)',
              letterSpacing: '0.2px',
            }}
          >
            {label('اختر العملة', 'Select Currency')}
          </div>

          <div style={{ maxHeight: '360px', overflowY: 'auto' }}>
            {/* Optional "All Currencies" Option */}
            {showAllOption && (
              <div
                onClick={() => {
                  onSelect('all')
                  setIsOpen(false)
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '10px 16px',
                  cursor: 'pointer',
                  borderBottom: '1px solid var(--border, #f1f5f9)',
                  backgroundColor: selectedCurrency === 'all' ? 'rgba(59, 130, 246, 0.08)' : 'transparent',
                  borderRight: selectedCurrency === 'all' && isRTL ? '3px solid var(--primary-500, #3b82f6)' : 'none',
                  borderLeft: selectedCurrency === 'all' && !isRTL ? '3px solid var(--primary-500, #3b82f6)' : 'none',
                  transition: 'background-color 0.15s ease',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <Globe size={18} style={{ color: 'var(--primary-500, #3b82f6)' }} />
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '0.86rem' }}>
                      {label('جميع العملات', 'All Currencies')}
                    </div>
                    <div style={{ fontSize: '0.74rem', color: 'var(--text-muted, #94a3b8)' }}>
                      {label('دول الخليج + اليمن', 'GCC + Yemen')}
                    </div>
                  </div>
                </div>
                {selectedCurrency === 'all' && (
                  <Check size={16} style={{ color: 'var(--primary-500, #3b82f6)' }} strokeWidth={2.5} />
                )}
              </div>
            )}

            {/* Supported 7 Currencies Matching Screenshot */}
            {SUPPORTED_CURRENCIES.map((c) => {
              const isSelected = selectedCurrency === c.code
              return (
                <div
                  key={c.code}
                  onClick={() => {
                    onSelect(c.code)
                    setIsOpen(false)
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '11px 16px',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                    backgroundColor: isSelected ? 'rgba(99, 102, 241, 0.09)' : 'transparent',
                    borderRight: isSelected && isRTL ? '3px solid var(--primary-500, #6366f1)' : '3px solid transparent',
                    borderLeft: isSelected && !isRTL ? '3px solid var(--primary-500, #6366f1)' : '3px solid transparent',
                  }}
                  onMouseEnter={(e) => {
                    if (!isSelected) {
                      e.currentTarget.style.backgroundColor = 'var(--bg-secondary, #f8fafc)'
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isSelected) {
                      e.currentTarget.style.backgroundColor = 'transparent'
                    }
                  }}
                >
                  {/* Left: Checkmark (if selected) */}
                  <div
                    style={{
                      width: 22,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    {isSelected && (
                      <Check
                        size={17}
                        style={{ color: 'var(--primary-500, #6366f1)' }}
                        strokeWidth={2.6}
                      />
                    )}
                  </div>

                  {/* Center: Currency Name and Subtitle */}
                  <div
                    style={{
                      flex: 1,
                      textAlign: isRTL ? 'right' : 'left',
                      padding: '0 10px',
                    }}
                  >
                    <div
                      style={{
                        fontWeight: 700,
                        fontSize: '0.88rem',
                        color: 'var(--text-primary, #0f172a)',
                        lineHeight: 1.25,
                      }}
                    >
                      {label(c.nameAr, c.nameEn)}
                    </div>
                    <div
                      style={{
                        fontSize: '0.74rem',
                        color: 'var(--text-muted, #94a3b8)',
                        marginTop: '3px',
                        letterSpacing: '0.3px',
                      }}
                    >
                      {c.subtitleAr || `${c.symbolAr} · ${c.code} · ${c.symbolEn}`}
                    </div>
                  </div>

                  {/* Right: Country Code (SA, AE, QA, KW, OM, BH, YE) */}
                  <div
                    style={{
                      fontSize: '0.98rem',
                      fontWeight: 800,
                      color: 'var(--text-primary, #0f172a)',
                      letterSpacing: '0.5px',
                      flexShrink: 0,
                      minWidth: '24px',
                      textAlign: 'center',
                    }}
                  >
                    {c.country}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
