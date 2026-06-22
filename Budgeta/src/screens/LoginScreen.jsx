import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { signIn } from '../lib/db.js'

export default function LoginScreen() {
  const navigate = useNavigate()
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [error, setError]       = useState('')
  const [loading, setLoading]   = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    const { error: err } = await signIn(email, password)
    setLoading(false)
    if (err) { setError(err.message); return }
    navigate('/', { replace: true })
  }

  return (
    <div className="auth-screen">
      <div className="auth-card">
        <h1 className="auth-title">Budgeta</h1>
        <p className="auth-sub">Track spending in any currency</p>

        <form onSubmit={handleSubmit} className="auth-form">
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="auth-input"
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="auth-input"
          />
          {error && <p className="auth-error">{error}</p>}
          <button type="submit" disabled={loading} className="auth-btn">
            {loading ? 'Signing in…' : 'Sign in'}
          </button>
        </form>

        <div className="auth-links">
          <Link to="/forgot-password">Forgot password?</Link>
          <span>·</span>
          <Link to="/signup">Create account</Link>
        </div>
      </div>
    </div>
  )
}
