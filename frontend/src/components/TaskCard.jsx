const priorityColors = {
  low: { bg: '#ecfdf5', text: '#059669', border: '#6ee7b7' },
  medium: { bg: '#fffbeb', text: '#d97706', border: '#fcd34d' },
  high: { bg: '#fef2f2', text: '#dc2626', border: '#fca5a5' },
}

const TaskCard = ({ task, onDragStart, onDelete, onClick, teamMembers = [] }) => {
  const priority = priorityColors[task.priority] || priorityColors.medium
  const assignee = teamMembers.find((m) => m.user_id === task.assigned_to)
  const isOverdue = task.due_date && new Date(task.due_date) < new Date()

  return (
    <div
      style={{
        ...styles.card,
        ...(isOverdue ? styles.cardOverdue : {}),
      }}
      draggable
      onDragStart={() => onDragStart(task)}
      onClick={() => onClick(task)}
    >
      <div style={styles.top}>
        <p style={styles.title}>{task.title}</p>
        <button
          style={styles.deleteBtn}
          onClick={(e) => {
            e.stopPropagation()
            onDelete(task.task_id)
          }}
        >
          ✕
        </button>
      </div>

      {task.description && (
        <p style={styles.description}>{task.description}</p>
      )}

      <div style={styles.bottom}>
        <span
          style={{
            ...styles.priority,
            backgroundColor: priority.bg,
            color: priority.text,
            border: `1px solid ${priority.border}`,
          }}
        >
          {task.priority}
        </span>

        {task.due_date && (
          <span style={{
            ...styles.dueDate,
            color: isOverdue ? '#dc2626' : '#9ca3af',
            fontWeight: isOverdue ? '600' : '400',
          }}>
            {isOverdue ? '⚠ ' : ''}Due {task.due_date}
          </span>
        )}

        <div style={styles.rightBadges}>
          {task.comments?.length > 0 && (
            <span style={styles.comments}>
              💬 {task.comments.length}
            </span>
          )}
          {assignee && (
            <div style={styles.avatar} title={assignee.username}>
              {assignee.username.charAt(0).toUpperCase()}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

const styles = {
  card: {
    backgroundColor: '#ffffff',
    borderRadius: '10px',
    padding: '0.9rem 1rem',
    boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
    border: '1.5px solid #f3f4f6',
    cursor: 'grab',
    transition: 'box-shadow 0.15s',
  },
  cardOverdue: {
    border: '1.5px solid #fca5a5',
    backgroundColor: '#fff9f9',
  },
  top: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '0.4rem',
    gap: '0.5rem',
  },
  title: {
    fontSize: '0.9rem',
    fontWeight: '600',
    color: '#1a1a2e',
    lineHeight: '1.4',
    flex: 1,
  },
  deleteBtn: {
    background: 'none',
    border: 'none',
    color: '#d1d5db',
    fontSize: '0.8rem',
    padding: '0.1rem 0.3rem',
    borderRadius: '4px',
    flexShrink: 0,
    cursor: 'pointer',
  },
  description: {
    fontSize: '0.8rem',
    color: '#6b7280',
    marginBottom: '0.6rem',
    lineHeight: '1.4',
    display: '-webkit-box',
    WebkitLineClamp: 2,
    WebkitBoxOrient: 'vertical',
    overflow: 'hidden',
  },
  bottom: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    flexWrap: 'wrap',
    marginTop: '0.5rem',
  },
  priority: {
    fontSize: '0.72rem',
    fontWeight: '600',
    padding: '0.15rem 0.5rem',
    borderRadius: '999px',
    textTransform: 'capitalize',
  },
  dueDate: {
    fontSize: '0.75rem',
  },
  rightBadges: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.4rem',
    marginLeft: 'auto',
  },
  comments: {
    fontSize: '0.75rem',
    color: '#9ca3af',
  },
  avatar: {
    width: '22px',
    height: '22px',
    borderRadius: '50%',
    backgroundColor: '#5b4fcf',
    color: '#ffffff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '0.65rem',
    fontWeight: '700',
    flexShrink: 0,
  },
}

export default TaskCard