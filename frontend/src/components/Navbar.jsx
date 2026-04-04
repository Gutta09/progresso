import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { createTeam, getUnreadCount } from '../api'
import NotificationPanel from './NotificationPanel'

const Navbar = () => {
  const { user, logout, workspace, switchWorkspace } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [showSwitcher, setShowSwitcher] = useState(false)
  const [showCreateTeam, setShowCreateTeam] = useState(false)
  const [newTeamName, setNewTeamName] = useState('')
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState('')
  const [showNotifications, setShowNotifications] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)

  useEffect(() => {
    if (!user?.team_id) return
    fetchUnreadCount()
    const interval = setInterval(fetchUnreadCount, 30000)
    return () => clearInterval(interval)
  }, [user])

  const fetchUnreadCount = async () => {
    try {
      const lastSeen = localStorage.getItem('notifications_last_seen')
      const data = await getUnreadCount(lastSeen)
      setUnreadCount(data.count)
    } catch (err) {}
  }

  const handleBellClick = () => {
    localStorage.setItem('notifications_last_seen', new Date().toISOString())
    setUnreadCount(0)
    setShowNotifications(!showNotifications)
  }

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const handleSwitchWorkspace = (type) => {
    switchWorkspace(type)
    setShowSwitcher(false)
    navigate('/dashboard')
  }

  const handleCreateTeam = async () => {
    if (!newTeamName.trim()) return
    setCreating(true)
    setError('')
    try {
      await createTeam({ team_name: newTeamName.trim() })
      switchWorkspace('team')
      setShowCreateTeam(false)
      setShowSwitcher(false)
      navigate('/dashboard')
      window.location.reload()
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to create team')
    } finally {
      setCreating(false)
    }
  }

  const workspaceLabel = workspace === 'team' ? '👥 Team' : '🧑‍💻 Individual'
  const isMyTasks = location.pathname === '/my-tasks'

  return (
    <>
      <nav style={styles.nav}>
        {/* Left — Logo */}
        <div style={styles.left}>
          <div style={styles.logoWrapper} onClick={() => navigate('/dashboard')}>
            <div style={styles.logoIcon}>P</div>
            <span style={styles.logo}>Progresso</span>
          </div>
        </div>

        {/* Right — Actions */}
        <div style={styles.right}>

          {/* Workspace Switcher */}
          <div style={styles.workspaceSwitcher}>
            <button
              style={styles.workspaceBtn}
              onClick={() => setShowSwitcher(!showSwitcher)}
            >
              {workspaceLabel}
              <span style={{
                ...styles.chevron,
                transform: showSwitcher ? 'rotate(180deg)' : 'rotate(0deg)',
                transition: 'transform 0.2s',
              }}>▾</span>
            </button>

            {showSwitcher && (
              <div style={styles.dropdown}>
                <p style={styles.dropdownLabel}>Switch workspace</p>

                {[
                  { key: 'team', icon: '👥', title: 'Team workspace', desc: "View your team's boards" },
                  { key: 'individual', icon: '🧑‍💻', title: 'Individual workspace', desc: 'View your personal boards' },
                ].map((w) => (
                  <div
                    key={w.key}
                    style={{
                      ...styles.dropdownItem,
                      ...(workspace === w.key ? styles.dropdownItemActive : {}),
                    }}
                    onClick={() => handleSwitchWorkspace(w.key)}
                  >
                    <span style={styles.dropdownIcon}>{w.icon}</span>
                    <div>
                      <p style={styles.dropdownItemTitle}>{w.title}</p>
                      <p style={styles.dropdownItemDesc}>{w.desc}</p>
                    </div>
                    {workspace === w.key && <span style={styles.activeCheck}>✓</span>}
                  </div>
                ))}

                <div style={styles.dropdownDivider} />

                <div
                  style={styles.dropdownItem}
                  onClick={() => {
                    setShowCreateTeam(true)
                    setShowSwitcher(false)
                  }}
                >
                  <span style={styles.dropdownIcon}>👑</span>
                  <div>
                    <p style={styles.dropdownItemTitle}>Create new team</p>
                    <p style={styles.dropdownItemDesc}>Start a new workspace</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* My Tasks */}
          <button
            style={{
              ...styles.navBtn,
              ...(isMyTasks ? styles.navBtnActive : {}),
            }}
            onClick={() => navigate('/my-tasks')}
          >
            ✅ My Tasks
          </button>

          {/* Notification Bell */}
          {user?.team_id && (
            <div style={styles.bellWrapper}>
              <button style={styles.bellBtn} onClick={handleBellClick}>
                <span style={styles.bellIcon}>🔔</span>
                {unreadCount > 0 && (
                  <span style={styles.badge}>
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </span>
                )}
              </button>
              {showNotifications && (
                <NotificationPanel onClose={() => setShowNotifications(false)} />
              )}
            </div>
          )}

          {/* Divider */}
          <div style={styles.divider} />

          {/* Profile */}
          <div
            style={styles.profileBtn}
            onClick={() => navigate('/profile')}
            title="Edit profile"
          >
            <div style={styles.avatar}>
              {user?.username?.charAt(0).toUpperCase()}
            </div>
            <span style={styles.username}>{user?.username}</span>
          </div>

          {/* Logout */}
          <button style={styles.logoutBtn} onClick={handleLogout}>
            Logout
          </button>
        </div>
      </nav>

      {showSwitcher && (
        <div style={styles.overlay} onClick={() => setShowSwitcher(false)} />
      )}

      {/* Create Team Modal */}
      {showCreateTeam && (
        <div style={styles.modalOverlay}>
          <div style={styles.modal}>
            <div style={styles.modalHeader}>
              <h3 style={styles.modalTitle}>Create a new team</h3>
              <button
                style={styles.modalClose}
                onClick={() => { setShowCreateTeam(false); setError(''); setNewTeamName('') }}
              >✕</button>
            </div>
            {error && <div style={styles.modalError}>{error}</div>}
            <label style={styles.modalLabel}>Team name</label>
            <input
              style={styles.modalInput}
              type="text"
              placeholder="e.g. Dev Squad"
              value={newTeamName}
              onChange={(e) => setNewTeamName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleCreateTeam()}
              autoFocus
            />
            <div style={styles.modalActions}>
              <button
                style={styles.cancelBtn}
                onClick={() => { setShowCreateTeam(false); setError(''); setNewTeamName('') }}
              >
                Cancel
              </button>
              <button
                style={styles.createBtn}
                onClick={handleCreateTeam}
                disabled={creating}
              >
                {creating ? 'Creating...' : 'Create team →'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

const styles = {
  nav: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '0 2rem',
    height: '60px',
    backgroundColor: 'rgba(26, 26, 46, 0.85)',
    backdropFilter: 'blur(12px)',
    WebkitBackdropFilter: 'blur(12px)',
    borderBottom: '1px solid #2a2a45',
    position: 'sticky',
    top: 0,
    zIndex: 100,
  },
  left: { display: 'flex', alignItems: 'center' },
  logoWrapper: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.6rem',
    cursor: 'pointer',
  },
  logoIcon: {
    width: '28px',
    height: '28px',
    borderRadius: '8px',
    background: 'linear-gradient(135deg, #7c6ef0, #5b4fcf)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#fff',
    fontWeight: '800',
    fontSize: '0.85rem',
    boxShadow: '0 2px 8px rgba(124,110,240,0.4)',
  },
  logo: {
    fontSize: '1.2rem',
    fontWeight: '800',
    background: 'linear-gradient(135deg, #a78bfa, #7c6ef0)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
  },
  right: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
  },
  workspaceSwitcher: { position: 'relative' },
  workspaceBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.4rem',
    padding: '0.4rem 0.9rem',
    backgroundColor: 'rgba(124,110,240,0.12)',
    color: '#a78bfa',
    border: '1px solid rgba(124,110,240,0.3)',
    borderRadius: '8px',
    fontSize: '0.85rem',
    fontWeight: '500',
    cursor: 'pointer',
  },
  chevron: {
    fontSize: '0.7rem',
    display: 'inline-block',
  },
  dropdown: {
    position: 'absolute',
    top: 'calc(100% + 10px)',
    right: 0,
    backgroundColor: '#1a1a2e',
    borderRadius: '12px',
    boxShadow: '0 16px 48px rgba(0,0,0,0.5)',
    border: '1px solid #2a2a45',
    padding: '0.6rem',
    width: '250px',
    zIndex: 200,
  },
  dropdownLabel: {
    fontSize: '0.7rem',
    fontWeight: '600',
    color: '#4a4a6a',
    textTransform: 'uppercase',
    letterSpacing: '0.08em',
    padding: '0.25rem 0.6rem',
    marginBottom: '0.25rem',
  },
  dropdownItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    padding: '0.6rem 0.75rem',
    borderRadius: '8px',
    cursor: 'pointer',
  },
  dropdownItemActive: {
    backgroundColor: 'rgba(124,110,240,0.12)',
  },
  dropdownIcon: { fontSize: '1.1rem' },
  dropdownItemTitle: {
    fontSize: '0.85rem',
    fontWeight: '600',
    color: '#f0f0ff',
    margin: 0,
  },
  dropdownItemDesc: {
    fontSize: '0.72rem',
    color: '#8b8bab',
    margin: 0,
  },
  activeCheck: {
    marginLeft: 'auto',
    color: '#7c6ef0',
    fontWeight: '700',
    fontSize: '0.85rem',
  },
  dropdownDivider: {
    height: '1px',
    backgroundColor: '#2a2a45',
    margin: '0.5rem 0',
  },
  overlay: { position: 'fixed', inset: 0, zIndex: 99 },
  navBtn: {
    padding: '0.4rem 0.9rem',
    backgroundColor: 'transparent',
    color: '#8b8bab',
    border: '1px solid #2a2a45',
    borderRadius: '8px',
    fontSize: '0.85rem',
    fontWeight: '500',
    cursor: 'pointer',
  },
  navBtnActive: {
    backgroundColor: 'rgba(124,110,240,0.12)',
    color: '#a78bfa',
    border: '1px solid rgba(124,110,240,0.3)',
  },
  bellWrapper: { position: 'relative' },
  bellBtn: {
    position: 'relative',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    padding: '0.3rem',
    display: 'flex',
    alignItems: 'center',
    borderRadius: '8px',
  },
  bellIcon: { fontSize: '1.1rem' },
  badge: {
    position: 'absolute',
    top: '-2px',
    right: '-4px',
    backgroundColor: '#ef4444',
    color: '#fff',
    fontSize: '0.6rem',
    fontWeight: '700',
    borderRadius: '999px',
    padding: '0.1rem 0.3rem',
    minWidth: '15px',
    textAlign: 'center',
    lineHeight: '1.4',
    border: '1.5px solid #0f0f1a',
  },
  divider: {
    width: '1px',
    height: '20px',
    backgroundColor: '#2a2a45',
  },
  profileBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    cursor: 'pointer',
    padding: '0.3rem 0.6rem',
    borderRadius: '8px',
    border: '1px solid transparent',
  },
  avatar: {
    width: '28px',
    height: '28px',
    borderRadius: '50%',
    background: 'linear-gradient(135deg, #7c6ef0, #5b4fcf)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#fff',
    fontSize: '0.75rem',
    fontWeight: '700',
    flexShrink: 0,
    boxShadow: '0 2px 8px rgba(124,110,240,0.35)',
  },
  username: {
    fontSize: '0.875rem',
    color: '#f0f0ff',
    fontWeight: '500',
  },
  logoutBtn: {
    padding: '0.4rem 0.9rem',
    backgroundColor: 'transparent',
    color: '#8b8bab',
    border: '1px solid #2a2a45',
    borderRadius: '8px',
    fontSize: '0.85rem',
    fontWeight: '500',
    cursor: 'pointer',
  },
  modalOverlay: {
    position: 'fixed',
    inset: 0,
    backgroundColor: 'rgba(0,0,0,0.6)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 300,
    backdropFilter: 'blur(4px)',
  },
  modal: {
    backgroundColor: '#1a1a2e',
    borderRadius: '16px',
    padding: '2rem',
    width: '100%',
    maxWidth: '400px',
    boxShadow: '0 24px 80px rgba(0,0,0,0.6)',
    border: '1px solid #2a2a45',
  },
  modalHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '1.25rem',
  },
  modalTitle: {
    fontSize: '1rem',
    fontWeight: '700',
    color: '#f0f0ff',
    margin: 0,
  },
  modalClose: {
    background: 'none',
    border: 'none',
    color: '#8b8bab',
    fontSize: '1rem',
    cursor: 'pointer',
  },
  modalError: {
    backgroundColor: 'rgba(248,113,113,0.1)',
    border: '1px solid rgba(248,113,113,0.3)',
    color: '#f87171',
    padding: '0.75rem 1rem',
    borderRadius: '8px',
    marginBottom: '1rem',
    fontSize: '0.875rem',
  },
  modalLabel: {
    fontSize: '0.85rem',
    fontWeight: '500',
    color: '#8b8bab',
    display: 'block',
    marginBottom: '0.5rem',
  },
  modalInput: {
    width: '100%',
    padding: '0.8rem 1rem',
    borderRadius: '10px',
    border: '1.5px solid #2a2a45',
    fontSize: '0.95rem',
    outline: 'none',
    marginBottom: '1.25rem',
    backgroundColor: '#12122a',
    color: '#f0f0ff',
    boxSizing: 'border-box',
  },
  modalActions: { display: 'flex', gap: '0.75rem' },
  cancelBtn: {
    flex: 1,
    padding: '0.75rem',
    backgroundColor: 'transparent',
    color: '#8b8bab',
    border: '1px solid #2a2a45',
    borderRadius: '10px',
    fontSize: '0.9rem',
    cursor: 'pointer',
  },
  createBtn: {
    flex: 1,
    padding: '0.75rem',
    background: 'linear-gradient(135deg, #7c6ef0, #5b4fcf)',
    color: '#ffffff',
    border: 'none',
    borderRadius: '10px',
    fontSize: '0.9rem',
    fontWeight: '600',
    cursor: 'pointer',
    boxShadow: '0 4px 16px rgba(124,110,240,0.3)',
  },
}

export default Navbar