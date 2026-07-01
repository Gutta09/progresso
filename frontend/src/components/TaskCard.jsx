const priorityColors = {
  low:    { bg: 'rgba(16,185,129,0.1)',  text: '#34D399', border: 'rgba(16,185,129,0.25)' },
  medium: { bg: 'rgba(245,158,11,0.1)',  text: '#FBBF24', border: 'rgba(245,158,11,0.25)' },
  high:   { bg: 'rgba(239,68,68,0.1)',   text: '#F87171', border: 'rgba(239,68,68,0.25)' },
}

const TaskCard = ({ task, onDragStart, onDelete, onClick, teamMembers = [] }) => {
  const priority = priorityColors[task.priority] || priorityColors.medium
  const assignee = teamMembers.find(m => m.user_id === task.assigned_to)

  const today     = new Date().toDateString()
  const dueDate   = task.due_date ? new Date(task.due_date) : null
  const isOverdue = dueDate && dueDate < new Date(today)
  const isDueToday = dueDate && dueDate.toDateString() === today

  return (
    <div
      style={{
        ...s.card,
        ...(isOverdue  ? s.cardOverdue   : {}),
        ...(isDueToday ? s.cardDueToday  : {}),
      }}
      draggable
      onDragStart={() => onDragStart(task)}
      onClick={() => onClick(task)}
    >
      {isDueToday && <div style={s.dueTodayBanner}>Due Today</div>}

      <div style={s.top}>
        <p style={s.title}>{task.title}</p>
        {onDelete && (
          <button
            style={s.deleteBtn}
            onClick={(e) => { e.stopPropagation(); onDelete(task.task_id) }}
          >
            &times;
          </button>
        )}
      </div>

      {task.description && <p style={s.description}>{task.description}</p>}

      <div style={s.bottom}>
        <span style={{ ...s.priority, backgroundColor: priority.bg, color: priority.text, border: `1px solid ${priority.border}` }}>
          {task.priority}
        </span>

        {task.due_date && (
          <span style={{
            ...s.dueDate,
            color: isOverdue ? '#F87171' : isDueToday ? '#FBBF24' : '#475569',
            fontWeight: isOverdue || isDueToday ? '600' : '400',
          }}>
            {isOverdue ? 'Overdue · ' : ''}Due {task.due_date}
          </span>
        )}

        <div style={s.rightBadges}>
          {task.comments?.length > 0 && (
            <span style={s.comments}>{task.comments.length} comment{task.comments.length !== 1 ? 's' : ''}</span>
          )}
          {assignee && (
            <div style={s.avatar} title={assignee.username}>
              {assignee.username.charAt(0).toUpperCase()}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

const s = {
  card: {
    backgroundColor: '#263348', borderRadius: '9px',
    padding: '0.8rem 0.85rem', border: '1px solid #334155',
    cursor: 'grab', transition: 'border-color 0.15s, box-shadow 0.15s', overflow: 'hidden',
  },
  cardOverdue:  { border: '1px solid rgba(239,68,68,0.35)', backgroundColor: 'rgba(239,68,68,0.04)' },
  cardDueToday: { border: '1px solid rgba(245,158,11,0.35)', backgroundColor: 'rgba(245,158,11,0.04)' },
  dueTodayBanner: {
    backgroundColor: 'rgba(245,158,11,0.1)', color: '#FBBF24',
    border: '1px solid rgba(245,158,11,0.25)', fontSize: '0.68rem',
    fontWeight: '700', padding: '0.18rem 0.5rem', borderRadius: '5px',
    marginBottom: '0.55rem', display: 'inline-block', letterSpacing: '0.04em',
    textTransform: 'uppercase',
  },
  top: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.3rem', gap: '0.4rem' },
  title: { fontSize: '0.85rem', fontWeight: '600', color: '#F1F5F9', lineHeight: '1.4', flex: 1, margin: 0 },
  deleteBtn: {
    background: 'none', border: 'none', color: '#475569',
    fontSize: '1rem', padding: '0.05rem 0.25rem', borderRadius: '4px', flexShrink: 0, cursor: 'pointer', lineHeight: 1,
  },
  description: {
    fontSize: '0.75rem', color: '#94A3B8', marginBottom: '0.5rem', lineHeight: '1.4',
    display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', margin: '0 0 0.5rem',
  },
  bottom: { display: 'flex', alignItems: 'center', gap: '0.45rem', flexWrap: 'wrap', marginTop: '0.55rem' },
  priority: {
    fontSize: '0.67rem', fontWeight: '700', padding: '0.13rem 0.5rem',
    borderRadius: '999px', textTransform: 'capitalize', letterSpacing: '0.04em',
  },
  dueDate:  { fontSize: '0.7rem' },
  rightBadges: { display: 'flex', alignItems: 'center', gap: '0.35rem', marginLeft: 'auto' },
  comments: { fontSize: '0.68rem', color: '#475569' },
  avatar: {
    width: '20px', height: '20px', borderRadius: '50%',
    background: 'linear-gradient(135deg,#3B82F6,#1D4ED8)', color: '#fff',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: '0.6rem', fontWeight: '700', flexShrink: 0,
  },
}

export default TaskCard