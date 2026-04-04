import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { createTeam } from '../api'

const Navbar = () => {
  const { user, logout, workspace, switchWorkspace } = useAuth()
  const navigate = useNavigate()
  const [showSwitcher, setShowSwitcher] = useState(false)
  const [showCreateTeam, setShowCreateTeam] = useState(false)
  const [newTeamName, setNewTeamName] = useState('')
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState('')

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

  return (
    <>
      <nav style={styles.nav}>
        <div style={styles.left}>
          <span style={styles.logo} onClick={() => navigate('/dashboard')}>
            Progresso
          </span>
        </div>

        <div style={styles.right}>
          <div style={styles.workspaceSwitcher}>
            <button
              style={styles.workspaceBtn}
              onClick={() => setShowSwitcher(!showSwitcher)}
            >
              {workspaceLabel}
              <span style={styles.chevron}>▾</span>
            </button>

            {showSwitcher && (
              <div style={styles.dropdown}>
                <p style={styles.dropdownLabel}>Switch workspace</p>

                <div
                  style={{
                    ...styles.dropdownItem,
                    ...(workspace === 'team' ? styles.dropdownItemActive : {}),
                  }}
                  onClick={() => handleSwitchWorkspace('team')}
                >
                  <span>👥</span>
                  <div>
                    <p style={styles.dropdownItemTitle}>Team workspace</p>
                    <p style={styles.dropdownItemDesc}>View your team's boards</p>
                  </div>
                </div>

                <div
                  style={{
                    ...styles.dropdownItem,
                    ...(workspace === 'individual' ? styles.dropdownItemActive : {}),
                  }}
                  onClick={() => handleSwitchWorkspace('individual')}
                >
                  <span>🧑‍💻</span>
                  <div>
                    <p style={styles.dropdownItemTitle}>Individual workspace</p>
                    <p style={styles.dropdownItemDesc}>View your personal boards</p>
                  </div>
                </div>

                <div style={styles.dropdownDivider} />

                <div
                  style={styles.dropdownItem}
                  onClick={() => {
                    setShowCreateTeam(true)
                    setShowSwitcher(false)
                  }}
                >
                  <span>👑</span>
                  <div>
                    <p style={styles.dropdownItemTitle}>Create new team</p>
                    <p style={styles.dropdownItemDesc}>Start a new workspace</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* ── My Tasks button ── */}
          <button
            style={styles.myTasksBtn}
            onClick={() => navigate('/my-tasks')}
          >
            ✅ My Tasks
          </button>

          {/* ── Profile link ── */}
          <span
            style={styles.username}
            onClick={() => navigate('/profile')}
            title="Edit profile"
          >
            👋 {user?.username}
          </span>

          <button style={styles.logoutBtn} onClick={handleLogout}>
            Logout
          </button>
        </div>
      </nav>

      {showSwitcher && (
        <div style={styles.overlay} onClick={() => setShowSwitcher(false)} />
      )}

      {showCreateTeam && (
        <div style={styles.modalOverlay}>
          <div style={styles.modal}>
            <h3 style={styles.modalTitle}>Create a new team</h3>
            {error && <div style={styles.error}>{error}</div>}
            <input
              style={styles.input}
              type="text"
              placeholder="Team name"
              value={newTeamName}
              onChange={(e) => setNewTeamName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleCreateTeam()}
              autoFocus
            />
            <div style={styles.modalActions}>
              <button
                style={styles.cancelBtn}
                onClick={() => {
                  setShowCreateTeam(false)
                  setError('')
                  setNewTeamName('')
                }}
              >
                Cancel
              </button>
              <button
                style={styles.createBtn}
                onClick={handleCreateTeam}
                disabled={creating}
              >
                {creating ? 'Creating...' : 'Create team'}
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
    backgroundColor: '#ffffff',
    boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
    position: 'sticky',
    top: 0,
    zIndex: 100,
  },
  left: {
    display: 'flex',
    alignItems: 'center',
  },
  logo: {
    fontSize: '1.4rem',
    fontWeight: '700',
    color: '#5b4fcf',
    cursor: 'pointer',
  },
  right: {
    display: 'flex',
    alignItems: 'center',
    gap: '1.25rem',
  },
  workspaceSwitcher: {
    position: 'relative',
  },
  workspaceBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.4rem',
    padding: '0.45rem 1rem',
    backgroundColor: '#f5f3ff',
    color: '#5b4fcf',
    border: '1.5px solid #5b4fcf',
    borderRadius: '8px',
    fontSize: '0.9rem',
    fontWeight: '500',
    cursor: 'pointer',
  },
  chevron: {
    fontSize: '0.75rem',
  },
  dropdown: {
    position: 'absolute',
    top: 'calc(100% + 8px)',
    right: 0,
    backgroundColor: '#ffffff',
    borderRadius: '12px',
    boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
    border: '1.5px solid #e5e7eb',
    padding: '0.75rem',
    width: '240px',
    zIndex: 200,
  },
  dropdownLabel: {
    fontSize: '0.75rem',
    fontWeight: '600',
    color: '#9ca3af',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    padding: '0.25rem 0.5rem',
    marginBottom: '0.25rem',
  },
  dropdownItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    padding: '0.65rem 0.75rem',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '1.2rem',
  },
  dropdownItemActive: {
    backgroundColor: '#f5f3ff',
  },
  dropdownItemTitle: {
    fontSize: '0.88rem',
    fontWeight: '600',
    color: '#374151',
  },
  dropdownItemDesc: {
    fontSize: '0.75rem',
    color: '#9ca3af',
  },
  dropdownDivider: {
    height: '1px',
    backgroundColor: '#f3f4f6',
    margin: '0.5rem 0',
  },
  overlay: {
    position: 'fixed',
    inset: 0,
    zIndex: 99,
  },
  myTasksBtn: {
    padding: '0.45rem 1rem',
    backgroundColor: 'transparent',
    color: '#5b4fcf',
    border: '1.5px solid #5b4fcf',
    borderRadius: '8px',
    fontSize: '0.9rem',
    fontWeight: '500',
    cursor: 'pointer',
  },
  username: {
    fontSize: '0.95rem',
    color: '#5b4fcf',
    fontWeight: '500',
    cursor: 'pointer',
    textDecoration: 'underline dotted',
    textUnderlineOffset: '3px',
  },
  logoutBtn: {
    padding: '0.45rem 1rem',
    backgroundColor: 'transparent',
    color: '#5b4fcf',
    border: '1.5px solid #5b4fcf',
    borderRadius: '8px',
    fontSize: '0.9rem',
    fontWeight: '500',
    cursor: 'pointer',
  },
  modalOverlay: {
    position: 'fixed',
    inset: 0,
    backgroundColor: 'rgba(0,0,0,0.45)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 300,
  },
  modal: {
    backgroundColor: '#ffffff',
    borderRadius: '14px',
    padding: '2rem',
    width: '100%',
    maxWidth: '400px',
    boxShadow: '0 8px 40px rgba(0,0,0,0.15)',
  },
  modalTitle: {
    fontSize: '1.1rem',
    fontWeight: '700',
    color: '#1a1a2e',
    marginBottom: '1.25rem',
  },
  error: {
    backgroundColor: '#fee2e2',
    color: '#dc2626',
    padding: '0.75rem 1rem',
    borderRadius: '8px',
    marginBottom: '1rem',
    fontSize: '0.9rem',
  },
  input: {
    width: '100%',
    padding: '0.75rem 1rem',
    borderRadius: '8px',
    border: '1.5px solid #e5e7eb',
    fontSize: '0.95rem',
    outline: 'none',
    marginBottom: '1.25rem',
  },
  modalActions: {
    display: 'flex',
    gap: '0.75rem',
  },
  cancelBtn: {
    flex: 1,
    padding: '0.75rem',
    backgroundColor: 'transparent',
    color: '#6b7280',
    border: '1.5px solid #e5e7eb',
    borderRadius: '8px',
    fontSize: '0.95rem',
    cursor: 'pointer',
  },
  createBtn: {
    flex: 1,
    padding: '0.75rem',
    backgroundColor: '#5b4fcf',
    color: '#ffffff',
    border: 'none',
    borderRadius: '8px',
    fontSize: '0.95rem',
    fontWeight: '600',
    cursor: 'pointer',
  },
}

export default Navbar