import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { registerUser, loginUser, getMe } from '../api'
import { useAuth } from '../context/AuthContext'
import axios from 'axios'

const Signup = () => {
  const navigate = useNavigate()
  const { login } = useAuth()
  const [step, setStep] = useState(1)
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
  })
  const [teamChoice, setTeamChoice] = useState(null)
  const [teamName, setTeamName] = useState('')
  const [inviteCode, setInviteCode] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [createdTeam, setCreatedTeam] = useState(null)

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleStep1 = (e) => {
    e.preventDefault()
    setError('')
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match')
      return
    }
    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters')
      return
    }
    setStep(2)
  }

  const handleFinish = async () => {
    setError('')
    setLoading(true)
    try {
      await registerUser({
        username: formData.username,
        email: formData.email,
        password: formData.password,
      })
      const res = await loginUser({
        email: formData.email,
        password: formData.password,
      })
      const token = res.data.access_token
      localStorage.setItem('token', token)

      if (teamChoice === 'create' && teamName.trim()) {
        const teamRes = await axios.post(
          'http://localhost:8000/teams/create',
          { team_name: teamName.trim() },
          { headers: { Authorization: `Bearer ${token}` } }
        )
        setCreatedTeam(teamRes.data)
        setStep(3)
        const userRes = await getMe()
        login(token, userRes.data)
        return
      }

      if (teamChoice === 'join' && inviteCode.trim()) {
        await axios.post(
          'http://localhost:8000/teams/join',
          { invite_code: inviteCode.trim().toUpperCase() },
          { headers: { Authorization: `Bearer ${token}` } }
        )
      }

      const userRes = await getMe()
      login(token, userRes.data)
      navigate('/dashboard')
    } catch (err) {
      setError(err.response?.data?.detail || 'Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (step === 3 && createdTeam) {
    return (
      <div style={styles.container}>
        <div style={styles.glowTop} />
        <div style={styles.glowBottom} />
        <div style={styles.card}>
          <div style={styles.successIcon}>🎉</div>
          <h2 style={styles.successTitle}>Team created!</h2>
          <p style={styles.successSubtitle}>
            Share this invite code with your teammates
          </p>
          <div style={styles.inviteBox}>
            <span style={styles.inviteCode}>{createdTeam.invite_code}</span>
          </div>
          <p style={styles.inviteHint}>
            Team members can enter this code during signup to join{' '}
            <strong style={{ color: '#a78bfa' }}>{createdTeam.team_name}</strong>
          </p>
          <button style={styles.button} onClick={() => navigate('/dashboard')}>
            Go to dashboard →
          </button>
        </div>
      </div>
    )
  }

  return (
    <div style={styles.container}>
      <div style={styles.glowTop} />
      <div style={styles.glowBottom} />

      <div style={styles.card}>
        {/* Logo */}
        <div style={styles.logoWrapper}>
          <div style={styles.logoIcon}>P</div>
          <h1 style={styles.logo}>Progresso</h1>
        </div>

        {/* Step indicator */}
        <div style={styles.stepIndicator}>
          {[1, 2].map((s) => (
            <div key={s} style={styles.stepRow}>
              <div style={{
                ...styles.stepDot,
                backgroundColor: step >= s ? '#7c6ef0' : '#2a2a45',
                boxShadow: step >= s ? '0 0 10px rgba(124,110,240,0.5)' : 'none',
              }} />
              {s < 2 && (
                <div style={{
                  ...styles.stepLine,
                  backgroundColor: step > s ? '#7c6ef0' : '#2a2a45',
                }} />
              )}
            </div>
          ))}
        </div>

        {step === 1 && (
          <>
            <p style={styles.subtitle}>Create your account</p>
            {error && <div style={styles.error}>{error}</div>}
            <form onSubmit={handleStep1} style={styles.form}>
              <div style={styles.field}>
                <label style={styles.label}>Username</label>
                <input
                  style={styles.input}
                  type="text"
                  name="username"
                  value={formData.username}
                  onChange={handleChange}
                  placeholder="ayush"
                  required
                />
              </div>
              <div style={styles.field}>
                <label style={styles.label}>Email</label>
                <input
                  style={styles.input}
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="you@example.com"
                  required
                />
              </div>
              <div style={styles.twoCol}>
                <div style={styles.field}>
                  <label style={styles.label}>Password</label>
                  <input
                    style={styles.input}
                    type="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="••••••••"
                    required
                  />
                </div>
                <div style={styles.field}>
                  <label style={styles.label}>Confirm password</label>
                  <input
                    style={styles.input}
                    type="password"
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    placeholder="••••••••"
                    required
                  />
                </div>
              </div>
              <button style={styles.button} type="submit">
                Continue →
              </button>
            </form>
            <p style={styles.footer}>
              Already have an account?{' '}
              <Link to="/login" style={styles.link}>Sign in</Link>
            </p>
          </>
        )}

        {step === 2 && (
          <>
            <p style={styles.subtitle}>Set up your workspace</p>
            {error && <div style={styles.error}>{error}</div>}

            <div style={styles.choiceGrid}>
              {[
                { key: 'create', icon: '👑', title: 'Create a team', desc: 'Start a new workspace' },
                { key: 'join', icon: '🤝', title: 'Join a team', desc: 'Enter an invite code' },
                { key: 'solo', icon: '🧑‍💻', title: 'Just me', desc: 'Individual projects' },
              ].map((c) => (
                <div
                  key={c.key}
                  style={{
                    ...styles.choiceCard,
                    ...(teamChoice === c.key ? styles.choiceCardActive : {}),
                  }}
                  onClick={() => setTeamChoice(c.key)}
                >
                  <span style={styles.choiceIcon}>{c.icon}</span>
                  <span style={styles.choiceTitle}>{c.title}</span>
                  <span style={styles.choiceDesc}>{c.desc}</span>
                </div>
              ))}
            </div>

            {teamChoice === 'create' && (
              <div style={styles.field}>
                <label style={styles.label}>Team name</label>
                <input
                  style={styles.input}
                  type="text"
                  placeholder="e.g. Dev Squad"
                  value={teamName}
                  onChange={(e) => setTeamName(e.target.value)}
                />
              </div>
            )}

            {teamChoice === 'join' && (
              <div style={styles.field}>
                <label style={styles.label}>Invite code</label>
                <input
                  style={{
                    ...styles.input,
                    textTransform: 'uppercase',
                    letterSpacing: '0.25em',
                    textAlign: 'center',
                    fontSize: '1.1rem',
                    fontWeight: '700',
                  }}
                  type="text"
                  placeholder="AX9K2M"
                  maxLength={6}
                  value={inviteCode}
                  onChange={(e) => setInviteCode(e.target.value)}
                />
              </div>
            )}

            <div style={styles.stepButtons}>
              <button
                style={styles.backBtn}
                onClick={() => { setStep(1); setError('') }}
              >
                ← Back
              </button>
              <button
                style={{
                  ...styles.button,
                  flex: 1,
                  marginTop: 0,
                  opacity: !teamChoice ? 0.4 : 1,
                }}
                onClick={handleFinish}
                disabled={loading || !teamChoice}
              >
                {loading ? 'Creating account...' : 'Create account →'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

const styles = {
  container: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0f0f1a',
    padding: '1rem',
    position: 'relative',
    overflow: 'hidden',
  },
  glowTop: {
    position: 'absolute',
    top: '-200px',
    left: '50%',
    transform: 'translateX(-50%)',
    width: '600px',
    height: '600px',
    borderRadius: '50%',
    background: 'radial-gradient(circle, rgba(124,110,240,0.15) 0%, transparent 70%)',
    pointerEvents: 'none',
  },
  glowBottom: {
    position: 'absolute',
    bottom: '-200px',
    right: '-100px',
    width: '400px',
    height: '400px',
    borderRadius: '50%',
    background: 'radial-gradient(circle, rgba(124,110,240,0.08) 0%, transparent 70%)',
    pointerEvents: 'none',
  },
  card: {
    backgroundColor: '#1a1a2e',
    padding: '2.5rem',
    borderRadius: '16px',
    border: '1px solid #2a2a45',
    boxShadow: '0 24px 80px rgba(0,0,0,0.5)',
    width: '100%',
    maxWidth: '480px',
    position: 'relative',
    zIndex: 1,
  },
  logoWrapper: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '0.75rem',
    marginBottom: '0.75rem',
  },
  logoIcon: {
    width: '36px',
    height: '36px',
    borderRadius: '10px',
    background: 'linear-gradient(135deg, #7c6ef0, #5b4fcf)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#fff',
    fontWeight: '800',
    fontSize: '1.1rem',
    boxShadow: '0 4px 16px rgba(124,110,240,0.4)',
  },
  logo: {
    fontSize: '1.8rem',
    fontWeight: '800',
    background: 'linear-gradient(135deg, #a78bfa, #7c6ef0)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    margin: 0,
  },
  stepIndicator: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 0,
    marginBottom: '1.25rem',
    marginTop: '0.5rem',
  },
  stepRow: {
    display: 'flex',
    alignItems: 'center',
  },
  stepDot: {
    width: '10px',
    height: '10px',
    borderRadius: '50%',
    transition: 'all 0.3s',
  },
  stepLine: {
    width: '40px',
    height: '2px',
    transition: 'background-color 0.3s',
  },
  subtitle: {
    textAlign: 'center',
    color: '#8b8bab',
    marginBottom: '1.75rem',
    fontSize: '0.9rem',
  },
  error: {
    backgroundColor: 'rgba(248,113,113,0.1)',
    border: '1px solid rgba(248,113,113,0.3)',
    color: '#f87171',
    padding: '0.75rem 1rem',
    borderRadius: '8px',
    marginBottom: '1rem',
    fontSize: '0.875rem',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.25rem',
  },
  twoCol: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '0.75rem',
  },
  field: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem',
    marginBottom: '0.75rem',
  },
  label: {
    fontSize: '0.85rem',
    fontWeight: '500',
    color: '#8b8bab',
    letterSpacing: '0.02em',
  },
  input: {
    padding: '0.8rem 1rem',
    borderRadius: '10px',
    border: '1.5px solid #2a2a45',
    fontSize: '0.95rem',
    outline: 'none',
    width: '100%',
    backgroundColor: '#12122a',
    color: '#f0f0ff',
    boxSizing: 'border-box',
  },
  button: {
    width: '100%',
    padding: '0.9rem',
    background: 'linear-gradient(135deg, #7c6ef0, #5b4fcf)',
    color: '#ffffff',
    border: 'none',
    borderRadius: '10px',
    fontSize: '0.95rem',
    fontWeight: '600',
    marginTop: '0.5rem',
    cursor: 'pointer',
    boxShadow: '0 4px 20px rgba(124,110,240,0.35)',
    letterSpacing: '0.02em',
  },
  footer: {
    textAlign: 'center',
    marginTop: '1.5rem',
    fontSize: '0.875rem',
    color: '#8b8bab',
  },
  link: {
    color: '#a78bfa',
    fontWeight: '600',
    textDecoration: 'none',
  },
  choiceGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr 1fr',
    gap: '0.75rem',
    marginBottom: '1.5rem',
  },
  choiceCard: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '0.35rem',
    padding: '1rem 0.5rem',
    borderRadius: '12px',
    border: '1.5px solid #2a2a45',
    cursor: 'pointer',
    backgroundColor: '#12122a',
    transition: 'all 0.2s',
  },
  choiceCardActive: {
    border: '1.5px solid #7c6ef0',
    backgroundColor: 'rgba(124,110,240,0.12)',
    boxShadow: '0 0 20px rgba(124,110,240,0.15)',
  },
  choiceIcon: { fontSize: '1.4rem' },
  choiceTitle: {
    fontSize: '0.78rem',
    fontWeight: '600',
    color: '#f0f0ff',
    textAlign: 'center',
  },
  choiceDesc: {
    fontSize: '0.7rem',
    color: '#8b8bab',
    textAlign: 'center',
  },
  stepButtons: {
    display: 'flex',
    gap: '0.75rem',
    marginTop: '0.5rem',
  },
  backBtn: {
    padding: '0.9rem 1.25rem',
    backgroundColor: 'transparent',
    color: '#8b8bab',
    border: '1.5px solid #2a2a45',
    borderRadius: '10px',
    fontSize: '0.9rem',
    fontWeight: '500',
    cursor: 'pointer',
  },
  successIcon: {
    fontSize: '3rem',
    textAlign: 'center',
    marginBottom: '1rem',
  },
  successTitle: {
    fontSize: '1.4rem',
    fontWeight: '700',
    color: '#f0f0ff',
    textAlign: 'center',
    marginBottom: '0.5rem',
  },
  successSubtitle: {
    textAlign: 'center',
    color: '#8b8bab',
    fontSize: '0.9rem',
    marginBottom: '1.5rem',
  },
  inviteBox: {
    background: 'rgba(124,110,240,0.1)',
    border: '2px dashed #7c6ef0',
    borderRadius: '12px',
    padding: '1.5rem',
    textAlign: 'center',
    marginBottom: '1rem',
  },
  inviteCode: {
    fontSize: '2rem',
    fontWeight: '800',
    color: '#a78bfa',
    letterSpacing: '0.3em',
  },
  inviteHint: {
    textAlign: 'center',
    fontSize: '0.85rem',
    color: '#8b8bab',
    marginBottom: '1.5rem',
  },
}

export default Signup