import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './hooks/useAuth.js'

import LoginScreen          from './screens/LoginScreen.jsx'
import SignupScreen         from './screens/SignupScreen.jsx'
import ForgotPasswordScreen from './screens/ForgotPasswordScreen.jsx'
import HomeScreen           from './screens/HomeScreen.jsx'
import AddExpenseScreen     from './screens/AddExpenseScreen.jsx'
import CategoriesScreen     from './screens/CategoriesScreen.jsx'
import SettingsScreen       from './screens/SettingsScreen.jsx'
import HistoryScreen        from './screens/HistoryScreen.jsx'

function RequireAuth({ children }) {
  const { session, loading } = useAuth()
  if (loading) return <div className="splash">Loading…</div>
  if (!session) return <Navigate to="/login" replace />
  return children
}

function RequireGuest({ children }) {
  const { session, loading } = useAuth()
  if (loading) return <div className="splash">Loading…</div>
  if (session) return <Navigate to="/" replace />
  return children
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Guest routes */}
        <Route path="/login"           element={<RequireGuest><LoginScreen /></RequireGuest>} />
        <Route path="/signup"          element={<RequireGuest><SignupScreen /></RequireGuest>} />
        <Route path="/forgot-password" element={<RequireGuest><ForgotPasswordScreen /></RequireGuest>} />

        {/* Protected routes */}
        <Route path="/"           element={<RequireAuth><HomeScreen /></RequireAuth>} />
        <Route path="/add"        element={<RequireAuth><AddExpenseScreen /></RequireAuth>} />
        <Route path="/history"    element={<RequireAuth><HistoryScreen /></RequireAuth>} />
        <Route path="/categories" element={<RequireAuth><CategoriesScreen /></RequireAuth>} />
        <Route path="/settings"   element={<RequireAuth><SettingsScreen /></RequireAuth>} />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
