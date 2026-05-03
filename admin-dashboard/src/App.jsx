import { useState, useEffect, createContext, useContext } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Layout from './components/Layout/Layout'
import LoginPage from './pages/LoginPage'
import DashboardPage from './pages/DashboardPage'
import LaundriesPage from './pages/LaundriesPage'
import CustomersPage from './pages/CustomersPage'
import SubscriptionsPage from './pages/SubscriptionsPage'
import AdsPage from './pages/AdsPage'
import SupportPage from './pages/SupportPage'
import SettingsPage from './pages/SettingsPage'

// ---- Theme Context ----
export const ThemeContext = createContext(null)
export const useTheme = () => useContext(ThemeContext)

// ---- Auth Context ----
export const AuthContext = createContext(null)
export const useAuth = () => useContext(AuthContext)

// ---- Protected Route ----
function ProtectedRoute({ children }) {
  const { isAuthenticated } = useAuth()
  return isAuthenticated ? children : <Navigate to="/login" replace />
}

export default function App() {
  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'light')
  const [lang, setLang] = useState(() => localStorage.getItem('lang') || 'ar')
  const [isAuthenticated, setIsAuthenticated] = useState(() => !!localStorage.getItem('admin_token'))

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    localStorage.setItem('theme', theme)
  }, [theme])

  useEffect(() => {
    document.documentElement.lang = lang
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr'
    localStorage.setItem('lang', lang)
  }, [lang])

  const toggleTheme = () => setTheme(t => t === 'light' ? 'dark' : 'light')
  const toggleLang = () => setLang(l => l === 'ar' ? 'en' : 'ar')

  const login = (token) => {
    localStorage.setItem('admin_token', token)
    setIsAuthenticated(true)
  }
  const logout = () => {
    localStorage.removeItem('admin_token')
    setIsAuthenticated(false)
  }

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, lang, toggleLang }}>
      <AuthContext.Provider value={{ isAuthenticated, login, logout }}>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={
              isAuthenticated ? <Navigate to="/" replace /> : <LoginPage />
            } />
            <Route path="/" element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }>
              <Route index element={<DashboardPage />} />
              <Route path="laundries" element={<LaundriesPage />} />
              <Route path="customers" element={<CustomersPage />} />
              <Route path="subscriptions" element={<SubscriptionsPage />} />
              <Route path="ads" element={<AdsPage />} />
              <Route path="support" element={<SupportPage />} />
              <Route path="settings" element={<SettingsPage />} />
            </Route>
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthContext.Provider>
    </ThemeContext.Provider>
  )
}
