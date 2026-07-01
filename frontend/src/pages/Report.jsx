import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'
import { getAdminReport, exportReportCSV } from '../api'
import Navbar from '../components/Navbar'
import { IconArrowUp, IconArrowDown } from '../components/icons'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell, PieChart, Pie,
} from 'recharts'

const CHART_COLORS = {
  dark:  { todo: '#64748B', progress: '#F59E0B', done: '#10B981' },
  light: { todo: '#64748B', progress: '#D97706', done: '#059669' },
}

const CHART_UI = {
  dark:  { grid: '#334155', axisText: '#94A3B8', axisTextMuted: '#64748B', tooltipBg: '#1E293B', tooltipBorder: '#334155', tooltipLabel: '#F1F5F9', tooltipItem: '#CBD5E1' },
  light: { grid: '#E2E8F0', axisText: '#475569', axisTextMuted: '#64748B', tooltipBg: '#FFFFFF', tooltipBorder: '#E2E8F0', tooltipLabel: '#0F172A', tooltipItem: '#334155' },
}

export default function Report() {
  const { user } = useAuth()
  const { theme } = useTheme()
  const navigate = useNavigate()
  const [report, setReport] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [exporting, setExporting] = useState(false)
  const [exportError, setExportError] = useState('')
  const [sortField, setSortField] = useState('assigned')
  const [sortDir, setSortDir] = useState('desc')

  const COLORS = CHART_COLORS[theme]
  const ui = CHART_UI[theme]

  useEffect(() => {
    if (user?.role !== 'admin') { navigate('/dashboard'); return }
    getAdminReport()
      .then(data => setReport(data))
      .catch(err => setError(err.response?.data?.detail || 'Failed to load report'))
      .finally(() => setLoading(false))
  }, [user, navigate])

  if (user?.role !== 'admin') return null

  const handleExport = async () => {
    setExporting(true)
    setExportError('')
    try {
      const blob = await exportReportCSV()
      const url  = URL.createObjectURL(blob)
      const a    = document.createElement('a')
      a.href     = url
      a.download = 'progresso_report.csv'
      a.click()
      URL.revokeObjectURL(url)
    } catch { setExportError('Export failed. Please try again.') }
    finally { setExporting(false) }
  }

  const handleSort = (field) => {
    if (sortField === field) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortField(field); setSortDir('desc') }
  }

  if (loading) return (
    <div style={s.page}><Navbar />
      <div style={s.loadingWrap}>
        <div style={s.spinner} />
        <p style={s.loadingText}>Loading report data...</p>
      </div>
    </div>
  )

  if (error) return (
    <div style={s.page}><Navbar />
      <div style={s.container}>
        <div style={s.errorBox}>{error}</div>
      </div>
    </div>
  )

  if (!report) return null

  // Build chart data per board
  const boardChartData = report.boards.map(b => {
    const done   = b.columns.filter(c => c.is_done_col).reduce((a, c) => a + c.task_count, 0)
    const allTasks = b.total_tasks
    const progress = b.columns.filter(c => !c.is_done_col).reduce((a, c) => {
      const name = c.col_name.toLowerCase()
      return name.includes('progress') || name.includes('doing') || name.includes('active') || name.includes('wip')
        ? a + c.task_count : a
    }, 0)
    const todo  = allTasks - done - progress
    return { name: b.board_name.length > 18 ? b.board_name.slice(0, 16) + '…' : b.board_name, todo: Math.max(0, todo), progress, done }
  })

  // Pie chart data (overall)
  const pieDone     = report.total_done
  const pieProgress = report.boards.reduce((acc, b) =>
    acc + b.columns.filter(c => { const n = c.col_name.toLowerCase(); return (n.includes('progress') || n.includes('wip') || n.includes('doing')) }).reduce((a, c) => a + c.task_count, 0), 0)
  const pieTodo     = report.total_tasks - pieDone - pieProgress
  const pieData = [
    { name: 'To Do',       value: Math.max(0, pieTodo),     fill: COLORS.todo     },
    { name: 'In Progress', value: Math.max(0, pieProgress), fill: COLORS.progress },
    { name: 'Done',        value: pieDone,                  fill: COLORS.done     },
  ].filter(d => d.value > 0)

  // Sorted members
  const sortedMembers = [...report.members].sort((a, b) => {
    const va = a[sortField] ?? 0
    const vb = b[sortField] ?? 0
    return sortDir === 'desc' ? vb - va : va - vb
  })

  const SortIcon = ({ field }) => (
    <span style={{ marginLeft: 4, opacity: sortField === field ? 1 : 0.35, display: 'inline-flex', verticalAlign: 'middle' }}>
      {sortField === field && sortDir === 'asc' ? <IconArrowUp size={11} /> : <IconArrowDown size={11} />}
    </span>
  )

  return (
    <div style={s.page}>
      <Navbar />
      <div style={s.container}>

        {/* Page Header */}
        <div style={s.pageHeader}>
          <div>
            <h2 style={s.pageTitle}>Project Report</h2>
            <p style={s.pageSubtitle}>{report.team_name} — Performance overview across all boards</p>
          </div>
          <button style={{ ...s.exportBtn, opacity: exporting ? 0.7 : 1 }} onClick={handleExport} disabled={exporting}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: 6 }}>
              <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
            </svg>
            {exporting ? 'Exporting...' : 'Export to CSV'}
          </button>
        </div>

        {exportError && <div style={s.errorBox}>{exportError}</div>}

        <p style={s.powerbiNote}>
          The exported CSV file can be imported directly into Microsoft Power BI Desktop for advanced analytics and custom dashboards.
        </p>

        {/* Summary Cards */}
        <div style={s.summaryGrid}>
          {[
            { label: 'Total Boards',    value: report.total_boards,            color: 'var(--accent)' },
            { label: 'Team Members',    value: report.total_members,           color: '#8B5CF6' },
            { label: 'Total Tasks',     value: report.total_tasks,             color: 'var(--text-muted)' },
            { label: 'Completed Tasks', value: report.total_done,              color: 'var(--priority-low)' },
            { label: 'Completion Rate', value: `${report.overall_completion_pct}%`, color: 'var(--priority-medium)' },
          ].map(card => (
            <div key={card.label} style={s.summaryCard}>
              <p style={{ ...s.summaryValue, color: card.color }}>{card.value}</p>
              <p style={s.summaryLabel}>{card.label}</p>
            </div>
          ))}
        </div>

        {/* Charts Row */}
        <div style={s.chartsRow}>
          {/* Bar Chart */}
          <div style={{ ...s.chartCard, flex: 2 }}>
            <h3 style={s.sectionTitle}>Task Status by Board</h3>
            <p style={s.sectionSub}>Breakdown of task completion across each project board</p>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={boardChartData} margin={{ top: 8, right: 8, left: -10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={ui.grid} vertical={false} />
                <XAxis dataKey="name" tick={{ fill: ui.axisText, fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: ui.axisTextMuted, fontSize: 10 }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: ui.tooltipBg, border: `1px solid ${ui.tooltipBorder}`, borderRadius: 8, fontSize: 12 }}
                  labelStyle={{ color: ui.tooltipLabel, fontWeight: 700 }}
                  itemStyle={{ color: ui.tooltipItem }}
                />
                <Bar dataKey="todo"     name="To Do"       fill={COLORS.todo}     radius={[3,3,0,0]} maxBarSize={36} />
                <Bar dataKey="progress" name="In Progress" fill={COLORS.progress} radius={[3,3,0,0]} maxBarSize={36} />
                <Bar dataKey="done"     name="Done"        fill={COLORS.done}     radius={[3,3,0,0]} maxBarSize={36} />
              </BarChart>
            </ResponsiveContainer>
            <div style={s.chartLegend}>
              {[['To Do', COLORS.todo], ['In Progress', COLORS.progress], ['Done', COLORS.done]].map(([label, color]) => (
                <div key={label} style={s.legendItem}>
                  <div style={{ ...s.legendDot, backgroundColor: color }} />
                  <span style={s.legendText}>{label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Pie Chart */}
          {pieData.length > 0 && (
            <div style={{ ...s.chartCard, flex: 1 }}>
              <h3 style={s.sectionTitle}>Overall Distribution</h3>
              <p style={s.sectionSub}>Task status across all boards</p>
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" innerRadius={55} outerRadius={85} dataKey="value" paddingAngle={3}>
                    {pieData.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
                  </Pie>
                  <Tooltip
                    contentStyle={{ backgroundColor: ui.tooltipBg, border: `1px solid ${ui.tooltipBorder}`, borderRadius: 8, fontSize: 12 }}
                    itemStyle={{ color: ui.tooltipItem }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div style={{ ...s.chartLegend, justifyContent: 'center' }}>
                {pieData.map(d => (
                  <div key={d.name} style={s.legendItem}>
                    <div style={{ ...s.legendDot, backgroundColor: d.fill }} />
                    <span style={s.legendText}>{d.name} ({d.value})</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Board Detail Cards */}
        <div style={s.sectionHeader}>
          <h3 style={s.sectionTitle}>Board Breakdown</h3>
          <p style={s.sectionSub}>Progress overview for each project board</p>
        </div>
        <div style={s.boardGrid}>
          {report.boards.map(board => (
            <div key={board.board_id} style={s.boardCard}>
              <div style={s.boardCardTop}>
                <span style={s.boardCardName}>{board.board_name}</span>
                <span style={{
                  ...s.pctBadge,
                  backgroundColor: board.completion_pct >= 75 ? 'var(--priority-low-soft)' : board.completion_pct >= 35 ? 'var(--priority-medium-soft)' : 'var(--bg-raised)',
                  color: board.completion_pct >= 75 ? 'var(--priority-low)' : board.completion_pct >= 35 ? 'var(--priority-medium)' : 'var(--text-secondary)',
                  border: `1px solid ${board.completion_pct >= 75 ? 'var(--priority-low-border)' : board.completion_pct >= 35 ? 'var(--priority-medium-border)' : 'var(--border)'}`,
                }}>
                  {board.completion_pct}% complete
                </span>
              </div>
              <div style={s.progressBar}>
                <div style={{
                  ...s.progressFill,
                  width: `${board.completion_pct}%`,
                  backgroundColor: board.completion_pct >= 75 ? 'var(--priority-low)' : board.completion_pct >= 35 ? 'var(--priority-medium)' : 'var(--text-muted)',
                }} />
              </div>
              <div style={s.boardCardStats}>
                <span style={s.boardStat}>{board.total_tasks} tasks</span>
                <span style={s.boardStat}>{board.done_tasks} done</span>
                <span style={s.boardStat}>{board.columns.length} columns</span>
              </div>
              <div style={s.columnChips}>
                {board.columns.map(col => (
                  <span key={col.column_id} style={s.colChip}>
                    {col.col_name}: <strong style={{ color: 'var(--text-primary)' }}>{col.task_count}</strong>
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Member Contribution Table */}
        <div style={s.sectionHeader}>
          <h3 style={s.sectionTitle}>Member Contributions</h3>
          <p style={s.sectionSub}>Task breakdown per team member — click column headers to sort</p>
        </div>
        <div style={s.tableWrapper}>
          <table style={s.table}>
            <thead>
              <tr style={s.thead}>
                <th style={s.th}>Member</th>
                <th style={s.th}>Role</th>
                {[
                  { key: 'assigned',    label: 'Assigned' },
                  { key: 'done',        label: 'Done'     },
                  { key: 'in_progress', label: 'In Progress' },
                  { key: 'todo',        label: 'To Do'    },
                ].map(col => (
                  <th
                    key={col.key}
                    style={{ ...s.th, cursor: 'pointer', userSelect: 'none' }}
                    onClick={() => handleSort(col.key)}
                  >
                    {col.label}<SortIcon field={col.key} />
                  </th>
                ))}
                <th style={s.th}>Completion</th>
              </tr>
            </thead>
            <tbody>
              {sortedMembers.map((member, idx) => {
                const pct = member.assigned > 0 ? Math.round((member.done / member.assigned) * 100) : 0
                return (
                  <tr
                    key={member.user_id}
                    style={{ ...s.trow, backgroundColor: idx % 2 === 0 ? 'var(--bg-surface)' : 'var(--bg-raised)' }}
                  >
                    <td style={s.td}>
                      <div style={s.memberCell}>
                        <div style={s.memberAvatar}>{member.username.charAt(0).toUpperCase()}</div>
                        <span style={s.memberName}>{member.username}</span>
                      </div>
                    </td>
                    <td style={s.td}>
                      <span style={{ ...s.roleBadge, ...(member.role === 'admin' ? s.roleBadgeAdmin : {}) }}>
                        {member.role}
                      </span>
                    </td>
                    <td style={{ ...s.td, textAlign: 'center', fontWeight: '700', color: 'var(--text-primary)' }}>{member.assigned}</td>
                    <td style={{ ...s.td, textAlign: 'center', fontWeight: '700', color: 'var(--priority-low)' }}>{member.done}</td>
                    <td style={{ ...s.td, textAlign: 'center', fontWeight: '700', color: 'var(--priority-medium)' }}>{member.in_progress}</td>
                    <td style={{ ...s.td, textAlign: 'center', fontWeight: '700', color: 'var(--text-muted)' }}>{member.todo}</td>
                    <td style={{ ...s.td, textAlign: 'center' }}>
                      <div style={s.pctCell}>
                        <div style={s.miniBar}>
                          <div style={{ ...s.miniBarFill, width: `${pct}%`, backgroundColor: pct >= 75 ? 'var(--priority-low)' : pct >= 35 ? 'var(--priority-medium)' : 'var(--text-muted)' }} />
                        </div>
                        <span style={{ fontSize: '0.78rem', fontWeight: '700', color: 'var(--text-secondary)', minWidth: '32px' }}>{pct}%</span>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

const s = {
  page: { minHeight: '100vh', backgroundColor: 'var(--bg-base)' },
  container: { maxWidth: '1200px', margin: '0 auto', padding: '2rem 1.5rem' },
  loadingWrap: { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', gap: '1rem' },
  spinner: { width: '28px', height: '28px', border: '3px solid var(--border)', borderTop: '3px solid var(--accent)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' },
  loadingText: { color: 'var(--text-muted)', fontSize: '0.9rem' },
  errorBox: { backgroundColor: 'var(--danger-soft)', border: '1px solid var(--priority-high-border)', color: 'var(--danger)', padding: '1rem', borderRadius: '10px', marginBottom: '1rem' },
  pageHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem', flexWrap: 'wrap', gap: '1rem' },
  pageTitle:   { fontSize: '1.5rem', fontWeight: '700', color: 'var(--text-primary)', margin: '0 0 0.2rem', letterSpacing: '-0.02em' },
  pageSubtitle:{ fontSize: '0.875rem', color: 'var(--text-muted)', margin: 0 },
  exportBtn: {
    display: 'flex', alignItems: 'center',
    padding: '0.6rem 1.1rem', background: 'linear-gradient(135deg, var(--avatar-grad-start), var(--avatar-grad-end))',
    color: '#fff', border: 'none', borderRadius: '8px', fontSize: '0.85rem',
    fontWeight: '600', cursor: 'pointer',
  },
  powerbiNote: {
    backgroundColor: 'var(--accent-soft)', border: '1px solid var(--accent-border)',
    borderRadius: '8px', padding: '0.7rem 1rem', marginBottom: '1.75rem',
    fontSize: '0.8rem', color: 'var(--accent)', lineHeight: 1.5,
  },
  summaryGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(160px,1fr))', gap: '0.75rem', marginBottom: '1.75rem' },
  summaryCard: { backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: '10px', padding: '1rem 1.1rem' },
  summaryValue:{ fontSize: '1.75rem', fontWeight: '800', margin: '0 0 0.15rem', letterSpacing: '-0.02em' },
  summaryLabel:{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em', margin: 0 },
  chartsRow:   { display: 'flex', gap: '1rem', marginBottom: '1.75rem', flexWrap: 'wrap' },
  chartCard:   { backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: '12px', padding: '1.25rem', minWidth: 0 },
  sectionHeader: { marginBottom: '1rem' },
  sectionTitle:  { fontSize: '0.95rem', fontWeight: '700', color: 'var(--text-secondary)', margin: '0 0 0.2rem' },
  sectionSub:    { fontSize: '0.8rem', color: 'var(--text-muted)', margin: 0 },
  chartLegend: { display: 'flex', gap: '1rem', flexWrap: 'wrap', marginTop: '0.85rem' },
  legendItem:  { display: 'flex', alignItems: 'center', gap: '0.4rem' },
  legendDot:   { width: '9px', height: '9px', borderRadius: '50%', flexShrink: 0 },
  legendText:  { fontSize: '0.75rem', color: 'var(--text-secondary)' },
  boardGrid:   { display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(260px,1fr))', gap: '0.85rem', marginBottom: '1.75rem' },
  boardCard:   { backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: '10px', padding: '1rem' },
  boardCardTop:{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.65rem', gap: '0.5rem' },
  boardCardName:{ fontSize: '0.875rem', fontWeight: '700', color: 'var(--text-primary)' },
  pctBadge:    { fontSize: '0.7rem', fontWeight: '700', borderRadius: '999px', padding: '0.15rem 0.55rem', flexShrink: 0 },
  progressBar: { height: '4px', backgroundColor: 'var(--bg-raised)', borderRadius: '999px', marginBottom: '0.7rem' },
  progressFill:{ height: '100%', borderRadius: '999px', transition: 'width 0.3s' },
  boardCardStats:{ display: 'flex', gap: '0.85rem', marginBottom: '0.6rem' },
  boardStat:   { fontSize: '0.72rem', color: 'var(--text-muted)' },
  columnChips: { display: 'flex', flexWrap: 'wrap', gap: '0.35rem' },
  colChip:     { fontSize: '0.68rem', color: 'var(--text-muted)', backgroundColor: 'var(--bg-raised)', border: '1px solid var(--border)', borderRadius: '999px', padding: '0.12rem 0.5rem' },
  tableWrapper:{ overflowX: 'auto', marginBottom: '2rem' },
  table:       { width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' },
  thead:       { backgroundColor: 'var(--bg-raised)' },
  th: {
    padding: '0.75rem 1rem', textAlign: 'left',
    fontSize: '0.72rem', fontWeight: '700', color: 'var(--text-muted)',
    textTransform: 'uppercase', letterSpacing: '0.05em',
    borderBottom: '1px solid var(--border)', whiteSpace: 'nowrap',
  },
  trow:        { transition: 'background 0.1s' },
  td:          { padding: '0.75rem 1rem', borderBottom: '1px solid var(--bg-surface)', color: 'var(--text-secondary)', whiteSpace: 'nowrap' },
  memberCell:  { display: 'flex', alignItems: 'center', gap: '0.6rem' },
  memberAvatar:{
    width: '28px', height: '28px', borderRadius: '50%',
    background: 'linear-gradient(135deg, var(--avatar-grad-start), var(--avatar-grad-end))', color: '#fff',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: '0.72rem', fontWeight: '700', flexShrink: 0,
  },
  memberName:  { fontWeight: '600', color: 'var(--text-primary)' },
  roleBadge:   { backgroundColor: 'var(--bg-raised)', color: 'var(--text-secondary)', border: '1px solid var(--border)', borderRadius: '5px', padding: '0.12rem 0.45rem', fontSize: '0.7rem', fontWeight: '600', textTransform: 'capitalize' },
  roleBadgeAdmin: { backgroundColor: 'var(--accent-soft)', color: 'var(--accent)', border: '1px solid var(--accent-border)' },
  pctCell:     { display: 'flex', alignItems: 'center', gap: '0.5rem' },
  miniBar:     { flex: 1, height: '5px', backgroundColor: 'var(--bg-raised)', borderRadius: '999px', overflow: 'hidden' },
  miniBarFill: { height: '100%', borderRadius: '999px' },
}
