import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { loginUser, getMe } from '../api'
import { useAuth } from '../context/AuthContext'
import axios from 'axios'

const Login = () => {
  const navigate = useNavigate()
  const { login } = useAuth()
  const [step, setStep] = useState(1)
  const [formData, setFormData] = useState({ email: '', password: '' })
  const [teamChoice, setTeamChoice] = useState(null)
  const [teamName, setTeamName] = useState('')
  const [inviteCode, setInviteCode] = useState('')
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)
  const [token, setToken] = useState(null)
  const [createdTeam, setCreatedTeam] = useState(null)

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value })

  const handleLogin = async (e) => {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      const res = await loginUser(formData)
      const accessToken = res.data.access_token
      localStorage.setItem('token', accessToken)
      const userRes = await getMe()
      const userData = userRes.data
      if (userData.team_id) { login(accessToken, userData); navigate('/dashboard') }
      else { setToken(accessToken); setStep(2) }
    } catch (err) {
      setError(err.response?.data?.detail || 'Login failed. Please check your credentials.')
    } finally { setLoading(false) }
  }

  const handleTeamStep = async () => {
    setError(null)
    setLoading(true)
    try {
      if (teamChoice === 'create' && teamName.trim()) {
        const teamRes = await axios.post('http://localhost:8000/teams/create', { team_name: teamName.trim() }, { headers: { Authorization: `Bearer ${token}` } })
        setCreatedTeam(teamRes.data)
        const userRes = await getMe()
        login(token, userRes.data)
        setStep(3)
        return
      }
      if (teamChoice === 'join' && inviteCode.trim()) {
        await axios.post('http://localhost:8000/teams/join', { invite_code: inviteCode.trim().toUpperCase() }, { headers: { Authorization: `Bearer ${token}` } })
      }
      const userRes = await getMe()
      login(token, userRes.data)
      navigate('/dashboard')
    } catch (err) {
      setError(err.response?.data?.detail || 'Something went wrong. Please try again.')
    } finally { setLoading(false) }
  }

  /* ── Step 3: Team Created ── */
  if (step === 3 && createdTeam) {
    return (
      <div style={s.container}>
        <div style={s.card}>
          <div style={s.successIconWrap}>
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#10B981" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
          </div>
          <h2 style={s.successTitle}>Team Created</h2>
          <p style={s.successSubtitle}>Share this invite code with your teammates</p>
          <div style={s.inviteBox}>
            <span style={s.inviteCode}>{createdTeam.invite_code}</span>
          </div>
          <p style={s.inviteHint}>
            Members can enter this code during sign-up to join <strong style={{ color: '#93C5FD' }}>{createdTeam.team_name}</strong>
          </p>
          <button style={s.button} onClick={() => navigate('/dashboard')}>Go to Dashboard</button>
        </div>
      </div>
    )
  }

  return (
    <div style={s.container}>
      <div style={s.card}>
        {/* Logo */}
        <div style={s.logoWrapper}>
          <div style={s.logoIcon}>P</div>
          <h1 style={s.logo}>Progresso</h1>
        </div>

        {/* Step 1: Credentials */}
        {step === 1 && (
          <>
            <p style={s.subtitle}>Sign in to your account</p>
            {error && <div style={s.error}>{error}</div>}
            <form onSubmit={handleLogin} style={s.form}>
              <div style={s.field}>
                <label style={s.label}>Email Address</label>
                <input style={s.input} type="email" name="email" value={formData.email} onChange={handleChange} placeholder="you@example.com" required />
              </div>
              <div style={s.field}>
                <label style={s.label}>Password</label>
                <input style={s.input} type="password" name="password" value={formData.password} onChange={handleChange} placeholder="Enter your password" required />
              </div>
              <button style={s.button} type="submit" disabled={loading}>
                {loading ? (
                  <span style={s.btnContent}><span style={s.spinner} /> Signing in...</span>
                ) : 'Sign In'}
              </button>
            </form>
            <p style={s.footer}>
              Don't have an account?{' '}
              <Link to="/signup" style={s.link}>Create account</Link>
            </p>
          </>
        )}

        {/* Step 2: Workspace */}
        {step === 2 && (
          <>
            <p style={s.subtitle}>Set up your workspace</p>
            {error && <div style={s.error}>{error}</div>}
            <div style={s.choiceGrid}>
              {[
                { key: 'create', title: 'Create a Team',    desc: 'Start a new team workspace' },
                { key: 'join',   title: 'Join a Team',      desc: 'Enter an invite code'       },
                { key: 'solo',   title: 'Individual',        desc: 'Work on personal projects'  },
              ].map(c => (
                <div
                  key={c.key}
                  style={{ ...s.choiceCard, ...(teamChoice === c.key ? s.choiceCardActive : {}) }}
                  onClick={() => setTeamChoice(c.key)}
                >
                  <span style={s.choiceTitle}>{c.title}</span>
                  <span style={s.choiceDesc}>{c.desc}</span>
                </div>
              ))}
            </div>

            {teamChoice === 'create' && (
              <div style={s.field}>
                <label style={s.label}>Team Name</label>
                <input style={s.input} type="text" placeholder="e.g. Engineering" value={teamName} onChange={(e) => setTeamName(e.target.value)} />
              </div>
            )}
            {teamChoice === 'join' && (
              <div style={s.field}>
                <label style={s.label}>Invite Code</label>
                <input
                  style={{ ...s.input, textTransform: 'uppercase', letterSpacing: '0.25em', textAlign: 'center', fontSize: '1.1rem', fontWeight: '700' }}
                  type="text" placeholder="AX9K2M" maxLength={6}
                  value={inviteCode} onChange={(e) => setInviteCode(e.target.value)}
                />
              </div>
            )}

            <div style={s.stepButtons}>
              <button style={s.backBtn} onClick={() => { setStep(1); setError(null) }}>Back</button>
              <button
                style={{ ...s.button, flex: 1, marginTop: 0, opacity: !teamChoice ? 0.45 : 1 }}
                onClick={handleTeamStep}
                disabled={loading || !teamChoice}
              >
                {loading ? 'Please wait...' : 'Continue'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

const s = {
  container: {
    minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
    backgroundColor: '#0F172A', padding: '1rem',
  },
  card: {
    backgroundColor: '#1E293B', padding: '2.25rem', borderRadius: '14px',
    border: '1px solid #334155', boxShadow: '0 24px 80px rgba(0,0,0,0.5)',
    width: '100%', maxWidth: '420px',
  },
  logoWrapper: { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.65rem', marginBottom: '0.65rem' },
  logoIcon: {
    width: '34px', height: '34px', borderRadius: '9px',
    background: 'linear-gradient(135deg,#3B82F6,#1D4ED8)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    color: '#fff', fontWeight: '800', fontSize: '1rem', boxShadow: '0 4px 14px rgba(59,130,246,0.4)',
  },
  logo: {
    fontSize: '1.6rem', fontWeight: '800', color: '#F1F5F9',
    letterSpacing: '-0.02em', margin: 0,
  },
  subtitle: { textAlign: 'center', color: '#64748B', marginBottom: '1.75rem', fontSize: '0.875rem' },
  error: {
    backgroundColor: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.3)',
    color: '#FCA5A5', padding: '0.65rem 0.9rem', borderRadius: '8px',
    marginBottom: '1rem', fontSize: '0.82rem',
  },
  form: { display: 'flex', flexDirection: 'column', gap: '1rem' },
  field: { display: 'flex', flexDirection: 'column', gap: '0.4rem', marginBottom: '0.25rem' },
  label: { fontSize: '0.78rem', fontWeight: '600', color: '#94A3B8', letterSpacing: '0.03em' },
  input: {
    padding: '0.75rem 0.9rem', borderRadius: '9px', border: '1.5px solid #334155',
    fontSize: '0.9rem', outline: 'none', width: '100%',
    backgroundColor: '#263348', color: '#F1F5F9', transition: 'border-color 0.2s', boxSizing: 'border-box',
  },
  button: {
    width: '100%', padding: '0.85rem',
    background: 'linear-gradient(135deg,#3B82F6,#1D4ED8)', color: '#fff',
    border: 'none', borderRadius: '9px', fontSize: '0.9rem', fontWeight: '600',
    marginTop: '0.5rem', cursor: 'pointer', letterSpacing: '0.01em',
    boxShadow: '0 4px 16px rgba(59,130,246,0.3)',
  },
  btnContent: { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' },
  spinner: {
    width: '13px', height: '13px', border: '2px solid rgba(255,255,255,0.3)',
    borderTop: '2px solid #fff', borderRadius: '50%', display: 'inline-block',
    animation: 'spin 0.8s linear infinite',
  },
  footer: { textAlign: 'center', marginTop: '1.4rem', fontSize: '0.85rem', color: '#64748B' },
  link: { color: '#93C5FD', fontWeight: '600' },
  choiceGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.6rem', marginBottom: '1.25rem' },
  choiceCard: {
    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.3rem',
    padding: '0.9rem 0.4rem', borderRadius: '10px', border: '1.5px solid #334155',
    cursor: 'pointer', backgroundColor: '#263348', transition: 'all 0.15s',
  },
  choiceCardActive: {
    border: '1.5px solid #3B82F6', backgroundColor: 'rgba(59,130,246,0.1)',
    boxShadow: '0 0 16px rgba(59,130,246,0.15)',
  },
  choiceTitle: { fontSize: '0.75rem', fontWeight: '700', color: '#F1F5F9', textAlign: 'center' },
  choiceDesc:  { fontSize: '0.67rem', color: '#64748B', textAlign: 'center' },
  stepButtons: { display: 'flex', gap: '0.6rem', marginTop: '0.5rem' },
  backBtn: {
    padding: '0.85rem 1.1rem', backgroundColor: 'transparent', color: '#94A3B8',
    border: '1.5px solid #334155', borderRadius: '9px', fontSize: '0.875rem', fontWeight: '500', cursor: 'pointer',
  },
  successIconWrap: {
    width: '60px', height: '60px', borderRadius: '50%',
    backgroundColor: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.25)',
    display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem',
  },
  successTitle: { fontSize: '1.3rem', fontWeight: '700', color: '#F1F5F9', textAlign: 'center', marginBottom: '0.4rem' },
  successSubtitle: { textAlign: 'center', color: '#64748B', fontSize: '0.875rem', marginBottom: '1.4rem' },
  inviteBox: {
    background: 'rgba(59,130,246,0.08)', border: '1.5px dashed rgba(59,130,246,0.35)',
    borderRadius: '10px', padding: '1.25rem', textAlign: 'center', marginBottom: '0.85rem',
  },
  inviteCode: { fontSize: '1.9rem', fontWeight: '800', color: '#93C5FD', letterSpacing: '0.3em' },
  inviteHint: { textAlign: 'center', fontSize: '0.82rem', color: '#64748B', marginBottom: '1.5rem' },
}

export default Login