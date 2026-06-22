import { useState } from 'react'
import { Link } from 'react-router-dom'
import { resetPassword } from '../lib/db.js'

export default function ForgotPasswordScreen() {
  const [email, setEmail]     = useState('')
  const [sent, setSent]       = useState(false)
  const [error, setError]     = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    const { error: err } = await resetPassword(email)
    setLoading(false)
    if (err) { setError(err.message); return }
    setSent(true)
  }

  if (sent) {
    return (
      <div className="auth-screen">
        <div className="auth-card">
          <h1 className="auth-title">Check your email</h1>
          <p className="auth-sub">
            We sent a password reset link to <strong>{email}</strong>.
          </p>
          <div className="auth-links" style={{ marginTop: 24 }}>
            <Link to="/login">Back to sign in</Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="auth-screen">
      <div className="auth-card">
        <h1 className="auth-title">Reset password</h1>
        <p className="auth-sub">We'll email you a reset link.</p>

        <form onSubmit={handleSubmit} className="auth-form">
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="auth-input"
          />
          {error && <p className="auth-error">{error}</p>}
          <button type="submit" disabled={loading} className="auth-btn">
            {loading ? 'Sending…' : 'Send reset link'}
          </button>
        </form>

        <div className="auth-links">
          <Link to="/login">Back to sign in</Link>
        </div>
      </div>
    </div>
  )
}
