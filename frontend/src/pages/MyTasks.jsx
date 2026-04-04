import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { getMyTasks } from '../api'
import Navbar from '../components/Navbar'

const priorityColors = {
  low: { bg: '#d1fae5', color: '#065f46' },
  medium: { bg: '#fef3c7', color: '#92400e' },
  high: { bg: '#fee2e2', color: '#991b1b' },
}

function isOverdue(due_date) {
  if (!due_date) return false
  return new Date(due_date) < new Date(new Date().toDateString())
}

function isDueToday(due_date) {
  if (!due_date) return false
  return new Date(due_date).toDateString() === new Date().toDateString()
}

export default function MyTasks() {
  const [tasks, setTasks] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all') // all | today | overdue
  const navigate = useNavigate()

  useEffect(() => {
    getMyTasks()
      .then(setTasks)
      .finally(() => setLoading(false))
  }, [])

  // Group by board
  const grouped = tasks.reduce((acc, task) => {
    const key = task.board_name
    if (!acc[key]) acc[key] = { board_id: task.board_id, tasks: [] }
    acc[key].tasks.push(task)
    return acc
  }, {})

  const filtered = Object.entries(grouped).reduce((acc, [boardName, { board_id, tasks }]) => {
    const filteredTasks = tasks.filter(t => {
      if (filter === 'today') return isDueToday(t.due_date)
      if (filter === 'overdue') return isOverdue(t.due_date)
      return true
    })
    if (filteredTasks.length > 0)
      acc[boardName] = { board_id, tasks: filteredTasks }
    return acc
  }, {})

  const totalCount = tasks.length
  const todayCount = tasks.filter(t => isDueToday(t.due_date)).length
  const overdueCount = tasks.filter(t => isOverdue(t.due_date)).length

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f4f5f7' }}>
      <Navbar />
      <div style={styles.container}>

        {/* Header */}
        <div style={styles.header}>
          <h2 style={styles.title}>My Tasks</h2>
          <p style={styles.subtitle}>All tasks assigned to you across every board</p>
        </div>

        {/* Stats row */}
        <div style={styles.statsRow}>
          <div style={styles.statCard}>
            <p style={styles.statNum}>{totalCount}</p>
            <p style={styles.statLabel}>Total</p>
          </div>
          <div style={styles.statCard}>
            <p style={{ ...styles.statNum, color: '#d97706' }}>{todayCount}</p>
            <p style={styles.statLabel}>Due Today</p>
          </div>
          <div style={styles.statCard}>
            <p style={{ ...styles.statNum, color: '#dc2626' }}>{overdueCount}</p>
            <p style={styles.statLabel}>Overdue</p>
          </div>
        </div>

        {/* Filter tabs */}
        <div style={styles.tabs}>
          {['all', 'today', 'overdue'].map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              style={{
                ...styles.tab,
                ...(filter === f ? styles.tabActive : {}),
              }}
            >
              {f === 'all' ? 'All Tasks' : f === 'today' ? 'Due Today' : 'Overdue'}
            </button>
          ))}
        </div>

        {/* Content */}
        {loading ? (
          <p style={styles.empty}>Loading your tasks...</p>
        ) : Object.keys(filtered).length === 0 ? (
          <p style={styles.empty}>
            {filter === 'all' ? 'No tasks assigned to you yet.' :
             filter === 'today' ? 'No tasks due today.' :
             'No overdue tasks. Great job!'}
          </p>
        ) : (
          Object.entries(filtered).map(([boardName, { board_id, tasks }]) => (
            <div key={boardName} style={styles.boardGroup}>
              <div style={styles.boardGroupHeader}>
                <span style={styles.boardGroupTitle}>🗂 {boardName}</span>
                <button
                  style={styles.goToBoard}
                  onClick={() => navigate(`/board/${board_id}`)}
                >
                  Open board →
                </button>
              </div>

              <div style={styles.taskList}>
                {tasks.map(task => (
                  <div
                    key={task.task_id}
                    style={{
                      ...styles.taskCard,
                      borderLeft: isOverdue(task.due_date)
                        ? '4px solid #ef4444'
                        : isDueToday(task.due_date)
                        ? '4px solid #f59e0b'
                        : '4px solid #e5e7eb',
                    }}
                  >
                    <div style={styles.taskTop}>
                      <p style={styles.taskTitle}>{task.title}</p>
                      <span style={{
                        ...styles.priorityBadge,
                        backgroundColor: priorityColors[task.priority].bg,
                        color: priorityColors[task.priority].color,
                      }}>
                        {task.priority}
                      </span>
                    </div>

                    {task.description && (
                      <p style={styles.taskDesc}>{task.description}</p>
                    )}

                    <div style={styles.taskMeta}>
                      <span style={styles.columnTag}>📌 {task.column_name}</span>

                      {task.due_date && (
                        <span style={{
                          ...styles.dueDate,
                          color: isOverdue(task.due_date) ? '#dc2626'
                               : isDueToday(task.due_date) ? '#d97706'
                               : '#6b7280',
                        }}>
                          {isOverdue(task.due_date) ? '⚠ Overdue · ' :
                           isDueToday(task.due_date) ? '🔔 Due today · ' : '📅 '}
                          {task.due_date}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

const styles = {
  container: {
    maxWidth: '800px',
    margin: '0 auto',
    padding: '2rem 1.5rem',
  },
  header: {
    marginBottom: '1.5rem',
  },
  title: {
    fontSize: '1.8rem',
    fontWeight: '700',
    color: '#1a1a2e',
    margin: '0 0 0.25rem',
  },
  subtitle: {
    color: '#6b7280',
    fontSize: '0.95rem',
    margin: 0,
  },
  statsRow: {
    display: 'flex',
    gap: '1rem',
    marginBottom: '1.5rem',
  },
  statCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: '12px',
    padding: '1rem',
    textAlign: 'center',
    boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
    border: '1.5px solid #e5e7eb',
  },
  statNum: {
    fontSize: '1.8rem',
    fontWeight: '700',
    color: '#1a1a2e',
    margin: '0 0 0.25rem',
  },
  statLabel: {
    fontSize: '0.8rem',
    color: '#9ca3af',
    fontWeight: '600',
    textTransform: 'uppercase',
    margin: 0,
  },
  tabs: {
    display: 'flex',
    gap: '0.5rem',
    marginBottom: '1.5rem',
  },
  tab: {
    padding: '0.45rem 1rem',
    borderRadius: '8px',
    border: '1.5px solid #e5e7eb',
    backgroundColor: '#fff',
    color: '#6b7280',
    fontSize: '0.88rem',
    fontWeight: '500',
    cursor: 'pointer',
  },
  tabActive: {
    backgroundColor: '#5b4fcf',
    color: '#fff',
    border: '1.5px solid #5b4fcf',
  },
  boardGroup: {
    marginBottom: '2rem',
  },
  boardGroupHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: '0.75rem',
  },
  boardGroupTitle: {
    fontSize: '1rem',
    fontWeight: '700',
    color: '#374151',
  },
  goToBoard: {
    background: 'none',
    border: 'none',
    color: '#5b4fcf',
    fontSize: '0.85rem',
    fontWeight: '600',
    cursor: 'pointer',
  },
  taskList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.75rem',
  },
  taskCard: {
    backgroundColor: '#fff',
    borderRadius: '10px',
    padding: '1rem 1.25rem',
    boxShadow: '0 1px 4px rgba(0,0,0,0.07)',
    border: '1.5px solid #e5e7eb',
  },
  taskTop: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '0.4rem',
  },
  taskTitle: {
    margin: 0,
    fontSize: '0.95rem',
    fontWeight: '600',
    color: '#1a1a2e',
  },
  priorityBadge: {
    padding: '0.2rem 0.6rem',
    borderRadius: '999px',
    fontSize: '0.75rem',
    fontWeight: '600',
    textTransform: 'capitalize',
    flexShrink: 0,
  },
  taskDesc: {
    margin: '0 0 0.5rem',
    fontSize: '0.85rem',
    color: '#6b7280',
    lineHeight: 1.4,
  },
  taskMeta: {
    display: 'flex',
    gap: '1rem',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  columnTag: {
    fontSize: '0.8rem',
    color: '#6b7280',
  },
  dueDate: {
    fontSize: '0.8rem',
    fontWeight: '500',
  },
  empty: {
    textAlign: 'center',
    color: '#9ca3af',
    padding: '3rem 0',
    fontSize: '0.95rem',
  },
}