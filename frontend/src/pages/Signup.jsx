import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { registerUser, loginUser, getMe } from '../api'
import { useAuth } from '../context/AuthContext'
import axios from 'axios'

const Signup = () => {
  const navigate = useNavigate()
  const { login } = useAuth()
  const [step, setStep] = useState(1)
  const [formData, setFormData] = useState({ username: '', email: '', password: '', confirmPassword: '' })
  const [teamChoice, setTeamChoice] = useState(null)
  const [teamName, setTeamName] = useState('')
  const [inviteCode, setInviteCode] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [createdTeam, setCreatedTeam] = useState(null)

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value })

  const handleStep1 = (e) => {
    e.preventDefault()
    setError('')
    if (formData.password !== formData.confirmPassword) return setError('Passwords do not match.')
    if (formData.password.length < 6) return setError('Password must be at least 6 characters.')
    setStep(2)
  }

  const handleFinish = async () => {
    setError('')
    setLoading(true)
    try {
      await registerUser({ username: formData.username, email: formData.email, password: formData.password })
      const res = await loginUser({ email: formData.email, password: formData.password })
      const token = res.data.access_token
      localStorage.setItem('token', token)

      if (teamChoice === 'create' && teamName.trim()) {
        const teamRes = await axios.post('http://localhost:8000/teams/create', { team_name: teamName.trim() }, { headers: { Authorization: `Bearer ${token}` } })
        setCreatedTeam(teamRes.data)
        setStep(3)
        const userRes = await getMe()
        login(token, userRes.data)
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

        {/* Step indicator */}
        <div style={s.stepIndicator}>
          {[1, 2].map(n => (
            <div key={n} style={s.stepRow}>
              <div style={{ ...s.stepDot, backgroundColor: step >= n ? '#3B82F6' : '#334155' }} />
              {n < 2 && <div style={{ ...s.stepLine, backgroundColor: step > n ? '#3B82F6' : '#334155' }} />}
            </div>
          ))}
        </div>

        {/* Step 1: Account Details */}
        {step === 1 && (
          <>
            <p style={s.subtitle}>Create your account</p>
            {error && <div style={s.error}>{error}</div>}
            <form onSubmit={handleStep1} style={s.form}>
              <div style={s.field}>
                <label style={s.label}>Username</label>
                <input style={s.input} type="text" name="username" value={formData.username} onChange={handleChange} placeholder="Your username" required />
              </div>
              <div style={s.field}>
                <label style={s.label}>Email Address</label>
                <input style={s.input} type="email" name="email" value={formData.email} onChange={handleChange} placeholder="you@example.com" required />
              </div>
              <div style={s.twoCol}>
                <div style={s.field}>
                  <label style={s.label}>Password</label>
                  <input style={s.input} type="password" name="password" value={formData.password} onChange={handleChange} placeholder="Min. 6 characters" required />
                </div>
                <div style={s.field}>
                  <label style={s.label}>Confirm Password</label>
                  <input style={s.input} type="password" name="confirmPassword" value={formData.confirmPassword} onChange={handleChange} placeholder="Repeat password" required />
                </div>
              </div>
              <button style={s.button} type="submit">Continue</button>
            </form>
            <p style={s.footer}>
              Already have an account?{' '}
              <Link to="/login" style={s.link}>Sign in</Link>
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
                { key: 'create', title: 'Create a Team',  desc: 'Start a new team workspace' },
                { key: 'join',   title: 'Join a Team',    desc: 'Enter an invite code'       },
                { key: 'solo',   title: 'Individual',      desc: 'Work on personal projects'  },
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
              <button style={s.backBtn} onClick={() => { setStep(1); setError('') }}>Back</button>
              <button
                style={{ ...s.button, flex: 1, marginTop: 0, opacity: !teamChoice ? 0.45 : 1 }}
                onClick={handleFinish} disabled={loading || !teamChoice}
              >
                {loading ? 'Creating account...' : 'Create Account'}
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
    width: '100%', maxWidth: '460px',
  },
  logoWrapper: { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.65rem', marginBottom: '0.65rem' },
  logoIcon: {
    width: '34px', height: '34px', borderRadius: '9px',
    background: 'linear-gradient(135deg,#3B82F6,#1D4ED8)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    color: '#fff', fontWeight: '800', fontSize: '1rem',
  },
  logo: { fontSize: '1.6rem', fontWeight: '800', color: '#F1F5F9', letterSpacing: '-0.02em', margin: 0 },
  stepIndicator: { display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.1rem' },
  stepRow: { display: 'flex', alignItems: 'center' },
  stepDot: { width: '9px', height: '9px', borderRadius: '50%', transition: 'background 0.3s' },
  stepLine: { width: '36px', height: '2px', transition: 'background 0.3s' },
  subtitle: { textAlign: 'center', color: '#64748B', marginBottom: '1.6rem', fontSize: '0.875rem' },
  error: {
    backgroundColor: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.3)',
    color: '#FCA5A5', padding: '0.65rem 0.9rem', borderRadius: '8px', marginBottom: '1rem', fontSize: '0.82rem',
  },
  form: { display: 'flex', flexDirection: 'column', gap: '0.2rem' },
  twoCol: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.65rem' },
  field: { display: 'flex', flexDirection: 'column', gap: '0.4rem', marginBottom: '0.65rem' },
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
    marginTop: '0.5rem', cursor: 'pointer', boxShadow: '0 4px 14px rgba(59,130,246,0.3)',
  },
  footer: { textAlign: 'center', marginTop: '1.4rem', fontSize: '0.85rem', color: '#64748B' },
  link: { color: '#93C5FD', fontWeight: '600' },
  choiceGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.6rem', marginBottom: '1.25rem' },
  choiceCard: {
    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.3rem',
    padding: '0.9rem 0.4rem', borderRadius: '10px', border: '1.5px solid #334155',
    cursor: 'pointer', backgroundColor: '#263348', transition: 'all 0.15s',
  },
  choiceCardActive: { border: '1.5px solid #3B82F6', backgroundColor: 'rgba(59,130,246,0.1)' },
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

export default Signup