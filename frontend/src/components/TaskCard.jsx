const priorityColors = {
  low: { bg: 'rgba(52,211,153,0.12)', text: '#34d399', border: 'rgba(52,211,153,0.25)' },
  medium: { bg: 'rgba(251,191,36,0.12)', text: '#fbbf24', border: 'rgba(251,191,36,0.25)' },
  high: { bg: 'rgba(248,113,113,0.12)', text: '#f87171', border: 'rgba(248,113,113,0.25)' },
}

const TaskCard = ({ task, onDragStart, onDelete, onClick, teamMembers = [] }) => {
  const priority = priorityColors[task.priority] || priorityColors.medium
  const assignee = teamMembers.find((m) => m.user_id === task.assigned_to)

  const today = new Date().toDateString()
  const dueDate = task.due_date ? new Date(task.due_date) : null
  const isOverdue = dueDate && dueDate < new Date(today)
  const isDueToday = dueDate && dueDate.toDateString() === today

  return (
    <div
      style={{
        ...styles.card,
        ...(isOverdue ? styles.cardOverdue : {}),
        ...(isDueToday ? styles.cardDueToday : {}),
      }}
      draggable
      onDragStart={() => onDragStart(task)}
      onClick={() => onClick(task)}
    >
      {/* Due today banner */}
      {isDueToday && (
        <div style={styles.dueTodayBanner}>
          🔔 Due Today
        </div>
      )}

      <div style={styles.top}>
        <p style={styles.title}>{task.title}</p>
        {onDelete && (
          <button
            style={styles.deleteBtn}
            onClick={(e) => {
              e.stopPropagation()
              onDelete(task.task_id)
            }}
          >
            ✕
          </button>
        )}
      </div>

      {task.description && (
        <p style={styles.description}>{task.description}</p>
      )}

      <div style={styles.bottom}>
        <span style={{
          ...styles.priority,
          backgroundColor: priority.bg,
          color: priority.text,
          border: `1px solid ${priority.border}`,
        }}>
          {task.priority}
        </span>

        {task.due_date && (
          <span style={{
            ...styles.dueDate,
            color: isOverdue ? '#f87171' : isDueToday ? '#fbbf24' : '#4a4a6a',
            fontWeight: isOverdue || isDueToday ? '600' : '400',
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
    backgroundColor: '#12122a',
    borderRadius: '10px',
    padding: '0.85rem 0.9rem',
    border: '1px solid #2a2a45',
    cursor: 'grab',
    transition: 'border-color 0.15s, box-shadow 0.15s',
    overflow: 'hidden',
  },
  cardOverdue: {
    border: '1px solid rgba(248,113,113,0.4)',
    backgroundColor: 'rgba(248,113,113,0.05)',
  },
  cardDueToday: {
    border: '1px solid rgba(251,191,36,0.4)',
    backgroundColor: 'rgba(251,191,36,0.05)',
  },
  dueTodayBanner: {
    backgroundColor: 'rgba(251,191,36,0.12)',
    color: '#fbbf24',
    border: '1px solid rgba(251,191,36,0.25)',
    fontSize: '0.7rem',
    fontWeight: '700',
    padding: '0.2rem 0.55rem',
    borderRadius: '6px',
    marginBottom: '0.6rem',
    display: 'inline-block',
    letterSpacing: '0.03em',
  },
  top: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '0.35rem',
    gap: '0.5rem',
  },
  title: {
    fontSize: '0.875rem',
    fontWeight: '600',
    color: '#f0f0ff',
    lineHeight: '1.4',
    flex: 1,
    margin: 0,
  },
  deleteBtn: {
    background: 'none',
    border: 'none',
    color: '#4a4a6a',
    fontSize: '0.75rem',
    padding: '0.1rem 0.3rem',
    borderRadius: '4px',
    flexShrink: 0,
    cursor: 'pointer',
  },
  description: {
    fontSize: '0.78rem',
    color: '#8b8bab',
    marginBottom: '0.6rem',
    lineHeight: '1.4',
    display: '-webkit-box',
    WebkitLineClamp: 2,
    WebkitBoxOrient: 'vertical',
    overflow: 'hidden',
    margin: '0 0 0.6rem',
  },
  bottom: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    flexWrap: 'wrap',
    marginTop: '0.6rem',
  },
  priority: {
    fontSize: '0.7rem',
    fontWeight: '700',
    padding: '0.15rem 0.55rem',
    borderRadius: '999px',
    textTransform: 'capitalize',
    letterSpacing: '0.03em',
  },
  dueDate: {
    fontSize: '0.72rem',
  },
  rightBadges: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.4rem',
    marginLeft: 'auto',
  },
  comments: {
    fontSize: '0.72rem',
    color: '#4a4a6a',
  },
  avatar: {
    width: '22px',
    height: '22px',
    borderRadius: '50%',
    background: 'linear-gradient(135deg, #7c6ef0, #5b4fcf)',
    color: '#ffffff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '0.62rem',
    fontWeight: '700',
    flexShrink: 0,
    boxShadow: '0 2px 6px rgba(124,110,240,0.3)',
  },
}

export default TaskCard