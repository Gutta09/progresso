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
        <div style={styles.header}>
          <h3 style={styles.title}>Manage team</h3>
          <button style={styles.closeBtn} onClick={onClose}>✕</button>
        </div>

        {error && <div style={styles.error}>{error}</div>}
        {success && <div style={styles.success}>{success}</div>}

        <div style={styles.section}>
          <label style={styles.label}>Team name</label>
          <div style={styles.renameRow}>
            <input
              style={styles.input}
              value={teamName}
              onChange={(e) => setTeamName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleRename()}
            />
            <button
              style={styles.saveBtn}
              onClick={handleRename}
              disabled={renaming || teamName === team.team_name}
            >
              {renaming ? 'Saving...' : 'Save'}
            </button>
          </div>
        </div>

        <div style={styles.section}>
          <label style={styles.label}>
            Members ({members.length})
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
                        <span style={styles.youBadge}> (you)</span>
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

        <div style={styles.section}>
          <label style={styles.label}>Invite code</label>
          <div style={styles.inviteBox}>
            <span style={styles.inviteCode}>{team.invite_code}</span>
            <button
              style={styles.copyBtn}
              onClick={() => {
                navigator.clipboard.writeText(team.invite_code)
                setSuccess('Copied!')
                setTimeout(() => setSuccess(''), 1500)
              }}
            >
              Copy
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

const styles = {
  overlay: {
    position: 'fixed',
    inset: 0,
    backgroundColor: 'rgba(0,0,0,0.45)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 200,
    padding: '1rem',
  },
  modal: {
    backgroundColor: '#ffffff',
    borderRadius: '14px',
    padding: '2rem',
    width: '100%',
    maxWidth: '480px',
    maxHeight: '90vh',
    overflowY: 'auto',
    boxShadow: '0 8px 40px rgba(0,0,0,0.15)',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '1.5rem',
  },
  title: {
    fontSize: '1.1rem',
    fontWeight: '700',
    color: '#1a1a2e',
  },
  closeBtn: {
    background: 'none',
    border: 'none',
    fontSize: '1rem',
    color: '#9ca3af',
    cursor: 'pointer',
  },
  error: {
    backgroundColor: '#fee2e2',
    color: '#dc2626',
    padding: '0.75rem 1rem',
    borderRadius: '8px',
    marginBottom: '1rem',
    fontSize: '0.9rem',
  },
  success: {
    backgroundColor: '#ecfdf5',
    color: '#059669',
    padding: '0.75rem 1rem',
    borderRadius: '8px',
    marginBottom: '1rem',
    fontSize: '0.9rem',
  },
  section: {
    marginBottom: '1.5rem',
  },
  label: {
    fontSize: '0.85rem',
    fontWeight: '600',
    color: '#374151',
    display: 'block',
    marginBottom: '0.75rem',
  },
  renameRow: {
    display: 'flex',
    gap: '0.75rem',
  },
  input: {
    flex: 1,
    padding: '0.65rem 0.9rem',
    borderRadius: '8px',
    border: '1.5px solid #e5e7eb',
    fontSize: '0.9rem',
    outline: 'none',
  },
  saveBtn: {
    padding: '0.65rem 1.25rem',
    backgroundColor: '#5b4fcf',
    color: '#fff',
    border: 'none',
    borderRadius: '8px',
    fontSize: '0.9rem',
    fontWeight: '600',
    cursor: 'pointer',
  },
  membersList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.6rem',
  },
  memberRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '0.65rem 0.75rem',
    backgroundColor: '#f9fafb',
    borderRadius: '8px',
  },
  memberLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
  },
  avatar: {
    width: '36px',
    height: '36px',
    borderRadius: '50%',
    backgroundColor: '#5b4fcf',
    color: '#ffffff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: '700',
    fontSize: '0.9rem',
    flexShrink: 0,
  },
  memberName: {
    fontSize: '0.9rem',
    fontWeight: '600',
    color: '#374151',
  },
  youBadge: {
    fontSize: '0.78rem',
    color: '#9ca3af',
    fontWeight: '400',
  },
  memberRole: {
    fontSize: '0.78rem',
    color: '#9ca3af',
    textTransform: 'capitalize',
  },
  removeBtn: {
    padding: '0.35rem 0.85rem',
    backgroundColor: 'transparent',
    color: '#dc2626',
    border: '1.5px solid #fca5a5',
    borderRadius: '6px',
    fontSize: '0.8rem',
    fontWeight: '500',
    cursor: 'pointer',
  },
  inviteBox: {
    display: 'flex',
    alignItems: 'center',
    gap: '1rem',
    backgroundColor: '#f5f3ff',
    border: '2px dashed #5b4fcf',
    borderRadius: '10px',
    padding: '1rem',
  },
  inviteCode: {
    fontSize: '1.5rem',
    fontWeight: '700',
    color: '#5b4fcf',
    letterSpacing: '0.3em',
    flex: 1,
  },
  copyBtn: {
    padding: '0.45rem 1rem',
    backgroundColor: '#5b4fcf',
    color: '#ffffff',
    border: 'none',
    borderRadius: '8px',
    fontSize: '0.85rem',
    fontWeight: '600',
    cursor: 'pointer',
  },
}

export default TeamManageModal