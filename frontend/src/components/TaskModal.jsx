import { useState, useEffect } from 'react'
import { updateTask, addComment, deleteComment, getTeamMembers } from '../api'
import { useAuth } from '../context/AuthContext'

const priorityOptions = ['low', 'medium', 'high']

const priorityColors = {
  low: { bg: 'rgba(52,211,153,0.12)', text: '#34d399', border: 'rgba(52,211,153,0.25)' },
  medium: { bg: 'rgba(251,191,36,0.12)', text: '#fbbf24', border: 'rgba(251,191,36,0.25)' },
  high: { bg: 'rgba(248,113,113,0.12)', text: '#f87171', border: 'rgba(248,113,113,0.25)' },
}

const TaskModal = ({ task, onClose, onRefresh, isTeamBoard }) => {
  const { user } = useAuth()
  const [title, setTitle] = useState(task.title)
  const [description, setDescription] = useState(task.description || '')
  const [priority, setPriority] = useState(task.priority)
  const [dueDate, setDueDate] = useState(task.due_date || '')
  const [assignedTo, setAssignedTo] = useState(task.assigned_to || '')
  const [comment, setComment] = useState('')
  const [saving, setSaving] = useState(false)
  const [commenting, setCommenting] = useState(false)
  const [error, setError] = useState('')
  const [teamMembers, setTeamMembers] = useState([])

  useEffect(() => {
    if (isTeamBoard) fetchTeamMembers()
  }, [isTeamBoard])

  const fetchTeamMembers = async () => {
    try {
      const res = await getTeamMembers()
      setTeamMembers(res.data)
    } catch (err) {}
  }

  const handleSave = async () => {
    if (!title.trim()) {
      setError('Title cannot be empty')
      return
    }
    setSaving(true)
    try {
      await updateTask(task.task_id, {
        title: title.trim(),
        description: description.trim() || null,
        priority,
        due_date: dueDate || null,
        assigned_to: isTeamBoard ? (assignedTo || null) : user?.user_id,
      })
      onRefresh()
      onClose()
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to save changes')
    } finally {
      setSaving(false)
    }
  }

  const handleAddComment = async () => {
    if (!comment.trim()) return
    setCommenting(true)
    try {
      await addComment(task.task_id, {
        text_content: comment.trim(),
        task_id: task.task_id,
      })
      setComment('')
      onRefresh()
    } catch (err) {
      setError('Failed to add comment')
    } finally {
      setCommenting(false)
    }
  }

  const handleDeleteComment = async (commentId) => {
    try {
      await deleteComment(commentId)
      onRefresh()
    } catch (err) {
      setError('Failed to delete comment')
    }
  }

  const isAdmin = user?.role === 'admin'
  const canEdit = isAdmin || task.assigned_to === user?.user_id || !isTeamBoard
  const pc = priorityColors[priority] || priorityColors.medium

  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={styles.modal} onClick={(e) => e.stopPropagation()}>

        {/* Header */}
        <div style={styles.modalHeader}>
          <div style={styles.modalHeaderLeft}>
            <span style={{
              ...styles.priorityDot,
              backgroundColor: pc.text,
              boxShadow: `0 0 8px ${pc.text}60`,
            }} />
            <h3 style={styles.modalTitle}>Task details</h3>
          </div>
          <button style={styles.closeBtn} onClick={onClose}>✕</button>
        </div>

        {error && <div style={styles.error}>{error}</div>}

        {/* Title */}
        <div style={styles.field}>
          <label style={styles.label}>Title</label>
          <input
            style={styles.input}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            disabled={!canEdit}
          />
        </div>

        {/* Description */}
        <div style={styles.field}>
          <label style={styles.label}>Description</label>
          <textarea
            style={styles.textarea}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Add a description..."
            rows={3}
            disabled={!canEdit}
          />
        </div>

        {/* Priority + Due date */}
        <div style={styles.row}>
          <div style={{ ...styles.field, flex: 1 }}>
            <label style={styles.label}>Priority</label>
            <select
              style={{
                ...styles.select,
                color: pc.text,
                borderColor: pc.border,
                backgroundColor: pc.bg,
              }}
              value={priority}
              onChange={(e) => setPriority(e.target.value)}
              disabled={!canEdit}
            >
              {priorityOptions.map((p) => (
                <option key={p} value={p} style={{ backgroundColor: '#12122a', color: '#f0f0ff' }}>
                  {p.charAt(0).toUpperCase() + p.slice(1)}
                </option>
              ))}
            </select>
          </div>

          <div style={{ ...styles.field, flex: 1 }}>
            <label style={styles.label}>Due date</label>
            <input
              style={styles.input}
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              disabled={!canEdit}
            />
          </div>
        </div>

        {/* Assignee — team boards only */}
        {isTeamBoard && teamMembers.length > 0 && (
          <div style={styles.field}>
            <label style={styles.label}>Assigned to</label>
            {isAdmin ? (
              <select
                style={styles.select}
                value={assignedTo}
                onChange={(e) => setAssignedTo(e.target.value)}
              >
                <option value="" style={{ backgroundColor: '#12122a' }}>Unassigned</option>
                {teamMembers.map((member) => (
                  <option
                    key={member.user_id}
                    value={member.user_id}
                    style={{ backgroundColor: '#12122a', color: '#f0f0ff' }}
                  >
                    {member.username} {member.user_id === user?.user_id ? '(you)' : ''}
                  </option>
                ))}
              </select>
            ) : (
              <div style={styles.assigneeDisplay}>
                {task.assigned_to
                  ? teamMembers.find((m) => m.user_id === task.assigned_to)?.username || 'Unknown'
                  : 'Unassigned'}
              </div>
            )}
          </div>
        )}

        {/* Save button */}
        {canEdit && (
          <button style={styles.saveBtn} onClick={handleSave} disabled={saving}>
            {saving ? 'Saving...' : 'Save changes'}
          </button>
        )}

        <div style={styles.divider} />

        {/* Comments */}
        <div style={styles.commentsSection}>
          <h4 style={styles.commentsTitle}>
            💬 Comments
            <span style={styles.commentCount}>{task.comments?.length || 0}</span>
          </h4>

          <div style={styles.commentsList}>
            {task.comments?.length === 0 && (
              <p style={styles.noComments}>No comments yet — be the first!</p>
            )}
            {task.comments?.map((c) => (
              <div key={c.comment_id} style={styles.commentItem}>
                <div style={styles.commentTop}>
                  <div style={styles.commentAvatar}>
                    {teamMembers.find((m) => m.user_id === c.user_id)
                      ?.username?.charAt(0).toUpperCase() || '?'}
                  </div>
                  <div style={styles.commentMeta}>
                    <span style={styles.commentUser}>
                      {teamMembers.find((m) => m.user_id === c.user_id)
                        ?.username || `User #${c.user_id}`}
                    </span>
                    <span style={styles.commentTime}>
                      {new Date(c.timestamp).toLocaleString()}
                    </span>
                  </div>
                  {c.user_id === user?.user_id && (
                    <button
                      style={styles.deleteCommentBtn}
                      onClick={() => handleDeleteComment(c.comment_id)}
                    >
                      ✕
                    </button>
                  )}
                </div>
                <p style={styles.commentText}>{c.text_content}</p>
              </div>
            ))}
          </div>

          <div style={styles.addComment}>
            <input
              style={styles.input}
              placeholder="Write a comment..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAddComment()}
            />
            <button
              style={styles.commentBtn}
              onClick={handleAddComment}
              disabled={commenting}
            >
              {commenting ? '...' : 'Post'}
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
    backgroundColor: 'rgba(0,0,0,0.7)',
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
    maxWidth: '520px',
    maxHeight: '90vh',
    overflowY: 'auto',
    boxShadow: '0 24px 80px rgba(0,0,0,0.6)',
    border: '1px solid #2a2a45',
  },
  modalHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '1.5rem',
  },
  modalHeaderLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.6rem',
  },
  priorityDot: {
    width: '10px',
    height: '10px',
    borderRadius: '50%',
    flexShrink: 0,
  },
  modalTitle: {
    fontSize: '1rem',
    fontWeight: '700',
    color: '#f0f0ff',
    margin: 0,
  },
  closeBtn: {
    background: 'none',
    border: 'none',
    fontSize: '1rem',
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
  field: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.45rem',
    marginBottom: '1rem',
  },
  label: {
    fontSize: '0.78rem',
    fontWeight: '600',
    color: '#8b8bab',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
  },
  input: {
    padding: '0.7rem 0.9rem',
    borderRadius: '8px',
    border: '1.5px solid #2a2a45',
    fontSize: '0.9rem',
    outline: 'none',
    width: '100%',
    backgroundColor: '#12122a',
    color: '#f0f0ff',
    boxSizing: 'border-box',
  },
  textarea: {
    padding: '0.7rem 0.9rem',
    borderRadius: '8px',
    border: '1.5px solid #2a2a45',
    fontSize: '0.9rem',
    outline: 'none',
    resize: 'vertical',
    fontFamily: 'inherit',
    width: '100%',
    backgroundColor: '#12122a',
    color: '#f0f0ff',
    boxSizing: 'border-box',
  },
  select: {
    padding: '0.7rem 0.9rem',
    borderRadius: '8px',
    border: '1.5px solid #2a2a45',
    fontSize: '0.9rem',
    outline: 'none',
    width: '100%',
    backgroundColor: '#12122a',
    color: '#f0f0ff',
    cursor: 'pointer',
  },
  assigneeDisplay: {
    padding: '0.7rem 0.9rem',
    borderRadius: '8px',
    border: '1.5px solid #2a2a45',
    fontSize: '0.9rem',
    color: '#8b8bab',
    backgroundColor: '#12122a',
  },
  row: {
    display: 'flex',
    gap: '1rem',
  },
  saveBtn: {
    width: '100%',
    padding: '0.8rem',
    background: 'linear-gradient(135deg, #7c6ef0, #5b4fcf)',
    color: '#fff',
    border: 'none',
    borderRadius: '10px',
    fontSize: '0.9rem',
    fontWeight: '600',
    marginBottom: '1.5rem',
    cursor: 'pointer',
    boxShadow: '0 4px 16px rgba(124,110,240,0.3)',
  },
  divider: {
    height: '1px',
    backgroundColor: '#2a2a45',
    marginBottom: '1.5rem',
  },
  commentsSection: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
  },
  commentsTitle: {
    fontSize: '0.9rem',
    fontWeight: '700',
    color: '#f0f0ff',
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    margin: 0,
  },
  commentCount: {
    backgroundColor: 'rgba(124,110,240,0.15)',
    color: '#a78bfa',
    border: '1px solid rgba(124,110,240,0.3)',
    borderRadius: '999px',
    padding: '0.1rem 0.5rem',
    fontSize: '0.75rem',
    fontWeight: '700',
  },
  commentsList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.75rem',
  },
  noComments: {
    fontSize: '0.85rem',
    color: '#4a4a6a',
    textAlign: 'center',
    padding: '1rem 0',
  },
  commentItem: {
    backgroundColor: '#12122a',
    borderRadius: '10px',
    padding: '0.85rem',
    border: '1px solid #2a2a45',
  },
  commentTop: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.6rem',
    marginBottom: '0.5rem',
  },
  commentAvatar: {
    width: '26px',
    height: '26px',
    borderRadius: '50%',
    background: 'linear-gradient(135deg, #7c6ef0, #5b4fcf)',
    color: '#ffffff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '0.7rem',
    fontWeight: '700',
    flexShrink: 0,
  },
  commentMeta: {
    display: 'flex',
    flexDirection: 'column',
    flex: 1,
  },
  commentUser: {
    fontSize: '0.8rem',
    fontWeight: '600',
    color: '#a78bfa',
  },
  commentTime: {
    fontSize: '0.7rem',
    color: '#4a4a6a',
  },
  deleteCommentBtn: {
    background: 'none',
    border: 'none',
    color: '#4a4a6a',
    fontSize: '0.75rem',
    cursor: 'pointer',
    padding: '0.2rem',
    borderRadius: '4px',
  },
  commentText: {
    fontSize: '0.85rem',
    color: '#c0c0e0',
    lineHeight: '1.5',
    margin: 0,
  },
  addComment: {
    display: 'flex',
    gap: '0.5rem',
  },
  commentBtn: {
    padding: '0.7rem 1.25rem',
    background: 'linear-gradient(135deg, #7c6ef0, #5b4fcf)',
    color: '#fff',
    border: 'none',
    borderRadius: '8px',
    fontSize: '0.875rem',
    fontWeight: '600',
    whiteSpace: 'nowrap',
    cursor: 'pointer',
    boxShadow: '0 2px 10px rgba(124,110,240,0.3)',
  },
}

export default TaskModal