import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { getMyTasks } from '../api'
import Navbar from '../components/Navbar'

const priorityColors = {
  low:    { bg: 'var(--priority-low-soft)',    color: 'var(--priority-low)',    border: 'var(--priority-low-border)' },
  medium: { bg: 'var(--priority-medium-soft)', color: 'var(--priority-medium)', border: 'var(--priority-medium-border)' },
  high:   { bg: 'var(--priority-high-soft)',   color: 'var(--priority-high)',   border: 'var(--priority-high-border)' },
}
const boardColors = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4']

function startOfToday() {
  const d = new Date()
  d.setHours(0, 0, 0, 0)
  return d
}

function isOverdue(due_date) {
  if (!due_date) return false
  const d = new Date(due_date)
  d.setHours(0, 0, 0, 0)
  return d < startOfToday()
}

function isDueToday(due_date) {
  if (!due_date) return false
  const d = new Date(due_date)
  d.setHours(0, 0, 0, 0)
  return d.getTime() === startOfToday().getTime()
}

export default function MyTasks() {
  const [tasks, setTasks] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [filter, setFilter] = useState('all')
  const navigate = useNavigate()

  useEffect(() => {
    getMyTasks()
      .then(setTasks)
      .catch(() => setError('Failed to load your tasks'))
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
      if (filter === 'today')   return isDueToday(t.due_date)
      if (filter === 'overdue') return isOverdue(t.due_date)
      return true
    })
    if (filteredTasks.length > 0) acc[boardName] = { board_id, tasks: filteredTasks }
    return acc
  }, {})

  const totalCount   = tasks.length
  const todayCount   = tasks.filter(t => isDueToday(t.due_date)).length
  const overdueCount = tasks.filter(t => isOverdue(t.due_date)).length

  const tabs = [
    { key: 'all',     label: 'All Tasks',  count: totalCount   },
    { key: 'today',   label: 'Due Today',  count: todayCount   },
    { key: 'overdue', label: 'Overdue',    count: overdueCount },
  ]

  return (
    <div style={s.page}>
      <Navbar />
      <div style={s.container}>

        {/* Header */}
        <div style={s.header}>
          <h2 style={s.title}>My Tasks</h2>
          <p style={s.subtitle}>All tasks assigned to you across every project board</p>
        </div>

        {error && <div style={s.errorBox}>{error}</div>}

        {/* Stats */}
        <div style={s.statsRow}>
          {[
            { label: 'Total',    value: totalCount,               color: 'var(--accent)' },
            { label: 'Due Today',value: todayCount,               color: 'var(--priority-medium)' },
            { label: 'Overdue',  value: overdueCount,             color: 'var(--priority-high)' },
            { label: 'On Track', value: totalCount - overdueCount, color: 'var(--priority-low)' },
          ].map(stat => (
            <div key={stat.label} style={s.statCard}>
              <p style={{ ...s.statNum, color: stat.color }}>{stat.value}</p>
              <p style={s.statLabel}>{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Filter Tabs */}
        <div style={s.tabs}>
          {tabs.map(t => (
            <button
              key={t.key}
              onClick={() => setFilter(t.key)}
              style={{ ...s.tab, ...(filter === t.key ? s.tabActive : {}) }}
            >
              {t.label}
              <span style={{
                ...s.tabCount,
                backgroundColor: filter === t.key ? 'rgba(255,255,255,0.2)' : 'var(--bg-raised)',
                color: filter === t.key ? '#fff' : 'var(--text-muted)',
              }}>
                {t.count}
              </span>
            </button>
          ))}
        </div>

        {/* Content */}
        {loading ? (
          <div style={s.emptyState}><p style={s.emptyText}>Loading your tasks...</p></div>
        ) : Object.keys(filtered).length === 0 ? (
          <div style={s.emptyState}>
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginBottom: '1rem' }}>
              <polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"/>
            </svg>
            <p style={s.emptyText}>
              {filter === 'all'     ? 'No tasks assigned to you yet.' :
               filter === 'today'   ? 'No tasks due today.'            :
               'No overdue tasks.'}
            </p>
          </div>
        ) : (
          Object.entries(filtered).map(([boardName, { board_id, tasks }], boardIndex) => {
            const accent = boardColors[boardIndex % boardColors.length]
            return (
              <div key={boardName} style={s.boardGroup}>
                <div style={s.boardGroupHeader}>
                  <div style={s.boardGroupLeft}>
                    <div style={{ ...s.boardAccentDot, backgroundColor: accent }} />
                    <span style={s.boardGroupTitle}>{boardName}</span>
                    <span style={{ ...s.boardTaskCount, backgroundColor: `${accent}18`, color: accent }}>{tasks.length}</span>
                  </div>
                  <button style={{ ...s.goToBoard, color: accent }} onClick={() => navigate(`/board/${board_id}`)}>
                    Open Board
                  </button>
                </div>

                <div style={s.taskList}>
                  {tasks.map(task => {
                    const pc       = priorityColors[task.priority] || priorityColors.medium
                    const overdue  = isOverdue(task.due_date)
                    const dueToday = isDueToday(task.due_date)
                    return (
                      <div
                        key={task.task_id}
                        style={{
                          ...s.taskCard,
                          borderLeft: overdue ? '3px solid var(--priority-high)' : dueToday ? '3px solid var(--priority-medium)' : `3px solid ${accent}`,
                        }}
                      >
                        <div style={s.taskTop}>
                          <p style={s.taskTitle}>{task.title}</p>
                          <span style={{ ...s.priorityBadge, backgroundColor: pc.bg, color: pc.color, border: `1px solid ${pc.border}` }}>
                            {task.priority}
                          </span>
                        </div>
                        {task.description && <p style={s.taskDesc}>{task.description}</p>}
                        <div style={s.taskMeta}>
                          <span style={s.columnTag}>{task.column_name}</span>
                          {task.due_date && (
                            <span style={{ ...s.dueDate, color: overdue ? 'var(--priority-high)' : dueToday ? 'var(--priority-medium)' : 'var(--text-muted)' }}>
                              {overdue ? 'Overdue · ' : dueToday ? 'Due Today · ' : 'Due: '}{task.due_date}
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

const s = {
  page: { minHeight: '100vh', backgroundColor: 'var(--bg-base)' },
  container: { maxWidth: '820px', margin: '0 auto', padding: '2rem 1.5rem' },
  header: { marginBottom: '1.6rem' },
  title: { fontSize: '1.5rem', fontWeight: '700', color: 'var(--text-primary)', margin: '0 0 0.2rem', letterSpacing: '-0.02em' },
  subtitle: { color: 'var(--text-muted)', fontSize: '0.875rem', margin: 0 },
  errorBox: {
    backgroundColor: 'var(--danger-soft)', border: '1px solid var(--priority-high-border)',
    color: 'var(--danger)', padding: '0.7rem 1rem', borderRadius: '8px',
    marginBottom: '1.2rem', fontSize: '0.85rem',
  },
  statsRow: { display: 'flex', gap: '0.65rem', marginBottom: '1.4rem' },
  statCard: { flex: 1, backgroundColor: 'var(--bg-surface)', borderRadius: '10px', padding: '0.9rem', textAlign: 'center', border: '1px solid var(--border)' },
  statNum:  { fontSize: '1.6rem', fontWeight: '700', margin: '0 0 0.15rem' },
  statLabel:{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em', margin: 0 },
  tabs: { display: 'flex', gap: '0.4rem', marginBottom: '1.6rem' },
  tab: {
    display: 'flex', alignItems: 'center', gap: '0.45rem', padding: '0.45rem 0.9rem',
    borderRadius: '7px', border: '1px solid var(--border)', backgroundColor: 'var(--bg-surface)',
    color: 'var(--text-secondary)', fontSize: '0.82rem', fontWeight: '500', cursor: 'pointer',
  },
  tabActive: { background: 'linear-gradient(135deg, var(--avatar-grad-start), var(--avatar-grad-end))', color: '#fff', border: '1px solid transparent' },
  tabCount: { borderRadius: '999px', padding: '0.1rem 0.42rem', fontSize: '0.7rem', fontWeight: '700' },
  boardGroup: { marginBottom: '1.75rem' },
  boardGroupHeader: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    marginBottom: '0.65rem', padding: '0.65rem 0.9rem',
    backgroundColor: 'var(--bg-surface)', borderRadius: '9px', border: '1px solid var(--border)',
  },
  boardGroupLeft: { display: 'flex', alignItems: 'center', gap: '0.55rem' },
  boardAccentDot: { width: '9px', height: '9px', borderRadius: '50%', flexShrink: 0 },
  boardGroupTitle: { fontSize: '0.875rem', fontWeight: '700', color: 'var(--text-primary)' },
  boardTaskCount: { borderRadius: '999px', padding: '0.1rem 0.45rem', fontSize: '0.7rem', fontWeight: '700' },
  goToBoard: { background: 'none', border: 'none', fontSize: '0.78rem', fontWeight: '600', cursor: 'pointer' },
  taskList: { display: 'flex', flexDirection: 'column', gap: '0.5rem' },
  taskCard: {
    backgroundColor: 'var(--bg-surface)', borderRadius: '9px', padding: '0.9rem 1.1rem',
    border: '1px solid var(--border)',
  },
  taskTop: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.35rem', gap: '0.65rem' },
  taskTitle: { margin: 0, fontSize: '0.875rem', fontWeight: '600', color: 'var(--text-primary)', flex: 1 },
  priorityBadge: { padding: '0.15rem 0.5rem', borderRadius: '999px', fontSize: '0.68rem', fontWeight: '700', textTransform: 'capitalize', flexShrink: 0 },
  taskDesc: { margin: '0 0 0.45rem', fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.4 },
  taskMeta: { display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap', marginTop: '0.4rem' },
  columnTag: { fontSize: '0.75rem', color: 'var(--text-muted)', backgroundColor: 'var(--bg-raised)', border: '1px solid var(--border)', borderRadius: '999px', padding: '0.12rem 0.5rem' },
  dueDate: { fontSize: '0.75rem', fontWeight: '500' },
  emptyState: { textAlign: 'center', padding: '4rem 2rem', backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: '14px' },
  emptyText: { color: 'var(--text-muted)', fontSize: '0.9rem', margin: 0 },
}
