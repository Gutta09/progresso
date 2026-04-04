import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { getMyTasks } from '../api'
import Navbar from '../components/Navbar'

const priorityColors = {
  low: { bg: 'rgba(52,211,153,0.12)', color: '#34d399', border: 'rgba(52,211,153,0.25)' },
  medium: { bg: 'rgba(251,191,36,0.12)', color: '#fbbf24', border: 'rgba(251,191,36,0.25)' },
  high: { bg: 'rgba(248,113,113,0.12)', color: '#f87171', border: 'rgba(248,113,113,0.25)' },
}

const boardAccents = ['#7c6ef0', '#34d399', '#fbbf24', '#f87171', '#60a5fa', '#a78bfa']

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
  const [filter, setFilter] = useState('all')
  const navigate = useNavigate()

  useEffect(() => {
    getMyTasks()
      .then(setTasks)
      .finally(() => setLoading(false))
  }, [])

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

  const tabs = [
    { key: 'all', label: 'All Tasks', count: totalCount },
    { key: 'today', label: '🔔 Due Today', count: todayCount },
    { key: 'overdue', label: '⚠ Overdue', count: overdueCount },
  ]

  return (
    <div style={styles.page}>
      <Navbar />
      <div style={styles.container}>

        {/* ── Header ── */}
        <div style={styles.header}>
          <div>
            <h2 style={styles.title}>My Tasks</h2>
            <p style={styles.subtitle}>All tasks assigned to you across every board</p>
          </div>
        </div>

        {/* ── Stats ── */}
        <div style={styles.statsRow}>
          <div style={styles.statCard}>
            <p style={styles.statNum}>{totalCount}</p>
            <p style={styles.statLabel}>Total</p>
          </div>
          <div style={styles.statCard}>
            <p style={{ ...styles.statNum, color: '#fbbf24' }}>{todayCount}</p>
            <p style={styles.statLabel}>Due Today</p>
          </div>
          <div style={styles.statCard}>
            <p style={{ ...styles.statNum, color: '#f87171' }}>{overdueCount}</p>
            <p style={styles.statLabel}>Overdue</p>
          </div>
          <div style={styles.statCard}>
            <p style={{ ...styles.statNum, color: '#34d399' }}>
              {totalCount - overdueCount}
            </p>
            <p style={styles.statLabel}>On Track</p>
          </div>
        </div>

        {/* ── Filter tabs ── */}
        <div style={styles.tabs}>
          {tabs.map(t => (
            <button
              key={t.key}
              onClick={() => setFilter(t.key)}
              style={{
                ...styles.tab,
                ...(filter === t.key ? styles.tabActive : {}),
              }}
            >
              {t.label}
              <span style={{
                ...styles.tabCount,
                backgroundColor: filter === t.key
                  ? 'rgba(255,255,255,0.2)'
                  : '#2a2a45',
                color: filter === t.key ? '#fff' : '#8b8bab',
              }}>
                {t.count}
              </span>
            </button>
          ))}
        </div>

        {/* ── Content ── */}
        {loading ? (
          <div style={styles.emptyState}>
            <p style={styles.emptyText}>Loading your tasks...</p>
          </div>
        ) : Object.keys(filtered).length === 0 ? (
          <div style={styles.emptyState}>
            <p style={styles.emptyIcon}>
              {filter === 'overdue' ? '🎉' : '📋'}
            </p>
            <p style={styles.emptyText}>
              {filter === 'all' ? 'No tasks assigned to you yet.' :
               filter === 'today' ? 'No tasks due today.' :
               'No overdue tasks — great work!'}
            </p>
          </div>
        ) : (
          Object.entries(filtered).map(([boardName, { board_id, tasks }], boardIndex) => {
            const accent = boardAccents[boardIndex % boardAccents.length]
            return (
              <div key={boardName} style={styles.boardGroup}>
                {/* Board group header */}
                <div style={styles.boardGroupHeader}>
                  <div style={styles.boardGroupLeft}>
                    <div style={{
                      ...styles.boardAccentDot,
                      backgroundColor: accent,
                      boxShadow: `0 0 8px ${accent}60`,
                    }} />
                    <span style={styles.boardGroupTitle}>{boardName}</span>
                    <span style={{
                      ...styles.boardTaskCount,
                      backgroundColor: `${accent}20`,
                      color: accent,
                    }}>
                      {tasks.length}
                    </span>
                  </div>
                  <button
                    style={{ ...styles.goToBoard, color: accent }}
                    onClick={() => navigate(`/board/${board_id}`)}
                  >
                    Open board →
                  </button>
                </div>

                {/* Task cards */}
                <div style={styles.taskList}>
                  {tasks.map(task => {
                    const pc = priorityColors[task.priority] || priorityColors.medium
                    const overdue = isOverdue(task.due_date)
                    const dueToday = isDueToday(task.due_date)

                    return (
                      <div
                        key={task.task_id}
                        style={{
                          ...styles.taskCard,
                          borderLeft: overdue
                            ? '3px solid #f87171'
                            : dueToday
                            ? '3px solid #fbbf24'
                            : `3px solid ${accent}`,
                        }}
                      >
                        <div style={styles.taskTop}>
                          <p style={styles.taskTitle}>{task.title}</p>
                          <span style={{
                            ...styles.priorityBadge,
                            backgroundColor: pc.bg,
                            color: pc.color,
                            border: `1px solid ${pc.border}`,
                          }}>
                            {task.priority}
                          </span>
                        </div>

                        {task.description && (
                          <p style={styles.taskDesc}>{task.description}</p>
                        )}

                        <div style={styles.taskMeta}>
                          <span style={styles.columnTag}>
                            📌 {task.column_name}
                          </span>
                          {task.due_date && (
                            <span style={{
                              ...styles.dueDate,
                              color: overdue ? '#f87171'
                                   : dueToday ? '#fbbf24'
                                   : '#4a4a6a',
                            }}>
                              {overdue ? '⚠ Overdue · ' :
                               dueToday ? '🔔 Due today · ' : '📅 '}
                              {task.due_date}
                            </span>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}

const styles = {
  page: {
    minHeight: '100vh',
    backgroundColor: '#0f0f1a',
  },
  container: {
    maxWidth: '800px',
    margin: '0 auto',
    padding: '2rem 1.5rem',
  },
  header: {
    marginBottom: '1.75rem',
  },
  title: {
    fontSize: '1.75rem',
    fontWeight: '800',
    color: '#f0f0ff',
    margin: '0 0 0.25rem',
  },
  subtitle: {
    color: '#8b8bab',
    fontSize: '0.9rem',
    margin: 0,
  },
  statsRow: {
    display: 'flex',
    gap: '0.75rem',
    marginBottom: '1.5rem',
  },
  statCard: {
    flex: 1,
    backgroundColor: '#1a1a2e',
    borderRadius: '12px',
    padding: '1rem',
    textAlign: 'center',
    border: '1px solid #2a2a45',
  },
  statNum: {
    fontSize: '1.75rem',
    fontWeight: '800',
    color: '#a78bfa',
    margin: '0 0 0.2rem',
  },
  statLabel: {
    fontSize: '0.7rem',
    color: '#8b8bab',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    margin: 0,
  },
  tabs: {
    display: 'flex',
    gap: '0.5rem',
    marginBottom: '1.75rem',
  },
  tab: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    padding: '0.5rem 1rem',
    borderRadius: '8px',
    border: '1px solid #2a2a45',
    backgroundColor: '#1a1a2e',
    color: '#8b8bab',
    fontSize: '0.85rem',
    fontWeight: '500',
    cursor: 'pointer',
  },
  tabActive: {
    background: 'linear-gradient(135deg, #7c6ef0, #5b4fcf)',
    color: '#fff',
    border: '1px solid transparent',
    boxShadow: '0 2px 10px rgba(124,110,240,0.3)',
  },
  tabCount: {
    borderRadius: '999px',
    padding: '0.1rem 0.45rem',
    fontSize: '0.72rem',
    fontWeight: '700',
  },
  boardGroup: {
    marginBottom: '2rem',
  },
  boardGroupHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: '0.75rem',
    padding: '0.75rem 1rem',
    backgroundColor: '#1a1a2e',
    borderRadius: '10px',
    border: '1px solid #2a2a45',
  },
  boardGroupLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.6rem',
  },
  boardAccentDot: {
    width: '10px',
    height: '10px',
    borderRadius: '50%',
    flexShrink: 0,
  },
  boardGroupTitle: {
    fontSize: '0.9rem',
    fontWeight: '700',
    color: '#f0f0ff',
  },
  boardTaskCount: {
    borderRadius: '999px',
    padding: '0.1rem 0.5rem',
    fontSize: '0.72rem',
    fontWeight: '700',
  },
  goToBoard: {
    background: 'none',
    border: 'none',
    fontSize: '0.82rem',
    fontWeight: '600',
    cursor: 'pointer',
  },
  taskList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.6rem',
  },
  taskCard: {
    backgroundColor: '#1a1a2e',
    borderRadius: '10px',
    padding: '1rem 1.25rem',
    border: '1px solid #2a2a45',
    borderLeft: '3px solid #7c6ef0',
  },
  taskTop: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '0.4rem',
    gap: '0.75rem',
  },
  taskTitle: {
    margin: 0,
    fontSize: '0.9rem',
    fontWeight: '600',
    color: '#f0f0ff',
    flex: 1,
  },
  priorityBadge: {
    padding: '0.18rem 0.55rem',
    borderRadius: '999px',
    fontSize: '0.72rem',
    fontWeight: '700',
    textTransform: 'capitalize',
    flexShrink: 0,
    letterSpacing: '0.03em',
  },
  taskDesc: {
    margin: '0 0 0.5rem',
    fontSize: '0.82rem',
    color: '#8b8bab',
    lineHeight: 1.4,
  },
  taskMeta: {
    display: 'flex',
    gap: '1rem',
    alignItems: 'center',
    flexWrap: 'wrap',
    marginTop: '0.5rem',
  },
  columnTag: {
    fontSize: '0.775rem',
    color: '#4a4a6a',
  },
  dueDate: {
    fontSize: '0.775rem',
    fontWeight: '500',
  },
  emptyState: {
    textAlign: 'center',
    padding: '4rem 2rem',
    backgroundColor: '#1a1a2e',
    border: '1px solid #2a2a45',
    borderRadius: '16px',
  },
  emptyIcon: {
    fontSize: '2.5rem',
    marginBottom: '1rem',
  },
  emptyText: {
    color: '#8b8bab',
    fontSize: '0.95rem',
    margin: 0,
  },
}