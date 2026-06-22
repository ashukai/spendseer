import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { signUp } from '../lib/db.js'

export default function SignupScreen() {
  const navigate = useNavigate()
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [error, setError]       = useState('')
  const [loading, setLoading]   = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    if (password.length < 8) {
      setError('Password must be at least 8 characters')
      return
    }
    setLoading(true)
    const { error: err } = await signUp(email, password)
    setLoading(false)
    if (err) { setError(err.message); return }
    // No email confirmation — user is signed in immediately
    navigate('/', { replace: true })
  }

  return (
    <div className="auth-screen">
      <div className="auth-card">
        <h1 className="auth-title">Budgeta</h1>
        <p className="auth-sub">Create your account</p>

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
            placeholder="Password (min 8 chars)"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="auth-input"
          />
          {error && <p className="auth-error">{error}</p>}
          <button type="submit" disabled={loading} className="auth-btn">
            {loading ? 'Creating account…' : 'Create account'}
          </button>
        </form>

        <div className="auth-links">
          <Link to="/login">Already have an account? Sign in</Link>
        </div>
      </div>
    </div>
  )
}
