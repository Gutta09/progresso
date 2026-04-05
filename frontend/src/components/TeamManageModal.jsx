import { useState } from 'react'
import { renameTeam, removeMember } from '../api'
import { useAuth } from '../context/AuthContext'

const TeamManageModal = ({ team, members, onClose, onRefresh }) => {
  const { user } = useAuth()
  const [teamName, setTeamName] = useState(team.team_name)
  const [renaming, setRenaming] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const handleRename = async () => {
    if (!teamName.trim() || teamName === team.team_name) return
    setRenaming(true)
    setError('')
    try {
      await renameTeam({ team_name: teamName.trim() })
      setSuccess('Team name updated!')
      setTimeout(() => setSuccess(''), 2000)
      onRefresh()
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to rename team')
    } finally {
      setRenaming(false)
    }
  }

  const handleRemove = async (memberId, username) => {
    if (!window.confirm(`Remove ${username} from the team?`)) return
    try {
      await removeMember(memberId)
      setSuccess(`${username} removed!`)
      setTimeout(() => setSuccess(''), 2000)
      onRefresh()
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to remove member')
    }
  }

  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={styles.modal} onClick={(e) => e.stopPropagation()}>

        {/* Header */}
        <div style={styles.header}>
          <div style={styles.headerLeft}>
            <div style={styles.headerIcon}>👥</div>
            <h3 style={styles.title}>Manage Team</h3>
          </div>
          <button style={styles.closeBtn} onClick={onClose}>✕</button>
        </div>

        {error && (
          <div style={styles.error}>⚠ {error}</div>
        )}
        {success && (
          <div style={styles.successMsg}>✓ {success}</div>
        )}

        {/* ── Team name ── */}
        <div style={styles.section}>
          <label style={styles.sectionLabel}>
            <span style={styles.sectionIcon}>✏️</span>
            Team Name
          </label>
          <div style={styles.renameRow}>
            <input
              style={styles.input}
              value={teamName}
              onChange={(e) => setTeamName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleRename()}
            />
            <button
              style={{
                ...styles.saveBtn,
                opacity: renaming || teamName === team.team_name ? 0.5 : 1,
              }}
              onClick={handleRename}
              disabled={renaming || teamName === team.team_name}
            >
              {renaming ? 'Saving...' : 'Save'}
            </button>
          </div>
        </div>

        {/* ── Members ── */}
        <div style={styles.section}>
          <label style={styles.sectionLabel}>
            <span style={styles.sectionIcon}>👤</span>
            Members
            <span style={styles.memberCount}>{members.length}</span>
          </label>
          <div style={styles.membersList}>
            {members.map((member) => (
              <div key={member.user_id} style={styles.memberRow}>
                <div style={styles.memberLeft}>
                  <div style={styles.avatar}>
                    {member.username.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p style={styles.memberName}>
                      {member.username}
                      {member.user_id === user?.user_id && (
                        <span style={styles.youBadge}> you</span>
                      )}
                    </p>
                    <p style={styles.memberRole}>{member.role}</p>
                  </div>
                </div>
                {member.user_id !== user?.user_id && (
                  <button
                    style={styles.removeBtn}
                    onClick={() => handleRemove(member.user_id, member.username)}
                  >
                    Remove
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* ── Invite code ── */}
        <div style={styles.section}>
          <label style={styles.sectionLabel}>
            <span style={styles.sectionIcon}>🔑</span>
            Invite Code
          </label>
          <div style={styles.inviteBox}>
            <span style={styles.inviteCode}>{team.invite_code}</span>
            <button
              style={styles.copyBtn}
              onClick={() => {
                navigator.clipboard.writeText(team.invite_code)
                setSuccess('Copied to clipboard!')
                setTimeout(() => setSuccess(''), 1500)
              }}
            >
              Copy
            </button>
          </div>
          <p style={styles.inviteHint}>
            Share this code with teammates to invite them to your team
          </p>
        </div>
      </div>
    </div>
  )
}

const styles = {
  overlay: {
    position: 'fixed',
    inset: 0,
    backgroundColor: 'rgba(0,0,0,0.65)',
    backdropFilter: 'blur(4px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 200,
    padding: '1rem',
  },
  modal: {
    backgroundColor: '#1a1a2e',
    borderRadius: '16px',
    padding: '1.75rem',
    width: '100%',
    maxWidth: '480px',
    maxHeight: '90vh',
    overflowY: 'auto',
    boxShadow: '0 24px 80px rgba(0,0,0,0.6)',
    border: '1px solid #2a2a45',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '1.5rem',
  },
  headerLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.6rem',
  },
  headerIcon: {
    width: '32px',
    height: '32px',
    borderRadius: '8px',
    backgroundColor: 'rgba(124,110,240,0.15)',
    border: '1px solid rgba(124,110,240,0.3)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '0.9rem',
  },
  title: {
    fontSize: '1rem',
    fontWeight: '700',
    color: '#f0f0ff',
    margin: 0,
  },
  closeBtn: {
    background: 'none',
    border: 'none',
    fontSize: '0.9rem',
    color: '#4a4a6a',
    cursor: 'pointer',
    padding: '0.25rem',
    borderRadius: '6px',
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
  successMsg: {
    backgroundColor: 'rgba(52,211,153,0.1)',
    border: '1px solid rgba(52,211,153,0.3)',
    color: '#34d399',
    padding: '0.75rem 1rem',
    borderRadius: '8px',
    marginBottom: '1rem',
    fontSize: '0.875rem',
  },
  section: {
    marginBottom: '1.5rem',
    paddingBottom: '1.5rem',
    borderBottom: '1px solid #2a2a45',
  },
  sectionLabel: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.4rem',
    fontSize: '0.78rem',
    fontWeight: '700',
    color: '#8b8bab',
    textTransform: 'uppercase',
    letterSpacing: '0.06em',
    marginBottom: '0.85rem',
  },
  sectionIcon: {
    fontSize: '0.85rem',
  },
  memberCount: {
    backgroundColor: 'rgba(124,110,240,0.15)',
    color: '#a78bfa',
    border: '1px solid rgba(124,110,240,0.3)',
    borderRadius: '999px',
    padding: '0.05rem 0.45rem',
    fontSize: '0.72rem',
    fontWeight: '700',
    marginLeft: '0.25rem',
  },
  renameRow: {
    display: 'flex',
    gap: '0.6rem',
  },
  input: {
    flex: 1,
    padding: '0.7rem 0.9rem',
    borderRadius: '8px',
    border: '1.5px solid #2a2a45',
    fontSize: '0.9rem',
    outline: 'none',
    backgroundColor: '#12122a',
    color: '#f0f0ff',
  },
  saveBtn: {
    padding: '0.7rem 1.25rem',
    background: 'linear-gradient(135deg, #7c6ef0, #5b4fcf)',
    color: '#fff',
    border: 'none',
    borderRadius: '8px',
    fontSize: '0.875rem',
    fontWeight: '600',
    cursor: 'pointer',
    boxShadow: '0 2px 10px rgba(124,110,240,0.3)',
    whiteSpace: 'nowrap',
  },
  membersList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem',
  },
  memberRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '0.7rem 0.85rem',
    backgroundColor: '#12122a',
    borderRadius: '10px',
    border: '1px solid #2a2a45',
  },
  memberLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
  },
  avatar: {
    width: '34px',
    height: '34px',
    borderRadius: '50%',
    background: 'linear-gradient(135deg, #7c6ef0, #5b4fcf)',
    color: '#ffffff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: '700',
    fontSize: '0.85rem',
    flexShrink: 0,
    boxShadow: '0 2px 8px rgba(124,110,240,0.3)',
  },
  memberName: {
    fontSize: '0.875rem',
    fontWeight: '600',
    color: '#f0f0ff',
    margin: '0 0 0.15rem',
  },
  youBadge: {
    fontSize: '0.7rem',
    color: '#a78bfa',
    fontWeight: '600',
    backgroundColor: 'rgba(124,110,240,0.15)',
    border: '1px solid rgba(124,110,240,0.3)',
    borderRadius: '999px',
    padding: '0.05rem 0.4rem',
    marginLeft: '0.35rem',
  },
  memberRole: {
    fontSize: '0.75rem',
    color: '#4a4a6a',
    textTransform: 'capitalize',
    margin: 0,
  },
  removeBtn: {
    padding: '0.35rem 0.85rem',
    backgroundColor: 'rgba(248,113,113,0.1)',
    color: '#f87171',
    border: '1px solid rgba(248,113,113,0.3)',
    borderRadius: '6px',
    fontSize: '0.78rem',
    fontWeight: '600',
    cursor: 'pointer',
  },
  inviteBox: {
    display: 'flex',
    alignItems: 'center',
    gap: '1rem',
    background: 'rgba(124,110,240,0.08)',
    border: '1.5px dashed rgba(124,110,240,0.4)',
    borderRadius: '12px',
    padding: '1rem 1.25rem',
    marginBottom: '0.6rem',
  },
  inviteCode: {
    fontSize: '1.6rem',
    fontWeight: '800',
    color: '#a78bfa',
    letterSpacing: '0.3em',
    flex: 1,
  },
  copyBtn: {
    padding: '0.5rem 1.1rem',
    background: 'linear-gradient(135deg, #7c6ef0, #5b4fcf)',
    color: '#ffffff',
    border: 'none',
    borderRadius: '8px',
    fontSize: '0.85rem',
    fontWeight: '600',
    cursor: 'pointer',
    boxShadow: '0 2px 10px rgba(124,110,240,0.3)',
    whiteSpace: 'nowrap',
  },
  inviteHint: {
    fontSize: '0.75rem',
    color: '#4a4a6a',
    margin: 0,
  },
}

export default TeamManageModal