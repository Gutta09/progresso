import { useState, useEffect } from 'react'
import {
  updateTask, addComment, deleteComment, getTeamMembers,
  getGithubStatus, linkTaskIssue, unlinkTaskIssue, createIssueFromTask,
} from '../api'
import { useAuth } from '../context/AuthContext'
import { IconClose } from './icons'

const priorityOptions = ['low', 'medium', 'high']
const priorityColors  = {
  low:    { bg: 'var(--priority-low-soft)',    text: 'var(--priority-low)',    border: 'var(--priority-low-border)' },
  medium: { bg: 'var(--priority-medium-soft)', text: 'var(--priority-medium)', border: 'var(--priority-medium-border)' },
  high:   { bg: 'var(--priority-high-soft)',   text: 'var(--priority-high)',   border: 'var(--priority-high-border)' },
}

const TaskModal = ({ task, onClose, onRefresh, isTeamBoard }) => {
  const { user } = useAuth()
  const [title, setTitle]           = useState(task.title)
  const [description, setDescription] = useState(task.description || '')
  const [priority, setPriority]     = useState(task.priority)
  const [dueDate, setDueDate]       = useState(task.due_date || '')
  const [assignedTo, setAssignedTo] = useState(task.assigned_to || '')
  const [comment, setComment]       = useState('')
  const [saving, setSaving]         = useState(false)
  const [commenting, setCommenting] = useState(false)
  const [error, setError]           = useState('')
  const [teamMembers, setTeamMembers] = useState([])

  // ── GitHub linking ──
  const [ghConnected, setGhConnected] = useState(false)
  const [ghLink, setGhLink] = useState({
    number: task.github_issue_number || null,
    url: task.github_issue_url || null,
    state: task.github_issue_state || null,
  })
  const [issueInput, setIssueInput] = useState('')
  const [ghBusy, setGhBusy] = useState(false)
  const [ghError, setGhError] = useState('')

  useEffect(() => {
    if (isTeamBoard) { fetchTeamMembers(); fetchGithubStatus() }
  }, [isTeamBoard])

  const fetchTeamMembers = async () => {
    try {
      const r = await getTeamMembers()
      setTeamMembers(r.data)
    } catch (err) {
      if (err.response?.status !== 404) console.error('Failed to fetch team members:', err)
    }
  }

  const fetchGithubStatus = async () => {
    try {
      const st = await getGithubStatus()
      setGhConnected(!!st.connected)
    } catch { setGhConnected(false) }
  }

  const applyLink = (t) => {
    setGhLink({ number: t.github_issue_number, url: t.github_issue_url, state: t.github_issue_state })
    onRefresh()
  }

  const handleLinkIssue = async () => {
    const n = parseInt(issueInput, 10)
    if (!n) { setGhError('Enter a valid issue number'); return }
    setGhBusy(true); setGhError('')
    try { applyLink(await linkTaskIssue(task.task_id, n)); setIssueInput('') }
    catch (err) { setGhError(err.response?.data?.detail || 'Failed to link issue') }
    finally { setGhBusy(false) }
  }

  const handleCreateIssue = async () => {
    setGhBusy(true); setGhError('')
    try { applyLink(await createIssueFromTask(task.task_id)) }
    catch (err) { setGhError(err.response?.data?.detail || 'Failed to create issue') }
    finally { setGhBusy(false) }
  }

  const handleUnlink = async () => {
    setGhBusy(true); setGhError('')
    try { applyLink(await unlinkTaskIssue(task.task_id)) }
    catch (err) { setGhError(err.response?.data?.detail || 'Failed to unlink') }
    finally { setGhBusy(false) }
  }

  const handleSave = async () => {
    if (!title.trim()) { setError('Title cannot be empty'); return }
    setSaving(true)
    try {
      await updateTask(task.task_id, {
        title: title.trim(),
        description: description.trim() || null,
        priority,
        due_date: dueDate || null,
        assigned_to: isTeamBoard ? (assignedTo || null) : user?.user_id,
      })
      onRefresh(); onClose()
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to save changes')
    } finally { setSaving(false) }
  }

  const handleAddComment = async () => {
    if (!comment.trim()) return
    setCommenting(true)
    try {
      await addComment(task.task_id, { text_content: comment.trim(), task_id: task.task_id })
      setComment(''); onRefresh()
    } catch { setError('Failed to add comment') }
    finally { setCommenting(false) }
  }

  const handleDeleteComment = async (commentId) => {
    try { await deleteComment(commentId); onRefresh() }
    catch { setError('Failed to delete comment') }
  }

  const isAdmin  = user?.role === 'admin'
  const canEdit  = isAdmin || task.assigned_to === user?.user_id || !isTeamBoard
  const pc       = priorityColors[priority] || priorityColors.medium

  return (
    <div style={s.overlay} onClick={onClose}>
      <div style={s.modal} onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div style={s.modalHeader}>
          <div style={s.modalHeaderLeft}>
            <div style={{ ...s.priorityDot, backgroundColor: pc.text }} />
            <h3 style={s.modalTitle}>Task Details</h3>
          </div>
          <button style={s.closeBtn} onClick={onClose}><IconClose size={17} /></button>
        </div>

        {error && <div style={s.error}>{error}</div>}

        {/* Title */}
        <div style={s.field}>
          <label style={s.label}>Title</label>
          <input style={s.input} value={title} onChange={e => setTitle(e.target.value)} disabled={!canEdit} />
        </div>

        {/* Description */}
        <div style={s.field}>
          <label style={s.label}>Description</label>
          <textarea style={s.textarea} value={description} onChange={e => setDescription(e.target.value)} placeholder="Add a description..." rows={3} disabled={!canEdit} />
        </div>

        {/* Priority + Due Date */}
        <div style={s.row}>
          <div style={{ ...s.field, flex: 1 }}>
            <label style={s.label}>Priority</label>
            <select
              style={{ ...s.select, color: pc.text, borderColor: pc.border, backgroundColor: pc.bg }}
              value={priority} onChange={e => setPriority(e.target.value)} disabled={!canEdit}
            >
              {priorityOptions.map(p => (
                <option key={p} value={p} style={{ backgroundColor: 'var(--bg-raised)', color: 'var(--text-primary)' }}>
                  {p.charAt(0).toUpperCase() + p.slice(1)}
                </option>
              ))}
            </select>
          </div>
          <div style={{ ...s.field, flex: 1 }}>
            <label style={s.label}>Due Date</label>
            <input style={s.input} type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} disabled={!canEdit} />
          </div>
        </div>

        {/* Assignee */}
        {isTeamBoard && teamMembers.length > 0 && (
          <div style={s.field}>
            <label style={s.label}>Assigned To</label>
            {isAdmin ? (
              <select style={s.select} value={assignedTo} onChange={e => setAssignedTo(e.target.value)}>
                <option value="" style={{ backgroundColor: 'var(--bg-raised)' }}>Unassigned</option>
                {teamMembers.map(m => (
                  <option key={m.user_id} value={m.user_id} style={{ backgroundColor: 'var(--bg-raised)', color: 'var(--text-primary)' }}>
                    {m.username}{m.user_id === user?.user_id ? ' (you)' : ''}
                  </option>
                ))}
              </select>
            ) : (
              <div style={s.assigneeDisplay}>
                {task.assigned_to
                  ? teamMembers.find(m => m.user_id === task.assigned_to)?.username || 'Unknown'
                  : 'Unassigned'}
              </div>
            )}
          </div>
        )}

        {canEdit && (
          <button style={s.saveBtn} onClick={handleSave} disabled={saving}>
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        )}

        {/* GitHub link */}
        {isTeamBoard && ghConnected && (
          <div style={s.ghSection}>
            <label style={s.label}>GitHub</label>
            {ghError && <div style={s.ghError}>{ghError}</div>}
            {ghLink.number ? (
              <div style={s.ghLinked}>
                <a style={s.ghBadge} href={ghLink.url} target="_blank" rel="noreferrer">
                  <span style={{ ...s.ghDot, backgroundColor: ghLink.state === 'closed' ? 'var(--priority-high)' : 'var(--priority-low)' }} />
                  Issue #{ghLink.number}
                  <span style={s.ghState}>{ghLink.state}</span>
                </a>
                {canEdit && (
                  <button style={s.ghUnlink} onClick={handleUnlink} disabled={ghBusy}>Unlink</button>
                )}
              </div>
            ) : canEdit ? (
              <div style={s.ghActions}>
                <input
                  style={{ ...s.input, flex: '0 0 130px' }}
                  placeholder="Issue #"
                  value={issueInput}
                  onChange={e => setIssueInput(e.target.value.replace(/[^0-9]/g, ''))}
                  onKeyDown={e => e.key === 'Enter' && handleLinkIssue()}
                />
                <button style={s.ghLinkBtn} onClick={handleLinkIssue} disabled={ghBusy}>Link</button>
                <button style={s.ghCreateBtn} onClick={handleCreateIssue} disabled={ghBusy}>
                  {ghBusy ? '...' : 'Create issue'}
                </button>
              </div>
            ) : (
              <p style={s.noComments}>No issue linked.</p>
            )}
          </div>
        )}

        <div style={s.divider} />

        {/* Comments */}
        <div style={s.commentsSection}>
          <h4 style={s.commentsTitle}>
            Comments
            <span style={s.commentCount}>{task.comments?.length || 0}</span>
          </h4>

          <div style={s.commentsList}>
            {task.comments?.length === 0 && (
              <p style={s.noComments}>No comments yet.</p>
            )}
            {task.comments?.map(c => (
              <div key={c.comment_id} style={s.commentItem}>
                <div style={s.commentTop}>
                  <div style={s.commentAvatar}>
                    {teamMembers.find(m => m.user_id === c.user_id)?.username?.charAt(0).toUpperCase() || '?'}
                  </div>
                  <div style={s.commentMeta}>
                    <span style={s.commentUser}>
                      {teamMembers.find(m => m.user_id === c.user_id)?.username || `User #${c.user_id}`}
                    </span>
                    <span style={s.commentTime}>{new Date(c.timestamp).toLocaleString()}</span>
                  </div>
                  {c.user_id === user?.user_id && (
                    <button style={s.deleteCommentBtn} onClick={() => handleDeleteComment(c.comment_id)}><IconClose size={13} /></button>
                  )}
                </div>
                <p style={s.commentText}>{c.text_content}</p>
              </div>
            ))}
          </div>

          <div style={s.addComment}>
            <input
              style={s.input}
              placeholder="Write a comment..."
              value={comment}
              onChange={e => setComment(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleAddComment()}
            />
            <button style={s.commentBtn} onClick={handleAddComment} disabled={commenting}>
              {commenting ? '...' : 'Post'}
            </button>
          </div>
        </div>
      </div>
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
    width: '100%', maxWidth: '510px', maxHeight: '90vh', overflowY: 'auto',
    boxShadow: 'var(--shadow-lg)', border: '1px solid var(--border)',
  },
  ghSection: { marginTop: '1.1rem' },
  ghError: { backgroundColor: 'var(--danger-soft)', color: 'var(--danger)', padding: '0.45rem 0.65rem', borderRadius: 7, fontSize: '0.78rem', marginBottom: '0.5rem' },
  ghLinked: { display: 'flex', alignItems: 'center', gap: '0.6rem' },
  ghBadge: { display: 'inline-flex', alignItems: 'center', gap: '0.45rem', padding: '0.4rem 0.7rem', borderRadius: 8, border: '1px solid var(--border)', backgroundColor: 'var(--bg-raised)', color: 'var(--text-primary)', fontSize: '0.82rem', fontWeight: 600, textDecoration: 'none' },
  ghDot: { width: 8, height: 8, borderRadius: '50%' },
  ghState: { fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.03em' },
  ghUnlink: { padding: '0.35rem 0.7rem', borderRadius: 7, border: '1px solid var(--border)', backgroundColor: 'transparent', color: 'var(--text-secondary)', fontSize: '0.76rem', fontWeight: 600, cursor: 'pointer' },
  ghActions: { display: 'flex', gap: '0.5rem', alignItems: 'center' },
  ghLinkBtn: { padding: '0.55rem 0.9rem', borderRadius: 8, border: '1px solid var(--accent-border)', backgroundColor: 'var(--accent-soft)', color: 'var(--accent)', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer' },
  ghCreateBtn: { padding: '0.55rem 0.9rem', borderRadius: 8, border: 'none', background: 'linear-gradient(135deg, var(--avatar-grad-start), var(--avatar-grad-end))', color: '#fff', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer' },
  modalHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.4rem' },
  modalHeaderLeft: { display: 'flex', alignItems: 'center', gap: '0.55rem' },
  priorityDot: { width: '9px', height: '9px', borderRadius: '50%', flexShrink: 0 },
  modalTitle: { fontSize: '0.95rem', fontWeight: '700', color: 'var(--text-primary)', margin: 0 },
  closeBtn: { background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex', lineHeight: 1 },
  error: {
    backgroundColor: 'var(--danger-soft)', border: '1px solid var(--priority-high-border)',
    color: 'var(--danger)', padding: '0.6rem 0.85rem', borderRadius: '7px', marginBottom: '1rem', fontSize: '0.82rem',
  },
  field: { display: 'flex', flexDirection: 'column', gap: '0.4rem', marginBottom: '0.9rem' },
  label: { fontSize: '0.72rem', fontWeight: '600', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' },
  input: {
    padding: '0.65rem 0.85rem', borderRadius: '8px', border: '1.5px solid var(--border)',
    fontSize: '0.875rem', outline: 'none', width: '100%',
    backgroundColor: 'var(--bg-raised)', color: 'var(--text-primary)', boxSizing: 'border-box',
  },
  textarea: {
    padding: '0.65rem 0.85rem', borderRadius: '8px', border: '1.5px solid var(--border)',
    fontSize: '0.875rem', outline: 'none', resize: 'vertical', fontFamily: 'inherit',
    width: '100%', backgroundColor: 'var(--bg-raised)', color: 'var(--text-primary)', boxSizing: 'border-box',
  },
  select: {
    padding: '0.65rem 0.85rem', borderRadius: '8px', border: '1.5px solid var(--border)',
    fontSize: '0.875rem', outline: 'none', width: '100%', backgroundColor: 'var(--bg-raised)',
    color: 'var(--text-primary)', cursor: 'pointer',
  },
  assigneeDisplay: {
    padding: '0.65rem 0.85rem', borderRadius: '8px', border: '1.5px solid var(--border)',
    fontSize: '0.875rem', color: 'var(--text-secondary)', backgroundColor: 'var(--bg-raised)',
  },
  row: { display: 'flex', gap: '0.85rem' },
  saveBtn: {
    width: '100%', padding: '0.75rem',
    background: 'linear-gradient(135deg, var(--avatar-grad-start), var(--avatar-grad-end))', color: '#fff',
    border: 'none', borderRadius: '9px', fontSize: '0.875rem',
    fontWeight: '600', marginBottom: '1.25rem', cursor: 'pointer',
  },
  divider: { height: '1px', backgroundColor: 'var(--border)', marginBottom: '1.25rem' },
  commentsSection: { display: 'flex', flexDirection: 'column', gap: '0.85rem' },
  commentsTitle: {
    fontSize: '0.875rem', fontWeight: '700', color: 'var(--text-primary)',
    display: 'flex', alignItems: 'center', gap: '0.45rem', margin: 0,
  },
  commentCount: {
    backgroundColor: 'var(--accent-soft)', color: 'var(--accent)',
    border: '1px solid var(--accent-border)', borderRadius: '999px',
    padding: '0.08rem 0.45rem', fontSize: '0.72rem', fontWeight: '700',
  },
  commentsList: { display: 'flex', flexDirection: 'column', gap: '0.6rem' },
  noComments: { fontSize: '0.82rem', color: 'var(--text-muted)', textAlign: 'center', padding: '0.75rem 0' },
  commentItem: { backgroundColor: 'var(--bg-raised)', borderRadius: '9px', padding: '0.8rem', border: '1px solid var(--border)' },
  commentTop: { display: 'flex', alignItems: 'center', gap: '0.55rem', marginBottom: '0.45rem' },
  commentAvatar: {
    width: '24px', height: '24px', borderRadius: '50%',
    background: 'linear-gradient(135deg, var(--avatar-grad-start), var(--avatar-grad-end))', color: '#fff',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: '0.68rem', fontWeight: '700', flexShrink: 0,
  },
  commentMeta: { display: 'flex', flexDirection: 'column', flex: 1 },
  commentUser: { fontSize: '0.78rem', fontWeight: '600', color: 'var(--accent)' },
  commentTime: { fontSize: '0.68rem', color: 'var(--text-muted)' },
  deleteCommentBtn: { background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex', padding: '0.1rem' },
  commentText: { fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: '1.5', margin: 0 },
  addComment: { display: 'flex', gap: '0.45rem' },
  commentBtn: {
    padding: '0.65rem 1.1rem', background: 'linear-gradient(135deg, var(--avatar-grad-start), var(--avatar-grad-end))',
    color: '#fff', border: 'none', borderRadius: '8px', fontSize: '0.82rem',
    fontWeight: '600', whiteSpace: 'nowrap', cursor: 'pointer',
  },
}

export default TaskModal
