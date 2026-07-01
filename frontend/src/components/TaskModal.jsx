import { useState, useEffect } from 'react'
import { updateTask, addComment, deleteComment, getTeamMembers } from '../api'
import { useAuth } from '../context/AuthContext'

const priorityOptions = ['low', 'medium', 'high']
const priorityColors  = {
  low:    { bg: 'rgba(16,185,129,0.1)',  text: '#34D399', border: 'rgba(16,185,129,0.25)' },
  medium: { bg: 'rgba(245,158,11,0.1)',  text: '#FBBF24', border: 'rgba(245,158,11,0.25)' },
  high:   { bg: 'rgba(239,68,68,0.1)',   text: '#F87171', border: 'rgba(239,68,68,0.25)' },
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

  useEffect(() => { if (isTeamBoard) fetchTeamMembers() }, [isTeamBoard])

  const fetchTeamMembers = async () => { try { const r = await getTeamMembers(); setTeamMembers(r.data) } catch {} }

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
          <button style={s.closeBtn} onClick={onClose}>&times;</button>
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
                <option key={p} value={p} style={{ backgroundColor: '#263348', color: '#F1F5F9' }}>
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
                <option value="" style={{ backgroundColor: '#263348' }}>Unassigned</option>
                {teamMembers.map(m => (
                  <option key={m.user_id} value={m.user_id} style={{ backgroundColor: '#263348', color: '#F1F5F9' }}>
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
                    <button style={s.deleteCommentBtn} onClick={() => handleDeleteComment(c.comment_id)}>&times;</button>
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
    position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.7)',
    backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center',
    justifyContent: 'center', zIndex: 200, padding: '1rem',
  },
  modal: {
    backgroundColor: '#1E293B', borderRadius: '14px', padding: '1.6rem',
    width: '100%', maxWidth: '510px', maxHeight: '90vh', overflowY: 'auto',
    boxShadow: '0 24px 80px rgba(0,0,0,0.6)', border: '1px solid #334155',
  },
  modalHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.4rem' },
  modalHeaderLeft: { display: 'flex', alignItems: 'center', gap: '0.55rem' },
  priorityDot: { width: '9px', height: '9px', borderRadius: '50%', flexShrink: 0 },
  modalTitle: { fontSize: '0.95rem', fontWeight: '700', color: '#F1F5F9', margin: 0 },
  closeBtn: { background: 'none', border: 'none', fontSize: '1.3rem', color: '#64748B', cursor: 'pointer', lineHeight: 1 },
  error: {
    backgroundColor: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.3)',
    color: '#FCA5A5', padding: '0.6rem 0.85rem', borderRadius: '7px', marginBottom: '1rem', fontSize: '0.82rem',
  },
  field: { display: 'flex', flexDirection: 'column', gap: '0.4rem', marginBottom: '0.9rem' },
  label: { fontSize: '0.72rem', fontWeight: '600', color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.05em' },
  input: {
    padding: '0.65rem 0.85rem', borderRadius: '8px', border: '1.5px solid #334155',
    fontSize: '0.875rem', outline: 'none', width: '100%',
    backgroundColor: '#263348', color: '#F1F5F9', boxSizing: 'border-box',
  },
  textarea: {
    padding: '0.65rem 0.85rem', borderRadius: '8px', border: '1.5px solid #334155',
    fontSize: '0.875rem', outline: 'none', resize: 'vertical', fontFamily: 'inherit',
    width: '100%', backgroundColor: '#263348', color: '#F1F5F9', boxSizing: 'border-box',
  },
  select: {
    padding: '0.65rem 0.85rem', borderRadius: '8px', border: '1.5px solid #334155',
    fontSize: '0.875rem', outline: 'none', width: '100%', backgroundColor: '#263348',
    color: '#F1F5F9', cursor: 'pointer',
  },
  assigneeDisplay: {
    padding: '0.65rem 0.85rem', borderRadius: '8px', border: '1.5px solid #334155',
    fontSize: '0.875rem', color: '#94A3B8', backgroundColor: '#263348',
  },
  row: { display: 'flex', gap: '0.85rem' },
  saveBtn: {
    width: '100%', padding: '0.75rem',
    background: 'linear-gradient(135deg,#3B82F6,#1D4ED8)', color: '#fff',
    border: 'none', borderRadius: '9px', fontSize: '0.875rem',
    fontWeight: '600', marginBottom: '1.25rem', cursor: 'pointer',
  },
  divider: { height: '1px', backgroundColor: '#334155', marginBottom: '1.25rem' },
  commentsSection: { display: 'flex', flexDirection: 'column', gap: '0.85rem' },
  commentsTitle: {
    fontSize: '0.875rem', fontWeight: '700', color: '#F1F5F9',
    display: 'flex', alignItems: 'center', gap: '0.45rem', margin: 0,
  },
  commentCount: {
    backgroundColor: 'rgba(59,130,246,0.1)', color: '#93C5FD',
    border: '1px solid rgba(59,130,246,0.25)', borderRadius: '999px',
    padding: '0.08rem 0.45rem', fontSize: '0.72rem', fontWeight: '700',
  },
  commentsList: { display: 'flex', flexDirection: 'column', gap: '0.6rem' },
  noComments: { fontSize: '0.82rem', color: '#475569', textAlign: 'center', padding: '0.75rem 0' },
  commentItem: { backgroundColor: '#263348', borderRadius: '9px', padding: '0.8rem', border: '1px solid #334155' },
  commentTop: { display: 'flex', alignItems: 'center', gap: '0.55rem', marginBottom: '0.45rem' },
  commentAvatar: {
    width: '24px', height: '24px', borderRadius: '50%',
    background: 'linear-gradient(135deg,#3B82F6,#1D4ED8)', color: '#fff',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: '0.68rem', fontWeight: '700', flexShrink: 0,
  },
  commentMeta: { display: 'flex', flexDirection: 'column', flex: 1 },
  commentUser: { fontSize: '0.78rem', fontWeight: '600', color: '#93C5FD' },
  commentTime: { fontSize: '0.68rem', color: '#475569' },
  deleteCommentBtn: { background: 'none', border: 'none', color: '#475569', fontSize: '1rem', cursor: 'pointer', padding: '0.1rem' },
  commentText: { fontSize: '0.82rem', color: '#CBD5E1', lineHeight: '1.5', margin: 0 },
  addComment: { display: 'flex', gap: '0.45rem' },
  commentBtn: {
    padding: '0.65rem 1.1rem', background: 'linear-gradient(135deg,#3B82F6,#1D4ED8)',
    color: '#fff', border: 'none', borderRadius: '8px', fontSize: '0.82rem',
    fontWeight: '600', whiteSpace: 'nowrap', cursor: 'pointer',
  },
}

export default TaskModal