import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth, useTheme } from '../App'
import { Droplets, Phone, Lock, Eye, EyeOff, Sun, Moon, Shield, AlertCircle } from 'lucide-react'

export default function LoginPage() {
  const { login } = useAuth()
  const { theme, toggleTheme } = useTheme()
  const navigate = useNavigate()

  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [showPwd, setShowPwd] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [attempts, setAttempts] = useState(0)
  const MAX_ATTEMPTS = 5

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (attempts >= MAX_ATTEMPTS) {
      setError('تم تجاوز الحد المسموح من المحاولات. يرجى التواصل مع الإدارة.')
      return
    }
    if (!phone || !password) {
      setError('يرجى إدخال رقم الهاتف وكلمة المرور')
      return
    }
    setLoading(true)
    setError('')

    // Simulate API call
    await new Promise(r => setTimeout(r, 1200))

    // Demo: admin / 1234
    if (phone === '0500000001' && password === 'admin1234') {
      login('demo_admin_token_xyz')
      navigate('/')
    } else {
      const newAttempts = attempts + 1
      setAttempts(newAttempts)
      if (newAttempts >= MAX_ATTEMPTS) {
        setError(`تم تجاوز ${MAX_ATTEMPTS} محاولات. يرجى التواصل مع الدعم: 920000000`)
      } else {
        setError(`رقم الهاتف أو كلمة المرور غير صحيحة. المحاولات المتبقية: ${MAX_ATTEMPTS - newAttempts}`)
      }
    }
    setLoading(false)
  }

  return (
    <div className="login-page">
      {/* Background */}
      <div className="login-bg">
        <div className="login-bg-orb orb1" />
        <div className="login-bg-orb orb2" />
        <div className="login-bg-orb orb3" />
      </div>

      {/* Theme Toggle */}
      <button className="btn btn-ghost btn-icon login-theme-btn" onClick={toggleTheme}>
        {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
      </button>

      <div className="login-container">
        {/* Left Panel - Branding */}
        <div className="login-branding">
          <div className="login-logo">
            <Droplets size={40} />
          </div>
          <h1 className="login-brand-title">مغسلتي بلس</h1>
          <p className="login-brand-sub">نظام إدارة المغاسل المتكامل</p>
          <div className="login-features">
            {[
              'إدارة كاملة للمغاسل والاشتراكات',
              'تتبع الفواتير وحالات الغسيل',
              'تحليلات ذكية وتقارير متقدمة',
              'نظام دعم فني متكامل',
            ].map((f, i) => (
              <div key={i} className="login-feature">
                <div className="feature-dot" />
                <span>{f}</span>
              </div>
            ))}
          </div>
          <div className="login-brand-badge">
            <Shield size={14} />
            <span>نظام SaaS آمن ومشفر</span>
          </div>
        </div>

        {/* Right Panel - Form */}
        <div className="login-form-panel">
          <div className="login-card">
            <div className="login-card-header">
              <h2>تسجيل الدخول</h2>
              <p className="text-muted fs-sm mt-4">لوحة إدارة النظام</p>
            </div>

            {attempts >= MAX_ATTEMPTS ? (
              <div className="login-blocked">
                <AlertCircle size={40} color="var(--danger)" />
                <h3 style={{ color: 'var(--danger)' }}>تم حظر تسجيل الدخول</h3>
                <p className="text-muted">تم تجاوز الحد المسموح من المحاولات</p>
                <p className="fw-bold mt-8">للتواصل مع الإدارة:</p>
                <a href="tel:920000000" className="btn btn-primary mt-12" style={{ direction: 'ltr' }}>
                  📞 920 000 000
                </a>
              </div>
            ) : (
              <form className="login-form" onSubmit={handleSubmit}>
                {error && (
                  <div className="alert alert-danger animate-fade">
                    <AlertCircle size={16} />
                    {error}
                  </div>
                )}

                <div className="form-group">
                  <label className="form-label">
                    رقم الهاتف <span className="required">*</span>
                  </label>
                  <div className="input-group">
                    <span className="input-group-addon"><Phone size={16} /></span>
                    <input
                      id="phone"
                      type="tel"
                      className="form-control ltr"
                      placeholder="05XXXXXXXX"
                      value={phone}
                      onChange={e => setPhone(e.target.value)}
                      maxLength={15}
                      autoComplete="tel"
                      dir="ltr"
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">
                    كلمة المرور <span className="required">*</span>
                  </label>
                  <div className="input-group">
                    <span className="input-group-addon"><Lock size={16} /></span>
                    <input
                      id="password"
                      type={showPwd ? 'text' : 'password'}
                      className="form-control ltr"
                      placeholder="••••••••"
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      autoComplete="current-password"
                      dir="ltr"
                    />
                    <button
                      type="button"
                      className="input-group-addon"
                      style={{ cursor: 'pointer', borderRight: '1.5px solid var(--border)', borderLeft: 'none', borderRadius: '0 var(--radius-md) var(--radius-md) 0' }}
                      onClick={() => setShowPwd(s => !s)}
                    >
                      {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                  <div className="form-hint mt-4">
                    <span style={{ color: 'var(--warning)' }}>
                      {attempts > 0 && `⚠️ ${MAX_ATTEMPTS - attempts} محاولة متبقية`}
                    </span>
                  </div>
                </div>

                <button
                  id="login-submit"
                  type="submit"
                  className="btn btn-primary btn-block btn-lg"
                  disabled={loading || attempts >= MAX_ATTEMPTS}
                >
                  {loading ? (
                    <>
                      <span className="animate-spin" style={{ display: 'inline-block', width: 18, height: 18, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: 'white', borderRadius: '50%' }} />
                      جاري تسجيل الدخول...
                    </>
                  ) : 'تسجيل الدخول'}
                </button>

                <div className="login-divider"><span>أو</span></div>

                <div className="login-support">
                  <p className="text-muted fs-sm">نسيت كلمة المرور؟</p>
                  <a href="tel:920000000" className="btn btn-secondary btn-sm">
                    📞 التواصل مع الإدارة
                  </a>
                </div>

                <p className="login-demo text-muted fs-xs text-center mt-16">
                  للتجربة: رقم <code>0500000001</code> / كلمة <code>admin1234</code>
                </p>
              </form>
            )}
          </div>
        </div>
      </div>

      <style>{`
        .login-page {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          position: relative;
          overflow: hidden;
          background: var(--bg-page);
        }
        .login-bg {
          position: absolute;
          inset: 0;
          pointer-events: none;
        }
        .login-bg-orb {
          position: absolute;
          border-radius: 50%;
          filter: blur(80px);
          opacity: 0.25;
        }
        .orb1 { width: 600px; height: 600px; background: var(--primary-500); top: -200px; right: -100px; }
        .orb2 { width: 400px; height: 400px; background: var(--primary-300); bottom: -100px; left: -100px; opacity: 0.15; }
        .orb3 { width: 300px; height: 300px; background: var(--gold); top: 50%; left: 50%; transform: translate(-50%,-50%); opacity: 0.08; }

        .login-theme-btn {
          position: fixed;
          top: 20px;
          left: 20px;
          z-index: 10;
          background: var(--bg-card);
          border: 1px solid var(--border);
          border-radius: var(--radius-full);
          width: 40px; height: 40px;
          box-shadow: var(--shadow-md);
        }

        .login-container {
          display: grid;
          grid-template-columns: 1fr 1fr;
          max-width: 1000px;
          width: 100%;
          margin: 20px;
          background: var(--bg-card);
          border-radius: var(--radius-xl);
          box-shadow: var(--shadow-xl);
          overflow: hidden;
          border: 1px solid var(--border);
          position: relative;
          z-index: 1;
        }

        .login-branding {
          background: linear-gradient(160deg, var(--primary-700), var(--primary-900));
          padding: 48px 40px;
          display: flex;
          flex-direction: column;
          gap: 16px;
          position: relative;
          overflow: hidden;
        }
        .login-branding::before {
          content: '';
          position: absolute;
          inset: 0;
          background: url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.03'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E");
        }

        .login-logo {
          width: 64px; height: 64px;
          background: rgba(255,255,255,0.15);
          border-radius: 20px;
          display: flex; align-items: center; justify-content: center;
          color: white;
          backdrop-filter: blur(8px);
          border: 1px solid rgba(255,255,255,0.2);
          position: relative; z-index: 1;
        }

        .login-brand-title {
          font-size: 2rem; font-weight: 900;
          color: white; position: relative; z-index: 1;
        }

        .login-brand-sub {
          color: rgba(255,255,255,0.65);
          font-size: 0.95rem;
          position: relative; z-index: 1;
          margin-top: -8px;
        }

        .login-features {
          display: flex; flex-direction: column; gap: 12px;
          margin-top: 8px; position: relative; z-index: 1;
        }
        .login-feature {
          display: flex; align-items: center; gap: 10px;
          color: rgba(255,255,255,0.8);
          font-size: 0.875rem;
        }
        .feature-dot {
          width: 8px; height: 8px; border-radius: 50%;
          background: var(--primary-300);
          flex-shrink: 0;
        }

        .login-brand-badge {
          display: inline-flex; align-items: center; gap: 6px;
          background: rgba(255,255,255,0.1);
          color: rgba(255,255,255,0.8);
          padding: 6px 14px;
          border-radius: var(--radius-full);
          font-size: 0.8rem;
          width: fit-content;
          position: relative; z-index: 1;
          margin-top: auto;
          border: 1px solid rgba(255,255,255,0.15);
        }

        .login-form-panel {
          padding: 48px 40px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .login-card { width: 100%; max-width: 400px; }

        .login-card-header { margin-bottom: 28px; }
        .login-card-header h2 { font-size: 1.5rem; font-weight: 800; }

        .login-form { display: flex; flex-direction: column; gap: 4px; }

        .login-divider {
          display: flex; align-items: center; gap: 12px;
          color: var(--text-muted); font-size: 0.8rem;
          margin: 8px 0;
        }
        .login-divider::before, .login-divider::after {
          content: ''; flex: 1; height: 1px; background: var(--border);
        }

        .login-support {
          display: flex; align-items: center; justify-content: space-between;
          gap: 12px;
        }

        .login-blocked {
          display: flex; flex-direction: column;
          align-items: center; gap: 8px;
          padding: 24px; text-align: center;
        }

        @media (max-width: 768px) {
          .login-container { grid-template-columns: 1fr; }
          .login-branding { display: none; }
          .login-form-panel { padding: 32px 24px; }
        }
      `}</style>
    </div>
  )
}
