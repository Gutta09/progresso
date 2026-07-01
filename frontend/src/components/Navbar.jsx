import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'
import { createTeam, getUnreadCount } from '../api'
import NotificationPanel from './NotificationPanel'
import { IconClose, IconSun, IconMoon } from './icons'

const IconDashboard = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
    <rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>
  </svg>
)
const IconTasks = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"/>
  </svg>
)
const IconBell = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 01-3.46 0"/>
  </svg>
)
const IconChevron = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="6 9 12 15 18 9"/>
  </svg>
)
const IconTeam = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/>
    <path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/>
  </svg>
)
const IconUser = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/>
  </svg>
)
const IconReport = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/>
    <line x1="6" y1="20" x2="6" y2="14"/><line x1="2" y1="20" x2="22" y2="20"/>
  </svg>
)
const IconCheck = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12"/>
  </svg>
)

const Navbar = () => {
  const { user, logout, workspace, switchWorkspace, refreshUser } = useAuth()
  const { theme, toggleTheme } = useTheme()
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
    } catch (err) {
      console.error('Failed to fetch unread notification count:', err)
    }
  }

  const handleBellClick = () => {
    localStorage.setItem('notifications_last_seen', new Date().toISOString())
    setUnreadCount(0)
    setShowNotifications(!showNotifications)
  }

  const handleLogout = () => { logout(); navigate('/login') }

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
      await refreshUser()
      switchWorkspace('team')
      setShowCreateTeam(false)
      setShowSwitcher(false)
      navigate('/dashboard')
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to create team')
    } finally {
      setCreating(false)
    }
  }

  const isMyTasks = location.pathname === '/my-tasks'
  const isReport  = location.pathname === '/report'
  const isAdmin   = user?.role === 'admin'
  const workspaceLabel = workspace === 'team' ? 'Team' : 'Individual'

  return (
    <>
      <nav style={s.nav}>
        {/* Logo */}
        <div style={s.left}>
          <div style={s.logoWrapper} onClick={() => navigate('/dashboard')}>
            <div style={s.logoIcon}>P</div>
            <span style={s.logoText}>Progresso</span>
          </div>
        </div>

        {/* Right actions */}
        <div style={s.right}>
          {/* Workspace switcher */}
          <div style={s.wsWrapper}>
            <button style={s.wsBtn} onClick={() => setShowSwitcher(!showSwitcher)}>
              {workspace === 'team' ? <IconTeam /> : <IconUser />}
              <span style={{ marginLeft: 6 }}>{workspaceLabel}</span>
              <span style={{ marginLeft: 4, opacity: 0.6, display: 'flex', transition: 'transform 0.2s', transform: showSwitcher ? 'rotate(180deg)' : 'none' }}>
                <IconChevron />
              </span>
            </button>

            {showSwitcher && (
              <div style={s.dropdown}>
                <p style={s.dropLabel}>Switch Workspace</p>
                {[
                  { key: 'team',       icon: <IconTeam />, title: 'Team Workspace',       desc: "View your team's boards" },
                  { key: 'individual', icon: <IconUser />, title: 'Individual Workspace',  desc: 'View your personal boards' },
                ].map(w => (
                  <div
                    key={w.key}
                    style={{ ...s.dropItem, ...(workspace === w.key ? s.dropItemActive : {}) }}
                    onClick={() => handleSwitchWorkspace(w.key)}
                  >
                    <span style={s.dropIcon}>{w.icon}</span>
                    <div>
                      <p style={s.dropTitle}>{w.title}</p>
                      <p style={s.dropDesc}>{w.desc}</p>
                    </div>
                    {workspace === w.key && <span style={s.activeCheck}><IconCheck /></span>}
                  </div>
                ))}
                <div style={s.dropDivider} />
                <div style={s.dropItem} onClick={() => { setShowCreateTeam(true); setShowSwitcher(false) }}>
                  <span style={s.dropIcon}><IconTeam /></span>
                  <div>
                    <p style={s.dropTitle}>Create New Team</p>
                    <p style={s.dropDesc}>Start a new workspace</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* My Tasks */}
          <button
            style={{ ...s.navBtn, ...(isMyTasks ? s.navBtnActive : {}) }}
            onClick={() => navigate('/my-tasks')}
          >
            <IconTasks />
            <span style={{ marginLeft: 5 }}>My Tasks</span>
          </button>

          {/* Report (admin + team only) */}
          {isAdmin && workspace === 'team' && (
            <button
              style={{ ...s.navBtn, ...(isReport ? s.navBtnActive : {}) }}
              onClick={() => navigate('/report')}
            >
              <IconReport />
              <span style={{ marginLeft: 5 }}>Reports</span>
            </button>
          )}

          {/* Notification bell */}
          {user?.team_id && (
            <div style={s.bellWrapper}>
              <button style={s.bellBtn} onClick={handleBellClick}>
                <IconBell />
                {unreadCount > 0 && (
                  <span style={s.badge}>{unreadCount > 99 ? '99+' : unreadCount}</span>
                )}
              </button>
              {showNotifications && (
                <NotificationPanel onClose={() => setShowNotifications(false)} />
              )}
            </div>
          )}

          {/* Theme toggle */}
          <button
            style={s.themeBtn}
            onClick={toggleTheme}
            title={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
          >
            {theme === 'dark' ? <IconSun /> : <IconMoon />}
          </button>

          <div style={s.divider} />

          {/* Profile */}
          <div style={s.profileBtn} onClick={() => navigate('/profile')} title="Edit profile">
            <div style={s.avatar}>{user?.username?.charAt(0).toUpperCase()}</div>
            <span style={s.username}>{user?.username}</span>
          </div>

          {/* Logout */}
          <button style={s.logoutBtn} onClick={handleLogout}>Sign Out</button>
        </div>
      </nav>

      {showSwitcher && <div style={s.overlay} onClick={() => setShowSwitcher(false)} />}

      {/* Create Team Modal */}
      {showCreateTeam && (
        <div style={s.modalOverlay}>
          <div style={s.modal}>
            <div style={s.modalHeader}>
              <h3 style={s.modalTitle}>Create a New Team</h3>
              <button style={s.modalClose} onClick={() => { setShowCreateTeam(false); setError(''); setNewTeamName('') }}>
                <IconClose size={18} />
              </button>
            </div>
            {error && <div style={s.modalError}>{error}</div>}
            <label style={s.modalLabel}>Team Name</label>
            <input
              style={s.modalInput}
              type="text"
              placeholder="e.g. Engineering"
              value={newTeamName}
              onChange={(e) => setNewTeamName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleCreateTeam()}
              autoFocus
            />
            <div style={s.modalActions}>
              <button style={s.cancelBtn} onClick={() => { setShowCreateTeam(false); setError(''); setNewTeamName('') }}>
                Cancel
              </button>
              <button style={s.createBtn} onClick={handleCreateTeam} disabled={creating}>
                {creating ? 'Creating...' : 'Create Team'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

const s = {
  nav: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '0 1.75rem', height: '56px',
    backgroundColor: 'var(--bg-surface)',
    backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)',
    borderBottom: '1px solid var(--border)',
    position: 'sticky', top: 0, zIndex: 100,
  },
  left: { display: 'flex', alignItems: 'center' },
  logoWrapper: { display: 'flex', alignItems: 'center', gap: '0.6rem', cursor: 'pointer' },
  logoIcon: {
    width: '28px', height: '28px', borderRadius: '7px',
    background: 'linear-gradient(135deg, var(--avatar-grad-start), var(--avatar-grad-end))',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    color: '#fff', fontWeight: '800', fontSize: '0.85rem',
    boxShadow: '0 2px 8px rgba(59,130,246,0.35)',
  },
  logoText: {
    fontSize: '1.05rem', fontWeight: '700', color: 'var(--text-primary)', letterSpacing: '-0.01em',
  },
  right: { display: 'flex', alignItems: 'center', gap: '0.5rem' },
  wsWrapper: { position: 'relative' },
  wsBtn: {
    display: 'flex', alignItems: 'center',
    padding: '0.35rem 0.8rem',
    backgroundColor: 'var(--accent-soft)', color: 'var(--accent)',
    border: '1px solid var(--accent-border)', borderRadius: '7px',
    fontSize: '0.82rem', fontWeight: '500', cursor: 'pointer',
  },
  dropdown: {
    position: 'absolute', top: 'calc(100% + 8px)', right: 0,
    backgroundColor: 'var(--bg-surface)', borderRadius: '10px',
    boxShadow: 'var(--shadow-lg)', border: '1px solid var(--border)',
    padding: '0.5rem', width: '240px', zIndex: 200,
  },
  dropLabel: {
    fontSize: '0.68rem', fontWeight: '600', color: 'var(--text-muted)',
    textTransform: 'uppercase', letterSpacing: '0.07em',
    padding: '0.2rem 0.6rem', marginBottom: '0.2rem',
  },
  dropItem: {
    display: 'flex', alignItems: 'center', gap: '0.7rem',
    padding: '0.55rem 0.7rem', borderRadius: '7px', cursor: 'pointer',
    transition: 'background 0.15s',
  },
  dropItemActive: { backgroundColor: 'var(--accent-soft)' },
  dropIcon: { color: 'var(--text-secondary)', flexShrink: 0, display: 'flex' },
  dropTitle: { fontSize: '0.83rem', fontWeight: '600', color: 'var(--text-primary)', margin: 0 },
  dropDesc:  { fontSize: '0.72rem', color: 'var(--text-muted)', margin: 0 },
  activeCheck: { marginLeft: 'auto', color: 'var(--accent)', display: 'flex' },
  dropDivider: { height: '1px', backgroundColor: 'var(--border)', margin: '0.4rem 0' },
  overlay: { position: 'fixed', inset: 0, zIndex: 99 },
  navBtn: {
    display: 'flex', alignItems: 'center',
    padding: '0.35rem 0.8rem',
    backgroundColor: 'transparent', color: 'var(--text-secondary)',
    border: '1px solid var(--border)', borderRadius: '7px',
    fontSize: '0.82rem', fontWeight: '500', cursor: 'pointer',
    transition: 'all 0.15s',
  },
  navBtnActive: {
    backgroundColor: 'var(--accent-soft)', color: 'var(--accent)',
    border: '1px solid var(--accent-border)',
  },
  bellWrapper: { position: 'relative' },
  bellBtn: {
    position: 'relative', background: 'none', border: 'none',
    cursor: 'pointer', padding: '0.35rem',
    display: 'flex', alignItems: 'center', borderRadius: '7px',
    color: 'var(--text-secondary)',
  },
  badge: {
    position: 'absolute', top: '0px', right: '-2px',
    backgroundColor: 'var(--danger)', color: '#fff',
    fontSize: '0.58rem', fontWeight: '700', borderRadius: '999px',
    padding: '0.08rem 0.28rem', minWidth: '14px', textAlign: 'center',
    border: '1.5px solid var(--bg-base)',
  },
  themeBtn: {
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    background: 'none', border: '1px solid var(--border)',
    borderRadius: '7px', cursor: 'pointer', padding: '0.35rem 0.55rem',
    color: 'var(--text-secondary)',
  },
  divider: { width: '1px', height: '18px', backgroundColor: 'var(--border)' },
  profileBtn: {
    display: 'flex', alignItems: 'center', gap: '0.45rem',
    cursor: 'pointer', padding: '0.25rem 0.5rem',
    borderRadius: '7px', transition: 'background 0.15s',
  },
  avatar: {
    width: '26px', height: '26px', borderRadius: '50%',
    background: 'linear-gradient(135deg, var(--avatar-grad-start), var(--avatar-grad-end))',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    color: '#fff', fontSize: '0.72rem', fontWeight: '700', flexShrink: 0,
  },
  username: { fontSize: '0.82rem', color: 'var(--text-secondary)', fontWeight: '500' },
  logoutBtn: {
    padding: '0.35rem 0.8rem', backgroundColor: 'transparent',
    color: 'var(--text-secondary)', border: '1px solid var(--border)',
    borderRadius: '7px', fontSize: '0.82rem', fontWeight: '500', cursor: 'pointer',
  },
  modalOverlay: {
    position: 'fixed', inset: 0, backgroundColor: 'var(--overlay)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    zIndex: 300, backdropFilter: 'blur(4px)',
  },
  modal: {
    backgroundColor: 'var(--bg-surface)', borderRadius: '14px', padding: '1.75rem',
    width: '100%', maxWidth: '400px',
    boxShadow: 'var(--shadow-lg)', border: '1px solid var(--border)',
  },
  modalHeader: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem',
  },
  modalTitle: { fontSize: '0.95rem', fontWeight: '700', color: 'var(--text-primary)', margin: 0 },
  modalClose: {
    background: 'none', border: 'none', color: 'var(--text-muted)',
    display: 'flex', cursor: 'pointer', lineHeight: 1,
  },
  modalError: {
    backgroundColor: 'var(--danger-soft)', border: '1px solid var(--danger-border, rgba(239,68,68,0.3))',
    color: 'var(--danger)', padding: '0.6rem 0.85rem',
    borderRadius: '7px', marginBottom: '1rem', fontSize: '0.82rem',
  },
  modalLabel: {
    fontSize: '0.75rem', fontWeight: '600', color: 'var(--text-secondary)',
    textTransform: 'uppercase', letterSpacing: '0.05em',
    display: 'block', marginBottom: '0.45rem',
  },
  modalInput: {
    width: '100%', padding: '0.75rem 0.9rem',
    borderRadius: '8px', border: '1.5px solid var(--border)',
    fontSize: '0.9rem', outline: 'none', marginBottom: '1.25rem',
    backgroundColor: 'var(--bg-raised)', color: 'var(--text-primary)', boxSizing: 'border-box',
  },
  modalActions: { display: 'flex', gap: '0.6rem' },
  cancelBtn: {
    flex: 1, padding: '0.7rem', backgroundColor: 'transparent',
    color: 'var(--text-secondary)', border: '1px solid var(--border)',
    borderRadius: '8px', fontSize: '0.875rem', cursor: 'pointer',
  },
  createBtn: {
    flex: 1, padding: '0.7rem',
    background: 'linear-gradient(135deg, var(--avatar-grad-start), var(--avatar-grad-end))',
    color: '#fff', border: 'none', borderRadius: '8px',
    fontSize: '0.875rem', fontWeight: '600', cursor: 'pointer',
  },
}

export default Navbar
