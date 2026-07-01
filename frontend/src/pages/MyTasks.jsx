import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { getMyTasks } from '../api'
import Navbar from '../components/Navbar'

const priorityColors = {
  low:    { bg: 'rgba(16,185,129,0.1)',  color: '#34D399', border: 'rgba(16,185,129,0.25)' },
  medium: { bg: 'rgba(245,158,11,0.1)',  color: '#FBBF24', border: 'rgba(245,158,11,0.25)' },
  high:   { bg: 'rgba(239,68,68,0.1)',   color: '#F87171', border: 'rgba(239,68,68,0.25)' },
}
const boardColors = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4']

function isOverdue(due_date)  { if (!due_date) return false; return new Date(due_date) < new Date(new Date().toDateString()) }
function isDueToday(due_date) { if (!due_date) return false; return new Date(due_date).toDateString() === new Date().toDateString() }

export default function MyTasks() {
  const [tasks, setTasks] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  const navigate = useNavigate()

  useEffect(() => { getMyTasks().then(setTasks).finally(() => setLoading(false)) }, [])

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

        {/* Stats */}
        <div style={s.statsRow}>
          {[
            { label: 'Total',    value: totalCount,               color: '#3B82F6' },
            { label: 'Due Today',value: todayCount,               color: '#F59E0B' },
            { label: 'Overdue',  value: overdueCount,             color: '#EF4444' },
            { label: 'On Track', value: totalCount - overdueCount, color: '#10B981' },
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
                backgroundColor: filter === t.key ? 'rgba(255,255,255,0.2)' : '#263348',
                color: filter === t.key ? '#fff' : '#64748B',
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
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#475569" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginBottom: '1rem' }}>
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
                          borderLeft: overdue ? '3px solid #EF4444' : dueToday ? '3px solid #F59E0B' : `3px solid ${accent}`,
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
                            <span style={{ ...s.dueDate, color: overdue ? '#F87171' : dueToday ? '#FBBF24' : '#475569' }}>
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
  page: { minHeight: '100vh', backgroundColor: '#0F172A' },
  container: { maxWidth: '820px', margin: '0 auto', padding: '2rem 1.5rem' },
  header: { marginBottom: '1.6rem' },
  title: { fontSize: '1.5rem', fontWeight: '700', color: '#F1F5F9', margin: '0 0 0.2rem', letterSpacing: '-0.02em' },
  subtitle: { color: '#64748B', fontSize: '0.875rem', margin: 0 },
  statsRow: { display: 'flex', gap: '0.65rem', marginBottom: '1.4rem' },
  statCard: { flex: 1, backgroundColor: '#1E293B', borderRadius: '10px', padding: '0.9rem', textAlign: 'center', border: '1px solid #334155' },
  statNum:  { fontSize: '1.6rem', fontWeight: '700', margin: '0 0 0.15rem' },
  statLabel:{ fontSize: '0.7rem', color: '#64748B', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em', margin: 0 },
  tabs: { display: 'flex', gap: '0.4rem', marginBottom: '1.6rem' },
  tab: {
    display: 'flex', alignItems: 'center', gap: '0.45rem', padding: '0.45rem 0.9rem',
    borderRadius: '7px', border: '1px solid #334155', backgroundColor: '#1E293B',
    color: '#94A3B8', fontSize: '0.82rem', fontWeight: '500', cursor: 'pointer',
  },
  tabActive: { background: 'linear-gradient(135deg,#3B82F6,#1D4ED8)', color: '#fff', border: '1px solid transparent' },
  tabCount: { borderRadius: '999px', padding: '0.1rem 0.42rem', fontSize: '0.7rem', fontWeight: '700' },
  boardGroup: { marginBottom: '1.75rem' },
  boardGroupHeader: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    marginBottom: '0.65rem', padding: '0.65rem 0.9rem',
    backgroundColor: '#1E293B', borderRadius: '9px', border: '1px solid #334155',
  },
  boardGroupLeft: { display: 'flex', alignItems: 'center', gap: '0.55rem' },
  boardAccentDot: { width: '9px', height: '9px', borderRadius: '50%', flexShrink: 0 },
  boardGroupTitle: { fontSize: '0.875rem', fontWeight: '700', color: '#F1F5F9' },
  boardTaskCount: { borderRadius: '999px', padding: '0.1rem 0.45rem', fontSize: '0.7rem', fontWeight: '700' },
  goToBoard: { background: 'none', border: 'none', fontSize: '0.78rem', fontWeight: '600', cursor: 'pointer' },
  taskList: { display: 'flex', flexDirection: 'column', gap: '0.5rem' },
  taskCard: {
    backgroundColor: '#1E293B', borderRadius: '9px', padding: '0.9rem 1.1rem',
    border: '1px solid #334155',
  },
  taskTop: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.35rem', gap: '0.65rem' },
  taskTitle: { margin: 0, fontSize: '0.875rem', fontWeight: '600', color: '#F1F5F9', flex: 1 },
  priorityBadge: { padding: '0.15rem 0.5rem', borderRadius: '999px', fontSize: '0.68rem', fontWeight: '700', textTransform: 'capitalize', flexShrink: 0 },
  taskDesc: { margin: '0 0 0.45rem', fontSize: '0.8rem', color: '#94A3B8', lineHeight: 1.4 },
  taskMeta: { display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap', marginTop: '0.4rem' },
  columnTag: { fontSize: '0.75rem', color: '#475569', backgroundColor: '#263348', border: '1px solid #334155', borderRadius: '999px', padding: '0.12rem 0.5rem' },
  dueDate: { fontSize: '0.75rem', fontWeight: '500' },
  emptyState: { textAlign: 'center', padding: '4rem 2rem', backgroundColor: '#1E293B', border: '1px solid #334155', borderRadius: '14px' },
  emptyText: { color: '#64748B', fontSize: '0.9rem', margin: 0 },
}