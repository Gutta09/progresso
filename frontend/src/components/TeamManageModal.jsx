import { useState, useRef, useEffect } from 'react'
import { renameTeam, removeMember } from '../api'
import { useAuth } from '../context/AuthContext'
import { IconClose } from './icons'
import ConfirmDialog from './ConfirmDialog'

const TeamManageModal = ({ team, members, onClose, onRefresh }) => {
  const { user } = useAuth()
  const [teamName, setTeamName] = useState(team.team_name)
  const [renaming, setRenaming] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [memberToRemove, setMemberToRemove] = useState(null)
  const successTimer = useRef(null)

  useEffect(() => () => clearTimeout(successTimer.current), [])

  const flashSuccess = (msg, delay = 2000) => {
    clearTimeout(successTimer.current)
    setSuccess(msg)
    successTimer.current = setTimeout(() => setSuccess(''), delay)
  }

  const handleRename = async () => {
    if (!teamName.trim() || teamName === team.team_name) return
    setRenaming(true); setError('')
    try {
      await renameTeam({ team_name: teamName.trim() })
      flashSuccess('Team name updated.')
      onRefresh()
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to rename team')
    } finally { setRenaming(false) }
  }

  const handleRemove = async () => {
    const { memberId, username } = memberToRemove
    setMemberToRemove(null)
    try {
      await removeMember(memberId)
      flashSuccess(`${username} removed.`)
      onRefresh()
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to remove member')
    }
  }

  return (
    <div style={s.overlay} onClick={onClose}>
      <div style={s.modal} onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div style={s.header}>
          <div style={s.headerLeft}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/>
              <path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/>
            </svg>
            <h3 style={s.title}>Manage Team</h3>
          </div>
          <button style={s.closeBtn} onClick={onClose}><IconClose size={18} /></button>
        </div>

        {error   && <div style={s.errorMsg}>{error}</div>}
        {success && <div style={s.successMsg}>{success}</div>}

        {/* Team Name */}
        <div style={s.section}>
          <label style={s.sectionLabel}>Team Name</label>
          <div style={s.renameRow}>
            <input
              style={s.input} value={teamName}
              onChange={e => setTeamName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleRename()}
            />
            <button
              style={{ ...s.saveBtn, opacity: renaming || teamName === team.team_name ? 0.5 : 1 }}
              onClick={handleRename} disabled={renaming || teamName === team.team_name}
            >
              {renaming ? 'Saving...' : 'Save'}
            </button>
          </div>
        </div>

        {/* Members */}
        <div style={s.section}>
          <label style={s.sectionLabel}>
            Members
            <span style={s.memberCount}>{members.length}</span>
          </label>
          <div style={s.membersList}>
            {members.map(member => (
              <div key={member.user_id} style={s.memberRow}>
                <div style={s.memberLeft}>
                  <div style={s.avatar}>{member.username.charAt(0).toUpperCase()}</div>
                  <div>
                    <p style={s.memberName}>
                      {member.username}
                      {member.user_id === user?.user_id && <span style={s.youBadge}>you</span>}
                    </p>
                    <p style={s.memberRole}>{member.role}</p>
                  </div>
                </div>
                {member.user_id !== user?.user_id && (
                  <button style={s.removeBtn} onClick={() => setMemberToRemove({ memberId: member.user_id, username: member.username })}>
                    Remove
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Invite Code */}
        <div style={{ ...s.section, borderBottom: 'none', marginBottom: 0, paddingBottom: 0 }}>
          <label style={s.sectionLabel}>Invite Code</label>
          <div style={s.inviteBox}>
            <span style={s.inviteCode}>{team.invite_code}</span>
            <button style={s.copyBtn} onClick={() => {
              navigator.clipboard.writeText(team.invite_code)
              flashSuccess('Copied to clipboard.', 1500)
            }}>Copy</button>
          </div>
          <p style={s.inviteHint}>Share this code with teammates to invite them.</p>
        </div>
      </div>

      {memberToRemove && (
        <ConfirmDialog
          title="Remove Member"
          message={`Remove ${memberToRemove.username} from the team?`}
          confirmLabel="Remove"
          danger
          onConfirm={handleRemove}
          onCancel={() => setMemberToRemove(null)}
        />
      )}
    </div>
  )
}

const s = {
  overlay: {
    position: 'fixed', inset: 0, backgroundColor: 'var(--overlay)',
    backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center',
    justifyContent: 'center', zIndex: 200, padding: '1rem',
  },
  modal: {
    backgroundColor: 'var(--bg-surface)', borderRadius: '14px', padding: '1.6rem',
    width: '100%', maxWidth: '470px', maxHeight: '90vh', overflowY: 'auto',
    boxShadow: 'var(--shadow-lg)', border: '1px solid var(--border)',
  },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' },
  headerLeft: { display: 'flex', alignItems: 'center', gap: '0.55rem' },
  title: { fontSize: '0.95rem', fontWeight: '700', color: 'var(--text-primary)', margin: 0 },
  closeBtn: { background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex', lineHeight: 1 },
  errorMsg: {
    backgroundColor: 'var(--danger-soft)', border: '1px solid var(--priority-high-border)',
    color: 'var(--danger)', padding: '0.6rem 0.85rem', borderRadius: '7px', marginBottom: '0.85rem', fontSize: '0.82rem',
  },
  successMsg: {
    backgroundColor: 'var(--success-soft)', border: '1px solid var(--priority-low-border)',
    color: 'var(--success)', padding: '0.6rem 0.85rem', borderRadius: '7px', marginBottom: '0.85rem', fontSize: '0.82rem',
  },
  section: { marginBottom: '1.25rem', paddingBottom: '1.25rem', borderBottom: '1px solid var(--border)' },
  sectionLabel: {
    display: 'flex', alignItems: 'center', gap: '0.4rem',
    fontSize: '0.72rem', fontWeight: '600', color: 'var(--text-muted)',
    textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.75rem',
  },
  memberCount: {
    backgroundColor: 'var(--accent-soft)', color: 'var(--accent)',
    border: '1px solid var(--accent-border)', borderRadius: '999px',
    padding: '0.05rem 0.4rem', fontSize: '0.7rem', fontWeight: '700', marginLeft: '0.2rem',
  },
  renameRow: { display: 'flex', gap: '0.5rem' },
  input: {
    flex: 1, padding: '0.65rem 0.85rem', borderRadius: '8px',
    border: '1.5px solid var(--border)', fontSize: '0.875rem', outline: 'none',
    backgroundColor: 'var(--bg-raised)', color: 'var(--text-primary)',
  },
  saveBtn: {
    padding: '0.65rem 1.1rem', background: 'linear-gradient(135deg, var(--avatar-grad-start), var(--avatar-grad-end))',
    color: '#fff', border: 'none', borderRadius: '8px', fontSize: '0.82rem',
    fontWeight: '600', cursor: 'pointer', whiteSpace: 'nowrap',
  },
  membersList: { display: 'flex', flexDirection: 'column', gap: '0.45rem' },
  memberRow: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '0.65rem 0.8rem', backgroundColor: 'var(--bg-raised)',
    borderRadius: '9px', border: '1px solid var(--border)',
  },
  memberLeft: { display: 'flex', alignItems: 'center', gap: '0.7rem' },
  avatar: {
    width: '32px', height: '32px', borderRadius: '50%',
    background: 'linear-gradient(135deg, var(--avatar-grad-start), var(--avatar-grad-end))', color: '#fff',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontWeight: '700', fontSize: '0.8rem', flexShrink: 0,
  },
  memberName: { fontSize: '0.85rem', fontWeight: '600', color: 'var(--text-primary)', margin: '0 0 0.1rem' },
  youBadge: {
    fontSize: '0.67rem', color: 'var(--accent)', fontWeight: '600',
    backgroundColor: 'var(--accent-soft)', border: '1px solid var(--accent-border)',
    borderRadius: '999px', padding: '0.04rem 0.35rem', marginLeft: '0.3rem',
  },
  memberRole: { fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'capitalize', margin: 0 },
  removeBtn: {
    padding: '0.3rem 0.75rem', backgroundColor: 'var(--danger-soft)',
    color: 'var(--danger)', border: '1px solid var(--priority-high-border)',
    borderRadius: '6px', fontSize: '0.75rem', fontWeight: '600', cursor: 'pointer',
  },
  inviteBox: {
    display: 'flex', alignItems: 'center', gap: '1rem',
    background: 'var(--accent-soft)', border: '1.5px dashed var(--accent-border)',
    borderRadius: '10px', padding: '0.9rem 1.1rem', marginBottom: '0.5rem',
  },
  inviteCode: { fontSize: '1.5rem', fontWeight: '800', color: 'var(--accent)', letterSpacing: '0.28em', flex: 1 },
  copyBtn: {
    padding: '0.45rem 1rem', background: 'linear-gradient(135deg, var(--avatar-grad-start), var(--avatar-grad-end))',
    color: '#fff', border: 'none', borderRadius: '7px', fontSize: '0.82rem',
    fontWeight: '600', cursor: 'pointer', whiteSpace: 'nowrap',
  },
  inviteHint: { fontSize: '0.72rem', color: 'var(--text-muted)', margin: 0 },
}

export default TeamManageModal
