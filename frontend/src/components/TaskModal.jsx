import { useState, useEffect } from 'react'
import { updateTask, addComment, deleteComment, getTeamMembers } from '../api'
import { useAuth } from '../context/AuthContext'

const priorityOptions = ['low', 'medium', 'high']

const TaskModal = ({ task, onClose, onRefresh }) => {
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
    fetchTeamMembers()
  }, [])

  const fetchTeamMembers = async () => {
    try {
      const res = await getTeamMembers()
      setTeamMembers(res.data)
    } catch (err) {
      // not in a team, that's fine
    }
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
        assigned_to: assignedTo || null,
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

  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div style={styles.modalHeader}>
          <h3 style={styles.modalTitle}>Task details</h3>
          <button style={styles.closeBtn} onClick={onClose}>✕</button>
        </div>

        {error && <div style={styles.error}>{error}</div>}

        <div style={styles.field}>
          <label style={styles.label}>Title</label>
          <input
            style={styles.input}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            disabled={!isAdmin && task.assigned_to !== user?.user_id}
          />
        </div>

        <div style={styles.field}>
          <label style={styles.label}>Description</label>
          <textarea
            style={styles.textarea}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Add a description..."
            rows={3}
            disabled={!isAdmin && task.assigned_to !== user?.user_id}
          />
        </div>

        <div style={styles.row}>
          <div style={{ ...styles.field, flex: 1 }}>
            <label style={styles.label}>Priority</label>
            <select
              style={styles.select}
              value={priority}
              onChange={(e) => setPriority(e.target.value)}
              disabled={!isAdmin && task.assigned_to !== user?.user_id}
            >
              {priorityOptions.map((p) => (
                <option key={p} value={p}>
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
              disabled={!isAdmin && task.assigned_to !== user?.user_id}
            />
          </div>
        </div>

        {teamMembers.length > 0 && (
          <div style={styles.field}>
            <label style={styles.label}>Assigned to</label>
            {isAdmin ? (
              <select
                style={styles.select}
                value={assignedTo}
                onChange={(e) => setAssignedTo(e.target.value)}
              >
                <option value="">Unassigned</option>
                {teamMembers.map((member) => (
                  <option key={member.user_id} value={member.user_id}>
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

        {(isAdmin || task.assigned_to === user?.user_id) && (
          <button style={styles.saveBtn} onClick={handleSave} disabled={saving}>
            {saving ? 'Saving...' : 'Save changes'}
          </button>
        )}

        <div style={styles.divider} />

        <div style={styles.commentsSection}>
          <h4 style={styles.commentsTitle}>
            Comments ({task.comments?.length || 0})
          </h4>

          <div style={styles.commentsList}>
            {task.comments?.length === 0 && (
              <p style={styles.noComments}>No comments yet</p>
            )}
            {task.comments?.map((c) => (
              <div key={c.comment_id} style={styles.commentItem}>
                <div style={styles.commentTop}>
                  <div style={styles.commentAvatar}>
                    {teamMembers.find((m) => m.user_id === c.user_id)?.username?.charAt(0).toUpperCase() || '?'}
                  </div>
                  <span style={styles.commentUser}>
                    {teamMembers.find((m) => m.user_id === c.user_id)?.username || `User #${c.user_id}`}
                  </span>
                  <span style={styles.commentTime}>
                    {new Date(c.timestamp).toLocaleString()}
                  </span>
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
    maxWidth: '520px',
    maxHeight: '90vh',
    overflowY: 'auto',
    boxShadow: '0 8px 40px rgba(0,0,0,0.15)',
  },
  modalHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '1.5rem',
  },
  modalTitle: {
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
  field: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.4rem',
    marginBottom: '1rem',
  },
  label: {
    fontSize: '0.85rem',
    fontWeight: '500',
    color: '#374151',
  },
  input: {
    padding: '0.65rem 0.9rem',
    borderRadius: '8px',
    border: '1.5px solid #e5e7eb',
    fontSize: '0.9rem',
    outline: 'none',
    width: '100%',
  },
  textarea: {
    padding: '0.65rem 0.9rem',
    borderRadius: '8px',
    border: '1.5px solid #e5e7eb',
    fontSize: '0.9rem',
    outline: 'none',
    resize: 'vertical',
    fontFamily: 'inherit',
    width: '100%',
  },
  select: {
    padding: '0.65rem 0.9rem',
    borderRadius: '8px',
    border: '1.5px solid #e5e7eb',
    fontSize: '0.9rem',
    outline: 'none',
    backgroundColor: '#fff',
    width: '100%',
  },
  assigneeDisplay: {
    padding: '0.65rem 0.9rem',
    borderRadius: '8px',
    border: '1.5px solid #e5e7eb',
    fontSize: '0.9rem',
    color: '#374151',
    backgroundColor: '#f9fafb',
  },
  row: {
    display: 'flex',
    gap: '1rem',
  },
  saveBtn: {
    width: '100%',
    padding: '0.75rem',
    backgroundColor: '#5b4fcf',
    color: '#fff',
    border: 'none',
    borderRadius: '8px',
    fontSize: '0.95rem',
    fontWeight: '600',
    marginBottom: '1.5rem',
    cursor: 'pointer',
  },
  divider: {
    height: '1px',
    backgroundColor: '#f3f4f6',
    marginBottom: '1.5rem',
  },
  commentsSection: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
  },
  commentsTitle: {
    fontSize: '0.95rem',
    fontWeight: '600',
    color: '#374151',
  },
  commentsList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.75rem',
  },
  noComments: {
    fontSize: '0.85rem',
    color: '#9ca3af',
  },
  commentItem: {
    backgroundColor: '#f9fafb',
    borderRadius: '8px',
    padding: '0.75rem',
  },
  commentTop: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    marginBottom: '0.4rem',
  },
  commentAvatar: {
    width: '24px',
    height: '24px',
    borderRadius: '50%',
    backgroundColor: '#5b4fcf',
    color: '#ffffff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '0.7rem',
    fontWeight: '700',
    flexShrink: 0,
  },
  commentUser: {
    fontSize: '0.8rem',
    fontWeight: '600',
    color: '#5b4fcf',
  },
  commentTime: {
    fontSize: '0.75rem',
    color: '#9ca3af',
    flex: 1,
  },
  deleteCommentBtn: {
    background: 'none',
    border: 'none',
    color: '#d1d5db',
    fontSize: '0.75rem',
    cursor: 'pointer',
  },
  commentText: {
    fontSize: '0.85rem',
    color: '#374151',
    lineHeight: '1.5',
  },
  addComment: {
    display: 'flex',
    gap: '0.5rem',
  },
  commentBtn: {
    padding: '0.65rem 1.25rem',
    backgroundColor: '#5b4fcf',
    color: '#fff',
    border: 'none',
    borderRadius: '8px',
    fontSize: '0.9rem',
    fontWeight: '600',
    whiteSpace: 'nowrap',
    cursor: 'pointer',
  },
}

export default TaskModal