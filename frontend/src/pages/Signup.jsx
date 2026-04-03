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
            Team members can enter this code during signup to join <strong>{createdTeam.team_name}</strong>
          </p>
          <button style={styles.button} onClick={() => navigate('/dashboard')}>
            Go to dashboard
          </button>
        </div>
      </div>
    )
  }

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h1 style={styles.logo}>Progresso</h1>

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
              <button style={styles.button} type="submit">
                Continue
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
              <div
                style={{
                  ...styles.choiceCard,
                  ...(teamChoice === 'create' ? styles.choiceCardActive : {}),
                }}
                onClick={() => setTeamChoice('create')}
              >
                <span style={styles.choiceIcon}>👑</span>
                <span style={styles.choiceTitle}>Create a team</span>
                <span style={styles.choiceDesc}>Start a new workspace</span>
              </div>

              <div
                style={{
                  ...styles.choiceCard,
                  ...(teamChoice === 'join' ? styles.choiceCardActive : {}),
                }}
                onClick={() => setTeamChoice('join')}
              >
                <span style={styles.choiceIcon}>🤝</span>
                <span style={styles.choiceTitle}>Join a team</span>
                <span style={styles.choiceDesc}>Enter an invite code</span>
              </div>

              <div
                style={{
                  ...styles.choiceCard,
                  ...(teamChoice === 'solo' ? styles.choiceCardActive : {}),
                }}
                onClick={() => setTeamChoice('solo')}
              >
                <span style={styles.choiceIcon}>🧑‍💻</span>
                <span style={styles.choiceTitle}>Just me</span>
                <span style={styles.choiceDesc}>Individual projects</span>
              </div>
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
                  style={{ ...styles.input, textTransform: 'uppercase', letterSpacing: '0.2em' }}
                  type="text"
                  placeholder="e.g. AX9K2M"
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
                Back
              </button>
              <button
                style={{
                  ...styles.button,
                  flex: 1,
                  opacity: !teamChoice ? 0.5 : 1,
                }}
                onClick={handleFinish}
                disabled={loading || !teamChoice}
              >
                {loading ? 'Creating account...' : 'Create account'}
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
    backgroundColor: '#f0f2f5',
    padding: '1rem',
  },
  card: {
    backgroundColor: '#ffffff',
    padding: '2.5rem',
    borderRadius: '12px',
    boxShadow: '0 4px 24px rgba(0,0,0,0.08)',
    width: '100%',
    maxWidth: '440px',
  },
  logo: {
    fontSize: '2rem',
    fontWeight: '700',
    color: '#5b4fcf',
    textAlign: 'center',
    marginBottom: '0.5rem',
  },
  subtitle: {
    textAlign: 'center',
    color: '#6b7280',
    marginBottom: '2rem',
    fontSize: '0.95rem',
  },
  error: {
    backgroundColor: '#fee2e2',
    color: '#dc2626',
    padding: '0.75rem 1rem',
    borderRadius: '8px',
    marginBottom: '1rem',
    fontSize: '0.9rem',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1.25rem',
  },
  field: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.4rem',
    marginBottom: '1rem',
  },
  label: {
    fontSize: '0.9rem',
    fontWeight: '500',
    color: '#374151',
  },
  input: {
    padding: '0.75rem 1rem',
    borderRadius: '8px',
    border: '1.5px solid #e5e7eb',
    fontSize: '0.95rem',
    outline: 'none',
    width: '100%',
  },
  button: {
    width: '100%',
    padding: '0.85rem',
    backgroundColor: '#5b4fcf',
    color: '#ffffff',
    border: 'none',
    borderRadius: '8px',
    fontSize: '1rem',
    fontWeight: '600',
    marginTop: '0.5rem',
    cursor: 'pointer',
  },
  footer: {
    textAlign: 'center',
    marginTop: '1.5rem',
    fontSize: '0.9rem',
    color: '#6b7280',
  },
  link: {
    color: '#5b4fcf',
    fontWeight: '500',
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
    gap: '0.3rem',
    padding: '1rem 0.5rem',
    borderRadius: '10px',
    border: '1.5px solid #e5e7eb',
    cursor: 'pointer',
    transition: 'all 0.15s',
  },
  choiceCardActive: {
    border: '1.5px solid #5b4fcf',
    backgroundColor: '#f5f3ff',
  },
  choiceIcon: {
    fontSize: '1.5rem',
  },
  choiceTitle: {
    fontSize: '0.8rem',
    fontWeight: '600',
    color: '#374151',
    textAlign: 'center',
  },
  choiceDesc: {
    fontSize: '0.72rem',
    color: '#9ca3af',
    textAlign: 'center',
  },
  stepButtons: {
    display: 'flex',
    gap: '0.75rem',
    marginTop: '0.5rem',
  },
  backBtn: {
    padding: '0.85rem 1.25rem',
    backgroundColor: 'transparent',
    color: '#6b7280',
    border: '1.5px solid #e5e7eb',
    borderRadius: '8px',
    fontSize: '0.95rem',
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
    color: '#1a1a2e',
    textAlign: 'center',
    marginBottom: '0.5rem',
  },
  successSubtitle: {
    textAlign: 'center',
    color: '#6b7280',
    fontSize: '0.95rem',
    marginBottom: '1.5rem',
  },
  inviteBox: {
    backgroundColor: '#f5f3ff',
    border: '2px dashed #5b4fcf',
    borderRadius: '12px',
    padding: '1.5rem',
    textAlign: 'center',
    marginBottom: '1rem',
  },
  inviteCode: {
    fontSize: '2rem',
    fontWeight: '700',
    color: '#5b4fcf',
    letterSpacing: '0.3em',
  },
  inviteHint: {
    textAlign: 'center',
    fontSize: '0.85rem',
    color: '#6b7280',
    marginBottom: '1.5rem',
  },
}

export default Signup